/**
 * A/B test stats from Close CRM, for the /dashboard page.
 *
 * Pages through Close leads and buckets them by the "Lead Magnet Variation"
 * custom field and booked-call status. Leads with no variation (pre-test or
 * gated-off) are ignored, so the numbers only reflect the live test.
 */

import { CLOSE_FIELDS } from './client';

const CLOSE_API_BASE = 'https://api.close.com/api/v1';
const PAGE_SIZE = 100;
const MAX_PAGES = 200; // safety ceiling: 20k leads

// Booked-call lead statuses (see app/api/close/mark-call-booked/route.ts).
const BOOKED_STATUS_IDS = new Set<string>([
  'stat_DQePUkSNuYYtuwVyfqJ40fOf1KrgwKUqOiUJvTfZ2nP', // Strategy Call Booked
  'stat_UEiczhS2rm7a0rcaick2wizlAlL18KRabpGPA9vc7E9', // Triage Call Booked
]);

export interface VariationStats {
  visits: number;
  booked: number;
  rate: number; // booked / visits, 0 when visits === 0
}

export interface AbStats {
  control: VariationStats;
  video: VariationStats;
  generatedAt: string;
}

interface CloseLead {
  id?: string;
  status_id?: string;
  [key: string]: unknown;
}

const FIELD_KEY = `custom.${CLOSE_FIELDS.leadMagnetVariation}`;

function toStats(visits: number, booked: number): VariationStats {
  return { visits, booked, rate: visits > 0 ? booked / visits : 0 };
}

/**
 * Fetch and compute A/B stats. Returns null if Close is unreachable or
 * misconfigured - the dashboard treats null as a data-unavailable state.
 */
export async function getAbStats(): Promise<AbStats | null> {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) {
    console.error('[getAbStats] CLOSE_API_KEY is not set');
    return null;
  }

  const auth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const counts = {
    control: { visits: 0, booked: 0 },
    video: { visits: 0, booked: 0 },
  };

  for (let page = 0; page < MAX_PAGES; page++) {
    const url =
      `${CLOSE_API_BASE}/lead/` +
      `?_fields=id,status_id,${encodeURIComponent(FIELD_KEY)}` +
      `&_limit=${PAGE_SIZE}&_skip=${page * PAGE_SIZE}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Authorization: auth },
      });
    } catch (err) {
      console.error('[getAbStats] Close request threw', err);
      return null;
    }

    if (!res.ok) {
      console.error('[getAbStats] Close request failed', res.status);
      return null;
    }

    const body = (await res.json()) as { data?: CloseLead[]; has_more?: boolean };
    const leads = body.data ?? [];

    for (const lead of leads) {
      const variation = lead[FIELD_KEY];
      if (variation !== 'control' && variation !== 'video') continue;
      counts[variation].visits += 1;
      if (lead.status_id && BOOKED_STATUS_IDS.has(lead.status_id)) {
        counts[variation].booked += 1;
      }
    }

    if (!body.has_more) break;
  }

  return {
    control: toStats(counts.control.visits, counts.control.booked),
    video: toStats(counts.video.visits, counts.video.booked),
    generatedAt: new Date().toISOString(),
  };
}
