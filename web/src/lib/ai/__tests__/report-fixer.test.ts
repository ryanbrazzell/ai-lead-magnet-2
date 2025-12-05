/**
 * Report Fixer Tests
 *
 * Tests for auto-fix behavior ported from reportValidator.ts
 *
 * @module report-fixer.test
 */

import { describe, it, expect } from 'vitest';
import {
  ensureCoreEATasks,
  fixLowEAPercentage,
  fixTaskCount,
  isGoodEACandidate,
  fixReportIssues,
} from '../report-fixer';
import type { Task, TaskGenerationResult } from '@/types';

/**
 * Helper to create a valid task
 */
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    title: 'Test Task',
    description: 'This is a test task description for testing purposes.',
    owner: 'You',
    isEA: false,
    category: 'Testing',
    frequency: 'daily',
    priority: 'medium',
    ...overrides,
  };
}

/**
 * Helper to create a valid TaskGenerationResult
 */
function createValidReport(overrides: Partial<TaskGenerationResult> = {}): TaskGenerationResult {
  const dailyTasks: Task[] = Array.from({ length: 10 }, (_, i) =>
    createTask({
      title: `Daily Task ${i + 1}`,
      frequency: 'daily',
      isEA: i < 4, // 4 EA tasks per frequency for 40%
      owner: i < 4 ? 'EA' : 'You',
    })
  );

  const weeklyTasks: Task[] = Array.from({ length: 10 }, (_, i) =>
    createTask({
      title: `Weekly Task ${i + 1}`,
      frequency: 'weekly',
      isEA: i < 4,
      owner: i < 4 ? 'EA' : 'You',
    })
  );

  const monthlyTasks: Task[] = Array.from({ length: 10 }, (_, i) =>
    createTask({
      title: `Monthly Task ${i + 1}`,
      frequency: 'monthly',
      isEA: i < 4,
      owner: i < 4 ? 'EA' : 'You',
    })
  );

  return {
    tasks: {
      daily: dailyTasks,
      weekly: weeklyTasks,
      monthly: monthlyTasks,
    },
    ea_task_percent: 40,
    ea_task_count: 12,
    total_task_count: 30,
    summary: 'Test report summary.',
    ...overrides,
  };
}

