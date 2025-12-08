/**
 * PDF Layout Utilities
 *
 * Functions for generating sections of the EA Time Freedom Report PDF.
 * Enhanced with ROI metrics and visual polish matching the web UI.
 *
 * Design System:
 * - Primary (Purple): #6F00FF - Brand, headers, emphasis
 * - Secondary (Green): #00cc6a - EA badges, success indicators
 * - Accent (Red): #ef4444 - Cost highlights
 * - Text: #374151 - Body content
 */

import type { jsPDF } from 'jspdf';
import type { PDFColorScheme } from '@/types/pdf';
import type { Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';
import type { ROICalculation } from '@/lib/roi-calculator';

/**
 * Enhanced color palette matching web UI design
 */
export const ENHANCED_COLORS = {
  // Brand colors
  purple: '#6F00FF',
  purpleDark: '#5B00D4',
  indigo: '#4F46E5',

  // UI colors
  green: '#00cc6a',
  greenLight: '#dcfce7',
  red: '#ef4444',
  redLight: '#fef2f2',
  amber: '#f59e0b',

  // Neutrals
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
} as const;

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

/**
 * Format currency for PDF display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ROI multiplier for display (e.g., "15.2x")
 */
function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}

/**
 * Add ROI Hero Section
 *
 * Renders a purple gradient-style box with the revenue unlocked headline.
 * Matches the RevenueHero component from the web UI.
 *
 * @param doc - jsPDF document instance
 * @param roi - ROI calculation data
 * @param firstName - User's first name for personalization
 * @param startY - Starting y position
 * @returns Final y position after hero section
 */
