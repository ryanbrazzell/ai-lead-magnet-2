/**
 * Report Fixer Tests
 *
 * Tests for auto-fix behavior using Core Four architecture.
 * Functions tested: ensureCoreEATasks, padThinAreas, fixReportIssues, isGoodEACandidate
 *
 * @module report-fixer.test
 */

import { describe, it, expect } from 'vitest';
import {
  ensureCoreEATasks,
  padThinAreas,
  fixReportIssues,
  isGoodEACandidate,
} from '../report-fixer';
import type { Task, TaskGenerationResult } from '@/types';

/**
 * Helper to create a valid task
 */
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    title: 'Test Task',
    description: 'This is a test task description for testing purposes.',
    owner: 'EA',
    isEA: true,
    category: 'Operations',
    ...overrides,
  };
}

/**
 * Helper to create a valid TaskGenerationResult with Core Four structure
 */
function createValidReport(overrides: Partial<TaskGenerationResult> = {}): TaskGenerationResult {
  const businessProcesses: Task[] = Array.from({ length: 5 }, (_, i) =>
    createTask({
      title: `Business Process Task ${i + 1}`,
      category: 'Operations',
    })
  );

  const personalLife: Task[] = Array.from({ length: 3 }, (_, i) =>
    createTask({
      title: `Personal Life Task ${i + 1}`,
      category: 'Personal',
    })
  );

  const calendar: Task[] = Array.from({ length: 3 }, (_, i) =>
    createTask({
      title: `Calendar Task ${i + 1}`,
      category: 'Scheduling',
    })
  );

  const email: Task[] = Array.from({ length: 2 }, (_, i) =>
    createTask({
      title: `Email Task ${i + 1}`,
      category: 'Communication',
    })
  );

  const allTasks = [...businessProcesses, ...personalLife, ...calendar, ...email];
  const eaCount = allTasks.filter((t) => t.isEA).length;

  return {
    tasks: {
      businessProcesses,
      personalLife,
      calendar,
      email,
    },
    analysis_summary: 'Test analysis summary for the report.',
    total_task_count: allTasks.length,
    ea_task_count: eaCount,
    ea_task_percent: Math.round((eaCount / allTasks.length) * 100),
    summary: 'Test report summary.',
    ...overrides,
  };
}

/**
 * Helper to flatten all tasks from a Core Four report
 */
function getAllTasks(report: TaskGenerationResult): Task[] {
  return [
    ...report.tasks.businessProcesses,
    ...report.tasks.personalLife,
    ...report.tasks.calendar,
    ...report.tasks.email,
  ];
}

