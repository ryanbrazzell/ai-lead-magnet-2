/**
 * PDF Layout V2 - Clean, Minimal Design
 *
 * Ported from Python ReportLab design to TypeScript/jsPDF.
 * Matching the cleaner, more professional aesthetic.
 *
 * Design System:
 * - Accent (Teal): #0D7377
 * - Accent Light: #E6F4F4
 * - Ink (Primary): #111827
 * - Ink Secondary: #4B5563
 * - Ink Muted: #9CA3AF
 * - Divider: #E5E7EB
 * - Background: #F9FAFB
 */

import type { jsPDF } from 'jspdf';

// =============================================================================
// DESIGN TOKENS
// =============================================================================

export const COLORS = {
  white: '#FFFFFF',
  ink: '#111827',
  inkSecondary: '#4B5563',
  inkMuted: '#9CA3AF',
  accent: '#0D7377',
  accentLight: '#E6F4F4',
  divider: '#E5E7EB',
  background: '#F9FAFB',
} as const;

// Layout constants (in mm for jsPDF)
const PAGE_WIDTH = 210; // A4 width
const PAGE_HEIGHT = 297; // A4 height
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert hex color to RGB and set on document
 */
function setColor(doc: jsPDF, hex: string, type: 'fill' | 'text' | 'draw'): void {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  if (type === 'fill') doc.setFillColor(r, g, b);
  else if (type === 'text') doc.setTextColor(r, g, b);
  else if (type === 'draw') doc.setDrawColor(r, g, b);
}

/**
 * Draw a rounded rectangle (jsPDF doesn't have built-in support)
 */
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: 'F' | 'S' | 'FD' = 'F'
): void {
  doc.roundedRect(x, y, w, h, r, r, style);
}

/**
 * Wrap text to fit within a max width
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current: string[] = [];

  for (const word of words) {
    const testLine = [...current, word].join(' ');
    if (testLine.length <= maxChars) {
      current.push(word);
    } else {
      if (current.length > 0) lines.push(current.join(' '));
      current = [word];
    }
  }
  if (current.length > 0) lines.push(current.join(' '));

  return lines;
}

/**
 * Format currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================================================
// DATA TYPES
// =============================================================================

export interface PDFTask {
  name: string;
  description: string;
  time_saved: string;
}

export interface PDFReportData {
  client_name: string;
  date: string;
  annual_value: number;
  weekly_hours: number;
  total_tasks_ea: number;
  ea_investment: number;
  net_return: number;
  roi_multiplier: number;
  analysis_text: string;
  daily_tasks: PDFTask[];
  weekly_tasks: PDFTask[];
  monthly_tasks: PDFTask[];
  // Founder tasks - things delegation frees them up for
  daily_founder_tasks?: PDFTask[];
  weekly_founder_tasks?: PDFTask[];
  monthly_founder_tasks?: PDFTask[];
}

// =============================================================================
// COMPONENT RENDERERS
// =============================================================================

/**
 * Report Header - Brand and title
 */
export function renderHeader(doc: jsPDF, y: number): number {
  // Website URL at top right
  setColor(doc, COLORS.inkMuted, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('www.assistantlaunch.com', PAGE_WIDTH - MARGIN, y, { align: 'right' });

  // Brand name
  setColor(doc, COLORS.accent, 'text');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSISTANT LAUNCH', MARGIN, y);

  // Accent line
  setColor(doc, COLORS.accent, 'draw');
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 3, MARGIN + 30, y + 3);

  // Title
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Time Freedom Report', MARGIN, y + 18);

  return y + 30;
}

/**
 * Client Block - Name and date
 */
export function renderClientBlock(doc: jsPDF, name: string, date: string, y: number): number {
  // "Prepared for" label
  setColor(doc, COLORS.inkMuted, 'text');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Prepared for', MARGIN, y);

  // Client name
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(name, MARGIN, y + 8);

  // Date
  setColor(doc, COLORS.inkMuted, 'text');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(date, MARGIN, y + 15);

  return y + 25;
}

