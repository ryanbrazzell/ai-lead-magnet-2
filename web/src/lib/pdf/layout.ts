/**
 * PDF Layout Utilities
 *
 * Functions for generating sections of the EA Time Freedom Report PDF.
 * Ported from: /tmp/ea-time-freedom-report/app/utils/generatePDF.ts lines 119-324
 *
 * These utilities handle the rendering of headers, sections, and footers
 * in the jsPDF document, maintaining consistent styling throughout.
 */

import type { jsPDF } from 'jspdf';
import type { PDFColorScheme } from '@/types/pdf';
import type { Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';

/**
 * Default Calendly URL for CTA box
 */
const DEFAULT_CALENDLY_URL = 'calendly.com/assistantlaunch/discovery-call';

/**
 * Page break threshold - when yPosition exceeds this, add a new page
 */
const PAGE_BREAK_THRESHOLD = 255;

/**
 * Y position after page break
 */
const NEW_PAGE_START_Y = 25;

/**
 * Add PDF header section
 *
 * Renders the header with title, lead info, date, and separator line.
 * Reference: generatePDF.ts lines 119-160
 *
 * @param doc - jsPDF document instance
 * @param leadData - Lead information for personalization
 * @param colors - Color scheme for styling
 * @returns Final y position after header section
 */
export function addPDFHeader(
  doc: jsPDF,
  leadData: UnifiedLeadData,
  colors: PDFColorScheme
): number {
  let yPosition = 25;

  // Title: "EA Time Freedom Report" centered, 28pt bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(colors.primary);
  doc.text('EA Time Freedom Report', 105, yPosition, { align: 'center' });
  yPosition += 15;

  // Subtitle with lead info - 14pt normal, #666666
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#666666');

  // Full name
  const fullName = [leadData.firstName, leadData.lastName]
    .filter(Boolean)
    .join(' ');
  if (fullName) {
    doc.text(fullName, 105, yPosition, { align: 'center' });
    yPosition += 7;
  }

  // Title
  if (leadData.title) {
    doc.text(leadData.title, 105, yPosition, { align: 'center' });
    yPosition += 7;
  }

  // Business type
  if (leadData.businessType) {
    doc.text(leadData.businessType, 105, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Date - formatted as "Month Day, Year", 12pt
  doc.setFontSize(12);
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(formattedDate, 105, yPosition, { align: 'center' });
  yPosition += 20;

  // Separator line at current position
  doc.setDrawColor(colors.borderGray);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 20;

  return yPosition;
}

/**
 * Add executive summary section
 *
 * Renders the executive summary with EA percentage highlight.
 * Reference: generatePDF.ts lines 162-177
 *
 * @param doc - jsPDF document instance
 * @param eaPercent - Percentage of tasks suitable for EA
 * @param startY - Starting y position
 * @param colors - Color scheme for styling
 * @returns Final y position after summary section
 */
export function addExecutiveSummary(
  doc: jsPDF,
  eaPercent: number,
  startY: number,
  colors: PDFColorScheme
): number {
  let yPosition = startY;

  // Section header: 18pt bold, primary color
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  doc.text('Executive Summary', 25, yPosition);
  yPosition += 12;

  // Summary text: 12pt normal, text color
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.text);

  const summaryText = `Based on our analysis, approximately ${eaPercent}% of your tasks could be delegated to an Executive Assistant. This represents a significant opportunity to reclaim your time and focus on high-value activities that drive your business forward.`;

  // Wrap text to 165px width
  const summaryLines = doc.splitTextToSize(summaryText, 165);
  doc.text(summaryLines, 25, yPosition);
  yPosition += summaryLines.length * 5.5 + 15;

  return yPosition;
}

/**
 * Add key insights box
 *
 * Renders a gray background box with task metrics.
 * Reference: generatePDF.ts lines 179-197
 *
 * @param doc - jsPDF document instance
 * @param tasks - Array of all tasks
 * @param eaPercent - Percentage of tasks suitable for EA
 * @param startY - Starting y position
 * @param colors - Color scheme for styling
 * @returns Final y position after insights box
 */
export function addKeyInsightsBox(
  doc: jsPDF,
  tasks: Task[],
  eaPercent: number,
  startY: number,
  colors: PDFColorScheme
): number {
  // Gray background box: 25, startY, 165x25
  doc.setFillColor(colors.lightGray);
  doc.rect(25, startY, 165, 25, 'F');

  // "Key Insights" header: 14pt bold
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  doc.text('Key Insights', 30, startY + 10);

  // Calculate EA task count
  const eaTasks = tasks.filter((task) => task.isEA);

  // Task metrics: 11pt normal
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Total tasks analyzed: ${tasks.length}`, 30, startY + 17);
  doc.text(
    `• Tasks suitable for EA: ${eaTasks.length} (${eaPercent}%)`,
    100,
    startY + 17
  );

  return startY + 35;
}

/**
 * Result from addTaskSection with yPosition and page break info
 */
export interface TaskSectionResult {
  yPosition: number;
  pageBreakOccurred: boolean;
}

/**
 * Add task section rendering
 *
 * Renders a section of tasks with proper formatting and EA badges.
 * Reference: generatePDF.ts lines 199-265
 *
 * @param doc - jsPDF document instance
 * @param title - Section title (e.g., "Daily Tasks & Responsibilities")
 * @param tasks - Array of tasks for this section
 * @param startY - Starting y position
 * @param colors - Color scheme for styling
 * @returns Object with final y position and page break indicator
 */
export function addTaskSection(
  doc: jsPDF,
  title: string,
  tasks: Task[],
  startY: number,
  colors: PDFColorScheme
): TaskSectionResult {
  let yPosition = startY;
  let pageBreakOccurred = false;

  // Check if we need a new page before starting section
  if (yPosition > 240) {
    doc.addPage();
    yPosition = NEW_PAGE_START_Y;
    pageBreakOccurred = true;
  }

  // Section title: 16pt bold, primary color
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  doc.text(title, 25, yPosition);
  yPosition += 12;

  // Render each task
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  tasks.forEach((task, index) => {
    // Check if we need a new page before this task
    if (yPosition > PAGE_BREAK_THRESHOLD) {
      doc.addPage();
      yPosition = NEW_PAGE_START_Y;
      pageBreakOccurred = true;
    }

    // Task number and title: 11pt bold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(colors.primary);

    const taskNumber = `${index + 1}.`;
    doc.text(taskNumber, 25, yPosition);
    doc.text(task.title, 32, yPosition);

    // EA Task indicator: right-aligned in green for isEA=true
    if (task.isEA) {
      doc.setFontSize(10);
      doc.setTextColor(colors.secondary);
      doc.setFont('helvetica', 'bold');
      doc.text('\u2713 EA Task', 185, yPosition, { align: 'right' });
    }
    yPosition += 6;

    // Task description: 10pt normal, wrapped to 155px
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#666666');
    const descLines = doc.splitTextToSize(task.description, 155);
    doc.text(descLines, 32, yPosition);
    yPosition += descLines.length * 4.5;

    // Owner line: 9pt, #999999
    doc.setFontSize(9);
    doc.setTextColor('#999999');
    doc.text(`Owner: ${task.owner}`, 32, yPosition);
    yPosition += 10;
  });

  yPosition += 5;

  return { yPosition, pageBreakOccurred };
}

/**
 * Add next steps section
 *
 * Renders the next steps section with summary text.
 * Reference: generatePDF.ts lines 267-287
 *
 * @param doc - jsPDF document instance
 * @param eaTaskCount - Number of EA tasks identified
 * @param startY - Starting y position
 * @param colors - Color scheme for styling
 * @returns Final y position after next steps section
 */
export function addNextStepsSection(
  doc: jsPDF,
  eaTaskCount: number,
  startY: number,
  colors: PDFColorScheme
): number {
  let yPosition = startY;

  // Check if we need a new page
  if (yPosition > 220) {
    doc.addPage();
    yPosition = NEW_PAGE_START_Y;
  }

  // Section header: 16pt bold
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  doc.text('Next Steps', 25, yPosition);
  yPosition += 12;

  // Next steps text: 12pt normal
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.text);

  const nextStepsText = `Ready to reclaim your time? Focus on delegating the ${eaTaskCount} EA tasks identified above. Start with email and calendar management for immediate impact, then gradually expand to include personal life coordination and business process management.`;

  const nextStepsLines = doc.splitTextToSize(nextStepsText, 165);
  doc.text(nextStepsLines, 25, yPosition);
  yPosition += nextStepsLines.length * 5.5 + 10;

  return yPosition;
}

/**
 * Add CTA box
 *
 * Renders a green background CTA box with calendly link.
 * Reference: generatePDF.ts lines 289-298
 *
 * @param doc - jsPDF document instance
 * @param startY - Starting y position
 * @param calendlyUrl - Calendly URL (uses default if not provided)
 * @param colors - Color scheme for styling
 * @returns Final y position after CTA box
 */
export function addCTABox(
  doc: jsPDF,
  startY: number,
  calendlyUrl: string | undefined,
  colors: PDFColorScheme
): number {
  const url = calendlyUrl || DEFAULT_CALENDLY_URL;

  // Green background box
  doc.setFillColor(colors.secondary);
  doc.rect(25, startY, 165, 20, 'F');

  // White text: 12pt bold
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('white');
  doc.text('Ready to get started? Schedule your consultation:', 30, startY + 8);
  doc.text(url, 30, startY + 15);

  return startY + 20;
}

/**
 * Add footer to all pages
 *
 * Iterates through all pages and adds consistent footer.
 * Reference: generatePDF.ts lines 306-324
 *
 * @param doc - jsPDF document instance
 * @param colors - Color scheme for styling
 */
export function addFooterToAllPages(doc: jsPDF, colors: PDFColorScheme): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer separator line at y=280
    doc.setDrawColor(colors.borderGray);
    doc.line(20, 280, 190, 280);

    // Branding text: 10pt normal, #999999
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#999999');
    doc.text(
      'Generated by Assistant Launch • assistantlaunch.com',
      105,
      285,
      { align: 'center' }
    );

    // Page numbers: #cccccc
    doc.setTextColor('#cccccc');
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }
}
