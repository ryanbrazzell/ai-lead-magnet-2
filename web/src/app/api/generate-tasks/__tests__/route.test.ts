/**
 * API Route Tests for /api/generate-tasks (Task Group 7.1)
 *
 * Tests for the generate-tasks API endpoint including:
 * - POST /api/generate-tasks accepts valid UnifiedLeadData
 * - Returns 400 for invalid/missing lead data
 * - Returns TaskGenerationResult on success
 * - Returns structured error response on AI failure
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { UnifiedLeadData, TaskGenerationResult } from '@/types';

// Mock the task generator module
vi.mock('@/lib/ai/task-generator', () => ({
  generateTasks: vi.fn(),
}));

// Mock the report validator module
vi.mock('@/lib/ai/report-validator', () => ({
  validateReport: vi.fn(),
}));

// Mock the report fixer module
vi.mock('@/lib/ai/report-fixer', () => ({
  fixReportIssues: vi.fn(),
  ensureCoreEATasks: vi.fn(),
}));

import { POST } from '../route';
import { generateTasks } from '@/lib/ai/task-generator';
import { validateReport } from '@/lib/ai/report-validator';
import { fixReportIssues, ensureCoreEATasks } from '@/lib/ai/report-fixer';

describe('POST /api/generate-tasks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set up default mock for validateReport to return valid
    vi.mocked(validateReport).mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
    // Set up default mock for ensureCoreEATasks to pass through
    vi.mocked(ensureCoreEATasks).mockImplementation((report) => report);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Test 1: POST /api/generate-tasks accepts valid UnifiedLeadData
   */
  describe('accepts valid UnifiedLeadData', () => {
    it('accepts valid request with all required fields', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateTasks).mockResolvedValueOnce(mockResult);

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it('accepts all three lead types: main, standard, simple', async () => {
      const mockResult = createMockTaskResult();
      vi.mocked(generateTasks).mockResolvedValue(mockResult);

      const leadTypes: Array<'main' | 'standard' | 'simple'> = [
        'main',
        'standard',
        'simple',
      ];

      for (const leadType of leadTypes) {
        const mockLeadData = createMockLeadData(leadType);
        const request = createMockRequest(mockLeadData);
        const response = await POST(request);

        expect(response.status).toBe(200);
      }
    });

    it('calls generateTasks with the lead data', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateTasks).mockResolvedValueOnce(mockResult);

      const request = createMockRequest(mockLeadData);
      await POST(request);

      expect(generateTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          leadType: 'main',
          email: mockLeadData.email,
        })
      );
    });
  });

  /**
   * Test 2: Returns 400 for invalid/missing lead data
   */
  describe('returns 400 for invalid/missing lead data', () => {
    it('returns 400 when email is missing', async () => {
      const invalidLeadData = {
        leadType: 'main',
        timestamp: new Date().toISOString(),
        // Missing email
      };

      const request = createMockRequest(invalidLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('email');
    });

    it('returns 400 when leadType is missing', async () => {
      const invalidLeadData = {
        email: 'test@example.com',
        timestamp: new Date().toISOString(),
        // Missing leadType
      };

      const request = createMockRequest(invalidLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('leadType');
    });

    it('returns 400 when leadType is invalid', async () => {
      const invalidLeadData = {
        email: 'test@example.com',
        leadType: 'invalid-type',
        timestamp: new Date().toISOString(),
      };

      const request = createMockRequest(invalidLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toContain('leadType');
    });

    it('returns 400 with validation errors array', async () => {
      const invalidLeadData = {
        timestamp: new Date().toISOString(),
        // Missing both email and leadType
      };

      const request = createMockRequest(invalidLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
      expect(json.correlationId).toBeDefined();
    });
  });

  /**
   * Test 3: Returns TaskGenerationResult on success
   */
  describe('returns TaskGenerationResult on success', () => {
    it('returns complete TaskGenerationResult with 30 tasks', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateTasks).mockResolvedValueOnce(mockResult);

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.tasks).toBeDefined();
      expect(json.data.tasks.daily).toHaveLength(10);
      expect(json.data.tasks.weekly).toHaveLength(10);
      expect(json.data.tasks.monthly).toHaveLength(10);
      expect(json.data.total_task_count).toBe(30);
    });

    it('returns EA metrics in result', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateTasks).mockResolvedValueOnce(mockResult);

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(json.data.ea_task_percent).toBeDefined();
      expect(json.data.ea_task_count).toBeDefined();
      expect(json.data.summary).toBeDefined();
    });

    it('validates and potentially fixes report before returning', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateTasks).mockResolvedValueOnce(mockResult);
      vi.mocked(validateReport).mockReturnValueOnce({
        isValid: false,
        errors: ['EA percentage too low: 30% (minimum 40%)'],
        warnings: [],
      });
      vi.mocked(fixReportIssues).mockReturnValueOnce({
        ...mockResult,
        ea_task_percent: 45,
      });
      // After fix, validation passes
      vi.mocked(validateReport).mockReturnValueOnce({
        isValid: true,
        errors: [],
        warnings: [],
      });

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(fixReportIssues).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it('ensures core EA tasks are present', async () => {
      const mockLeadData = createMockLeadData('main');
      const mockResult = createMockTaskResult();

      vi.mocked(generateTasks).mockResolvedValueOnce(mockResult);

      const request = createMockRequest(mockLeadData);
      await POST(request);

      expect(ensureCoreEATasks).toHaveBeenCalled();
    });
  });

  /**
   * Test 4: Returns structured error response on AI failure
   */
  describe('returns structured error response on AI failure', () => {
    it('returns 500 with structured error on generateTasks failure', async () => {
      const mockLeadData = createMockLeadData('main');

      vi.mocked(generateTasks).mockRejectedValueOnce(
        new Error('All task generation attempts failed')
      );

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
      expect(json.correlationId).toBeDefined();
    });

    it('returns 401 when API key is missing', async () => {
      const mockLeadData = createMockLeadData('main');

      vi.mocked(generateTasks).mockRejectedValueOnce(
        new Error('Missing API key: Set GEMINI_API_KEY or GOOGLE_API_KEY')
      );

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error).toContain('API key');
    });

    it('includes correlation ID for debugging', async () => {
      const mockLeadData = createMockLeadData('main');

      vi.mocked(generateTasks).mockRejectedValueOnce(new Error('Unknown error'));

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(json.correlationId).toBeDefined();
      expect(typeof json.correlationId).toBe('string');
      expect(json.correlationId.length).toBeGreaterThan(0);
    });

    it('returns 500 for timeout errors', async () => {
      const mockLeadData = createMockLeadData('main');

      vi.mocked(generateTasks).mockRejectedValueOnce(
        new Error('Gemini API request timed out after 30000ms')
      );

      const request = createMockRequest(mockLeadData);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toContain('timed out');
    });
  });
});

/**
 * Helper function to create a mock NextRequest
 */
function createMockRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/generate-tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

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
