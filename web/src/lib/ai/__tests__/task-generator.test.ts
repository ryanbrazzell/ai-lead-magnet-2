/**
 * Task Generator Service Tests — Core Four Architecture
 *
 * Tests for the two-prompt chain task generator:
 * - generateTasks returns TaskGenerationResult with Core Four grouped tasks
 * - Two-prompt chain: generateAnalysis -> generateCoreFourTasks
 * - Error handling returns structured error response
 * - Fallback prompt escalation on repeated failures
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  UnifiedLeadData,
  TaskGenerationResult,
  BusinessAnalysisBrief,
} from '@/types';

// Mock the Claude client module
vi.mock('../claude-client', () => ({
  generateAnalysis: vi.fn(),
  generateCoreFourTasks: vi.fn(),
  generateWithClaude: vi.fn(),
}));

// Mock website analyzer to prevent real HTTP calls
vi.mock('@/lib/website/analyzer', () => ({
  extractDomainFromEmail: vi.fn().mockReturnValue(null),
  scrapeWebsiteContent: vi.fn(),
}));

// Mock the lead-brief module
vi.mock('../lead-brief', () => ({
  buildLeadBrief: vi.fn().mockReturnValue({
    name: 'John Doe',
    email: 'john.doe@example.com',
    domain: null,
    revenue: '$1M - $5M',
    revenueTier: 'scaling',
    dataRichness: 'medium',
    painPoints: ['Too many meetings'],
    inferredIndustry: 'Software',
    hasWebsiteData: false,
    specificityExpectation: 'Moderate specificity expected.',
  }),
}));

// Mock the prompt submodules that task-generator imports directly
vi.mock('../prompts/business-analysis-prompt', () => ({
  buildBusinessAnalysisPrompt: vi.fn().mockReturnValue('analysis-prompt'),
}));

vi.mock('../prompts/core-four-generation-prompt', () => ({
  buildCoreFourGenerationPrompt: vi.fn().mockReturnValue('generation-prompt'),
}));

vi.mock('../prompts', () => ({
  buildSimplifiedPrompt: vi.fn().mockReturnValue('simplified-prompt'),
  buildEmergencyPrompt: vi.fn().mockReturnValue('emergency-prompt'),
  buildBusinessAnalysisPrompt: vi.fn().mockReturnValue('analysis-prompt'),
  buildCoreFourGenerationPrompt: vi.fn().mockReturnValue('generation-prompt'),
  buildUnifiedPromptJSON: vi.fn(),
  buildStreamlinedPrompt: vi.fn(),
}));

import { generateTasks } from '../task-generator';
import { generateAnalysis, generateCoreFourTasks, generateWithClaude } from '../claude-client';
import { buildBusinessAnalysisPrompt } from '../prompts/business-analysis-prompt';
import { buildCoreFourGenerationPrompt } from '../prompts/core-four-generation-prompt';
import { buildLeadBrief } from '../lead-brief';
import {
  buildSimplifiedPrompt,
  buildEmergencyPrompt,
} from '../prompts';

describe('Task Generator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-apply default mock implementations after clear
    vi.mocked(buildBusinessAnalysisPrompt).mockReturnValue('analysis-prompt');
    vi.mocked(buildCoreFourGenerationPrompt).mockReturnValue('generation-prompt');
    vi.mocked(buildSimplifiedPrompt).mockReturnValue('simplified-prompt');
    vi.mocked(buildEmergencyPrompt).mockReturnValue('emergency-prompt');
    vi.mocked(buildLeadBrief).mockReturnValue({
      name: 'John Doe',
      email: 'john.doe@example.com',
      domain: null,
      revenue: '$1M - $5M',
      revenueTier: 'scaling',
      dataRichness: 'medium',
      painPoints: ['Too many meetings'],
      inferredIndustry: 'Software',
      hasWebsiteData: false,
      specificityExpectation: 'Moderate specificity expected — pain points available but no website data.',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: generateTasks returns TaskGenerationResult with Core Four tasks
   */
  describe('generateTasks returns TaskGenerationResult with Core Four tasks', () => {
    it('returns a TaskGenerationResult with correct Core Four task counts', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockAnalysis = createMockAnalysisBrief();
      const mockResult = createMockTaskResult();

      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysis);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(result).toBeDefined();
      expect(result.total_task_count).toBe(20);
      expect(result.tasks.businessProcesses).toHaveLength(8);
      expect(result.tasks.personalLife).toHaveLength(5);
      expect(result.tasks.calendar).toHaveLength(4);
      expect(result.tasks.email).toHaveLength(3);
    });

    it('returns valid EA percentage and counts', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockAnalysis = createMockAnalysisBrief();
      const mockResult = createMockTaskResult();

      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysis);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(result.ea_task_percent).toBe(100);
      expect(result.ea_task_count).toBe(20);
      expect(result.summary).toBeDefined();
      expect(result.analysis_summary).toBeDefined();
    });

    it('returns tasks with required fields', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockAnalysis = createMockAnalysisBrief();
      const mockResult = createMockTaskResult();

      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysis);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      const allTasks = [
        ...result.tasks.businessProcesses,
        ...result.tasks.personalLife,
        ...result.tasks.calendar,
        ...result.tasks.email,
      ];

      for (const task of allTasks) {
        expect(task.title).toBeDefined();
        expect(task.description).toBeDefined();
        expect(task.owner).toBe('EA');
        expect(task.isEA).toBe(true);
        expect(task.category).toBeDefined();
      }
    });
  });

  /**
   * Test 2: Two-prompt chain execution
   */
  describe('Two-prompt chain execution', () => {
    it('calls generateAnalysis then generateCoreFourTasks in sequence', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockAnalysis = createMockAnalysisBrief();
      const mockResult = createMockTaskResult();

      const callOrder: string[] = [];
      vi.mocked(generateAnalysis).mockImplementation(async () => {
        callOrder.push('analysis');
        return mockAnalysis;
      });
      vi.mocked(generateCoreFourTasks).mockImplementation(async () => {
        callOrder.push('coreFourTasks');
        return mockResult;
      });

      await generateTasks(mockLeadData);

      expect(callOrder).toEqual(['analysis', 'coreFourTasks']);
    });

    it('uses the same two-prompt chain for all lead types', async () => {
      for (const leadType of ['main', 'simple', 'standard'] as const) {
        vi.clearAllMocks();
        vi.mocked(buildBusinessAnalysisPrompt).mockReturnValue('analysis-prompt');
        vi.mocked(buildCoreFourGenerationPrompt).mockReturnValue('generation-prompt');
        vi.mocked(buildLeadBrief).mockReturnValue({
          name: 'John Doe',
          email: 'john.doe@example.com',
          domain: null,
          revenue: '$1M - $5M',
          revenueTier: 'scaling',
          dataRichness: 'medium',
          painPoints: ['Too many meetings'],
          inferredIndustry: 'Software',
          hasWebsiteData: false,
          specificityExpectation: 'Moderate specificity expected.',
        });

        const mockAnalysis = createMockAnalysisBrief();
        const mockResult = createMockTaskResult();

        vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysis);
        vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

        const mockLeadData = createMockLeadData(leadType);
        await generateTasks(mockLeadData);

        expect(generateAnalysis).toHaveBeenCalledTimes(1);
        expect(generateCoreFourTasks).toHaveBeenCalledTimes(1);
      }
    });

    it('passes analysis prompt to generateAnalysis', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockAnalysis = createMockAnalysisBrief();
      const mockResult = createMockTaskResult();

      vi.mocked(buildBusinessAnalysisPrompt).mockReturnValue('custom-analysis-prompt');
      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysis);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(generateAnalysis).toHaveBeenCalledWith('custom-analysis-prompt');
    });

    it('passes generation prompt to generateCoreFourTasks', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockAnalysis = createMockAnalysisBrief();
      const mockResult = createMockTaskResult();

      vi.mocked(buildCoreFourGenerationPrompt).mockReturnValue('custom-generation-prompt');
      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysis);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(generateCoreFourTasks).toHaveBeenCalledWith('custom-generation-prompt');
    });
  });

  /**
   * Test 3: Error handling returns structured error response
   */
  describe('Error handling', () => {
    it('throws structured error when all attempts fail', async () => {
      const mockLeadData = createMockLeadData('main');
      const apiError = new Error('Claude API error: rate limit exceeded');

      vi.mocked(generateAnalysis).mockRejectedValueOnce(apiError);
      vi.mocked(generateWithClaude)
        .mockRejectedValueOnce(apiError)
        .mockRejectedValueOnce(apiError);

      await expect(generateTasks(mockLeadData)).rejects.toThrow(
        /All task generation attempts failed/
      );
    });

    it('throws error with context on missing API key', async () => {
      const mockLeadData = createMockLeadData('main');
      const apiKeyError = new Error('Missing API key: Set ANTHROPIC_API_KEY environment variable');

      vi.mocked(generateAnalysis).mockRejectedValueOnce(apiKeyError);
      vi.mocked(generateWithClaude)
        .mockRejectedValueOnce(apiKeyError)
        .mockRejectedValueOnce(apiKeyError);

      await expect(generateTasks(mockLeadData)).rejects.toThrow(/Missing API key/);
    });

    it('throws error with context on timeout', async () => {
      const mockLeadData = createMockLeadData('main');
      const timeoutError = new Error('Claude API request timed out after 90000ms');

      vi.mocked(generateAnalysis).mockRejectedValueOnce(timeoutError);
      vi.mocked(generateWithClaude)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError);

      await expect(generateTasks(mockLeadData)).rejects.toThrow(/timed out/);
    });

    it('includes lead type in error context', async () => {
      const mockLeadData = createMockLeadData('simple');
      const networkError = new Error('Network error');

      vi.mocked(generateAnalysis).mockRejectedValueOnce(networkError);
      vi.mocked(generateWithClaude)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError);

      try {
        await generateTasks(mockLeadData);
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error;
        expect(err.message).toContain('simple');
        expect(err.message).toContain('Network error');
      }
    });
  });

  /**
   * Test 4: Fallback prompt escalation on repeated failures
   */
  describe('Fallback prompt escalation', () => {
    it('falls back to simplified prompt when two-prompt chain fails', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      // Two-prompt chain fails (generateAnalysis throws)
      vi.mocked(generateAnalysis).mockRejectedValueOnce(new Error('Analysis failed'));
      // Simplified fallback succeeds
      vi.mocked(generateWithClaude).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(buildSimplifiedPrompt).toHaveBeenCalled();
      expect(result.total_task_count).toBe(20);
    });

    it('escalates to emergency prompt when simplified also fails', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      // Two-prompt chain fails
      vi.mocked(generateAnalysis).mockRejectedValueOnce(new Error('Analysis failed'));
      // Simplified fallback fails, then emergency succeeds
      vi.mocked(generateWithClaude)
        .mockRejectedValueOnce(new Error('Simplified failed'))
        .mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(buildEmergencyPrompt).toHaveBeenCalled();
      expect(result.total_task_count).toBe(20);
    });

    it('throws error after all fallback attempts exhausted', async () => {
      const mockLeadData = createMockLeadData('main');

      // All attempts fail
      vi.mocked(generateAnalysis).mockRejectedValueOnce(new Error('Analysis failed'));
      vi.mocked(generateWithClaude)
        .mockRejectedValueOnce(new Error('Simplified failed'))
        .mockRejectedValueOnce(new Error('Emergency failed'));

      await expect(generateTasks(mockLeadData)).rejects.toThrow(
        /All task generation attempts failed/
      );
    });

    it('uses correct escalation order: two-prompt chain -> simplified -> emergency', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      const callOrder: string[] = [];

      vi.mocked(generateAnalysis).mockImplementation(async () => {
        callOrder.push('two-prompt-chain');
        throw new Error('Chain failed');
      });

      vi.mocked(buildSimplifiedPrompt).mockImplementation(() => {
        callOrder.push('simplified');
        return 'simplified-prompt';
      });

      vi.mocked(buildEmergencyPrompt).mockImplementation(() => {
        callOrder.push('emergency');
        return 'emergency-prompt';
      });

      // Simplified fails, emergency succeeds
      vi.mocked(generateWithClaude)
        .mockRejectedValueOnce(new Error('Simplified failed'))
        .mockResolvedValueOnce(mockResult);

      await generateTasks(mockLeadData);

      expect(callOrder).toEqual(['two-prompt-chain', 'simplified', 'emergency']);
    });

    it('recovers from Call 2 failure via simplified fallback', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockAnalysis = createMockAnalysisBrief();
      const mockResult = createMockTaskResult();

      // Call 1 succeeds but Call 2 fails
      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysis);
      vi.mocked(generateCoreFourTasks).mockRejectedValueOnce(
        new Error('Generation failed')
      );
      // Simplified fallback succeeds
      vi.mocked(generateWithClaude).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      expect(buildSimplifiedPrompt).toHaveBeenCalled();
      expect(result.total_task_count).toBe(20);
    });
  });
});

