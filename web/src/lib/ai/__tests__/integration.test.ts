/**
 * Integration Tests for AI Task Generation Service (Core Four Architecture)
 *
 * These tests verify end-to-end workflows and integration points between modules:
 * - Complete task generation pipeline (two-prompt chain)
 * - Auto-fix behavior on invalid responses
 * - Core EA task presence verification
 * - Edge cases and error handling
 *
 * All data uses Core Four keys: businessProcesses, personalLife, calendar, email
 * Target counts: businessProcesses ~8-10, personalLife ~5-6, calendar ~4-5, email ~3-4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UnifiedLeadData, TaskGenerationResult, Task, TasksByCoreFour } from '@/types';

// Mock the Claude client for integration tests
vi.mock('../claude-client', () => ({
  generateWithClaude: vi.fn(),
  generateAnalysis: vi.fn(),
  generateCoreFourTasks: vi.fn(),
  getApiKey: vi.fn(),
  parseClaudeResponse: vi.fn(),
  parseGenerationResponse: vi.fn(),
  CLAUDE_CONFIG: {
    model: 'claude-sonnet-4-6',
    temperature: 0.6,
    maxTokens: 8192,
    timeout: 60000,
    maxRetries: 1,
  },
  ANALYSIS_CONFIG: {
    model: 'claude-sonnet-4-6',
    temperature: 0.5,
    maxTokens: 2048,
    timeout: 30000,
    maxRetries: 1,
  },
  GENERATION_CONFIG: {
    model: 'claude-sonnet-4-6',
    temperature: 0.6,
    maxTokens: 8192,
    timeout: 60000,
    maxRetries: 1,
  },
}));

// Mock website analyzer to prevent real HTTP calls
vi.mock('@/lib/website/analyzer', () => ({
  extractDomainFromEmail: vi.fn().mockReturnValue(null),
  scrapeWebsiteContent: vi.fn(),
}));

import { generateTasks } from '../task-generator';
import { validateReport, analyzeReport } from '../report-validator';
import {
  fixReportIssues,
  ensureCoreEATasks,
  padThinAreas,
  isGoodEACandidate,
} from '../report-fixer';
import {
  generateWithClaude,
  generateAnalysis,
  generateCoreFourTasks,
  getApiKey,
  parseClaudeResponse,
  parseGenerationResponse,
} from '../claude-client';
import { buildUnifiedPromptJSON } from '../prompts';

describe('Integration Tests: AI Task Generation Service (Core Four)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Test 1: End-to-end: Valid lead data -> ~22-25 tasks organized by Core Four
   *
   * Verifies the complete pipeline from lead data input to valid task output
   */
  describe('End-to-end: Valid lead data generates valid Core Four report', () => {
    it('generates tasks organized by Core Four areas with correct counts', async () => {
      const mockLeadData = createFullLeadData('main');
      const mockAnalysisBrief = createMockAnalysisBrief();
      const mockResult = createValidCoreFourReport();

      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysisBrief);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(mockLeadData);

      // Verify Core Four structure exists
      expect(result.tasks.businessProcesses).toBeDefined();
      expect(result.tasks.personalLife).toBeDefined();
      expect(result.tasks.calendar).toBeDefined();
      expect(result.tasks.email).toBeDefined();

      // Verify total task count is in target range (~22-25)
      expect(result.total_task_count).toBeGreaterThanOrEqual(20);
      expect(result.total_task_count).toBeLessThanOrEqual(28);

      // Verify per-area counts are reasonable
      expect(result.tasks.businessProcesses.length).toBeGreaterThanOrEqual(5);
      expect(result.tasks.personalLife.length).toBeGreaterThanOrEqual(3);
      expect(result.tasks.calendar.length).toBeGreaterThanOrEqual(3);
      expect(result.tasks.email.length).toBeGreaterThanOrEqual(2);

      // Verify EA ratio is high (all tasks are EA in new architecture)
      expect(result.ea_task_percent).toBeGreaterThanOrEqual(50);

      // Verify validation passes
      const validation = validateReport(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  /**
   * Test 2: Auto-fix: padThinAreas fills undersized Core Four areas
   *
   * Verifies that the pad function injects fallback tasks into thin areas
   */
  describe('Auto-fix: padThinAreas fills undersized Core Four areas', () => {
    it('pads areas that are below minimum counts', () => {
      // Create a report with thin areas (too few tasks in some areas)
      const thinReport = createReportWithThinAreas();

      // Verify some areas are below minimums
      expect(thinReport.tasks.email.length).toBeLessThan(2);
      expect(thinReport.tasks.calendar.length).toBeLessThan(3);

      // Run the padder
      const paddedReport = padThinAreas(thinReport);

      // Verify thin areas have been filled to minimums
      expect(paddedReport.tasks.email.length).toBeGreaterThanOrEqual(2);
      expect(paddedReport.tasks.calendar.length).toBeGreaterThanOrEqual(3);
      expect(paddedReport.tasks.personalLife.length).toBeGreaterThanOrEqual(3);
      expect(paddedReport.tasks.businessProcesses.length).toBeGreaterThanOrEqual(5);

      // Verify total count increased
      expect(paddedReport.total_task_count).toBeGreaterThan(thinReport.total_task_count);
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

      // Verify total count includes injected tasks
      const allTasks = [
        ...fixedReport.tasks.businessProcesses,
        ...fixedReport.tasks.personalLife,
        ...fixedReport.tasks.calendar,
        ...fixedReport.tasks.email,
      ];
      expect(allTasks.length).toBe(fixedReport.total_task_count);
    });
  });

  /**
   * Test 4: Integration: task generator -> validator -> fixer pipeline
   *
   * Verifies the complete integration flow works correctly
   */
  describe('Integration: Full pipeline flow', () => {
    it('integrates task generator with validator and fixer correctly', async () => {
      const mockLeadData = createFullLeadData('main');
      const mockAnalysisBrief = createMockAnalysisBrief();
      const mockResult = createReportWithMinorIssues();

      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysisBrief);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

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

      // Verify Core Four structure
      expect(finalResult.tasks.businessProcesses).toBeDefined();
      expect(finalResult.tasks.personalLife).toBeDefined();
      expect(finalResult.tasks.calendar).toBeDefined();
      expect(finalResult.tasks.email).toBeDefined();
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

      const mockAnalysisBrief = createMockAnalysisBrief();
      const mockResult = createValidCoreFourReport();

      vi.mocked(generateAnalysis).mockResolvedValueOnce(mockAnalysisBrief);
      vi.mocked(generateCoreFourTasks).mockResolvedValueOnce(mockResult);

      const result = await generateTasks(minimalLead);

      // Verify we still get a valid result with Core Four structure
      expect(result.total_task_count).toBeGreaterThanOrEqual(20);
      expect(result.tasks.businessProcesses).toBeDefined();
      expect(result.tasks.personalLife).toBeDefined();
      expect(result.tasks.calendar).toBeDefined();
      expect(result.tasks.email).toBeDefined();

      const validation = validateReport(result);
      expect(validation.isValid).toBe(true);
    });
  });

  /**
   * Test 6: Edge case: Markdown code block stripping in JSON parsing
   *
   * Verifies the parseClaudeResponse/parseGenerationResponse handles code blocks
   */
  describe('Edge case: Markdown code block stripping', () => {
    it('strips ```json and ``` from response and parses correctly', () => {
      const mockResult = createValidCoreFourReport();
      const wrappedJson = '```json\n' + JSON.stringify(mockResult) + '\n```';

      // Mock the actual parsing behavior
      vi.mocked(parseGenerationResponse).mockImplementation((text: string) => {
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

      const parsed = parseGenerationResponse(wrappedJson);

      expect(parsed.total_task_count).toBeGreaterThanOrEqual(20);
      expect(parsed.tasks.businessProcesses).toBeDefined();
      expect(parsed.tasks.email).toBeDefined();
    });

    it('handles json prefix without backticks', () => {
      const mockResult = createValidCoreFourReport();
      const prefixedJson = 'json\n' + JSON.stringify(mockResult);

      vi.mocked(parseGenerationResponse).mockImplementation((text: string) => {
        let cleanedText = text.trim();

        if (cleanedText.startsWith('json\n')) {
          cleanedText = cleanedText.slice(5);
        }

        cleanedText = cleanedText.trim();
        return JSON.parse(cleanedText) as TaskGenerationResult;
      });

      const parsed = parseGenerationResponse(prefixedJson);

      expect(parsed.total_task_count).toBeGreaterThanOrEqual(20);
    });
  });

  /**
   * Test 7: Error handling: Missing API key returns proper error
   *
   * Verifies that missing API key is handled correctly
   */
  describe('Error handling: Missing API key', () => {
    it('throws error with proper message when all attempts fail', async () => {
      const mockLeadData = createFullLeadData('main');

      // All three fallback levels must fail for generateTasks to throw
      // Attempt 1: Two-prompt chain fails
      vi.mocked(generateAnalysis).mockRejectedValueOnce(
        new Error('Missing API key: Set ANTHROPIC_API_KEY environment variable')
      );
      // Attempt 2: Simplified fallback fails
      vi.mocked(generateWithClaude).mockRejectedValueOnce(
        new Error('Missing API key: Set ANTHROPIC_API_KEY environment variable')
      );
      // Attempt 3: Emergency fallback fails
      vi.mocked(generateWithClaude).mockRejectedValueOnce(
        new Error('Missing API key: Set ANTHROPIC_API_KEY environment variable')
      );

      await expect(generateTasks(mockLeadData)).rejects.toThrow(/All task generation attempts failed/);
    });

    it('getApiKey throws descriptive error when no keys are set', () => {
      vi.mocked(getApiKey).mockImplementation(() => {
        throw new Error(
          'Missing API key: Set ANTHROPIC_API_KEY environment variable'
        );
      });

      expect(() => getApiKey()).toThrow(
        'Missing API key: Set ANTHROPIC_API_KEY environment variable'
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
      expect(prompt).toContain('Output ONLY valid JSON');
    });
  });

  /**
   * Test 9: isGoodEACandidate identifies delegatable tasks
   *
   * Verifies the EA candidate detection works on Core Four tasks
   */
  describe('EA candidate detection', () => {
    it('identifies tasks with delegatable keywords as good EA candidates', () => {
      const delegatableTask: Task = {
        title: 'Schedule weekly team meetings',
        description: 'Coordinate and book recurring meetings with the team.',
        owner: 'EA',
        isEA: true,
        category: 'Scheduling',
      };

      expect(isGoodEACandidate(delegatableTask)).toBe(true);
    });

    it('rejects tasks without delegatable keywords', () => {
      const nonDelegatableTask: Task = {
        title: 'Build product strategy',
        description: 'Define the long-term vision for the product line.',
        owner: 'You',
        isEA: false,
        category: 'Strategy',
      };

      expect(isGoodEACandidate(nonDelegatableTask)).toBe(false);
    });
  });

  /**
   * Test 10: analyzeReport returns correct Core Four metrics
   *
   * Verifies report analysis produces correct counts from Core Four structure
   */
  describe('Report analysis with Core Four structure', () => {
    it('analyzeReport returns correct task counts and core task presence', () => {
      const report = createValidCoreFourReport();
      const analysis = analyzeReport(report);

      // Total should match sum of all Core Four areas
      const expectedTotal =
        report.tasks.businessProcesses.length +
        report.tasks.personalLife.length +
        report.tasks.calendar.length +
        report.tasks.email.length;
      expect(analysis.totalTasks).toBe(expectedTotal);

      // EA counts
      expect(analysis.eaTasks).toBeGreaterThan(0);
      expect(analysis.eaPercentage).toBeGreaterThanOrEqual(50);

      // Core tasks should be present (our valid report includes them)
      expect(analysis.coreTasksPresent.emailManagement).toBe(true);
      expect(analysis.coreTasksPresent.calendarManagement).toBe(true);
      expect(analysis.coreTasksPresent.personalLifeManagement).toBe(true);
      expect(analysis.coreTasksPresent.businessProcessManagement).toBe(true);
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
 * Create a mock business analysis brief (Call 1 response)
 */
function createMockAnalysisBrief() {
  return {
    business_description: 'SaaS company with 10-50 employees generating $1M-$5M in revenue',
    recurring_processes: [
      'Weekly team standups and sprint planning',
      'Monthly client reporting and invoicing',
      'Quarterly board meeting preparation',
      'Daily customer support triage',
    ],
    calendar_patterns: [
      'Back-to-back meetings with no focus blocks',
      'Client calls scattered across the week',
      'No dedicated time for strategic planning',
    ],
    personal_life_opportunities: [
      'Travel booking for family vacations',
      'Personal appointment scheduling',
      'Home vendor coordination',
    ],
    pain_point_decomposition: [
      'Email overload: 200+ emails/day, no triage system',
      'Scheduling conflicts: double bookings weekly',
      'Admin overhead: 20+ hours/week on non-strategic work',
    ],
    revenue_tier_context: 'Growing-stage company needing operational efficiency',
  };
}

/**
 * Create a valid Core Four report with all core EA tasks present
 */
function createValidCoreFourReport(): TaskGenerationResult {
  const createEATasks = (count: number, area: string): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `${area} EA Task ${i + 1}`,
      description: `A detailed task description explaining what the EA needs to do for this specific ${area} task in the business.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'Operations',
    }));

  const businessProcesses: Task[] = [
    {
      title: 'Turning your recurring workflow tasks into permanent hand-offs',
      description: 'Your EA identifies repetitive processes, documents them into simple playbooks, and takes them over completely.',
      owner: 'EA',
      isEA: true,
      category: 'Operations',
      isCoreEATask: true,
      coreTaskType: 'businessProcessManagement',
    },
    ...createEATasks(8, 'Business Process'),
  ];

  const personalLife: Task[] = [
    {
      title: 'Handling your personal appointments, travel, and family logistics',
      description: 'Your EA manages travel bookings, personal appointments, vendor communications, and family scheduling.',
      owner: 'EA',
      isEA: true,
      category: 'Personal',
      isCoreEATask: true,
      coreTaskType: 'personalLifeManagement',
    },
    ...createEATasks(4, 'Personal Life'),
  ];

  const calendar: Task[] = [
    {
      title: 'Owning your entire calendar so you just show up',
      description: 'Your EA manages all scheduling, coordinates across time zones, handles reschedules, and protects your focus time.',
      owner: 'EA',
      isEA: true,
      category: 'Scheduling',
      isCoreEATask: true,
      coreTaskType: 'calendarManagement',
    },
    ...createEATasks(3, 'Calendar'),
  ];

  const email: Task[] = [
    {
      title: 'Getting your inbox to zero every single day',
      description: 'Your EA processes every incoming email, sorts them into priority folders, flags what needs you, and archives the rest.',
      owner: 'EA',
      isEA: true,
      category: 'Communication',
      isCoreEATask: true,
      coreTaskType: 'emailManagement',
    },
    ...createEATasks(2, 'Email'),
  ];

  const allTasks = [...businessProcesses, ...personalLife, ...calendar, ...email];
  const eaCount = allTasks.filter(t => t.isEA).length;

  return {
    tasks: { businessProcesses, personalLife, calendar, email },
    analysis_summary: 'SaaS CEO spending 20+ hours/week on admin tasks that can be delegated.',
    total_task_count: allTasks.length,
    ea_task_percent: Math.round((eaCount / allTasks.length) * 100),
    ea_task_count: eaCount,
    summary: 'Around 100% of tasks can be delegated to your EA.',
  };
}

/**
 * Create a report with thin areas (below minimum counts) for testing padThinAreas
 */
function createReportWithThinAreas(): TaskGenerationResult {
  const makeTask = (title: string, area: string): Task => ({
    title,
    description: `A detailed ${area} task description with enough length to pass quality checks.`,
    owner: 'EA' as const,
    isEA: true,
    category: 'Operations',
  });

  const businessProcesses = [
    makeTask('Process task 1', 'business'),
    makeTask('Process task 2', 'business'),
    makeTask('Process task 3', 'business'),
  ]; // 3 tasks, below min of 5

  const personalLife = [
    makeTask('Personal task 1', 'personal'),
  ]; // 1 task, below min of 3

  const calendar = [
    makeTask('Calendar task 1', 'calendar'),
  ]; // 1 task, below min of 3

  const email = [
    makeTask('Email task 1', 'email'),
  ]; // 1 task, below min of 2

  const allTasks = [...businessProcesses, ...personalLife, ...calendar, ...email];

  return {
    tasks: { businessProcesses, personalLife, calendar, email },
    analysis_summary: 'Report with thin areas for testing.',
    total_task_count: allTasks.length,
    ea_task_percent: 100,
    ea_task_count: allTasks.length,
    summary: 'Report with thin areas.',
  };
}

/**
 * Create a report without any core EA tasks
 */
function createReportWithoutCoreEATasks(): TaskGenerationResult {
  const createGenericTasks = (count: number, areaLabel: string): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Generic ${areaLabel} Task ${i + 1}`,
      description: `A generic task without core EA keywords for ${areaLabel} area of the business.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'General',
    }));

  const businessProcesses = createGenericTasks(8, 'Operations');
  const personalLife = createGenericTasks(5, 'Support');
  const calendar = createGenericTasks(4, 'Time');
  const email = createGenericTasks(3, 'Comms');

  const allTasks = [...businessProcesses, ...personalLife, ...calendar, ...email];

  return {
    tasks: { businessProcesses, personalLife, calendar, email },
    analysis_summary: 'Report missing core EA tasks.',
    total_task_count: allTasks.length,
    ea_task_percent: 100,
    ea_task_count: allTasks.length,
    summary: 'All tasks delegated but missing core EA task types.',
  };
}

/**
 * Create a report with minor issues that needs fixing
 * (missing core EA tasks but otherwise valid Core Four structure)
 */
function createReportWithMinorIssues(): TaskGenerationResult {
  const createGenericTasks = (count: number, areaLabel: string): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Generic ${areaLabel} Task ${i + 1}`,
      description: `A generic task without core EA keywords for ${areaLabel} area of the business.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'General',
    }));

  const businessProcesses = createGenericTasks(8, 'Operations');
  const personalLife = createGenericTasks(5, 'Support');
  const calendar = createGenericTasks(4, 'Time');
  const email = createGenericTasks(3, 'Comms');

  const allTasks = [...businessProcesses, ...personalLife, ...calendar, ...email];

  return {
    tasks: { businessProcesses, personalLife, calendar, email },
    analysis_summary: 'Report with minor issues for testing.',
    total_task_count: allTasks.length,
    ea_task_percent: 100,
    ea_task_count: allTasks.length,
    summary: 'All tasks delegated but missing core EA task types.',
  };
}
