/**
 * Mailgun Email Client
 *
 * Provides Mailgun SDK integration for sending emails with PDF attachments.
 * Ported from /tmp/ea-time-freedom-report/app/api/send-email/route.ts (lines 1-41)
 */
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import type { EmailSendOptions, EmailSendResult } from '@/types/email';
import { generateEmailHtml, generateEmailText } from './template';

/** Mailgun API base URL */
const MAILGUN_API_URL = 'https://api.mailgun.net';

/** Email address validation regex */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Configuration validation result
 */
export interface MailgunConfigResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Error message if configuration is invalid */
  error?: string;
}

/**
 * Email options for Mailgun API
 * Follows Mailgun SDK message data structure
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
 * Validates that all required Mailgun environment variables are set.
 *
 * @returns Configuration validation result
 *
 * @example
 * const config = validateMailgunConfig();
 * if (!config.valid) {
 *   console.error(config.error);
 * }
 */
export function validateMailgunConfig(): MailgunConfigResult {
  if (!process.env.MAILGUN_API_KEY) {
    return {
      valid: false,
      error: 'MAILGUN_API_KEY is not configured',
    };
  }

  if (!process.env.MAILGUN_DOMAIN) {
    return {
      valid: false,
      error: 'MAILGUN_DOMAIN is not configured',
    };
  }

  if (!process.env.MAILGUN_FROM_EMAIL) {
    return {
      valid: false,
      error: 'MAILGUN_FROM_EMAIL is not configured',
    };
  }

  return { valid: true };
}

/**
 * Creates and returns a configured Mailgun client instance.
 *
 * Uses the standard Mailgun API endpoint with 'api' username authentication.
 *
 * @returns Configured Mailgun client
 * @throws Error if MAILGUN_API_KEY is not set
 *
 * @example
 * const client = createMailgunClient();
 * const messages = client.messages;
 */
export function createMailgunClient() {
  const mailgun = new Mailgun(formData);

  return mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY!,
    url: MAILGUN_API_URL,
  });
}

/**
 * Validates an email address format.
 *
 * Uses a simple regex pattern to check for valid email structure.
 *
 * @param email - The email address to validate
 * @returns true if email format is valid, false otherwise
 *
 * @example
 * validateEmailAddress('test@example.com'); // true
 * validateEmailAddress('invalid'); // false
 */
export function validateEmailAddress(email: string): boolean {
  if (!email) {
    return false;
  }
  return EMAIL_REGEX.test(email);
}

/**
 * Sends an email using the Mailgun API.
 *
 * Handles optional PDF attachment conversion from base64 to Buffer,
 * generates HTML and text content using templates, and tracks send duration.
 *
 * @param options - Email sending options including recipient, subject, and optional PDF
 * @returns Promise resolving to send result with messageId, status, and duration
 * @throws Error if Mailgun configuration is invalid or send fails
 *
 * @example
 * const result = await sendEmailWithMailgun({
 *   to: 'recipient@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   pdfBuffer: base64EncodedPdf,
 * });
 * console.log(result.messageId);
 */
export async function sendEmailWithMailgun(
  options: EmailSendOptions
): Promise<EmailSendResult> {
  // Validate configuration
  const configResult = validateMailgunConfig();
  if (!configResult.valid) {
    throw new Error(`Mailgun ${configResult.error}`);
  }

  const { to, firstName, lastName, pdfBuffer, html, subject, from } = options;

  // Validate email address
  if (!validateEmailAddress(to)) {
    throw new Error('Invalid email address');
  }

  // Create Mailgun client
  const mg = createMailgunClient();

  // Generate email content
  const htmlContent = html || generateEmailHtml(firstName);
  const textContent = generateEmailText(firstName);

  // Build email subject
  const emailSubject =
    subject || `${firstName || 'Hi'}, Your Time Freedom Report is Ready`;

  // Build from address
  const fromAddress =
    from || `Ryan from Assistant Launch <${process.env.MAILGUN_FROM_EMAIL}>`;

  // Prepare email options
  const emailOptions: MailgunEmailOptions = {
    from: fromAddress,
    to: [to],
    subject: emailSubject,
    text: textContent,
    html: htmlContent,
  };

  // Add PDF attachment if provided
  if (pdfBuffer) {
    try {
      const pdfAttachment = Buffer.from(pdfBuffer, 'base64');

      // Mailgun expects 'attachment' as an array of CustomFile objects
      emailOptions.attachment = [
        {
          data: pdfAttachment,
          filename: `Time_Freedom_Report_${firstName || 'User'}_${lastName || 'Report'}.pdf`,
        },
      ];
    } catch (pdfError) {
      // Log but continue without attachment if processing fails
      console.error('Error processing PDF attachment:', pdfError);
    }
  }

  // Track send duration
  const startTime = Date.now();

  try {
    // Cast to any to avoid complex Mailgun SDK type requirements
    // This matches the original source pattern from route.ts
    const result = await mg.messages.create(
      process.env.MAILGUN_DOMAIN!,
      emailOptions as Parameters<typeof mg.messages.create>[1]
    );

    const duration = Date.now() - startTime;

    return {
      success: true,
      messageId: result.id,
      status: String(result.status),
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Re-throw with additional context
    const mailgunError = error as Error & {
      status?: number;
      statusText?: string;
    };

    throw new Error(
      `Failed to send email via Mailgun: ${mailgunError.message} (duration: ${duration}ms)`
    );
  }
}
