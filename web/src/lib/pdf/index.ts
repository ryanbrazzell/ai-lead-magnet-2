/**
 * PDF Generation Module
 *
 * Exports all PDF generation utilities and services.
 */

// Layout utilities
export {
  addPDFHeader,
  addExecutiveSummary,
  addKeyInsightsBox,
  addTaskSection,
  addNextStepsSection,
  addCTABox,
  addFooterToAllPages,
} from './layout';

export type { TaskSectionResult } from './layout';

// PDF Generator Service
export { generatePDF } from './generator';

// S3 Upload Service
export { uploadToS3, generateSafeFilename } from './s3Service';
