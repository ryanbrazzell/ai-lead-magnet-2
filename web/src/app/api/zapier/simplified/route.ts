/**
 * Zapier Webhook API Endpoint
 * Task Group 2.3: API endpoint for Step 1 Zapier webhook
 *
 * Accepts POST requests with Step 1 form data and forwards to Zapier.
 * Returns success even if webhook fails (non-blocking behavior).
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      title,
      phone,
      source,
      step,
      timestamp,
    } = body;

    // Get webhook URL from environment variable
    const webhookUrl = process.env.VITE_ZAPIER_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('VITE_ZAPIER_WEBHOOK_URL not configured');
      // Return success anyway (non-blocking)
      return NextResponse.json({ success: true, message: 'Webhook URL not configured' });
    }

    // Forward to Zapier webhook
    const zapierResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        title,
        phone,
        source,
        step,
        timestamp,
      }),
    });

    if (!zapierResponse.ok) {
      console.error('Zapier webhook failed:', zapierResponse.statusText);
      // Return success anyway (non-blocking)
      return NextResponse.json({ success: true, message: 'Webhook sent with errors' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Zapier webhook endpoint:', error);
    // Return success anyway (non-blocking)
    return NextResponse.json({ success: true, message: 'Webhook error handled' });
  }
}
