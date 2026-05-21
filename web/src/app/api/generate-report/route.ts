/**
 * API Route: POST /api/generate-report
 *
 * Thin HTTP wrapper around `runPipeline` (see lib/report-pipeline.ts).
 *
 * The client fires this with keepalive:true and navigates away immediately.
 * The server-side function runs to completion (up to maxDuration).
 *
 * Every pipeline run sends a Slack notification on success or failure
 * so the team has real-time visibility into report delivery.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sendSlackAlert } from '@/lib/alerts/critical-alert';
import { recordLeadVariation } from '@/lib/close/record-variation';
import {
  runPipeline,
  type GenerateReportRequest,
  type PipelineResult,
} from '@/lib/report-pipeline';

// Pipeline = lead resolution + grounded research + two-prompt chain +
// sanity check + PDF generation + S3 upload + email send + CRM update.
// Bumped from 180s for headroom after adding grounded research.
export const maxDuration = 300;

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

  const { email, firstName, lastName, phone, revenue, painPoints, leadId, apologyIntro, variation } = body;

  // Belt and suspenders: apologyIntro is normally set by the cron with a
  // known-safe string. But since it's accepted on the public request body
  // today (via /api/resend-report or manual admin calls) we strip HTML
  // before it enters the pipeline.
  const safeApologyIntro = apologyIntro
    ? apologyIntro.replace(/<[^>]*>/g, '').slice(0, 500)
    : undefined;

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email is required' },
      { status: 400 }
    );
  }

  // A/B test: record which /report variation this lead saw. First-write-wins,
  // non-blocking - a failure here must never block report generation.
  if (leadId && (variation === 'control' || variation === 'video')) {
    try {
      await recordLeadVariation(leadId, variation);
    } catch (err) {
      console.error(`[API:generate-report] [${submissionId}] recordLeadVariation failed`, err);
    }
  }

  console.log(`[API:generate-report:INFO] [${submissionId}] Report generation started`, {
    email,
    leadId,
  });

  // Run pipeline and await completion. The client fires this with keepalive:true
  // and navigates away, so they don't wait for this response. But the server
  // must await to prevent early termination.
  const result = await runPipeline(submissionId, {
    email,
    firstName,
    lastName,
    phone,
    revenue,
    painPoints,
    leadId,
    utm_source: body.utm_source,
    utm_medium: body.utm_medium,
    utm_campaign: body.utm_campaign,
    utm_content: body.utm_content,
    utm_term: body.utm_term,
    apologyIntro: safeApologyIntro,
  });

  // Send Slack notification for every pipeline run (success or failure).
  // Must await so Vercel doesn't kill the function before the webhook completes.
  await notifyPipelineResult(result);

  return NextResponse.json({
    success: result.success,
    queued: true,
    submissionId: result.submissionId,
    failedStep: result.failedStep,
    queuedForRetry: result.queuedForRetry === true,
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
  } else if (result.queuedForRetry) {
    // Informational: the lead hasn't failed, it's queued for the hourly cron
    // to drain once the Anthropic cap lifts. One soft alert per hit — no PagerDuty-
    // style red alarm, and no separate sendCriticalAlert email, so we avoid the
    // multi-alert flood we saw before.
    await sendSlackAlert('Report Queued (Anthropic cap)', {
      emoji: ':hourglass_flowing_sand:',
      error:
        `Anthropic usage cap hit — lead stashed for silent retry. ` +
        `Hourly cron will drain once cap resets.${stepsLine}`,
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
