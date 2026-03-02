/**
 * PDF Layout V2 — Navy/Orange Premium Theme
 *
 * Design System:
 * - Navy (#0F172A) — primary dark, cover/close bg, headings
 * - Orange (#EA580C) — CTA buttons, accent highlights
 * - DM Serif Display — display/heading font
 * - DM Sans — body/caption font
 * - 5-level type scale, 4mm spacing grid
 */

import type { jsPDF } from 'jspdf';

// =============================================================================
// DESIGN TOKENS
// =============================================================================

/** RGB color tuple type for jsPDF direct calls */
type RGB = readonly [number, number, number];

/** Navy/Orange premium color palette */
export const C = {
  // Core palette
  white:          [255, 255, 255] as const satisfies RGB,  // #FFFFFF
  whiteSecondary: [200, 210, 225] as const satisfies RGB,  // Slightly muted white for body on navy
  navy:           [15, 23, 42]    as const satisfies RGB,  // #0F172A — primary dark / cover bg / close bg
  navyMid:        [30, 41, 59]    as const satisfies RGB,  // #1E293B — card backgrounds on dark pages
  ink:            [15, 23, 42]    as const satisfies RGB,  // #0F172A — headings on white
  inkSecondary:   [71, 85, 105]   as const satisfies RGB,  // #475569 — body text
  inkMuted:       [148, 163, 184] as const satisfies RGB,  // #94A3B8 — captions, labels
  orange:         [234, 88, 12]   as const satisfies RGB,  // #EA580C — CTA buttons, accent highlights
  divider:        [226, 232, 240] as const satisfies RGB,  // #E2E8F0 — lines, borders
  warmGray:       [241, 245, 249] as const satisfies RGB,  // #F1F5F9 — card backgrounds on white pages

  // CTA
  ctaBg:        [234, 88, 12]   as const satisfies RGB,  // Orange
  ctaText:      [255, 255, 255] as const satisfies RGB,  // White on orange

  // Core Four accents (single navy-based, differentiated by section spacing not color)
  sectionAccent: [15, 23, 42]   as const satisfies RGB,  // Navy for all section headers

  // Financial
  costNeutral:  [71, 85, 105]   as const satisfies RGB,  // Gray for investment line (NO red)
} as const;

// Layout constants (in mm for jsPDF)
const PAGE_WIDTH = 210;  // A4 width
const PAGE_HEIGHT = 297; // A4 height
const MARGIN = 24;       // Wider margins for premium feel
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN; // 162mm

// Spacing grid (4mm base unit)
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

// =============================================================================
// TYPOGRAPHY HELPERS
// =============================================================================

/** Set DM Serif Display — display/heading font */
function setSerif(doc: jsPDF, size: number): void {
  doc.setFont('DMSerifDisplay', 'normal');
  doc.setFontSize(size);
}

/** Set DM Sans Regular — body/caption font */
function setSans(doc: jsPDF, size: number): void {
  doc.setFont('DMSans', 'normal');
  doc.setFontSize(size);
}

/** Set DM Sans Bold — emphasis, labels */
function setSansBold(doc: jsPDF, size: number): void {
  doc.setFont('DMSans', 'bold');
  doc.setFontSize(size);
}

// Type scale constants
const TYPE = {
  display:  36,    // Hero dollar amount, cover title
  stat:     26,    // Key metrics on analysis page
  h1:       20,    // Section titles
  h2:       13,    // Subsection titles, card headers
  taskName: 12,    // Task row names (compact roadmap)
  body:     10.5,  // All body text, descriptions
  caption:  8.5,   // Labels, footnotes, footer
} as const;

// Named layout constants (extracted from magic numbers)
const COVER_TITLE_Y = 85;           // Vertical center for cover title (~1/3 from top)
const COVER_CTA_BOTTOM_OFFSET = 55; // CTA distance from page bottom on cover
const METRICS_BLOCK_HEIGHT = 26;    // Height of the 3-metric row on analysis page
const BTN_HEIGHT = 14;              // CTA button height

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
 */
function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  contentHeight: number,
  safeBottomY: number = 275,
  newPageStartY: number = MARGIN,
): number {
  if (currentY + contentHeight > safeBottomY) {
    doc.addPage();
    return newPageStartY;
  }
  return currentY;
}

/**
 * Parse a time_saved string (e.g. "2+ hrs/day", "45 min/week") into weekly hours.
 */