describe('report-fixer', () => {
  /**
   * Test 1: ensureCoreEATasks injects missing core tasks into Core Four areas
   */
  describe('ensureCoreEATasks', () => {
    it('injects missing core tasks into their respective Core Four areas', () => {
      // Use titles/descriptions that won't match any core EA detection keywords
      // (no: email, inbox, calendar, schedule, appointment, meeting, personal,
      //  travel, booking, vendor, family, process, recurring, workflow, system, etc.)
      const report = createValidReport({
        tasks: {
          businessProcesses: Array.from({ length: 5 }, (_, i) =>
            createTask({ title: `Run quarterly audit ${i + 1}`, description: 'Perform an audit of metrics.', category: 'Operations' })
          ),
          personalLife: Array.from({ length: 3 }, (_, i) =>
            createTask({ title: `Pick up dry cleaning ${i + 1}`, description: 'Drop off and pick up laundry items.', category: 'Errands' })
          ),
          calendar: Array.from({ length: 3 }, (_, i) =>
            createTask({ title: `Prepare slide deck ${i + 1}`, description: 'Build a presentation for the team.', category: 'Design' })
          ),
          email: Array.from({ length: 2 }, (_, i) =>
            createTask({ title: `Write blog post ${i + 1}`, description: 'Draft content for the company blog.', category: 'Marketing' })
          ),
        },
      });

      const fixedReport = ensureCoreEATasks(report);

      const allTasks = getAllTasks(fixedReport);

      // Check for email management task (injected)
      const hasEmailTask = allTasks.some(
        (t) =>
          t.isEA &&
          (t.title.toLowerCase().includes('inbox') ||
            t.title.toLowerCase().includes('email') ||
            t.description.toLowerCase().includes('email'))
      );

      // Check for calendar management task (injected)
      const hasCalendarTask = allTasks.some(
        (t) =>
          t.isEA &&
          (t.title.toLowerCase().includes('calendar') ||
            t.description.toLowerCase().includes('scheduling') ||
            t.description.toLowerCase().includes('calendar'))
      );

      expect(hasEmailTask).toBe(true);
      expect(hasCalendarTask).toBe(true);
    });

    it('adds email management task to the email area', () => {
      // Report with no email-related tasks
      const report = createValidReport({
        tasks: {
          businessProcesses: [createTask({ title: 'Generic ops task' })],
          personalLife: [createTask({ title: 'Generic personal task' })],
          calendar: [createTask({ title: 'Generic scheduling task' })],
          email: [createTask({ title: 'Generic comms task' })],
        },
      });

      const fixedReport = ensureCoreEATasks(report);

      // Email area should have grown (original + injected email management task)
      const emailTasks = fixedReport.tasks.email;
      const hasEmailCore = emailTasks.some(
        (t) => t.coreTaskType === 'emailManagement' || t.isCoreEATask
      );
      expect(hasEmailCore).toBe(true);
    });

    it('adds calendar management task to the calendar area', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [createTask({ title: 'Generic ops task' })],
          personalLife: [createTask({ title: 'Generic personal task' })],
          calendar: [createTask({ title: 'Generic time task' })],
          email: [createTask({ title: 'Generic comms task' })],
        },
      });

      const fixedReport = ensureCoreEATasks(report);

      const calendarTasks = fixedReport.tasks.calendar;
      const hasCalendarCore = calendarTasks.some(
        (t) => t.coreTaskType === 'calendarManagement' || t.isCoreEATask
      );
      expect(hasCalendarCore).toBe(true);
    });

    it('recalculates EA counts after injection', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: Array.from({ length: 3 }, (_, i) =>
            createTask({
              title: `Founder task ${i + 1}`,
              isEA: false,
              owner: 'You',
            })
          ),
          personalLife: [
            createTask({ title: 'Personal founder task', isEA: false, owner: 'You' }),
          ],
          calendar: [
            createTask({ title: 'Time block task', isEA: false, owner: 'You' }),
          ],
          email: [
            createTask({ title: 'Read messages task', isEA: false, owner: 'You' }),
          ],
        },
        ea_task_percent: 0,
        ea_task_count: 0,
        total_task_count: 6,
      });

      const fixedReport = ensureCoreEATasks(report);

      // After injecting core EA tasks, EA count/percent should increase
      const allTasks = getAllTasks(fixedReport);
      const eaCount = allTasks.filter((t) => t.isEA).length;
      const expectedPercent = Math.round((eaCount / allTasks.length) * 100);

      expect(fixedReport.ea_task_count).toBe(eaCount);
      expect(fixedReport.ea_task_percent).toBe(expectedPercent);
      expect(fixedReport.total_task_count).toBe(allTasks.length);
      expect(eaCount).toBeGreaterThan(0);
    });

    it('does not modify report when all core tasks are already present', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [
            createTask({
              title: 'Turning your recurring tasks into permanent hand-offs',
              description: 'Documents processes into playbooks',
              coreTaskType: 'businessProcessManagement',
              isCoreEATask: true,
            }),
          ],
          personalLife: [
            createTask({
              title: 'Handling your personal appointments and travel',
              description: 'Manages travel bookings and personal appointments',
              coreTaskType: 'personalLifeManagement',
              isCoreEATask: true,
            }),
          ],
          calendar: [
            createTask({
              title: 'Owning your entire calendar so you just show up',
              description: 'Manages all scheduling and coordinates across time zones',
              coreTaskType: 'calendarManagement',
              isCoreEATask: true,
            }),
          ],
          email: [
            createTask({
              title: 'Getting your inbox to zero every single day',
              description: 'Processes every incoming email message and sorts them',
              coreTaskType: 'emailManagement',
              isCoreEATask: true,
            }),
          ],
        },
      });

      const fixedReport = ensureCoreEATasks(report);

      // Should be unchanged
      expect(fixedReport.tasks.businessProcesses.length).toBe(1);
      expect(fixedReport.tasks.personalLife.length).toBe(1);
      expect(fixedReport.tasks.calendar.length).toBe(1);
      expect(fixedReport.tasks.email.length).toBe(1);
    });
  });

  /**
   * Test 2: padThinAreas pads Core Four areas to meet minimums
   *
   * Minimums: businessProcesses: 5, personalLife: 3, calendar: 3, email: 2
   */
  describe('padThinAreas', () => {
    it('pads businessProcesses to minimum of 5', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [
            createTask({ title: 'Ops task 1' }),
            createTask({ title: 'Ops task 2' }),
          ], // only 2, need 5
          personalLife: Array.from({ length: 3 }, () => createTask({ title: 'Personal task' })),
          calendar: Array.from({ length: 3 }, () => createTask({ title: 'Calendar task' })),
          email: Array.from({ length: 2 }, () => createTask({ title: 'Email task' })),
        },
      });

      const fixedReport = padThinAreas(report);

      expect(fixedReport.tasks.businessProcesses.length).toBeGreaterThanOrEqual(5);
    });

    it('pads personalLife to minimum of 3', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: Array.from({ length: 5 }, () =>
            createTask({ title: 'Business task' })
          ),
          personalLife: [createTask({ title: 'Personal task 1' })], // only 1, need 3
          calendar: Array.from({ length: 3 }, () => createTask({ title: 'Calendar task' })),
          email: Array.from({ length: 2 }, () => createTask({ title: 'Email task' })),
        },
      });

      const fixedReport = padThinAreas(report);

      expect(fixedReport.tasks.personalLife.length).toBeGreaterThanOrEqual(3);
    });

    it('pads calendar to minimum of 3', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: Array.from({ length: 5 }, () =>
            createTask({ title: 'Business task' })
          ),
          personalLife: Array.from({ length: 3 }, () => createTask({ title: 'Personal task' })),
          calendar: [createTask({ title: 'Calendar task 1' })], // only 1, need 3
          email: Array.from({ length: 2 }, () => createTask({ title: 'Email task' })),
        },
      });

      const fixedReport = padThinAreas(report);

      expect(fixedReport.tasks.calendar.length).toBeGreaterThanOrEqual(3);
    });

    it('pads email to minimum of 2', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: Array.from({ length: 5 }, () =>
            createTask({ title: 'Business task' })
          ),
          personalLife: Array.from({ length: 3 }, () => createTask({ title: 'Personal task' })),
          calendar: Array.from({ length: 3 }, () => createTask({ title: 'Calendar task' })),
          email: [], // 0 tasks, need 2
        },
      });

      const fixedReport = padThinAreas(report);

      expect(fixedReport.tasks.email.length).toBeGreaterThanOrEqual(2);
    });

    it('does not modify areas that already meet minimums', () => {
      const report = createValidReport(); // all areas at minimums

      const fixedReport = padThinAreas(report);

      expect(fixedReport.tasks.businessProcesses.length).toBe(5);
      expect(fixedReport.tasks.personalLife.length).toBe(3);
      expect(fixedReport.tasks.calendar.length).toBe(3);
      expect(fixedReport.tasks.email.length).toBe(2);
    });

    it('pads multiple thin areas simultaneously', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [createTask({ title: 'Ops task 1' })], // need 5
          personalLife: [], // need 3
          calendar: [createTask({ title: 'Cal task 1' })], // need 3
          email: [], // need 2
        },
        total_task_count: 2,
        ea_task_count: 2,
        ea_task_percent: 100,
      });

      const fixedReport = padThinAreas(report);

      expect(fixedReport.tasks.businessProcesses.length).toBeGreaterThanOrEqual(5);
      expect(fixedReport.tasks.personalLife.length).toBeGreaterThanOrEqual(3);
      expect(fixedReport.tasks.calendar.length).toBeGreaterThanOrEqual(3);
      expect(fixedReport.tasks.email.length).toBeGreaterThanOrEqual(2);
    });

    it('recalculates total_task_count after padding', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [createTask({ title: 'Ops task 1' })],
          personalLife: [createTask({ title: 'Personal task 1' })],
          calendar: [createTask({ title: 'Calendar task 1' })],
          email: [createTask({ title: 'Email task 1' })],
        },
        total_task_count: 4,
        ea_task_count: 4,
        ea_task_percent: 100,
      });

      const fixedReport = padThinAreas(report);

      const actualTotal = getAllTasks(fixedReport).length;
      expect(fixedReport.total_task_count).toBe(actualTotal);
      expect(actualTotal).toBeGreaterThan(4);
    });

    it('padded tasks are EA-owned', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [],
          personalLife: [],
          calendar: [],
          email: [],
        },
        total_task_count: 0,
        ea_task_count: 0,
        ea_task_percent: 0,
      });

      const fixedReport = padThinAreas(report);

      const allTasks = getAllTasks(fixedReport);
      // All padded tasks should be EA-owned
      allTasks.forEach((task) => {
        expect(task.isEA).toBe(true);
        expect(task.owner).toBe('EA');
      });
    });
  });

  /**
   * Test 3: isGoodEACandidate identifies delegatable keywords
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
   * Test 4: fixReportIssues orchestration function
   */
  describe('fixReportIssues', () => {
    it('pads thin areas when error mentions too few tasks', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [createTask({ title: 'Ops 1' })], // under minimum
          personalLife: [createTask({ title: 'Personal 1' })], // under minimum
          calendar: [createTask({ title: 'Calendar 1' })], // under minimum
          email: [], // under minimum
        },
        total_task_count: 3,
        ea_task_count: 3,
        ea_task_percent: 100,
      });

      const errors = ['Too few tasks in businessProcesses: 1 tasks (target 5-8)'];

      const fixedReport = fixReportIssues(report, errors);

      // All areas should meet minimums after fix
      expect(fixedReport.tasks.businessProcesses.length).toBeGreaterThanOrEqual(5);
      expect(fixedReport.tasks.personalLife.length).toBeGreaterThanOrEqual(3);
      expect(fixedReport.tasks.calendar.length).toBeGreaterThanOrEqual(3);
      expect(fixedReport.tasks.email.length).toBeGreaterThanOrEqual(2);
    });

    it('recalculates totals after fixing', () => {
      const report = createValidReport({
        tasks: {
          businessProcesses: [createTask({ title: 'Ops 1' })],
          personalLife: [],
          calendar: [],
          email: [],
        },
        total_task_count: 1,
        ea_task_count: 1,
        ea_task_percent: 100,
      });

      const errors = ['Too few tasks in personalLife: 0 tasks (target 3-5)'];

      const fixedReport = fixReportIssues(report, errors);

      const actualTotal = getAllTasks(fixedReport).length;
      expect(fixedReport.total_task_count).toBe(actualTotal);
      expect(actualTotal).toBeGreaterThan(1);
    });

    it('returns report unchanged when no matching error patterns', () => {
      const report = createValidReport();
      const originalTotal = report.total_task_count;

      const errors = ['Some unrecognized error message'];

      const fixedReport = fixReportIssues(report, errors);

      expect(fixedReport.total_task_count).toBe(originalTotal);
    });

    it('handles empty error array gracefully', () => {
      const report = createValidReport();

      const fixedReport = fixReportIssues(report, []);

      expect(fixedReport.total_task_count).toBe(report.total_task_count);
    });
  });
});
