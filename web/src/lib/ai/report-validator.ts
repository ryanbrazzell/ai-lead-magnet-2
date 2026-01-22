/**
 * Report Validator Module
 *
 * Provides validation functions for AI-generated task reports including:
 * - Task count validation (24 total, 8 per frequency: 5 EA + 3 Founder)
 * - EA percentage validation (~63%)
 * - Core EA task detection
 * - Task quality validation
 */

import type { Task, TaskGenerationResult, ValidationResult, ReportAnalysis } from '@/types';

/**
 * Comprehensive report validation
 *
 * Ported from reportValidator.ts lines 30-91
 *
 * @param report - The TaskGenerationResult to validate
 * @returns ValidationResult with isValid, errors, and warnings
 */
export function validateReport(report: TaskGenerationResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Analyze report structure
    const analysis = analyzeReport(report);

    // Validate task count requirements (24 total: 8 per category)
    if (analysis.totalTasks !== 24) {
      errors.push(`Expected 24 total tasks, got ${analysis.totalTasks}`);
    }

    if (analysis.dailyTasks !== 8) {
      warnings.push(`Expected 8 daily tasks, got ${analysis.dailyTasks}`);
    }

    if (analysis.weeklyTasks !== 8) {
      warnings.push(`Expected 8 weekly tasks, got ${analysis.weeklyTasks}`);
    }

    if (analysis.monthlyTasks !== 8) {
      warnings.push(`Expected 8 monthly tasks, got ${analysis.monthlyTasks}`);
    }

    // Validate EA percentage requirement (~63% = 15/24)
    if (analysis.eaPercentage < 50) {
      errors.push(`EA percentage too low: ${analysis.eaPercentage}% (expected ~63%)`);
    }

    // Validate core EA tasks presence
    const coreTaskValidation = validateCoreEATasks(report);
    errors.push(...coreTaskValidation.errors);
    warnings.push(...coreTaskValidation.warnings);

    // Validate task quality
    const qualityValidation = validateTaskQuality(report);
    warnings.push(...qualityValidation.warnings);

    // Log validation results (structured logging)
    if (typeof console !== 'undefined') {
      console.info('[report-validator] Report validation completed', {
        isValid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length,
        analysis,
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (typeof console !== 'undefined') {
      console.error('[report-validator] Report validation failed', error);
    }
    errors.push(`Validation error: ${errorMessage}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Analyze report structure and content
 *
 * Ported from reportValidator.ts lines 96-122
 *
 * @param report - The TaskGenerationResult to analyze
 * @returns ReportAnalysis with task counts and core task presence
 */
export function analyzeReport(report: TaskGenerationResult): ReportAnalysis {
  const dailyTasks = report.tasks?.daily || [];
  const weeklyTasks = report.tasks?.weekly || [];
  const monthlyTasks = report.tasks?.monthly || [];

  const allTasks = [...dailyTasks, ...weeklyTasks, ...monthlyTasks];
  const eaTasks = allTasks.filter((task) => task.isEA === true);

  // Check for core EA task types
  const coreTasksPresent = {
    emailManagement: hasEmailManagementTask(allTasks),
    calendarManagement: hasCalendarManagementTask(allTasks),
    personalLifeManagement: hasPersonalLifeManagementTask(allTasks),
    businessProcessManagement: hasBusinessProcessManagementTask(allTasks),
  };

  // Calculate EA percentage using Math.round
  const eaPercentage =
    allTasks.length > 0 ? Math.round((eaTasks.length / allTasks.length) * 100) : 0;

  return {
    totalTasks: allTasks.length,
    dailyTasks: dailyTasks.length,
    weeklyTasks: weeklyTasks.length,
    monthlyTasks: monthlyTasks.length,
    eaTasks: eaTasks.length,
    founderTasks: allTasks.length - eaTasks.length,
    eaPercentage,
    coreTasksPresent,
  };
}

/**
 * Validate core EA tasks are present
 *
 * Ported from reportValidator.ts lines 127-155
 *
 * @param report - The TaskGenerationResult to validate
 * @returns ValidationResult with errors for missing core tasks
 */
export function validateCoreEATasks(report: TaskGenerationResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const allTasks = [
    ...(report.tasks?.daily || []),
    ...(report.tasks?.weekly || []),
    ...(report.tasks?.monthly || []),
  ];

  // Check each core EA task category
  if (!hasEmailManagementTask(allTasks)) {
    errors.push('Missing core EA task: Email Management');
  }

  if (!hasCalendarManagementTask(allTasks)) {
    errors.push('Missing core EA task: Calendar Management');
  }

  if (!hasPersonalLifeManagementTask(allTasks)) {
    errors.push('Missing core EA task: Personal Life Management');
  }

  if (!hasBusinessProcessManagementTask(allTasks)) {
    errors.push('Missing core EA task: Business Process Management');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Validate task quality and completeness
 *
 * Based on reportValidator.ts lines 160-196
 *
 * @param report - The TaskGenerationResult to validate
 * @returns ValidationResult with warnings for quality issues
 */
export function validateTaskQuality(report: TaskGenerationResult): ValidationResult {
  const warnings: string[] = [];

  const allTasks = [
    ...(report.tasks?.daily || []),
    ...(report.tasks?.weekly || []),
    ...(report.tasks?.monthly || []),
  ];

  allTasks.forEach((task, index) => {
    // Check title length
    if (!task.title || task.title.length < 3) {
      warnings.push(`Task ${index + 1}: Title too short`);
    } else if (task.title.length > 60) {
      warnings.push(`Task ${index + 1}: Title too long`);
    }

    // Check description length
    if (!task.description || task.description.length < 20) {
      warnings.push(`Task ${index + 1}: Description too short`);
    }

    // Check owner field - accepts both 'EA' and 'You' (our system) or 'Founder' (legacy)
    const validOwners = ['You', 'EA'];
    if (!task.owner || !validOwners.includes(task.owner as string)) {
      warnings.push(`Task ${index + 1}: Invalid owner field`);
    }

    // Check isEA consistency
    const isEAOwner = task.owner === 'EA';
    const isFounderOwner = task.owner === 'You';

    if (isEAOwner && !task.isEA) {
      warnings.push(`Task ${index + 1}: Owner is EA but isEA is false`);
    } else if (isFounderOwner && task.isEA) {
      warnings.push(`Task ${index + 1}: Owner is Founder but isEA is true`);
    }
  });

  return { isValid: true, errors: [], warnings };
}

// =============================================================================
// CORE TASK DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if tasks contain email management task
 *
 * Ported from reportValidator.ts lines 561-570
 *
 * Keywords: email, inbox, correspondence
 *
 * @param tasks - Array of tasks to check
 * @returns true if email management task is present
 */
export function hasEmailManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      task.isEA &&
      (text.includes('email') ||
        text.includes('inbox') ||
        text.includes('correspondence') ||
        (task.isCoreEATask && task.coreTaskType === 'emailManagement'))
    );
  });
}

/**
 * Check if tasks contain calendar management task
 *
 * Ported from reportValidator.ts lines 573-582
 *
 * Keywords: calendar, schedule, appointment, meeting
 *
 * @param tasks - Array of tasks to check
 * @returns true if calendar management task is present
 */
export function hasCalendarManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      task.isEA &&
      (text.includes('calendar') ||
        text.includes('schedule') ||
        text.includes('scheduling') ||
        text.includes('appointment') ||
        text.includes('meeting') ||
        (task.isCoreEATask && task.coreTaskType === 'calendarManagement'))
    );
  });
}

/**
 * Check if tasks contain personal life management task
 *
 * Ported from reportValidator.ts lines 586-600
 *
 * Keywords: personal, travel, family, errands, booking, reservation, vendor
 *
 * @param tasks - Array of tasks to check
 * @returns true if personal life management task is present
 */
export function hasPersonalLifeManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      task.isEA &&
      (text.includes('personal') ||
        text.includes('travel') ||
        text.includes('booking') ||
        text.includes('reservation') ||
        text.includes('vendor') ||
        text.includes('appointment') ||
        text.includes('family') ||
        (task.isCoreEATask && task.coreTaskType === 'personalLifeManagement'))
    );
  });
}

/**
 * Check if tasks contain business process management task
 *
 * Ported from reportValidator.ts lines 602-614
 *
 * Keywords: process, workflow, system, automation, SOP, procedure, recurring
 *
 * @param tasks - Array of tasks to check
 * @returns true if business process management task is present
 */
export function hasBusinessProcessManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      task.isEA &&
      (text.includes('process') ||
        text.includes('recurring') ||
        text.includes('workflow') ||
        text.includes('system') ||
        text.includes('procedure') ||
        text.includes('automation') ||
        (task.isCoreEATask && task.coreTaskType === 'businessProcessManagement'))
    );
  });
}
