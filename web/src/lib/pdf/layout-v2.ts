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

/** Pre-computed RGB color constants - no runtime hex parsing */
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

  // Core Four area accents (finalized via adversarial design -Phase 5)
  emailAccent:        [13, 115, 119]  as const satisfies RGB,  // Teal #0D7377 (brand anchor)
  calendarAccent:     [37, 99, 235]   as const satisfies RGB,  // Blue #2563EB
  personalAccent:     [217, 119, 6]   as const satisfies RGB,  // Deep Amber #D97706
  businessAccent:     [5, 150, 105]   as const satisfies RGB,  // Emerald #059669

  // Core Four light variants (card/box backgrounds)
  emailAccentLight:    [230, 244, 244] as const satisfies RGB,  // #E6F4F4
  calendarAccentLight: [235, 241, 254] as const satisfies RGB,  // #EBF1FE
  personalAccentLight: [254, 243, 230] as const satisfies RGB,  // #FEF3E6
  businessAccentLight: [230, 250, 243] as const satisfies RGB,  // #E6FAF3

  // Core Four text variants (labels on light backgrounds)
  emailAccentText:    [10, 90, 93]    as const satisfies RGB,  // #0A5A5D
  calendarAccentText: [29, 78, 186]   as const satisfies RGB,  // #1D4EBA
  personalAccentText: [178, 98, 5]    as const satisfies RGB,  // #B26205
  businessAccentText: [4, 120, 84]    as const satisfies RGB,  // #047854

  // CTA page
  ctaBg:       [13, 115, 119]  as const satisfies RGB,  // Teal (inline CTA stays teal)
  ctaText:     [255, 255, 255] as const satisfies RGB,  // White
  ctaBgGold:   [245, 158, 11]  as const satisfies RGB,  // #F59E0B (final CTA page button)
  ctaTextDark: [15, 23, 42]    as const satisfies RGB,  // #0F172A (Navy text on gold)

  // Cover page financial convention
  costMuted:   [186, 28, 28]   as const satisfies RGB,  // #BA1C1C (EA cost line)
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

  // Core Four grouped tasks (Phase 3) - populated by generator-v2.ts
  core_four_groups?: CoreFourTaskGroup[];
}

/**
 * Classify a task into a Core Four ownership area.
 * Prefers explicit coreTaskType if present (Phase 4 compatibility).
 * Falls back to keyword matching on title + description.
 * Always returns a valid CoreFourArea - defaults to 'business'.
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

/**
 * Parse a time_saved string (e.g. "2+ hrs/day", "45 min/week") into weekly hours.
 */
function parseTimeSavedToWeeklyHours(timeSaved: string): number {
  const lower = timeSaved.toLowerCase().replace('+', '').trim();
  // Extract numeric value
  const numMatch = lower.match(/([\d.]+)/);
  if (!numMatch) return 0;
  let value = parseFloat(numMatch[1]);

  // Convert minutes to hours
  if (lower.includes('min')) {
    value = value / 60;
  }

  // Normalize to weekly
  if (lower.includes('/day') || lower.includes('day')) {
    value = value * 5; // 5 business days
  } else if (lower.includes('/month') || lower.includes('month')) {
    value = value / 4; // ~4 weeks per month
  }
  // /week is already weekly, no conversion needed

  return value;
}

/**
 * Sum total weekly hours for a group of tasks.
 */
function sumWeeklyHours(tasks: PDFTask[]): number {
  return tasks.reduce((sum, t) => sum + parseTimeSavedToWeeklyHours(t.time_saved), 0);
}

/**
 * Fallback universal EA task examples per Core Four area.
 * Injected when AI-personalized tasks are sparse for a given area.
 * Written with same gerund-style language and rich descriptions
 * as AI output - visually indistinguishable from personalized tasks.
 */