function parseTimeSavedToWeeklyHours(timeSaved: string): number {
  const lower = timeSaved.toLowerCase().replace('+', '').trim();
  const numMatch = lower.match(/([\d.]+)/);
  if (!numMatch) return 0;
  let value = parseFloat(numMatch[1]);

  if (lower.includes('min')) {
    value = value / 60;
  }

  if (lower.includes('/day') || lower.includes('day')) {
    value = value * 5;
  } else if (lower.includes('/month') || lower.includes('month')) {
    value = value / 4;
  }

  return value;
}

/**
 * Sum total weekly hours for a group of tasks.
 */
function sumWeeklyHours(tasks: PDFTask[]): number {
  return tasks.reduce((sum, t) => sum + parseTimeSavedToWeeklyHours(t.time_saved), 0);
}

/**
 * Builds booking page URL with pre-filled user data.
 */
function buildBookingUrl(userData?: CTAUserData): string {
  const baseUrl = 'https://assistantlaunch.com/book-call';
  if (!userData) return baseUrl;

  const params = new URLSearchParams();
  if (userData.firstName) params.set('firstName', userData.firstName);
  if (userData.lastName) params.set('lastName', userData.lastName);
  if (userData.email) params.set('email', userData.email);
  if (userData.phone) params.set('phone', userData.phone);

  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
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
  title: string;
  subtitle: string;
  accent: readonly [number, number, number];
  tasks: PDFTask[];
}

/** Testimonial data */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  revenue: string;
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
  daily_founder_tasks?: PDFTask[];
  weekly_founder_tasks?: PDFTask[];
  monthly_founder_tasks?: PDFTask[];

  // Cover page context
  company_name?: string;
  revenue_range?: string;
  ceo_hourly_rate?: number;

  // Core Four grouped tasks
  core_four_groups?: CoreFourTaskGroup[];

  // Testimonials
  testimonials?: Testimonial[];
}

export interface CTAUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * Classify a task into a Core Four ownership area.
 */
export function inferCoreTaskType(task: { title: string; description: string; coreTaskType?: string }): CoreFourArea {
  if (task.coreTaskType) {
    const mapping: Record<string, CoreFourArea> = {
      emailManagement: 'email',
      calendarManagement: 'calendar',
      personalLifeManagement: 'personal',
      businessProcessManagement: 'business',
    };
    if (mapping[task.coreTaskType]) return mapping[task.coreTaskType];
  }

  const text = `${task.title} ${task.description}`.toLowerCase();

  if (text.includes('email') || text.includes('inbox') || text.includes('correspondence'))
    return 'email';

  if (text.includes('calendar') || text.includes('schedule') || text.includes('scheduling') ||
      text.includes('appointment') || text.includes('meeting'))
    return 'calendar';

  if (text.includes('personal') || text.includes('travel') || text.includes('booking') ||
      text.includes('reservation') || text.includes('vendor') || text.includes('family') ||
      text.includes('errand'))
    return 'personal';

  return 'business';
}

// FALLBACK_TASKS moved to web/src/lib/ai/fallback-tasks.ts (revenue-tier segmented)

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

/**
 * Draw the thin navy bar at the top of white pages (3mm tall, full page width).
 */
function drawNavyTopBar(doc: jsPDF): void {
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PAGE_WIDTH, 3, 'F');
}

/**
 * Render the CTA button — "Book a Discovery Call" — used on every page.
 * Returns y position after the button block.
 */
function renderCTAButton(
  doc: jsPDF,
  y: number,
  userData?: CTAUserData,
  opts?: { onDark?: boolean; width?: number }
): number {
  const bookingUrl = buildBookingUrl(userData);
  const btnWidth = opts?.width ?? 120;
  const btnHeight = BTN_HEIGHT;
  const btnX = (PAGE_WIDTH - btnWidth) / 2;
  const onDark = opts?.onDark ?? false;

  // Button background
  doc.setFillColor(...C.ctaBg);
  roundedRect(doc, btnX, y, btnWidth, btnHeight, 5, 'F');

  // Button text
  doc.setTextColor(...C.ctaText);
  setSansBold(doc, 12);
  doc.text('Book a Discovery Call', PAGE_WIDTH / 2, y + btnHeight / 2 + 1, { align: 'center' });

  // Clickable link
  doc.link(btnX, y, btnWidth, btnHeight, { url: bookingUrl });

  // URL display below button
  const urlY = y + btnHeight + SP.xs + 1;
  doc.setTextColor(...C.orange);
  setSans(doc, TYPE.caption);
  const urlText = 'assistantlaunch.com/book-call';
  doc.text(urlText, PAGE_WIDTH / 2, urlY, { align: 'center' });
  const urlWidth = doc.getTextWidth(urlText);
  doc.link((PAGE_WIDTH - urlWidth) / 2, urlY - 3, urlWidth, 5, { url: bookingUrl });

  return urlY + SP.sm;
}

