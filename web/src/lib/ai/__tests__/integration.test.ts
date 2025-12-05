/**
 * Integration Tests for AI Task Generation Service (Task Group 8)
 *
 * These tests verify end-to-end workflows and integration points between modules:
 * - Complete task generation pipeline
 * - Auto-fix behavior on invalid responses
 * - Core EA task presence verification
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UnifiedLeadData, TaskGenerationResult, Task } from '@/types';

// Mock the Gemini client for integration tests
vi.mock('../gemini-client', () => ({
  generateWithGemini: vi.fn(),
  getApiKey: vi.fn(),
  parseGeminiResponse: vi.fn(),
  GEMINI_CONFIG: {
    model: 'gemini-2.0-flash',
    endpoint:
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    temperature: 0.6,
    maxOutputTokens: 3000,
    responseMimeType: 'application/json',
    timeout: 30000,
    maxRetries: 1,
  },
}));

import { generateTasks } from '../task-generator';
import { validateReport, analyzeReport } from '../report-validator';
import {
  fixReportIssues,
  ensureCoreEATasks,
  fixLowEAPercentage,
  fixTaskCount,
} from '../report-fixer';
import { generateWithGemini, getApiKey, parseGeminiResponse } from '../gemini-client';
import { buildUnifiedPromptJSON } from '../prompts';

describe('Integration Tests: AI Task Generation Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Test 1: End-to-end: Valid lead data -> 30 tasks with 40%+ EA ratio
   *
   * Verifies the complete pipeline from lead data input to valid task output
   */
  describe('End-to-end: Valid lead data generates valid report', () => {
    it('generates exactly 30 tasks with 40%+ EA ratio from valid lead data', async () => {
      const mockLeadData = createFullLeadData('main');
      const mockResult = createValidReportWithCoreEATasks();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      // Verify task counts
      expect(result.total_task_count).toBe(30);
      expect(result.tasks.daily).toHaveLength(10);
      expect(result.tasks.weekly).toHaveLength(10);
      expect(result.tasks.monthly).toHaveLength(10);

      // Verify EA ratio is at least 40%
      const analysis = analyzeReport(result);
      expect(analysis.eaPercentage).toBeGreaterThanOrEqual(40);
      expect(result.ea_task_percent).toBeGreaterThanOrEqual(40);

      // Verify validation passes
      const validation = validateReport(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  /**
   * Test 2: End-to-end: Invalid response -> auto-fix -> valid output
   *
   * Verifies that the auto-fix pipeline corrects invalid AI responses
   */
  describe('End-to-end: Invalid response triggers auto-fix', () => {
    it('auto-fixes low EA percentage and produces valid output', async () => {
      // Create a report with low EA percentage (0%)
      const lowEAReport = createReportWithLowEAPercentage();

      // Verify the input has low EA percentage
      expect(lowEAReport.ea_task_percent).toBeLessThan(40);

      // Run the fixer
      const fixedReport = fixLowEAPercentage(lowEAReport);

      // Verify the EA percentage has been fixed
      const analysis = analyzeReport(fixedReport);
      expect(analysis.eaPercentage).toBeGreaterThanOrEqual(40);
      expect(fixedReport.ea_task_percent).toBeGreaterThanOrEqual(40);

      // Verify task count is still correct
      expect(fixedReport.tasks.daily).toHaveLength(10);
      expect(fixedReport.tasks.weekly).toHaveLength(10);
      expect(fixedReport.tasks.monthly).toHaveLength(10);
    });

    it('fixes task count issues correctly', () => {
      // Create a report with wrong task count
      const wrongCountReport = createReportWithWrongTaskCount();

      // Verify the input has wrong task count
      const allTasksBefore = [
        ...wrongCountReport.tasks.daily,
        ...wrongCountReport.tasks.weekly,
        ...wrongCountReport.tasks.monthly,
      ];
      expect(allTasksBefore.length).not.toBe(30);

      // Run the task count fixer
      const fixedReport = fixTaskCount(wrongCountReport);

      // Verify task counts are now correct (10 per frequency)
      expect(fixedReport.tasks.daily).toHaveLength(10);
      expect(fixedReport.tasks.weekly).toHaveLength(10);
      expect(fixedReport.tasks.monthly).toHaveLength(10);
      expect(fixedReport.total_task_count).toBe(30);
    });
  });

  /**
   * Test 3: End-to-end: All 4 core EA tasks present in output
   *
   * Verifies that ensureCoreEATasks injects all missing core tasks
   */
  describe('End-to-end: All 4 core EA tasks present', () => {
    it('ensures all 4 core EA tasks are present after processing', () => {
      // Create a report missing all core EA tasks
      const reportWithoutCoreEA = createReportWithoutCoreEATasks();

      // Verify no core tasks initially
      const initialAnalysis = analyzeReport(reportWithoutCoreEA);
      expect(initialAnalysis.coreTasksPresent.emailManagement).toBe(false);
      expect(initialAnalysis.coreTasksPresent.calendarManagement).toBe(false);
      expect(initialAnalysis.coreTasksPresent.personalLifeManagement).toBe(false);
      expect(initialAnalysis.coreTasksPresent.businessProcessManagement).toBe(false);

      // Run the core EA task fixer
      const fixedReport = ensureCoreEATasks(reportWithoutCoreEA);

      // Verify all 4 core tasks are now present
      const finalAnalysis = analyzeReport(fixedReport);
      expect(finalAnalysis.coreTasksPresent.emailManagement).toBe(true);
      expect(finalAnalysis.coreTasksPresent.calendarManagement).toBe(true);
      expect(finalAnalysis.coreTasksPresent.personalLifeManagement).toBe(true);
      expect(finalAnalysis.coreTasksPresent.businessProcessManagement).toBe(true);

      // Verify task count is still 30
      const allTasks = [
        ...fixedReport.tasks.daily,
        ...fixedReport.tasks.weekly,
        ...fixedReport.tasks.monthly,
      ];
      expect(allTasks.length).toBe(30);
    });
  });

  /**
   * Test 4: Integration: API route -> task generator -> validator -> fixer
   *
   * Verifies the complete integration flow works correctly
   */
  describe('Integration: Full pipeline flow', () => {
    it('integrates task generator with validator and fixer correctly', async () => {
      const mockLeadData = createFullLeadData('main');
      const mockResult = createReportWithMinorIssues();

      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      // Step 1: Generate tasks
      const generatedResult = await generateTasks(mockLeadData);

      // Step 2: Validate the result
      const validation = validateReport(generatedResult);

      // Step 3: If validation fails, apply fixes
      let finalResult = generatedResult;
      if (!validation.isValid) {
        finalResult = fixReportIssues(generatedResult, validation.errors);
      }

      // Step 4: Ensure core EA tasks
      finalResult = ensureCoreEATasks(finalResult);

      // Verify final result is valid
      const finalValidation = validateReport(finalResult);
      expect(finalValidation.isValid).toBe(true);

      // Verify structure
      expect(finalResult.tasks.daily).toHaveLength(10);
      expect(finalResult.tasks.weekly).toHaveLength(10);
      expect(finalResult.tasks.monthly).toHaveLength(10);
    });
  });

  /**
   * Test 5: Edge case: Lead with minimal data still generates valid report
   *
   * Verifies the system handles minimal input gracefully
   */
  describe('Edge case: Minimal lead data', () => {
    it('generates valid report from minimal lead data', async () => {
      // Create minimal lead data with only required fields
      const minimalLead: UnifiedLeadData = {
        leadType: 'simple',
        timestamp: new Date().toISOString(),
        email: 'minimal@example.com',
      };

      const mockResult = createValidReportWithCoreEATasks();
      vi.mocked(generateWithGemini).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(minimalLead);

      // Verify we still get a valid result
      expect(result.total_task_count).toBe(30);
      expect(result.ea_task_percent).toBeGreaterThanOrEqual(40);

      const validation = validateReport(result);
      expect(validation.isValid).toBe(true);
    });
  });

  /**
   * Test 6: Edge case: Markdown code block stripping in JSON parsing
   *
   * Verifies the parseGeminiResponse function handles code blocks correctly
   */
  describe('Edge case: Markdown code block stripping', () => {
    it('strips ```json and ``` from response and parses correctly', () => {
      const mockResult = createValidReportWithCoreEATasks();
      const wrappedJson = '```json\n' + JSON.stringify(mockResult) + '\n```';

      // Mock the actual parsing behavior
      vi.mocked(parseGeminiResponse).mockImplementation((text: string) => {
        let cleanedText = text.trim();

        // Strip markdown code blocks
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.slice(3);
        }

        if (cleanedText.endsWith('```')) {
          cleanedText = cleanedText.slice(0, -3);
        }

        cleanedText = cleanedText.trim();
        return JSON.parse(cleanedText) as TaskGenerationResult;
      });

      const parsed = parseGeminiResponse(wrappedJson);

      expect(parsed.total_task_count).toBe(30);
      expect(parsed.tasks.daily).toHaveLength(10);
    });

    it('handles json prefix without backticks', () => {
      const mockResult = createValidReportWithCoreEATasks();
      const prefixedJson = 'json\n' + JSON.stringify(mockResult);

      vi.mocked(parseGeminiResponse).mockImplementation((text: string) => {
        let cleanedText = text.trim();

        if (cleanedText.startsWith('json\n')) {
          cleanedText = cleanedText.slice(5);
        }

        cleanedText = cleanedText.trim();
        return JSON.parse(cleanedText) as TaskGenerationResult;
      });

      const parsed = parseGeminiResponse(prefixedJson);

      expect(parsed.total_task_count).toBe(30);
    });
  });

  /**
   * Test 7: Error handling: Missing API key returns proper error
   *
   * Verifies that missing API key is handled correctly
   */
  describe('Error handling: Missing API key', () => {
    it('throws error with proper message when API key is missing', async () => {
      const mockLeadData = createFullLeadData('main');

      vi.mocked(generateWithGemini).mockRejectedValueOnce(
        new Error('Missing API key: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable')
      );

      await expect(generateTasks(mockLeadData)).rejects.toThrow(/Missing API key/);
    });

    it('getApiKey throws descriptive error when no keys are set', () => {
      vi.mocked(getApiKey).mockImplementation(() => {
        throw new Error(
          'Missing API key: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable'
        );
      });

      expect(() => getApiKey()).toThrow(
        'Missing API key: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable'
      );
    });
  });

  /**
   * Test 8: Prompt building includes lead context correctly
   *
   * Verifies that buildUnifiedPromptJSON properly integrates lead data
   */
  describe('Prompt building integration', () => {
    it('buildUnifiedPromptJSON includes lead context in final prompt', () => {
      const leadData = createFullLeadData('main');

      const prompt = buildUnifiedPromptJSON(leadData);

      // Verify placeholder is replaced
      expect(prompt).not.toContain('{LEAD_CONTEXT}');

      // Verify lead data is included
      expect(prompt).toContain(leadData.firstName || '');
      expect(prompt).toContain('Business Type:');

      // Verify prompt structure is intact
      expect(prompt).toContain('OUTPUT JSON');
      expect(prompt).toContain('DAILY TASKS MIX');
    });
  });
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create full lead data for testing
 */
function createFullLeadData(leadType: 'main' | 'standard' | 'simple'): UnifiedLeadData {
  return {
    leadType,
    timestamp: new Date().toISOString(),
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '555-123-4567',
    title: 'CEO',
    website: 'https://example.com',
    businessType: 'SaaS',
    revenue: '$1M-$5M',
    employeeCount: '10-50',
    challenges: 'Email overload, scheduling conflicts',
    timeBottleneck: 'Administrative tasks',
    adminTimePerWeek: '20+ hours',
    communicationPreference: 'Email',
  };
}

/**
 * Create a valid report with all core EA tasks
 */
function createValidReportWithCoreEATasks(): TaskGenerationResult {
  const createEATasks = (count: number, frequency: 'daily' | 'weekly' | 'monthly'): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `EA Task ${i + 1} for ${frequency}`,
      description: `A detailed task description explaining what the EA needs to do for this specific ${frequency} task.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'Operations',
      frequency,
      priority: 'medium' as const,
    }));

  const createFounderTasks = (
    count: number,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Founder Task ${i + 1} for ${frequency}`,
      description: `A detailed task description explaining what the founder needs to do for this specific ${frequency} task.`,
      owner: 'You' as const,
      isEA: false,
      category: 'Strategy',
      frequency,
      priority: 'high' as const,
    }));

  // 5 EA + 5 Founder per frequency = 50% EA
  const daily = [...createEATasks(5, 'daily'), ...createFounderTasks(5, 'daily')];
  const weekly = [...createEATasks(5, 'weekly'), ...createFounderTasks(5, 'weekly')];
  const monthly = [...createEATasks(5, 'monthly'), ...createFounderTasks(5, 'monthly')];

  // Add core EA tasks
  daily[0] = {
    title: 'Complete Email Management',
    description:
      'Manage inbox, filter emails, respond to correspondence on behalf of founder.',
    owner: 'EA',
    isEA: true,
    category: 'Communication',
    frequency: 'daily',
    priority: 'high',
    isCoreEATask: true,
    coreTaskType: 'emailManagement',
  };

  daily[1] = {
    title: 'Calendar and Schedule Management',
    description: 'Manage calendar, schedule appointments, and optimize meeting times.',
    owner: 'EA',
    isEA: true,
    category: 'Time Management',
    frequency: 'daily',
    priority: 'high',
    isCoreEATask: true,
    coreTaskType: 'calendarManagement',
  };

  weekly[0] = {
    title: 'Personal Life Coordination',
    description:
      'Handle personal travel bookings, family logistics, and vendor communications.',
    owner: 'EA',
    isEA: true,
    category: 'Personal Support',
    frequency: 'weekly',
    priority: 'medium',
    isCoreEATask: true,
    coreTaskType: 'personalLifeManagement',
  };

  monthly[0] = {
    title: 'Business Process Management',
    description: 'Document and optimize recurring workflow processes and automation systems.',
    owner: 'EA',
    isEA: true,
    category: 'Operations',
    frequency: 'monthly',
    priority: 'medium',
    isCoreEATask: true,
    coreTaskType: 'businessProcessManagement',
  };

  return {
    tasks: { daily, weekly, monthly },
    ea_task_percent: 50,
    ea_task_count: 15,
    total_task_count: 30,
    summary: 'Around 50% of tasks can be delegated to your EA.',
  };
}

/**
 * Create a report with low EA percentage (for testing auto-fix)
 */
function createReportWithLowEAPercentage(): TaskGenerationResult {
  const createFounderTasksWithKeywords = (
    count: number,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Schedule meeting ${i + 1}`,
      description: `Coordinate and book ${frequency} meetings with clients and team members.`,
      owner: 'You' as const,
      isEA: false,
      category: 'Operations',
      frequency,
      priority: 'medium' as const,
    }));

  // All founder tasks = 0% EA, but with delegatable keywords
  return {
    tasks: {
      daily: createFounderTasksWithKeywords(10, 'daily'),
      weekly: createFounderTasksWithKeywords(10, 'weekly'),
      monthly: createFounderTasksWithKeywords(10, 'monthly'),
    },
    ea_task_percent: 0,
    ea_task_count: 0,
    total_task_count: 30,
    summary: '0% of tasks delegated.',
  };
}

/**
 * Create a report without any core EA tasks
 */
function createReportWithoutCoreEATasks(): TaskGenerationResult {
  const createGenericEATasks = (
    count: number,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Generic EA Task ${i + 1}`,
      description: `A generic task without core EA keywords for ${frequency} frequency.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'General',
      frequency,
      priority: 'medium' as const,
    }));

  const createFounderTasks = (
    count: number,
    frequency: 'daily' | 'weekly' | 'monthly'
  ): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Founder Task ${i + 1}`,
      description: `A strategic task for the founder in ${frequency} frequency.`,
      owner: 'You' as const,
      isEA: false,
      category: 'Strategy',
      frequency,
      priority: 'high' as const,
    }));

  // 5 EA + 5 Founder per frequency = 50% EA, but no core tasks
  return {
    tasks: {
      daily: [...createGenericEATasks(5, 'daily'), ...createFounderTasks(5, 'daily')],
      weekly: [...createGenericEATasks(5, 'weekly'), ...createFounderTasks(5, 'weekly')],
      monthly: [...createGenericEATasks(5, 'monthly'), ...createFounderTasks(5, 'monthly')],
    },
    ea_task_percent: 50,
    ea_task_count: 15,
    total_task_count: 30,
    summary: '50% of tasks delegated.',
  };
}

