/**
 * Integration Tests for Email Service
 *
 * These tests verify end-to-end workflows and critical integration
 * points across the email service components.
 * Reference: Task Group 6.3
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

// Mock mailgun.js module
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
import { POST } from '@/app/api/send-email/route';

/**
 * Helper to create a mock NextRequest with JSON body
 */
function createMockRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('Email Service Integration Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockClear();
    mockClient.mockClear();
    mockCreate.mockResolvedValue({
      id: '<mock-message-id@mailgun.org>',
      status: 200,
    });
    process.env = { ...originalEnv };
    process.env.MAILGUN_API_KEY = 'test-api-key';
    process.env.MAILGUN_DOMAIN = 'mg.assistantlaunch.com';
    process.env.MAILGUN_FROM_EMAIL = 'ryan@assistantlaunch.com';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  /**
   * Integration Test 1: End-to-end happy path
   * Complete flow: API receives request -> validates -> sends email -> returns success
   */
  describe('End-to-end happy path', () => {
    it('completes full email delivery workflow with all fields', async () => {
      const requestBody = {
        to: 'recipient@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        pdfBuffer: Buffer.from('PDF content here').toString('base64'),
        subject: 'Your Custom Report',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Verify request was accepted
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.messageId).toBeDefined();

      // Verify Mailgun was called with correct configuration
      expect(mockCreate).toHaveBeenCalledWith(
        'mg.assistantlaunch.com',
        expect.objectContaining({
          from: expect.stringContaining('Ryan from Assistant Launch'),
          to: ['recipient@example.com'],
          subject: 'Your Custom Report',
          html: expect.any(String),
          text: expect.any(String),
          attachment: expect.arrayContaining([
            expect.objectContaining({
              filename: 'Time_Freedom_Report_Alice_Johnson.pdf',
            }),
          ]),
        })
      );

      // Verify response includes metadata
      expect(typeof data.duration).toBe('number');
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });

    it('completes workflow with minimal required fields', async () => {
      const requestBody = {
        to: 'simple@example.com',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Verify minimal request succeeds
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify email was still sent
      expect(mockCreate).toHaveBeenCalled();

      // Verify subject uses fallback
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];
      expect(emailOptions.subject).toContain('Hi');
      expect(emailOptions.subject).toContain('Time Freedom Report');

      // Verify no attachment
      expect(emailOptions.attachment).toBeUndefined();
    });
  });

  /**
   * Integration Test 2: Error scenarios - Mailgun API failures
   */
  describe('Error scenario: Mailgun 401 Unauthorized', () => {
    it('handles authentication failure with detailed error response', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;
      (authError as any).statusText = 'Unauthorized';
      (authError as any).response = {
        status: 401,
        statusText: 'Unauthorized',
      };
      mockCreate.mockRejectedValueOnce(authError);

      const requestBody = {
        to: 'test@example.com',
        firstName: 'Bob',
        lastName: 'Smith',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Verify error response
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to send email');

      // Verify detailed error information
      expect(data.details).toBeDefined();
      expect(data.details.status).toBe(401);
      expect(data.details.statusText).toBe('Unauthorized');
      expect(data.details.timestamp).toBeDefined();
    });
  });

  /**
   * Integration Test 3: Error scenario - 404 Domain not found
   */
  describe('Error scenario: Mailgun 404 Not Found', () => {
    it('handles domain not found error with specific error message', async () => {
      const domainError = new Error('Not Found');
      (domainError as any).status = 404;
      (domainError as any).statusText = 'Not Found';
      mockCreate.mockRejectedValueOnce(domainError);

      const requestBody = {
        to: 'test@example.com',
        firstName: 'Carol',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Verify error response
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);

      // Verify error details capture the 404
      expect(data.details).toBeDefined();
      expect(data.details.status).toBe(404);
      expect(data.details.statusText).toBe('Not Found');
    });
  });

  /**
   * Integration Test 4: Edge case - sending without PDF
   */
  describe('Edge case: Email without PDF attachment', () => {
    it('successfully sends email when no PDF buffer provided', async () => {
      const requestBody = {
        to: 'nopdf@example.com',
        firstName: 'David',
        lastName: 'Brown',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Verify success
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify Mailgun was called without attachment
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];
      expect(emailOptions.attachment).toBeUndefined();

      // Verify email was still sent with all other fields
      expect(emailOptions.to).toEqual(['nopdf@example.com']);
      expect(emailOptions.subject).toContain('David');
    });

    it('continues gracefully when pdfBuffer is invalid', async () => {
      const requestBody = {
        to: 'invalidpdf@example.com',
        firstName: 'Eve',
        pdfBuffer: 'not-valid-base64!!!',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Should still send without crashing
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  /**
   * Integration Test 5: Edge case - missing firstName with template
   */
  describe('Edge case: Email with missing firstName', () => {
    it('uses fallback "there" personalization when firstName is missing', async () => {
      const requestBody = {
        to: 'noname@example.com',
        lastName: 'Unknown',
        pdfBuffer: Buffer.from('test').toString('base64'),
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify subject uses fallback
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];
      expect(emailOptions.subject).toBe(
        'Hi, Your Time Freedom Report is Ready'
      );

      // Verify HTML template uses fallback
      expect(emailOptions.html).toContain('Hi there');
    });
  });

  /**
   * Integration Test 6: Template integration with API
   */
  describe('Email template integration', () => {
    it('generates correct HTML and text templates in API response', async () => {
      const requestBody = {
        to: 'template@example.com',
        firstName: 'Frank',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify templates were generated
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];

      // Check HTML template
      expect(emailOptions.html).toContain('Hi Frank,');
      expect(emailOptions.html).toContain('Time Freedom Report');
      expect(emailOptions.html).toContain(
        'https://calendly.com/assistantlaunch/discovery-call'
      );
      expect(emailOptions.html).toContain('#00cc6a'); // Green CTA button
      expect(emailOptions.html).toContain('assistantlaunch.com');

      // Check text template
      expect(emailOptions.text).toContain('Hi Frank,');
      expect(emailOptions.text).toContain(
        'https://calendly.com/assistantlaunch/discovery-call'
      );
    });

    it('respects custom HTML when provided', async () => {
      const customHtml = '<html><body>Custom Email Template</body></html>';
      const requestBody = {
        to: 'custom@example.com',
        firstName: 'Grace',
        html: customHtml,
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      await response.json();

      // Verify custom HTML was used
      const callArgs = mockCreate.mock.calls[0];
      const emailOptions = callArgs[1];
      expect(emailOptions.html).toBe(customHtml);
    });
  });

  /**
   * Integration Test 7: Configuration validation integration
   */
  describe('Configuration validation in workflow', () => {
    it('returns specific error when API key is missing during send attempt', async () => {
      delete process.env.MAILGUN_API_KEY;

      const requestBody = {
        to: 'test@example.com',
        firstName: 'Henry',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/API key|configured/i);

      // Verify Mailgun was not called
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('validates email format before attempting send', async () => {
      const requestBody = {
        to: 'not-an-email',
        firstName: 'Ivan',
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email');

      // Verify Mailgun was not called for invalid email
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  /**
   * Integration Test 8: Complete async workflow simulation
   * (tests the integration without full async, verifying the API would work with sendEmailAsync)
   */
  describe('Async notification integration readiness', () => {
    it('API endpoint properly formats response for async consumption', async () => {
      const requestBody = {
        to: 'async@example.com',
        firstName: 'Jack',
        lastName: 'Miller',
        pdfBuffer: Buffer.from('report-data').toString('base64'),
      };

      const request = createMockRequest(requestBody);
      const response = await POST(request);
      const data = await response.json();

      // Verify response structure matches what sendEmailAsync expects
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('messageId');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('duration');

      // Verify response can be serialized (for fetch body)
      const jsonString = JSON.stringify(data);
      expect(jsonString).toBeDefined();
      const parsed = JSON.parse(jsonString);
      expect(parsed.success).toBe(true);
    });

    it('API handles various request patterns for fire-and-forget usage', async () => {
      const testCases = [
        {
          to: 'user1@example.com',
          firstName: 'Kate',
          lastName: 'Davis',
        },
        {
          to: 'user2@example.com',
          firstName: 'Laura',
        },
        {
          to: 'user3@example.com',
        },
      ];

      for (const testCase of testCases) {
        mockCreate.mockClear();

        const request = createMockRequest(testCase);
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockCreate).toHaveBeenCalled();
      }
    });
  });
});
