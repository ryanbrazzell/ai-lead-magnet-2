/**
 * API Route: POST /api/webhooks/resend
 *
 * Resend webhook receiver for email delivery events.
 * Tracks bounces, deliveries, and complaints.
 *
 * Setup in Resend dashboard:
 *   1. Go to https://resend.com/webhooks
 *   2. Add endpoint: https://report.assistantlaunch.com/api/webhooks/resend
 *   3. Select events: email.delivered, email.bounced, email.complained
 *
 * On bounce/complaint: sends Slack alert so team can follow up.
 * On delivery: logs for audit trail (visible in Vercel logs).
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendSlackAlert } from '@/lib/alerts/critical-alert';
import { addLeadNote } from '@/lib/close/client';

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce-specific
    bounce_type?: string;
    // Complaint-specific
    complaint_type?: string;
  };
}

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

  console.log(`[Resend Webhook] ${event.type} | to: ${recipient} | id: ${emailId}`);

  switch (event.type) {
    case 'email.delivered':
      console.log(`[Resend Webhook] Email delivered to ${recipient}`);
      break;

    case 'email.bounced':
      console.error(`[Resend Webhook] BOUNCE: ${recipient} (${event.data.bounce_type})`);
      void sendSlackAlert('Email BOUNCED', {
        emoji: ':email:',
        error: `Bounce type: ${event.data.bounce_type || 'unknown'}`,
        endpoint: '/api/webhooks/resend',
        userEmail: recipient,
        timestamp: event.created_at,
      });
      break;

    case 'email.complained':
      console.error(`[Resend Webhook] COMPLAINT: ${recipient}`);
      void sendSlackAlert('Email COMPLAINT', {
        emoji: ':warning:',
        error: `Complaint type: ${event.data.complaint_type || 'unknown'}`,
        endpoint: '/api/webhooks/resend',
        userEmail: recipient,
        timestamp: event.created_at,
      });
      break;

    case 'email.delivery_delayed':
      console.warn(`[Resend Webhook] Delivery delayed: ${recipient}`);
      void sendSlackAlert('Email Delivery Delayed', {
        emoji: ':hourglass_flowing_sand:',
        error: `Subject: ${subject}`,
        endpoint: '/api/webhooks/resend',
        userEmail: recipient,
        timestamp: event.created_at,
      });
      break;

    default:
      console.log(`[Resend Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
