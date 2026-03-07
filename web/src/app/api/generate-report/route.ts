/**
 * API Route: POST /api/generate-report
 *
 * Server-side report generation pipeline. Replaces the client-side
 * orchestration that was failing when users closed their browser tab.
 *
 * Pipeline:
 * 1. Generate tasks via AI (Claude)
 * 2. Generate PDF (jsPDF + Vercel Blob upload)
 * 3. Send email with PDF attachment (Resend)
 * 4. Update Close CRM with report URL
 *
 * The client fires this with keepalive:true and navigates away immediately.
 * The server-side function runs to completion (up to maxDuration).
 *
 * Every pipeline run sends a Slack notification on success or failure
 * so the team has real-time visibility into report delivery.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { UnifiedLeadData, TaskGenerationResult, TasksByCoreFour } from '@/types';
import { generateTasks } from '@/lib/ai/task-generator';
import { validateReport } from '@/lib/ai/report-validator';
import { fixReportIssues, ensureCoreEATasks, padThinAreas } from '@/lib/ai/report-fixer';
import { mapRevenueTier } from '@/lib/ai/lead-brief';
import { generatePDFV2 } from '@/lib/pdf/generator-v2';
import { generateSafeFilename } from '@/lib/pdf/s3Service';
import { put } from '@vercel/blob';
import { Resend } from 'resend';
import { generateEmailHtml } from '@/lib/email/template';
import { sendCriticalAlert, sendSlackAlert } from '@/lib/alerts/critical-alert';
import { getTaskHoursByRevenue } from '@/lib/roi-calculator';
import { addLeadNote, updateLeadFields, CLOSE_FIELDS } from '@/lib/close/client';

export const maxDuration = 180;

const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[API:generate-report:INFO] ${message}`, context || '');
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[API:generate-report:ERROR] ${message}`, context || '');
  },
};

interface GenerateReportRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  revenue: string;
  painPoints: string;
  leadId?: string;
}

/** Tracks what happened at each pipeline step */
interface PipelineResult {
  success: boolean;
  email: string;
  leadId?: string;
  failedStep?: string;
  error?: string;
  tasksGenerated: boolean;
  pdfGenerated: boolean;
  blobUploaded: boolean;
  emailSent: boolean;
  crmUpdated: boolean;
  blobUrl?: string;
  durationMs: number;
}

export async function POST(request: NextRequest) {
  let body: GenerateReportRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const { email, firstName, lastName, phone, revenue, painPoints, leadId } = body;

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email is required' },
      { status: 400 }
    );
  }

  log.info('Report generation started', { email, leadId });

  // Run pipeline and await completion. The client fires this with keepalive:true
  // and navigates away, so they don't wait for this response. But the server
  // must await to prevent early termination.
  const result = await runPipeline({ email, firstName, lastName, phone, revenue, painPoints, leadId });

  // Send Slack notification for every pipeline run (success or failure)
  // Must await so Vercel doesn't kill the function before the webhook completes
  await notifyPipelineResult(result);

  return NextResponse.json({
    success: result.success,
    queued: true,
    failedStep: result.failedStep,
  });
}

async function notifyPipelineResult(result: PipelineResult) {
  // TODO: After monitoring period, set REPORT_SLACK_FAILURES_ONLY=true in Vercel env
  // to stop success notifications and only alert on failures.
  const failuresOnly = process.env.REPORT_SLACK_FAILURES_ONLY === 'true';

  const steps = [
    result.tasksGenerated ? ':white_check_mark: Tasks' : ':x: Tasks',
    result.pdfGenerated ? ':white_check_mark: PDF' : ':x: PDF',
    result.blobUploaded ? ':white_check_mark: Blob' : ':warning: Blob',
    result.emailSent ? ':white_check_mark: Email' : ':x: Email',
    result.crmUpdated ? ':white_check_mark: CRM' : ':warning: CRM',
  ];

  const stepsLine = `\n> *Steps:* ${steps.join(' | ')}\n> *Duration:* ${(result.durationMs / 1000).toFixed(1)}s`;

  if (result.success) {
    if (failuresOnly) return;

    void sendSlackAlert('Report Delivered', {
      emoji: ':white_check_mark:',
      error: `Report generated and emailed successfully.${stepsLine}`,
      endpoint: '/api/generate-report',
      userEmail: result.email,
      leadId: result.leadId,
      timestamp: new Date().toISOString(),
    });
  } else {
    const resendCmd = result.leadId
      ? `curl -X POST https://report.assistantlaunch.com/api/resend-report -H "Content-Type: application/json" -d '{"leadId":"${result.leadId}"}'`
      : `curl -X POST https://report.assistantlaunch.com/api/generate-report -H "Content-Type: application/json" -d '{"email":"${result.email}","firstName":"","lastName":"","phone":"","revenue":"","painPoints":""}'`;

    const fixInstructions = result.leadId
      ? `\n> *To re-send:* Open Close CRM → find lead → or run:\n> \`${resendCmd}\``
      : `\n> *To retry:* No leadId — re-run full pipeline:\n> \`${resendCmd}\``;

    void sendSlackAlert(`Report FAILED at ${result.failedStep}`, {
      emoji: ':red_circle:',
      error: `${result.error}${stepsLine}${fixInstructions}`,
      endpoint: '/api/generate-report',
      userEmail: result.email,
      leadId: result.leadId,
      timestamp: new Date().toISOString(),
    });
  }
}

