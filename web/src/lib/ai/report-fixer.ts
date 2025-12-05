/**
 * Report Fixer Module
 *
 * Ported from: /tmp/ea-time-freedom-report/app/utils/reportValidator.ts
 *
 * Provides auto-fix functions for AI-generated task reports including:
 * - Core EA task injection
 * - EA percentage fixing
 * - Task count normalization
 * - Delegatable task identification
 */

import type {
  Task,
  TaskGenerationResult,
  TasksByFrequency,
  TaskFrequency,
  CoreEATasks,
} from '@/types';
import { validateCoreEATasks } from './report-validator';

/**
 * Keywords that indicate a task is a good candidate for EA delegation
 *
 * Ported from reportValidator.ts line 546-550
 */
const DELEGATABLE_KEYWORDS = [
  'schedule',
  'book',
  'coordinate',
  'manage',
  'organize',
  'prepare',
  'research',
  'compile',
  'update',
  'maintain',
  'track',
  'monitor',
  'draft',
  'review',
  'follow up',
  'arrange',
  'handle',
  'process',
];

/**
 * Check if a task is a good candidate for EA delegation
 *
 * Ported from reportValidator.ts lines 545-555
 *
 * @param task - The task to evaluate
 * @returns true if the task matches delegation keywords
 */
export function isGoodEACandidate(task: Task): boolean {
  const taskText = `${task.title} ${task.description}`.toLowerCase();

  return DELEGATABLE_KEYWORDS.some((keyword) => taskText.includes(keyword));
}

/**
 * Create missing core EA tasks based on validation errors
 *
 * Ported from reportValidator.ts lines 234-294
 *
 * @param missingErrors - Array of error messages indicating missing core tasks
 * @returns Array of core EA tasks to inject
 */
export function createMissingCoreEATasks(missingErrors: string[]): Task[] {
  const coreEATasks: Task[] = [];

  if (missingErrors.some((e) => e.includes('Email Management'))) {
    coreEATasks.push({
      title: 'Complete Email Management',
      description:
        'Your assistant manages your entire inbox, responses, filtering, and email workflows so you never have to check email directly.',
      owner: 'EA',
      isEA: true,
      frequency: 'daily',
      category: 'Communication',
      priority: 'high',
      isCoreEATask: true,
      coreTaskType: 'emailManagement',
    });
  }

  if (missingErrors.some((e) => e.includes('Calendar Management'))) {
    coreEATasks.push({
      title: 'Calendar and Schedule Management',
      description:
        'Your assistant owns your calendar completely, managing appointments, scheduling, conflicts, and optimizing your time and energy.',
      owner: 'EA',
      isEA: true,
      frequency: 'daily',
      category: 'Time Management',
      priority: 'high',
      isCoreEATask: true,
      coreTaskType: 'calendarManagement',
    });
  }

  if (missingErrors.some((e) => e.includes('Personal Life Management'))) {
    coreEATasks.push({
      title: 'Personal Life Coordination',
      description:
        'Your assistant manages travel bookings, personal appointments, vendor communications, family logistics, and personal task coordination.',
      owner: 'EA',
      isEA: true,
      frequency: 'weekly',
      category: 'Personal Support',
      priority: 'medium',
      isCoreEATask: true,
      coreTaskType: 'personalLifeManagement',
    });
  }

  if (missingErrors.some((e) => e.includes('Business Process Management'))) {
    coreEATasks.push({
      title: 'Recurring Business Process Management',
      description:
        'Your assistant identifies, documents, and manages recurring business processes, continuously finding new areas for delegation and optimization.',
      owner: 'EA',
      isEA: true,
      frequency: 'monthly',
      category: 'Operations',
      priority: 'medium',
      isCoreEATask: true,
      coreTaskType: 'businessProcessManagement',
    });
  }

  return coreEATasks;
}

/**
 * Find the best task to replace with a core EA task
 *
 * Ported from reportValidator.ts lines 337-361
 *
 * @param tasks - Array of tasks to search
 * @returns Index of task to replace, or -1 if none found
 */
