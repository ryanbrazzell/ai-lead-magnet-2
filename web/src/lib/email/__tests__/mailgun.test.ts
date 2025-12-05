/**
 * Tests for Mailgun Client Layer (Task Group 3)
 *
 * These tests verify that the Mailgun client is correctly configured,
 * environment variables are validated, and email sending functions
 * work as expected.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EmailSendOptions } from '@/types/email';

// Create mock functions for Mailgun
const mockCreate = vi.fn().mockResolvedValue({
  id: '<mock-message-id@mailgun.org>',
  status: 200,
});

const mockClient = vi.fn().mockReturnValue({
  messages: {
    create: mockCreate,
  },
});

// Mock mailgun.js module with proper class implementation
vi.mock('mailgun.js', () => {
  return {
    default: class MockMailgun {
      client = mockClient;
    },
  };
});

// Mock form-data module
vi.mock('form-data', () => {
  return {
    default: class MockFormData {},
  };
});

describe('Mailgun Client Layer', () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset mocks before each test
    mockCreate.mockClear();
    mockClient.mockClear();
    mockCreate.mockResolvedValue({
      id: '<mock-message-id@mailgun.org>',
      status: 200,
    });

    // Reset environment variables before each test
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * Test 1: Client initialization with correct config
   */
  describe('createMailgunClient', () => {
    it('initializes client with correct config (username: api, url: https://api.mailgun.net)', async () => {
      // Set required env vars
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      // Import fresh module after setting env
      const { createMailgunClient } = await import('../mailgun');

      createMailgunClient();

      // Verify client was called with correct config
      expect(mockClient).toHaveBeenCalledWith({
        username: 'api',
        key: 'test-api-key',
        url: 'https://api.mailgun.net',
      });
    });
  });

  /**
   * Test 2: Environment variable validation
   */
  describe('validateMailgunConfig', () => {
    it('returns valid: true when all environment variables are set', async () => {
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      const { validateMailgunConfig } = await import('../mailgun');
      const result = validateMailgunConfig();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns error when MAILGUN_API_KEY is missing', async () => {
      delete process.env.MAILGUN_API_KEY;
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      const { validateMailgunConfig } = await import('../mailgun');
      const result = validateMailgunConfig();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('MAILGUN_API_KEY');
    });

    it('returns error when MAILGUN_DOMAIN is missing', async () => {
      process.env.MAILGUN_API_KEY = 'test-api-key';
      delete process.env.MAILGUN_DOMAIN;
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      const { validateMailgunConfig } = await import('../mailgun');
      const result = validateMailgunConfig();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('MAILGUN_DOMAIN');
    });

    it('returns error when MAILGUN_FROM_EMAIL is missing', async () => {
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      delete process.env.MAILGUN_FROM_EMAIL;

      const { validateMailgunConfig } = await import('../mailgun');
      const result = validateMailgunConfig();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('MAILGUN_FROM_EMAIL');
    });
  });

  /**
   * Test 3: Email sending with attachment array format
   */
  describe('sendEmailWithMailgun', () => {
    it('sends email with attachment in correct array format', async () => {
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      const { sendEmailWithMailgun } = await import('../mailgun');

      // Create a base64 encoded PDF buffer (simple test data)
      const testPdfContent = 'test pdf content';
      const base64PdfBuffer = Buffer.from(testPdfContent).toString('base64');

      const options: EmailSendOptions = {
        to: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        pdfBuffer: base64PdfBuffer,
        subject: 'Test Subject',
      };

      await sendEmailWithMailgun(options);

      // Verify the create function was called
      expect(mockCreate).toHaveBeenCalled();

      // Get the call arguments
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];

      // Verify attachment format is correct array
      expect(emailOptions.attachment).toBeDefined();
      expect(Array.isArray(emailOptions.attachment)).toBe(true);
      expect(emailOptions.attachment.length).toBe(1);
      expect(emailOptions.attachment[0]).toHaveProperty('data');
      expect(emailOptions.attachment[0]).toHaveProperty('filename');
      expect(emailOptions.attachment[0].filename).toBe(
        'Time_Freedom_Report_John_Doe.pdf'
      );
    });

    it('sends email without attachment when pdfBuffer not provided', async () => {
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      const { sendEmailWithMailgun } = await import('../mailgun');

      const options: EmailSendOptions = {
        to: 'test@example.com',
        firstName: 'Jane',
      };

      await sendEmailWithMailgun(options);

      // Get the call arguments
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];

      // Verify no attachment was added
      expect(emailOptions.attachment).toBeUndefined();
    });
  });

  /**
   * Test 4: PDF buffer conversion from base64
   */
  describe('PDF buffer conversion', () => {
    it('correctly converts base64 pdfBuffer to Buffer for attachment', async () => {
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      const { sendEmailWithMailgun } = await import('../mailgun');

      // Create known test data
      const originalContent = 'This is test PDF content for conversion';
      const base64Encoded = Buffer.from(originalContent).toString('base64');

      const options: EmailSendOptions = {
        to: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        pdfBuffer: base64Encoded,
      };

      await sendEmailWithMailgun(options);

      // Get the attachment data from the call
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];
      const attachmentBuffer = emailOptions.attachment[0].data;

      // Verify it's a Buffer
      expect(Buffer.isBuffer(attachmentBuffer)).toBe(true);

      // Verify the content matches the original after decoding
      expect(attachmentBuffer.toString()).toBe(originalContent);
    });
  });

  /**
   * Test 5: Error handling for missing configuration
   */
  describe('Error handling', () => {
    it('throws error when trying to send email without valid configuration', async () => {
      delete process.env.MAILGUN_API_KEY;
      delete process.env.MAILGUN_DOMAIN;
      delete process.env.MAILGUN_FROM_EMAIL;

      const { sendEmailWithMailgun } = await import('../mailgun');

      const options: EmailSendOptions = {
        to: 'test@example.com',
        firstName: 'Test',
      };

      await expect(sendEmailWithMailgun(options)).rejects.toThrow(
        /not configured/i
      );
    });

    it('throws error when Mailgun API call fails', async () => {
      process.env.MAILGUN_API_KEY = 'test-api-key';
      process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
      process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';

      // Set up failing mock for this test
      mockCreate.mockRejectedValueOnce(new Error('Mailgun API error'));

      const { sendEmailWithMailgun } = await import('../mailgun');

      const options: EmailSendOptions = {
        to: 'test@example.com',
        firstName: 'Test',
      };

      await expect(sendEmailWithMailgun(options)).rejects.toThrow(
        /Failed to send email/
      );
    });
  });

  /**
   * Test for email validation utility
   */
  describe('validateEmailAddress', () => {
    it('returns true for valid email addresses', async () => {
      const { validateEmailAddress } = await import('../mailgun');

      expect(validateEmailAddress('test@example.com')).toBe(true);
      expect(validateEmailAddress('user.name@domain.org')).toBe(true);
      expect(validateEmailAddress('user+tag@example.co.uk')).toBe(true);
    });

    it('returns false for invalid email addresses', async () => {
      const { validateEmailAddress } = await import('../mailgun');

      expect(validateEmailAddress('')).toBe(false);
      expect(validateEmailAddress('invalid')).toBe(false);
      expect(validateEmailAddress('missing@')).toBe(false);
      expect(validateEmailAddress('@nodomain.com')).toBe(false);
      expect(validateEmailAddress('spaces in@email.com')).toBe(false);
    });
  });
});
