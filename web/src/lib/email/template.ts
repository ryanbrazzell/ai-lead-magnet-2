/**
 * Email Template Generation
 *
 * Generates HTML and plain text email templates for the EA Time Freedom Report.
 * Ported from /tmp/ea-time-freedom-report/app/api/send-email/route.ts (lines 64-171)
 */

/** Calendly URL for discovery call CTA */
const CALENDLY_URL = 'https://calendly.com/assistantlaunch/discovery-call';

/** Company website URL */
const COMPANY_URL = 'https://assistantlaunch.com';

/**
 * Generates the HTML email template for the Time Freedom Report.
 *
 * @param firstName - Optional first name for personalization (falls back to "there")
 * @returns Complete HTML email string
 *
 * @example
 * const html = generateEmailHtml('John');
 * // Returns HTML with "Hi John," greeting
 *
 * const htmlNoName = generateEmailHtml();
 * // Returns HTML with "Hi there," greeting
 */
export function generateEmailHtml(firstName?: string): string {
  const greeting = firstName || 'there';
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Your Time Freedom Report</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #141414;
        color: white;
        padding: 30px;
        text-align: center;
        border-radius: 10px;
      }
      .content {
        padding: 30px 0;
      }
      .button {
        display: inline-block;
        background-color: #00cc6a;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 25px;
        margin: 20px 0;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        color: #666;
        font-size: 14px;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Your Time Freedom Report is Ready!</h1>
    </div>

    <div class="content">
      <p>Hi ${greeting},</p>

      <p>Thank you for taking the first step toward reclaiming your time and productivity. Your personalized Time Freedom Report is attached to this email.</p>

      <p>This report shows you exactly which tasks in your daily, weekly, and monthly routine could be delegated to an Executive Assistant, potentially saving you hours each week.</p>

      <h3>What's Next?</h3>
      <p>If you're ready to chat with our team about all the areas where an assistant can help you buy back time, schedule using the link below or email me here directly.</p>

      <p>
        <a href="${CALENDLY_URL}" class="button">Schedule Your Consultation</a>
      </p>

      <p>During your consultation, we'll:</p>
      <ul>
        <li>Review your Time Freedom Report together</li>
        <li>Discuss your specific needs and preferences</li>
        <li>Show you how our EA matching process works</li>
        <li>Answer any questions you have</li>
      </ul>

      <p>Best regards,<br>
      The Assistant Launch Team</p>
    </div>

    <div class="footer">
      <p>&copy; ${currentYear} Assistant Launch. All rights reserved.</p>
      <p>Questions? Reply to this email or visit <a href="${COMPANY_URL}">assistantlaunch.com</a></p>
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
 * @returns Plain text email string
 *
 * @example
 * const text = generateEmailText('Jane');
 * // Returns plain text with "Hi Jane," greeting
 */
export function generateEmailText(firstName?: string): string {
  const greeting = firstName || 'there';
  const currentYear = new Date().getFullYear();

  return `Hi ${greeting},

Thank you for taking the first step toward reclaiming your time and productivity. Your personalized Time Freedom Report is attached to this email.

This report shows you exactly which tasks in your daily, weekly, and monthly routine could be delegated to an Executive Assistant, potentially saving you hours each week.

What's Next?
If you're ready to chat with our team about all the areas where an assistant can help you buy back time, schedule using the link below or email me here directly.

Schedule Your Consultation: ${CALENDLY_URL}

During your consultation, we'll:
- Review your Time Freedom Report together
- Discuss your specific needs and preferences
- Show you how our EA matching process works
- Answer any questions you have

Best regards,
The Assistant Launch Team

---
© ${currentYear} Assistant Launch. All rights reserved.
Questions? Reply to this email or visit assistantlaunch.com`;
}
