import { BadRequestError } from '@anthropic-ai/sdk';

/**
 * Anthropic error classification helpers.
 *
 * Two conditions surface as retryable from the user's perspective:
 *   - Usage cap hit (400 invalid_request_error, "reached your specified API
 *     usage limits"). Every fallback model/prompt returns the exact same
 *     error, so short-circuit the fallback chain.
 *   - Server overloaded (529 overloaded_error, "Overloaded"). Typically
 *     clears in seconds-to-minutes — let the fallback chain run in case
 *     a later attempt catches a free moment, but if all three still fail,
 *     route to the retry queue.
 *
 * Both inherit from RetryableAnthropicError so the pipeline catch block
 * can treat them uniformly: enqueue, skip the red alarm, return a
 * "queued for retry" status.
 */

export class RetryableAnthropicError extends Error {
  readonly underlying?: unknown;

  constructor(message: string, underlying?: unknown) {
    super(message);
    this.name = 'RetryableAnthropicError';
    this.underlying = underlying;
  }
}

export class UsageCapExceededError extends RetryableAnthropicError {
  constructor(message: string, underlying?: unknown) {
    super(message, underlying);
    this.name = 'UsageCapExceededError';
  }
}

export class AnthropicOverloadError extends RetryableAnthropicError {
  constructor(message: string, underlying?: unknown) {
    super(message, underlying);
    this.name = 'AnthropicOverloadError';
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

/**
 * True if the error is an Anthropic 529 Overloaded response. The SDK
 * surfaces this as an APIError subclass with status 529 and
 * error.type === 'overloaded_error'.
 */
export function isOverloadError(err: unknown): boolean {
  if (!err) return false;

  // Structured path via SDK APIError status.
  if (err instanceof Error && 'status' in err) {
    const status = (err as { status?: number }).status;
    if (status === 529) return true;
  }

  // String fallback covers wrapped/rethrown errors and the literal body
  // we've seen in live alerts.
  const message = err instanceof Error ? err.message : String(err);
  return (
    /"type":\s*"overloaded_error"/i.test(message) ||
    /\b529\b[\s\S]*overloaded/i.test(message)
  );
}
