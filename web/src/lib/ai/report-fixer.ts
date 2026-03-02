/**
 * Report Fixer Module
 *
 * Auto-fix functions for AI-generated task reports:
 * - Core EA task injection by Core Four area
 * - Task count padding with segmented fallbacks
 * - Quality-based re-generation trigger
 */

import type {
  Task,
  TaskGenerationResult,
  TasksByCoreFour,
  CoreTaskType,
} from '@/types';
import { validateCoreEATasks } from './report-validator';
import { getFallbackTasks, getFallbackTier, type FallbackTier } from './fallback-tasks';
import type { RevenueTierLabel } from './lead-brief';
import type { CoreFourArea } from '../pdf/layout-v2';

// Minimum tasks per Core Four area before fallback injection
const AREA_MINIMUMS: Record<keyof TasksByCoreFour, number> = {
  businessProcesses: 5,
  personalLife: 3,
  calendar: 3,
  email: 2,
};

// Map Core Four task key to CoreFourArea for fallback lookup
const AREA_KEY_TO_CORE_FOUR: Record<keyof TasksByCoreFour, CoreFourArea> = {
  businessProcesses: 'business',
  personalLife: 'personal',
  calendar: 'calendar',
  email: 'email',
};

/**
 * Create missing core EA tasks based on validation errors
 */
export function createMissingCoreEATasks(missingErrors: string[]): Task[] {
  const coreEATasks: Task[] = [];

  if (missingErrors.some((e) => e.includes('Email Management'))) {
    coreEATasks.push({
      title: 'Getting your inbox to zero every single day',
      description:
        'Your EA processes every incoming message, sorts them into priority folders, flags what actually needs you, and archives the rest so you only see what matters.',
      owner: 'EA',
      isEA: true,
      category: 'Communication',
      priority: 'high',
      isCoreEATask: true,
      coreTaskType: 'emailManagement',
    });
  }

  if (missingErrors.some((e) => e.includes('Calendar Management'))) {
    coreEATasks.push({
      title: 'Owning your entire calendar so you just show up',
      description:
        'Your EA manages all scheduling, coordinates across time zones, handles reschedules, and protects your focus time so you never waste mental energy on logistics.',
      owner: 'EA',
      isEA: true,
      category: 'Scheduling',
      priority: 'high',
      isCoreEATask: true,
      coreTaskType: 'calendarManagement',
    });
  }

  if (missingErrors.some((e) => e.includes('Personal Life Management'))) {
    coreEATasks.push({
      title: 'Handling your personal appointments, travel, and family logistics',
      description:
        'Your EA manages travel bookings, personal appointments, vendor communications, family scheduling, and personal task coordination so your personal life runs as smoothly as your business.',
      owner: 'EA',
      isEA: true,
      category: 'Personal',
      priority: 'medium',
      isCoreEATask: true,
      coreTaskType: 'personalLifeManagement',
    });
  }

  if (missingErrors.some((e) => e.includes('Business Process Management'))) {
    coreEATasks.push({
      title: 'Turning your recurring tasks into permanent hand-offs',
      description:
        'Your EA identifies repetitive processes, documents them into simple playbooks, and takes them over completely so those tasks are off your plate forever.',
      owner: 'EA',
      isEA: true,
      category: 'Operations',
      priority: 'medium',
      isCoreEATask: true,
      coreTaskType: 'businessProcessManagement',
    });
  }

  return coreEATasks;
}

/**
 * Get the Core Four area key for a given CoreTaskType
 */
function coreTaskTypeToAreaKey(coreTaskType: CoreTaskType): keyof TasksByCoreFour {
  switch (coreTaskType) {
    case 'emailManagement': return 'email';
    case 'calendarManagement': return 'calendar';
    case 'personalLifeManagement': return 'personalLife';
    case 'businessProcessManagement': return 'businessProcesses';
  }
}

/**
 * Ensure core EA tasks are present in report
 */