/**
 * Render a testimonial card.
 * Returns y position after the card.
 */
function renderTestimonialCard(
  doc: jsPDF,
  testimonial: Testimonial,
  y: number,
  opts?: { onDark?: boolean }
): number {
  const onDark = opts?.onDark ?? false;
  const cardPadding = SP.md;
  const cardX = MARGIN;
  const cardWidth = CONTENT_WIDTH;

  // Wrap quote text to measure height
  setSans(doc, TYPE.body);
  const quoteLines = doc.splitTextToSize(`"${testimonial.quote}"`, cardWidth - cardPadding * 2 - 4);
  const quoteHeight = quoteLines.length * (TYPE.body * 0.45);
  const cardHeight = cardPadding + quoteHeight + SP.sm + TYPE.caption * 0.4 + cardPadding;

  // Card background
  if (onDark) {
    doc.setFillColor(...C.navyMid);
  } else {
    doc.setFillColor(...C.warmGray);
  }
  roundedRect(doc, cardX, y, cardWidth, cardHeight, 3, 'F');

  // Orange left border accent (rounded to match card corners)
  doc.setFillColor(...C.orange);
  roundedRect(doc, cardX, y + 2, 2.5, cardHeight - 4, 1.5, 'F');

  // Quote text
  const quoteColor: RGB = onDark ? C.white : C.inkSecondary;
  doc.setTextColor(...quoteColor);
  setSans(doc, TYPE.body);
  let textY = y + cardPadding;
  for (const line of quoteLines) {
    doc.text(line, cardX + cardPadding + 4, textY);
    textY += TYPE.body * 0.45;
  }

  // Attribution
  textY += SP.xs;
  doc.setTextColor(...C.inkMuted);
  setSans(doc, TYPE.caption);
  doc.text(`\u2014 ${testimonial.name}, ${testimonial.role}, ${testimonial.revenue}`, cardX + cardPadding + 4, textY);

  return y + cardHeight + SP.sm;
}

// =============================================================================
// PAGE 1: COVER
// =============================================================================

/**
 * Build the Cover page — navy background, hero dollar figure, CTA.
 */
function buildCoverPage(doc: jsPDF, data: PDFReportData, userData?: CTAUserData): void {
  // Full-page navy background
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  let y = MARGIN + SP.sm;

  // Wordmark top-left
  doc.setTextColor(...C.white);
  setSans(doc, TYPE.caption);
  doc.text('ASSISTANT LAUNCH', MARGIN, y, { charSpace: 1.5 });

  // Thin orange accent line below wordmark
  y += SP.xs;
  doc.setFillColor(...C.orange);
  doc.rect(MARGIN, y, 40, 1.5, 'F');

  // "TIME FREEDOM REPORT" — centered vertically (roughly 1/3 from top)
  y = COVER_TITLE_Y;
  doc.setTextColor(...C.white);
  setSerif(doc, TYPE.h1);
  doc.text('TIME FREEDOM REPORT', PAGE_WIDTH / 2, y, { align: 'center' });

  // Client name
  y += SP.lg;
  doc.setTextColor(...C.inkMuted);
  setSans(doc, TYPE.h2);
  doc.text(`Prepared for ${data.client_name}`, PAGE_WIDTH / 2, y, { align: 'center' });

  // Business type + date
  y += SP.sm;
  setSans(doc, TYPE.caption);
  const metaText = data.company_name
    ? `${data.company_name}  \u2022  ${data.date}`
    : data.date;
  doc.text(metaText, PAGE_WIDTH / 2, y, { align: 'center' });

  // Pain-anchor line
  y += SP.xl;
  doc.setTextColor(...C.orange);
  setSans(doc, TYPE.body);
  const painText = `You're spending ${data.weekly_hours} hours every week on work that isn't moving your business forward.`;
  const painLines = doc.splitTextToSize(painText, CONTENT_WIDTH - SP.xl * 2);
  for (const line of painLines) {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += TYPE.body * 0.5;
  }

  // Hero dollar figure
  y += SP.lg;
  doc.setTextColor(...C.orange);
  setSerif(doc, TYPE.display);
  doc.text(formatCurrency(data.annual_value), PAGE_WIDTH / 2, y, { align: 'center' });

  // Label below hero figure
  y += SP.md;
  doc.setTextColor(...C.inkMuted);
  setSans(doc, TYPE.caption);
  doc.text('in annual value you could unlock', PAGE_WIDTH / 2, y, { align: 'center' });

  // CTA at bottom
  renderCTAButton(doc, PAGE_HEIGHT - COVER_CTA_BOTTOM_OFFSET, userData, { onDark: true });

  // Page number
  doc.setTextColor(148, 163, 184); // muted white
  setSans(doc, TYPE.caption);
  // Page number will be set later by addFootersToAllPages
}

