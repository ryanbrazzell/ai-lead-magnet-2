/**
 * Close CRM Lead Update API Endpoint
 * Task Group 1: Close CRM Integration & API Routes
 *
 * Updates an existing lead in Close CRM with additional data.
 * This is called from Screens 2-6 of the multi-step form.
 *
 * Environment Variables Required:
 * - CLOSE_API_KEY: Your Close CRM API key
 *
 * Request Body:
 * {
 *   leadId: string,
 *   email?: string,
 *   phone?: string,
 *   employees?: number,
 *   revenue?: string,
 *   painPoints?: string,
 *   reportUrl?: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   error?: string
 * }
 *
 * Note: This endpoint uses non-blocking error handling for Screens 2-6.
 * Even if the Close API fails, it returns success: true and logs the error.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, email, phone, employees, revenue, painPoints, reportUrl } = body;

    // Validate required leadId
    if (!leadId) {
      console.error('Lead ID is required for update');
      // Non-blocking: return success anyway
      return NextResponse.json({ success: true });
    }

    // Get API key from environment
    const apiKey = process.env.CLOSE_API_KEY;
    if (!apiKey) {
      console.error('CLOSE_API_KEY environment variable not set');
      // Non-blocking: return success anyway
      return NextResponse.json({ success: true });
    }

    // Build update payload based on provided fields
    const updatePayload: any = {};

    // Email and phone go in contacts array
    if (email || phone) {
      updatePayload.contacts = [{}];
      if (email) {
        updatePayload.contacts[0].emails = [{ email, type: 'office' }];
      }
      if (phone) {
        updatePayload.contacts[0].phones = [{ phone, type: 'office' }];
      }
    }

    // Custom fields for employees, revenue, pain points, and report URL
    // Close CRM uses exact field display names as keys
    if (employees !== undefined || revenue !== undefined || painPoints !== undefined || reportUrl !== undefined) {
      updatePayload.custom = {};
      if (employees !== undefined) {
        updatePayload.custom['Employee Count'] = employees;
      }
      if (revenue !== undefined) {
        updatePayload.custom['Annual Revenue'] = revenue;
      }
      if (painPoints !== undefined) {
        updatePayload.custom['Primary Pain Points'] = painPoints;
      }
      if (reportUrl !== undefined) {
        updatePayload.custom['BBYT Report'] = reportUrl;
      }
    }

    // Update lead in Close CRM
    // Close CRM uses HTTP Basic Authentication: base64(apiKey:)
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
    const closeResponse = await fetch(
      `https://api.close.com/api/v1/lead/${leadId}/`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!closeResponse.ok) {
      const errorText = await closeResponse.text();
      let errorDetails = errorText;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = JSON.stringify(errorJson, null, 2);
        console.error('Close CRM API update error:', {
          status: closeResponse.status,
          error: errorJson,
          payload: updatePayload,
        });
      } catch {
        console.error('Close CRM API update error (raw):', closeResponse.status, errorText);
      }
      
      // Non-blocking: return success anyway for Screens 2-6
      // But log the error for debugging
      return NextResponse.json({ success: true });
    }

    // Success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update-lead endpoint:', error);
    // Non-blocking: return success anyway
    return NextResponse.json({ success: true });
  }
}
