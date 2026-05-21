/**
 * /report A/B test - variation assignment and gating.
 *
 * The test is GATED on NEXT_PUBLIC_REPORT_VIDEO_URL. With no valid video
 * URL configured the test is dark: assignVariation() returns null and
 * everyone sees the control page.
 */

export type Variation = 'control' | 'video';

const COOKIE_NAME = 'al_report_variation';
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Validate and normalize the configured video URL to an embeddable form.
 * Returns null if unset or not a usable URL (which keeps the test dark).
 */
export function getReportVideoUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_REPORT_VIDEO_URL ?? '').trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  // youtu.be/<id>  ->  youtube.com/embed/<id>
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  // youtube.com/watch?v=<id>  ->  youtube.com/embed/<id>
  if (host === 'youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // already an /embed/ URL, or some other youtube path - pass through
    return raw;
  }

  // Loom, Vimeo, or anything else: pass the URL through as-is and let the
  // iframe load it. Ryan is responsible for supplying an embeddable URL.
  return raw;
}

/** True when a valid video URL is configured, i.e. the test should run. */
export function isReportTestLive(): boolean {
  return getReportVideoUrl() !== null;
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
 * Safety fallback: v=video only renders the video layout when a video is
 * actually configured; otherwise it falls back to control.
 */
export function readVariationParam(params: Pick<URLSearchParams, 'get'>): Variation {
  if (params.get('v') === 'video' && isReportTestLive()) return 'video';
  return 'control';
}