// =============================================================================
// PAGE 2: ROI ANALYSIS
// =============================================================================

/**
 * Build the Analysis page — white background, financial breakdown.
 */
function buildAnalysisPage(doc: jsPDF, data: PDFReportData, userData?: CTAUserData): void {
  doc.addPage();

  // Navy top bar
  drawNavyTopBar(doc);

  let y = 3 + SP.lg;

  // Section title
  doc.setTextColor(...C.ink);
  setSerif(doc, TYPE.h1);
  doc.text('Your Time & Money Analysis', MARGIN, y);

  // Analysis paragraph
  y += SP.md;
  doc.setTextColor(...C.inkSecondary);
  setSans(doc, TYPE.body);
  const analysisLines = doc.splitTextToSize(data.analysis_text, CONTENT_WIDTH);
  for (const line of analysisLines) {
    doc.text(line, MARGIN, y);
    y += TYPE.body * 0.45;
  }

  y += SP.md;

  // Compute total task count
  const displayedTaskCount = data.core_four_groups
    ? data.core_four_groups.reduce((sum, g) => sum + g.tasks.length, 0)
    : data.total_tasks_ea;

  // 3 key metrics — clean horizontal row (large numbers + labels)
  const metrics = [
    { value: `${data.weekly_hours}`, label: 'hrs/week delegatable' },
    { value: `${displayedTaskCount}`, label: 'tasks your EA would own' },
    { value: `${data.roi_multiplier}x`, label: 'ROI' },
  ];

  const metricWidth = CONTENT_WIDTH / 3;
  metrics.forEach((metric, i) => {
    const mx = MARGIN + i * metricWidth + metricWidth / 2;

    // Large number
    doc.setTextColor(...C.ink);
    setSerif(doc, TYPE.stat);
    doc.text(metric.value, mx, y + 10, { align: 'center' });

    // Label
    doc.setTextColor(...C.inkSecondary);
    setSans(doc, TYPE.caption);
    doc.text(metric.label, mx, y + 17, { align: 'center' });
  });

  y += METRICS_BLOCK_HEIGHT;

  // Divider
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += SP.md;

  // Investment comparison block
  doc.setTextColor(...C.inkMuted);
  setSans(doc, TYPE.caption);
  doc.text('THE INVESTMENT', MARGIN, y);
  y += SP.sm;

  // Row 1: Full-time admin comparison (anchor)
  doc.setTextColor(...C.inkSecondary);
  setSans(doc, TYPE.body);
  doc.text('Full-time executive admin', MARGIN, y);
  doc.setTextColor(...C.costNeutral);
  setSansBold(doc, TYPE.body);
  doc.text('~$7,500/month ($90,000/year)', MARGIN + CONTENT_WIDTH, y, { align: 'right' });

  // Row 2: Your EA investment
  y += SP.sm;
  doc.setTextColor(...C.inkSecondary);
  setSans(doc, TYPE.body);
  doc.text('Your EA investment', MARGIN, y);
  doc.setTextColor(...C.ink);
  setSansBold(doc, TYPE.body);
  doc.text('$2,750/month', MARGIN + CONTENT_WIDTH, y, { align: 'right' });

  // Row 3: You save
  y += SP.sm;
  doc.setTextColor(...C.inkSecondary);
  setSans(doc, TYPE.body);
  doc.text('You save', MARGIN, y);
  doc.setTextColor(...C.orange);
  setSansBold(doc, TYPE.body);
  doc.text('~$4,750/month with dedicated, trained support', MARGIN + CONTENT_WIDTH, y, { align: 'right' });

  // Thin divider
  y += SP.xs + 1;
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);

  // Row 4: Annual value unlocked (ROI)
  y += SP.sm;
  doc.setTextColor(...C.ink);
  setSansBold(doc, TYPE.h2);
  doc.text('Annual value unlocked', MARGIN, y);

  const netText = formatCurrency(data.annual_value);
  doc.setTextColor(...C.orange);
  setSansBold(doc, TYPE.h2);
  const roiLabel = `${netText}  (${data.roi_multiplier}x return)`;
  doc.text(roiLabel, MARGIN + CONTENT_WIDTH, y, { align: 'right' });

  y += SP.xl;

  // Testimonial block (1 quote)
  if (data.testimonials && data.testimonials.length > 0) {
    y = renderTestimonialCard(doc, data.testimonials[0], y);
  }

  y += SP.xs;

  // CTA (with overflow guard for long analysis text)
  y = checkPageBreak(doc, y, BTN_HEIGHT + SP.xl);
  renderCTAButton(doc, y, userData);
}

