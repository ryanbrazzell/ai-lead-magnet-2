/**
 * Report Validator Tests
 *
 * Tests for the report validation module including:
 * - validateReport returns ValidationResult with errors/warnings
 * - Core Four area task count validation
 * - Core EA task detection (email, calendar, personal life, business process)
 * - analyzeReport returns correct ReportAnalysis
 * - validateTaskQuality catches missing/short titles and descriptions
 * - Semantic dedup detection
 * - Anti-pattern detection
 */

import { describe, it, expect } from 'vitest';
import {
  validateReport,
  analyzeReport,
  validateCoreEATasks,
  validateTaskQuality,
  validateNoDuplicates,
  validateNoAntiPatterns,
  hasEmailManagementTask,
  hasCalendarManagementTask,
  hasPersonalLifeManagementTask,
  hasBusinessProcessManagementTask,
} from '../report-validator';
import type { Task, TaskGenerationResult } from '@/types';

/**
 * Helper: create a valid Core Four report
 */
function createValidReport(): TaskGenerationResult {
  const createTasks = (count: number, area: string, keyword: string): Task[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `${keyword} Task ${i + 1} for ${area}`,
      description: `A detailed description for ${keyword.toLowerCase()} task ${i + 1} in the ${area} area. This should be specific.`,
      owner: 'EA' as const,
      isEA: true,
      category: 'Operations',
    }));

  return {
    tasks: {
      businessProcesses: createTasks(8, 'business', 'Process'),
      personalLife: createTasks(5, 'personal', 'Personal'),
      calendar: createTasks(4, 'calendar', 'Calendar'),
      email: createTasks(3, 'email', 'Email'),
    },
    analysis_summary: 'Analysis of delegation opportunities.',
    total_task_count: 20,
    ea_task_percent: 100,
    ea_task_count: 20,
    summary: 'Analysis of delegation opportunities.',
  };
}

/**
 * Helper: create report with core EA tasks
 */
function createReportWithCoreEATasks(): TaskGenerationResult {
  const report = createValidReport();

  report.tasks.email[0] = {
    title: 'Complete Email Management',
    description: 'Manage inbox, filter emails, respond to correspondence on behalf of founder.',
    owner: 'EA',
    isEA: true,
    category: 'Communication',
    coreTaskType: 'emailManagement',
  };

  report.tasks.calendar[0] = {
    title: 'Calendar and Schedule Management',
    description: 'Manage calendar, schedule appointments, and optimize meeting times.',
    owner: 'EA',
    isEA: true,
    category: 'Scheduling',
    coreTaskType: 'calendarManagement',
  };

  report.tasks.personalLife[0] = {
    title: 'Personal Life Coordination',
    description: 'Handle personal travel bookings, family logistics, and vendor communications.',
    owner: 'EA',
    isEA: true,
    category: 'Personal',
    coreTaskType: 'personalLifeManagement',
  };

  report.tasks.businessProcesses[0] = {
    title: 'Business Process Management',
    description: 'Document and optimize recurring workflow processes and automation systems.',
    owner: 'EA',
    isEA: true,
    category: 'Operations',
    coreTaskType: 'businessProcessManagement',
  };

  return report;
}

