/**
 * Validation Types for AI Task Generation Service
 *
 * Ported from: /tmp/ea-time-freedom-report/app/utils/reportValidator.ts
 * These interfaces define validation results and report analysis structures.
 */

/**
 * Result of validating a generated report
 *
 * Contains validation status along with any errors or warnings found.
 */
export interface ValidationResult {
  /** Whether the report passes all validation requirements */
  isValid: boolean;

  /** Critical errors that make the report invalid */
  errors: string[];

  /** Non-critical issues that should be noted */
  warnings: string[];
}

/**
 * Detailed analysis of a generated report
 *
 * Contains counts and metrics for validating report quality.
 */
export interface ReportAnalysis {
  // Task counts
  totalTasks: number;
  dailyTasks: number;
  weeklyTasks: number;
  monthlyTasks: number;

  // EA vs Founder distribution
  eaTasks: number;
  founderTasks: number;
  eaPercentage: number;

  // Core EA task presence
  coreTasksPresent: {
    emailManagement: boolean;
    calendarManagement: boolean;
    personalLifeManagement: boolean;
    businessProcessManagement: boolean;
  };
}
