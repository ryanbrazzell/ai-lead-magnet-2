/**
 * PDF Layout Utilities
 *
 * Functions for generating sections of the EA Time Freedom Report PDF.
 * Enhanced with ROI metrics and visual polish matching the web UI.
 *
 * Design System (matching globals.css):
 * - Primary (Navy): #0f172a - Headers, hero backgrounds, brand elements
 * - Accent (Gold): #f59e0b - CTAs, highlights, continue buttons
 * - Success (Green): #10b981 - EA badges, positive indicators
 * - Cost (Red): #dc2626 - Cost/expense indicators
 * - Text: #334155 - Body content
 */

import type { jsPDF } from 'jspdf';
import type { PDFColorScheme } from '@/types/pdf';
import type { Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';
import type { ROICalculation } from '@/lib/roi-calculator';

/**
 * Helper to convert hex to RGB and set color
 */
function setHexColor(doc: jsPDF, hex: string, type: 'fill' | 'text' | 'draw') {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    if (type === 'fill') doc.setFillColor(r, g, b);
    if (type === 'text') doc.setTextColor(r, g, b);
    if (type === 'draw') doc.setDrawColor(r, g, b);
  }
}

/**
 * Enhanced color palette matching web UI design
 * Navy (#0f172a) + Gold (#f59e0b) + Green (#10b981)
 */
