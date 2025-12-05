/**
 * Async Notification Service for Background Processing
 *
 * Handles email notifications without blocking the main response using
 * a fire-and-forget pattern. Errors are logged but never thrown to ensure
 * the main request flow is not interrupted.
 *
 * Ported from: /tmp/ea-time-freedom-report/app/utils/asyncNotifications.ts
 */

import type { UnifiedLeadData } from '@/types/lead';

/**
 * Simple logging utilities without complex dependencies
 *
 * Provides consistent log formatting with ISO timestamps and
 * optional context serialization.
 */
export const log = {
  /**
   * Log informational messages
   * @param message - The message to log
   * @param context - Optional context object to include
   */
  info: (message: string, context?: unknown): void => {
    console.log(
      `[INFO] ${new Date().toISOString()}: ${message}`,
      context ? JSON.stringify(context) : ''
    );
  },

  /**
   * Log warning messages
   * @param message - The message to log
   * @param context - Optional context object to include
   */
  warn: (message: string, context?: unknown): void => {
    console.warn(
      `[WARN] ${new Date().toISOString()}: ${message}`,
      context ? JSON.stringify(context) : ''
    );
  },

  /**
   * Log error messages
   * @param message - The message to log
   * @param error - Optional error object
   * @param context - Optional context object to include
   */
  error: (message: string, error?: Error, context?: unknown): void => {
    console.error(
      `[ERROR] ${new Date().toISOString()}: ${message}`,
      error?.message || '',
      context ? JSON.stringify(context) : ''
    );
  },
};

/**
 * Get the base URL for internal API calls
 *
 * Determines the appropriate base URL based on the runtime environment:
 * - Development: Uses localhost with PORT or default 3009
 * - Production: Uses VERCEL_URL if available
 * - Fallback: Uses NEXT_PUBLIC_APP_URL or default production URL
 *
 * @returns The base URL string for API calls
 *
 * @example
 * // Development: http://localhost:3009
 * // Production: https://my-app.vercel.app
 * const url = getBaseUrl();
 */
export function getBaseUrl(): string {
  // In development, use the actual port
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || '3009';
    return `http://localhost:${port}`;
  }

  // In production, use Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback to configured app URL or default
  return process.env.NEXT_PUBLIC_APP_URL || 'https://report.assistantlaunch.com';
}

/**
 * Send email notification in the background
 *
 * Calls the internal /api/send-email endpoint to deliver the email.
 * Handles all errors gracefully by logging and returning without throwing.
 *
 * @param leadData - The lead data containing recipient information
 * @param pdfBase64 - Base64-encoded PDF buffer for attachment
 *
 * @example
 * await sendEmailAsync(leadData, pdfBase64);
 * // Errors are logged but not thrown
 */
export async function sendEmailAsync(
  leadData: UnifiedLeadData,
  pdfBase64: string
): Promise<void> {
  try {
    // Skip if no email provided
    if (!leadData.email) {
      log.info('No email provided, skipping email notification');
      return;
    }

    // Skip if Mailgun not configured
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      log.warn('Mailgun not configured, skipping email');
      return;
    }

    // Build email payload
    const emailPayload = {
      to: leadData.email,
      subject: `Your Time Freedom Report is Ready`,
      firstName: leadData.firstName || 'there',
      lastName: leadData.lastName || '',
      pdfBuffer: pdfBase64,
      from: process.env.MAILGUN_FROM_EMAIL || 'noreply@assistantlaunch.com',
    };

    log.info('Sending email notification', {
      to: leadData.email,
      firstName: leadData.firstName,
    });

    // Call the internal send-email endpoint
    const response = await fetch(`${getBaseUrl()}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email send failed: ${response.status} - ${errorText}`);
    }

    log.info('Successfully sent email notification');
  } catch (error) {
    log.error('Failed to send email notification', error as Error, {
      to: leadData.email,
    });
    // Don't throw - this is background processing
  }
}

/**
 * Send async notifications in the background
 *
 * Fire-and-forget pattern - does not block the main response.
 * Initiates email notification without awaiting completion.
 * All errors are caught and logged to ensure the main request
 * flow is never interrupted.
 *
 * @param leadData - The lead data containing recipient information
 * @param pdfBase64 - Base64-encoded PDF buffer for email attachment
 *
 * @example
 * // In your API route - returns immediately
 * sendAsyncNotifications(leadData, pdfBase64);
 * // Continue with response - email sends in background
 */
export function sendAsyncNotifications(
  leadData: UnifiedLeadData,
  pdfBase64: string
): void {
  // Fire and forget - don't await
  Promise.all([sendEmailAsync(leadData, pdfBase64)]).catch((error) => {
    log.error('Background notification failed', error as Error, {
      leadName: `${leadData.firstName} ${leadData.lastName}`,
      hasEmail: !!leadData.email,
    });
    // Log but don't fail the main request
  });
}
