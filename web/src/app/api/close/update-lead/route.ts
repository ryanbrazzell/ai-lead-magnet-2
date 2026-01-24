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
    const { leadId, email, phone, employees, revenue, painPoints, reportUrl, reportGenerated, reportFilename } = body;

    // Custom field IDs for Close CRM
    const CUSTOM_FIELDS = {
      painPoints: 'cf_8Y2FFKdfC1RFNPPJrf0KSXmhteiUBKE7mVphDEufevm',
      revenue: 'cf_3ZBZfCabFHWwranwv1nyY1aPU2oLd6TuAcWGlZepQpZ',
      timeFreedomReportUrl: 'cf_qiHCe6NXTEKZQHLU1rxM091VUQGfMTlpMefEx1tSQAI',
    };

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

    // Close CRM uses HTTP Basic Authentication: base64(apiKey:)
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

    // For phone updates, we need to update the contact directly via the contacts endpoint
    // Otherwise we'd overwrite existing contact data (like email)
    if (phone) {
      try {
        // First, get the lead to find the contact ID
        const leadResponse = await fetch(
          `https://api.close.com/api/v1/lead/${leadId}/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
          }
        );

        if (leadResponse.ok) {
          const leadData = await leadResponse.json();
          const contactId = leadData.contacts?.[0]?.id;

          if (contactId) {
            // Update the contact directly with the phone number
            const contactResponse = await fetch(
              `https://api.close.com/api/v1/contact/${contactId}/`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader,
                },
                body: JSON.stringify({
                  phones: [{ phone, type: 'office' }],
                }),
              }
            );

            if (!contactResponse.ok) {
              const errorText = await contactResponse.text();
              console.error('Failed to update contact with phone:', contactResponse.status, errorText);
            }
          }
        }
      } catch (error) {
        console.error('Error updating contact with phone:', error);
      }
    }

    // Email updates (if needed separately) - also use contacts endpoint
    if (email && !phone) {
      // Only if email is being updated without phone
      updatePayload.contacts = [{ emails: [{ email, type: 'office' }] }];
    }

    // Custom fields using Close CRM field IDs
    if (revenue !== undefined) {
      updatePayload[`custom.${CUSTOM_FIELDS.revenue}`] = revenue;
    }
    if (painPoints !== undefined) {
      updatePayload[`custom.${CUSTOM_FIELDS.painPoints}`] = painPoints;
    }
    // Store report URL when report is generated
    if (reportGenerated && reportFilename) {
      // Construct the full report URL
      const reportFullUrl = `https://report.assistantlaunch.com/api/reports/${reportFilename}`;
      updatePayload[`custom.${CUSTOM_FIELDS.timeFreedomReportUrl}`] = reportFullUrl;
    }
    if (reportUrl !== undefined) {
      updatePayload[`custom.${CUSTOM_FIELDS.timeFreedomReportUrl}`] = reportUrl;
    }

    // Update lead in Close CRM (for custom fields, etc.)
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
