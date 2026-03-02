/**
 * Task Types for AI Task Generation Service
 *
 * Tasks are generated organized by Core Four areas (not frequency).
 * All tasks are EA-delegatable.
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
 * Task frequency options (legacy, kept for compatibility)
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
 * All tasks are EA-delegatable in the new architecture.
 * owner/isEA default to 'EA'/true.
 */
export interface Task {
  // Required fields
  title: string;
  description: string;
  category: string;

  // Core Four classification (required in new architecture)
  coreTaskType?: CoreTaskType;

  // EA ownership — defaults to EA in new flow, kept for compatibility
  owner: TaskOwner;
  isEA: boolean;

  // Optional fields
  id?: string;
  frequency?: TaskFrequency;
  priority?: TaskPriority;
  timeEstimate?: string;
  isCoreEATask?: boolean;
}

/**
 * Tasks grouped by Core Four area
 */
export interface TasksByCoreFour {
  businessProcesses: Task[];
  personalLife: Task[];
  calendar: Task[];
  email: Task[];
}

/**
 * Tasks grouped by frequency (legacy, kept for compatibility)
 */
export interface TasksByFrequency {
  daily: Task[];
  weekly: Task[];
  monthly: Task[];
}

/**
 * Result of AI task generation
 *
 * Tasks grouped by Core Four area with ~22-25 total tasks.
 * All tasks are EA-delegatable.
 */
export interface TaskGenerationResult {
  // Core Four grouped tasks (new primary structure)
  tasks: TasksByCoreFour;

  // Summary
  analysis_summary: string;
  total_task_count: number;

  // Legacy fields kept for downstream compatibility
  ea_task_percent: number;
  ea_task_count: number;
  summary: string;
}

/**
 * Business analysis brief from Call 1
 */
export interface BusinessAnalysisBrief {
  business_description: string;
  recurring_processes: string[];
  calendar_patterns: string[];
  personal_life_opportunities: string[];
  pain_point_decomposition: string[];
  revenue_tier_context: string;
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
