/**
 * Type Definitions for AI Task Generation Service
 *
 * This barrel export provides all types needed for the task generation
 * service, including lead data, tasks, and validation interfaces.
 */

// Lead data types
export type { UnifiedLeadData, WebsiteAnalysis } from './lead';

// Task types
export type {
  Task,
  TasksByFrequency,
  TaskGenerationResult,
  CoreEATask,
  CoreEATasks,
  TaskOwner,
  TaskFrequency,
  TaskPriority,
  CoreTaskType,
} from './task';

// Validation types
export type { ValidationResult, ReportAnalysis } from './validation';

// PDF generation types
export type {
  PDFGenerationOptions,
  PDFGenerationResult,
  S3UploadOptions,
  PDFColorScheme,
} from './pdf';

// PDF color defaults
export { PDF_COLOR_DEFAULTS } from './pdf';

// Email types
export type {
  EmailSendOptions,
  EmailSendResult,
  EmailErrorResponse,
  MailgunErrorDetails,
} from './email';
