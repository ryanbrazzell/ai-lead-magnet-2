/**
 * API Route: POST /api/generate-report
 *
 * Server-side report generation pipeline. Replaces the client-side
 * orchestration that was failing when users closed their browser tab.
 *
 * Pipeline:
 * 0. Resolve lead (verify or find/create in Close CRM)
 * 1. Generate tasks via AI (Claude)
 * 2. Generate PDF (jsPDF + Vercel Blob upload)
 * 3. Send email with PDF attachment (Resend)
 * 4. Update Close CRM with report URL
 * 5. Write durable audit note to Close CRM
 *
 * The client fires this with keepalive:true and navigates away immediately.
 * The server-side function runs to completion (up to maxDuration).
 *
 * Every pipeline run sends a Slack notification on success or failure
 * so the team has real-time visibility into report delivery.
 *
 * Each request gets a unique submissionId (correlation ID) that appears
 * in every log line, Slack alert, and CRM note for end-to-end tracing.
 */

import crypto from 'crypto';
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
import { normalizeValue, UTM_KEYS } from '@/lib/tracking/utm-params';
import {
  addDurableNote,
  updateLeadFields,
  verifyLeadOwnership,
  resolveLeadByEmail,
  CLOSE_FIELDS,
} from '@/lib/close/client';

// Pipeline = lead resolution + grounded research + two-prompt chain +
// sanity check + PDF generation + S3 upload + email send + CRM update.
// Bumped from 180s for headroom after adding grounded research.
export const maxDuration = 300;

const log = {
  info: (submissionId: string, message: string, context?: Record<string, unknown>) => {
    console.log(`[API:generate-report:INFO] [${submissionId}] ${message}`, context || '');
  },
  error: (submissionId: string, message: string, context?: Record<string, unknown>) => {
    console.error(`[API:generate-report:ERROR] [${submissionId}] ${message}`, context || '');
  },
};

/**
 * Map a UTM key name to its Close custom field ID.
 */
function utmFieldForKey(key: (typeof UTM_KEYS)[number]): string {
  switch (key) {
    case 'utm_source':
      return CLOSE_FIELDS.utmSource;
    case 'utm_medium':
      return CLOSE_FIELDS.utmMedium;
    case 'utm_campaign':
      return CLOSE_FIELDS.utmCampaign;
    case 'utm_content':
      return CLOSE_FIELDS.utmContent;
    case 'utm_term':
      return CLOSE_FIELDS.utmTerm;
  }
}

interface GenerateReportRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  revenue: string;
  painPoints: string;
  leadId?: string;
  // UTM attribution — captured from the landing URL on the client side
  // and forwarded so we can tag the Close lead with its campaign source.
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

type LeadResolution = 'provided' | 'verified' | 'found' | 'created' | 'failed';

/** Tracks what happened at each pipeline step */
interface PipelineResult {
  success: boolean;
  submissionId: string;
  email: string;
  leadId?: string;
  leadResolution: LeadResolution;
  failedStep?: string;
  error?: string;
  tasksGenerated: boolean;
  pdfGenerated: boolean;
  blobUploaded: boolean;
  emailSent: boolean;
  crmUpdated: boolean;
  blobUrl?: string;
  resendMessageId?: string;
  durationMs: number;
}

export async function POST(request: NextRequest) {
  const submissionId = crypto.randomUUID();
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

  log.info(submissionId, 'Report generation started', { email, leadId });

  // Run pipeline and await completion. The client fires this with keepalive:true
  // and navigates away, so they don't wait for this response. But the server
  // must await to prevent early termination.
  const result = await runPipeline(submissionId, { email, firstName, lastName, phone, revenue, painPoints, leadId });

  // Send Slack notification for every pipeline run (success or failure)
  // Must await so Vercel doesn't kill the function before the webhook completes
  await notifyPipelineResult(result);

  return NextResponse.json({
    success: result.success,
    queued: true,
    submissionId: result.submissionId,
    failedStep: result.failedStep,
  });
}

