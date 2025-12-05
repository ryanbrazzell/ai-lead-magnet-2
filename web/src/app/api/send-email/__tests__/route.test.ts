/**
 * API Route Tests for /api/send-email
 *
 * Tests the POST endpoint for sending emails via Mailgun.
 * Reference: Task Group 4.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

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

// Import the POST handler after mocks are in place
import { POST } from '../route';

/**
 * Helper to create a mock NextRequest with JSON body
 */
function createMockRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

/**
 * Sample valid request body
 */
const validRequestBody = {
  to: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  pdfBuffer: Buffer.from('mock-pdf-content').toString('base64'),
};

describe('POST /api/send-email', () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockCreate.mockClear();
    mockClient.mockClear();

    // Reset mock to success state
    mockCreate.mockResolvedValue({
      id: '<mock-message-id@mailgun.org>',
      status: 200,
    });

    // Reset environment variables
    process.env = { ...originalEnv };

    // Set required environment variables for most tests
    process.env.MAILGUN_API_KEY = 'test-api-key';
    process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
    process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  /**
   * Test 1: POST /api/send-email accepts correct request body
   */
  it('accepts correct request body and calls Mailgun with proper options', async () => {
    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify Mailgun was called
    expect(mockCreate).toHaveBeenCalled();

    // Verify the call was made to the correct domain
    const callArgs = mockCreate.mock.calls[0];
    expect(callArgs[0]).toBe('mg.assistantlaunch.com');

    // Verify email options
    const emailOptions = callArgs[1];
    expect(emailOptions.to).toEqual(['test@example.com']);
    expect(emailOptions.from).toContain('Ryan from Assistant Launch');
    expect(emailOptions.subject).toContain('John');
  });

  /**
   * Test 2: Returns 500 if Mailgun config missing
   */
  it('returns 500 if MAILGUN_API_KEY is missing', async () => {
    delete process.env.MAILGUN_API_KEY;

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('API key');
  });

  it('returns 500 if MAILGUN_DOMAIN is missing', async () => {
    delete process.env.MAILGUN_DOMAIN;

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('domain');
  });

  it('returns 500 if MAILGUN_FROM_EMAIL is missing', async () => {
    delete process.env.MAILGUN_FROM_EMAIL;

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('from email');
  });

  /**
   * Test 3: Returns 400 if email address invalid
   */
  it('returns 400 if email address is invalid', async () => {
    const invalidEmailBody = {
      ...validRequestBody,
      to: 'invalid-email',
    };

    const request = createMockRequest(invalidEmailBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid email');
  });

  it('returns 400 if email address is empty', async () => {
    const emptyEmailBody = {
      ...validRequestBody,
      to: '',
    };

    const request = createMockRequest(emptyEmailBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  /**
   * Test 4: Returns success response with messageId on success
   */
  it('returns success response with messageId, status, duration, and timestamp on success', async () => {
    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.messageId).toBe('<mock-message-id@mailgun.org>');
    expect(data.status).toBeDefined();
    expect(data.duration).toBeDefined();
    expect(typeof data.duration).toBe('number');
    expect(data.timestamp).toBeDefined();

    // Validate timestamp is ISO format
    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });

  /**
   * Test 5: Returns detailed error response on Mailgun failure
   */
  it('returns detailed error response when Mailgun API fails', async () => {
    // Make Mailgun fail with a detailed error
    const mailgunError = new Error('Mailgun API error');
    (mailgunError as Error & { status: number; statusText: string }).status =
      401;
    (mailgunError as Error & { status: number; statusText: string }).statusText =
      'Unauthorized';
    mockCreate.mockRejectedValueOnce(mailgunError);

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Failed to send email');
    expect(data.details).toBeDefined();
    expect(data.details.status).toBe(401);
    expect(data.details.statusText).toBe('Unauthorized');
    expect(data.details.message).toBeDefined();
    expect(data.details.timestamp).toBeDefined();
  });

  /**
   * Test 6: Handles missing pdfBuffer gracefully (sends without attachment)
   */
  it('sends email without attachment when pdfBuffer is not provided', async () => {
    const bodyWithoutPdf = {
      to: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const request = createMockRequest(bodyWithoutPdf);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify Mailgun was called without attachment
    const callArgs = mockCreate.mock.calls[0];
    const emailOptions = callArgs[1];
    expect(emailOptions.attachment).toBeUndefined();
  });

  it('continues without attachment if pdfBuffer processing fails', async () => {
    const bodyWithInvalidPdf = {
      to: 'test@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      // Invalid base64 that would cause Buffer.from to behave unexpectedly
      // Note: Buffer.from handles most strings gracefully, so this tests the try-catch block
      pdfBuffer: null,
    };

    const request = createMockRequest(bodyWithInvalidPdf);
    const response = await POST(request);
    const data = await response.json();

    // Should still succeed without attachment
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  /**
   * Additional test: Uses provided HTML when available
   */
  it('uses provided HTML content when available', async () => {
    const customHtml = '<html><body>Custom email content</body></html>';
    const bodyWithHtml = {
      ...validRequestBody,
      html: customHtml,
    };

    const request = createMockRequest(bodyWithHtml);
    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify the custom HTML was used
    const callArgs = mockCreate.mock.calls[0];
    const emailOptions = callArgs[1];
    expect(emailOptions.html).toBe(customHtml);
  });

  /**
   * Additional test: Uses default subject when not provided
   */
  it('uses default subject format with firstName', async () => {
    const request = createMockRequest(validRequestBody);
    await POST(request);

    const callArgs = mockCreate.mock.calls[0];
    const emailOptions = callArgs[1];
    expect(emailOptions.subject).toBe(
      'John, Your Time Freedom Report is Ready'
    );
  });

  it('uses "Hi" fallback in subject when firstName not provided', async () => {
    const bodyWithoutName = {
      to: 'test@example.com',
    };

    const request = createMockRequest(bodyWithoutName);
    await POST(request);

    const callArgs = mockCreate.mock.calls[0];
    const emailOptions = callArgs[1];
    expect(emailOptions.subject).toBe(
      'Hi, Your Time Freedom Report is Ready'
    );
  });
});