export const FALLBACK_TASKS: Record<CoreFourArea, PDFTask[]> = {
  email: [
    {
      name: 'Getting your inbox to zero every single day',
      description: 'Your EA processes every incoming message, sorts them into priority folders, flags what actually needs you, and archives the rest so you only see what matters.',
      time_saved: '2+ hrs/day',
    },
    {
      name: 'Replying to emails that don\'t need your brain',
      description: 'Vendor questions, scheduling confirmations, subscription stuff, standard business replies, all handled in your voice so nobody knows the difference.',
      time_saved: '1 hr/day',
    },
    {
      name: 'Killing the inbox noise you keep ignoring',
      description: 'Unsubscribing from newsletters you never read, setting up smart filters, and eliminating the promotional junk that eats your attention every morning.',
      time_saved: '30 min/day',
    },
    {
      name: 'Making sure nothing falls through the cracks',
      description: 'Tracking every open thread that needs a response, setting follow-up reminders, and nudging people so important conversations don\'t go cold.',
      time_saved: '45 min/day',
    },
    {
      name: 'Finding any email in seconds when you need it',
      description: 'Building folder structures, tagging systems, and search-friendly labels so you never waste time hunting for that one conversation again.',
      time_saved: '30 min/day',
    },
    {
      name: 'Fielding client emails so you stay focused',
      description: 'Answering common client questions, routing complex issues to the right person, and keeping communication professional without you touching it.',
      time_saved: '1 hr/day',
    },
  ],
  calendar: [
    {
      name: 'Booking your meetings without the back-and-forth',
      description: 'Coordinating across time zones, finding open slots, sending invites, and handling reschedules, without a single "does 3pm work?" email from you.',
      time_saved: '1 hr/day',
    },
    {
      name: 'Guarding your calendar so you can actually think',
      description: 'Blocking focus time, declining low-priority meeting requests, and structuring your week around when you do your best work.',
      time_saved: '45 min/day',
    },
    {
      name: 'Walking into every meeting fully prepped',
      description: 'Researching attendees, pulling together relevant docs, creating agendas, and making sure you\'re never caught off guard.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Running your recurring meetings on autopilot',
      description: 'Weekly team syncs, monthly reviews, quarterly planning, all scheduled, reminded, and organized so they just happen.',
      time_saved: '1.5 hrs/week',
    },
    {
      name: 'Squeezing in personal appointments without the hassle',
      description: 'Doctor visits, car service, haircuts, home repairs, booked and fitted into your calendar without disrupting your workday.',
      time_saved: '1 hr/week',
    },
    {
      name: 'Making sure travel days don\'t wreck your schedule',
      description: 'Aligning flights, hotel check-ins, and ground transportation with your meetings so travel days actually flow.',
      time_saved: '2 hrs/week',
    },
  ],
  personal: [
    {
      name: 'Booking your flights, hotels, and rides',
      description: 'Researching options, comparing prices, booking what matches your preferences, and managing loyalty programs so you always get the best deal.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Handling your Amazon orders and returns',
      description: 'Managing shopping lists, tracking deliveries, processing returns, and reordering household stuff before you run out.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Keeping up with your family\'s schedule',
      description: 'School pickups, kids\' activities, family events, doctor appointments, all tracked so nothing gets double-booked or forgotten.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Dealing with insurance, utilities, and contractors',
      description: 'Those annoying phone calls to service providers, negotiating rates, handling renewals, and resolving issues, all off your plate.',
      time_saved: '2 hrs/month',
    },
    {
      name: 'Never missing a birthday or anniversary again',
      description: 'Tracking every important date, picking out thoughtful gifts, and making sure they arrive on time with a personal touch.',
      time_saved: '2 hrs/month',
    },
    {
      name: 'Keeping your preferences documented so nothing gets missed',
      description: 'Your food preferences, travel style, communication habits, daily routines, all captured so your EA can anticipate what you need.',
      time_saved: '1 hr/month',
    },
  ],
  business: [
    {
      name: 'Turning your recurring tasks into permanent hand-offs',
      description: 'Record yourself doing it once, your EA transcribes it into a simple playbook, and that task is off your plate forever.',
      time_saved: '3 hrs/month',
    },
    {
      name: 'Staying on top of receipts and expense reports',
      description: 'Categorizing receipts, reconciling credit card statements, preparing expense reports, and flagging anything that looks off.',
      time_saved: '4 hrs/month',
    },
    {
      name: 'Keeping your CRM and pipeline up to date',
      description: 'New contacts entered, deal stages updated, meeting notes logged so your sales data is always accurate and ready when you need it.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Pulling together your weekly numbers and KPIs',
      description: 'Gathering data from your tools, building summary dashboards, and highlighting the trends you actually need to pay attention to.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Managing vendor contracts and renewals',
      description: 'Tracking expiration dates, collecting renewal quotes, onboarding new vendors, and preparing comparison docs so you just make the call.',
      time_saved: '3 hrs/month',
    },
    {
      name: 'Keeping your team in the loop without you doing it',
      description: 'Weekly updates sent, meeting notes distributed, action items tracked, and follow-ups handled so your team stays aligned.',
      time_saved: '2 hrs/week',
    },
  ],
};

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

  // Row 2: EA investment (muted red per financial convention -Design Dimension 3)
  rowY += 8;
  doc.setTextColor(...C.costMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('EA investment (annual)', MARGIN + 8, rowY);
  doc.setTextColor(...C.costMuted);
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
  doc.setFontSize(12); // Design Dimension 7: reduced from 13pt for density
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

  return y + cardHeight + 4; // Design Dimension 5: reduced from 6mm for density/overwhelm
}