/**
 * Hero Metric - Large primary value
 */
export function renderHeroMetric(doc: jsPDF, value: string, label: string, y: number): number {
  // Large value
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(56);
  doc.setFont('helvetica', 'bold');
  doc.text(value, MARGIN, y + 20);

  // Label below
  setColor(doc, COLORS.inkSecondary, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(label, MARGIN, y + 28);

  return y + 40;
}

/**
 * Metrics Row - Three boxes side by side
 */
export function renderMetricsRow(
  doc: jsPDF,
  metrics: Array<{ value: string; label: string }>,
  y: number
): number {
  const boxWidth = (CONTENT_WIDTH - 16) / 3; // 3 boxes with 8mm gaps
  const boxHeight = 28;

  metrics.forEach((metric, index) => {
    const x = MARGIN + index * (boxWidth + 8);

    // Box background
    setColor(doc, COLORS.accentLight, 'fill');
    roundedRect(doc, x, y, boxWidth, boxHeight, 3, 'F');

    // Value (centered)
    setColor(doc, COLORS.ink, 'text');
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + boxWidth / 2, y + 12, { align: 'center' });

    // Label (centered)
    setColor(doc, COLORS.inkSecondary, 'text');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, x + boxWidth / 2, y + 20, { align: 'center' });
  });

  return y + boxHeight + 10;
}

/**
 * Analysis Block - Text with left accent bar
 */
export function renderAnalysisBlock(
  doc: jsPDF,
  title: string,
  text: string,
  y: number
): number {
  const lines = wrapText(text, 90);
  const blockHeight = lines.length * 5.5 + 18;

  // Left accent bar
  setColor(doc, COLORS.accent, 'fill');
  doc.rect(MARGIN, y, 1.5, blockHeight, 'F');

  // Title
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 6, y + 6);

  // Text lines
  setColor(doc, COLORS.inkSecondary, 'text');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let textY = y + 14;
  for (const line of lines) {
    doc.text(line, MARGIN + 6, textY);
    textY += 5.5;
  }

  return y + blockHeight + 8;
}

/**
 * Investment Block - ROI breakdown
 */
export function renderInvestmentBlock(
  doc: jsPDF,
  annualValue: number,
  eaCost: number,
  netReturn: number,
  roiMultiplier: number,
  y: number
): number {
  const blockHeight = 42;

  // Background
  setColor(doc, COLORS.background, 'fill');
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, blockHeight, 3, 'F');

  // Title
  setColor(doc, COLORS.inkMuted, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('THE INVESTMENT', MARGIN + 8, y + 8);

  // Row 1: Annual value unlocked
  let rowY = y + 16;
  setColor(doc, COLORS.inkSecondary, 'text');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Annual value you could unlock by delegating to your EA', MARGIN + 8, rowY);
  setColor(doc, COLORS.ink, 'text');
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(annualValue), MARGIN + CONTENT_WIDTH - 8, rowY, { align: 'right' });

  // Row 2: EA investment
  rowY += 8;
  setColor(doc, COLORS.inkSecondary, 'text');
  doc.setFont('helvetica', 'normal');
  doc.text('EA investment (annual)', MARGIN + 8, rowY);
  setColor(doc, COLORS.ink, 'text');
  doc.setFont('helvetica', 'bold');
  doc.text(`-${formatCurrency(eaCost)}`, MARGIN + CONTENT_WIDTH - 8, rowY, { align: 'right' });

  // Divider line
  setColor(doc, COLORS.divider, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN + 8, rowY + 4, MARGIN + CONTENT_WIDTH - 8, rowY + 4);

  // Row 3: Net return with ROI badge
  rowY += 10;
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Net annual return', MARGIN + 8, rowY);

  // ROI badge
  const badgeWidth = 22;
  const badgeX = MARGIN + CONTENT_WIDTH - 60;
  setColor(doc, COLORS.accent, 'fill');
  roundedRect(doc, badgeX, rowY - 4, badgeWidth, 7, 3, 'F');
  setColor(doc, COLORS.white, 'text');
  doc.setFontSize(8);
  doc.text(`${roiMultiplier}x ROI`, badgeX + badgeWidth / 2, rowY, { align: 'center' });

  // Net return value
  setColor(doc, COLORS.accent, 'text');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(netReturn), MARGIN + CONTENT_WIDTH - 8, rowY, { align: 'right' });

  return y + blockHeight + 10;
}