// =============================================================================
// PAGE 3+: TASK ROADMAP
// =============================================================================

/**
 * Render one Core Four section header bar.
 */
function renderCoreFourSectionHeader(
  doc: jsPDF,
  group: CoreFourTaskGroup,
  y: number,
): number {
  const headerHeight = 8;

  // Navy background bar
  doc.setFillColor(...C.sectionAccent);
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, headerHeight, 1.5, 'F');

  // Area name (left-aligned, white, bold)
  doc.setTextColor(...C.white);
  setSansBold(doc, TYPE.h2);
  doc.text(group.title, MARGIN + SP.xs, y + 5.5);

  // Task count + hours (right-aligned, white)
  const totalHours = sumWeeklyHours(group.tasks);
  const hoursLabel = totalHours % 1 === 0 ? `${totalHours}` : `${totalHours.toFixed(1)}`;
  setSans(doc, TYPE.caption);
  doc.text(`${group.tasks.length} tasks \u2014 ${hoursLabel} hrs/week`, MARGIN + CONTENT_WIDTH - SP.xs, y + 5.5, { align: 'right' });

  return y + headerHeight + 2;
}

/**
 * Measure the height a task row will need (for page break calculations).
 */
function measureTaskRowHeight(
  doc: jsPDF,
  name: string,
  description: string,
): number {
  const numWidth = 10;
  const timeWidth = 28;
  const nameMaxWidth = CONTENT_WIDTH - numWidth - timeWidth - SP.xs;
  const descMaxWidth = CONTENT_WIDTH - numWidth - SP.xs;
  const titleLH = 4.8;
  const descLH = 3.6;

  setSansBold(doc, TYPE.taskName);
  const nameLines = doc.splitTextToSize(name, nameMaxWidth);

  setSans(doc, TYPE.caption);
  const descLines = doc.splitTextToSize(description, descMaxWidth).slice(0, 3);

  return 3.5 + (nameLines.length * titleLH) + 1.5 + (descLines.length * descLH) + 3;
}

/**
 * Render a task row with full title and wrapped description (dynamic height).
 */
