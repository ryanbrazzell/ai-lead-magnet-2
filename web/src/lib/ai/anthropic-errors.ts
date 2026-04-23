import { BadRequestError } from '@anthropic-ai/sdk';

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

export function isUsageCapError(err: unknown): boolean {
  if (!err) return false;

  // Structured path: the Anthropic SDK throws typed errors. A cap hit
  // surfaces as BadRequestError (400) with error.type === 'invalid_request_error'
  // and a body message mentioning usage limits.
  if (err instanceof BadRequestError) {
    const body = (err as { error?: unknown }).error as
      | { error?: { type?: string; message?: string } }
      | undefined;
    const inner = body?.error;
    if (inner?.type === 'invalid_request_error') {
      const msg = String(inner.message || '');
      if (/usage limit/i.test(msg)) return true;
    }
  }

  // Fallback: string-matching (handles wrapped/rethrown errors and SDK
  // version drift). Keep existing patterns.
  const message = err instanceof Error ? err.message : String(err);
  return (
    /reached your specified api usage limits?/i.test(message) ||
    /invalid_request_error[\s\S]*usage limits?/i.test(message)
  );
}
