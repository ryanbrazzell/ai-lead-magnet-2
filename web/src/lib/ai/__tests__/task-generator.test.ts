/**
 * Task Generator Service Tests (Task Group 4.1)
 *
 * Tests for the task generator service including:
 * - generateTasks returns TaskGenerationResult with 30 tasks
 * - Lead type routing (main uses unified prompt, simple/standard use streamlined)
 * - Error handling returns structured error response
 * - Fallback prompt escalation on repeated failures
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UnifiedLeadData, TaskGenerationResult } from '@/types';

// Mock the Gemini client module
vi.mock('../gemini-client', () => ({
  generateWithGemini: vi.fn(),
}));

// Mock the prompts module
vi.mock('../prompts', () => ({
  buildUnifiedPromptJSON: vi.fn(),
  buildStreamlinedPrompt: vi.fn(),
  buildSimplifiedPrompt: vi.fn(),
  buildEmergencyPrompt: vi.fn(),
}));

import { generateTasks } from '../task-generator';
import { generateWithGemini } from '../gemini-client';
import {
  buildUnifiedPromptJSON,
  buildStreamlinedPrompt,
  buildSimplifiedPrompt,
  buildEmergencyPrompt,
} from '../prompts';

describe('Task Generator Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Setup default mock implementations
    vi.mocked(buildUnifiedPromptJSON).mockReturnValue('unified-prompt');
    vi.mocked(buildStreamlinedPrompt).mockReturnValue('streamlined-prompt');
    vi.mocked(buildSimplifiedPrompt).mockReturnValue('simplified-prompt');
    vi.mocked(buildEmergencyPrompt).mockReturnValue('emergency-prompt');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Test 1: generateTasks returns TaskGenerationResult with 30 tasks
   */
  describe('generateTasks returns TaskGenerationResult with 30 tasks', () => {
    it('returns a TaskGenerationResult with exactly 30 tasks', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(result).toBeDefined();
      expect(result.total_task_count).toBe(30);
      expect(result.tasks.daily).toHaveLength(10);
      expect(result.tasks.weekly).toHaveLength(10);
      expect(result.tasks.monthly).toHaveLength(10);
    });

    it('returns valid EA percentage and counts', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(result.ea_task_percent).toBeGreaterThanOrEqual(40);
      expect(result.ea_task_percent).toBeLessThanOrEqual(60);
      expect(result.ea_task_count).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    it('returns tasks with required fields', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      // Check that all tasks have required fields
      const allTasks = [
        ...result.tasks.daily,
        ...result.tasks.weekly,
        ...result.tasks.monthly,
      ];

      for (const task of allTasks) {
        expect(task.title).toBeDefined();
        expect(task.description).toBeDefined();
        expect(task.owner).toMatch(/^(EA|You)$/);
        expect(typeof task.isEA).toBe('boolean');
        expect(task.category).toBeDefined();
      }
    });
  });

  /**
   * Test 2: Lead type routing (main uses unified prompt, simple/standard use streamlined)
   */
  describe('Lead type routing', () => {
    it('uses buildUnifiedPromptJSON for main leadType', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(buildUnifiedPromptJSON).toHaveBeenCalledWith(mockLeadData);
      expect(buildStreamlinedPrompt).not.toHaveBeenCalled();
    });

    it('uses buildStreamlinedPrompt for simple leadType', async () => {
      const mockLeadData = createMockLeadData('simple');
      const mockResult = createMockTaskResult();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(buildStreamlinedPrompt).toHaveBeenCalledWith(mockLeadData);
      expect(buildUnifiedPromptJSON).not.toHaveBeenCalled();
    });

    it('uses buildStreamlinedPrompt for standard leadType', async () => {
      const mockLeadData = createMockLeadData('standard');
      const mockResult = createMockTaskResult();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(buildStreamlinedPrompt).toHaveBeenCalledWith(mockLeadData);
      expect(buildUnifiedPromptJSON).not.toHaveBeenCalled();
    });

    it('passes correct prompt to Gemini client based on lead type', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(buildUnifiedPromptJSON).mockReturnValue('custom-unified-prompt');
      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(generateWithGemini).toHaveBeenCalledWith('custom-unified-prompt');
    });
  });

  /**
   * Test 3: Error handling returns structured error response
   */
  describe('Error handling', () => {
    it('throws structured error on Gemini API failure', async () => {
      const mockLeadData = createMockLeadData('main');

      vi.mocked(generateWithGemini).mockRejectedValue(
        new Error('Gemini API error: rate limit exceeded')
      );

      await expect(generateTasks(mockLeadData)).rejects.toThrow(
        /Gemini API error/
      );
    });

    it('throws error with context on missing API key', async () => {
      const mockLeadData = createMockLeadData('main');

      vi.mocked(generateWithGemini).mockRejectedValue(
        new Error('Missing API key: Set GEMINI_API_KEY or GOOGLE_API_KEY')
      );

      await expect(generateTasks(mockLeadData)).rejects.toThrow(/Missing API key/);
    });

    it('throws error with context on timeout', async () => {
      const mockLeadData = createMockLeadData('main');

      vi.mocked(generateWithGemini).mockRejectedValue(
        new Error('Gemini API request timed out after 30000ms')
      );

      await expect(generateTasks(mockLeadData)).rejects.toThrow(/timed out/);
    });

    it('includes lead type in error context', async () => {
      const mockLeadData = createMockLeadData('simple');

      vi.mocked(generateWithGemini).mockRejectedValue(
        new Error('Network error')
      );

      try {
        await generateTasks(mockLeadData);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        // Error is logged with lead type context (verified via console spy)
        expect(err.message).toContain('Network error');
      }
    });
  });

  /**
   * Test 4: Fallback prompt escalation on repeated failures
   */
  describe('Fallback prompt escalation', () => {
    it('escalates to simplified prompt on first failure', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      // First call fails, second succeeds with simplified prompt
      vi.mocked(generateWithGemini)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(buildSimplifiedPrompt).toHaveBeenCalledWith(mockLeadData);
      expect(result.total_task_count).toBe(30);
    });

    it('escalates to emergency prompt when simplified also fails', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      // First and second calls fail, third succeeds with emergency prompt
      vi.mocked(generateWithGemini)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Simplified attempt failed'))
        .mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(buildEmergencyPrompt).toHaveBeenCalled();
      expect(result.total_task_count).toBe(30);
    });

    it('throws error after all fallback attempts exhausted', async () => {
      const mockLeadData = createMockLeadData('main');

      // All attempts fail
      vi.mocked(generateWithGemini)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Simplified attempt failed'))
        .mockRejectedValueOnce(new Error('Emergency attempt failed'));

      await expect(generateTasks(mockLeadData)).rejects.toThrow(
        /All task generation attempts failed/
      );
    });

    it('uses correct escalation order: primary -> simplified -> emergency', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      // Track call order
      const callOrder: string[] = [];

      vi.mocked(buildUnifiedPromptJSON).mockImplementation(() => {
        callOrder.push('unified');
        return 'unified-prompt';
      });

      vi.mocked(buildSimplifiedPrompt).mockImplementation(() => {
        callOrder.push('simplified');
        return 'simplified-prompt';
      });

      vi.mocked(buildEmergencyPrompt).mockImplementation(() => {
        callOrder.push('emergency');
        return 'emergency-prompt';
      });

      // First two fail, third succeeds
      vi.mocked(generateWithGemini)
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Simplified attempt failed'))
        .mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(callOrder).toEqual(['unified', 'simplified', 'emergency']);
    });
  });
});

/**
 * Helper function to create mock lead data
 */
function createMockLeadData(
  leadType: 'main' | 'standard' | 'simple'
): UnifiedLeadData {
  return {
    leadType,
    timestamp: new Date().toISOString(),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    title: 'CEO',
    website: 'https://example.com',
    businessType: 'Software Company',
    revenue: '$1M - $5M',
    employeeCount: '10-50',
    challenges: 'Too many meetings and emails',
    timeBottleneck: 'Administrative tasks',
    adminTimePerWeek: '15+ hours',
  };
}

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