/**
 * Section Title - For task pages
 */
export function renderSectionTitle(
  doc: jsPDF,
  title: string,
  subtitle: string,
  y: number
): number {
  // Title
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, y);

  // Subtitle
  if (subtitle) {
    setColor(doc, COLORS.inkSecondary, 'text');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, MARGIN, y + 8);
    return y + 18;
  }

  return y + 12;
}

/**
 * Task Card - Individual task with number circle
 * Expanded to show full description text across the page width
 */
export function renderTaskCard(
  doc: jsPDF,
  number: number,
  name: string,
  description: string,
  timeSaved: string,
  y: number
): number {
  // Circle parameters
  const circleRadius = 5;
  const circleX = MARGIN + circleRadius;
  const circleY = y + circleRadius + 2;

  // Number circle - properly centered
  setColor(doc, COLORS.accent, 'fill');
  doc.circle(circleX, circleY, circleRadius, 'F');

  // Number text - vertically centered in circle
  // jsPDF text baseline is at the bottom, so we need to offset by ~1/3 of font size
  setColor(doc, COLORS.white, 'text');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const textYOffset = 1.2; // Adjust for visual centering
  doc.text(String(number), circleX, circleY + textYOffset, { align: 'center' });

  // Task name
  const textX = MARGIN + circleRadius * 2 + 6; // Start after circle with padding
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(name, textX, y + 7);

  // Description - full width, multi-line support
  setColor(doc, COLORS.inkSecondary, 'text');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Calculate available width for description (full page width minus margins and circle)
  const descMaxWidth = CONTENT_WIDTH - (circleRadius * 2 + 6);
  const descLines = doc.splitTextToSize(description, descMaxWidth);

  // Render description lines
  let descY = y + 14;
  for (const line of descLines) {
    doc.text(line, textX, descY);
    descY += 5;
  }

  // Time saved - below description
  setColor(doc, COLORS.inkMuted, 'text');
  doc.setFontSize(9);
  doc.text(`Time saved: ${timeSaved}`, textX, descY + 2);

  // Calculate dynamic card height based on description lines
  const cardHeight = Math.max(35, 20 + descLines.length * 5 + 8);

  // Bottom divider line
  setColor(doc, COLORS.divider, 'draw');
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y + cardHeight, MARGIN + CONTENT_WIDTH, y + cardHeight);

  return y + cardHeight + 6;
}

/**
 * Founder Tasks Section - "Delegating this frees you up to:"
 */
export function renderFounderTasksSection(
  doc: jsPDF,
  tasks: PDFTask[],
  y: number
): number {
  if (!tasks || tasks.length === 0) return y;

  // Section header with accent background
  setColor(doc, COLORS.accentLight, 'fill');
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, 10, 3, 'F');

  setColor(doc, COLORS.accent, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Delegating this frees you up to:', MARGIN + 5, y + 7);

  y += 15;

  // Render each founder task as a simple bullet item
  tasks.forEach((task) => {
    // Bullet point
    setColor(doc, COLORS.accent, 'fill');
    doc.circle(MARGIN + 3, y + 2, 1.5, 'F');

    // Task name
    setColor(doc, COLORS.ink, 'text');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(task.name, MARGIN + 10, y + 4);

    // Description (if provided)
    if (task.description) {
      setColor(doc, COLORS.inkSecondary, 'text');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(task.description, CONTENT_WIDTH - 15);
      doc.text(descLines[0], MARGIN + 10, y + 10);
      y += 16;
    } else {
      y += 10;
    }
  });

  return y + 5;
}

/**
 * CTA Block - Call to action with clickable button
 */