function renderTaskRow(
  doc: jsPDF,
  num: number,
  name: string,
  description: string,
  timeSaved: string,
  y: number,
  isAlt: boolean,
): number {
  const numWidth = 10;
  const timeWidth = 28;
  const nameMaxWidth = CONTENT_WIDTH - numWidth - timeWidth - SP.xs;
  const descMaxWidth = CONTENT_WIDTH - numWidth - SP.xs;
  const titleLH = 4.8;
  const descLH = 3.6;

  // Measure wrapped lines
  setSansBold(doc, TYPE.taskName);
  const nameLines = doc.splitTextToSize(name, nameMaxWidth);

  setSans(doc, TYPE.caption);
  const descLines = doc.splitTextToSize(description, descMaxWidth).slice(0, 3);

  // Calculate row height
  const topPad = 3.5;
  const midGap = 1.5;
  const bottomPad = 3;
  const rowHeight = topPad + (nameLines.length * titleLH) + midGap + (descLines.length * descLH) + bottomPad;

  // Alternating background
  if (isAlt) {
    doc.setFillColor(...C.warmGray);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'F');
  }

  // Task number (orange, aligned with first title line)
  doc.setTextColor(...C.orange);
  setSansBold(doc, TYPE.h2);
  doc.text(String(num), MARGIN + SP.xs, y + topPad + titleLH * 0.75);

  // Task title (navy bold, wrapped)
  doc.setTextColor(...C.ink);
  setSansBold(doc, TYPE.taskName);
  let curY = y + topPad;
  for (const line of nameLines) {
    curY += titleLH;
    doc.text(line, MARGIN + numWidth, curY);
  }

  // Time saved (orange, right-aligned on first title line)
  doc.setTextColor(...C.orange);
  setSans(doc, TYPE.caption);
  doc.text(timeSaved, MARGIN + CONTENT_WIDTH - SP.xs, y + topPad + titleLH, { align: 'right' });

  // Description (muted gray, wrapped)
  curY += midGap;
  doc.setTextColor(...C.inkMuted);
  setSans(doc, TYPE.caption);
  for (const line of descLines) {
    curY += descLH;
    doc.text(line, MARGIN + numWidth, curY);
  }

  return y + rowHeight;
}

/**
 * Render one complete Core Four section (header + task rows).
 */
function renderCoreFourSection(
  doc: jsPDF,
  group: CoreFourTaskGroup,
  startingTaskNumber: number,
  y: number,
): number {
  // Check page break for header + at least first row
  const firstRowH = group.tasks.length > 0
    ? measureTaskRowHeight(doc, group.tasks[0].name, group.tasks[0].description)
    : 20;
  let prevY = y;
  y = checkPageBreak(doc, y, 8 + firstRowH);

  // Detect actual page break (y jumped backward) and draw navy top bar
  if (y < prevY) {
    drawNavyTopBar(doc);
    y = 3 + SP.md;
  }

  y = renderCoreFourSectionHeader(doc, group, y);

  group.tasks.forEach((task, index) => {
    const rowH = measureTaskRowHeight(doc, task.name, task.description);
    prevY = y;
    y = checkPageBreak(doc, y, rowH);
    if (y < prevY) {
      drawNavyTopBar(doc);
      y = 3 + SP.md;
    }
    y = renderTaskRow(doc, startingTaskNumber + index, task.name, task.description, task.time_saved, y, index % 2 === 1);
  });

  return y + SP.sm;
}

/**
 * Build the Task Roadmap page(s).
 */
function buildRoadmapPages(doc: jsPDF, data: PDFReportData, userData?: CTAUserData): void {
  if (!data.core_four_groups || data.core_four_groups.length === 0) return;

  doc.addPage();

  // Navy top bar
  drawNavyTopBar(doc);

  let y = 3 + SP.lg;

  // Total task count
  const totalTasks = data.core_four_groups.reduce((sum, g) => sum + g.tasks.length, 0);

  // Section title
  doc.setTextColor(...C.ink);
  setSerif(doc, TYPE.h1);
  doc.text('Your Personalized EA Task Roadmap', MARGIN, y);

  // Subtitle
  y += SP.sm;
  doc.setTextColor(...C.inkSecondary);
  setSans(doc, TYPE.body);
  doc.text(`${totalTasks} tasks your EA could take off your plate`, MARGIN, y);

  y += SP.md;

  // Render each Core Four section with continuous numbering
  let globalTaskNumber = 1;
  for (const group of data.core_four_groups) {
    y = renderCoreFourSection(doc, group, globalTaskNumber, y);
    globalTaskNumber += group.tasks.length;
  }

}

// =============================================================================
// PAGE 3: CORE FOUR OVERVIEW (Navy — Three Pillars + Core Four Area Cards)
// =============================================================================

/**
 * Build the Core Four Overview page — three pillars + area preview cards.
 */