function findTaskToReplace(tasks: Task[]): number {
  // Priority 1: Replace non-EA tasks first (non-high priority)
  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i].isEA && tasks[i].priority !== 'high') {
      return i;
    }
  }

  // Priority 2: Replace low-priority EA tasks
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].isEA && tasks[i].priority === 'low') {
      return i;
    }
  }

  // Priority 3: Replace any non-high priority task
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].priority !== 'high') {
      return i;
    }
  }

  // Last resort: Replace the last task
  return tasks.length > 0 ? tasks.length - 1 : -1;
}

/**
 * Inject core EA tasks into report by replacing least valuable tasks
 *
 * Ported from reportValidator.ts lines 299-332
 *
 * @param report - The report to modify
 * @param coreEATasks - Array of core EA tasks to inject
 * @returns Updated report with core tasks injected
 */
function injectCoreEATasks(
  report: TaskGenerationResult,
  coreEATasks: Task[]
): TaskGenerationResult {
  const updatedReport: TaskGenerationResult = {
    ...report,
    tasks: {
      daily: [...report.tasks.daily],
      weekly: [...report.tasks.weekly],
      monthly: [...report.tasks.monthly],
    },
  };

  for (const coreTask of coreEATasks) {
    const frequency = (coreTask.frequency || 'daily') as TaskFrequency;
    const tasks = [...updatedReport.tasks[frequency]];

    // Find the best task to replace
    const replaceIndex = findTaskToReplace(tasks);

    if (replaceIndex !== -1) {
      // Replace the selected task
      tasks[replaceIndex] = coreTask;
      updatedReport.tasks[frequency] = tasks;

      if (typeof console !== 'undefined') {
        console.debug('[report-fixer] Core EA task injected', {
          frequency,
          coreTaskType: coreTask.coreTaskType,
        });
      }
    } else {
      // Add to end if no good replacement found (shouldn't happen)
      tasks.push(coreTask);
      updatedReport.tasks[frequency] = tasks.slice(-10); // Keep only 10 tasks

      if (typeof console !== 'undefined') {
        console.warn('[report-fixer] Core EA task added to end', {
          frequency,
          coreTaskType: coreTask.coreTaskType,
        });
      }
    }
  }

  return updatedReport;
}

/**
 * Calculate EA task percentage
 *
 * Ported from reportValidator.ts lines 366-377
 *
 * @param tasks - TasksByFrequency object
 * @returns EA percentage as whole number
 */
function calculateEAPercentage(tasks: TasksByFrequency): number {
  const allTasks = [
    ...(tasks.daily || []),
    ...(tasks.weekly || []),
    ...(tasks.monthly || []),
  ];

  if (allTasks.length === 0) return 0;

  const eaTasks = allTasks.filter((task) => task.isEA === true);
  return Math.round((eaTasks.length / allTasks.length) * 100);
}

/**
 * Create core EA tasks metadata
 *
 * Ported from reportValidator.ts lines 382-409
 *
 * @returns CoreEATasks metadata object
 */
function createCoreEATasksMetadata(): CoreEATasks {
  return {
    emailManagement: {
      title: 'Complete Email Management',
      description:
        "Your assistant should be owning and managing your email fully. You can use the example of Ryan not even having the email app on his phone for years.",
      frequency: 'daily',
      included: true,
    },
    calendarManagement: {
      title: 'Calendar and Schedule Management',
      description:
        "Your assistant should be owning and managing your calendar. So securing appointments etc. your time. At the highest level, they're managing your energy, which takes experience.",
      frequency: 'daily',
      included: true,
    },
    personalLifeManagement: {
      title: 'Personal Life Coordination',
      description:
        "They manage their own and manage your personal life (that means travel, hotel, lodging, calling vendors, taking care of doctor's appointments, taking care of kids, things health related items, Amazon returns, negotiating discounts, purchasing things for you).",
      frequency: 'weekly',
      included: true,
    },
    businessProcessManagement: {
      title: 'Recurring Business Process Management',
      description:
        "And the last is that they should be owning and managing the recurring processes in your business. It's something that will continue to expand over time as you discover and they discover new ways, new things to delegate.",
      frequency: 'monthly',
      included: true,
    },
  };
}

/**
 * Ensure core EA tasks are present in report
 *
 * Ported from reportValidator.ts lines 201-229
 *
 * If any core EA tasks are missing, injects them by replacing
 * lowest-priority tasks and recalculates EA percentage.
 *
 * @param report - The TaskGenerationResult to fix
 * @returns Fixed report with all core EA tasks present
 */
