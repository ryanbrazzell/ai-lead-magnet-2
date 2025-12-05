/**
 * Email Service Type Definitions
 *
 * Types for the Mailgun email integration including request/response
 * interfaces for the send-email API endpoint.
 */

/**
 * Request body for the POST /api/send-email endpoint
 *
 * Used to send personalized emails with optional PDF attachments
 * via the Mailgun service.
 */
export interface EmailSendOptions {
  /** Recipient email address (required) */
  to: string;

  /** Recipient first name for personalization */
  firstName?: string;

  /** Recipient last name for PDF filename */
  lastName?: string;

  /** Base64-encoded PDF buffer for attachment */
  pdfBuffer?: string;

  /** Custom HTML content (uses default template if not provided) */
  html?: string;

  /** Custom email subject line */
  subject?: string;

  /** Custom from address */
  from?: string;
}

/**
 * Success response from the send-email API
 *
 * Returned when email is successfully queued for delivery.
 */
export interface EmailSendResult {
  /** Indicates successful email submission */
  success: boolean;

  /** Mailgun message ID for tracking */
  messageId?: string;

  /** Mailgun status (e.g., "Queued") */
  status?: string;

  /** Time in milliseconds to send the email */
  duration?: number;

  /** ISO timestamp of when the email was sent */
  timestamp: string;
}

/**
 * Detailed error information from Mailgun
 *
 * Contains HTTP status and error details from the Mailgun API.
 */
export interface MailgunErrorDetails {
  /** HTTP status code from Mailgun */
  status?: number;

  /** HTTP status text from Mailgun */
  statusText?: string;

  /** Error message describing the failure */
  message?: string;

  /** ISO timestamp of when the error occurred */
  timestamp?: string;
}

/**
 * Error response from the send-email API
 *
 * Returned when email sending fails due to configuration,
 * validation, or Mailgun API errors.
 */
export interface EmailErrorResponse {
  /** Always false for error responses */
  success: false;

  /** Human-readable error message */
  error: string;

  /** Detailed Mailgun error information */
  details?: MailgunErrorDetails;
}