/**
 * Compact Task Row - condensed format for Core Four task pages.
 * Line 1: number (accent) + task name (bold) + time saved (right, muted)
 * Line 2: description (secondary, one line, truncated)
 * Height: ~10mm per row for maximum density/overwhelm.
 */
function renderCompactTaskRow(
  doc: jsPDF,
  num: number,
  name: string,
  description: string,
  timeSaved: string,
  accentColor: readonly [number, number, number],
  y: number,
): number {
  // Task number in accent color
  const numColor: [number, number, number] = [...accentColor];
  doc.setTextColor(...numColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(String(num), MARGIN + 1, y + 3);

  // Task name (bold)
  doc.setTextColor(...C.ink);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const nameMaxWidth = CONTENT_WIDTH - 40;
  const truncatedName = doc.splitTextToSize(name, nameMaxWidth)[0];
  doc.text(truncatedName, MARGIN + 8, y + 3);

  // Time saved (right-aligned, muted)
  doc.setTextColor(...C.inkMuted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(timeSaved, MARGIN + CONTENT_WIDTH, y + 3, { align: 'right' });

  // Description (one line, truncated, smaller)
  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  const descMaxWidth = CONTENT_WIDTH - 8;
  const truncatedDesc = doc.splitTextToSize(description, descMaxWidth)[0];
  doc.text(truncatedDesc, MARGIN + 8, y + 6.5);

  // Thin divider
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.15);
  doc.line(MARGIN + 8, y + 7.8, MARGIN + CONTENT_WIDTH, y + 7.8);

  return y + 8;
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
  // === TEAL HEADER BANNER ===
  const bannerHeight = 58;
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PAGE_WIDTH, bannerHeight, 'F');

  // Subtle darker strip at top for depth
  doc.setFillColor(10, 95, 98);
  doc.rect(0, 0, PAGE_WIDTH, 1.5, 'F');

  let y = 12;

  // Brand name (white on teal)
  doc.setTextColor(...C.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSISTANT LAUNCH', MARGIN, y);

  // Brand underline
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 2.5, MARGIN + 30, y + 2.5);

  // Website URL
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('www.assistantlaunch.com', PAGE_WIDTH - MARGIN, y, { align: 'right' });

  y += 14;

  // Report title
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Time Freedom Report', MARGIN, y);

  y += 10;

  // Client info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prepared for ${data.client_name}`, MARGIN, y);

  y += 7;

  // Date + company context
  doc.setFontSize(9);
  const metaText = data.company_name
    ? `${data.company_name}  •  ${data.date}`
    : data.date;
  doc.text(metaText, MARGIN, y);

  // === WHITE SECTION (below banner) ===
  y = bannerHeight + 12;

  // Hero metric - large dollar value in accent color
  doc.setTextColor(...C.accent);
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.annual_value), MARGIN, y + 14);

  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Annual value you could unlock by delegating to your EA', MARGIN, y + 22);

  y += 32;

  // Metrics row - use actual Core Four task count if available
  const displayedTaskCount = data.core_four_groups
    ? data.core_four_groups.reduce((sum, g) => sum + g.tasks.length, 0)
    : data.total_tasks_ea;
  y = renderMetricsRow(doc, [
    { value: `${data.weekly_hours} hrs`, label: 'Reclaimed Weekly' },
    { value: String(displayedTaskCount), label: 'Tasks to Delegate' },
    { value: `${data.roi_multiplier}x`, label: 'Projected ROI of an EA' },
  ], y);
  y += 3;

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
 * Build the framework page (page 2) -Three Pillars + Core Four
 * All content is static / hardcoded (FRAME-04 requirement)
 */