export function ensureCoreEATasks(
  report: TaskGenerationResult
): TaskGenerationResult {
  const validation = validateCoreEATasks(report);

  if (validation.isValid) {
    if (typeof console !== 'undefined') {
      console.info('[report-fixer] All core EA tasks present in report');
    }
    return report;
  }

  if (typeof console !== 'undefined') {
    console.info('[report-fixer] Injecting missing core EA tasks', {
      missingTasks: validation.errors,
    });
  }

  // Create missing core EA tasks
  const missingTasks = createMissingCoreEATasks(validation.errors);

  // Inject core EA tasks into report
  let updatedReport = injectCoreEATasks(report, missingTasks);

  // Recalculate EA percentage
  updatedReport = {
    ...updatedReport,
    ea_task_percent: calculateEAPercentage(updatedReport.tasks),
    ea_task_count: [
      ...updatedReport.tasks.daily,
      ...updatedReport.tasks.weekly,
      ...updatedReport.tasks.monthly,
    ].filter((t) => t.isEA).length,
  };

  if (typeof console !== 'undefined') {
    console.info('[report-fixer] Core EA tasks injection completed', {
      injectedTasks: missingTasks.length,
      newEAPercentage: updatedReport.ea_task_percent,
    });
  }

  return updatedReport;
}

/**
 * Fix low EA percentage by converting founder tasks to EA tasks
 *
 * Ported from reportValidator.ts lines 433-473
 *
 * Converts founder tasks that match delegatable keywords to EA tasks
 * until the 40% minimum EA percentage is reached.
 *
 * @param report - The TaskGenerationResult to fix
 * @returns Fixed report with EA percentage >= 40%
 */
export function fixLowEAPercentage(
  report: TaskGenerationResult
): TaskGenerationResult {
  const updatedReport: TaskGenerationResult = {
    ...report,
    tasks: {
      daily: [...report.tasks.daily],
      weekly: [...report.tasks.weekly],
      monthly: [...report.tasks.monthly],
    },
  };

  // Calculate target EA tasks for 40%
  const allTasks = [
    ...updatedReport.tasks.daily,
    ...updatedReport.tasks.weekly,
    ...updatedReport.tasks.monthly,
  ];

  const targetEATasks = Math.ceil(allTasks.length * 0.4); // 40%
  const currentEATasks = allTasks.filter((t) => t.isEA).length;
  const tasksToConvert = Math.max(0, targetEATasks - currentEATasks);

  if (tasksToConvert > 0) {
    let converted = 0;

    // Convert founder tasks that are good candidates for EA delegation
    const frequencies: TaskFrequency[] = ['daily', 'weekly', 'monthly'];

    frequencies.forEach((frequency) => {
      const tasks = updatedReport.tasks[frequency];

      for (let i = 0; i < tasks.length && converted < tasksToConvert; i++) {
        if (!tasks[i].isEA && isGoodEACandidate(tasks[i])) {
          tasks[i] = {
            ...tasks[i],
            isEA: true,
            owner: 'EA',
          };
          converted++;
        }
      }
    });

    // Recalculate percentage
    updatedReport.ea_task_percent = calculateEAPercentage(updatedReport.tasks);
    updatedReport.ea_task_count = [
      ...updatedReport.tasks.daily,
      ...updatedReport.tasks.weekly,
      ...updatedReport.tasks.monthly,
    ].filter((t) => t.isEA).length;

    if (typeof console !== 'undefined') {
      console.info('[report-fixer] Fixed low EA percentage', {
        tasksConverted: converted,
        newPercentage: updatedReport.ea_task_percent,
      });
    }
  }

  return updatedReport;
}

/**
 * Create a generic task as filler
 *
 * Ported from reportValidator.ts lines 505-540
 *
 * @param frequency - The frequency for the task
 * @param index - The task index (for variation)
 * @returns A generic task for the given frequency
 */