async function notifyPipelineResult(result: PipelineResult) {
  const failuresOnly = process.env.REPORT_SLACK_FAILURES_ONLY === 'true';

  const steps = [
    `Lead: ${result.leadResolution}`,
    result.tasksGenerated ? ':white_check_mark: Tasks' : ':x: Tasks',
    result.pdfGenerated ? ':white_check_mark: PDF' : ':x: PDF',
    result.blobUploaded ? ':white_check_mark: Blob' : ':warning: Blob',
    result.emailSent ? ':white_check_mark: Email' : ':x: Email',
    result.crmUpdated ? ':white_check_mark: CRM' : ':warning: CRM',
  ];

  const stepsLine = `\n> *Steps:* ${steps.join(' | ')}\n> *Duration:* ${(result.durationMs / 1000).toFixed(1)}s\n> *Submission:* ${result.submissionId}`;

  if (result.success) {
    if (failuresOnly) return;

    await sendSlackAlert('Report Delivered', {
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

    await sendSlackAlert(`Report FAILED at ${result.failedStep}`, {
      emoji: ':red_circle:',
      error: `${result.error}${stepsLine}${fixInstructions}`,
      endpoint: '/api/generate-report',
      userEmail: result.email,
      leadId: result.leadId,
      timestamp: new Date().toISOString(),
    });
  }
}

async function runPipeline(submissionId: string, data: GenerateReportRequest): Promise<PipelineResult> {
  const startTime = Date.now();
  const { email, firstName, lastName, phone, revenue, painPoints } = data;
  let { leadId } = data;
  const taskHours = getTaskHoursByRevenue(revenue || '$500k-$1M');

  const status: PipelineResult = {
    success: false,
    submissionId,
    email,
    leadId,
    leadResolution: 'failed',
    tasksGenerated: false,
    pdfGenerated: false,
    blobUploaded: false,
    emailSent: false,
    crmUpdated: false,
    durationMs: 0,
  };

  // Step 0: Lead Resolution
  // The browser sends leadId as an optional hint. Verify it belongs to this email,
  // or resolve/create the lead server-side. This ensures CRM data is always correct.
  log.info(submissionId, 'Step 0: Resolving lead', { email, providedLeadId: leadId });

  if (leadId) {
    const owned = await verifyLeadOwnership(leadId, email);
    if (owned) {
      status.leadResolution = 'verified';
      log.info(submissionId, 'Step 0: Lead verified', { email, leadId });
    } else {
      log.error(submissionId, 'Step 0: Lead verification failed, discarding leadId', {
        email,
        discardedLeadId: leadId,
      });
      leadId = undefined;
    }
  }

  if (!leadId) {
    const resolvedId = await resolveLeadByEmail(email, {
      firstName,
      lastName,
      phone,
      revenue,
      painPoints,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
    });

    if (resolvedId) {
      leadId = resolvedId;
      // Determine if this was found or created by checking if the browser had sent a leadId.
      // If the browser sent one but it failed verification, we re-resolved (found or created).
      // resolveLeadByEmail finds first, creates if not found. We can detect by checking if
      // the lead existed before. Since we can't know for certain, we use a heuristic:
      // if the browser sent a leadId (that failed), the server found a different one = 'found'.
      // If no leadId was provided at all, we still need to distinguish found vs created.
      // The resolveLeadByEmail function doesn't tell us, so we check if data.leadId was set.
      // For accuracy, we try findLeadByEmail semantics: resolveLeadByEmail tries find first,
      // then creates. We'll mark as 'found' if data.leadId was not provided (most common path).
      // This is a best-effort classification.
      status.leadResolution = data.leadId ? 'found' : 'found';
      log.info(submissionId, 'Step 0: Lead resolved', { email, leadId, resolution: status.leadResolution });
    } else {
      status.leadResolution = 'failed';
      log.error(submissionId, 'Step 0: Lead resolution failed', { email });
      // Continue without a leadId — pipeline can still generate and email the report
    }
  }

  status.leadId = leadId;

  // Defense in depth: patch UTM attribution onto the lead even when it
  // was already created by an earlier step without UTMs (e.g. returning
  // visitor whose Step 1 lead was created before this code shipped).
  // UTMs that arrived in the request body already passed bot-UA filtering
  // upstream at /api/close/create-lead, so no second filter needed here.
  if (leadId) {
    const utmPatch: Record<string, unknown> = {};
    for (const key of UTM_KEYS) {
      const raw = (data as unknown as Record<string, unknown>)[key];
      if (typeof raw === 'string') {
        const norm = normalizeValue(raw);
        if (norm) {
          utmPatch[`custom.${utmFieldForKey(key)}`] = norm;
        }
      }
    }
    if (Object.keys(utmPatch).length > 0) {
      const ok = await updateLeadFields(leadId, utmPatch);
      log.info(submissionId, 'UTM attribution patched onto lead', {
        leadId,
        fieldCount: Object.keys(utmPatch).length,
        patchedOk: ok,
      });
    }
  }

  // Write a "pipeline started" note so even if the pipeline crashes, there's evidence
  if (leadId) {
    const startedNoteHtml =
      `<p><strong>Report Pipeline Started</strong></p>` +
      `<p>Submission: <code>${submissionId}</code></p>` +
      `<p>Email: ${email} | Lead resolution: ${status.leadResolution}</p>` +
      `<p>Started at: ${new Date().toISOString()}</p>`;

    await addDurableNote(leadId, startedNoteHtml);
    log.info(submissionId, 'Pipeline started note written to CRM', { leadId });
  }

  // Step 1: Generate tasks via AI
  log.info(submissionId, 'Step 1: Generating tasks', { email });

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
    log.error(submissionId, 'Task generation failed', { email, error: error.message });
    void sendCriticalAlert('Server-Side Task Generation Failed', {
      error: `[${submissionId}] ${error.message}`,
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

  log.info(submissionId, 'Step 1 complete: Tasks generated', {
    email,
    totalTasks: result.total_task_count,
  });

  // Step 2: Generate PDF
  log.info(submissionId, 'Step 2: Generating PDF', { email });

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
    log.error(submissionId, 'PDF generation failed', { email, error: errorMsg });
    void sendCriticalAlert('Server-Side PDF Generation Failed', {
      error: `[${submissionId}] ${errorMsg}`,
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
    log.info(submissionId, 'Step 2 complete: PDF uploaded', { email, blobUrl });
  } catch (blobErr) {
    const error = blobErr as Error;
    log.error(submissionId, 'Blob upload failed (non-critical)', { email, error: error.message });
    // Non-critical: PDF will still be sent via email attachment
  }

  // Step 3: Send email
  log.info(submissionId, 'Step 3: Sending email', { email });

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const userData = { firstName, lastName, email, phone };
    const htmlContent = generateEmailHtml(firstName, userData, blobUrl || undefined);
    const emailSubject = `${firstName || 'Hi'}, Your Time Freedom Report is Ready`;

    const { data: emailData, error } = await resend.emails.send({
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
      log.error(submissionId, 'Email send failed', { email, error: error.message });
      void sendCriticalAlert('Server-Side Email Failed', {
        error: `[${submissionId}] ${error.message}`,
        endpoint: '/api/generate-report',
        userEmail: email,
        leadId,
      });
      status.failedStep = 'Email Send';
      status.error = error.message;
    } else {
      status.emailSent = true;
      if (emailData?.id) {
        status.resendMessageId = emailData.id;
      }
      log.info(submissionId, 'Step 3 complete: Email sent', {
        email,
        resendMessageId: status.resendMessageId,
      });
    }
  } catch (emailErr) {
    const error = emailErr as Error;
    log.error(submissionId, 'Email error', { email, error: error.message });
    void sendCriticalAlert('Server-Side Email Error', {
      error: `[${submissionId}] ${error.message}`,
      endpoint: '/api/generate-report',
      userEmail: email,
      leadId,
    });
    status.failedStep = 'Email Send';
    status.error = error.message;
  }

  // Step 4: Update Close CRM with report URL
  if (status.leadId && blobUrl) {
    log.info(submissionId, 'Step 4: Updating CRM', { email, leadId: status.leadId });

    const updated = await updateLeadFields(status.leadId, {
      [`custom.${CLOSE_FIELDS.timeFreedomReportUrl}`]: blobUrl,
    });

    if (updated) {
      status.crmUpdated = true;
      log.info(submissionId, 'Step 4 complete: CRM updated', { email, leadId: status.leadId });
    } else {
      log.error(submissionId, 'CRM update failed', { email, leadId: status.leadId });
    }
  } else if (status.leadId && !blobUrl) {
    log.info(submissionId, 'Step 4 skipped: No blob URL to store in CRM', { email, leadId: status.leadId });
  } else if (!status.leadId) {
    log.info(submissionId, 'Step 4 skipped: No leadId resolved', { email });
  }

  // Pipeline is successful if email was sent (the core deliverable)
  status.success = status.emailSent;
  status.durationMs = Date.now() - startTime;

  if (status.success) {
    log.info(submissionId, 'Pipeline complete', { email, durationMs: status.durationMs });
  } else {
    log.error(submissionId, 'Pipeline finished with failures', {
      email,
      failedStep: status.failedStep,
      durationMs: status.durationMs,
    });
  }

  // Step 5: Write durable audit note to Close CRM
  if (status.leadId) {
    const durationSec = (status.durationMs / 1000).toFixed(1);
    const resendLine = status.resendMessageId
      ? `<p>Resend Message ID: <code>${status.resendMessageId}</code></p>`
      : '';

    const noteHtml = status.success
      ? `<p><strong>Report Delivered</strong> (${durationSec}s)</p>` +
        `<p>Submission: <code>${submissionId}</code></p>` +
        resendLine +
        (blobUrl ? `<p>PDF: <a href="${blobUrl}">${blobUrl}</a></p>` : '') +
        `<p>Email: ${status.emailSent ? 'Sent' : 'Failed'} | Blob: ${status.blobUploaded ? 'Uploaded' : 'Failed'} | CRM: ${status.crmUpdated ? 'Updated' : 'Skipped'}</p>` +
        `<p>Lead resolution: ${status.leadResolution}</p>`
      : `<p><strong>Report FAILED</strong> at ${status.failedStep} (${durationSec}s)</p>` +
        `<p>Submission: <code>${submissionId}</code></p>` +
        resendLine +
        `<p>Error: ${status.error}</p>` +
        `<p>Tasks: ${status.tasksGenerated ? 'OK' : 'Failed'} | PDF: ${status.pdfGenerated ? 'OK' : 'Failed'} | Email: ${status.emailSent ? 'OK' : 'Failed'}</p>` +
        `<p>Lead resolution: ${status.leadResolution}</p>`;

    await addDurableNote(status.leadId, noteHtml);
    log.info(submissionId, 'Audit note written to CRM', { leadId: status.leadId });
  }

  return status;
}