function buildCoreFourOverviewPage(doc: jsPDF, data: PDFReportData): void {
  doc.addPage();

  // Full-page navy background
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  let y = MARGIN + SP.sm;

  // Section title
  doc.setTextColor(...C.white);
  setSerif(doc, TYPE.h1);
  const titleLines = doc.splitTextToSize('What It Takes to Actually Succeed with an Executive Assistant', CONTENT_WIDTH - SP.xl);
  for (const line of titleLines) {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += TYPE.h1 * 0.5;
  }

  y += SP.lg;

  // Three Pillars — orange number circles + descriptions
  const pillars = [
    { label: 'Right Person', desc: 'An EA trained in delegation frameworks, not just task execution' },
    { label: 'Right Process & Systems', desc: 'Proven systems like Email GPS, calendar energy management, and documented playbooks' },
    { label: 'Right Support', desc: 'Active daily oversight and ongoing integration, not "set it and forget it"' },
  ];

  pillars.forEach((pillar, index) => {
    const circleX = MARGIN + SP.md;
    const circleY = y + 3;
    doc.setFillColor(...C.orange);
    doc.circle(circleX, circleY, 4.5, 'F');
    doc.setTextColor(...C.white);
    setSansBold(doc, TYPE.body);
    doc.text(String(index + 1), circleX, circleY + 1.2, { align: 'center' });

    const textX = MARGIN + SP.xl + SP.sm;
    doc.setTextColor(...C.white);
    setSansBold(doc, TYPE.h2);
    doc.text(pillar.label, textX, y + 2);

    doc.setTextColor(...C.whiteSecondary);
    setSans(doc, TYPE.body);
    const descLines = doc.splitTextToSize(pillar.desc, CONTENT_WIDTH - SP.xl - SP.lg);
    let descY = y + SP.sm + 1;
    for (const line of descLines) {
      doc.text(line, textX, descY);
      descY += TYPE.body * 0.45;
    }

    y = descY + SP.sm;
  });

  // Thin orange divider
  doc.setFillColor(...C.orange);
  doc.rect(MARGIN + SP.xl, y, CONTENT_WIDTH - SP.xl * 2, 0.8, 'F');
  y += SP.lg;

  // Core Four Areas subtitle
  doc.setTextColor(...C.white);
  setSerif(doc, 18);
  doc.text('The Core Four Areas of Ownership', PAGE_WIDTH / 2, y, { align: 'center' });
  y += SP.lg;

  // 4 area cards (2x2 grid)
  if (data.core_four_groups) {
    const cardW = (CONTENT_WIDTH - SP.sm) / 2;
    const cardH = 30;

    data.core_four_groups.forEach((group, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cx = MARGIN + col * (cardW + SP.sm);
      const cy = y + row * (cardH + SP.sm);

      // Card background
      doc.setFillColor(...C.navyMid);
      roundedRect(doc, cx, cy, cardW, cardH, 3, 'F');

      // Orange left accent
      doc.setFillColor(...C.orange);
      roundedRect(doc, cx, cy + 2, 2.5, cardH - 4, 1.5, 'F');

      // Area title
      doc.setTextColor(...C.white);
      setSansBold(doc, TYPE.body);
      doc.text(group.title, cx + SP.sm + 3, cy + SP.sm + 1);

      // Task count
      doc.setTextColor(...C.orange);
      setSansBold(doc, TYPE.caption);
      doc.text(`${group.tasks.length} tasks identified`, cx + SP.sm + 3, cy + SP.sm + 7);

      // Subtitle
      doc.setTextColor(...C.whiteSecondary);
      setSans(doc, TYPE.caption);
      const subtitleLines = doc.splitTextToSize(group.subtitle, cardW - SP.md - 6);
      let sy = cy + SP.sm + 12;
      for (const line of subtitleLines) {
        doc.text(line, cx + SP.sm + 3, sy);
        sy += TYPE.caption * 0.4;
      }
    });
  }
}

// =============================================================================
// LAST PAGE: BOOKING (Navy — Hero CTA + What Happens on the Call)
// =============================================================================

/**
 * Build the Booking page — "It's Time to Buy Back Your Time" + call details.
 */
