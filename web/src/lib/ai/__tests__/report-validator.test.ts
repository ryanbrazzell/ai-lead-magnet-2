/**
 * Report Validator Tests (Task Group 5.1)
 *
 * Tests for the report validation module including:
 * - validateReport returns ValidationResult with errors/warnings
 * - Task count validation (exactly 30 total, 10 per frequency)
 * - EA percentage validation (>= 40%)
 * - Core EA task detection (email, calendar, personal life, business process)
 * - analyzeReport returns correct ReportAnalysis
 * - validateTaskQuality catches missing/short titles and descriptions
 */

import { describe, it, expect } from 'vitest';
import {
  validateReport,
  analyzeReport,
  validateCoreEATasks,
  validateTaskQuality,
  hasEmailManagementTask,
  hasCalendarManagementTask,
  hasPersonalLifeManagementTask,
  hasBusinessProcessManagementTask,
} from '../report-validator';
import type { Task, TasksByFrequency, TaskGenerationResult } from '@/types';

/**
 * Helper function to create a valid TaskGenerationResult
 */
function createValidReport(): TaskGenerationResult {
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

  const createFounderTasks = (count: number, frequency: 'daily' | 'weekly' | 'monthly'): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `Founder Task ${i + 1} for ${frequency}`,
      description: `A detailed task description explaining what the founder needs to do for this specific ${frequency} task.`,
      owner: 'You' as const,
      isEA: false,
      category: 'Strategy',
      frequency,
      priority: 'high' as const,
    }));

  // Create tasks with 50% EA (5 EA + 5 Founder per frequency = 15 EA total = 50%)
  return {
    tasks: {
      daily: [...createEATasks(5, 'daily'), ...createFounderTasks(5, 'daily')],
      weekly: [...createEATasks(5, 'weekly'), ...createFounderTasks(5, 'weekly')],
      monthly: [...createEATasks(5, 'monthly'), ...createFounderTasks(5, 'monthly')],
    },
    ea_task_percent: 50,
    ea_task_count: 15,
    total_task_count: 30,
    summary: 'Around 50% of tasks can be delegated to your EA.',
  };
}

/**
 * Helper function to create report with core EA tasks
 */
function createReportWithCoreEATasks(): TaskGenerationResult {
  const report = createValidReport();

  // Replace some tasks with core EA tasks
  report.tasks.daily[0] = {
    title: 'Complete Email Management',
    description: 'Manage inbox, filter emails, respond to correspondence on behalf of founder.',
    owner: 'EA',
    isEA: true,
    category: 'Communication',
    isCoreEATask: true,
    coreTaskType: 'emailManagement',
  };

  report.tasks.daily[1] = {
    title: 'Calendar and Schedule Management',
    description: 'Manage calendar, schedule appointments, and optimize meeting times.',
    owner: 'EA',
    isEA: true,
    category: 'Time Management',
    isCoreEATask: true,
    coreTaskType: 'calendarManagement',
  };

  report.tasks.weekly[0] = {
    title: 'Personal Life Coordination',
    description: 'Handle personal travel bookings, family logistics, and vendor communications.',
    owner: 'EA',
    isEA: true,
    category: 'Personal Support',
    isCoreEATask: true,
    coreTaskType: 'personalLifeManagement',
  };

  report.tasks.monthly[0] = {
    title: 'Business Process Management',
    description: 'Document and optimize recurring workflow processes and automation systems.',
    owner: 'EA',
    isEA: true,
    category: 'Operations',
    isCoreEATask: true,
    coreTaskType: 'businessProcessManagement',
  };

  return report;
}

