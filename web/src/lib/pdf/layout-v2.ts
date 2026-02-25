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

/** RGB color tuple type for jsPDF direct calls */
type RGB = readonly [number, number, number];

/** Pre-computed RGB color constants — no runtime hex parsing */
export const C = {
  // Core V2 design system
  white:        [255, 255, 255] as const satisfies RGB,
  ink:          [17, 24, 39]    as const satisfies RGB,  // #111827
  inkSecondary: [75, 85, 99]    as const satisfies RGB,  // #4B5563
  inkMuted:     [156, 163, 175] as const satisfies RGB,  // #9CA3AF
  accent:       [13, 115, 119]  as const satisfies RGB,  // #0D7377
  accentLight:  [230, 244, 244] as const satisfies RGB,  // #E6F4F4
  divider:      [229, 231, 235] as const satisfies RGB,  // #E5E7EB
  background:   [249, 250, 251] as const satisfies RGB,  // #F9FAFB

  // Cover page
  coverBg:     [13, 115, 119]   as const satisfies RGB,  // Teal (same as accent)

  // Framework page
  frameworkBg: [17, 24, 39]     as const satisfies RGB,  // Dark ink

  // Core Four area accents (placeholder — confirm with design before Phase 3)
  emailAccent:    [59, 130, 246]  as const satisfies RGB,  // Blue #3B82F6
  calendarAccent: [168, 85, 247]  as const satisfies RGB,  // Purple #A855F7
  personalAccent: [234, 179, 8]   as const satisfies RGB,  // Amber #EAB308
  businessAccent: [34, 197, 94]   as const satisfies RGB,  // Green #22C55E

  // CTA page
  ctaBg:   [13, 115, 119]  as const satisfies RGB,  // Teal
  ctaText: [255, 255, 255] as const satisfies RGB,  // White
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

/**
 * Check if the next content block would overflow the current page.
 * If so, add a new page and return the starting y for the new page.
 *
 * @param doc - jsPDF document instance
 * @param currentY - Current y position on the page (mm)
 * @param contentHeight - Estimated height of the next content block (mm)
 * @param safeBottomY - Maximum y before footer area (default: 270mm, leaving 27mm for footer on A4)
 * @param newPageStartY - Y position to start content on a new page (default: 20mm)
 * @returns The y position to use (either currentY unchanged, or newPageStartY after adding a page)
 */
function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  contentHeight: number,
  safeBottomY: number = 270,
  newPageStartY: number = 20,
): number {
  if (currentY + contentHeight > safeBottomY) {
    doc.addPage();
    return newPageStartY;
  }
  return currentY;
}

// =============================================================================
// DATA TYPES
// =============================================================================

export interface PDFTask {
  name: string;
  description: string;
  time_saved: string;
}

/** Core Four ownership areas for task grouping */
export type CoreFourArea = 'email' | 'calendar' | 'personal' | 'business';

/** Grouped tasks for one Core Four area */
export interface CoreFourTaskGroup {
  area: CoreFourArea;
  title: string;               // Display name: "Email Ownership"
  subtitle: string;            // Short description under header
  accent: readonly [number, number, number];  // C.emailAccent, etc.
  tasks: PDFTask[];
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

  // Cover page context (Phase 2: COVER-01, COVER-02)
  company_name?: string;       // From UnifiedLeadData.businessType
  revenue_range?: string;      // From ROICalculation.revenueRange (e.g., "$500k-$1M")
  ceo_hourly_rate?: number;    // From ROICalculation.ceoHourlyRate (for "$X/hr work" messaging)

  // Core Four grouped tasks (Phase 3) — populated by generator-v2.ts
  core_four_groups?: CoreFourTaskGroup[];
}

/**
 * Classify a task into a Core Four ownership area.
 * Prefers explicit coreTaskType if present (Phase 4 compatibility).
 * Falls back to keyword matching on title + description.
 * Always returns a valid CoreFourArea — defaults to 'business'.
 *
 * Keyword lists sourced from report-validator.ts production functions:
 * hasEmailManagementTask, hasCalendarManagementTask, etc.
 */
