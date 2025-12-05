/**
 * Tests for PDF generation type interfaces (Task Group 1)
 *
 * These tests verify that the PDF-related interfaces correctly define
 * the expected data structures for the PDF Generation Service.
 */
import { describe, it, expect } from 'vitest';
import type {
  PDFGenerationOptions,
  PDFGenerationResult,
  S3UploadOptions,
  PDFColorScheme,
} from '../pdf';
import { PDF_COLOR_DEFAULTS } from '../pdf';

describe('PDF Type Interfaces', () => {
  /**
   * Test 1: PDFGenerationOptions interface structure
   */
  describe('PDFGenerationOptions interface', () => {
    it('accepts all optional configuration fields', () => {
      const options: PDFGenerationOptions = {
        includeMetadata: true,
        watermark: 'DRAFT',
        customColors: {
          primary: '#000000',
          secondary: '#00ff00',
          text: '#333333',
        },
      };

      expect(options.includeMetadata).toBe(true);
      expect(options.watermark).toBe('DRAFT');
      expect(options.customColors?.primary).toBe('#000000');
      expect(options.customColors?.secondary).toBe('#00ff00');
      expect(options.customColors?.text).toBe('#333333');
    });

    it('accepts empty options object', () => {
      const emptyOptions: PDFGenerationOptions = {};

      expect(emptyOptions.includeMetadata).toBeUndefined();
      expect(emptyOptions.watermark).toBeUndefined();
      expect(emptyOptions.customColors).toBeUndefined();
    });

    it('accepts partial customColors', () => {
      const partialColors: PDFGenerationOptions = {
        customColors: {
          primary: '#111827',
        },
      };

      expect(partialColors.customColors?.primary).toBe('#111827');
      expect(partialColors.customColors?.secondary).toBeUndefined();
    });
  });

  /**
   * Test 2: PDFGenerationResult interface structure
   */
  describe('PDFGenerationResult interface', () => {
    it('contains success result with all fields', () => {
      const successResult: PDFGenerationResult = {
        success: true,
        buffer: Buffer.from('PDF content'),
        base64: 'UERGIGNvbnRlbnQ=',
        filename: 'EA_Time_Freedom_Report_John_Doe_2024-01-15.pdf',
        size: 12345,
      };

      expect(successResult.success).toBe(true);
      expect(successResult.buffer).toBeInstanceOf(Buffer);
      expect(successResult.base64).toBeDefined();
      expect(successResult.filename).toContain('EA_Time_Freedom_Report');
      expect(successResult.size).toBe(12345);
      expect(successResult.error).toBeUndefined();
    });

    it('contains error result with required fields', () => {
      const errorResult: PDFGenerationResult = {
        success: false,
        filename: 'EA_Time_Freedom_Report_Error_1705312200000.pdf',
        error: 'PDF generation failed: invalid input',
      };

      expect(errorResult.success).toBe(false);
      expect(errorResult.filename).toBeDefined();
      expect(errorResult.error).toContain('PDF generation failed');
      expect(errorResult.buffer).toBeUndefined();
      expect(errorResult.base64).toBeUndefined();
      expect(errorResult.size).toBeUndefined();
    });
  });

  /**
   * Test 3: S3UploadOptions interface structure
   */
  describe('S3UploadOptions interface', () => {
    it('accepts all upload configuration fields', () => {
      const options: S3UploadOptions = {
        bucket: 'my-bucket',
        region: 'us-west-2',
        folder: 'reports/',
        contentType: 'application/pdf',
        contentDisposition: 'inline',
        cacheControl: 'max-age=31536000',
      };

      expect(options.bucket).toBe('my-bucket');
      expect(options.region).toBe('us-west-2');
      expect(options.folder).toBe('reports/');
      expect(options.contentType).toBe('application/pdf');
      expect(options.contentDisposition).toBe('inline');
      expect(options.cacheControl).toBe('max-age=31536000');
    });

    it('accepts minimal required fields only', () => {
      const minimalOptions: S3UploadOptions = {
        bucket: 'my-bucket',
      };

      expect(minimalOptions.bucket).toBe('my-bucket');
      expect(minimalOptions.region).toBeUndefined();
      expect(minimalOptions.folder).toBeUndefined();
    });
  });

  /**
   * Test 4: PDFColorScheme interface structure and defaults
   */
  describe('PDFColorScheme interface', () => {
    it('accepts complete color scheme', () => {
      const colors: PDFColorScheme = {
        primary: '#111827',
        secondary: '#00cc6a',
        text: '#666666',
        lightGray: '#f8f9fa',
        borderGray: '#e5e7eb',
      };

      expect(colors.primary).toBe('#111827');
      expect(colors.secondary).toBe('#00cc6a');
      expect(colors.text).toBe('#666666');
      expect(colors.lightGray).toBe('#f8f9fa');
      expect(colors.borderGray).toBe('#e5e7eb');
    });

    it('has correct default color values', () => {
      expect(PDF_COLOR_DEFAULTS.primary).toBe('#111827');
      expect(PDF_COLOR_DEFAULTS.secondary).toBe('#00cc6a');
      expect(PDF_COLOR_DEFAULTS.text).toBe('#666666');
      expect(PDF_COLOR_DEFAULTS.lightGray).toBe('#f8f9fa');
      expect(PDF_COLOR_DEFAULTS.borderGray).toBe('#e5e7eb');
    });

    it('defaults match production design specifications', () => {
      // Verify against spec design constants
      const defaults = PDF_COLOR_DEFAULTS;

      // Primary: dark text color
      expect(defaults.primary).toBe('#111827');

      // Secondary: EA badge and CTA green
      expect(defaults.secondary).toBe('#00cc6a');

      // Text: body text gray
      expect(defaults.text).toBe('#666666');

      // Light gray: key insights box background
      expect(defaults.lightGray).toBe('#f8f9fa');

      // Border gray: separator lines
      expect(defaults.borderGray).toBe('#e5e7eb');
    });
  });
});