export function renderCTABlock(doc: jsPDF, y: number): number {
  const blockHeight = 45;
  const bookingUrl = 'https://app.iclosed.io/e/assistantlaunch/support';

  // Background
  setColor(doc, COLORS.accentLight, 'fill');
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, blockHeight, 4, 'F');

  // Title
  setColor(doc, COLORS.ink, 'text');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Ready to Get Started?', PAGE_WIDTH / 2, y + 12, { align: 'center' });

  // Button
  const btnWidth = 70;
  const btnHeight = 13;
  const btnX = (PAGE_WIDTH - btnWidth) / 2;
  const btnY = y + 18;
  setColor(doc, COLORS.accent, 'fill');
  roundedRect(doc, btnX, btnY, btnWidth, btnHeight, 6, 'F');
  setColor(doc, COLORS.white, 'text');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Schedule Free Consultation', PAGE_WIDTH / 2, btnY + 8, { align: 'center' });

  // Add clickable link to the button area
  doc.link(btnX, btnY, btnWidth, btnHeight, { url: bookingUrl });

  // URL display (also clickable)
  setColor(doc, COLORS.accent, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const urlText = 'app.iclosed.io/e/assistantlaunch/support';
  doc.text(urlText, PAGE_WIDTH / 2, y + 40, { align: 'center' });

  // Make the URL text clickable too
  const urlWidth = doc.getTextWidth(urlText);
  doc.link((PAGE_WIDTH - urlWidth) / 2, y + 36, urlWidth, 6, { url: bookingUrl });

  return y + blockHeight + 10;
}

/**
 * Footer - Page footer with brand
 */
export function renderFooter(doc: jsPDF): void {
  const y = PAGE_HEIGHT - 15;

  // Divider line
  setColor(doc, COLORS.divider, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);

  // Footer text
  setColor(doc, COLORS.inkMuted, 'text');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Assistant Launch  •  assistantlaunch.com', PAGE_WIDTH / 2, y + 6, { align: 'center' });
}

// =============================================================================
// PAGE BUILDERS
// =============================================================================

/**
 * Build the summary page (page 1)
 */
export function buildSummaryPage(doc: jsPDF, data: PDFReportData): void {
  let y = 20;

  y = renderHeader(doc, y);
  y += 3;
  y = renderClientBlock(doc, data.client_name, data.date, y);
  y += 8;
  y = renderHeroMetric(doc, formatCurrency(data.annual_value), 'Annual value you could unlock by delegating to your EA', y);
  y += 8;
  y = renderMetricsRow(doc, [
    { value: `${data.weekly_hours} hrs`, label: 'Reclaimed Weekly' },
    { value: String(data.total_tasks_ea), label: 'Tasks to Delegate' },
    { value: `${data.roi_multiplier}x`, label: 'Projected ROI of an EA' },
  ], y);
  y += 5;
  y = renderAnalysisBlock(doc, 'Summary Analysis', data.analysis_text, y);
  y += 3;
  renderInvestmentBlock(doc, data.annual_value, data.ea_investment, data.net_return, data.roi_multiplier, y);
}

/**
 * Build a tasks page (EA tasks only)
 */
export function buildTasksPage(
  doc: jsPDF,
  tasks: PDFTask[],
  title: string,
  subtitle: string
): void {
  doc.addPage();
  let y = 20;

  y = renderSectionTitle(doc, title, subtitle, y);
  y += 5;

  tasks.forEach((task, index) => {
    y = renderTaskCard(doc, index + 1, task.name, task.description, task.time_saved, y);
  });
}

/**
 * Build a founder tasks page (what delegation frees them up for)
 */