export function inferCoreTaskType(task: { title: string; description: string; coreTaskType?: string }): CoreFourArea {
  // Prefer explicit coreTaskType if present (Phase 4 compatibility)
  if (task.coreTaskType) {
    const mapping: Record<string, CoreFourArea> = {
      emailManagement: 'email',
      calendarManagement: 'calendar',
      personalLifeManagement: 'personal',
      businessProcessManagement: 'business',
    };
    if (mapping[task.coreTaskType]) return mapping[task.coreTaskType];
  }

  // Inference fallback: keyword matching on title + description
  const text = `${task.title} ${task.description}`.toLowerCase();

  // Email keywords (from report-validator.ts hasEmailManagementTask)
  if (text.includes('email') || text.includes('inbox') || text.includes('correspondence'))
    return 'email';

  // Calendar keywords (from report-validator.ts hasCalendarManagementTask)
  if (text.includes('calendar') || text.includes('schedule') || text.includes('scheduling') ||
      text.includes('appointment') || text.includes('meeting'))
    return 'calendar';

  // Personal life keywords (from report-validator.ts hasPersonalLifeManagementTask)
  if (text.includes('personal') || text.includes('travel') || text.includes('booking') ||
      text.includes('reservation') || text.includes('vendor') || text.includes('family') ||
      text.includes('errand'))
    return 'personal';

  // Default to business processes (broadest category, catches everything else)
  return 'business';
}

// =============================================================================
// COMPONENT RENDERERS
// =============================================================================

/**
 * Report Header - Brand and title
 */