export function ensureCoreEATasks(
  report: TaskGenerationResult
): TaskGenerationResult {
  const validation = validateCoreEATasks(report);

  if (validation.isValid) {
    console.info('[report-fixer] All core EA tasks present in report');
    return report;
  }

  console.info('[report-fixer] Injecting missing core EA tasks', {
    missingTasks: validation.errors,
  });

  const missingTasks = createMissingCoreEATasks(validation.errors);

  const updatedReport: TaskGenerationResult = {
    ...report,
    tasks: {
      businessProcesses: [...report.tasks.businessProcesses],
      personalLife: [...report.tasks.personalLife],
      calendar: [...report.tasks.calendar],
      email: [...report.tasks.email],
    },
  };

  // Add missing tasks to their respective Core Four areas
  for (const task of missingTasks) {
    if (task.coreTaskType) {
      const areaKey = coreTaskTypeToAreaKey(task.coreTaskType);
      updatedReport.tasks[areaKey].push(task);
    }
  }

  // Recalculate counts
  const allTasks = [
    ...updatedReport.tasks.businessProcesses,
    ...updatedReport.tasks.personalLife,
    ...updatedReport.tasks.calendar,
    ...updatedReport.tasks.email,
  ];
  updatedReport.total_task_count = allTasks.length;
  updatedReport.ea_task_count = allTasks.filter((t) => t.isEA).length;
  updatedReport.ea_task_percent = allTasks.length > 0
    ? Math.round((updatedReport.ea_task_count / allTasks.length) * 100)
    : 0;

  console.info('[report-fixer] Core EA tasks injection completed', {
    injectedTasks: missingTasks.length,
    newTotal: updatedReport.total_task_count,
  });

  return updatedReport;
}

/**
 * Pad thin Core Four areas with revenue-tier appropriate fallback tasks
 */
export function padThinAreas(
  report: TaskGenerationResult,
  revenueTier: RevenueTierLabel = 'growing'
): TaskGenerationResult {
  const tier = getFallbackTier(revenueTier);

  const updatedReport: TaskGenerationResult = {
    ...report,
    tasks: {
      businessProcesses: [...report.tasks.businessProcesses],
      personalLife: [...report.tasks.personalLife],
      calendar: [...report.tasks.calendar],
      email: [...report.tasks.email],
    },
  };

  let injected = 0;

  for (const [areaKey, minimum] of Object.entries(AREA_MINIMUMS) as Array<[keyof TasksByCoreFour, number]>) {
    const currentCount = updatedReport.tasks[areaKey].length;
    if (currentCount < minimum) {
      const needed = minimum - currentCount;
      const coreFourArea = AREA_KEY_TO_CORE_FOUR[areaKey];
      const fallbacks = getFallbackTasks(tier, coreFourArea, needed);

      // Convert PDFTask to Task format
      const tasksToAdd: Task[] = fallbacks.map(ft => ({
        title: ft.name,
        description: ft.description,
        owner: 'EA' as const,
        isEA: true,
        category: 'Operations',
        coreTaskType: coreFourAreaToCoreTaskType(coreFourArea),
      }));

      updatedReport.tasks[areaKey].push(...tasksToAdd);
      injected += tasksToAdd.length;
    }
  }

  if (injected > 0) {
    // Recalculate counts
    const allTasks = [
      ...updatedReport.tasks.businessProcesses,
      ...updatedReport.tasks.personalLife,
      ...updatedReport.tasks.calendar,
      ...updatedReport.tasks.email,
    ];
    updatedReport.total_task_count = allTasks.length;
    updatedReport.ea_task_count = allTasks.filter((t) => t.isEA).length;
    updatedReport.ea_task_percent = allTasks.length > 0
      ? Math.round((updatedReport.ea_task_count / allTasks.length) * 100)
      : 0;

    console.info('[report-fixer] Padded thin areas with fallbacks', {
      injected,
      tier,
      newTotal: updatedReport.total_task_count,
    });
  }

  return updatedReport;
}

function coreFourAreaToCoreTaskType(area: CoreFourArea): CoreTaskType {
  switch (area) {
    case 'email': return 'emailManagement';
    case 'calendar': return 'calendarManagement';
    case 'personal': return 'personalLifeManagement';
    case 'business': return 'businessProcessManagement';
  }
}

/**
 * Attempt to fix common report issues
 */
export function fixReportIssues(
  report: TaskGenerationResult,
  errors: string[],
  revenueTier: RevenueTierLabel = 'growing'
): TaskGenerationResult {
  let fixedReport = { ...report };

  console.info('[report-fixer] Attempting to fix report issues', { errors });

  // Pad thin areas with fallbacks
  if (errors.some(e => e.includes('Too few tasks') || e.includes('tasks (target'))) {
    fixedReport = padThinAreas(fixedReport, revenueTier);
  }

  return fixedReport;
}

/**
 * Check if a task is a good candidate for EA delegation
 */
export function isGoodEACandidate(task: Task): boolean {
  const DELEGATABLE_KEYWORDS = [
    'schedule', 'book', 'coordinate', 'manage', 'organize',
    'prepare', 'research', 'compile', 'update', 'maintain',
    'track', 'monitor', 'draft', 'review', 'follow up',
    'arrange', 'handle', 'process',
  ];

  const taskText = `${task.title} ${task.description}`.toLowerCase();
  return DELEGATABLE_KEYWORDS.some((keyword) => taskText.includes(keyword));
}
