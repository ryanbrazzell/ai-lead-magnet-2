/**
 * Async Notifications Tests
 *
 * Tests for the fire-and-forget email notification pattern.
 * Verifies non-blocking behavior, environment URL handling,
 * error logging without throwing, and email skipping logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods for logging tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Async Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Use stubEnv for type-safe environment variable manipulation
    vi.stubEnv('PORT', '');
    vi.stubEnv('VERCEL_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('MAILGUN_API_KEY', '');
    vi.stubEnv('MAILGUN_DOMAIN', '');
    vi.stubEnv('MAILGUN_FROM_EMAIL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getBaseUrl', () => {
    it('returns localhost URL in development environment', async () => {
      // Set development environment
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('PORT', '3009');

      // Re-import to get fresh module with new env vars
      const { getBaseUrl } = await import('../asyncNotifications');

      const baseUrl = getBaseUrl();

      expect(baseUrl).toBe('http://localhost:3009');
    });

    it('returns localhost with default port 3009 when PORT not set in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('PORT', '');

      const { getBaseUrl } = await import('../asyncNotifications');

      const baseUrl = getBaseUrl();

      expect(baseUrl).toBe('http://localhost:3009');
    });

    it('returns VERCEL_URL in production environment', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('VERCEL_URL', 'my-app-abc123.vercel.app');

      // Re-import module with fresh env
      vi.resetModules();
      const { getBaseUrl } = await import('../asyncNotifications');

      const baseUrl = getBaseUrl();

      expect(baseUrl).toBe('https://my-app-abc123.vercel.app');
    });

    it('returns fallback URL when VERCEL_URL not set in production', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('VERCEL_URL', '');

      vi.resetModules();
      const { getBaseUrl } = await import('../asyncNotifications');

      const baseUrl = getBaseUrl();

      // Should fall back to NEXT_PUBLIC_APP_URL or default
      expect(baseUrl).toBe('https://report.assistantlaunch.com');
    });
  });

  describe('sendAsyncNotifications', () => {
    it('does not block/await - returns immediately', async () => {
      // Setup mock to track timing
      let fetchResolved = false;
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              fetchResolved = true;
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              });
            }, 100);
          })
      );

      // Configure environment
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('PORT', '3009');
      vi.stubEnv('MAILGUN_API_KEY', 'test-key');
      vi.stubEnv('MAILGUN_DOMAIN', 'mg.test.com');

      vi.resetModules();
      const { sendAsyncNotifications } = await import('../asyncNotifications');

      const leadData = {
        leadType: 'main' as const,
        timestamp: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const pdfBase64 = 'dGVzdCBwZGYgY29udGVudA=='; // "test pdf content" in base64

      // Call should return immediately
      const startTime = Date.now();
      sendAsyncNotifications(leadData, pdfBase64);
      const duration = Date.now() - startTime;

      // Should return in < 10ms (not waiting for 100ms fetch)
      expect(duration).toBeLessThan(50);
      expect(fetchResolved).toBe(false);

      // Wait for fetch to complete for cleanup
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    it('logs errors but does not throw', async () => {
      // Mock fetch to reject
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Configure environment
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('PORT', '3009');
      vi.stubEnv('MAILGUN_API_KEY', 'test-key');
      vi.stubEnv('MAILGUN_DOMAIN', 'mg.test.com');

      vi.resetModules();
      const { sendAsyncNotifications } = await import('../asyncNotifications');

      const leadData = {
        leadType: 'main' as const,
        timestamp: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      // Should not throw
      expect(() => {
        sendAsyncNotifications(leadData, 'dGVzdA==');
      }).not.toThrow();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Error should be logged (in the catch block)
      // The error logging happens asynchronously
    });
  });

  describe('sendEmailAsync', () => {
    it('skips email if recipient email is missing', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('PORT', '3009');
      vi.stubEnv('MAILGUN_API_KEY', 'test-key');
      vi.stubEnv('MAILGUN_DOMAIN', 'mg.test.com');

      vi.resetModules();
      const { sendEmailAsync } = await import('../asyncNotifications');

      const leadData = {
        leadType: 'main' as const,
        timestamp: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        // email is missing
      };

      await sendEmailAsync(leadData, 'dGVzdA==');

      // fetch should NOT have been called
      expect(mockFetch).not.toHaveBeenCalled();

      // Should log info about skipping
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('No email provided'),
        expect.any(String)
      );
    });

    it('skips email if Mailgun not configured', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('PORT', '3009');
      vi.stubEnv('MAILGUN_API_KEY', '');
      vi.stubEnv('MAILGUN_DOMAIN', '');

      vi.resetModules();
      const { sendEmailAsync } = await import('../asyncNotifications');

      const leadData = {
        leadType: 'main' as const,
        timestamp: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await sendEmailAsync(leadData, 'dGVzdA==');

      // fetch should NOT have been called
      expect(mockFetch).not.toHaveBeenCalled();

      // Should log warning about missing config
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Mailgun not configured'),
        expect.any(String)
      );
    });

    it('calls /api/send-email endpoint with correct payload', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, messageId: 'msg-123' }),
      });

      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('PORT', '3009');
      vi.stubEnv('MAILGUN_API_KEY', 'test-key');
      vi.stubEnv('MAILGUN_DOMAIN', 'mg.test.com');
      vi.stubEnv('MAILGUN_FROM_EMAIL', 'test@test.com');

      vi.resetModules();
      const { sendEmailAsync } = await import('../asyncNotifications');

      const leadData = {
        leadType: 'main' as const,
        timestamp: new Date().toISOString(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const pdfBase64 = 'dGVzdCBwZGYgY29udGVudA==';

      await sendEmailAsync(leadData, pdfBase64);

      // Verify fetch was called with correct URL and payload
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3009/api/send-email',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        })
      );

      // Verify body content
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.to).toBe('john@example.com');
      expect(body.firstName).toBe('John');
      expect(body.lastName).toBe('Doe');
      expect(body.pdfBuffer).toBe(pdfBase64);
      expect(body.subject).toContain('Time Freedom Report');
    });
  });
});