async function runPipeline(data: GenerateReportRequest): Promise<PipelineResult> {
  const startTime = Date.now();
  const { email, firstName, lastName, phone, revenue, painPoints, leadId } = data;
  const taskHours = getTaskHoursByRevenue(revenue || '$500k-$1M');

  const status: PipelineResult = {
    success: false,
    email,
    leadId,
    tasksGenerated: false,
    pdfGenerated: false,
    blobUploaded: false,
    emailSent: false,
    crmUpdated: false,
    durationMs: 0,
  };

  // Step 1: Generate tasks via AI
  log.info('Step 1: Generating tasks', { email });

  const leadData: UnifiedLeadData = {
    email,
    firstName,
    lastName,
    phone,
    revenue,
    painPoints,
    leadType: 'main',
    timestamp: new Date().toISOString(),
  };

  let result: TaskGenerationResult;
  try {
    result = await generateTasks(leadData);
  } catch (err) {
    const error = err as Error;
    log.error('Task generation failed', { email, error: error.message });
    void sendCriticalAlert('Server-Side Task Generation Failed', {
      error: error.message,
      endpoint: '/api/generate-report',
      userEmail: email,
      leadId,
    });
    status.failedStep = 'Task Generation';
    status.error = error.message;
    status.durationMs = Date.now() - startTime;
    return status;
  }

  // Validate and auto-fix
  const revenueTier = mapRevenueTier(revenue);
  let validationResult = validateReport(result);

  if (!validationResult.isValid && validationResult.errors.length > 0) {
    result = fixReportIssues(result, validationResult.errors, revenueTier);
    validationResult = validateReport(result);
  }

  result = ensureCoreEATasks(result);
  result = padThinAreas(result, revenueTier);
  status.tasksGenerated = true;

  log.info('Step 1 complete: Tasks generated', {
    email,
    totalTasks: result.total_task_count,
  });

  // Step 2: Generate PDF
  log.info('Step 2: Generating PDF', { email });

  const coreFourTasks: TasksByCoreFour = result.tasks;

  const pdfLeadData: UnifiedLeadData = {
    leadType: 'main',
    timestamp: new Date().toISOString(),
    firstName,
    lastName,
    email,
    phone,
  };

  const pdfResult = await generatePDFV2(
    {
      tasks: coreFourTasks,
      ea_task_percent: result.ea_task_percent,
      ea_task_count: result.ea_task_count,
      total_task_count: result.total_task_count,
      analysis_summary: result.analysis_summary,
      summary: result.summary,
    },
    pdfLeadData,
    { includeMetadata: true, taskHours, revenueRange: revenue }
  );

  if (!pdfResult.success || !pdfResult.base64) {
    const errorMsg = pdfResult.error || 'PDF generation failed';
    log.error('PDF generation failed', { email, error: errorMsg });
    void sendCriticalAlert('Server-Side PDF Generation Failed', {
      error: errorMsg,
      endpoint: '/api/generate-report',
      userEmail: email,
      leadId,
    });
    status.failedStep = 'PDF Generation';
    status.error = errorMsg;
    status.durationMs = Date.now() - startTime;
    return status;
  }

  status.pdfGenerated = true;

  // Upload to Vercel Blob
  let blobUrl: string | null = null;
  const filename = generateSafeFilename(firstName || 'Report', lastName || '');

  try {
    const pdfBuffer = Buffer.from(pdfResult.base64, 'base64');
    const blob = await put(`reports/${filename}`, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });
    blobUrl = blob.url;
    status.blobUploaded = true;
    status.blobUrl = blobUrl;
    log.info('Step 2 complete: PDF uploaded', { email, blobUrl });
  } catch (blobErr) {
    const error = blobErr as Error;
    log.error('Blob upload failed (non-critical)', { email, error: error.message });
    // Non-critical: PDF will still be sent via email attachment
  }

  // Step 3: Send email
  log.info('Step 3: Sending email', { email });

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const userData = { firstName, lastName, email, phone };
    const htmlContent = generateEmailHtml(firstName, userData, blobUrl || undefined);
    const emailSubject = `${firstName || 'Hi'}, Your Time Freedom Report is Ready`;

    const { error } = await resend.emails.send({
      from: 'Ryan at Assistant Launch <ryan@assistantlaunch.com>',
      to: email,
      subject: emailSubject,
      html: htmlContent,
      attachments: pdfResult.base64
        ? [
            {
              filename: `EA-Time-Freedom-Report-${firstName || 'User'}.pdf`,
              content: pdfResult.base64,
            },
          ]
        : undefined,
    });

    if (error) {
      log.error('Email send failed', { email, error: error.message });
      void sendCriticalAlert('Server-Side Email Failed', {
        error: error.message,
        endpoint: '/api/generate-report',
        userEmail: email,
        leadId,
      });
      status.failedStep = 'Email Send';
      status.error = error.message;
    } else {
      status.emailSent = true;
      log.info('Step 3 complete: Email sent', { email });
    }
  } catch (emailErr) {
    const error = emailErr as Error;
    log.error('Email error', { email, error: error.message });
    void sendCriticalAlert('Server-Side Email Error', {
      error: error.message,
      endpoint: '/api/generate-report',
      userEmail: email,
      leadId,
    });
    status.failedStep = 'Email Send';
    status.error = error.message;
  }

  // Step 4: Update Close CRM with report URL
  if (leadId && blobUrl) {
    log.info('Step 4: Updating CRM', { email, leadId });

    const updated = await updateLeadFields(leadId, {
      [`custom.${CLOSE_FIELDS.timeFreedomReportUrl}`]: blobUrl,
    });

    if (updated) {
      status.crmUpdated = true;
      log.info('Step 4 complete: CRM updated', { email, leadId });
    } else {
      log.error('CRM update failed', { email, leadId });
    }
  } else if (leadId && !blobUrl) {
    log.info('Step 4 skipped: No blob URL to store in CRM', { email, leadId });
  } else if (!leadId) {
    log.info('Step 4 skipped: No leadId provided', { email });
  }

  // Pipeline is successful if email was sent (the core deliverable)
  status.success = status.emailSent;
  status.durationMs = Date.now() - startTime;

  if (status.success) {
    log.info('Pipeline complete', { email, durationMs: status.durationMs });
  } else {
    log.error('Pipeline finished with failures', {
      email,
      failedStep: status.failedStep,
      durationMs: status.durationMs,
    });
  }

  // Step 5: Add audit note to Close CRM (non-blocking)
  if (leadId) {
    const durationSec = (status.durationMs / 1000).toFixed(1);
    const noteHtml = status.success
      ? `<p><strong>Report Delivered</strong> (${durationSec}s)</p>` +
        (blobUrl ? `<p>PDF: <a href="${blobUrl}">${blobUrl}</a></p>` : '') +
        `<p>Email: ${status.emailSent ? 'Sent' : 'Failed'} | Blob: ${status.blobUploaded ? 'Uploaded' : 'Failed'} | CRM: ${status.crmUpdated ? 'Updated' : 'Skipped'}</p>`
      : `<p><strong>Report FAILED</strong> at ${status.failedStep} (${durationSec}s)</p>` +
        `<p>Error: ${status.error}</p>` +
        `<p>Tasks: ${status.tasksGenerated ? 'OK' : 'Failed'} | PDF: ${status.pdfGenerated ? 'OK' : 'Failed'} | Email: ${status.emailSent ? 'OK' : 'Failed'}</p>`;

    void addLeadNote(leadId, noteHtml);
  }

  return status;
}