function createGenericTask(frequency: string, index: number): Task {
  const genericTasks: Record<string, Task[]> = {
    daily: [
      {
        title: 'Review Daily Priorities',
        description:
          'Review and prioritize daily tasks and objectives to maintain focus and productivity.',
        owner: 'You',
        isEA: false,
        frequency: 'daily',
        category: 'Planning',
        priority: 'medium',
      },
      {
        title: 'Daily Task Review',
        description:
          'Assess completed tasks and plan remaining work for optimal daily output.',
        owner: 'You',
        isEA: false,
        frequency: 'daily',
        category: 'Planning',
        priority: 'medium',
      },
    ],
    weekly: [
      {
        title: 'Weekly Performance Review',
        description:
          'Analyze weekly progress against goals and adjust strategies for improved performance.',
        owner: 'You',
        isEA: false,
        frequency: 'weekly',
        category: 'Analysis',
        priority: 'medium',
      },
      {
        title: 'Weekly Goal Assessment',
        description:
          'Evaluate progress toward weekly objectives and identify areas for improvement.',
        owner: 'You',
        isEA: false,
        frequency: 'weekly',
        category: 'Analysis',
        priority: 'medium',
      },
    ],
    monthly: [
      {
        title: 'Monthly Strategic Planning',
        description:
          'Conduct monthly strategic planning sessions to align business objectives and resource allocation.',
        owner: 'You',
        isEA: false,
        frequency: 'monthly',
        category: 'Strategy',
        priority: 'medium',
      },
      {
        title: 'Monthly Progress Review',
        description:
          'Review monthly achievements and set direction for upcoming month priorities.',
        owner: 'You',
        isEA: false,
        frequency: 'monthly',
        category: 'Strategy',
        priority: 'medium',
      },
    ],
  };

  const options = genericTasks[frequency] || genericTasks.daily;
  return options[index % options.length];
}

/**
 * Fix incorrect task count
 *
 * Ported from reportValidator.ts lines 478-500
 *
 * Ensures exactly 10 tasks in each frequency by trimming excess
 * or padding with generic tasks.
 *
 * @param report - The TaskGenerationResult to fix
 * @returns Fixed report with exactly 30 tasks (10 per frequency)
 */
export function fixTaskCount(report: TaskGenerationResult): TaskGenerationResult {
  const updatedReport: TaskGenerationResult = {
    ...report,
    tasks: {
      daily: [...report.tasks.daily],
      weekly: [...report.tasks.weekly],
      monthly: [...report.tasks.monthly],
    },
  };

  // Ensure exactly 10 tasks in each frequency
  const frequencies: TaskFrequency[] = ['daily', 'weekly', 'monthly'];

  frequencies.forEach((frequency) => {
    const tasks = updatedReport.tasks[frequency];

    if (tasks.length !== 10) {
      if (tasks.length > 10) {
        // Trim to 10 tasks, keeping the most important ones
        updatedReport.tasks[frequency] = tasks.slice(0, 10);
      } else {
        // Add generic tasks to reach 10
        while (updatedReport.tasks[frequency].length < 10) {
          updatedReport.tasks[frequency].push(
            createGenericTask(frequency, updatedReport.tasks[frequency].length)
          );
        }
      }
    }
  });

  // Update total task count
  updatedReport.total_task_count = 30;

  // Recalculate EA count and percentage
  const allTasks = [
    ...updatedReport.tasks.daily,
    ...updatedReport.tasks.weekly,
    ...updatedReport.tasks.monthly,
  ];
  updatedReport.ea_task_count = allTasks.filter((t) => t.isEA).length;
  updatedReport.ea_task_percent = calculateEAPercentage(updatedReport.tasks);

  if (typeof console !== 'undefined') {
    console.info('[report-fixer] Fixed task count issues');
  }

  return updatedReport;
}

/**
 * Attempt to fix common report issues
 *
 * Ported from reportValidator.ts lines 414-428
 *
 * Orchestrates the appropriate fix functions based on error types.
 *
 * @param report - The TaskGenerationResult to fix
 * @param errors - Array of error messages from validation
 * @returns Fixed report with issues resolved
 */
export function fixReportIssues(
  report: TaskGenerationResult,
  errors: string[]
): TaskGenerationResult {
  let fixedReport = { ...report };

  if (typeof console !== 'undefined') {
    console.info('[report-fixer] Attempting to fix report issues', { errors });
  }

  for (const error of errors) {
    if (error.includes('EA percentage too low')) {
      fixedReport = fixLowEAPercentage(fixedReport);
    } else if (error.includes('total tasks')) {
      fixedReport = fixTaskCount(fixedReport);
    }
  }

  return fixedReport;
}
