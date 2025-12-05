/**
 * API Route: POST /api/send-email
 *
 * Sends personalized EA Time Freedom Report emails with PDF attachments via Mailgun.
 *
 * Ported from: /tmp/ea-time-freedom-report/app/api/send-email/route.ts
 *
 * Request Body:
 * {
 *   to: string,           // Recipient email address (required)
 *   firstName?: string,   // For personalization
 *   lastName?: string,    // For PDF filename
 *   pdfBuffer?: string,   // Base64-encoded PDF
 *   html?: string,        // Custom HTML content
 *   subject?: string,     // Custom subject line
 *   from?: string         // Custom from address
 * }
 *
 * Response:
 * Success: { success: true, messageId, status, duration, timestamp }
 * Error: { success: false, error, details? }
 */

import { NextRequest, NextResponse } from 'next/server';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { EmailSendOptions, EmailSendResult, EmailErrorResponse } from '@/types/email';
import { generateEmailHtml, generateEmailText } from '@/lib/email/template';

/** Email address validation regex */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mailgun API base URL */
const MAILGUN_API_URL = 'https://api.mailgun.net';

/**
 * Email options for Mailgun API
 */
interface MailgunEmailOptions {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  attachment?: Array<{
    data: Buffer;
    filename: string;
  }>;
}

/**
 * POST handler for sending emails via Mailgun
 *
 * Accepts email options, validates configuration and recipient,
 * constructs the email with optional PDF attachment, and sends via Mailgun.
 */
export async function POST(request: NextRequest): Promise<NextResponse<EmailSendResult | EmailErrorResponse>> {
  console.log('=== EMAIL API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Validate Mailgun configuration
    // Reference: source route.ts lines 13-35
    if (!process.env.MAILGUN_API_KEY) {
      console.error('MAILGUN_API_KEY is not set!');
      return NextResponse.json(
        { success: false, error: 'Mailgun API key not configured' } as EmailErrorResponse,
        { status: 500 }
      );
    }

    if (!process.env.MAILGUN_DOMAIN) {
      console.error('MAILGUN_DOMAIN is not set!');
      return NextResponse.json(
        { success: false, error: 'Mailgun domain not configured' } as EmailErrorResponse,
        { status: 500 }
      );
    }

    if (!process.env.MAILGUN_FROM_EMAIL) {
      console.error('MAILGUN_FROM_EMAIL is not set!');
      return NextResponse.json(
        { success: false, error: 'Mailgun from email not configured' } as EmailErrorResponse,
        { status: 500 }
      );
    }

    // Initialize Mailgun client
    // Reference: source route.ts lines 37-41
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: MAILGUN_API_URL,
    });

    // Parse request body
    // Reference: source route.ts lines 42-53
    const body = await request.json();
    console.log('Raw request body keys:', Object.keys(body));

    const {
      to,
      firstName,
      lastName,
      pdfBuffer,
      html: providedHtml,
      subject,
      from,
    } = body as EmailSendOptions;

    console.log('Email request data:', {
      to,
      firstName,
      lastName,
      hasPdfBuffer: !!pdfBuffer,
      pdfBufferLength: pdfBuffer ? pdfBuffer.length : 0,
    });

    // Validate email address
    // Reference: source route.ts lines 184-191
    if (!to || !EMAIL_REGEX.test(to)) {
      console.error('Invalid email address:', to);
      return NextResponse.json(
        { success: false, error: 'Invalid email address' } as EmailErrorResponse,
        { status: 400 }
      );
    }

    // Generate email content
    // Use provided HTML or generate default template
    // Reference: source route.ts lines 64-171
    const htmlContent = providedHtml || generateEmailHtml(firstName);
    const textContent = generateEmailText(firstName);

    console.log('\n=== MAILGUN CONFIGURATION ===');
    console.log('Domain:', process.env.MAILGUN_DOMAIN);
    console.log('From email:', process.env.MAILGUN_FROM_EMAIL);
    console.log('API Key exists:', !!process.env.MAILGUN_API_KEY);
    console.log('API Key length:', process.env.MAILGUN_API_KEY?.length);

    // Build email subject
    const emailSubject = subject || `${firstName || 'Hi'}, Your Time Freedom Report is Ready`;

    console.log('\n=== EMAIL DETAILS ===');
    console.log('To:', to);
    console.log('Subject:', emailSubject);

    // Prepare email options
    // Reference: source route.ts lines 194-200
    const emailOptions: MailgunEmailOptions = {
      from: from || `Ryan from Assistant Launch <${process.env.MAILGUN_FROM_EMAIL}>`,
      to: [to],
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    };

    // Add PDF attachment if available
    // Reference: source route.ts lines 203-223
    if (pdfBuffer) {
      console.log('\n=== PDF ATTACHMENT ===');
      console.log('Processing PDF attachment...');
      try {
        const pdfAttachment = Buffer.from(pdfBuffer, 'base64');
        console.log('PDF buffer size:', pdfAttachment.length, 'bytes');
        console.log('PDF seems valid:', pdfAttachment.length > 1000);

        // Mailgun expects 'attachment' as an array
        // Reference: source route.ts lines 212-215
        emailOptions.attachment = [
          {
            data: pdfAttachment,
            filename: `Time_Freedom_Report_${firstName || 'User'}_${lastName || 'Report'}.pdf`,
          },
        ];
        console.log('PDF attachment configuration complete');
      } catch (pdfError) {
        console.error('Error processing PDF:', pdfError);
        console.log('Continuing without attachment...');
        // Continue without attachment - don't fail the request
      }
    } else {
      console.log('No PDF attachment provided');
    }

    console.log('\n=== SENDING EMAIL ===');
    console.log('Email options keys:', Object.keys(emailOptions));

    // Send email and track duration
    // Reference: source route.ts lines 228-245
    try {
      const startTime = Date.now();
      const result = await mg.messages.create(
        process.env.MAILGUN_DOMAIN!,
        emailOptions as Parameters<typeof mg.messages.create>[1]
      );
      const duration = Date.now() - startTime;

      console.log('\n=== EMAIL SENT SUCCESSFULLY ===');
      console.log('Message ID:', result.id);
      console.log('Status:', result.status);
      console.log('Duration:', duration, 'ms');
      console.log('Full Mailgun response:', JSON.stringify(result, null, 2));

      // Return success response
      return NextResponse.json({
        success: true,
        messageId: result.id,
        status: String(result.status),
        duration,
        timestamp: new Date().toISOString(),
      } as EmailSendResult);
    } catch (mailgunError: unknown) {
      // Handle Mailgun-specific errors
      // Reference: source route.ts lines 246-278
      const error = mailgunError as Error & {
        status?: number;
        statusText?: string;
        details?: unknown;
      };

      console.error('\n=== MAILGUN ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Status:', error.status);
      console.error('Status text:', error.statusText);
      console.error('Message:', error.message);
      console.error('Details:', JSON.stringify(error.details, null, 2));

      // Check for specific error types
      if (error.status === 401) {
        console.error('Authentication failed - check API key');
      } else if (error.status === 404) {
        console.error('Domain not found - check MAILGUN_DOMAIN');
      }

      console.error('Full error object:', JSON.stringify(error, null, 2));

      // Return detailed error response
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email via Mailgun',
          details: {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        } as EmailErrorResponse,
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    // Handle unexpected errors
    // Reference: source route.ts lines 279-297
    const err = error as Error;
    console.error('Error in email API route:');
    console.error('Error type:', err.constructor.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Full error object:', error);

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
