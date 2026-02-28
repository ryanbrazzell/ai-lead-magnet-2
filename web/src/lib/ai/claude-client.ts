/**
 * Claude AI Client for Task Generation
 *
 * Integrates with Claude Sonnet 4.5 for generating high-quality,
 * in-depth personalized task reports.
 *
 * Configuration:
 * - Model: claude-sonnet-4-5-20250514 (high-quality responses)
 * - Temperature: 0.6
 * - Max Output Tokens: 8192
 * - Timeout: 90 seconds
 * - Retries: 1
 */

import Anthropic from '@anthropic-ai/sdk';
import type { TaskGenerationResult } from '@/types';

/**
 * Retry wrapper for transient API failures
 *
 * Only retries on server errors (5xx), overload (529), timeouts,
 * and network failures. Does NOT retry on client errors (4xx).
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTransient =
        message.includes('500') ||
        message.includes('529') ||
        message.includes('overloaded') ||
        message.includes('timeout') ||
        message.includes('ECONNRESET') ||
        message.includes('fetch failed');
      if (!isTransient || attempt === maxRetries) throw error;
      console.warn(
        `Claude API transient error (attempt ${attempt + 1}), retrying in ${delayMs}ms...`,
        message
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Unreachable');
}

// Claude model configuration
// Using Claude Sonnet 4.6 for high-quality, fast responses
export const CLAUDE_CONFIG = {
  model: 'claude-sonnet-4-6',
  temperature: 0.6,
  maxTokens: 8192,
  timeout: 90000, // 90 seconds (maxDuration is 120s, leaves room for PDF+email)
  maxRetries: 1,
} as const;

/**
 * Get API key from environment variables
 *
 * @returns The API key string
 * @throws Error if key is not present
 */
export function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    return apiKey;
  }

  throw new Error(
    'Missing API key: Set ANTHROPIC_API_KEY environment variable'
  );
}

/**
 * Parse Claude response with defensive JSON handling
 *
 * Handles common response issues:
 * - Markdown code blocks (```json ... ```)
 * - Leading "json" prefix
 * - Extra whitespace
 *
 * @param responseText - Raw response text from Claude
 * @returns Parsed TaskGenerationResult
 * @throws Error if parsing fails
 */
export function parseClaudeResponse(responseText: string): TaskGenerationResult {
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

  // Strip em-dashes from all text content (AI tends to produce these)
  cleanedText = cleanedText.replace(/—/g, '-');

  try {
    const parsed = JSON.parse(cleanedText) as TaskGenerationResult;
    return parsed;
  } catch (error) {
    const parseError = error as Error;
    throw new Error(
      `Failed to parse Claude response: ${parseError.message}. Response preview: ${cleanedText.slice(0, 200)}...`
    );
  }
}

/**
 * Generate tasks using Claude AI
 *
 * High-level function that handles the complete flow:
 * 1. Validates API key availability
 * 2. Makes API call with timeout/retry
 * 3. Parses and returns result
 *
 * @param prompt - The complete prompt including lead data
 * @returns TaskGenerationResult with tasks grouped by frequency
 * @throws Error with structured message for debugging
 */
export async function generateWithClaude(
  prompt: string
): Promise<TaskGenerationResult> {
  console.log('Claude API: Starting task generation', {
    promptLength: prompt.length,
    model: CLAUDE_CONFIG.model,
    timeout: CLAUDE_CONFIG.timeout,
    maxRetries: CLAUDE_CONFIG.maxRetries,
  });

  const startTime = Date.now();
  const apiKey = getApiKey();

  // Initialize Anthropic client
  const anthropic = new Anthropic({
    apiKey,
  });

  let lastError: Error | null = null;
  let attempt = 0;
  const maxAttempts = CLAUDE_CONFIG.maxRetries + 1;

  while (attempt < maxAttempts) {
    attempt++;

    try {
      const response = await callWithRetry(() =>
        anthropic.messages.create({
          model: CLAUDE_CONFIG.model,
          max_tokens: CLAUDE_CONFIG.maxTokens,
          temperature: CLAUDE_CONFIG.temperature,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        })
      );

      // Extract text content from response
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('Claude API returned empty or invalid response structure');
      }

      const responseText = textContent.text;
      const result = parseClaudeResponse(responseText);

      console.log('Claude API: Task generation successful', {
        duration: Date.now() - startTime,
        totalTasks: result.total_task_count,
        eaPercent: result.ea_task_percent,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      lastError = err;

      // Log retry attempt
      if (attempt < maxAttempts) {
        console.warn(
          `Claude API attempt ${attempt} failed, retrying...`,
          lastError.message
        );
      }
    }
  }

  // All retries exhausted
  console.error('Claude API: Task generation failed', {
    duration: Date.now() - startTime,
    error: lastError?.message,
  });

  throw lastError || new Error('Claude API call failed after all retries');
}