describe('Report Validator', () => {
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

    it('returns isValid: true for a valid report', () => {
      const report = createReportWithCoreEATasks();
      const result = validateReport(report);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns isValid: false when report has too few tasks', () => {
      const report = createValidReport();
      report.tasks.businessProcesses = [];
      report.tasks.personalLife = [];
      report.tasks.calendar = [];

      const result = validateReport(report);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Too few tasks'))).toBe(true);
    });
  });

  describe('Core Four area validation', () => {
    it('warns when area has fewer tasks than target', () => {
      const report = createReportWithCoreEATasks();
      report.tasks.businessProcesses = report.tasks.businessProcesses.slice(0, 3);

      const result = validateReport(report);

      expect(result.warnings.some(w => w.includes('Business Processes'))).toBe(true);
    });
  });

  describe('Core EA task detection', () => {
    it('detects email management task by keywords', () => {
      const tasks: Task[] = [{
        title: 'Manage Inbox',
        description: 'Handle all email correspondence and inbox management.',
        owner: 'EA', isEA: true, category: 'Communication',
      }];
      expect(hasEmailManagementTask(tasks)).toBe(true);
    });

    it('detects calendar management task by keywords', () => {
      const tasks: Task[] = [{
        title: 'Schedule Optimization',
        description: 'Manage calendar and meeting scheduling.',
        owner: 'EA', isEA: true, category: 'Scheduling',
      }];
      expect(hasCalendarManagementTask(tasks)).toBe(true);
    });

    it('detects personal life management task by keywords', () => {
      const tasks: Task[] = [{
        title: 'Travel Arrangements',
        description: 'Book personal travel and coordinate family logistics.',
        owner: 'EA', isEA: true, category: 'Personal',
      }];
      expect(hasPersonalLifeManagementTask(tasks)).toBe(true);
    });

    it('detects business process management task by keywords', () => {
      const tasks: Task[] = [{
        title: 'Workflow Optimization',
        description: 'Document and improve business process automation.',
        owner: 'EA', isEA: true, category: 'Operations',
      }];
      expect(hasBusinessProcessManagementTask(tasks)).toBe(true);
    });

    it('detects core tasks by coreTaskType flag', () => {
      const tasks: Task[] = [{
        title: 'Core Task',
        description: 'A core EA task.',
        owner: 'EA', isEA: true, category: 'Operations',
        coreTaskType: 'emailManagement',
      }];
      expect(hasEmailManagementTask(tasks)).toBe(true);
    });

    it('returns errors for each missing core EA task type', () => {
      const report: TaskGenerationResult = {
        tasks: {
          businessProcesses: [{ title: 'Generic task', description: 'Something generic here.', owner: 'EA', isEA: true, category: 'Operations' }],
          personalLife: [{ title: 'Another task', description: 'Another generic description here.', owner: 'EA', isEA: true, category: 'Operations' }],
          calendar: [{ title: 'Yet another', description: 'Yet another generic description here.', owner: 'EA', isEA: true, category: 'Operations' }],
          email: [],
        },
        analysis_summary: '', total_task_count: 3, ea_task_percent: 100, ea_task_count: 3, summary: '',
      };

      const result = validateCoreEATasks(report);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Email Management'))).toBe(true);
    });
  });

  describe('analyzeReport', () => {
    it('returns correct total task count', () => {
      const report = createValidReport();
      const analysis = analyzeReport(report);
      expect(analysis.totalTasks).toBe(20);
    });

    it('returns correct EA task count', () => {
      const report = createValidReport();
      const analysis = analyzeReport(report);
      expect(analysis.eaTasks).toBe(20);
      expect(analysis.eaPercentage).toBe(100);
    });

    it('returns correct coreTasksPresent flags', () => {
      const report = createReportWithCoreEATasks();
      const analysis = analyzeReport(report);

      expect(analysis.coreTasksPresent.emailManagement).toBe(true);
      expect(analysis.coreTasksPresent.calendarManagement).toBe(true);
      expect(analysis.coreTasksPresent.personalLifeManagement).toBe(true);
      expect(analysis.coreTasksPresent.businessProcessManagement).toBe(true);
    });
  });

  describe('validateTaskQuality', () => {
    it('returns warning for task with title too short', () => {
      const report = createValidReport();
      report.tasks.email[0].title = 'AB';
      const result = validateTaskQuality(report);
      expect(result.warnings.some(w => w.includes('Title too short'))).toBe(true);
    });

    it('returns warning for task with title too long', () => {
      const report = createValidReport();
      report.tasks.email[0].title = 'A'.repeat(81);
      const result = validateTaskQuality(report);
      expect(result.warnings.some(w => w.includes('Title too long'))).toBe(true);
    });

    it('returns warning for task with description too short', () => {
      const report = createValidReport();
      report.tasks.email[0].description = 'Short.';
      const result = validateTaskQuality(report);
      expect(result.warnings.some(w => w.includes('Description too short'))).toBe(true);
    });
  });

  describe('validateNoDuplicates', () => {
    it('flags tasks with high overlap', () => {
      const report = createValidReport();
      report.tasks.email[0] = {
        title: 'Managing your inbox every day to stay organized',
        description: 'Your EA manages your inbox every day to keep things organized and on track.',
        owner: 'EA', isEA: true, category: 'Communication',
      };
      report.tasks.email[1] = {
        title: 'Managing your inbox every day for better organization',
        description: 'Your EA manages your inbox daily to ensure everything stays organized and nothing slips.',
        owner: 'EA', isEA: true, category: 'Communication',
      };

      const result = validateNoDuplicates(report);
      expect(result.warnings.some(w => w.includes('Duplicate detected'))).toBe(true);
    });
  });

  describe('validateNoAntiPatterns', () => {
    it('flags tasks with generic banned phrases', () => {
      const report = createValidReport();
      report.tasks.email[0] = {
        title: 'Getting to inbox zero every day',
        description: 'Your EA gets your inbox to zero.',
        owner: 'EA', isEA: true, category: 'Communication',
      };

      const result = validateNoAntiPatterns(report);
      expect(result.warnings.some(w => w.includes('Anti-pattern'))).toBe(true);
    });
  });
});
