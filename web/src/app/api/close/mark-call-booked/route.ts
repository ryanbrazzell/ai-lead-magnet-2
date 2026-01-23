/**
 * Close CRM Mark Call Booked API Endpoint
 *
 * Updates a lead's status when they book a call through iClosed.
 * Called from the thank-you page after booking confirmation.
 *
 * Environment Variables Required:
 * - CLOSE_API_KEY: Your Close CRM API key
 *
 * Request Body:
 * {
 *   leadId?: string,  // Close CRM lead ID (from localStorage)
 *   email?: string    // Fallback: find lead by email if no leadId
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

// Lead status ID for "Strategy Call Booked"
const STATUS_STRATEGY_CALL_BOOKED = 'stat_DQePUkSNuYYtuwVyfqJ40fOf1KrgwKUqOiUJvTfZ2nP';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, email } = body;

    // Get API key from environment
    const apiKey = process.env.CLOSE_API_KEY;
    if (!apiKey) {
      console.error('CLOSE_API_KEY environment variable not set');
      return NextResponse.json({ success: true }); // Non-blocking
    }

    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

    let targetLeadId = leadId;

    // If no leadId provided, try to find lead by email
    if (!targetLeadId && email) {
      try {
        const searchResponse = await fetch(
          `https://api.close.com/api/v1/lead/?query=email:${encodeURIComponent(email)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data && searchData.data.length > 0) {
            targetLeadId = searchData.data[0].id;
            console.log('Found lead by email:', targetLeadId);
          }
        }
      } catch (searchError) {
        console.error('Error searching for lead by email:', searchError);
      }
    }

    if (!targetLeadId) {
      console.error('No leadId provided and could not find lead by email');
      return NextResponse.json({ success: true }); // Non-blocking
    }

    // Update lead status to "Call Booked"
    const updateResponse = await fetch(
      `https://api.close.com/api/v1/lead/${targetLeadId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          status_id: STATUS_STRATEGY_CALL_BOOKED,
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update lead status:', updateResponse.status, errorText);
      // Non-blocking: still return success
      return NextResponse.json({ success: true });
    }

    // Add a note about the call booking
    try {
      await fetch('https://api.close.com/api/v1/activity/note/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          lead_id: targetLeadId,
          note: `Call booked via Time Freedom Report lead magnet\nBooked at: ${new Date().toISOString()}`,
        }),
      });
    } catch (noteError) {
      console.error('Error adding call booked note:', noteError);
      // Non-critical
    }

    console.log('Lead marked as call booked:', targetLeadId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark-call-booked endpoint:', error);
    return NextResponse.json({ success: true }); // Non-blocking
  }
}
