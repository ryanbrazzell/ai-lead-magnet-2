import { put, list, del } from '@vercel/blob';

const QUEUE_PREFIX = 'retry-queue/';
const DEAD_LETTER_PREFIX = 'retry-queue-deadletter/';
export const MAX_RETRY_ATTEMPTS = 3;
/** Queue entries older than this surface in the age-alert. */
export const QUEUE_AGE_ALERT_MS = 24 * 60 * 60 * 1000; // 24h

export interface QueuedForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  revenue: string;
  painPoints: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface QueueEntry {
  leadId: string;
  submissionId: string;
  enqueuedAt: string;
  attempts: number;
  form: QueuedForm;
}

export interface ListQueueResult {
  entries: Array<QueueEntry & { url: string; pathname: string }>;
  /** Corrupted/unreadable blobs — surface these as dead-letter work. */
  corrupted: Array<{ url: string; pathname: string; reason: string }>;
}

function pathFor(leadId: string): string {
  return `${QUEUE_PREFIX}${leadId}.json`;
}

async function readExistingAttempts(leadId: string): Promise<number> {
  try {
    const { blobs } = await list({ prefix: pathFor(leadId) });
    const match = blobs.find((b) => b.pathname === pathFor(leadId));
    if (!match) return 0;
    const res = await fetch(match.url);
    if (!res.ok) return 0;
    const entry = (await res.json()) as Partial<QueueEntry>;
    return typeof entry.attempts === 'number' ? entry.attempts : 0;
  } catch {
    return 0;
  }
}

/**
 * Enqueue or re-enqueue a lead. Preserves the prior attempts count when an
 * entry already exists so concurrent writers (route.ts + cron) can't reset
 * retry accounting. If `attempts` is provided explicitly, that wins.
 */
export async function enqueue(
  leadId: string,
  submissionId: string,
  form: QueuedForm,
  attempts?: number
): Promise<void> {
  const resolvedAttempts =
    typeof attempts === 'number' ? attempts : (await readExistingAttempts(leadId)) + 1;

  const entry: QueueEntry = {
    leadId,
    submissionId,
    enqueuedAt: new Date().toISOString(),
    attempts: resolvedAttempts,
    form,
  };

  await put(pathFor(leadId), JSON.stringify(entry, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

/**
 * Walk every page of the queue prefix and classify each blob as a valid
 * entry or a corrupted one. Corrupted entries are NOT filtered silently —
 * callers must handle them (dead-letter, alert, etc).
 */
export async function listQueue(): Promise<ListQueueResult> {
  const entries: ListQueueResult['entries'] = [];
  const corrupted: ListQueueResult['corrupted'] = [];

  let cursor: string | undefined;
  do {
    const page = await list({ prefix: QUEUE_PREFIX, cursor });
    for (const blob of page.blobs) {
      // Skip the lock sentinel (see acquireLock below).
      if (blob.pathname === LOCK_PATH) continue;

      try {
        const res = await fetch(blob.url);
        if (!res.ok) {
          corrupted.push({
            url: blob.url,
            pathname: blob.pathname,
            reason: `fetch ${res.status}`,
          });
          continue;
        }
        const parsed = (await res.json()) as QueueEntry;
        if (
          !parsed ||
          typeof parsed.leadId !== 'string' ||
          typeof parsed.submissionId !== 'string' ||
          typeof parsed.attempts !== 'number' ||
          !parsed.form
        ) {
          corrupted.push({
            url: blob.url,
            pathname: blob.pathname,
            reason: 'schema mismatch',
          });
          continue;
        }
        entries.push({ ...parsed, url: blob.url, pathname: blob.pathname });
      } catch (err) {
        corrupted.push({
          url: blob.url,
          pathname: blob.pathname,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return { entries, corrupted };
}

export async function remove(urlOrLeadId: string): Promise<void> {
  const target = urlOrLeadId.startsWith('http') ? urlOrLeadId : pathFor(urlOrLeadId);
  await del(target);
}

/**
 * Move a corrupted blob out of the active queue so it stops polluting
 * drain runs. We copy by writing a new blob under the dead-letter prefix,
 * then delete the original.
 */
export async function moveToDeadLetter(
  url: string,
  pathname: string,
  reason: string
): Promise<void> {
  const name = pathname.startsWith(QUEUE_PREFIX)
    ? pathname.slice(QUEUE_PREFIX.length)
    : pathname;
  const target = `${DEAD_LETTER_PREFIX}${Date.now()}-${name}`;

  let bodyText = '';
  try {
    const res = await fetch(url);
    bodyText = await res.text().catch(() => '');
  } catch {
    bodyText = '';
  }

  const wrapper = JSON.stringify({
    movedAt: new Date().toISOString(),
    reason,
    original: { url, pathname },
    originalBody: bodyText,
  });

  await put(target, wrapper, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  await del(url);
}

// ---------------------------------------------------------------------------
// Lock for overlapping cron runs (finding #8)
// ---------------------------------------------------------------------------

const LOCK_PATH = `${QUEUE_PREFIX}_lock.json`;
const LOCK_STALE_MS = 10 * 60 * 1000; // 10 minutes — well past our 300s maxDuration

/**
 * Distinguishes a real storage failure from "lock is held". A held lock is
 * expected (two cron runs overlap) — a storage failure is an operator
 * problem and must not silently skip the drain.
 */
export class LockAcquireFailure extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'LockAcquireFailure';
    this.cause = cause;
  }
}

/**
 * Best-effort mutex using the blob itself. Not atomic (Vercel Blob doesn't
 * offer CAS) but good enough: readers check timestamp freshness, and the
 * ~10 minute stale window prevents a dead holder from blocking forever.
 * Two concurrent runs could still race on first acquire — acceptable at
 * our scale (hourly cron, short drain windows).
 *
 * Returns:
 *   true  — lock freshly acquired, caller must call releaseLock()
 *   false — lock held by another live run, caller should skip quietly
 *
 * Throws LockAcquireFailure on storage errors. Callers MUST distinguish
 * that from a `false` return — a storage failure should surface to
 * operators, not silently absorb like contention.
 */
export async function acquireLock(): Promise<boolean> {
  let existingBlobs;
  try {
    existingBlobs = await list({ prefix: LOCK_PATH });
  } catch (err) {
    throw new LockAcquireFailure(
      `list() failed: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }

  const existing = existingBlobs.blobs.find((b) => b.pathname === LOCK_PATH);
  if (existing) {
    // Fetching the existing lock body is best-effort. If that fetch fails
    // we fall through to overwrite — stale-lock recovery beats a stuck cron.
    const res = await fetch(existing.url).catch(() => null);
    if (res?.ok) {
      const body = (await res.json().catch(() => null)) as
        | { acquiredAt?: string }
        | null;
      if (body?.acquiredAt) {
        const age = Date.now() - new Date(body.acquiredAt).getTime();
        if (age < LOCK_STALE_MS) return false;
      }
    }
  }

  try {
    await put(
      LOCK_PATH,
      JSON.stringify({ acquiredAt: new Date().toISOString() }),
      {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      }
    );
    return true;
  } catch (err) {
    throw new LockAcquireFailure(
      `put() failed: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }
}

export async function releaseLock(): Promise<void> {
  try {
    await del(LOCK_PATH);
  } catch {
    // release is best-effort — stale lock self-expires
  }
}
