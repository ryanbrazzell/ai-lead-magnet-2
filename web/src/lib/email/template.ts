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
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
      
      body {
        font-family: 'DM Sans', Arial, sans-serif;
        line-height: 1.6;
        color: #334155;
        max-width: 600px;
        margin: 0 auto;
        padding: 0;
        background-color: #f1f5f9;
      }
      .wrapper {
        background-color: #f1f5f9;
        padding: 20px;
      }
      .header {
        background-color: #0f172a;
        color: white;
        padding: 40px 30px;
        text-align: center;
        border-radius: 12px 12px 0 0;
      }
      .header h1 {
        font-family: 'DM Serif Display', Georgia, serif;
        font-size: 28px;
        margin: 0 0 8px 0;
        color: #ffffff;
      }
      .header-accent {
        color: #f59e0b;
        font-weight: 600;
      }
      .success-badge {
        display: inline-block;
        background: linear-gradient(135deg, #059669 0%, #10b981 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
      }
      .content {
        background: white;
        padding: 40px 30px;
        border-radius: 0 0 12px 12px;
      }
      .content p {
        margin: 0 0 16px 0;
        color: #475569;
      }
      .content h3 {
        font-family: 'DM Serif Display', Georgia, serif;
        color: #0f172a;
        font-size: 20px;
        margin: 24px 0 12px 0;
      }
      .highlight-box {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border: 2px solid #f59e0b;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
        margin: 24px 0;
      }
      .highlight-box p {
        margin: 0;
        color: #0f172a;
        font-weight: 500;
      }
      .button {
        display: inline-block;
        background-color: #f59e0b;
        color: #0f172a !important;
        padding: 16px 32px;
        text-decoration: none;
        border-radius: 8px;
        margin: 20px 0;
        font-weight: 700;
        font-size: 16px;
      }
      .button:hover {
        background-color: #d97706;
      }
      ul {
        padding-left: 20px;
        margin: 16px 0;
      }
      ul li {
        color: #475569;
        margin-bottom: 8px;
      }
      .footer {
        text-align: center;
        color: #94a3b8;
        font-size: 13px;
        margin-top: 24px;
        padding: 20px;
      }
      .footer a {
        color: #f59e0b;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <div class="success-badge">✓ Report Ready</div>
        <h1>Your <span class="header-accent">Time Freedom Report</span> is Ready!</h1>
      </div>

      <div class="content">
        <p>Hi ${greeting},</p>

        <p>Thank you for taking the first step toward reclaiming your time and productivity. Your personalized <strong>Time Freedom Report</strong> is attached to this email.</p>

        <div class="highlight-box">
          <p>📊 This report shows you exactly which tasks could be delegated to an Executive Assistant, potentially saving you <strong>hours each week</strong>.</p>
        </div>

        <h3>What's Next?</h3>
        <p>Ready to chat with our team about all the areas where an assistant can help you buy back time? Schedule a free consultation below.</p>

        <p style="text-align: center;">
          <a href="${CALENDLY_URL}" class="button">Book Your Free Consultation</a>
        </p>

        <p><strong>During your consultation, we'll:</strong></p>
        <ul>
          <li>Review your Time Freedom Report together</li>
          <li>Discuss your specific needs and preferences</li>
          <li>Show you how our EA matching process works</li>
          <li>Answer any questions you have</li>
        </ul>

        <p>Best regards,<br>
        <strong>The Assistant Launch Team</strong> 🚀</p>
      </div>

      <div class="footer">
        <p>&copy; ${currentYear} Assistant Launch. All rights reserved.</p>
        <p>Questions? Reply to this email or visit <a href="${COMPANY_URL}">assistantlaunch.com</a></p>
      </div>
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
