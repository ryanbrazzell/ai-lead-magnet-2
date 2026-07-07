/**
 * Report generation pipeline
 *
 * Lifted out of the App Router route module so that Next.js route-type
 * guards don't complain about non-HTTP exports, and so both the POST
 * route and the retry-queue cron can import it without going through HTTP.
 *
 * Pipeline:
 * 0. Resolve lead (verify or find/create in Close CRM)
 * 1. Generate tasks via AI (Claude)
 * 2. Generate PDF (jsPDF + Vercel Blob upload)
 * 3. Send email with PDF attachment (Resend)
 * 4. Update Close CRM with report URL
 * 5. Write durable audit note to Close CRM
 *
 * Each request gets a unique submissionId (correlation ID) that appears
 * in every log line, Slack alert, and CRM note for end-to-end tracing.
 */

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
import { sendCriticalAlert } from '@/lib/alerts/critical-alert';
import { getTaskHoursByRevenue } from '@/lib/roi-calculator';
import { normalizeValue, UTM_KEYS } from '@/lib/tracking/utm-params';
import {
  addDurableNote,
  updateLeadFields,
  verifyLeadOwnership,
  resolveLeadByEmail,
  CLOSE_FIELDS,
} from '@/lib/close/client';
import {
  RetryableAnthropicError,
  UsageCapExceededError,
} from '@/lib/ai/anthropic-errors';
import { enqueue as enqueueRetry, type QueuedForm } from '@/lib/retry-queue';

const log = {
  info: (submissionId: string, message: string, context?: Record<string, unknown>) => {
    console.log(`[pipeline:INFO] [${submissionId}] ${message}`, context || '');
  },
  error: (submissionId: string, message: string, context?: Record<string, unknown>) => {
    console.error(`[pipeline:ERROR] [${submissionId}] ${message}`, context || '');
  },
};

/** Map a UTM key name to its Close custom field ID. */
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

export interface GenerateReportRequest {
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
  // Optional apology opener. When present, replaces the default
  // "Your Time Freedom Report is ready..." paragraph in the email body.
  // Used to resend reports for leads whose original run failed.
  apologyIntro?: string;
  /** A/B test: which /report variation this lead was assigned. */
  variation?: 'control' | 'video';
}

export type LeadResolution = 'provided' | 'verified' | 'found' | 'created' | 'failed';

/** Tracks what happened at each pipeline step */
export interface PipelineResult {
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
  /**
   * True when the pipeline stopped because the Anthropic usage cap was hit
   * and the lead was enqueued for silent retry. Distinct from a real failure
   * so we can send an informational Slack alert instead of a red alarm.
   */
  queuedForRetry?: boolean;
}

export interface PipelineOptions {
  /** True when invoked from the retry cron. Skips enqueue + notification. */
  fromCron?: boolean;
}

export async function runPipeline(
  submissionId: string,
  data: GenerateReportRequest,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
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
      status.leadResolution = 'found';
      log.info(submissionId, 'Step 0: Lead resolved', { email, leadId, resolution: status.leadResolution });
    } else {
      status.leadResolution = 'failed';
      log.error(submissionId, 'Step 0: Lead resolution failed', { email });
      // Continue without a leadId — pipeline can still generate and email the report
    }
  }

  status.leadId = leadId;

  // Defense in depth: patch UTM attribution onto the lead even when it
  // was already created by an earlier step without UTMs.
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

    const startedNoteWritten = await addDurableNote(leadId, startedNoteHtml);
    if (startedNoteWritten) {
      log.info(submissionId, 'Pipeline started note written to CRM', { leadId });
    } else {
      log.error(submissionId, 'Pipeline started note FAILED to write to CRM', { leadId });
    }
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
    if (err instanceof RetryableAnthropicError) {
      // Sub-classify for logging + audit messaging. Both cap and overload
      // share the same queue behavior — only the operator-facing copy differs.
      const kind = err instanceof UsageCapExceededError ? 'usage cap' : 'overload';
      const kindTitle = err instanceof UsageCapExceededError
        ? 'Anthropic usage cap'
        : 'Anthropic overload';

      log.error(submissionId, `Task generation hit ${kindTitle}`, { email, leadId });

      // Enqueue FIRST. Only on confirmed success do we mark the pipeline as
      // "queued for retry" — anything else falls through to a real critical alert.
      let enqueued = false;
      if (leadId && !options.fromCron) {
        const queuedForm: QueuedForm = {
          email,
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
        };
        try {
          await enqueueRetry(leadId, submissionId, queuedForm);
          enqueued = true;
          log.info(submissionId, `Lead enqueued for retry (${kind})`, { leadId });
        } catch (enqueueErr) {
          const e = enqueueErr as Error;
          log.error(submissionId, 'Retry enqueue FAILED', {
            email,
            leadId,
            error: e.message,
          });
        }
      }

      if (enqueued) {
        status.failedStep = `Queued for retry (${kind})`;
        status.error = err.message;
        status.queuedForRetry = true;
        status.durationMs = Date.now() - startTime;

        // Audit note only when we actually queued — anything else misrepresents state.
        if (leadId) {
          const detailSentence =
            kind === 'usage cap'
              ? `The monthly Anthropic spend cap was hit.`
              : `Anthropic's servers returned a 529 Overloaded response on every attempt.`;
          const queuedNoteHtml =
            `<p><strong>Report Queued (${kindTitle})</strong></p>` +
            `<p>Submission: <code>${submissionId}</code></p>` +
            `<p>${detailSentence} Lead is stashed in the retry queue and will ` +
            `be delivered automatically on the next hourly drain that succeeds.</p>`;
          await addDurableNote(leadId, queuedNoteHtml);
        }

        return status;
      }

      // Either no leadId, or enqueue failed, or fromCron (cron manages its own
      // retry state — don't re-enqueue). In all three cases treat as a real
      // pipeline failure so we page an operator.
      if (!options.fromCron) {
        void sendCriticalAlert('Task Generation: Retryable + Enqueue Failure', {
          error:
            `[${submissionId}] Anthropic ${kind} AND queue enqueue failed ` +
            `(or no leadId). User will NOT get their report without manual ` +
            `recovery. Underlying: ${err.message}`,
          endpoint: '/api/generate-report',
          userEmail: email,
          leadId,
        });
      }

      status.failedStep = `Task Generation (retryable: ${kind}, not queued)`;
      status.error = err.message;
      status.queuedForRetry = false;
      status.durationMs = Date.now() - startTime;
      return status;
    }

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
    const htmlContent = generateEmailHtml(firstName, userData, blobUrl || undefined, data.apologyIntro);
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

    const auditNoteWritten = await addDurableNote(status.leadId, noteHtml);
    if (auditNoteWritten) {
      log.info(submissionId, 'Audit note written to CRM', { leadId: status.leadId });
    } else {
      log.error(submissionId, 'Audit note FAILED to write to CRM', { leadId: status.leadId });
    }
  }

  return status;
}