export function renderHeader(doc: jsPDF, y: number): number {
  // Website URL at top right
  doc.setTextColor(...C.inkMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('www.assistantlaunch.com', PAGE_WIDTH - MARGIN, y, { align: 'right' });

  // Brand name
  doc.setTextColor(...C.accent);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSISTANT LAUNCH', MARGIN, y);

  // Accent line
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 3, MARGIN + 30, y + 3);

  // Title
  doc.setTextColor(...C.ink);
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
  doc.setTextColor(...C.inkMuted);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Prepared for', MARGIN, y);

  // Client name
  doc.setTextColor(...C.ink);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(name, MARGIN, y + 8);

  // Date
  doc.setTextColor(...C.inkMuted);
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
  doc.setTextColor(...C.ink);
  doc.setFontSize(56);
  doc.setFont('helvetica', 'bold');
  doc.text(value, MARGIN, y + 20);

  // Label below
  doc.setTextColor(...C.inkSecondary);
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
    doc.setFillColor(...C.accentLight);
    roundedRect(doc, x, y, boxWidth, boxHeight, 3, 'F');

    // Value (centered)
    doc.setTextColor(...C.ink);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, x + boxWidth / 2, y + 12, { align: 'center' });

    // Label (centered)
    doc.setTextColor(...C.inkSecondary);
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
  doc.setFillColor(...C.accent);
  doc.rect(MARGIN, y, 1.5, blockHeight, 'F');

  // Title
  doc.setTextColor(...C.ink);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 6, y + 6);

  // Text lines
  doc.setTextColor(...C.inkSecondary);
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
  doc.setFillColor(...C.background);
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, blockHeight, 3, 'F');

  // Title
  doc.setTextColor(...C.inkMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('THE INVESTMENT', MARGIN + 8, y + 8);

  // Row 1: Annual value unlocked
  let rowY = y + 16;
  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Annual value you could unlock by delegating to your EA', MARGIN + 8, rowY);
  doc.setTextColor(...C.ink);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(annualValue), MARGIN + CONTENT_WIDTH - 8, rowY, { align: 'right' });

  // Row 2: EA investment
  rowY += 8;
  doc.setTextColor(...C.inkSecondary);
  doc.setFont('helvetica', 'normal');
  doc.text('EA investment (annual)', MARGIN + 8, rowY);
  doc.setTextColor(...C.ink);
  doc.setFont('helvetica', 'bold');
  doc.text(`-${formatCurrency(eaCost)}`, MARGIN + CONTENT_WIDTH - 8, rowY, { align: 'right' });

  // Divider line
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.line(MARGIN + 8, rowY + 4, MARGIN + CONTENT_WIDTH - 8, rowY + 4);

  // Row 3: Net return with ROI badge
  rowY += 10;
  doc.setTextColor(...C.ink);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Net annual return', MARGIN + 8, rowY);

  // ROI badge
  const badgeWidth = 22;
  const badgeX = MARGIN + CONTENT_WIDTH - 60;
  doc.setFillColor(...C.accent);
  roundedRect(doc, badgeX, rowY - 4, badgeWidth, 7, 3, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.text(`${roiMultiplier}x ROI`, badgeX + badgeWidth / 2, rowY, { align: 'center' });

  // Net return value
  doc.setTextColor(...C.accent);
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
  doc.setTextColor(...C.ink);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, y);

  // Subtitle
  if (subtitle) {
    doc.setTextColor(...C.inkSecondary);
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
  doc.setFillColor(...C.accent);
  doc.circle(circleX, circleY, circleRadius, 'F');

  // Number text - vertically centered in circle
  // jsPDF text baseline is at the bottom, so we need to offset by ~1/3 of font size
  doc.setTextColor(...C.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const textYOffset = 1.2; // Adjust for visual centering
  doc.text(String(number), circleX, circleY + textYOffset, { align: 'center' });

  // Task name
  const textX = MARGIN + circleRadius * 2 + 6; // Start after circle with padding
  doc.setTextColor(...C.ink);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(name, textX, y + 7);

  // Description - full width, multi-line support
  doc.setTextColor(...C.inkSecondary);
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
  doc.setTextColor(...C.inkMuted);
  doc.setFontSize(9);
  doc.text(`Time saved: ${timeSaved}`, textX, descY + 2);

  // Calculate dynamic card height based on description lines
  const cardHeight = Math.max(35, 20 + descLines.length * 5 + 8);

  // Bottom divider line
  doc.setDrawColor(...C.divider);
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
  doc.setFillColor(...C.accentLight);
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, 10, 3, 'F');

  doc.setTextColor(...C.accent);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Delegating this frees you up to:', MARGIN + 5, y + 7);

  y += 15;

  // Render each founder task as a simple bullet item
  tasks.forEach((task) => {
    // Each bullet item is ~16mm with description, ~10mm without
    const itemHeight = task.description ? 16 : 10;
    y = checkPageBreak(doc, y, itemHeight);

    // Bullet point
    doc.setFillColor(...C.accent);
    doc.circle(MARGIN + 3, y + 2, 1.5, 'F');

    // Task name
    doc.setTextColor(...C.ink);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(task.name, MARGIN + 10, y + 4);

    // Description (if provided)
    if (task.description) {
      doc.setTextColor(...C.inkSecondary);
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
 * Builds iClosed booking URL with pre-filled user data
 */
function buildBookingUrl(userData?: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}): string {
  const baseUrl = 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';
  if (!userData) return baseUrl;

  const params = new URLSearchParams();
  const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');

  if (fullName) params.set('iclosedName', fullName);
  if (userData.email) params.set('iclosedEmail', userData.email);

  // Format phone for iClosed - strip +1 prefix if present
  if (userData.phone) {
    const phoneDigits = userData.phone.replace(/\D/g, '');
    const formattedPhone = phoneDigits.startsWith('1') && phoneDigits.length === 11
      ? phoneDigits.slice(1)
      : phoneDigits;
    params.set('iclosedPhone', formattedPhone);
  }

  params.set('timeFormat', '12h');
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}

export interface CTAUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * CTA Block - Call to action with clickable button
 */
export function renderCTABlock(doc: jsPDF, y: number, userData?: CTAUserData): number {
  const blockHeight = 45;
  const bookingUrl = buildBookingUrl(userData);

  // Background
  doc.setFillColor(...C.accentLight);
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, blockHeight, 4, 'F');

  // Title
  doc.setTextColor(...C.ink);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Ready to Get Started?', PAGE_WIDTH / 2, y + 12, { align: 'center' });

  // Button
  const btnWidth = 70;
  const btnHeight = 13;
  const btnX = (PAGE_WIDTH - btnWidth) / 2;
  const btnY = y + 18;
  doc.setFillColor(...C.accent);
  roundedRect(doc, btnX, btnY, btnWidth, btnHeight, 6, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Schedule Free Consultation', PAGE_WIDTH / 2, btnY + 8, { align: 'center' });

  // Add clickable link to the button area
  doc.link(btnX, btnY, btnWidth, btnHeight, { url: bookingUrl });

  // URL display (also clickable) - show simple URL, actual link includes prefilled data
  doc.setTextColor(...C.accent);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const urlText = 'assistantlaunch.com/book';
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
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);

  // Footer text
  doc.setTextColor(...C.inkMuted);
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

  // Company context line (COVER-01)
  if (data.company_name) {
    doc.setTextColor(...C.inkSecondary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(data.company_name, MARGIN, y + 2);
    y += 7;
  }

  y += 8;
  y = renderHeroMetric(doc, formatCurrency(data.annual_value), 'Annual value you could unlock by delegating to your EA', y);
  y += 8;
  y = renderMetricsRow(doc, [
    { value: `${data.weekly_hours} hrs`, label: 'Reclaimed Weekly' },
    { value: String(data.total_tasks_ea), label: 'Tasks to Delegate' },
    { value: `${data.roi_multiplier}x`, label: 'Projected ROI of an EA' },
  ], y);
  y += 5;

  // ROI pain point messaging (COVER-02)
  if (data.ceo_hourly_rate) {
    const painText = `At your revenue level, your time is worth $${data.ceo_hourly_rate}/hr. Every hour spent on $15/hr tasks costs your business the difference.`;
    doc.setTextColor(...C.accent);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const painLines = doc.splitTextToSize(painText, CONTENT_WIDTH);
    doc.text(painLines, MARGIN, y + 3);
    y += painLines.length * 5 + 5;
  }

  y = renderAnalysisBlock(doc, 'Summary Analysis', data.analysis_text, y);
  y += 3;
  renderInvestmentBlock(doc, data.annual_value, data.ea_investment, data.net_return, data.roi_multiplier, y);
}

/**
 * Build the framework page (page 2) — Three Pillars + Core Four
 * All content is static / hardcoded (FRAME-04 requirement)
 */
function buildFrameworkPage(doc: jsPDF): void {
  doc.addPage();
  let y = 20;

  // --- Static content constants ---
  const THREE_PILLARS = [
    {
      title: 'Right Person',
      description: 'Your EA must be trained in proven delegation frameworks, not just task execution. We place assistants skilled in email management, calendar optimization, personal life coordination, and business process ownership — so they can think ahead, not just follow instructions.',
    },
    {
      title: 'Right Process & Systems',
      description: 'Even a talented assistant will fail without the right systems. Our EAs deploy the Email GPS framework, calendar energy management, and documented playbooks for every recurring task — turning chaos into repeatable workflows.',
    },
    {
      title: 'Right Support',
      description: 'Delegation is not "set it and forget it." Assistant Launch provides active daily oversight, communication rhythm tracking, and ongoing integration support — so your EA relationship improves every week, not just the first.',
    },
  ] as const;

  const CORE_FOUR = [
    {
      title: 'Email Ownership',
      description: 'Your assistant triages everything using the Email GPS system — 7 folders, zero inbox for you. You review only what matters during a quick daily standup.',
      accent: C.emailAccent,
    },
    {
      title: 'Calendar Ownership',
      description: 'Your assistant manages energy, not just time. They schedule two weeks ahead, protect your highest-value hours, and ensure your calendar reflects your priorities.',
      accent: C.calendarAccent,
    },
    {
      title: 'Personal Life Ownership',
      description: 'Hotels, flights, Amazon returns, family logistics — all handled. Enabled by the Partnership Playbook, a detailed document that captures your preferences and routines.',
      accent: C.personalAccent,
    },
    {
      title: 'Recurring Business Processes',
      description: 'Every repetitive task becomes a one-page playbook using the camcorder method: record yourself doing it once, and your assistant owns it forever.',
      accent: C.businessAccent,
    },
  ] as const;

  // --- Section 1: Three Pillars ---
  doc.setTextColor(...C.ink);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('The Three Pillars of Successful Delegation', MARGIN, y);
  y += 10;

  THREE_PILLARS.forEach((pillar, index) => {
    // Number circle
    doc.setFillColor(...C.accent);
    doc.circle(MARGIN + 5, y + 5, 5, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(String(index + 1), MARGIN + 5, y + 6.2, { align: 'center' });

    // Title
    doc.setTextColor(...C.ink);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(pillar.title, MARGIN + 16, y + 7);

    // Description (wrapped using splitTextToSize for accurate measurement)
    doc.setTextColor(...C.inkSecondary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(pillar.description, CONTENT_WIDTH - 16);
    let lineY = y + 14;
    for (const line of lines) {
      doc.text(line, MARGIN + 16, lineY);
      lineY += 4.5;
    }

    // Advance y: minimum 25mm per item, or actual content height + padding
    y += Math.max(25, 14 + lines.length * 4.5 + 6);
  });

  // --- Divider ---
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 8;

  // --- Section 2: Core Four ---
  doc.setTextColor(...C.ink);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('The Core Four Ownership Areas', MARGIN, y);
  y += 10;

  CORE_FOUR.forEach((area) => {
    const boxHeight = 25;

    // Left accent bar
    const accentColor: [number, number, number] = [...area.accent];
    doc.setFillColor(...accentColor);
    doc.rect(MARGIN, y, 2, boxHeight, 'F');

    // Background box
    doc.setFillColor(...C.background);
    roundedRect(doc, MARGIN + 3, y, CONTENT_WIDTH - 3, boxHeight, 2, 'F');

    // Title
    doc.setTextColor(...C.ink);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(area.title, MARGIN + 8, y + 8);

    // Description (wrapped, max 2 lines to stay within box)
    doc.setTextColor(...C.inkSecondary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(area.description, CONTENT_WIDTH - 12);
    doc.text(lines.slice(0, 2), MARGIN + 8, y + 15);

    y += boxHeight + 4;
  });
}

/**
 * Build a tasks page (EA tasks only)
 */
export function buildTasksPage(
  doc: jsPDF,
  tasks: PDFTask[],
  title: string,
  subtitle: string,
  userData?: CTAUserData
): void {
  doc.addPage();
  let y = 20;

  y = renderSectionTitle(doc, title, subtitle, y);
  y += 5;

  tasks.forEach((task, index) => {
    // Estimate card height before rendering: measure description lines + padding
    const descLines = doc.splitTextToSize(task.description || '', CONTENT_WIDTH - 30);
    const estimatedCardHeight = Math.max(35, 20 + descLines.length * 5 + 8);
    y = checkPageBreak(doc, y, estimatedCardHeight);
    y = renderTaskCard(doc, index + 1, task.name, task.description, task.time_saved, y);
  });

  // Add CTA button at the end of each section (new page if needed)
  if (userData) {
    y = checkPageBreak(doc, y + 5, 55);
    renderCTABlock(doc, y, userData);
  }
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
  doc.setFillColor(...C.accentLight);
  doc.rect(0, 0, PAGE_WIDTH, 50, 'F');

  // Title with accent color
  doc.setTextColor(...C.accent);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, y + 15);

  // Subtitle
  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, MARGIN, y + 25);

  y = 65;

  // Render each founder task with emphasis
  tasks.forEach((task, index) => {
    // Each founder task card is 45mm tall + 10mm spacing = 55mm total
    y = checkPageBreak(doc, y, 55);

    // Task card with accent border
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(1);
    roundedRect(doc, MARGIN, y, CONTENT_WIDTH, 45, 4, 'S');

    // Number badge
    doc.setFillColor(...C.accent);
    doc.circle(MARGIN + 12, y + 12, 8, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(String(index + 1), MARGIN + 12, y + 14.5, { align: 'center' });

    // Task name
    doc.setTextColor(...C.ink);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(task.name, MARGIN + 28, y + 14);

    // Description
    doc.setTextColor(...C.inkSecondary);
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
export function buildCTAPage(doc: jsPDF, userData?: CTAUserData): void {
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
  renderCTABlock(doc, y, userData);
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
export function generateTimeFreedomReport(doc: jsPDF, data: PDFReportData, userData?: CTAUserData): void {
  // Page 1: Cover + ROI
  buildSummaryPage(doc, data);

  // Page 2: Three Pillars + Core Four Framework
  buildFrameworkPage(doc);

  // Page 3+: Daily EA Tasks
  if (data.daily_tasks.length > 0) {
    buildTasksPage(
      doc,
      data.daily_tasks,
      'Top 5 Daily Tasks to Delegate to Your EA',
      'High-frequency tasks eating your time every single day',
      userData
    );
  }

  // Daily Founder Tasks (what delegation frees you up for)
  if (data.daily_founder_tasks && data.daily_founder_tasks.length > 0) {
    buildFounderTasksPage(
      doc,
      data.daily_founder_tasks,
      'Delegating Daily Tasks Frees You Up To...',
      'Strategic activities that only YOU can do'
    );
  }

  // Weekly EA Tasks
  if (data.weekly_tasks.length > 0) {
    buildTasksPage(
      doc,
      data.weekly_tasks,
      'Top 5 Weekly Tasks to Delegate to Your EA',
      'Recurring tasks that stack up week after week',
      userData
    );
  }

  // Weekly Founder Tasks
  if (data.weekly_founder_tasks && data.weekly_founder_tasks.length > 0) {
    buildFounderTasksPage(
      doc,
      data.weekly_founder_tasks,
      'Delegating Weekly Tasks Frees You Up To...',
      'High-value work that drives your business forward'
    );
  }

  // Monthly EA Tasks
  if (data.monthly_tasks.length > 0) {
    buildTasksPage(
      doc,
      data.monthly_tasks,
      'Top 5 Monthly Tasks to Delegate to Your EA',
      'Administrative work that drains strategic thinking time',
      userData
    );
  }

  // Monthly Founder Tasks
  if (data.monthly_founder_tasks && data.monthly_founder_tasks.length > 0) {
    buildFounderTasksPage(
      doc,
      data.monthly_founder_tasks,
      'Delegating Monthly Tasks Frees You Up To...',
      'Big-picture initiatives that grow your business'
    );
  }

  // Final Page: CTA
  buildCTAPage(doc, userData);

  // Add footers to all pages
  addFootersToAllPages(doc);
}
