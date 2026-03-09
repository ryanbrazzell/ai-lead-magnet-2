/**
 * API Route: POST /api/webhooks/resend
 *
 * Resend webhook receiver for email delivery events.
 * Tracks deliveries, bounces, complaints, and delays.
 *
 * For every event:
 *   1. Writes a durable audit note to the lead's Close CRM record.
 *   2. Sends a Slack notification for team visibility.
 *
 * Setup in Resend dashboard:
 *   1. Go to https://resend.com/webhooks
 *   2. Add endpoint: https://report.assistantlaunch.com/api/webhooks/resend
 *   3. Select events: email.delivered, email.bounced, email.complained, email.delivery_delayed
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSlackAlert } from '@/lib/alerts/critical-alert';
import { findLeadByEmail, addDurableNote } from '@/lib/close/client';

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce_type?: string;
    complaint_type?: string;
  };
}

// ---------------------------------------------------------------------------
// Note formatters
// ---------------------------------------------------------------------------

function buildDeliveredNote(emailId: string, recipient: string, timestamp: string): string {
  return `
    <div style="border-left: 4px solid #22c55e; padding: 8px 12px; margin: 8px 0;">
      <h3 style="margin: 0 0 8px 0; color: #22c55e;">&#9989; Email Delivered</h3>
      <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipient}</p>
      <p style="margin: 4px 0;"><strong>Resend ID:</strong> ${emailId}</p>
      <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
  `.trim();
}

function buildBouncedNote(emailId: string, recipient: string, timestamp: string, bounceType: string): string {
  return `
    <div style="border-left: 4px solid #ef4444; padding: 8px 12px; margin: 8px 0;">
      <h3 style="margin: 0 0 8px 0; color: #ef4444;">&#10060; Email BOUNCED</h3>
      <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipient}</p>
      <p style="margin: 4px 0;"><strong>Bounce Type:</strong> ${bounceType}</p>
      <p style="margin: 4px 0;"><strong>Resend ID:</strong> ${emailId}</p>
      <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
  `.trim();
}

function buildComplainedNote(emailId: string, recipient: string, timestamp: string, complaintType: string): string {
  return `
    <div style="border-left: 4px solid #ef4444; padding: 8px 12px; margin: 8px 0;">
      <h3 style="margin: 0 0 8px 0; color: #ef4444;">&#10060; Email COMPLAINT</h3>
      <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipient}</p>
      <p style="margin: 4px 0;"><strong>Complaint Type:</strong> ${complaintType}</p>
      <p style="margin: 4px 0;"><strong>Resend ID:</strong> ${emailId}</p>
      <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
  `.trim();
}

function buildDelayedNote(emailId: string, recipient: string, timestamp: string): string {
  return `
    <div style="border-left: 4px solid #eab308; padding: 8px 12px; margin: 8px 0;">
      <h3 style="margin: 0 0 8px 0; color: #eab308;">&#9888;&#65039; Email Delivery Delayed</h3>
      <p style="margin: 4px 0;"><strong>Recipient:</strong> ${recipient}</p>
      <p style="margin: 4px 0;"><strong>Resend ID:</strong> ${emailId}</p>
      <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
    </div>
  `.trim();
}

// ---------------------------------------------------------------------------
// CRM audit writer
// ---------------------------------------------------------------------------

async function writeAuditNote(recipient: string, noteHtml: string): Promise<void> {
  const leadId = await findLeadByEmail(recipient);

  if (!leadId) {
    console.log(`[Resend Webhook] No Close lead found for ${recipient}, cannot write audit note`);
    return;
  }

  const wrote = await addDurableNote(leadId, noteHtml);
  if (wrote) {
    console.log(`[Resend Webhook] Audit note written to lead ${leadId} for ${recipient}`);
  } else {
    console.error(`[Resend Webhook] Failed to write audit note to lead ${leadId} for ${recipient}`);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let event: ResendWebhookEvent;

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const recipient = event.data?.to?.[0] || 'unknown';
  const subject = event.data?.subject || '';
  const emailId = event.data?.email_id || '';
  const timestamp = event.created_at || new Date().toISOString();

  console.log(`[Resend Webhook] ${event.type} | to: ${recipient} | id: ${emailId}`);

  switch (event.type) {
    case 'email.delivered': {
      console.log(`[Resend Webhook] Email delivered to ${recipient}`);

      await writeAuditNote(recipient, buildDeliveredNote(emailId, recipient, timestamp));

      await sendSlackAlert('Email Delivered', {
        emoji: ':white_check_mark:',
        error: `Subject: ${subject}`,
        endpoint: '/api/webhooks/resend',
        userEmail: recipient,
        timestamp,
      });
      break;
    }

    case 'email.bounced': {
      const bounceType = event.data.bounce_type || 'unknown';
      console.error(`[Resend Webhook] BOUNCE: ${recipient} (${bounceType})`);

      await writeAuditNote(recipient, buildBouncedNote(emailId, recipient, timestamp, bounceType));

      await sendSlackAlert('Email BOUNCED', {
        emoji: ':email:',
        error: `Bounce type: ${bounceType}`,
        endpoint: '/api/webhooks/resend',
        userEmail: recipient,
        timestamp,
      });
      break;
    }

    case 'email.complained': {
      const complaintType = event.data.complaint_type || 'unknown';
      console.error(`[Resend Webhook] COMPLAINT: ${recipient}`);

      await writeAuditNote(recipient, buildComplainedNote(emailId, recipient, timestamp, complaintType));

      await sendSlackAlert('Email COMPLAINT', {
        emoji: ':warning:',
        error: `Complaint type: ${complaintType}`,
        endpoint: '/api/webhooks/resend',
        userEmail: recipient,
        timestamp,
      });
      break;
    }

    case 'email.delivery_delayed': {
      console.warn(`[Resend Webhook] Delivery delayed: ${recipient}`);

      await writeAuditNote(recipient, buildDelayedNote(emailId, recipient, timestamp));

      await sendSlackAlert('Email Delivery Delayed', {
        emoji: ':hourglass_flowing_sand:',
        error: `Subject: ${subject}`,
        endpoint: '/api/webhooks/resend',
        userEmail: recipient,
        timestamp,
      });
      break;
    }

    default:
      console.log(`[Resend Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
