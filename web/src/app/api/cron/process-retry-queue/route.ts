import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  listQueue,
  remove,
  enqueue,
  moveToDeadLetter,
  acquireLock,
  releaseLock,
  LockAcquireFailure,
  MAX_RETRY_ATTEMPTS,
  QUEUE_AGE_ALERT_MS,
} from '@/lib/retry-queue';
import { sendSlackAlert, sendCriticalAlert } from '@/lib/alerts/critical-alert';
import { runPipeline } from '@/lib/report-pipeline';

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
    | 'error'
    | 'storage_error';
  detail?: string;
}

/**
 * Safely persist a queue-state change. We wrap enqueue/remove so a single
 * Blob hiccup doesn't abort the whole drain or, worse, silently escape the
 * drainOne return and let the caller think the lead is still safely queued.
 */
async function safeEnqueue(
  leadId: string,
  submissionId: string,
  form: Parameters<typeof enqueue>[2],
  attempts: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await enqueue(leadId, submissionId, form, attempts);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function safeRemove(url: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await remove(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function drainOne(
  entry: Awaited<ReturnType<typeof listQueue>>['entries'][number]
): Promise<DrainOutcome> {
  const { leadId, form, attempts, submissionId, url } = entry;

  if (attempts > MAX_RETRY_ATTEMPTS) {
    const removed = await safeRemove(url);
    void sendCriticalAlert('Retry Queue: Gave Up', {
      error:
        `Lead ${leadId} (${form.email}) exceeded ${MAX_RETRY_ATTEMPTS} retry attempts. ` +
        `${removed.ok ? 'Queue entry deleted.' : `Remove failed: ${removed.error}.`} ` +
        `Manual recovery required. Original submission: ${submissionId}`,
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
    const reenq = await safeEnqueue(leadId, submissionId, form, attempts + 1);
    return {
      leadId,
      email: form.email,
      result: reenq.ok ? 'error' : 'storage_error',
      detail:
        (runErr instanceof Error ? runErr.message : String(runErr)) +
        (reenq.ok ? '' : ` [enqueue failed: ${reenq.error}]`),
    };
  }

  // Success path: email actually sent. Safe to remove from queue.
  if (result.success) {
    const removed = await safeRemove(url);
    if (!removed.ok) {
      // Double-send risk: the user got the email, but we couldn't drop the
      // entry. The next cron run could re-deliver. Alert so we can clean up
      // manually before that happens.
      void sendCriticalAlert('Retry Queue: Delete After Delivery Failed', {
        error:
          `Lead ${leadId} (${form.email}) was delivered but the queue entry could ` +
          `not be removed: ${removed.error}. Next cron run may re-send. ` +
          `Delete manually: ${url}`,
        endpoint: '/api/cron/process-retry-queue',
        userEmail: form.email,
        leadId,
      });
      return {
        leadId,
        email: form.email,
        result: 'storage_error',
        detail: `delivered but remove failed: ${removed.error}`,
      };
    }
    return { leadId, email: form.email, result: 'delivered' };
  }

  // Cap still hit — bump attempts, leave entry for next hour.
  if (result.queuedForRetry || /usage cap/i.test(result.failedStep || '')) {
    const reenq = await safeEnqueue(leadId, submissionId, form, attempts + 1);
    return {
      leadId,
      email: form.email,
      result: reenq.ok ? 'still_capped' : 'storage_error',
      detail: reenq.ok ? undefined : `still capped; enqueue bump failed: ${reenq.error}`,
    };
  }

  // Any other failure (PDF, Resend, CRM update): could be transient. Leave in
  // queue, bump attempts. MAX_RETRY_ATTEMPTS eventually gives up and alerts.
  const reenq = await safeEnqueue(leadId, submissionId, form, attempts + 1);
  return {
    leadId,
    email: form.email,
    result: reenq.ok ? 'transient_failure' : 'storage_error',
    detail:
      (result.failedStep || 'unknown') +
      (reenq.ok ? '' : ` [enqueue failed: ${reenq.error}]`),
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Distinguish three cases: lock is freshly acquired (proceed), lock is held
  // by a live run (skip, no alert), or the Blob store itself broke (alert).
  let gotLock: boolean;
  try {
    gotLock = await acquireLock();
  } catch (err) {
    if (err instanceof LockAcquireFailure) {
      void sendCriticalAlert('Retry Queue: Lock Store Error', {
        error:
          `Could not acquire retry-queue lock due to storage failure: ${err.message}. ` +
          `Queue drain skipped this run. If this persists, queued leads stall.`,
        endpoint: '/api/cron/process-retry-queue',
      });
    }
    return NextResponse.json(
      { ok: false, skipped: 'lock_error', error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  if (!gotLock) {
    // Another cron run is active. Return 200 so Vercel doesn't retry us.
    return NextResponse.json(
      { ok: true, skipped: 'lock_held', drained: 0 },
      { status: 200 }
    );
  }

  try {
    const { entries, corrupted } = await listQueue();

    // Handle corrupted entries first — move to dead-letter + alert. Track
    // moved vs failed separately so the alert reflects what actually happened.
    let deadLetteredOk = 0;
    const deadLetterFailures: Array<{ pathname: string; error: string }> = [];
    if (corrupted.length > 0) {
      for (const bad of corrupted) {
        try {
          await moveToDeadLetter(bad.url, bad.pathname, bad.reason);
          deadLetteredOk++;
        } catch (moveErr) {
          const msg = moveErr instanceof Error ? moveErr.message : String(moveErr);
          console.error('[cron:retry-queue] dead-letter move failed', bad.pathname, msg);
          deadLetterFailures.push({ pathname: bad.pathname, error: msg });
        }
      }
      const failureSuffix =
        deadLetterFailures.length > 0
          ? ` | Failed to move ${deadLetterFailures.length}: ${deadLetterFailures
              .map((f) => `${f.pathname} (${f.error})`)
              .join('; ')}`
          : '';
      void sendCriticalAlert('Retry Queue: Corrupted Entries', {
        error:
          `Found ${corrupted.length} unreadable queue entries. ` +
          `Moved ${deadLetteredOk} to dead-letter.${failureSuffix}`,
        endpoint: '/api/cron/process-retry-queue',
      });
    }

    if (entries.length === 0) {
      return NextResponse.json({
        ok: true,
        drained: 0,
        remaining: 0,
        corrupted: corrupted.length,
        dead_lettered_ok: deadLetteredOk,
        dead_letter_failures: deadLetterFailures.length,
      });
    }

    const batch = entries.slice(0, MAX_DRAIN_PER_RUN);
    const settled = await Promise.allSettled(batch.map((e) => drainOne(e)));

    const outcomes: DrainOutcome[] = [];
    let internalFailures = 0;
    for (const r of settled) {
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
      storage_error: outcomes.filter((o) => o.result === 'storage_error').length,
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
        `Errors: ${summary.error} | Storage errors: ${summary.storage_error} | ` +
        `Internal exc: ${internalFailures} | ` +
        `Corrupted: ${corrupted.length} (${deadLetteredOk} moved, ${deadLetterFailures.length} failed) | ` +
        `Remaining: ${remaining}`,
      endpoint: '/api/cron/process-retry-queue',
    });

    return NextResponse.json({
      ok: true,
      ...summary,
      corrupted: corrupted.length,
      dead_lettered_ok: deadLetteredOk,
      dead_letter_failures: deadLetterFailures.length,
      remaining,
    });
  } finally {
    await releaseLock();
  }
}