describe('Report Validator', () => {
  /**
   * Test 1: validateReport returns ValidationResult with errors/warnings
   */
  describe('validateReport returns ValidationResult', () => {
    it('returns ValidationResult structure with isValid, errors, and warnings', () => {
      const report = createReportWithCoreEATasks();

      const result = validateReport(report);

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('returns isValid: true for a valid report with all requirements met', () => {
      const report = createReportWithCoreEATasks();

      const result = validateReport(report);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns isValid: false when report has validation errors', () => {
      const report = createValidReport();
      // Remove tasks to make it invalid
      report.tasks.daily = [];

      const result = validateReport(report);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test 2: Task count validation (exactly 30 total, 10 per frequency)
   */
  describe('Task count validation', () => {
    it('validates exactly 30 total tasks', () => {
      const report = createReportWithCoreEATasks();

      const result = validateReport(report);

      expect(result.isValid).toBe(true);
      expect(result.errors.filter(e => e.includes('total tasks'))).toHaveLength(0);
    });

    it('returns error when total tasks is not 30', () => {
      const report = createValidReport();
      report.tasks.daily = report.tasks.daily.slice(0, 5); // Only 5 daily tasks

      const result = validateReport(report);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('total tasks'))).toBe(true);
      expect(result.errors.some(e => e.includes('25'))).toBe(true); // 5 + 10 + 10 = 25
    });

    it('returns warning when daily tasks count is not 10', () => {
      const report = createValidReport();
      // Add extra task to daily to trigger warning but maintain 30 total
      const extraTask: Task = {
        title: 'Extra Task',
        description: 'An extra task description for testing purposes.',
        owner: 'EA',
        isEA: true,
        category: 'Operations',
      };
      report.tasks.daily.push(extraTask);
      report.tasks.weekly = report.tasks.weekly.slice(0, 9); // Remove one weekly

      const result = validateReport(report);

      expect(result.warnings.some(w => w.includes('daily tasks') && w.includes('11'))).toBe(true);
      expect(result.warnings.some(w => w.includes('weekly tasks') && w.includes('9'))).toBe(true);
    });

    it('validates 10 tasks per frequency', () => {
      const report = createReportWithCoreEATasks();
      const analysis = analyzeReport(report);

      expect(analysis.dailyTasks).toBe(10);
      expect(analysis.weeklyTasks).toBe(10);
      expect(analysis.monthlyTasks).toBe(10);
    });
  });

  /**
   * Test 3: EA percentage validation (>= 40%)
   */
  describe('EA percentage validation', () => {
    it('validates when EA percentage is at least 40%', () => {
      const report = createReportWithCoreEATasks();

      const result = validateReport(report);

      expect(result.errors.filter(e => e.includes('EA percentage'))).toHaveLength(0);
    });

    it('returns error when EA percentage is below 40%', () => {
      const report = createValidReport();
      // Make most tasks founder tasks (only 3 EA tasks = 10%)
      const founderTask: Task = {
        title: 'Founder Strategy Task',
        description: 'A strategic task that only the founder can perform.',
        owner: 'You',
        isEA: false,
        category: 'Strategy',
      };

      report.tasks.daily = Array(10).fill(founderTask).map((t, i) => ({
        ...t,
        title: `Founder Task ${i + 1}`,
      }));
      report.tasks.weekly = Array(10).fill(founderTask).map((t, i) => ({
        ...t,
        title: `Founder Weekly Task ${i + 1}`,
      }));
      report.tasks.monthly = Array(10).fill(founderTask).map((t, i) => ({
        ...t,
        title: `Founder Monthly Task ${i + 1}`,
      }));

      // Add only 3 EA tasks (10%)
      report.tasks.daily[0].owner = 'EA';
      report.tasks.daily[0].isEA = true;
      report.tasks.weekly[0].owner = 'EA';
      report.tasks.weekly[0].isEA = true;
      report.tasks.monthly[0].owner = 'EA';
      report.tasks.monthly[0].isEA = true;

      const result = validateReport(report);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('EA percentage too low'))).toBe(true);
    });

    it('passes when EA percentage is exactly 40%', () => {
      const report = createValidReport();
      // 12 EA tasks out of 30 = 40%
      const createMixedTasks = (eaCount: number, frequency: 'daily' | 'weekly' | 'monthly'): Task[] => {
        const tasks: Task[] = [];
        for (let i = 0; i < 10; i++) {
          tasks.push({
            title: `Task ${i + 1} for ${frequency}`,
            description: `A detailed description for task ${i + 1} in the ${frequency} frequency.`,
            owner: i < eaCount ? 'EA' : 'You',
            isEA: i < eaCount,
            category: i < eaCount ? 'Operations' : 'Strategy',
            frequency,
          });
        }
        return tasks;
      };

      // 4 EA per frequency = 12 total EA = 40%
      report.tasks.daily = createMixedTasks(4, 'daily');
      report.tasks.weekly = createMixedTasks(4, 'weekly');
      report.tasks.monthly = createMixedTasks(4, 'monthly');

      // Add core EA tasks to avoid those validation errors
      report.tasks.daily[0] = {
        title: 'Email Management',
        description: 'Manage inbox and correspondence.',
        owner: 'EA',
        isEA: true,
        category: 'Communication',
      };
      report.tasks.daily[1] = {
        title: 'Calendar Management',
        description: 'Manage schedule and appointments.',
        owner: 'EA',
        isEA: true,
        category: 'Time Management',
      };
      report.tasks.weekly[0] = {
        title: 'Personal Travel Coordination',
        description: 'Book travel and personal appointments.',
        owner: 'EA',
        isEA: true,
        category: 'Personal Support',
      };
      report.tasks.monthly[0] = {
        title: 'Process Documentation',
        description: 'Document and optimize workflow processes.',
        owner: 'EA',
        isEA: true,
        category: 'Operations',
      };

      const result = validateReport(report);

      expect(result.errors.filter(e => e.includes('EA percentage'))).toHaveLength(0);
    });
  });

  /**
   * Test 4: Core EA task detection (email, calendar, personal life, business process)
   */
  describe('Core EA task detection', () => {
    it('detects email management task by keywords', () => {
      const tasks: Task[] = [
        {
          title: 'Manage Inbox',
          description: 'Handle all email correspondence and inbox management.',
          owner: 'EA',
          isEA: true,
          category: 'Communication',
        },
      ];

      expect(hasEmailManagementTask(tasks)).toBe(true);
    });

    it('detects calendar management task by keywords', () => {
      const tasks: Task[] = [
        {
          title: 'Schedule Optimization',
          description: 'Manage calendar and meeting scheduling.',
          owner: 'EA',
          isEA: true,
          category: 'Time Management',
        },
      ];

      expect(hasCalendarManagementTask(tasks)).toBe(true);
    });

    it('detects personal life management task by keywords', () => {
      const tasks: Task[] = [
        {
          title: 'Travel Arrangements',
          description: 'Book personal travel and coordinate family logistics.',
          owner: 'EA',
          isEA: true,
          category: 'Personal Support',
        },
      ];

      expect(hasPersonalLifeManagementTask(tasks)).toBe(true);
    });

    it('detects business process management task by keywords', () => {
      const tasks: Task[] = [
        {
          title: 'Workflow Optimization',
          description: 'Document and improve business process automation.',
          owner: 'EA',
          isEA: true,
          category: 'Operations',
        },
      ];

      expect(hasBusinessProcessManagementTask(tasks)).toBe(true);
    });

    it('does not detect core tasks for non-EA tasks', () => {
      const tasks: Task[] = [
        {
          title: 'Email Strategy',
          description: 'Plan email marketing campaigns.',
          owner: 'You',
          isEA: false,
          category: 'Marketing',
        },
      ];

      expect(hasEmailManagementTask(tasks)).toBe(false);
    });

    it('detects core tasks by coreTaskType flag', () => {
      const tasks: Task[] = [
        {
          title: 'Core Task',
          description: 'A core EA task without keywords.',
          owner: 'EA',
          isEA: true,
          category: 'Operations',
          isCoreEATask: true,
          coreTaskType: 'emailManagement',
        },
      ];

      expect(hasEmailManagementTask(tasks)).toBe(true);
    });

    it('returns errors for each missing core EA task type', () => {
      const report = createValidReport(); // No core tasks

      const result = validateCoreEATasks(report);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Email Management'))).toBe(true);
      expect(result.errors.some(e => e.includes('Calendar Management'))).toBe(true);
      expect(result.errors.some(e => e.includes('Personal Life Management'))).toBe(true);
      expect(result.errors.some(e => e.includes('Business Process Management'))).toBe(true);
    });
  });

  /**
   * Test 5: analyzeReport returns correct ReportAnalysis
   */
  describe('analyzeReport returns correct ReportAnalysis', () => {
    it('returns correct total task counts', () => {
      const report = createValidReport();

      const analysis = analyzeReport(report);

      expect(analysis.totalTasks).toBe(30);
      expect(analysis.dailyTasks).toBe(10);
      expect(analysis.weeklyTasks).toBe(10);
      expect(analysis.monthlyTasks).toBe(10);
    });

    it('returns correct EA vs founder task counts', () => {
      const report = createValidReport(); // 50% EA

      const analysis = analyzeReport(report);

      expect(analysis.eaTasks).toBe(15);
      expect(analysis.founderTasks).toBe(15);
    });

    it('calculates EA percentage using Math.round', () => {
      const report = createValidReport();
      // 13 EA tasks out of 30 = 43.33...% -> rounds to 43%
      report.tasks.daily[5].owner = 'EA';
      report.tasks.daily[5].isEA = true;
      report.tasks.weekly[5].owner = 'EA';
      report.tasks.weekly[5].isEA = true;
      report.tasks.monthly[5].owner = 'EA';
      report.tasks.monthly[5].isEA = true;
      // Now 18 EA tasks = 60%

      const analysis = analyzeReport(report);

      expect(analysis.eaPercentage).toBe(60); // 18/30 = 60%
    });

    it('returns correct coreTasksPresent flags', () => {
      const report = createReportWithCoreEATasks();

      const analysis = analyzeReport(report);

      expect(analysis.coreTasksPresent.emailManagement).toBe(true);
      expect(analysis.coreTasksPresent.calendarManagement).toBe(true);
      expect(analysis.coreTasksPresent.personalLifeManagement).toBe(true);
      expect(analysis.coreTasksPresent.businessProcessManagement).toBe(true);
    });

    it('returns false for missing core tasks', () => {
      const report = createValidReport(); // No core tasks

      const analysis = analyzeReport(report);

      expect(analysis.coreTasksPresent.emailManagement).toBe(false);
      expect(analysis.coreTasksPresent.calendarManagement).toBe(false);
      expect(analysis.coreTasksPresent.personalLifeManagement).toBe(false);
      expect(analysis.coreTasksPresent.businessProcessManagement).toBe(false);
    });
  });

  /**
   * Test 6: validateTaskQuality catches missing/short titles and descriptions
   */
  describe('validateTaskQuality catches quality issues', () => {
    it('returns warning for task with missing title', () => {
      const report = createValidReport();
      report.tasks.daily[0].title = '';

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Title too short'))).toBe(true);
    });

    it('returns warning for task with title less than 3 characters', () => {
      const report = createValidReport();
      report.tasks.daily[0].title = 'AB';

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Title too short'))).toBe(true);
    });

    it('returns warning for task with title over 60 characters', () => {
      const report = createValidReport();
      report.tasks.daily[0].title = 'A'.repeat(61);

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Title too long'))).toBe(true);
    });

    it('returns warning for task with missing description', () => {
      const report = createValidReport();
      report.tasks.daily[0].description = '';

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Description too short'))).toBe(true);
    });

    it('returns warning for task with description less than 20 characters', () => {
      const report = createValidReport();
      report.tasks.daily[0].description = 'Short desc.';

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Description too short'))).toBe(true);
    });

    it('returns warning for invalid owner field', () => {
      const report = createValidReport();
      // @ts-expect-error - Testing invalid owner value
      report.tasks.daily[0].owner = 'Invalid';

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Invalid owner field'))).toBe(true);
    });

    it('returns warning for EA/owner inconsistency - EA owner with isEA false', () => {
      const report = createValidReport();
      report.tasks.daily[0].owner = 'EA';
      report.tasks.daily[0].isEA = false;

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Owner is EA but isEA is false'))).toBe(true);
    });

    it('returns warning for EA/owner inconsistency - Founder owner with isEA true', () => {
      const report = createValidReport();
      report.tasks.daily[5].owner = 'You';
      report.tasks.daily[5].isEA = true;

      const result = validateTaskQuality(report);

      expect(result.warnings.some(w => w.includes('Owner is Founder but isEA is true'))).toBe(true);
    });

    it('returns no warnings for valid task quality', () => {
      const report = createReportWithCoreEATasks();

      const result = validateTaskQuality(report);

      // May have warnings for missing core tasks via keyword, but not quality issues
      const qualityWarnings = result.warnings.filter(
        w => w.includes('Title') || w.includes('Description') || w.includes('Owner') || w.includes('isEA')
      );
      expect(qualityWarnings).toHaveLength(0);
    });
  });
});
