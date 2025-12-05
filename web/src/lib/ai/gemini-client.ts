/**
 * Gemini AI Client for Task Generation
 *
 * Integrates with Gemini 2.0 Flash model for generating personalized
 * task reports. Ported from: /tmp/ea-time-freedom-report/app/utils/unifiedPromptJSON.ts
 *
 * Configuration:
 * - Model: gemini-2.0-flash (stable, fast, good quality)
 * - Temperature: 0.6
 * - Max Output Tokens: 3000
 * - Response MIME Type: application/json
 * - Timeout: 30 seconds
 * - Retries: 1
 *
 * Note: gemini-2.5-flash was tested but has JSON response compatibility issues.
 * gemini-2.0-flash provides reliable, fast responses with good quality.
 */

import type { TaskGenerationResult } from '@/types';

/**
 * Gemini API configuration
 */
export const GEMINI_CONFIG = {
  model: 'gemini-2.0-flash',
  endpoint:
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  temperature: 0.6,
  maxOutputTokens: 3000,
  responseMimeType: 'application/json',
  timeout: 30000, // 30 seconds
  maxRetries: 1,
} as const;

/**
 * Gemini API request structure
 */
interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType: string;
  };
}

/**
 * Gemini API response structure
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message: string;
    code?: number;
  };
}

/**
 * Get API key from environment variables
 *
 * Priority:
 * 1. GEMINI_API_KEY (primary)
 * 2. GOOGLE_API_KEY (fallback)
 *
 * @returns The API key string
 * @throws Error if neither key is present
 */
export function getApiKey(): string {
  const geminiKey = process.env.GEMINI_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;

  if (geminiKey && geminiKey.trim() !== '') {
    return geminiKey;
  }

  if (googleKey && googleKey.trim() !== '') {
    return googleKey;
  }

  throw new Error(
    'Missing API key: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable'
  );
}

/**
 * Create a Gemini API request body
 *
 * @param prompt - The prompt to send to Gemini
 * @returns Formatted request body
 */
export function createGeminiRequest(prompt: string): GeminiRequest {
  return {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: GEMINI_CONFIG.temperature,
      maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
      responseMimeType: GEMINI_CONFIG.responseMimeType,
    },
  };
}

/**
 * Parse Gemini response with defensive JSON handling
 *
 * Handles common response issues:
 * - Markdown code blocks (```json ... ```)
 * - Leading "json" prefix
 * - Extra whitespace
 *
 * @param responseText - Raw response text from Gemini
 * @returns Parsed TaskGenerationResult
 * @throws Error if parsing fails
 */
export function parseGeminiResponse(responseText: string): TaskGenerationResult {
  let cleanedText = responseText.trim();

  // Strip markdown code blocks
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.slice(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.slice(3);
  }

  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(0, -3);
  }

  // Strip leading "json" if present (without backticks)
  if (cleanedText.startsWith('json\n')) {
    cleanedText = cleanedText.slice(5);
  }

  cleanedText = cleanedText.trim();

  try {
    const parsed = JSON.parse(cleanedText) as TaskGenerationResult;
    return parsed;
  } catch (error) {
    const parseError = error as Error;
    throw new Error(
      `Failed to parse Gemini response: ${parseError.message}. Response preview: ${cleanedText.slice(0, 200)}...`
    );
  }
}

/**
 * Call the Gemini API with timeout and retry logic
 *
 * @param prompt - The prompt to send
 * @returns TaskGenerationResult from the API
 * @throws Error if all retries fail
 */
export async function callGeminiAPI(
  prompt: string
): Promise<TaskGenerationResult> {
  const apiKey = getApiKey();
  const url = `${GEMINI_CONFIG.endpoint}?key=${apiKey}`;
  const requestBody = createGeminiRequest(prompt);

  let lastError: Error | null = null;
  let attempt = 0;
  const maxAttempts = GEMINI_CONFIG.maxRetries + 1; // 1 initial + 1 retry = 2 attempts

  while (attempt < maxAttempts) {
    attempt++;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, GEMINI_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error?.message) {
            errorMessage = `Gemini API error: ${errorBody.error.message}`;
          }
        } catch {
          // Ignore JSON parsing errors for error response
        }

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as GeminiResponse;

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      if (
        !data.candidates ||
        data.candidates.length === 0 ||
        !data.candidates[0].content?.parts?.[0]?.text
      ) {
        throw new Error(
          'Gemini API returned empty or invalid response structure'
        );
      }

      const responseText = data.candidates[0].content.parts[0].text;
      return parseGeminiResponse(responseText);
    } catch (error) {
      clearTimeout(timeoutId);

      const err = error as Error;

      // Handle abort/timeout specifically
      if (err.name === 'AbortError') {
        lastError = new Error(
          `Gemini API request timed out after ${GEMINI_CONFIG.timeout}ms`
        );
      } else {
        lastError = err;
      }

      // Log retry attempt
      if (attempt < maxAttempts) {
        console.warn(
          `Gemini API attempt ${attempt} failed, retrying...`,
          lastError.message
        );
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('Gemini API call failed after all retries');
}

/**
 * Generate tasks using Gemini AI
 *
 * High-level function that handles the complete flow:
 * 1. Validates API key availability
 * 2. Makes API call with timeout/retry
 * 3. Parses and returns result
 *
 * @param prompt - The complete prompt including lead data
 * @returns TaskGenerationResult
 * @throws Error with structured message for debugging
 */
export async function generateWithGemini(
  prompt: string
): Promise<TaskGenerationResult> {
  console.log('Gemini API: Starting task generation', {
    promptLength: prompt.length,
    model: GEMINI_CONFIG.model,
    timeout: GEMINI_CONFIG.timeout,
    maxRetries: GEMINI_CONFIG.maxRetries,
  });

  const startTime = Date.now();

  try {
    const result = await callGeminiAPI(prompt);

    console.log('Gemini API: Task generation successful', {
      duration: Date.now() - startTime,
      totalTasks: result.total_task_count,
      eaPercent: result.ea_task_percent,
    });

    return result;
  } catch (error) {
    const err = error as Error;
    console.error('Gemini API: Task generation failed', {
      duration: Date.now() - startTime,
      error: err.message,
    });
    throw error;
  }
}
