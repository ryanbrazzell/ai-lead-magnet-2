/**
 * Report Validator Module
 *
 * Validates AI-generated task reports:
 * - Core Four area task count validation
 * - Core EA task detection
 * - Task quality validation
 * - Semantic dedup (Jaccard similarity)
 * - Anti-pattern detection
 * - Minimum specificity check
 */

import type { Task, TaskGenerationResult, ValidationResult, ReportAnalysis } from '@/types';

// Target task counts per Core Four area (targets, not hard constraints)
const AREA_TARGETS = {
  businessProcesses: { min: 5, target: 8 },
  personalLife: { min: 3, target: 5 },
  calendar: { min: 3, target: 4 },
  email: { min: 2, target: 3 },
} as const;

// Banned generic phrases that indicate low-quality tasks
const ANTI_PATTERNS = [
  /\binbox zero\b/i,
  /\broutine emails?\b/i,
  /\bdaily priorities\b/i,
  /\bmanage your calendar\b(?!\s+(?:around|for|during|so))/i, // Allow if followed by specificity
  /\bperformance review\b(?!\s+(?:for|with|of))/i, // Allow if contextualized
  /\bmanage vendor communications\b/i,
  /\bprepare reports\b(?!\s+(?:for|on|about|with))/i,
  /\borganize files\b/i,
  /\bdocument organization\b/i,
  /\bhandle routine\b/i,
  /\bgeneral admin\b/i,
];

/**
 * Get all tasks from a TaskGenerationResult as a flat array
 */
function getAllTasks(report: TaskGenerationResult): Task[] {
  const tasks = report.tasks;
  return [
    ...(tasks.businessProcesses || []),
    ...(tasks.personalLife || []),
    ...(tasks.calendar || []),
    ...(tasks.email || []),
  ];
}

/**
 * Comprehensive report validation
 */
