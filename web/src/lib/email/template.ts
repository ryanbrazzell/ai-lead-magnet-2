/**
 * Email Template Generation
 *
 * Generates HTML and plain text email templates for the EA Time Freedom Report.
 * Ported from /tmp/ea-time-freedom-report/app/api/send-email/route.ts (lines 64-171)
 */

/** Base URL for the standalone booking page */
const BOOKING_PAGE_URL = 'https://report.assistantlaunch.com/book-call';

/** Company website URL */
const COMPANY_URL = 'https://assistantlaunch.com';

/**
 * Builds booking page URL with pre-filled user data.
 * Points to our /book-call page which renders the iClosed widget with the same
 * pre-fill approach as the report page CTA section.
 */
function buildBookingUrl(userData?: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}): string {
  if (!userData) return BOOKING_PAGE_URL;

  const params = new URLSearchParams();

  if (userData.firstName) params.set('firstName', userData.firstName);
  if (userData.lastName) params.set('lastName', userData.lastName);
  if (userData.email) params.set('email', userData.email);
  if (userData.phone) params.set('phone', userData.phone);

  return params.toString() ? `${BOOKING_PAGE_URL}?${params.toString()}` : BOOKING_PAGE_URL;
}

export interface EmailUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * Generates the HTML email template for the Time Freedom Report.
 *
 * @param firstName - Optional first name for personalization (falls back to "there")
 * @param userData - Optional user data for pre-filling the booking URL
 * @returns Complete HTML email string
 *
 * @example
 * const html = generateEmailHtml('John', { firstName: 'John', email: 'john@example.com', phone: '+15551234567' });
 * // Returns HTML with "Hi John," greeting and pre-filled booking URL
 */
export function generateEmailHtml(firstName?: string, userData?: EmailUserData, downloadUrl?: string): string {
  const greeting = firstName || 'there';
  const bookingUrl = buildBookingUrl(userData);
  const downloadLink = downloadUrl
    ? `<p style="margin: 0 0 20px 0;"><a href="${downloadUrl}" style="color: #f59e0b; font-weight: bold;">View and download your report here</a></p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #333333;">
  <div style="max-width: 600px;">
    <p style="margin: 0 0 16px 0;">Hey ${greeting},</p>

    <p style="margin: 0 0 16px 0;">Your Time Freedom Report is ready. It's also attached to this email as a PDF.</p>

    ${downloadLink}<p style="margin: 0 0 16px 0;">This report was built specifically for you based on the information you shared. Inside you'll find a breakdown of tasks in your business and personal life that could be handed off to an Executive Assistant, organized by the four core areas where delegation creates the most leverage:</p>

    <p style="margin: 0 0 4px 0;">1. Email ownership</p>
    <p style="margin: 0 0 4px 0;">2. Calendar ownership</p>
    <p style="margin: 0 0 4px 0;">3. Personal life ownership</p>
    <p style="margin: 0 0 16px 0;">4. Recurring business processes</p>

    <p style="margin: 0 0 16px 0;">The report also covers what it actually takes to succeed with an Executive Assistant - it's not just about finding someone, it's about having the right person, the right systems, and the right support to integrate them (and you).</p>

    <p style="margin: 0 0 16px 0;">If any of it resonates and you want to talk through what this could look like for you, I'll walk through the gaps in your report and show you how the top-performing founders and executives are operating differently. 3-4 weeks and your life can look completely different than it does right now.</p>

    <p style="margin: 0 0 8px 0; font-weight: bold;">On this call, we'll cover:</p>
    <p style="margin: 0 0 4px 0;">&#10003; Your top 5 tasks to delegate immediately</p>
    <p style="margin: 0 0 4px 0;">&#10003; Which EA profile matches your business</p>
    <p style="margin: 0 0 16px 0;">&#10003; Your 30-day delegation map to get you performing at the highest level</p>

    <p style="margin: 0 0 24px 0;"><a href="${bookingUrl}" style="display: inline-block; background: #f59e0b; color: #0f172a; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">Book Your EA Delegation Roadmap Call</a></p>

    <p style="margin: 0 0 4px 0;">Talk soon,</p>
    <p style="margin: 0 0 4px 0;"><strong>Ryan Brazzell</strong></p>
    <p style="margin: 0 0 0 0; color: #666666; font-size: 14px;">Founder, Assistant Launch</p>
  </div>
</body>
</html>`;
}

/**
 * Generates the plain text email template for the Time Freedom Report.
 *
 * Mirrors the HTML content structure without formatting for email clients
 * that block or don't support HTML.
 *
 * @param firstName - Optional first name for personalization (falls back to "there")
 * @param userData - Optional user data for pre-filling the booking URL
 * @returns Plain text email string
 *
 * @example
 * const text = generateEmailText('Jane', { firstName: 'Jane', email: 'jane@example.com', phone: '+15551234567' });
 * // Returns plain text with "Hi Jane," greeting and pre-filled booking URL
 */
export function generateEmailText(firstName?: string, userData?: EmailUserData, downloadUrl?: string): string {
  const greeting = firstName || 'there';
  const bookingUrl = buildBookingUrl(userData);
  const downloadLine = downloadUrl ? `\nView and download your report here: ${downloadUrl}\n` : '';

  return `Hey ${greeting},

Your Time Freedom Report is ready. It's also attached to this email as a PDF.
${downloadLine}
This report was built specifically for you based on the information you shared. Inside you'll find a breakdown of tasks in your business and personal life that could be handed off to an Executive Assistant, organized by the four core areas where delegation creates the most leverage:

1. Email ownership
2. Calendar ownership
3. Personal life ownership
4. Recurring business processes

The report also covers what it actually takes to succeed with an Executive Assistant - it's not just about finding someone, it's about having the right person, the right systems, and the right support to integrate them (and you).

If any of it resonates and you want to talk through what this could look like for you, I'll walk through the gaps in your report and show you how the top-performing founders and executives are operating differently. 3-4 weeks and your life can look completely different than it does right now.

On this call, we'll cover:
✓ Your top 5 tasks to delegate immediately
✓ Which EA profile matches your business
✓ Your 30-day delegation map to get you performing at the highest level

Book your EA Delegation Roadmap Call: ${bookingUrl}

Talk soon,
Ryan Brazzell
Founder, Assistant Launch`;
}
