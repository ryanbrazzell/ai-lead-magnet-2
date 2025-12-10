/**
 * PDF Generator Service
 *
 * Main PDF generation function that orchestrates the creation of
 * EA Time Freedom Report documents.
 *
 * Ported from: /tmp/ea-time-freedom-report/app/utils/generatePDF.ts lines 27-107
 */

import { jsPDF } from 'jspdf';
import type { TaskGenerationResult, Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';
import type {
  PDFGenerationOptions,
  PDFGenerationResult,
  PDFColorScheme,
} from '@/types/pdf';
import { PDF_COLOR_DEFAULTS } from '@/types/pdf';
import {
  addPDFHeader,
  addExecutiveSummary,
  addKeyInsightsBox,
  addTaskSection,
  addNextStepsSection,
  addCTABox,
  addFooterToAllPages,
  addROIHeroSection,
  addROIAnalysisSection,
  addChallengeQuestion,
  addEnhancedTaskSection,
} from './layout';
import { calculateROI, type TaskHours } from '@/lib/roi-calculator';

/**
 * Extended options for enhanced PDF generation
 */
interface EnhancedPDFOptions extends PDFGenerationOptions {
  /** Task hours from ROI calculator (optional for enhanced PDF) */
  taskHours?: TaskHours;
  /** Revenue range for ROI calculations */
  revenueRange?: string;
  /** Business stage number (1-7) */
  stage?: number;
  /** Business stage name */
  stageName?: string;
}

/**
 * Generate PDF from task generation report and lead data
 *
 * Creates a professional "EA Time Freedom Report" PDF document
 * with all tasks, metrics, and CTA sections.
 *
 * Enhanced version includes:
 * - ROI Hero section with revenue unlocked
 * - ROI Analysis with cost/benefit breakdown
 * - Challenge question
 * - Enhanced task sections with annual cost per task
 *
 * @param report - TaskGenerationResult with 30 tasks and EA metrics
 * @param leadData - UnifiedLeadData for personalization
 * @param options - Optional EnhancedPDFOptions for customization
 * @returns PDFGenerationResult with success, buffer, base64, filename, size
 */
export async function generatePDF(
  report: TaskGenerationResult,
  leadData: UnifiedLeadData,
  options: EnhancedPDFOptions = {}
): Promise<PDFGenerationResult> {
  const startTime = Date.now();

  try {
    // Log start of PDF generation
    console.log('[PDF Generator] Starting PDF generation', {
      leadType: leadData.leadType,
      totalTasks: Object.values(report.tasks).flat().length,
      eaPercentage: report.ea_task_percent,
    });

    // Create new PDF document (A4 size, portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Generate filename with lead name and timestamp
    const name =
      [leadData.firstName, leadData.lastName].filter(Boolean).join('_') ||
      'Report';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `EA_Time_Freedom_Report_${name}_${timestamp}.pdf`;

    // Set up color scheme from options or defaults
    const colors: PDFColorScheme = {
      primary: options.customColors?.primary || PDF_COLOR_DEFAULTS.primary,
      secondary:
        options.customColors?.secondary || PDF_COLOR_DEFAULTS.secondary,
      text: options.customColors?.text || PDF_COLOR_DEFAULTS.text,
      lightGray: PDF_COLOR_DEFAULTS.lightGray,
      borderGray: PDF_COLOR_DEFAULTS.borderGray,
    };

    // Orchestrate PDF content generation
    await addPDFContent(doc, report, leadData, colors, options);

    // Add metadata if requested
    if (options.includeMetadata) {
      addPDFMetadata(doc, report, leadData);
    }

    // Add watermark if provided
    if (options.watermark) {
      addWatermark(doc, options.watermark);
    }

    // Generate PDF outputs
    const pdfArrayBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfArrayBuffer);
    const base64 = doc.output('datauristring').split(',')[1];

    const duration = Date.now() - startTime;

    // Log successful generation
    console.log('[PDF Generator] PDF generated successfully', {
      filename,
      size: buffer.length,
      duration,
      pages: doc.getNumberOfPages(),
    });

    return {
      success: true,
      buffer,
      base64,
      filename,
      size: buffer.length,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    // Log failure
    console.error('[PDF Generator] PDF generation failed', {
      error: errorMessage,
      duration,
      leadType: leadData.leadType,
    });

    return {
      success: false,
      filename: `EA_Time_Freedom_Report_Error_${Date.now()}.pdf`,
      error: errorMessage,
    };
  }
}

/**
 * Add main content to PDF document
 *
 * Orchestrates the layout utilities to build the complete report.
 * Enhanced version includes ROI sections when task hours are provided.
 *
 * @param doc - jsPDF document instance
 * @param report - TaskGenerationResult with tasks and metrics
 * @param leadData - UnifiedLeadData for personalization
 * @param colors - PDFColorScheme for styling
 * @param options - Enhanced PDF options including ROI data
 */
async function addPDFContent(
  doc: jsPDF,
  report: TaskGenerationResult,
  leadData: UnifiedLeadData,
  colors: PDFColorScheme,
  options: EnhancedPDFOptions
): Promise<void> {
  // Track y position throughout document
  let yPosition: number;

  // Calculate ROI if task hours provided
  const hasROIData = options.taskHours && options.revenueRange;
  const roi = hasROIData
    ? calculateROI(options.taskHours!, options.revenueRange!)
    : null;

  // 1. Add header section (title, lead info, date, separator)
  yPosition = addPDFHeader(doc, leadData, colors);

  // 2. If we have ROI data, add the enhanced ROI sections
  if (roi) {
    // PAGE 1: HERO & INTRO
    
    // Add ROI Hero (Revenue Unlocked)
    yPosition = addROIHeroSection(
      doc,
      roi,
      leadData.firstName || 'there',
      yPosition
    );

    // Add Executive Summary below Hero on Page 1
    yPosition = addExecutiveSummary(doc, report.ea_task_percent, yPosition, colors);

    // PAGE 2: DETAILED ANALYSIS
    doc.addPage();
    yPosition = 25; // Start fresh on new page

    // Add ROI Analysis (cost/benefit breakdown)
    yPosition = addROIAnalysisSection(doc, roi, yPosition);

    // Add Challenge Question
    yPosition = addChallengeQuestion(doc, roi.roiMultiplier, yPosition);
  } else {
    // Fallback if no ROI data: Keep Executive Summary on Page 1
    yPosition = addExecutiveSummary(doc, report.ea_task_percent, yPosition, colors);
  }

  // 3. Collect all tasks for key insights box
  const allTasks: Task[] = [
    ...report.tasks.daily,
    ...report.tasks.weekly,
    ...report.tasks.monthly,
  ];

  // 4. Add key insights box with task metrics
  // (Keep on Page 2 if ROI exists, otherwise Page 1)
  yPosition = addKeyInsightsBox(
    doc,
    allTasks,
    report.ea_task_percent,
    yPosition,
    colors
  );

  // PAGE 3: TASK BREAKDOWN (if ROI exists)
  if (roi) {
    doc.addPage();
    yPosition = 25;
  } else {
    yPosition += 10; // Just add spacing if single page flow
  }

  // 5. Add task sections (daily, weekly, monthly)
  // Use enhanced sections with annual cost if ROI data available
  if (roi) {
    const sections = [
      { title: 'Daily Tasks', tasks: report.tasks.daily, frequency: 'daily' as const },
      { title: 'Weekly Tasks', tasks: report.tasks.weekly, frequency: 'weekly' as const },
      { title: 'Monthly Tasks', tasks: report.tasks.monthly, frequency: 'monthly' as const },
    ];

    for (const section of sections) {
      const result = addEnhancedTaskSection(
        doc,
        section.title,
        section.tasks,
        roi.ceoHourlyRate,
        section.frequency,
        yPosition,
        colors
      );
      yPosition = result.yPosition;
    }
  } else {
    // Fallback to original task sections
    const sections = [
      { title: 'Daily Tasks & Responsibilities', tasks: report.tasks.daily },
      { title: 'Weekly Tasks & Responsibilities', tasks: report.tasks.weekly },
      { title: 'Monthly Tasks & Responsibilities', tasks: report.tasks.monthly },
    ];

    for (const section of sections) {
      const result = addTaskSection(
        doc,
        section.title,
        section.tasks,
        yPosition,
        colors
      );
      yPosition = result.yPosition;
    }
  }

  // 6. Calculate EA task count for next steps section
  const eaTaskCount = allTasks.filter((task) => task.isEA).length;

  // 7. Add next steps section
  yPosition = addNextStepsSection(doc, eaTaskCount, yPosition, colors);

  // 8. Add CTA box
  addCTABox(doc, yPosition, undefined, colors);

  // 9. Add footer to all pages (must be last)
  addFooterToAllPages(doc, colors);
}

/**
 * Re-export EnhancedPDFOptions for external use
 */
export type { EnhancedPDFOptions };

/**
 * Add PDF document metadata
 *
 * Adds document properties for PDF readers.
 *
 * @param doc - jsPDF document instance
 * @param report - TaskGenerationResult for context
 * @param leadData - UnifiedLeadData for context
 */
function addPDFMetadata(
  doc: jsPDF,
  report: TaskGenerationResult,
  leadData: UnifiedLeadData
): void {
  try {
    // jsPDF metadata support
    const properties = {
      title: 'EA Time Freedom Report',
      subject: 'Executive Assistant Task Delegation Analysis',
      author: 'Assistant Launch',
      keywords: 'executive assistant, delegation, time management, productivity',
      creator: 'Assistant Launch PDF Generator',
    };

    doc.setProperties(properties);

    console.log('[PDF Generator] Metadata added', {
      title: properties.title,
      leadType: leadData.leadType,
      eaPercent: report.ea_task_percent,
    });
  } catch (error) {
    // Non-critical error - log and continue
    console.warn('[PDF Generator] Could not add PDF metadata', { error });
  }
}

/**
 * Add watermark to all pages
 *
 * Renders a diagonal watermark text on all pages.
 *
 * @param doc - jsPDF document instance
 * @param watermarkText - Text to display as watermark
 */
function addWatermark(doc: jsPDF, watermarkText: string): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Save current graphics state
    doc.saveGraphicsState();

    // Set watermark properties - light gray, large font
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');

    // Add rotated watermark text at center of page
    doc.text(watermarkText, 105, 150, {
      align: 'center',
      angle: 45,
    });

    // Restore graphics state
    doc.restoreGraphicsState();
  }
}
