/**
 * Gemini AI Client Tests (Task Group 3.1)
 *
 * Tests for the Gemini 2.0 Flash API client including:
 * - API key retrieval (GEMINI_API_KEY primary, GOOGLE_API_KEY fallback)
 * - Request configuration (temperature 0.6, max tokens 3000, JSON response)
 * - 30-second timeout handling
 * - Retry logic on failure (1 retry)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getApiKey,
  createGeminiRequest,
  callGeminiAPI,
  parseGeminiResponse,
  GEMINI_CONFIG,
} from '../gemini-client';
import type { TaskGenerationResult } from '@/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Gemini AI Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear environment variables before each test
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GOOGLE_API_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  /**
   * Test 1: API key retrieval (GEMINI_API_KEY primary, GOOGLE_API_KEY fallback)
   */
  describe('getApiKey', () => {
    it('returns GEMINI_API_KEY when set', () => {
      vi.stubEnv('GEMINI_API_KEY', 'gemini-test-key-123');
      vi.stubEnv('GOOGLE_API_KEY', 'google-fallback-key');

      const apiKey = getApiKey();

      expect(apiKey).toBe('gemini-test-key-123');
    });

    it('falls back to GOOGLE_API_KEY when GEMINI_API_KEY is not set', () => {
      vi.stubEnv('GEMINI_API_KEY', '');
      vi.stubEnv('GOOGLE_API_KEY', 'google-fallback-key');

      const apiKey = getApiKey();

      expect(apiKey).toBe('google-fallback-key');
    });

    it('throws error when neither key is present', () => {
      vi.stubEnv('GEMINI_API_KEY', '');
      vi.stubEnv('GOOGLE_API_KEY', '');

      expect(() => getApiKey()).toThrow(
        'Missing API key: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable'
      );
    });
  });

  /**
   * Test 2: Request configuration (temperature 0.6, max tokens 3000, JSON response)
   */
  describe('Request Configuration', () => {
    it('uses correct Gemini configuration values', () => {
      expect(GEMINI_CONFIG.model).toBe('gemini-2.0-flash');
      expect(GEMINI_CONFIG.temperature).toBe(0.6);
      expect(GEMINI_CONFIG.maxOutputTokens).toBe(3000);
      expect(GEMINI_CONFIG.responseMimeType).toBe('application/json');
      expect(GEMINI_CONFIG.timeout).toBe(30000);
      expect(GEMINI_CONFIG.maxRetries).toBe(1);
    });

    it('creates request with correct configuration', () => {
      const prompt = 'Test prompt for task generation';
      const request = createGeminiRequest(prompt);

      expect(request.contents).toBeDefined();
      expect(request.contents[0].parts[0].text).toBe(prompt);
      expect(request.generationConfig.temperature).toBe(0.6);
      expect(request.generationConfig.maxOutputTokens).toBe(3000);
      expect(request.generationConfig.responseMimeType).toBe('application/json');
    });

    it('constructs correct API endpoint URL', () => {
      const expectedBase =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

      // The full URL includes the API key as a query parameter
      expect(GEMINI_CONFIG.endpoint).toBe(expectedBase);
    });
  });

  /**
   * Test 3: 30-second timeout handling
   */
  describe('Timeout Handling', () => {
    it('aborts request after timeout and converts to timeout error', async () => {
      vi.stubEnv('GEMINI_API_KEY', 'test-api-key');

      // Mock fetch to simulate an AbortError (what happens when timeout triggers)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      mockFetch
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError);

      // The callGeminiAPI should reject with timeout error
      await expect(callGeminiAPI('Test prompt')).rejects.toThrow(
        'Gemini API request timed out after 30000ms'
      );

      // Verify fetch was called (initial + retry = 2 attempts)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('uses AbortController with 30-second signal', async () => {
      vi.stubEnv('GEMINI_API_KEY', 'test-api-key');

      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(createMockTaskResult()) }],
              },
            },
          ],
        }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await callGeminiAPI('Test prompt');

      // Verify fetch was called with signal
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('configures timeout to 30 seconds', () => {
      // Verify the configuration is set correctly
      expect(GEMINI_CONFIG.timeout).toBe(30000);
    });
  });

  /**
   * Test 4: Retry logic on failure (1 retry)
   */
  describe('Retry Logic', () => {
    it('retries once on failure before throwing', async () => {
      vi.stubEnv('GEMINI_API_KEY', 'test-api-key');

      // First call fails, second call succeeds
      const mockSuccessResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(createMockTaskResult()) }],
              },
            },
          ],
        }),
      };

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await callGeminiAPI('Test prompt');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
      expect(result.total_task_count).toBe(30);
    });

    it('throws after retry is exhausted', async () => {
      vi.stubEnv('GEMINI_API_KEY', 'test-api-key');

      // Both calls fail
      mockFetch
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'));

      await expect(callGeminiAPI('Test prompt')).rejects.toThrow(
        'Second failure'
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('retries on non-ok HTTP responses', async () => {
      vi.stubEnv('GEMINI_API_KEY', 'test-api-key');

      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: { message: 'Server error' } }),
      };

      const mockSuccessResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(createMockTaskResult()) }],
              },
            },
          ],
        }),
      };

      mockFetch
        .mockResolvedValueOnce(mockErrorResponse)
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await callGeminiAPI('Test prompt');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('maxRetries is configured to 1', () => {
      expect(GEMINI_CONFIG.maxRetries).toBe(1);
    });
  });

  /**
   * Response parsing tests
   */
  describe('Response Parsing', () => {
    it('parses valid JSON response', () => {
      const mockResult = createMockTaskResult();
      const jsonString = JSON.stringify(mockResult);

      const parsed = parseGeminiResponse(jsonString);

      expect(parsed.total_task_count).toBe(30);
      expect(parsed.ea_task_percent).toBe(50);
      expect(parsed.tasks.daily).toHaveLength(10);
    });

    it('strips markdown code blocks from response', () => {
      const mockResult = createMockTaskResult();
      const wrappedJson = '```json\n' + JSON.stringify(mockResult) + '\n```';

      const parsed = parseGeminiResponse(wrappedJson);

      expect(parsed.total_task_count).toBe(30);
    });

    it('strips json prefix without backticks', () => {
      const mockResult = createMockTaskResult();
      const prefixedJson = 'json\n' + JSON.stringify(mockResult);

      const parsed = parseGeminiResponse(prefixedJson);

      expect(parsed.total_task_count).toBe(30);
    });

    it('throws on invalid JSON', () => {
      const invalidJson = '{ invalid json structure';

      expect(() => parseGeminiResponse(invalidJson)).toThrow(
        /Failed to parse Gemini response/
      );
    });
  });
});

/**
 * Helper function to create a mock TaskGenerationResult
 */
function createMockTaskResult(): TaskGenerationResult {
  const createTasks = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      title: `Task ${i + 1}`,
      description:
        'A detailed task description that explains what needs to be done for this specific task.',
      owner: i % 2 === 0 ? ('EA' as const) : ('You' as const),
      isEA: i % 2 === 0,
      category: 'General',
    }));

  return {
    tasks: {
      daily: createTasks(10),
      weekly: createTasks(10),
      monthly: createTasks(10),
    },
    ea_task_percent: 50,
    ea_task_count: 15,
    total_task_count: 30,
    summary:
      'Based on what I can see, around 50 percent of these tasks could be in the hands of your EA.',
  };
}
