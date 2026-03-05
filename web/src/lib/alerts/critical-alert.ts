/**
 * Critical Alert System
 *
 * Sends alerts when critical failures occur in the lead magnet pipeline.
 * Two channels: Resend email (primary) → Slack webhook (fallback).
 * If both fail, logs to console as last resort.
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

interface AlertDetails {
  error: string;
  endpoint: string;
  userEmail?: string;
  leadId?: string;
  timestamp?: string;
}

/**
 * Send alert via Slack webhook. Used as fallback when Resend is down,
 * and as a real-time notification channel for pipeline events.
 */
export async function sendSlackAlert(
  subject: string,
  details: AlertDetails & { emoji?: string }
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const emoji = details.emoji || ':rotating_light:';
    const lines = [
      `${emoji} *${subject}*`,
      `> *Time:* ${details.timestamp || new Date().toISOString()}`,
      `> *Endpoint:* ${details.endpoint}`,
      `> *Error:* ${details.error}`,
    ];
    if (details.userEmail) lines.push(`> *User Email:* ${details.userEmail}`);
    if (details.leadId) lines.push(`> *Lead ID:* ${details.leadId}`);

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lines.join('\n') }),
    });
  } catch (slackError) {
    console.error('[ALERT] Slack webhook failed:', slackError);
  }
}

/**
 * Send critical alert. Tries Resend email first, falls back to Slack.
 * If both fail, logs to console as last resort.
 */
export async function sendCriticalAlert(subject: string, details: AlertDetails) {
  const timestamp = details.timestamp || new Date().toISOString();
  const detailsWithTime = { ...details, timestamp };

  // Attempt 1: Resend email
  try {
    const client = getResend();
    if (client) {
      await client.emails.send({
        from: 'Lead Magnet Alerts <ryan@assistantlaunch.com>',
        to: ALERT_EMAIL,
        subject: `[ALERT] ${subject}`,
        html: `
          <h2>Lead Magnet Alert: ${subject}</h2>
          <p><strong>Time:</strong> ${timestamp}</p>
          <p><strong>Endpoint:</strong> ${details.endpoint}</p>
          <p><strong>Error:</strong> ${details.error}</p>
          ${details.userEmail ? `<p><strong>User Email:</strong> ${details.userEmail}</p>` : ''}
          ${details.leadId ? `<p><strong>Lead ID:</strong> ${details.leadId}</p>` : ''}
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated alert from your lead magnet system.</p>
        `,
      });
      // Email succeeded — also send to Slack for real-time visibility
      void sendSlackAlert(subject, detailsWithTime);
      return;
    }
  } catch (resendError) {
    console.error('[ALERT] Resend email failed, trying Slack fallback:', resendError);
  }

  // Attempt 2: Slack webhook (fallback)
  try {
    await sendSlackAlert(subject, detailsWithTime);
  } catch (slackError) {
    console.error('[ALERT] All alert channels failed:', {
      subject,
      details: detailsWithTime,
      slackError,
    });
  }
}