describe('report-fixer', () => {
  /**
   * Test 1: ensureCoreEATasks injects missing core tasks
   *
   * This test verifies that when core EA tasks are missing,
   * the function correctly injects them by replacing lowest-priority tasks.
   */
  describe('ensureCoreEATasks', () => {
    it('injects missing core tasks by replacing lowest-priority tasks', () => {
      // Create a report missing all core EA tasks
      const report = createValidReport();

      // Ensure no core EA tasks exist
      const allTasks = [
        ...report.tasks.daily,
        ...report.tasks.weekly,
        ...report.tasks.monthly,
      ];

      // Verify no email/calendar/personal/business process tasks exist initially
      const hasEmailTask = allTasks.some(
        (t) => t.isEA && t.title.toLowerCase().includes('email')
      );
      const hasCalendarTask = allTasks.some(
        (t) => t.isEA && t.title.toLowerCase().includes('calendar')
      );

      expect(hasEmailTask).toBe(false);
      expect(hasCalendarTask).toBe(false);

      // Run the fixer
      const fixedReport = ensureCoreEATasks(report);

      // Verify core tasks were injected
      const fixedAllTasks = [
        ...fixedReport.tasks.daily,
        ...fixedReport.tasks.weekly,
        ...fixedReport.tasks.monthly,
      ];

      // Check for email management task
      const hasEmailAfter = fixedAllTasks.some(
        (t) =>
          t.isEA &&
          (t.title.toLowerCase().includes('email') ||
            t.description.toLowerCase().includes('email'))
      );

      // Check for calendar management task
      const hasCalendarAfter = fixedAllTasks.some(
        (t) =>
          t.isEA &&
          (t.title.toLowerCase().includes('calendar') ||
            t.description.toLowerCase().includes('calendar'))
      );

      expect(hasEmailAfter).toBe(true);
      expect(hasCalendarAfter).toBe(true);

      // Total should still be 30
      expect(fixedAllTasks.length).toBe(30);
    });

    it('recalculates EA percentage after injection', () => {
      // Create report with low EA percentage
      const report = createValidReport();
      report.tasks.daily = report.tasks.daily.map((t) => ({
        ...t,
        isEA: false,
        owner: 'You' as const,
      }));
      report.ea_task_percent = 27; // Below 40%

      const fixedReport = ensureCoreEATasks(report);

      // EA percentage should be recalculated after core task injection
      const allTasks = [
        ...fixedReport.tasks.daily,
        ...fixedReport.tasks.weekly,
        ...fixedReport.tasks.monthly,
      ];
      const eaCount = allTasks.filter((t) => t.isEA).length;
      const expectedPercentage = Math.round((eaCount / allTasks.length) * 100);

      expect(fixedReport.ea_task_percent).toBe(expectedPercentage);
    });
  });

  /**
   * Test 2: fixLowEAPercentage converts delegatable tasks to EA
   *
   * This test verifies that founder tasks matching delegation keywords
   * are converted to EA tasks to reach the 40% minimum.
   */
  describe('fixLowEAPercentage', () => {
    it('converts delegatable founder tasks to EA to reach 40% minimum', () => {
      // Create report with low EA percentage and tasks with delegatable keywords
      const report = createValidReport();

      // Daily: All have delegatable keywords, all founder tasks
      report.tasks.daily = Array.from({ length: 10 }, (_, i) =>
        createTask({
          title: `Schedule meeting ${i + 1}`,
          description: 'Coordinate and book meetings with clients',
          frequency: 'daily',
          isEA: false,
          owner: 'You',
        })
      );

      // Weekly: All have delegatable keywords, all founder tasks
      report.tasks.weekly = Array.from({ length: 10 }, (_, i) =>
        createTask({
          title: `Research topic ${i + 1}`,
          description: 'Compile research data and update records',
          frequency: 'weekly',
          isEA: false,
          owner: 'You',
        })
      );

      // Monthly: 2 EA tasks, rest are founder with keywords
      report.tasks.monthly = Array.from({ length: 10 }, (_, i) =>
        createTask({
          title: `Process reports ${i + 1}`,
          description: 'Handle and organize monthly reports',
          frequency: 'monthly',
          isEA: i < 2,
          owner: i < 2 ? 'EA' : 'You',
        })
      );

      report.ea_task_percent = 7; // Very low

      const fixedReport = fixLowEAPercentage(report);

      // Check that EA percentage has increased
      const allTasks = [
        ...fixedReport.tasks.daily,
        ...fixedReport.tasks.weekly,
        ...fixedReport.tasks.monthly,
      ];
      const eaCount = allTasks.filter((t) => t.isEA).length;
      const percentage = Math.round((eaCount / allTasks.length) * 100);

      // Should be at or above 40%
      expect(percentage).toBeGreaterThanOrEqual(40);
      expect(fixedReport.ea_task_percent).toBeGreaterThanOrEqual(40);
    });

    it('converts tasks with delegatable keywords first', () => {
      const report = createValidReport();

      // Set up tasks - some with keywords, some without
      report.tasks.daily = [
        createTask({
          title: 'Schedule appointments',
          description: 'Book and coordinate appointments',
          isEA: false,
          owner: 'You',
        }),
        createTask({
          title: 'Research competitors',
          description: 'Research and compile competitor data',
          isEA: false,
          owner: 'You',
        }),
        createTask({
          title: 'Strategic planning',
          description: 'High-level business strategy work',
          isEA: false,
          owner: 'You',
        }),
        ...Array.from({ length: 7 }, () =>
          createTask({ isEA: false, owner: 'You' })
        ),
      ];

      report.ea_task_percent = 0;

      const fixedReport = fixLowEAPercentage(report);

      // The tasks with keywords should be converted first
      const scheduleTask = fixedReport.tasks.daily.find((t) =>
        t.title.includes('Schedule')
      );
      const researchTask = fixedReport.tasks.daily.find((t) =>
        t.title.includes('Research')
      );

      expect(scheduleTask?.isEA).toBe(true);
      expect(researchTask?.isEA).toBe(true);
    });
  });

  /**
   * Test 3: fixTaskCount trims/pads to exactly 10 per frequency
   *
   * This test verifies that task arrays are trimmed if over 10
   * or padded with generic tasks if under 10.
   */
  describe('fixTaskCount', () => {
    it('trims tasks to 10 if over limit', () => {
      const report = createValidReport();

      // Add extra tasks (12 daily instead of 10)
      report.tasks.daily = Array.from({ length: 12 }, (_, i) =>
        createTask({
          title: `Daily Task ${i + 1}`,
          frequency: 'daily',
        })
      );

      const fixedReport = fixTaskCount(report);

      expect(fixedReport.tasks.daily.length).toBe(10);
      expect(fixedReport.tasks.weekly.length).toBe(10);
      expect(fixedReport.tasks.monthly.length).toBe(10);
    });

    it('pads tasks to 10 if under limit', () => {
      const report = createValidReport();

      // Reduce to only 5 daily tasks
      report.tasks.daily = Array.from({ length: 5 }, (_, i) =>
        createTask({
          title: `Daily Task ${i + 1}`,
          frequency: 'daily',
        })
      );

      // Reduce to only 7 weekly tasks
      report.tasks.weekly = Array.from({ length: 7 }, (_, i) =>
        createTask({
          title: `Weekly Task ${i + 1}`,
          frequency: 'weekly',
        })
      );

      const fixedReport = fixTaskCount(report);

      expect(fixedReport.tasks.daily.length).toBe(10);
      expect(fixedReport.tasks.weekly.length).toBe(10);
      expect(fixedReport.tasks.monthly.length).toBe(10);

      // Total should be exactly 30
      const totalTasks =
        fixedReport.tasks.daily.length +
        fixedReport.tasks.weekly.length +
        fixedReport.tasks.monthly.length;
      expect(totalTasks).toBe(30);
    });

    it('creates generic tasks with appropriate frequency', () => {
      const report = createValidReport();

      // Reduce to only 8 monthly tasks
      report.tasks.monthly = Array.from({ length: 8 }, (_, i) =>
        createTask({
          title: `Monthly Task ${i + 1}`,
          frequency: 'monthly',
        })
      );

      const fixedReport = fixTaskCount(report);

      // The padded tasks should have valid structure
      const paddedTasks = fixedReport.tasks.monthly.slice(8);
      paddedTasks.forEach((task) => {
        expect(task.title).toBeDefined();
        expect(task.title.length).toBeGreaterThan(0);
        expect(task.description).toBeDefined();
        expect(task.description.length).toBeGreaterThan(20);
        expect(task.owner).toBe('You');
        expect(task.isEA).toBe(false);
      });
    });
  });

  /**
   * Test 4: isGoodEACandidate identifies delegatable keywords
   *
   * This test verifies that the function correctly identifies
   * tasks that are good candidates for EA delegation based on keywords.
   */
  describe('isGoodEACandidate', () => {
    it('identifies tasks with delegatable keywords', () => {
      const delegatableTasks = [
        createTask({
          title: 'Schedule client meetings',
          description: 'Book and coordinate meeting times',
        }),
        createTask({
          title: 'Organize documents',
          description: 'File and maintain document structure',
        }),
        createTask({
          title: 'Research industry trends',
          description: 'Compile research on market trends',
        }),
        createTask({
          title: 'Update CRM records',
          description: 'Maintain and update customer records',
        }),
        createTask({
          title: 'Follow up with leads',
          description: 'Track and follow up on sales leads',
        }),
        createTask({
          title: 'Arrange travel',
          description: 'Book flights and handle travel logistics',
        }),
        createTask({
          title: 'Process invoices',
          description: 'Handle and process vendor invoices',
        }),
        createTask({
          title: 'Monitor social media',
          description: 'Track and monitor social engagement',
        }),
        createTask({
          title: 'Prepare meeting notes',
          description: 'Draft and review meeting summaries',
        }),
        createTask({
          title: 'Coordinate with vendors',
          description: 'Manage vendor relationships and coordination',
        }),
      ];

      delegatableTasks.forEach((task) => {
        expect(isGoodEACandidate(task)).toBe(true);
      });
    });

    it('rejects tasks without delegatable keywords', () => {
      const nonDelegatableTasks = [
        createTask({
          title: 'Make strategic decisions',
          description: 'High-level business strategy work',
        }),
        createTask({
          title: 'Lead team meeting',
          description: 'Conduct team leadership session',
        }),
        createTask({
          title: 'Build client relationships',
          description: 'Network and build partnerships',
        }),
        createTask({
          title: 'Create vision statement',
          description: 'Define company direction and vision',
        }),
      ];

      nonDelegatableTasks.forEach((task) => {
        expect(isGoodEACandidate(task)).toBe(false);
      });
    });

    it('matches keywords case-insensitively', () => {
      const taskWithUppercase = createTask({
        title: 'SCHEDULE Important Meeting',
        description: 'COORDINATE with team members',
      });

      expect(isGoodEACandidate(taskWithUppercase)).toBe(true);
    });

    it('matches keywords in description as well as title', () => {
      const taskWithKeywordInDescription = createTask({
        title: 'Important Task',
        description: 'Need to research and compile data for the project',
      });

      expect(isGoodEACandidate(taskWithKeywordInDescription)).toBe(true);
    });
  });

  /**
   * Test fixReportIssues orchestration function
   */
  describe('fixReportIssues', () => {
    it('calls fixLowEAPercentage when EA percentage is low', () => {
      const report = createValidReport();
      report.ea_task_percent = 20;

      // Make all tasks have keywords so they can be converted
      report.tasks.daily = report.tasks.daily.map((t) => ({
        ...t,
        title: 'Schedule meeting',
        description: 'Coordinate and book meetings',
        isEA: false,
        owner: 'You' as const,
      }));

      report.tasks.weekly = report.tasks.weekly.map((t) => ({
        ...t,
        title: 'Research topics',
        description: 'Compile and organize research data',
        isEA: false,
        owner: 'You' as const,
      }));

      report.tasks.monthly = report.tasks.monthly.map((t) => ({
        ...t,
        title: 'Process reports',
        description: 'Handle monthly report processing',
        isEA: false,
        owner: 'You' as const,
      }));

      const errors = ['EA percentage too low: 20% (minimum 40%)'];

      const fixedReport = fixReportIssues(report, errors);

      expect(fixedReport.ea_task_percent).toBeGreaterThanOrEqual(40);
    });

    it('calls fixTaskCount when task count is wrong', () => {
      const report = createValidReport();

      // Add extra tasks
      report.tasks.daily = Array.from({ length: 15 }, (_, i) =>
        createTask({
          title: `Daily Task ${i + 1}`,
          frequency: 'daily',
        })
      );

      const errors = ['Expected 30 total tasks, got 35'];

      const fixedReport = fixReportIssues(report, errors);

      expect(fixedReport.tasks.daily.length).toBe(10);
    });

    it('handles multiple errors', () => {
      const report = createValidReport();

      // Create a report with multiple issues - all tasks have keywords
      report.tasks.daily = Array.from({ length: 12 }, (_, i) =>
        createTask({
          title: 'Schedule appointments',
          description: 'Coordinate meeting times',
          frequency: 'daily',
          isEA: false,
          owner: 'You',
        })
      );

      report.tasks.weekly = report.tasks.weekly.map((t) => ({
        ...t,
        title: 'Research topics',
        description: 'Compile and organize data',
        isEA: false,
        owner: 'You' as const,
      }));

      report.tasks.monthly = report.tasks.monthly.map((t) => ({
        ...t,
        title: 'Process reports',
        description: 'Handle and update monthly data',
        isEA: false,
        owner: 'You' as const,
      }));

      report.ea_task_percent = 10;

      const errors = [
        'Expected 30 total tasks, got 32',
        'EA percentage too low: 10% (minimum 40%)',
      ];

      const fixedReport = fixReportIssues(report, errors);

      // Both issues should be fixed
      const totalTasks =
        fixedReport.tasks.daily.length +
        fixedReport.tasks.weekly.length +
        fixedReport.tasks.monthly.length;

      expect(totalTasks).toBe(30);
      expect(fixedReport.ea_task_percent).toBeGreaterThanOrEqual(40);
    });
  });
});
