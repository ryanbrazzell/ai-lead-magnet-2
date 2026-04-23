import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  listQueue,
  remove,
  enqueue,
  moveToDeadLetter,
  acquireLock,
  releaseLock,
  MAX_RETRY_ATTEMPTS,
  QUEUE_AGE_ALERT_MS,
} from '@/lib/retry-queue';
import { sendSlackAlert, sendCriticalAlert } from '@/lib/alerts/critical-alert';
import { runPipeline } from '@/app/api/generate-report/route';

export const maxDuration = 300;

const MAX_DRAIN_PER_RUN = 15;
const APOLOGY_INTRO =
  'Thanks for being patient - the report took a second to deliver, but here it is.';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

interface DrainOutcome {
  leadId: string;
  email: string;
  result:
    | 'delivered'
    | 'still_capped'
    | 'transient_failure'
    | 'gave_up'
    | 'error';
  detail?: string;
}

async function drainOne(
  entry: Awaited<ReturnType<typeof listQueue>>['entries'][number]
): Promise<DrainOutcome> {
  const { leadId, form, attempts, submissionId, url } = entry;

  if (attempts > MAX_RETRY_ATTEMPTS) {
    await remove(url);
    void sendCriticalAlert('Retry Queue: Gave Up', {
      error:
        `Lead ${leadId} (${form.email}) exceeded ${MAX_RETRY_ATTEMPTS} retry attempts. ` +
        `Queue entry deleted. Manual recovery required. Original submission: ${submissionId}`,
      endpoint: '/api/cron/process-retry-queue',
      userEmail: form.email,
      leadId,
    });
    return { leadId, email: form.email, result: 'gave_up' };
  }

  const retrySubmissionId = crypto.randomUUID();

  let result: Awaited<ReturnType<typeof runPipeline>>;
  try {
    result = await runPipeline(
      retrySubmissionId,
      {
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
      },
      { fromCron: true }
    );
  } catch (runErr) {
    // Hard runtime failure — keep entry, bump attempts, try again next hour.
    await enqueue(leadId, submissionId, form, attempts + 1);
    return {
      leadId,
      email: form.email,
      result: 'error',
      detail: runErr instanceof Error ? runErr.message : String(runErr),
    };
  }

  // Success path: email actually sent. Safe to remove from queue.
  if (result.success) {
    await remove(url);
    return { leadId, email: form.email, result: 'delivered' };
  }

  // Cap still hit — bump attempts, leave entry for next hour.
  if (result.queuedForRetry || /usage cap/i.test(result.failedStep || '')) {
    await enqueue(leadId, submissionId, form, attempts + 1);
    return { leadId, email: form.email, result: 'still_capped' };
  }

  // Any other failure (PDF, Resend, CRM update): could be transient (Resend
  // hiccup, Vercel Blob latency, etc). Leave in queue, bump attempts. The
  // MAX_RETRY_ATTEMPTS gate above will eventually give up and alert if the
  // lead never succeeds.
  await enqueue(leadId, submissionId, form, attempts + 1);
  return {
    leadId,
    email: form.email,
    result: 'transient_failure',
    detail: result.failedStep || 'unknown',
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gotLock = await acquireLock();
  if (!gotLock) {
    return NextResponse.json(
      { ok: true, skipped: 'lock_held', drained: 0 },
      { status: 200 }
    );
  }

  try {
    const { entries, corrupted } = await listQueue();

    // Handle corrupted entries first — move to dead-letter + alert, don't
    // let them pollute successive drain runs.
    if (corrupted.length > 0) {
      for (const bad of corrupted) {
        try {
          await moveToDeadLetter(bad.url, bad.pathname, bad.reason);
        } catch (moveErr) {
          console.error('[cron:retry-queue] dead-letter move failed', moveErr);
        }
      }
      void sendCriticalAlert('Retry Queue: Corrupted Entries', {
        error:
          `Moved ${corrupted.length} unreadable queue entries to dead-letter. ` +
          `Paths: ${corrupted.map((c) => c.pathname).join(', ')}`,
        endpoint: '/api/cron/process-retry-queue',
      });
    }

    if (entries.length === 0) {
      return NextResponse.json({
        ok: true,
        drained: 0,
        remaining: 0,
        corrupted: corrupted.length,
      });
    }

    const batch = entries.slice(0, MAX_DRAIN_PER_RUN);
    const settled = await Promise.allSettled(batch.map((e) => drainOne(e)));

    const outcomes: DrainOutcome[] = [];
    let internalFailures = 0;
    for (let i = 0; i < settled.length; i++) {
      const r = settled[i];
      if (r.status === 'fulfilled') {
        outcomes.push(r.value);
      } else {
        internalFailures++;
        const err = r.reason instanceof Error ? r.reason.message : String(r.reason);
        console.error('[cron:retry-queue] drainOne threw', err);
      }
    }

    const summary = {
      delivered: outcomes.filter((o) => o.result === 'delivered').length,
      still_capped: outcomes.filter((o) => o.result === 'still_capped').length,
      transient_failure: outcomes.filter((o) => o.result === 'transient_failure').length,
      gave_up: outcomes.filter((o) => o.result === 'gave_up').length,
      error: outcomes.filter((o) => o.result === 'error').length,
      internal_exception: internalFailures,
    };

    // Queue-age alert: any entry older than QUEUE_AGE_ALERT_MS that we haven't
    // drained is a sign we're stuck.
    const now = Date.now();
    const stale = entries.filter(
      (e) => now - new Date(e.enqueuedAt).getTime() > QUEUE_AGE_ALERT_MS
    );
    if (stale.length > 0) {
      void sendCriticalAlert('Retry Queue: Stale Entries', {
        error:
          `${stale.length} queue entries are older than 24h. ` +
          `Oldest leadId: ${stale[0]?.leadId}, enqueued: ${stale[0]?.enqueuedAt}. ` +
          `Drain may be stuck (cap still hit? pipeline degraded?).`,
        endpoint: '/api/cron/process-retry-queue',
      });
    }

    const remaining = entries.length - summary.delivered - summary.gave_up;

    void sendSlackAlert('Retry Queue Drain', {
      emoji: summary.delivered > 0 ? ':package:' : ':hourglass_flowing_sand:',
      error:
        `Delivered: ${summary.delivered} | Still capped: ${summary.still_capped} | ` +
        `Transient: ${summary.transient_failure} | Gave up: ${summary.gave_up} | ` +
        `Errors: ${summary.error} | Internal exc: ${internalFailures} | ` +
        `Corrupted: ${corrupted.length} | Remaining: ${remaining}`,
      endpoint: '/api/cron/process-retry-queue',
    });

    return NextResponse.json({
      ok: true,
      ...summary,
      corrupted: corrupted.length,
      remaining,
    });
  } finally {
    await releaseLock();
  }
}
