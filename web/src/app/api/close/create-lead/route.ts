/**
 * Close CRM Lead Creation API Endpoint
 * Task Group 1: Close CRM Integration & API Routes
 *
 * Creates a new lead in Close CRM with the user's name and email.
 * This is called from Screen 2 of the multi-step form (after collecting name and email).
 *
 * Environment Variables Required:
 * - CLOSE_API_KEY: Your Close CRM API key
 *
 * Request Body:
 * {
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   meta_fbc?: string,  // Meta Click ID cookie
 *   meta_fbp?: string   // Meta Browser ID cookie
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   leadId?: string,  // Close CRM lead ID
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, meta_fbc, meta_fbp } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.CLOSE_API_KEY;
    if (!apiKey) {
      console.error('CLOSE_API_KEY environment variable not set');
      return NextResponse.json(
        { success: false, error: 'Close CRM API key not configured. Please check your .env.local file and restart the dev server.' },
        { status: 500 }
      );
    }

    // Log API key status for debugging (first 10 chars only for security)
    console.log('Close CRM API Key loaded:', apiKey.substring(0, 10) + '...');

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`;

    // Create lead in Close CRM with name and Meta tracking data
    const leadPayload: Record<string, unknown> = {
      name: fullName,
    };

    // Add Meta tracking cookies as custom fields if present
    // Note: You may need to create these custom fields in Close CRM first
    // Custom fields in Close use format: custom.cf_XXXX or custom.lcf_XXXX
    // For now, we'll store them and they'll be available if custom fields are set up
    if (meta_fbc) {
      leadPayload['custom.meta_fbc'] = meta_fbc;
    }
    if (meta_fbp) {
      leadPayload['custom.meta_fbp'] = meta_fbp;
    }

    // Create lead in Close CRM
    // Close CRM uses HTTP Basic Authentication: base64(apiKey:)
    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
    const closeResponse = await fetch('https://api.close.com/api/v1/lead/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(leadPayload),
    });

    if (!closeResponse.ok) {
      const errorText = await closeResponse.text();
      let errorMessage = 'Failed to create lead in Close CRM';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorJson.error || errorMessage;
        console.error('Close CRM API error details:', {
          status: closeResponse.status,
          error: errorJson,
          rawError: errorText,
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
        });
        
        // Provide more helpful error messages
        if (closeResponse.status === 401) {
          errorMessage = 'Close CRM authentication failed. Please verify your API key is correct and has the necessary permissions.';
        }
      } catch {
        console.error('Close CRM API error (raw):', closeResponse.status, errorText);
        if (closeResponse.status === 401) {
          errorMessage = 'Close CRM authentication failed. Please verify your API key is correct.';
        } else {
          errorMessage = `Close CRM API error: ${errorText}`;
        }
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: closeResponse.status }
      );
    }

    const leadData = await closeResponse.json();
    const leadId = leadData.id;

    // Now update the lead with email using the update endpoint
    if (email && leadId) {
      try {
        const updateResponse = await fetch(`https://api.close.com/api/v1/lead/${leadId}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
          },
          body: JSON.stringify({
            contacts: [{
              emails: [{ email, type: 'office' }],
            }],
          }),
        });

        if (!updateResponse.ok) {
          const updateErrorText = await updateResponse.text();
          console.error('Failed to add email to lead:', updateResponse.status, updateErrorText);
          // Don't fail the whole request - lead was created successfully
          // Email can be added later via update-lead endpoint
        }
      } catch (updateError) {
        console.error('Error adding email to lead:', updateError);
        // Don't fail the whole request - lead was created successfully
      }
    }

    // Return success with lead ID
    return NextResponse.json({
      success: true,
      leadId,
    });
  } catch (error) {
    console.error('Error in create-lead endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
