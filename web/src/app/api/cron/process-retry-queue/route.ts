/**
 * API Route: GET /api/cron/process-retry-queue
 *
 * Hourly Vercel cron that drains the retry queue. Queue entries are leads
 * whose report failed because the Anthropic monthly spend cap was hit.
 * Once the cap resets (or is raised), this cron re-runs the full pipeline
 * for each queued lead and delivers the report they were promised.
 *
 * Auth: Vercel cron requests include `authorization: Bearer ${CRON_SECRET}`.
 *
 * Per-run behaviour for each queued entry:
 *   - success  → delete the queue entry
 *   - cap still hit → re-enqueue with attempts + 1 (or give up after MAX)
 *   - other failure → delete + Slack alert (permanent, won't succeed on retry)
 *
 * The cron is capped at a small batch size per run; remaining entries are
 * picked up on the next hour. Hourly is more than fast enough — the only
 * time this queue fills is when a cap is hit, and the cap reset cadence
 * is daily at best.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listQueue, remove, enqueue, MAX_RETRY_ATTEMPTS } from '@/lib/retry-queue';
import { sendSlackAlert, sendCriticalAlert } from '@/lib/alerts/critical-alert';

// Each drain POST hits the pipeline for ~80s. Cap the batch so the cron
// function stays within Vercel's max duration. Remaining entries wait an hour.
const MAX_DRAIN_PER_RUN = 8;

// Pipeline can take ~90s per lead; give ourselves headroom for 8 in parallel.
export const maxDuration = 300;

const APOLOGY_INTRO =
  'Thanks for being patient - the report took a second to deliver, but here it is.';

function baseUrl(req: NextRequest): string {
  // Prefer the request origin (works in all Vercel envs). Fall back to the
  // hardcoded production URL only as a last resort.
  const host = req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return 'https://report.assistantlaunch.com';
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // No secret configured — refuse rather than leaving the endpoint open.
    return false;
  }
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

interface DrainOutcome {
  leadId: string;
  email: string;
  result: 'delivered' | 'still_capped' | 'gave_up' | 'permanent_failure' | 'error';
  detail?: string;
}

async function drainOne(
  entry: Awaited<ReturnType<typeof listQueue>>[number],
  origin: string
): Promise<DrainOutcome> {
  const { leadId, form, attempts, submissionId, url } = entry;

  if (attempts > MAX_RETRY_ATTEMPTS) {
    await remove(url);
    void sendCriticalAlert('Retry Queue: Gave Up', {
      error:
        `Lead ${leadId} (${form.email}) exceeded ${MAX_RETRY_ATTEMPTS} retry attempts ` +
        `without delivering. Manual recovery needed. Original submission: ${submissionId}`,
      endpoint: '/api/cron/process-retry-queue',
      userEmail: form.email,
      leadId,
    });
    return { leadId, email: form.email, result: 'gave_up' };
  }

  let response: Response;
  try {
    response = await fetch(`${origin}/api/generate-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        revenue: form.revenue,
        painPoints: form.painPoints,
        leadId,
        utm_source: form.utm_source,
        utm_medium: form.utm_medium,
        utm_campaign: form.utm_campaign,
        utm_content: form.utm_content,
        utm_term: form.utm_term,
        apologyIntro: APOLOGY_INTRO,
        fromCron: true,
      }),
    });
  } catch (fetchErr) {
    const e = fetchErr as Error;
    // Leave in queue; next cron run will try again.
    return {
      leadId,
      email: form.email,
      result: 'error',
      detail: `fetch failed: ${e.message}`,
    };
  }

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    queuedForRetry?: boolean;
    failedStep?: string;
  };

  if (body.success) {
    await remove(url);
    return { leadId, email: form.email, result: 'delivered' };
  }

  if (body.queuedForRetry || /usage cap/i.test(body.failedStep || '')) {
    // Cap is still hit. Bump the attempt count and leave for next run.
    await enqueue(leadId, submissionId, form, attempts);
    return { leadId, email: form.email, result: 'still_capped' };
  }

  // Other failure — regeneration broke for a non-cap reason. Clear the entry
  // and raise a critical alert so we can recover manually.
  await remove(url);
  return {
    leadId,
    email: form.email,
    result: 'permanent_failure',
    detail: body.failedStep || 'unknown',
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = baseUrl(req);

  let queue: Awaited<ReturnType<typeof listQueue>>;
  try {
    queue = await listQueue();
  } catch (err) {
    const e = err as Error;
    console.error('[cron:retry-queue] Failed to list queue', e.message);
    return NextResponse.json(
      { ok: false, error: `list failed: ${e.message}` },
      { status: 500 }
    );
  }

  if (queue.length === 0) {
    return NextResponse.json({ ok: true, drained: 0, remaining: 0 });
  }

  const batch = queue.slice(0, MAX_DRAIN_PER_RUN);
  const outcomes = await Promise.all(batch.map((entry) => drainOne(entry, origin)));

  const summary = {
    delivered: outcomes.filter((o) => o.result === 'delivered').length,
    still_capped: outcomes.filter((o) => o.result === 'still_capped').length,
    gave_up: outcomes.filter((o) => o.result === 'gave_up').length,
    permanent_failure: outcomes.filter((o) => o.result === 'permanent_failure').length,
    error: outcomes.filter((o) => o.result === 'error').length,
  };

  // Raise alerts for permanent failures so they're visible.
  for (const o of outcomes) {
    if (o.result === 'permanent_failure') {
      void sendCriticalAlert('Retry Queue: Permanent Failure', {
        error:
          `Lead ${o.leadId} (${o.email}) failed at "${o.detail}" during queued retry. ` +
          `Queue entry deleted. Manual intervention required.`,
        endpoint: '/api/cron/process-retry-queue',
        userEmail: o.email,
        leadId: o.leadId,
      });
    }
  }

  const remaining = queue.length - batch.length + summary.still_capped + summary.error;

  // One summary Slack message per run, only when the cron actually did work.
  void sendSlackAlert('Retry Queue Drain', {
    emoji: summary.delivered > 0 ? ':package:' : ':hourglass_flowing_sand:',
    error:
      `Delivered: ${summary.delivered} | Still capped: ${summary.still_capped} | ` +
      `Gave up: ${summary.gave_up} | Permanent: ${summary.permanent_failure} | ` +
      `Transient errors: ${summary.error} | Remaining in queue: ${remaining}`,
    endpoint: '/api/cron/process-retry-queue',
  });

  return NextResponse.json({ ok: true, ...summary, remaining });
}
