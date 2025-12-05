/**
 * Meta (Facebook) Cookie Tracking Utilities
 *
 * Handles _fbc and _fbp cookies for Meta Conversions API
 * - _fbc: Created from fbclid URL parameter (click ID)
 * - _fbp: Created automatically by Meta Pixel (browser ID)
 */

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Set a cookie with expiration
 */
export function setCookie(name: string, value: string, days: number = 90): void {
  if (typeof document === 'undefined') return;

  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get fbclid from URL query parameters
 */
export function getFbclidFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  return params.get('fbclid');
}

/**
 * Ensure _fbc cookie exists
 * Format: fb.1.<timestamp>.<fbclid>
 *
 * If fbclid is in URL but _fbc doesn't exist, create it
 * Returns the _fbc value (existing or newly created)
 */
export function ensureFbc(): string | null {
  let fbc = getCookie('_fbc');
  const fbclid = getFbclidFromUrl();

  // If we have fbclid in URL but no _fbc cookie, create it
  if (!fbc && fbclid) {
    const timestamp = Date.now();
    fbc = `fb.1.${timestamp}.${fbclid}`;
    setCookie('_fbc', fbc);
  }

  return fbc;
}

/**
 * Get _fbp cookie (created automatically by Meta Pixel)
 * Format: fb.1.<timestamp>.<random>
 */
export function getFbp(): string | null {
  return getCookie('_fbp');
}

/**
 * Get both Meta tracking values
 */
export function getMetaTrackingValues(): {
  fbc: string | null;
  fbp: string | null;
} {
  return {
    fbc: ensureFbc(),
    fbp: getFbp(),
  };
}
