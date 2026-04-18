/**
 * UTM Parameter Capture
 *
 * Pure utilities for parsing, normalizing, and validating UTM parameters
 * from a URL's query string. Zero DOM access — safe to import anywhere.
 *
 * Why this exists:
 * - Meta ad URLs and Klaviyo email links carry utm_source / utm_medium /
 *   utm_campaign / utm_content / utm_term so we can see which channel and
 *   campaign produced each lead in Close.
 * - Without this, Close has no campaign-level visibility beyond the
 *   hardcoded source="Lead Magnet" on every record.
 *
 * Guardrails this file enforces:
 * - De-dupes malformed URLs where the same key appears twice
 *   (?utm_source=a?utm_source=b comes through as two utm_source values —
 *   we keep the first, drop the rest)
 * - Normalizes values to lowercase, trimmed, max 128 chars
 * - Filters out known link-preview / security-scanner bot user agents so
 *   phantom clicks don't inflate email campaign counts
 */

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export type UtmParams = Partial<Record<UtmKey, string>>;

/**
 * Max length for any single UTM value. Anything longer is almost certainly
 * junk (someone pasted a full URL or tracking blob into utm_campaign).
 */
const MAX_VALUE_LENGTH = 128;

/**
 * Known link-preview / security-scanner user-agent fragments. When a UTM
 * comes in from one of these, we drop it so phantom clicks from corporate
 * email scanners don't inflate real campaign numbers.
 */
const BOT_UA_FRAGMENTS = [
  'bot',
  'crawler',
  'spider',
  'preview',
  'mailservice',
  'urlscan',
  'proofpoint',
  'mimecast',
  'barracuda',
  'symantec',
  'fortinet',
  'microsoft office',
  'outlook-safelinks',
  'safelink',
  'googleimageproxy',
  'linkchecker',
  'fetch',
  'headlesschrome',
];

/**
 * Parse UTMs from a URL search string (e.g. `?utm_source=klaviyo&utm_campaign=...`).
 *
 * Handles malformed URLs that concatenate multiple `?utm_*=` groups — the
 * common case is `?utm_source=a?utm_source=b` from double-tagging. Keeps
 * the first non-empty value per key and drops the rest.
 */
export function parseUtmParams(search: string | null | undefined): UtmParams {
  if (!search || typeof search !== 'string') return {};

  // Normalize: strip leading '?' and split on '?' OR '&' so malformed
  // `?utm_source=a?utm_source=b` becomes two segments, not one entry with
  // a '?' baked in.
  const stripped = search.startsWith('?') ? search.slice(1) : search;
  const segments = stripped.split(/[?&]/).filter(Boolean);

  const result: Record<string, string> = {};
  for (const seg of segments) {
    const eqIdx = seg.indexOf('=');
    if (eqIdx < 0) continue;
    const rawKey = seg.slice(0, eqIdx).toLowerCase().trim();
    if (!UTM_KEYS.includes(rawKey as UtmKey)) continue;

    let rawValue = seg.slice(eqIdx + 1);
    try {
      rawValue = decodeURIComponent(rawValue.replace(/\+/g, ' '));
    } catch {
      // Leave as-is if decoding fails
    }
    const normalized = normalizeValue(rawValue);
    if (!normalized) continue;

    // First-wins: ignore later duplicates of the same key
    if (!(rawKey in result)) {
      result[rawKey] = normalized;
    }
  }

  return result as UtmParams;
}

/**
 * Normalize a single UTM value.
 * - Trim whitespace
 * - Replace em-dashes (we enforce ASCII hyphens across the codebase)
 * - Collapse any internal whitespace to single dashes (so "Leads Campaign"
 *   becomes "leads-campaign")
 * - Lowercase
 * - Cap at MAX_VALUE_LENGTH
 */
export function normalizeValue(raw: string): string {
  if (typeof raw !== 'string') return '';
  let v = raw.trim();
  if (!v) return '';
  v = v.replace(/\u2014/g, '-');
  v = v.replace(/\s+/g, '-');
  v = v.toLowerCase();
  return v.slice(0, MAX_VALUE_LENGTH);
}

/**
 * True if the given user-agent looks like a bot/link-preview/email-scanner.
 * Used to suppress bot clicks from polluting campaign counts.
 */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || typeof userAgent !== 'string') return false;
  const ua = userAgent.toLowerCase();
  return BOT_UA_FRAGMENTS.some((f) => ua.includes(f));
}

/**
 * True if the parsed UTMs contain at least one populated key. Lets callers
 * short-circuit when there's nothing to store.
 */
export function hasAnyUtm(params: UtmParams): boolean {
  return UTM_KEYS.some((k) => typeof params[k] === 'string' && params[k]!.length > 0);
}