export function addROIHeroSection(
  doc: jsPDF,
  roi: ROICalculation,
  firstName: string,
  startY: number
): number {
  const boxHeight = 65;
  const boxWidth = 170;
  const boxX = 20;

  // Purple gradient background (simulated with solid color + overlay)
  doc.setFillColor(ENHANCED_COLORS.purple);
  doc.roundedRect(boxX, startY, boxWidth, boxHeight, 4, 4, 'F');

  // Add a subtle darker strip at top for depth
  doc.setFillColor(ENHANCED_COLORS.purpleDark);
  doc.roundedRect(boxX, startY, boxWidth, 8, 4, 0, 'F');

  // "Revenue Potential Unlocked" badge
  doc.setFillColor('rgba(255,255,255,0.2)');
  doc.setFontSize(9);
  doc.setTextColor(ENHANCED_COLORS.white);
  doc.text('REVENUE POTENTIAL UNLOCKED', 105, startY + 12, { align: 'center' });

  // Personalized headline
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${firstName}, You Could Unlock`, 105, startY + 24, { align: 'center' });

  // Large revenue amount
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(roi.annualRevenueUnlocked), 105, startY + 42, { align: 'center' });

  // Subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`annually by delegating just ${roi.weeklyHoursDelegated} hours per week`, 105, startY + 52, { align: 'center' });

  // Calculation flow at bottom
  doc.setFontSize(9);
  const flowY = startY + 60;
  const flowText = `${roi.weeklyHoursDelegated} hrs/week → ${roi.monthlyHoursUnlocked} hrs/month → ${formatCurrency(roi.ceoHourlyRate)}/hr activities`;
  doc.text(flowText, 105, flowY, { align: 'center' });

  return startY + boxHeight + 15;
}

/**
 * Add ROI Analysis Section
 *
 * Renders the cost-benefit breakdown with EA investment, net return, and ROI multiplier.
 * Matches the ROIAnalysis component from the web UI.
 *
 * @param doc - jsPDF document instance
 * @param roi - ROI calculation data
 * @param startY - Starting y position
 * @returns Final y position after analysis section
 */
export function addROIAnalysisSection(
  doc: jsPDF,
  roi: ROICalculation,
  startY: number
): number {
  let yPos = startY;

  // Card container
  doc.setDrawColor(ENHANCED_COLORS.gray200);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPos, 170, 75, 3, 3, 'S');

  // Header bar
  doc.setFillColor(ENHANCED_COLORS.gray50);
  doc.roundedRect(20, yPos, 170, 12, 3, 0, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gray700);
  doc.text('ROI Analysis', 26, yPos + 8);

  yPos += 18;

  // Annual Revenue Unlocked line
  doc.setFillColor(ENHANCED_COLORS.greenLight);
  doc.circle(28, yPos + 2, 4, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(ENHANCED_COLORS.gray700);
  doc.text('Annual Revenue Unlocked', 36, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.green);
  doc.text(`+${formatCurrency(roi.annualRevenueUnlocked)}`, 184, yPos + 4, { align: 'right' });

  yPos += 14;

  // EA Investment line
  doc.setFillColor(ENHANCED_COLORS.gray100);
  doc.circle(28, yPos + 2, 4, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(ENHANCED_COLORS.gray700);
  doc.text('EA Investment (annual)', 36, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gray600);
  doc.text(`-${formatCurrency(roi.eaInvestment)}`, 184, yPos + 4, { align: 'right' });

  yPos += 12;

  // Dashed divider
  doc.setLineDashPattern([2, 2], 0);
  doc.setDrawColor(ENHANCED_COLORS.gray200);
  doc.line(26, yPos, 184, yPos);
  doc.setLineDashPattern([], 0);

  yPos += 10;

  // NET RETURN line
  doc.setFillColor(ENHANCED_COLORS.purple);
  doc.circle(28, yPos + 2, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gray900);
  doc.text('NET RETURN', 36, yPos + 4);
  doc.setFontSize(14);
  doc.setTextColor(ENHANCED_COLORS.purple);
  doc.text(formatCurrency(roi.netReturn), 184, yPos + 4, { align: 'right' });

  yPos += 16;

  // ROI Multiplier box
  const multiplierBoxY = yPos;
  doc.setFillColor(ENHANCED_COLORS.gray50);
  doc.roundedRect(26, multiplierBoxY, 158, 16, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(ENHANCED_COLORS.gray600);
  doc.text('ROI MULTIPLIER', 105, multiplierBoxY + 6, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.purple);
  doc.text(formatMultiplier(roi.roiMultiplier), 105, multiplierBoxY + 14, { align: 'center' });

  return startY + 85;
}

/**
 * Add Challenge Question Box
 *
 * Renders the yellow challenge question asking about ROI comparison.
 *
 * @param doc - jsPDF document instance
 * @param roiMultiplier - ROI multiplier value
 * @param startY - Starting y position
 * @returns Final y position after challenge box
 */
export function addChallengeQuestion(
  doc: jsPDF,
  roiMultiplier: number,
  startY: number
): number {
  // Yellow background box
  doc.setFillColor('#fef9c3'); // yellow-100
  doc.setDrawColor('#fbbf24'); // yellow-400
  doc.setLineWidth(0.75);
  doc.roundedRect(20, startY, 170, 18, 3, 3, 'FD');

  // Challenge text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gray900);
  const text = `What other investments are giving you a ${formatMultiplier(roiMultiplier)} return right now?`;
  doc.text(text, 105, startY + 11, { align: 'center' });

  return startY + 26;
}

/**
 * Add Enhanced Task Section with Annual Cost
 *
 * Renders tasks with annual cost prominently displayed.
 *
 * @param doc - jsPDF document instance
 * @param title - Section title
 * @param tasks - Array of tasks
 * @param ceoHourlyRate - CEO hourly rate for cost calculation
 * @param frequency - Task frequency for annual calculation
 * @param startY - Starting y position
 * @param colors - Color scheme
 * @returns Object with final y position
 */
export function addEnhancedTaskSection(
  doc: jsPDF,
  title: string,
  tasks: Task[],
  ceoHourlyRate: number,
  frequency: 'daily' | 'weekly' | 'monthly',
  startY: number,
  colors: PDFColorScheme
): TaskSectionResult {
  let yPosition = startY;
  let pageBreakOccurred = false;

  if (tasks.length === 0) {
    return { yPosition, pageBreakOccurred };
  }

  // Check for page break
  if (yPosition > 240) {
    doc.addPage();
    yPosition = NEW_PAGE_START_Y;
    pageBreakOccurred = true;
  }

  // Frequency-based colors
  const frequencyColors = {
    daily: { badge: '#dbeafe', text: '#1e40af' },    // blue
    weekly: { badge: '#f3e8ff', text: '#7e22ce' },   // violet
    monthly: { badge: '#fef3c7', text: '#b45309' },  // amber
  };

  const freqColor = frequencyColors[frequency];

  // Section title with task count badge
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary);
  doc.text(title, 25, yPosition);

  // Task count badge
  doc.setFillColor(freqColor.badge);
  doc.roundedRect(155, yPosition - 5, 30, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(freqColor.text);
  doc.text(`${tasks.length} tasks`, 170, yPosition, { align: 'center' });

  yPosition += 10;

  // Annual hours multiplier
  const occurrencesPerYear = { daily: 260, weekly: 52, monthly: 12 };
  const yearlyMultiplier = occurrencesPerYear[frequency];

  // Base time estimates by frequency
  const baseTimes = {
    daily: [0.25, 0.33, 0.5, 0.75],
    weekly: [0.5, 0.75, 1, 1.5],
    monthly: [1, 1.5, 2, 3],
  };

  // Render each task
  tasks.forEach((task, index) => {
    if (yPosition > PAGE_BREAK_THRESHOLD) {
      doc.addPage();
      yPosition = NEW_PAGE_START_Y;
      pageBreakOccurred = true;
    }

    // Calculate varied time estimate
    const timeOptions = baseTimes[frequency];
    let hoursPerOccurrence = timeOptions[index % timeOptions.length];

    // Keyword multipliers
    const titleLower = (task.title || '').toLowerCase();
    if (titleLower.includes('strategy') || titleLower.includes('planning')) {
      hoursPerOccurrence *= 1.5;
    } else if (titleLower.includes('report') || titleLower.includes('review')) {
      hoursPerOccurrence *= 1.3;
    } else if (titleLower.includes('quick') || titleLower.includes('simple')) {
      hoursPerOccurrence *= 0.7;
    }

    const annualCost = hoursPerOccurrence * yearlyMultiplier * ceoHourlyRate;

    // Task row background (alternating)
    if (index % 2 === 0) {
      doc.setFillColor(ENHANCED_COLORS.gray50);
      doc.rect(22, yPosition - 3, 166, 16, 'F');
    }

    // Task number and title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(ENHANCED_COLORS.gray900);
    doc.text(`${index + 1}. ${task.title}`, 25, yPosition + 3);

    // EA badge if applicable
    const isEA = task.isEA || task.owner?.toLowerCase() === 'ea';
    if (isEA) {
      doc.setFillColor(ENHANCED_COLORS.greenLight);
      doc.roundedRect(120, yPosition - 1, 16, 6, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(ENHANCED_COLORS.green);
      doc.text('EA', 128, yPosition + 3, { align: 'center' });
    }

    // Annual cost (right side, red accent)
    doc.setFillColor(ENHANCED_COLORS.redLight);
    doc.roundedRect(150, yPosition - 2, 35, 8, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ENHANCED_COLORS.red);
    doc.text(`${formatCurrency(annualCost)}/yr`, 185, yPosition + 3, { align: 'right' });

    yPosition += 8;

    // Description (if available and space permits)
    if (task.description && yPosition < PAGE_BREAK_THRESHOLD - 10) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(ENHANCED_COLORS.gray600);
      const descLines = doc.splitTextToSize(task.description, 140);
      if (descLines.length > 0) {
        doc.text(descLines[0], 25, yPosition + 3);
        yPosition += 6;
      }
    }

    yPosition += 4;
  });

  return { yPosition: yPosition + 5, pageBreakOccurred };
}
