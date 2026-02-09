/**
 * Critical Alert System
 *
 * Sends email alerts to the business owner when critical failures occur
 * in the lead magnet pipeline (AI generation, PDF, email delivery).
 *
 * Fire-and-forget: alert failures never break the main flow.
 */

import { Resend } from 'resend';

const ALERT_EMAIL = 'ryan@assistantlaunch.com';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendCriticalAlert(
  subject: string,
  details: {
    error: string;
    endpoint: string;
    userEmail?: string;
    leadId?: string;
    timestamp?: string;
  }
) {
  try {
    const client = getResend();
    if (!client) return;

    await client.emails.send({
      from: 'Lead Magnet Alerts <ryan@assistantlaunch.com>',
      to: ALERT_EMAIL,
      subject: `[ALERT] ${subject}`,
      html: `
        <h2>Lead Magnet Alert: ${subject}</h2>
        <p><strong>Time:</strong> ${details.timestamp || new Date().toISOString()}</p>
        <p><strong>Endpoint:</strong> ${details.endpoint}</p>
        <p><strong>Error:</strong> ${details.error}</p>
        ${details.userEmail ? `<p><strong>User Email:</strong> ${details.userEmail}</p>` : ''}
        ${details.leadId ? `<p><strong>Lead ID:</strong> ${details.leadId}</p>` : ''}
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated alert from your lead magnet system.</p>
      `,
    });
  } catch (alertError) {
    // Alert sending should never break the main flow
    console.error('Failed to send critical alert:', alertError);
  }
}
