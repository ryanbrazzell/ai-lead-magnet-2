/**
 * Task Types for AI Task Generation Service
 *
 * Ported from: /tmp/ea-time-freedom-report/app/types/index.ts
 * These interfaces define the structure of generated tasks and results.
 */

/**
 * Core EA task type identifiers
 */
export type CoreTaskType =
  | 'emailManagement'
  | 'calendarManagement'
  | 'personalLifeManagement'
  | 'businessProcessManagement';

/**
 * Task frequency options
 */
export type TaskFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * Task priority levels
 */
export type TaskPriority = 'high' | 'medium' | 'low';

/**
 * Task owner type - EA or Founder ("You")
 */
export type TaskOwner = 'EA' | 'You';

/**
 * Individual task interface
 *
 * Represents a single task that can be delegated to an EA or
 * kept by the founder.
 */
export interface Task {
  // Required fields
  title: string;
  description: string;
  owner: TaskOwner;
  isEA: boolean;
  category: string;

  // Optional fields
  id?: string;
  frequency?: TaskFrequency;
  priority?: TaskPriority;
  timeEstimate?: string;
  isCoreEATask?: boolean;
  coreTaskType?: CoreTaskType;
}

/**
 * Tasks grouped by frequency
 */
export interface TasksByFrequency {
  daily: Task[];
  weekly: Task[];
  monthly: Task[];
}

/**
 * Result of AI task generation
 *
 * Contains exactly 30 tasks (10 daily, 10 weekly, 10 monthly)
 * with EA percentage between 40-60%.
 */
export interface TaskGenerationResult {
  // Task structure with 10 tasks per frequency
  tasks: TasksByFrequency;

  // EA metrics (ea_task_percent must be a whole number)
  ea_task_percent: number;
  ea_task_count: number;
  total_task_count: number;

  // Summary text for the report
  summary: string;
}

/**
 * Core EA task structure for report metadata
 */
export interface CoreEATask {
  title: string;
  description: string;
  frequency: TaskFrequency;
  included: boolean;
}

/**
 * All four core EA tasks that should be present in every report
 */
export interface CoreEATasks {
  emailManagement: CoreEATask;
  calendarManagement: CoreEATask;
  personalLifeManagement: CoreEATask;
  businessProcessManagement: CoreEATask;
}
