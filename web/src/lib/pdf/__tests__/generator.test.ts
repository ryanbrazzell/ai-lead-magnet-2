/**
 * PDF Generator Service Tests
 *
 * Tests for the main PDF generation function that orchestrates
 * the creation of EA Time Freedom Report documents.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePDF } from '../generator';
import type { TaskGenerationResult, Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';

// Helper to create test tasks
const createTestTask = (
  index: number,
  frequency: 'daily' | 'weekly' | 'monthly',
  isEA: boolean
): Task => ({
  title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Task ${index + 1}`,
  description: `This is a ${frequency} task description for testing purposes. It should be wrapped properly in the PDF.`,
  owner: isEA ? 'EA' : 'You',
  isEA,
  category: isEA ? 'Administration' : 'Strategy',
  frequency,
});

// Helper to create a complete TaskGenerationResult with 30 tasks
const createTestReport = (eaPercent: number = 50): TaskGenerationResult => {
  const dailyTasks: Task[] = Array(10)
    .fill(null)
    .map((_, i) => createTestTask(i, 'daily', i < 5)); // 5 EA, 5 non-EA

  const weeklyTasks: Task[] = Array(10)
    .fill(null)
    .map((_, i) => createTestTask(i, 'weekly', i < 5));

  const monthlyTasks: Task[] = Array(10)
    .fill(null)
    .map((_, i) => createTestTask(i, 'monthly', i < 5));

  const eaTaskCount = 15; // 5 from each frequency

  return {
    tasks: {
      daily: dailyTasks,
      weekly: weeklyTasks,
      monthly: monthlyTasks,
    },
    ea_task_percent: eaPercent,
    ea_task_count: eaTaskCount,
    total_task_count: 30,
    summary: `Based on our analysis, ${eaPercent}% of your tasks can be delegated to an EA.`,
  };
};

// Helper to create minimal lead data
const createMinimalLeadData = (): UnifiedLeadData => ({
  leadType: 'simple',
  timestamp: new Date().toISOString(),
});

// Helper to create full lead data
const createFullLeadData = (): UnifiedLeadData => ({
  leadType: 'main',
  timestamp: new Date().toISOString(),
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  title: 'CEO',
  businessType: 'Technology Consulting',
  website: 'https://example.com',
  challenges: 'Time management and delegation',
});

describe('PDF Generator Service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generatePDF', () => {
    it('creates valid PDF buffer', async () => {
      const report = createTestReport();
      const leadData = createFullLeadData();

      const result = await generatePDF(report, leadData);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer!.length).toBeGreaterThan(0);
      expect(result.size).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it('generates PDF with minimal lead data', async () => {
      const report = createTestReport();
      const leadData = createMinimalLeadData();

      const result = await generatePDF(report, leadData);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeDefined();
      expect(result.filename).toContain('EA_Time_Freedom_Report');
      expect(result.filename).toContain('Report'); // Default name when no first/last name
    });

    it('generates PDF with full lead data and correct filename', async () => {
      const report = createTestReport();
      const leadData = createFullLeadData();

      const result = await generatePDF(report, leadData);

      expect(result.success).toBe(true);
      expect(result.filename).toContain('EA_Time_Freedom_Report');
      expect(result.filename).toContain('John');
      expect(result.filename).toContain('Doe');
      expect(result.filename).toMatch(/\.pdf$/);
    });

    it('generates base64 output for API response', async () => {
      const report = createTestReport();
      const leadData = createFullLeadData();

      const result = await generatePDF(report, leadData);

      expect(result.success).toBe(true);
      expect(result.base64).toBeDefined();
      expect(typeof result.base64).toBe('string');
      expect(result.base64!.length).toBeGreaterThan(0);

      // Base64 should be decodable
      const decoded = Buffer.from(result.base64!, 'base64');
      expect(decoded.length).toBeGreaterThan(0);
    });

    it('includes all 30 tasks (10 per frequency)', async () => {
      const report = createTestReport();
      const leadData = createFullLeadData();

      // Verify the report has 30 tasks
      expect(report.tasks.daily.length).toBe(10);
      expect(report.tasks.weekly.length).toBe(10);
      expect(report.tasks.monthly.length).toBe(10);

      const result = await generatePDF(report, leadData);

      expect(result.success).toBe(true);
      // The PDF should be generated successfully with all tasks
      expect(result.buffer!.length).toBeGreaterThan(1000); // PDF with content should be > 1KB
    });

    it('handles error with invalid input gracefully', async () => {
      // Create invalid report with null tasks
      const invalidReport = {
        tasks: {
          daily: null as unknown as Task[],
          weekly: [],
          monthly: [],
        },
        ea_task_percent: 50,
        ea_task_count: 0,
        total_task_count: 0,
        summary: 'Test',
      } as TaskGenerationResult;

      const leadData = createFullLeadData();

      const result = await generatePDF(invalidReport, leadData);

      // Should return error result, not throw
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.filename).toContain('Error');
    });
  });
});
