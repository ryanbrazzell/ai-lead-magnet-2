/**
 * /report A/B test - variation assignment and gating.
 *
 * The test is GATED on the Vidalytics VSL config. When either env var is
 * blank the test is dark: assignVariation() returns null and everyone
 * sees the control page.
 */

export type Variation = 'control' | 'video' | 'january-rollback';

export interface VidalyticsConfig {
  /** Raw embed ID (without the "vidalytics_embed_" prefix). */
  embedId: string;
  /** Account shard segment of the player URL. */
  shard: string;
}

const COOKIE_NAME = 'al_report_variation';
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Read the Vidalytics VSL config from env. Returns null if either var is
 * unset (which keeps the test dark).
 */
export function getVidalyticsConfig(): VidalyticsConfig | null {
  const embedId = (process.env.NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID ?? '').trim();
  const shard = (process.env.NEXT_PUBLIC_VIDALYTICS_VSL_SHARD ?? '').trim();
  if (!embedId || !shard) return null;
  return { embedId, shard };
}

/** True when a Vidalytics VSL is configured, i.e. the test should run. */
export function isReportTestLive(): boolean {
  return getVidalyticsConfig() !== null;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

function isVariation(value: string | null): value is Variation {
  return value === 'control' || value === 'video';
}

/**
 * Assign this visitor a variation, called once at form submit.
 * - Returns null when the test is not live (caller records nothing).
 * - Reuses the cookie if present (same-browser stickiness).
 * - Otherwise rolls 50/50 and persists the result to the cookie.
 */
export function assignVariation(): Variation | null {
  if (!isReportTestLive()) return null;

  const existing = readCookie(COOKIE_NAME);
  if (isVariation(existing)) return existing;

  const rolled: Variation = Math.random() < 0.5 ? 'control' : 'video';
  writeCookie(COOKIE_NAME, rolled);
  return rolled;
}

/**
 * Read the variation the /report page should render, from its URL params.
 * Safety fallback: v=video only renders the video layout when a VSL is
 * actually configured; otherwise it falls back to control.
 */
export function readVariationParam(params: Pick<URLSearchParams, 'get'>): Variation {
  if (params.get('v') === 'video' && isReportTestLive()) return 'video';
  return 'control';
}