/**
 * Helper: create mock lead data
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
 * Helper: create mock BusinessAnalysisBrief
 */
function createMockAnalysisBrief(): BusinessAnalysisBrief {
  return {
    business_description:
      'A mid-market software company with 10-50 employees, generating $1M-$5M in revenue.',
    recurring_processes: [
      'Client onboarding and setup',
      'Monthly reporting and analytics',
      'Vendor contract renewals',
      'Team meeting coordination',
      'Invoice processing and follow-ups',
    ],
    calendar_patterns: [
      'Back-to-back meetings with no buffer time',
      'Recurring 1:1s consuming 30% of the week',
      'No dedicated deep work blocks',
    ],
    personal_life_opportunities: [
      'Travel booking and itinerary management',
      'Family event planning',
      'Personal appointment scheduling',
    ],
    pain_point_decomposition: [
      'Email overload from vendor and client communications',
      'Meeting prep takes too long due to scattered notes',
      'Manual data entry across CRM and project tools',
      'No system for recurring administrative tasks',
    ],
    revenue_tier_context:
      'At $1M-$5M revenue, an EA can directly reclaim 15+ hours per week from ops overhead.',
  };
}

/**
 * Helper: create mock TaskGenerationResult with Core Four structure
 */
function createMockTaskResult(): TaskGenerationResult {
  const createTasks = (count: number, area: string) =>
    Array.from({ length: count }, (_, i) => ({
      title: `${area} Task ${i + 1}`,
      description: `A detailed description for ${area} task ${i + 1} explaining what the EA should do.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'Operations',
    }));

  return {
    tasks: {
      businessProcesses: createTasks(8, 'Business Process'),
      personalLife: createTasks(5, 'Personal Life'),
      calendar: createTasks(4, 'Calendar'),
      email: createTasks(3, 'Email'),
    },
    analysis_summary:
      'Based on the analysis, approximately 20 tasks can be delegated to an EA across the Core Four areas.',
    total_task_count: 20,
    ea_task_percent: 100,
    ea_task_count: 20,
    summary:
      'Based on the analysis, approximately 20 tasks can be delegated to an EA across the Core Four areas.',
  };
}