export function validateReport(report: TaskGenerationResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const analysis = analyzeReport(report);

    // Validate total task count (minimum 15 for a usable report)
    if (analysis.totalTasks < 15) {
      errors.push(`Too few tasks: ${analysis.totalTasks} (minimum 15)`);
    }

    // Validate per-area minimums
    const areas = report.tasks;
    if ((areas.businessProcesses?.length || 0) < AREA_TARGETS.businessProcesses.min) {
      warnings.push(`Business Processes has ${areas.businessProcesses?.length || 0} tasks (target: ${AREA_TARGETS.businessProcesses.target})`);
    }
    if ((areas.personalLife?.length || 0) < AREA_TARGETS.personalLife.min) {
      warnings.push(`Personal Life has ${areas.personalLife?.length || 0} tasks (target: ${AREA_TARGETS.personalLife.target})`);
    }
    if ((areas.calendar?.length || 0) < AREA_TARGETS.calendar.min) {
      warnings.push(`Calendar has ${areas.calendar?.length || 0} tasks (target: ${AREA_TARGETS.calendar.target})`);
    }
    if ((areas.email?.length || 0) < AREA_TARGETS.email.min) {
      warnings.push(`Email has ${areas.email?.length || 0} tasks (target: ${AREA_TARGETS.email.target})`);
    }

    // Validate core EA tasks presence
    const coreTaskValidation = validateCoreEATasks(report);
    errors.push(...coreTaskValidation.errors);
    warnings.push(...coreTaskValidation.warnings);

    // Quality checks
    const qualityValidation = validateTaskQuality(report);
    warnings.push(...qualityValidation.warnings);

    // Semantic dedup
    const dedupValidation = validateNoDuplicates(report);
    warnings.push(...dedupValidation.warnings);

    // Anti-pattern detection
    const antiPatternValidation = validateNoAntiPatterns(report);
    warnings.push(...antiPatternValidation.warnings);

    console.info('[report-validator] Report validation completed', {
      isValid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      analysis,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[report-validator] Report validation failed', error);
    errors.push(`Validation error: ${errorMessage}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Analyze report structure
 */
export function analyzeReport(report: TaskGenerationResult): ReportAnalysis {
  const allTasks = getAllTasks(report);
  const eaTasks = allTasks.filter((task) => task.isEA === true);

  const coreTasksPresent = {
    emailManagement: hasEmailManagementTask(allTasks),
    calendarManagement: hasCalendarManagementTask(allTasks),
    personalLifeManagement: hasPersonalLifeManagementTask(allTasks),
    businessProcessManagement: hasBusinessProcessManagementTask(allTasks),
  };

  const eaPercentage =
    allTasks.length > 0 ? Math.round((eaTasks.length / allTasks.length) * 100) : 0;

  return {
    totalTasks: allTasks.length,
    // Legacy frequency counts - map from Core Four for compatibility
    dailyTasks: report.tasks.email?.length || 0,
    weeklyTasks: report.tasks.calendar?.length || 0,
    monthlyTasks: report.tasks.businessProcesses?.length || 0,
    eaTasks: eaTasks.length,
    founderTasks: allTasks.length - eaTasks.length,
    eaPercentage,
    coreTasksPresent,
  };
}

/**
 * Validate core EA tasks are present
 */
export function validateCoreEATasks(report: TaskGenerationResult): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const allTasks = getAllTasks(report);

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
 * Validate task quality (titles, descriptions)
 */
export function validateTaskQuality(report: TaskGenerationResult): ValidationResult {
  const warnings: string[] = [];
  const allTasks = getAllTasks(report);

  allTasks.forEach((task, index) => {
    if (!task.title || task.title.length < 3) {
      warnings.push(`Task ${index + 1}: Title too short`);
    } else if (task.title.length > 80) {
      warnings.push(`Task ${index + 1}: Title too long`);
    }
    if (!task.description || task.description.length < 20) {
      warnings.push(`Task ${index + 1}: Description too short`);
    }
  });

  return { isValid: true, errors: [], warnings };
}

/**
 * Semantic dedup: Jaccard similarity on unigrams/bigrams
 * Flag task pairs with >45% overlap
 */
export function validateNoDuplicates(report: TaskGenerationResult): ValidationResult {
  const warnings: string[] = [];
  const allTasks = getAllTasks(report);

  // Build token sets for each task
  const tokenSets = allTasks.map(task => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    const words = text.split(/\W+/).filter(w => w.length > 2);

    // Build unigrams + bigrams
    const tokens = new Set<string>();
    for (const w of words) tokens.add(w);
    for (let i = 0; i < words.length - 1; i++) {
      tokens.add(`${words[i]} ${words[i + 1]}`);
    }
    return tokens;
  });

  // Compare each pair
  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      const intersection = new Set([...tokenSets[i]].filter(t => tokenSets[j].has(t)));
      const union = new Set([...tokenSets[i], ...tokenSets[j]]);
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;

      if (jaccard > 0.45) {
        warnings.push(
          `Duplicate detected: "${allTasks[i].title}" and "${allTasks[j].title}" (${Math.round(jaccard * 100)}% overlap)`
        );
      }
    }
  }

  return { isValid: true, errors: [], warnings };
}

/**
 * Anti-pattern detection: flag tasks using banned generic phrases
 */
export function validateNoAntiPatterns(report: TaskGenerationResult): ValidationResult {
  const warnings: string[] = [];
  const allTasks = getAllTasks(report);

  for (const task of allTasks) {
    const fullText = `${task.title} ${task.description}`;
    for (const pattern of ANTI_PATTERNS) {
      if (pattern.test(fullText)) {
        warnings.push(`Anti-pattern: "${task.title}" contains generic phrase matching ${pattern.source}`);
        break; // one warning per task
      }
    }
  }

  return { isValid: true, errors: [], warnings };
}

// =============================================================================
// CORE TASK DETECTION FUNCTIONS
// =============================================================================

export function hasEmailManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      text.includes('email') ||
      text.includes('inbox') ||
      text.includes('correspondence') ||
      task.coreTaskType === 'emailManagement'
    );
  });
}

export function hasCalendarManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      text.includes('calendar') ||
      text.includes('schedule') ||
      text.includes('scheduling') ||
      text.includes('appointment') ||
      text.includes('meeting') ||
      task.coreTaskType === 'calendarManagement'
    );
  });
}

export function hasPersonalLifeManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      text.includes('personal') ||
      text.includes('travel') ||
      text.includes('booking') ||
      text.includes('reservation') ||
      text.includes('vendor') ||
      text.includes('family') ||
      task.coreTaskType === 'personalLifeManagement'
    );
  });
}

export function hasBusinessProcessManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      text.includes('process') ||
      text.includes('recurring') ||
      text.includes('workflow') ||
      text.includes('system') ||
      text.includes('procedure') ||
      text.includes('automation') ||
      task.coreTaskType === 'businessProcessManagement'
    );
  });
}