export function buildFounderTasksPage(
  doc: jsPDF,
  tasks: PDFTask[],
  title: string,
  subtitle: string
): void {
  doc.addPage();
  let y = 20;

  // Golden accent header for founder tasks
  setColor(doc, COLORS.accentLight, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, 50, 'F');

  // Title with accent color
  setColor(doc, COLORS.accent, 'text');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, y + 15);

  // Subtitle
  setColor(doc, COLORS.inkSecondary, 'text');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, MARGIN, y + 25);

  y = 65;

  // Render each founder task with emphasis
  tasks.forEach((task, index) => {
    // Task card with accent border
    setColor(doc, COLORS.accent, 'draw');
    doc.setLineWidth(1);
    roundedRect(doc, MARGIN, y, CONTENT_WIDTH, 45, 4, 'S');

    // Number badge
    setColor(doc, COLORS.accent, 'fill');
    doc.circle(MARGIN + 12, y + 12, 8, 'F');
    setColor(doc, COLORS.white, 'text');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(index + 1), MARGIN + 12, y + 14.5, { align: 'center' });

    // Task name
    setColor(doc, COLORS.ink, 'text');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(task.name, MARGIN + 28, y + 14);

    // Description
    setColor(doc, COLORS.inkSecondary, 'text');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(task.description, CONTENT_WIDTH - 35);
    doc.text(descLines.slice(0, 2), MARGIN + 28, y + 25);

    y += 55;
  });
}

/**
 * Build the CTA page (last page)
 */
export function buildCTAPage(doc: jsPDF): void {
  doc.addPage();
  let y = 20;

  y = renderSectionTitle(doc, 'Next Steps', '', y);
  y += 5;
  y = renderAnalysisBlock(
    doc,
    'Where to Start',
    "Begin with daily tasks like email and calendar management — they'll give you immediate time back while you build trust with your EA. Then expand to weekly and monthly tasks as you develop systems together.",
    y
  );
  y += 15;
  renderCTABlock(doc, y);
}

/**
 * Add footers to all pages
 */
export function addFootersToAllPages(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    renderFooter(doc);
  }
}

// =============================================================================
// MAIN GENERATOR
// =============================================================================

/**
 * Generate the complete Time Freedom Report PDF
 */
export function generateTimeFreedomReport(doc: jsPDF, data: PDFReportData): void {
  // Page 1: Summary
  buildSummaryPage(doc, data);

  // Page 2: Daily EA Tasks
  if (data.daily_tasks.length > 0) {
    buildTasksPage(
      doc,
      data.daily_tasks,
      'Top 5 Daily Tasks to Delegate to Your EA',
      'High-frequency tasks eating your time every single day'
    );
  }

  // Page 3: Daily Founder Tasks (what delegation frees you up for)
  if (data.daily_founder_tasks && data.daily_founder_tasks.length > 0) {
    buildFounderTasksPage(
      doc,
      data.daily_founder_tasks,
      'Delegating Daily Tasks Frees You Up To...',
      'Strategic activities that only YOU can do'
    );
  }

  // Page 4: Weekly EA Tasks
  if (data.weekly_tasks.length > 0) {
    buildTasksPage(
      doc,
      data.weekly_tasks,
      'Top 5 Weekly Tasks to Delegate to Your EA',
      'Recurring tasks that stack up week after week'
    );
  }

  // Page 5: Weekly Founder Tasks
  if (data.weekly_founder_tasks && data.weekly_founder_tasks.length > 0) {
    buildFounderTasksPage(
      doc,
      data.weekly_founder_tasks,
      'Delegating Weekly Tasks Frees You Up To...',
      'High-value work that drives your business forward'
    );
  }

  // Page 6: Monthly EA Tasks
  if (data.monthly_tasks.length > 0) {
    buildTasksPage(
      doc,
      data.monthly_tasks,
      'Top 5 Monthly Tasks to Delegate to Your EA',
      'Administrative work that drains strategic thinking time'
    );
  }

  // Page 7: Monthly Founder Tasks
  if (data.monthly_founder_tasks && data.monthly_founder_tasks.length > 0) {
    buildFounderTasksPage(
      doc,
      data.monthly_founder_tasks,
      'Delegating Monthly Tasks Frees You Up To...',
      'Big-picture initiatives that grow your business'
    );
  }

  // Final Page: CTA
  buildCTAPage(doc);

  // Add footers to all pages
  addFootersToAllPages(doc);
}
