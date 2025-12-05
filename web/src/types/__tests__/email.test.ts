/**
 * Tests for Email Service type interfaces (Task Group 1)
 *
 * These tests verify that the email-related interfaces correctly define
 * the expected data structures for the Email Service.
 */
import { describe, it, expect } from 'vitest';
import type {
  EmailSendOptions,
  EmailSendResult,
  EmailErrorResponse,
  MailgunErrorDetails,
} from '../email';

describe('Email Type Interfaces', () => {
  /**
   * Test 1: EmailSendOptions interface has required and optional fields
   */
  describe('EmailSendOptions interface', () => {
    it('accepts required "to" field and optional personalization fields', () => {
      const options: EmailSendOptions = {
        to: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        pdfBuffer: 'base64encodedpdfcontent==',
      };

      expect(options.to).toBe('user@example.com');
      expect(options.firstName).toBe('John');
      expect(options.lastName).toBe('Doe');
      expect(options.pdfBuffer).toBeDefined();
    });

    it('accepts optional html, subject, and from fields', () => {
      const options: EmailSendOptions = {
        to: 'user@example.com',
        html: '<h1>Custom HTML</h1>',
        subject: 'Custom Subject',
        from: 'sender@example.com',
      };

      expect(options.to).toBe('user@example.com');
      expect(options.html).toBe('<h1>Custom HTML</h1>');
      expect(options.subject).toBe('Custom Subject');
      expect(options.from).toBe('sender@example.com');
    });

    it('accepts minimal options with only required "to" field', () => {
      const minimalOptions: EmailSendOptions = {
        to: 'user@example.com',
      };

      expect(minimalOptions.to).toBe('user@example.com');
      expect(minimalOptions.firstName).toBeUndefined();
      expect(minimalOptions.lastName).toBeUndefined();
      expect(minimalOptions.pdfBuffer).toBeUndefined();
      expect(minimalOptions.html).toBeUndefined();
      expect(minimalOptions.subject).toBeUndefined();
      expect(minimalOptions.from).toBeUndefined();
    });
  });

  /**
   * Test 2: EmailSendResult interface has required fields for success response
   */
  describe('EmailSendResult interface', () => {
    it('contains success result with all expected fields', () => {
      const successResult: EmailSendResult = {
        success: true,
        messageId: 'msg-12345',
        status: 'Queued',
        duration: 250,
        timestamp: '2024-01-15T10:30:00.000Z',
      };

      expect(successResult.success).toBe(true);
      expect(successResult.messageId).toBe('msg-12345');
      expect(successResult.status).toBe('Queued');
      expect(successResult.duration).toBe(250);
      expect(successResult.timestamp).toBeDefined();
    });

    it('accepts minimal success result with required fields only', () => {
      const minimalResult: EmailSendResult = {
        success: true,
        timestamp: '2024-01-15T10:30:00.000Z',
      };

      expect(minimalResult.success).toBe(true);
      expect(minimalResult.timestamp).toBeDefined();
      expect(minimalResult.messageId).toBeUndefined();
      expect(minimalResult.status).toBeUndefined();
      expect(minimalResult.duration).toBeUndefined();
    });
  });

  /**
   * Test 3: EmailErrorResponse interface structure
   */
  describe('EmailErrorResponse interface', () => {
    it('contains error response with required fields', () => {
      const errorResponse: EmailErrorResponse = {
        success: false,
        error: 'Failed to send email via Mailgun',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Failed to send email via Mailgun');
      expect(errorResponse.details).toBeUndefined();
    });

    it('contains error response with detailed Mailgun error info', () => {
      const detailedError: EmailErrorResponse = {
        success: false,
        error: 'Failed to send email via Mailgun',
        details: {
          status: 401,
          statusText: 'Unauthorized',
          message: 'Authentication failed - check API key',
          timestamp: '2024-01-15T10:30:00.000Z',
        },
      };

      expect(detailedError.success).toBe(false);
      expect(detailedError.error).toBeDefined();
      expect(detailedError.details?.status).toBe(401);
      expect(detailedError.details?.statusText).toBe('Unauthorized');
      expect(detailedError.details?.message).toContain('Authentication failed');
      expect(detailedError.details?.timestamp).toBeDefined();
    });
  });

  /**
   * Test 4: MailgunErrorDetails interface structure
   */
  describe('MailgunErrorDetails interface', () => {
    it('accepts all optional error detail fields', () => {
      const errorDetails: MailgunErrorDetails = {
        status: 404,
        statusText: 'Not Found',
        message: 'Domain not found - check MAILGUN_DOMAIN',
        timestamp: '2024-01-15T10:30:00.000Z',
      };

      expect(errorDetails.status).toBe(404);
      expect(errorDetails.statusText).toBe('Not Found');
      expect(errorDetails.message).toContain('Domain not found');
      expect(errorDetails.timestamp).toBeDefined();
    });

    it('accepts partial error details', () => {
      const partialDetails: MailgunErrorDetails = {
        status: 500,
      };

      expect(partialDetails.status).toBe(500);
      expect(partialDetails.statusText).toBeUndefined();
      expect(partialDetails.message).toBeUndefined();
      expect(partialDetails.timestamp).toBeUndefined();
    });

    it('accepts empty error details object', () => {
      const emptyDetails: MailgunErrorDetails = {};

      expect(emptyDetails.status).toBeUndefined();
      expect(emptyDetails.statusText).toBeUndefined();
      expect(emptyDetails.message).toBeUndefined();
      expect(emptyDetails.timestamp).toBeUndefined();
    });
  });
});
