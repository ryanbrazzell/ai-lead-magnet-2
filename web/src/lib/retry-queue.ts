/**
 * Retry queue for reports that failed due to Anthropic usage-cap exhaustion.
 *
 * Backed by Vercel Blob at path `retry-queue/{leadId}.json`. We picked Blob
 * because it's already in the stack for report PDFs — no new infrastructure.
 *
 * Entries are small JSON payloads with the original form submission plus
 * an attempt counter. A cron (`/api/cron/process-retry-queue`) drains the
 * queue hourly once the cap resets.
 *
 * Not for general-purpose retries. Only the cap-exceeded path writes here,
 * because (a) we know the underlying call will succeed after reset without
 * any code change, and (b) the user is waiting for the original report.
 */

import { put, list, del } from '@vercel/blob';

const QUEUE_PREFIX = 'retry-queue/';
export const MAX_RETRY_ATTEMPTS = 3;

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

/**
 * Path used to store the entry. Deterministic on leadId so re-queueing the
 * same lead (e.g. retried again on cap, cron picks it up, caps again) just
 * overwrites the previous entry with an incremented attempt count.
 */
function pathFor(leadId: string): string {
  return `${QUEUE_PREFIX}${leadId}.json`;
}

/**
 * Enqueue or re-enqueue a lead. Overwrites the existing entry if any.
 */
export async function enqueue(
  leadId: string,
  submissionId: string,
  form: QueuedForm,
  previousAttempts = 0
): Promise<void> {
  const entry: QueueEntry = {
    leadId,
    submissionId,
    enqueuedAt: new Date().toISOString(),
    attempts: previousAttempts + 1,
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
 * List all queue entries. Each includes the URL so the caller can delete
 * the blob after processing.
 */
export async function listQueue(): Promise<Array<QueueEntry & { url: string }>> {
  const { blobs } = await list({ prefix: QUEUE_PREFIX });

  const entries = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url);
        if (!res.ok) return null;
        const entry = (await res.json()) as QueueEntry;
        return { ...entry, url: blob.url };
      } catch {
        return null;
      }
    })
  );

  return entries.filter((e): e is QueueEntry & { url: string } => e !== null);
}

/**
 * Delete a queue entry after successful processing (or permanent give-up).
 */
export async function remove(leadIdOrUrl: string): Promise<void> {
  const target = leadIdOrUrl.startsWith('http') ? leadIdOrUrl : pathFor(leadIdOrUrl);
  await del(target);
}