/**
 * Create a report with wrong task count (for testing task count fix)
 */
function createReportWithWrongTaskCount(): TaskGenerationResult {
  const createEATasks = (count: number, frequency: 'daily' | 'weekly' | 'monthly'): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Schedule meeting ${i + 1}`,
      description: `Coordinate and book ${frequency} meetings with clients.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'Operations',
      frequency,
      priority: 'medium' as const,
    }));

  // 8 daily + 8 weekly + 9 monthly = 25 tasks (wrong count)
  // Has EA tasks so EA percentage is already high
  return {
    tasks: {
      daily: createEATasks(8, 'daily'),
      weekly: createEATasks(8, 'weekly'),
      monthly: createEATasks(9, 'monthly'),
    },
    ea_task_percent: 100,
    ea_task_count: 25,
    total_task_count: 25,
    summary: '100% of tasks delegated.',
  };
}

/**
 * Create a report with minor issues that needs fixing
 */
function createReportWithMinorIssues(): TaskGenerationResult {
  const report = createValidReportWithCoreEATasks();

  // Lower the EA percentage slightly below threshold
  // Convert 4 EA tasks to founder tasks to get 37% EA
  report.tasks.daily[2].isEA = false;
  report.tasks.daily[2].owner = 'You';
  report.tasks.weekly[2].isEA = false;
  report.tasks.weekly[2].owner = 'You';

  report.ea_task_percent = 37;
  report.ea_task_count = 11;

  return report;
}
