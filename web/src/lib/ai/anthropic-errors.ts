/**
 * Anthropic error classification helpers.
 *
 * We care about one specific condition: the monthly spend cap has been hit.
 * When that happens the API returns a 400 with
 *   type: "invalid_request_error"
 *   message: "You have reached your specified API usage limits..."
 * and every fallback model/prompt will return the exact same error.
 *
 * Detecting this lets us (a) skip the doomed fallback attempts, and (b) route
 * the lead into a silent retry queue instead of surfacing the failure.
 */

export class UsageCapExceededError extends Error {
  readonly underlying?: unknown;

  constructor(message: string, underlying?: unknown) {
    super(message);
    this.name = 'UsageCapExceededError';
    this.underlying = underlying;
  }
}

/**
 * True if the error message indicates the Anthropic spend cap has been hit.
 * Matches the exact phrasing Anthropic returns today, with a fallback regex
 * for the invalid_request_error envelope in case formatting shifts.
 */
export function isUsageCapError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  return (
    /reached your specified api usage limits/i.test(message) ||
    /invalid_request_error[\s\S]*usage limits/i.test(message)
  );
}
