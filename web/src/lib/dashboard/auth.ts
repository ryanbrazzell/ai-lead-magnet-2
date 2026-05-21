/**
 * Dashboard auth - server-side only.
 *
 * The password is checked against DASHBOARD_PASSWORD. A successful login
 * gets a cookie whose value is an HMAC keyed by the password itself, so
 * rotating DASHBOARD_PASSWORD instantly invalidates every old cookie.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export const AUTH_COOKIE_NAME = 'al_dashboard_auth';

// Fixed payload the HMAC signs. The secret is the password, so the token
// is unguessable without it and changes when the password changes.
const TOKEN_PAYLOAD = 'al-dashboard-session-v1';

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** True only when `submitted` exactly matches DASHBOARD_PASSWORD. */
export function checkPassword(submitted: string): boolean {
  const real = process.env.DASHBOARD_PASSWORD;
  if (!real || !submitted) return false;
  return timingSafeStringEqual(submitted, real);
}

/** Mint the signed cookie value for a logged-in session. */
export function mintAuthToken(): string {
  const password = process.env.DASHBOARD_PASSWORD ?? '';
  return createHmac('sha256', password).update(TOKEN_PAYLOAD).digest('hex');
}

/** Validate a cookie value. False if unset, malformed, or minted under a different password. */
export function isValidAuthToken(token: string | undefined): boolean {
  if (!token) return false;
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return false;
  const expected = createHmac('sha256', password).update(TOKEN_PAYLOAD).digest('hex');
  return timingSafeStringEqual(token, expected);
}