export const ENHANCED_COLORS = {
  // Brand colors - Navy/Gold scheme (matches globals.css)
  navy: '#0f172a',       // Primary brand - headers, hero backgrounds
  navyLight: '#1e293b',  // Slate-800 - lighter navy for contrast
  gold: '#f59e0b',       // Accent - CTAs, highlights
  goldLight: '#fcd34d',  // Light gold - subtle accents

  // Success/EA colors
  green: '#10b981',      // Success green - EA badges
  greenLight: '#d1fae5', // Light green - EA badge backgrounds

  // Cost colors
  red: '#dc2626',        // Red-600 - cost indicators
  redLight: '#fef2f2',   // Red-50 - cost badge backgrounds

  // Neutrals
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray400: '#94a3b8',
  gray600: '#475569',
  gray700: '#334155',
  gray900: '#0f172a',
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
  // Brand Header Strip
  setHexColor(doc, ENHANCED_COLORS.navy, 'fill');
  doc.rect(0, 0, 210, 20, 'F'); // Full width navy bar

  // Logo/Brand Text (Left)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setHexColor(doc, ENHANCED_COLORS.white, 'text');
  doc.text('Assistant Launch', 15, 12);

  // Report Title (Right)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setHexColor(doc, ENHANCED_COLORS.gold, 'text'); // Gold accent
  doc.text('TIME FREEDOM REPORT', 195, 12, { align: 'right' });

  // Reset text color
  setHexColor(doc, colors.text, 'text');

  let yPosition = 35; // Start content below header

  // Personalized Greeting
  const fullName = [leadData.firstName, leadData.lastName]
    .filter(Boolean)
    .join(' ');
  
  if (fullName) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    setHexColor(doc, colors.primary, 'text');
    doc.text(`Prepared for: ${fullName}`, 20, yPosition);
    
    // Date on same line, right aligned
    doc.setFont('helvetica', 'normal');
    setHexColor(doc, colors.secondary, 'text');
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(formattedDate, 190, yPosition, { align: 'right' });
    
    yPosition += 10;
  }

  // Optional: Business info if available
  if (leadData.businessType) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setHexColor(doc, colors.secondary, 'text');
    doc.text(leadData.businessType, 20, yPosition - 4); // Just below name
    yPosition += 5;
  }

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

  // Premium Insight Card Container
  const cardWidth = 170;
  const cardX = (210 - cardWidth) / 2;
  
  // Light Blue/Gray background for contrast (not just plain text)
  setHexColor(doc, '#f8fafc', 'fill'); // slate-50
  setHexColor(doc, colors.borderGray, 'draw');
  doc.setLineWidth(0.1);
  doc.roundedRect(cardX, yPosition, cardWidth, 45, 3, 3, 'FD');

  // "Executive Summary" Label - Small, uppercase, tracking wide
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setHexColor(doc, ENHANCED_COLORS.gray400, 'text'); // Muted label
  doc.text('EXECUTIVE SUMMARY', cardX + 10, yPosition + 12);

  // Main Insight Headline
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setHexColor(doc, colors.primary, 'text');
  const headline = `${eaPercent}% of your workload can be delegated immediately.`;
  doc.text(headline, cardX + 10, yPosition + 22);

  // Body Text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  setHexColor(doc, ENHANCED_COLORS.gray600, 'text'); // Softer body text
  const summaryText = `Based on our analysis of your responses, approximately ${eaPercent}% of your daily, weekly, and monthly tasks are prime candidates for delegation to an Executive Assistant. This represents a significant opportunity to reclaim your time.`;
  
  const summaryLines = doc.splitTextToSize(summaryText, cardWidth - 20);
  doc.text(summaryLines, cardX + 10, yPosition + 30);

  return yPosition + 55; // Return new Y position
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
  setHexColor(doc, colors.lightGray, 'fill');
  doc.rect(25, startY, 165, 25, 'F');

  // "Key Insights" header: 14pt bold
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  setHexColor(doc, colors.primary, 'text');
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
  setHexColor(doc, colors.primary, 'text');
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
    setHexColor(doc, colors.primary, 'text');

    const taskNumber = `${index + 1}.`;
    doc.text(taskNumber, 25, yPosition);
    doc.text(task.title, 32, yPosition);

    // EA Task indicator: right-aligned in green for isEA=true
    if (task.isEA) {
      doc.setFontSize(10);
      setHexColor(doc, colors.secondary, 'text');
      doc.setFont('helvetica', 'bold');
      doc.text('\u2713 EA Task', 185, yPosition, { align: 'right' });
    }
    yPosition += 6;

    // Task description: 10pt normal, wrapped to 155px
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setHexColor(doc, '#666666', 'text');
    const descLines = doc.splitTextToSize(task.description, 155);
    doc.text(descLines, 32, yPosition);
    yPosition += descLines.length * 4.5;

    // Owner line: 9pt, #999999
    doc.setFontSize(9);
    setHexColor(doc, '#999999', 'text');
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

  // Gold background box (matches web UI CTA)
  doc.setFillColor(ENHANCED_COLORS.gold);
  doc.roundedRect(25, startY, 165, 24, 3, 3, 'F');

  // Navy text for contrast: 12pt bold
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.navy);
  doc.text('Ready to get started? Schedule your consultation:', 30, startY + 10);
  doc.setFontSize(11);
  doc.text(url, 30, startY + 18);

  return startY + 30;
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

    // Footer separator line at y=280 - gold accent
    doc.setDrawColor(ENHANCED_COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);

    // Branding text: navy color for brand recognition
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ENHANCED_COLORS.navy);
    doc.text(
      'Generated by Assistant Launch',
      105,
      285,
      { align: 'center' }
    );

    // URL in gold
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(ENHANCED_COLORS.gold);
    doc.text('assistantlaunch.com', 105, 289, { align: 'center' });

    // Page numbers: muted
    doc.setFontSize(9);
    doc.setTextColor(ENHANCED_COLORS.gray400);
    doc.text(`Page ${i} of ${pageCount}`, 105, 294, { align: 'center' });
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
 * Renders a navy hero box with gold accent bar and revenue unlocked headline.
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
  const boxX = (210 - boxWidth) / 2; // Center horizontally (210mm is A4 width)

  // Navy background (matches web UI hero)
  doc.setFillColor(ENHANCED_COLORS.navy);
  doc.roundedRect(boxX, startY, boxWidth, boxHeight, 4, 4, 'F');

  // Gold accent bar at top for brand pop
  doc.setFillColor(ENHANCED_COLORS.gold);
  doc.roundedRect(boxX, startY, boxWidth, 4, 4, 0, 'F');

  // "Revenue Potential Unlocked" badge
  // Note: jsPDF doesn't support rgba, using solid color for text background
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
  doc.setFontSize(10); // Increased from 9
  doc.setFont('helvetica', 'bold'); // Changed to bold for clarity
  const flowY = startY + 60;
  // Replaced arrows with pipes and added spacing to prevent character overlapping/encoding issues
  const flowText = `${roi.weeklyHoursDelegated} hrs/week   |   ${roi.monthlyHoursUnlocked} hrs/month   |   ${formatCurrency(roi.ceoHourlyRate)}/hr activities`;
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

  // Modern Card Container (No border, just shadow-like fill for header)
  // We'll use a split layout: Left side = Metrics, Right side = Net Result

  // 1. Left Side: Cost Breakdown
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gray400); // Uppercase label
  doc.text('FINANCIAL IMPACT', 20, yPos);
  
  yPos += 15;

  // Metric 1: Revenue Unlocked
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.navy);
  doc.text(formatCurrency(roi.annualRevenueUnlocked), 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(ENHANCED_COLORS.gray600);
  doc.text('Annual Revenue Unlocked', 20, yPos + 6);

  yPos += 20;

  // Metric 2: EA Investment
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gray600); // Muted for cost
  doc.text(formatCurrency(roi.eaInvestment), 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(ENHANCED_COLORS.gray600);
  doc.text('EA Investment (Annual)', 20, yPos + 6);

  // 2. Right Side: Net Return Card (Gold/Navy Highlight)
  const cardX = 110;
  const cardY = startY - 5;
  const cardWidth = 80;
  const cardHeight = 70;

  // Main Card Background
  doc.setFillColor(ENHANCED_COLORS.navy);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'F');

  // "Net Return" Label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gray400); // Lighter text on navy
  doc.text('NET ANNUAL RETURN', cardX + 10, cardY + 15);

  // Net Return Value (Huge Green/Gold)
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.green); // Pop of green for profit
  doc.text(formatCurrency(roi.netReturn), cardX + 10, cardY + 30);

  // Divider
  doc.setDrawColor(ENHANCED_COLORS.navyLight);
  doc.setLineWidth(0.5);
  doc.line(cardX + 10, cardY + 40, cardX + cardWidth - 10, cardY + 40);

  // ROI Multiplier
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(ENHANCED_COLORS.white);
  doc.text('ROI Multiplier', cardX + 10, cardY + 52);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.gold); // Gold for the multiplier
  doc.text(formatMultiplier(roi.roiMultiplier), cardX + cardWidth - 10, cardY + 52, { align: 'right' });

  return startY + 80;
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

  // Frequency-based colors (matching web UI brand)
  const frequencyColors = {
    daily: { badge: ENHANCED_COLORS.gray100, text: ENHANCED_COLORS.navy },     // navy text
    weekly: { badge: ENHANCED_COLORS.gray100, text: ENHANCED_COLORS.navy },    // navy text
    monthly: { badge: ENHANCED_COLORS.gray100, text: ENHANCED_COLORS.navy },   // navy text
  };

  const freqColor = frequencyColors[frequency];

  // Section title with task count badge - using Navy for brand consistency
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.navy);
  doc.text(title, 25, yPosition);

  // Task count badge - gold accent
  doc.setFillColor(ENHANCED_COLORS.goldLight);
  doc.roundedRect(155, yPosition - 5, 30, 8, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(ENHANCED_COLORS.navy);
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

    // Task row background (Card style)
    // White background with light border for cleaner look
    const rowHeight = 22; // Increased height for breathing room
    doc.setFillColor(ENHANCED_COLORS.white);
    doc.setDrawColor(ENHANCED_COLORS.gray200);
    doc.setLineWidth(0.1);
    doc.roundedRect(22, yPosition - 4, 166, rowHeight, 2, 2, 'FD'); // Fill and Draw

    // Task number and title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11); // Slightly larger
    doc.setTextColor(ENHANCED_COLORS.gray900);
    const titleText = `${index + 1}. ${task.title}`;
    // Truncate title if too long to avoid overlap
    const safeTitle = titleText.length > 65 ? titleText.substring(0, 62) + '...' : titleText;
    doc.text(safeTitle, 28, yPosition + 3);

    // EA badge if applicable (Pill shape)
    const isEA = task.isEA || task.owner?.toLowerCase() === 'ea';
    if (isEA) {
      doc.setFillColor(ENHANCED_COLORS.greenLight);
      doc.roundedRect(28, yPosition + 6, 14, 5, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(ENHANCED_COLORS.green);
      doc.text('EA', 35, yPosition + 9.5, { align: 'center' });
    }

    // Annual cost (Right side badge)
    doc.setFillColor(ENHANCED_COLORS.redLight);
    doc.roundedRect(150, yPosition, 32, 7, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(ENHANCED_COLORS.red);
    doc.text(`${formatCurrency(annualCost)}/yr`, 166, yPosition + 4.5, { align: 'center' });

    // Description (Muted text below)
    if (task.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(ENHANCED_COLORS.gray600);
      // Clean description of newlines
      const cleanDesc = task.description.replace(/\n/g, ' ');
      // Wrap text
      const descLines = doc.splitTextToSize(cleanDesc, 115);
      if (descLines.length > 0) {
        // Show max 1 line to keep card uniform
        doc.text(descLines[0] + (descLines.length > 1 ? '...' : ''), 45, yPosition + 9.5);
      }
    }

    yPosition += rowHeight + 4; // Gap between cards
  });

  return { yPosition: yPosition + 5, pageBreakOccurred };
}
