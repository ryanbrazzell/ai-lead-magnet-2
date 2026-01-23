/**
 * API Route: POST /api/send-email
 *
 * Sends personalized EA Time Freedom Report emails with PDF attachments via Resend.
 *
 * Request Body:
 * {
 *   to: string,           // Recipient email address (required)
 *   firstName?: string,   // For personalization
 *   lastName?: string,    // For PDF filename
 *   pdfBuffer?: string,   // Base64-encoded PDF
 *   html?: string,        // Custom HTML content
 *   subject?: string,     // Custom subject line
 * }
 *
 * Response:
 * Success: { success: true, messageId, timestamp }
 * Error: { success: false, error, details? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import type { EmailSendOptions, EmailSendResult, EmailErrorResponse } from '@/types/email';
import { generateEmailHtml } from '@/lib/email/template';

/** Email address validation regex */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Initialize Resend client lazily to avoid build errors */
let resend: Resend | null = null;
function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');
  }
  return resend;
}

/**
 * POST handler for sending emails via Resend
 */
export async function POST(request: NextRequest): Promise<NextResponse<EmailSendResult | EmailErrorResponse>> {
  console.log('=== EMAIL API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Validate Resend configuration
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set!');
      return NextResponse.json(
        { success: false, error: 'Resend API key not configured' } as EmailErrorResponse,
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('Raw request body keys:', Object.keys(body));

    const {
      to,
      firstName,
      lastName,
      phone,
      pdfBuffer,
      html: providedHtml,
      subject,
    } = body as EmailSendOptions & { phone?: string };

    console.log('Email request data:', {
      to,
      firstName,
      lastName,
      phone,
      hasPdfBuffer: !!pdfBuffer,
      pdfBufferLength: pdfBuffer ? pdfBuffer.length : 0,
    });

    // Validate email address
    if (!to || !EMAIL_REGEX.test(to)) {
      console.error('Invalid email address:', to);
      return NextResponse.json(
        { success: false, error: 'Invalid email address' } as EmailErrorResponse,
        { status: 400 }
      );
    }

    // Generate email content with pre-filled booking URL
    const userData = { firstName, lastName, email: to, phone };
    const htmlContent = providedHtml || generateEmailHtml(firstName, userData);

    // Build email subject
    const emailSubject = subject || `${firstName || 'Hi'}, Your Time Freedom Report is Ready`;

    console.log('\n=== EMAIL DETAILS ===');
    console.log('To:', to);
    console.log('Subject:', emailSubject);

    // Prepare attachments if PDF is provided
    const attachments = pdfBuffer ? [
      {
        filename: `EA-Time-Freedom-Report-${firstName || 'User'}.pdf`,
        content: pdfBuffer, // Resend accepts base64 string directly
      },
    ] : undefined;

    if (pdfBuffer) {
      console.log('PDF attachment configured, base64 length:', pdfBuffer.length);
    }

    // Send email via Resend
    console.log('\n=== SENDING EMAIL VIA RESEND ===');
    const startTime = Date.now();

    const { data, error } = await getResendClient().emails.send({
      from: 'Ryan at Assistant Launch <ryan@assistantlaunch.com>',
      to: to,
      subject: emailSubject,
      html: htmlContent,
      attachments,
    });

    const duration = Date.now() - startTime;

    if (error) {
      console.error('\n=== RESEND ERROR ===');
      console.error('Error:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email via Resend',
          details: {
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        } as EmailErrorResponse,
        { status: 500 }
      );
    }

    console.log('\n=== EMAIL SENT SUCCESSFULLY ===');
    console.log('Message ID:', data?.id);
    console.log('Duration:', duration, 'ms');

    // Return success response
    return NextResponse.json({
      success: true,
      messageId: data?.id,
      status: 'sent',
      duration,
      timestamp: new Date().toISOString(),
    } as EmailSendResult);

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in email API route:');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process email request',
        details: {
          message: err.message,
        },
      } as EmailErrorResponse,
      { status: 500 }
    );
  }
}