function buildFrameworkPage(doc: jsPDF): void {
  doc.addPage();
  let y = 20;

  // --- Static content constants ---
  const THREE_PILLARS = [
    {
      title: 'Right Person',
      description: 'Your EA must be trained in proven delegation frameworks, not just task execution. We place assistants skilled in email management, calendar optimization, personal life coordination, and business process ownership so they can think ahead, not just follow instructions.',
    },
    {
      title: 'Right Process & Systems',
      description: 'Even a talented assistant will fail without the right systems. Our EAs deploy the Email GPS framework, calendar energy management, and documented playbooks for every recurring task, turning chaos into repeatable workflows.',
    },
    {
      title: 'Right Support',
      description: 'Delegation is not "set it and forget it." Assistant Launch provides active daily oversight, communication rhythm tracking, and ongoing integration support so your EA relationship improves every week, not just the first.',
    },
  ] as const;

  const CORE_FOUR = [
    {
      title: 'Email Ownership',
      description: 'Your assistant triages everything using the Email GPS system -7 folders, zero inbox for you. You review only what matters during a quick daily standup.',
      accent: C.emailAccent,
      accentLight: C.emailAccentLight,
    },
    {
      title: 'Calendar Ownership',
      description: 'Your assistant manages energy, not just time. They schedule two weeks ahead, protect your highest-value hours, and ensure your calendar reflects your priorities.',
      accent: C.calendarAccent,
      accentLight: C.calendarAccentLight,
    },
    {
      title: 'Personal Life Ownership',
      description: 'Hotels, flights, Amazon returns, family logistics, all handled. Enabled by the Partnership Playbook, a detailed document that captures your preferences and routines.',
      accent: C.personalAccent,
      accentLight: C.personalAccentLight,
    },
    {
      title: 'Recurring Business Processes',
      description: 'Every repetitive task becomes a one-page playbook using the camcorder method: record yourself doing it once, and your assistant owns it forever.',
      accent: C.businessAccent,
      accentLight: C.businessAccentLight,
    },
  ] as const;

  // --- Section 1: Three Pillars ---
  doc.setTextColor(...C.ink);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('What It Takes to Actually Succeed with an EA', MARGIN, y);
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
  doc.text('The Core Four EA Ownership Areas', MARGIN, y);
  y += 10;

  CORE_FOUR.forEach((area) => {
    const boxHeight = 25;

    // Left accent bar (3mm wide -Design Dimension 4: widened from 2mm)
    const accentColor: [number, number, number] = [...area.accent];
    doc.setFillColor(...accentColor);
    doc.rect(MARGIN, y, 3, boxHeight, 'F');

    // Background box (per-area light accent -Design Dimension 4)
    const lightColor: [number, number, number] = [...area.accentLight];
    doc.setFillColor(...lightColor);
    roundedRect(doc, MARGIN + 4, y, CONTENT_WIDTH - 4, boxHeight, 2, 'F');

    // Title
    doc.setTextColor(...C.ink);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(area.title, MARGIN + 9, y + 8);

    // Description (wrapped, max 2 lines to stay within box)
    doc.setTextColor(...C.inkSecondary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(area.description, CONTENT_WIDTH - 13);
    doc.text(lines.slice(0, 2), MARGIN + 9, y + 15);

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
    "Begin with daily tasks like email and calendar management. They'll give you immediate time back while you build trust with your EA. Then expand to weekly and monthly tasks as you develop systems together.",
    y
  );
  y += 15;
  renderCTABlock(doc, y, userData);
}

/**
 * Render one Core Four section: accent-colored header bar + task cards.
 * Returns the y position after the last task.
 *
 * @param doc - jsPDF instance
 * @param group - The Core Four task group to render
 * @param startingTaskNumber - Global task number for first task in this section
 * @param y - Current y position
 * @returns Updated y position after rendering all tasks
 */
function renderCoreFourSection(
  doc: jsPDF,
  group: CoreFourTaskGroup,
  startingTaskNumber: number,
  y: number,
): number {
  const headerHeight = 7;

  // Check page break for header + at least 2 compact task rows
  y = checkPageBreak(doc, y, headerHeight + 16);

  // Compact accent-colored header bar
  const accentColor: [number, number, number] = [...group.accent];
  doc.setFillColor(...accentColor);
  roundedRect(doc, MARGIN, y, CONTENT_WIDTH, headerHeight, 1.5, 'F');

  // Section title (white on accent)
  doc.setTextColor(...C.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(group.title, MARGIN + 4, y + 4.8);

  // Task count + total hours (white on accent, right-aligned)
  const totalHours = sumWeeklyHours(group.tasks);
  const hoursLabel = totalHours % 1 === 0 ? `${totalHours}` : `${totalHours.toFixed(1)}`;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${group.tasks.length} tasks - ${hoursLabel} hrs/week of admin`, MARGIN + CONTENT_WIDTH - 4, y + 4.8, { align: 'right' });

  y += headerHeight + 1.5;

  // Render compact task rows
  group.tasks.forEach((task, index) => {
    y = checkPageBreak(doc, y, 8);
    y = renderCompactTaskRow(doc, startingTaskNumber + index, task.name, task.description, task.time_saved, group.accent, y);
  });

  return y + 2; // Tight gap before next section
}

/**
 * Build all Core Four task pages (flowing, multi-page).
 * Renders each Core Four section sequentially with accent headers.
 * Task numbering is continuous across all sections for overwhelm effect.
 */
function buildCoreFourTaskPages(
  doc: jsPDF,
  data: PDFReportData,
  userData?: CTAUserData,
): void {
  if (!data.core_four_groups || data.core_four_groups.length === 0) return;

  doc.addPage();
  let y = 20;

  // Compute total task count for overwhelm messaging
  const totalTasks = data.core_four_groups.reduce((sum, g) => sum + g.tasks.length, 0);

  // Page title - compact to maximize task space
  doc.setTextColor(...C.ink);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Personalized EA Task Roadmap', MARGIN, y + 5);

  // Task count for overwhelm effect
  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalTasks} tasks your EA could own, organized by the Core Four`, MARGIN, y + 10);
  y += 13;

  // Render each Core Four section with continuous task numbering
  let globalTaskNumber = 1;
  for (const group of data.core_four_groups) {
    y = renderCoreFourSection(doc, group, globalTaskNumber, y);
    globalTaskNumber += group.tasks.length;
  }

}

/**
 * Build the full-page CTA (final page of the PDF).
 * Reinforces Three Pillars value proposition and drives Time Audit booking.
 * CTA-01: Strong CTA for Time Audit call
 * CTA-02: Clickable booking link
 * CTA-03: Value proposition reinforcement
 */
function buildCTAPageV2(doc: jsPDF, userData?: CTAUserData): void {
  doc.addPage();
  let y = 30; // Design Dimension 6: increased from 20mm for relief contrast with dense task pages
  const bookingUrl = buildBookingUrl(userData);

  // --- Headline ---
  doc.setTextColor(...C.ink);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text("It's Time to Buy Back Your Time", PAGE_WIDTH / 2, y + 15, { align: 'center' });
  y += 30;

  // --- Subheadline ---
  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const subheadLines = doc.splitTextToSize(
    'The tasks in this report are real, and they are consuming hours of your week that should be spent on strategy, relationships, and the work only you can do. But delegation done wrong wastes even more time.',
    CONTENT_WIDTH - 20,
  );
  doc.text(subheadLines, MARGIN + 10, y);
  y += subheadLines.length * 5.5 + 10;

  // --- Three Pillars Reminder (compact) ---
  doc.setTextColor(...C.ink);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('What It Actually Takes to Buy Back Your Time', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;

  const pillars = [
    { label: 'Right Person', desc: 'An EA trained in delegation frameworks, not just task execution' },
    { label: 'Right Process', desc: 'Proven systems like Email GPS, calendar energy management, and documented playbooks' },
    { label: 'Right Support', desc: 'Active daily oversight and ongoing integration, not "set it and forget it"' },
  ];

  for (const pillar of pillars) {
    // Accent bullet
    doc.setFillColor(...C.accent);
    doc.circle(MARGIN + 12, y + 3, 3, 'F');

    // Pillar label
    doc.setTextColor(...C.ink);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(pillar.label, MARGIN + 20, y + 5);

    // Pillar description
    doc.setTextColor(...C.inkSecondary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(pillar.desc, MARGIN + 20, y + 11);

    y += 18;
  }

  y += 8;

  // --- What Happens on a Time Audit Call ---
  doc.setTextColor(...C.ink);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('What Happens on Your Free Time Audit', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;

  const auditSteps = [
    'We review your specific time drains and identify the highest-impact tasks to delegate first',
    'We map your tasks to the Core Four framework so you can see exactly what an EA would own',
    'We determine if Assistant Launch is the right fit, and if so, match you with a trained EA within days',
  ];

  auditSteps.forEach((step, index) => {
    // Step number circle
    doc.setFillColor(...C.accent);
    doc.circle(MARGIN + 12, y + 3, 5, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(String(index + 1), MARGIN + 12, y + 4.5, { align: 'center' });

    // Step text
    doc.setTextColor(...C.inkSecondary);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const stepLines = doc.splitTextToSize(step, CONTENT_WIDTH - 30);
    doc.text(stepLines, MARGIN + 22, y + 5);
    y += Math.max(16, stepLines.length * 5 + 8);
  });

  y += 12;

  // --- Large CTA Button ---
  const btnWidth = 120;
  const btnHeight = 16;
  const btnX = (PAGE_WIDTH - btnWidth) / 2;

  doc.setFillColor(...C.ctaBgGold); // Design Dimension 2: Gold button for visual disruption
  doc.roundedRect(btnX, y, btnWidth, btnHeight, 6, 6, 'F');
  doc.setTextColor(...C.ctaTextDark); // Design Dimension 2: Navy text on gold
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Book Your Free Time Audit', PAGE_WIDTH / 2, y + 10.5, { align: 'center' });

  // Make button clickable
  doc.link(btnX, y, btnWidth, btnHeight, { url: bookingUrl });

  y += btnHeight + 6;

  // Display URL (also clickable)
  doc.setTextColor(...C.accent);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const urlText = 'assistantlaunch.com/book';
  doc.text(urlText, PAGE_WIDTH / 2, y + 2, { align: 'center' });

  const urlWidth = doc.getTextWidth(urlText);
  doc.link((PAGE_WIDTH - urlWidth) / 2, y - 1, urlWidth, 6, { url: bookingUrl });

  y += 12;

  // --- Reassurance line ---
  doc.setTextColor(...C.inkMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('No obligation. 30 minutes. We\'ll show you exactly where to start.', PAGE_WIDTH / 2, y, { align: 'center' });
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

  // Pages 3+: Core Four Task Roadmap (flowing, multi-page)
  buildCoreFourTaskPages(doc, data, userData);

  // Final Page: Full-page CTA
  buildCTAPageV2(doc, userData);

  // Add footers to all pages
  addFootersToAllPages(doc);
}
