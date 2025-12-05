/**
 * PDF Generation Types
 *
 * Type definitions for the PDF Generation Service.
 * Ported from: /tmp/ea-time-freedom-report/app/utils/generatePDF.ts lines 5-22
 *
 * These interfaces define the structure of PDF generation options, results,
 * S3 upload configuration, and color schemes.
 */

/**
 * Options for PDF generation
 *
 * Controls metadata inclusion, watermarks, and custom color overrides.
 */
export interface PDFGenerationOptions {
  /** Include document metadata (title, author, subject) */
  includeMetadata?: boolean;

  /** Watermark text to display on all pages */
  watermark?: string;

  /** Custom color overrides for PDF styling */
  customColors?: {
    /** Primary color for headings and emphasis (default: #111827) */
    primary?: string;

    /** Secondary color for EA badges and CTA (default: #00cc6a) */
    secondary?: string;

    /** Text color for body content (default: #666666) */
    text?: string;
  };
}

/**
 * Result of PDF generation
 *
 * Contains success status, generated PDF data, and any errors.
 */
export interface PDFGenerationResult {
  /** Whether PDF generation was successful */
  success: boolean;

  /** PDF as Buffer for S3 upload (only on success) */
  buffer?: Buffer;

  /** PDF as base64 string for API response (only on success) */
  base64?: string;

  /** Generated filename with timestamp */
  filename: string;

  /** File size in bytes (only on success) */
  size?: number;

  /** Error message (only on failure) */
  error?: string;
}

/**
 * Options for S3 upload
 *
 * Configures S3 bucket, region, and upload parameters.
 */
export interface S3UploadOptions {
  /** S3 bucket name (required) */
  bucket: string;

  /** AWS region (default: us-east-1) */
  region?: string;

  /** Folder path within bucket (default: reports/) */
  folder?: string;

  /** Content type header (default: application/pdf) */
  contentType?: string;

  /** Content disposition header (default: inline) */
  contentDisposition?: string;

  /** Cache control header (default: max-age=31536000) */
  cacheControl?: string;
}

/**
 * Complete color scheme for PDF generation
 *
 * Defines all colors used in the PDF document.
 */
export interface PDFColorScheme {
  /** Primary color for headings and emphasis */
  primary: string;

  /** Secondary color for EA badges and CTA */
  secondary: string;

  /** Text color for body content */
  text: string;

  /** Light gray for key insights box background */
  lightGray: string;

  /** Border gray for separator lines */
  borderGray: string;
}

/**
 * Default color values for PDF generation
 *
 * Based on production design specifications:
 * - Primary: #111827 (dark text)
 * - Secondary: #00cc6a (EA badge, CTA)
 * - Text: #666666 (body text)
 * - LightGray: #f8f9fa (key insights box)
 * - BorderGray: #e5e7eb (separator lines)
 */
export const PDF_COLOR_DEFAULTS: PDFColorScheme = {
  primary: '#111827',
  secondary: '#00cc6a',
  text: '#666666',
  lightGray: '#f8f9fa',
  borderGray: '#e5e7eb',
} as const;
