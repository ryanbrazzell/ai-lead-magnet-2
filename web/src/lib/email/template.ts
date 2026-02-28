/**
 * Email Template Generation
 *
 * Generates HTML and plain text email templates for the EA Time Freedom Report.
 * Ported from /tmp/ea-time-freedom-report/app/api/send-email/route.ts (lines 64-171)
 */

/** Base iClosed booking URL for discovery call CTA */
const BOOKING_BASE_URL = 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';

/** Company website URL */
const COMPANY_URL = 'https://assistantlaunch.com';

/**
 * Builds iClosed booking URL with pre-filled user data
 */
function buildBookingUrl(userData?: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}): string {
  if (!userData) return BOOKING_BASE_URL;

  const params = new URLSearchParams();
  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');

  if (fullName) params.set('iclosedName', fullName);
  if (userData.email) params.set('iclosedEmail', userData.email);

  // Format phone for iClosed - strip the +1 prefix if present, keep just digits
  if (userData.phone) {
    const phoneDigits = userData.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('1') && phoneDigits.length === 11
      ? phoneDigits.slice(1)
      : phoneDigits;
    params.set('iclosedPhone', formattedPhone);
  }

  params.set('timeFormat', '12h');

  return params.toString() ? `${BOOKING_BASE_URL}?${params.toString()}` : BOOKING_BASE_URL;
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
    ? `<p style="margin: 0 0 20px 0;"><a href="${downloadUrl}" style="color: #0D7377; font-weight: bold;">View and download your report here</a></p>`
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

    <p style="margin: 0 0 16px 0;">The report also covers what it actually takes to succeed with an assistant - it's not just about finding someone, it's about having the right person, the right systems, and the right support behind them.</p>

    <p style="margin: 0 0 16px 0;">If any of it resonates and you want to talk through what this could look like for you, book a time with me here:</p>

    <p style="margin: 0 0 24px 0;"><a href="${bookingUrl}" style="color: #0D7377; font-weight: bold;">Book your free time audit call</a></p>

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

The report also covers what it actually takes to succeed with an assistant - it's not just about finding someone, it's about having the right person, the right systems, and the right support behind them.

If any of it resonates and you want to talk through what this could look like for you, book a time with me here:

${bookingUrl}

Talk soon,
Ryan Brazzell
Founder, Assistant Launch`;
}