function buildBookingPage(doc: jsPDF, data: PDFReportData, userData?: CTAUserData): void {
  doc.addPage();

  // Full-page navy background
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  let y = MARGIN + SP.xl;

  // Hero title
  doc.setTextColor(...C.white);
  setSerif(doc, 24);
  const heroLines = doc.splitTextToSize("It's Time to Buy Back Your Time", CONTENT_WIDTH - SP.xl);
  for (const line of heroLines) {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 24 * 0.5;
  }

  y += SP.xs;

  // Subtitle
  doc.setTextColor(...C.whiteSecondary);
  setSans(doc, TYPE.h2);
  doc.text('Book a call with our team today.', PAGE_WIDTH / 2, y, { align: 'center' });

  y += SP.xl;

  // "What happens on the call" section — between subtitle and CTA
  doc.setTextColor(...C.white);
  setSansBold(doc, TYPE.h2);
  doc.text('What happens on the call:', MARGIN + SP.xs, y);
  y += SP.md;

  const callBullets = [
    'Discover your top 5 tasks to delegate immediately',
    'Find out which EA profile matches your business',
    'Receive your 30-day delegation roadmap',
  ];

  callBullets.forEach((bullet) => {
    // Orange circle with checkmark
    const circleX = MARGIN + SP.md;
    const circleY = y + 1;
    doc.setFillColor(...C.orange);
    doc.circle(circleX, circleY, 3.5, 'F');

    // Draw checkmark manually (white lines)
    doc.setDrawColor(...C.white);
    doc.setLineWidth(0.6);
    doc.line(circleX - 1.2, circleY + 0.2, circleX - 0.2, circleY + 1.4);
    doc.line(circleX - 0.2, circleY + 1.4, circleX + 1.8, circleY - 1);

    // Bullet text
    doc.setTextColor(...C.white);
    setSans(doc, TYPE.body);
    doc.text(bullet, MARGIN + SP.xl + SP.xs, y + 2.5);
    y += SP.md;
  });

  y += SP.sm;

  // Urgency line
  doc.setTextColor(...C.orange);
  setSans(doc, TYPE.body);
  const urgencyText = `Every week you wait is another ${data.weekly_hours} hours spent on $15/hr work.`;
  const urgencyLines = doc.splitTextToSize(urgencyText, CONTENT_WIDTH - SP.xl);
  for (const line of urgencyLines) {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += TYPE.body * 0.5;
  }

  y += SP.md;

  // CTA button — after the value prop
  y = renderCTAButton(doc, y, userData, { onDark: true });

  y += SP.sm;

  // Reassurance
  doc.setTextColor(...C.inkMuted);
  setSans(doc, TYPE.caption);
  doc.text('No obligation. 30 minutes. Just clarity.', PAGE_WIDTH / 2, y, { align: 'center' });

  y += SP.lg;

  // Social proof — below CTA
  if (data.testimonials && data.testimonials.length >= 2) {
    renderTestimonialCard(doc, data.testimonials[1], y, { onDark: true });
  }
}

// =============================================================================
// FOOTER & PAGE NUMBERS
// =============================================================================

/**
 * Add footers and page numbers to all pages.
 */
export function addFootersToAllPages(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = PAGE_HEIGHT - 10;

    // Determine if this is a dark (navy) page — pages 1 and last
    // Pages 1 (cover), 3 (core four overview), and last (booking) are navy
    const isDarkPage = i === 1 || i === 3 || i === pageCount;

    if (isDarkPage) {
      // White/muted text on navy
      doc.setTextColor(...C.inkMuted);
      setSans(doc, TYPE.caption);

      // Page number (bottom-right)
      doc.text(`${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });
    } else {
      // Footer on white pages
      // "Assistant Launch" bottom-center
      doc.setTextColor(...C.inkMuted);
      setSans(doc, TYPE.caption);
      doc.text('Assistant Launch', PAGE_WIDTH / 2, footerY, { align: 'center' });

      // Page number (bottom-right)
      doc.text(`${i} of ${pageCount}`, PAGE_WIDTH - MARGIN, footerY, { align: 'right' });
    }
  }
}

// =============================================================================
// MAIN GENERATOR
// =============================================================================

/**
 * Generate the complete Time Freedom Report PDF.
 */
export function generateTimeFreedomReport(doc: jsPDF, data: PDFReportData, userData?: CTAUserData): void {
  // Page 1: Cover (navy)
  buildCoverPage(doc, data, userData);

  // Page 2: ROI Analysis (white)
  buildAnalysisPage(doc, data, userData);

  // Page 3: Core Four Overview (navy) — Three Pillars + Area Cards
  buildCoreFourOverviewPage(doc, data);

  // Pages 4+: Task Roadmap (white, spans multiple pages)
  buildRoadmapPages(doc, data, userData);

  // Final Page: Booking (navy) — CTA + What Happens on the Call
  buildBookingPage(doc, data, userData);

  // Add footers & page numbers to all pages
  addFootersToAllPages(doc);
}
