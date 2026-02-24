# Phase 3: Core Four Task Pages + CTA - Research

**Researched:** 2026-02-24
**Domain:** PDF task page restructuring (frequency-based to Core Four area-based), keyword inference grouping, fallback content system, CTA page with clickable booking link
**Confidence:** HIGH

## Summary

Phase 3 transforms the PDF's core conversion mechanism. Currently, the PDF renders tasks in three frequency-based pages (daily, weekly, monthly) with 5 EA tasks and 3 founder tasks per page, each on its own page via `buildTasksPage` and `buildFounderTasksPage`. The redesign replaces this with Core Four ownership area grouping (Email, Calendar, Personal Life, Business Processes) -- a fundamentally different organizational axis that teaches the reader how delegation actually works.

The primary technical challenge is **inference-based Core Four grouping**. Phase 4 will update the AI prompt to emit `coreTaskType` on every task, but Phase 3 must work WITHOUT that field being reliably present. The existing `report-validator.ts` already has keyword-matching functions (`hasEmailManagementTask`, `hasCalendarManagementTask`, `hasPersonalLifeManagementTask`, `hasBusinessProcessManagementTask`) that detect Core Four areas via text content analysis. These functions provide the pattern for an inference-based classifier that assigns every EA task to a Core Four area based on title + description keywords. When Phase 4 lands, the classifier can prefer the explicit `coreTaskType` field and fall back to inference for tasks missing it.

The second challenge is **deliberate overwhelm**: all EA tasks (currently 15 across all frequencies: 5 daily + 5 weekly + 5 monthly) must be shown grouped by Core Four area, supplemented by fallback universal tasks when any area is thin. The current 15 EA tasks will likely distribute unevenly (email-heavy, business-process-light), so the fallback system is essential. With fallback injection, each Core Four area should show 6-10+ tasks, meaning total task volume across all four areas could be 24-40+ tasks spanning multiple pages -- this is the intended "overwhelm" effect.

The third component is the CTA page redesign. The existing `buildCTAPage` is minimal (a title, a paragraph, and a small CTA block). Phase 3 replaces it with a full-page CTA that reinforces the Three Pillars value proposition and includes a prominent clickable booking link. The booking URL (`https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet`) already exists in three places in the codebase with pre-fill parameter support -- the PDF's `buildBookingUrl` in `layout-v2.ts` already constructs the full URL with `iclosedName`, `iclosedEmail`, `iclosedPhone`, and `timeFormat` params.

**Primary recommendation:** Split into three plans: (1) build the Core Four task page renderer with keyword inference classifier, accent colors, and checkPageBreak integration; (2) build the fallback content system with universal EA task examples per Core Four area; (3) redesign the CTA page and rewire the `generateTimeFreedomReport` orchestrator to use the new Core Four task pages + CTA instead of the current frequency-based pages.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | (existing in project) | All PDF rendering -- text, shapes, colors | Already in use; all PDF work builds on it |
| TypeScript | (existing in project) | Type-safe interfaces for task grouping and fallback content | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| layout-v2.ts | N/A (internal) | Page builder pattern, component renderers, checkPageBreak, C color constants | Core rendering infrastructure from Phases 1-2 |
| report-validator.ts | N/A (internal) | Keyword detection functions for Core Four areas | Pattern reference for inference-based classifier |
| report-fixer.ts | N/A (internal) | Core EA task templates and injection patterns | Reference for fallback task content structure |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keyword inference for Core Four grouping | Wait for Phase 4 AI prompt update (coreTaskType) | Phase 4 depends on Phase 3 being built first; inference works now and gracefully upgrades when coreTaskType arrives |
| Hardcoded fallback tasks in layout-v2.ts | Separate fallback-tasks.ts content file | Content is ~30 tasks (small); keeping it in or near the layout file is simpler. Could extract later if it grows. |
| Building one giant Core Four page | Separate page per Core Four area (4 pages) | 4 pages too many; a flowing multi-page layout with checkPageBreak handling is more natural and compact |

**Installation:**
```bash
# No new packages needed -- all work is on existing code
```

## Architecture Patterns

### Recommended Project Structure
```
web/src/lib/pdf/
├── layout-v2.ts         # PRIMARY target -- add buildCoreFourTaskPages, buildCTAPageV2, inferCoreTaskType, fallback tasks
├── generator-v2.ts      # Update transformToPDFData to group tasks by Core Four; update generateTimeFreedomReport call sequence
├── design-system.ts     # Untouched (V1 era)
├── s3Service.ts         # Untouched
└── index.ts             # May need updated re-exports if new functions are exported
```

### Pattern 1: Inference-Based Core Four Classifier
**What:** A function that examines a task's title and description to assign it to one of the four Core Four areas. Uses keyword matching already proven in report-validator.ts.
**When to use:** For every EA task when building Core Four grouping, until Phase 4 provides explicit `coreTaskType` on all tasks.
**Example:**
```typescript
// Source pattern: web/src/lib/ai/report-validator.ts lines 226-315
// These keyword lists are already proven in production:
//   email: 'email', 'inbox', 'correspondence'
//   calendar: 'calendar', 'schedule', 'scheduling', 'appointment', 'meeting'
//   personal: 'personal', 'travel', 'booking', 'reservation', 'vendor', 'family'
//   business: 'process', 'recurring', 'workflow', 'system', 'procedure', 'automation'

type CoreFourArea = 'email' | 'calendar' | 'personal' | 'business';

function inferCoreTaskType(task: { title: string; description: string; coreTaskType?: string }): CoreFourArea {
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

  if (text.includes('email') || text.includes('inbox') || text.includes('correspondence'))
    return 'email';
  if (text.includes('calendar') || text.includes('schedule') || text.includes('scheduling') ||
      text.includes('appointment') || text.includes('meeting'))
    return 'calendar';
  if (text.includes('personal') || text.includes('travel') || text.includes('booking') ||
      text.includes('reservation') || text.includes('vendor') || text.includes('family') ||
      text.includes('errand'))
    return 'personal';

  // Default to business processes (broadest category)
  return 'business';
}
```

### Pattern 2: Core Four Task Grouping in Data Transform
**What:** Group all EA tasks by Core Four area in `transformToPDFData` (or a helper), producing a new data structure that the page renderer consumes.
**When to use:** During data transformation, before layout rendering begins.
**Example:**
```typescript
// New type for grouped tasks
interface CoreFourTaskGroup {
  area: CoreFourArea;
  title: string;       // Display name: "Email Ownership"
  accent: readonly [number, number, number];  // C.emailAccent, etc.
  tasks: PDFTask[];    // Personalized + fallback tasks for this area
}

// In transformToPDFData or a new helper:
function groupTasksByCoreFour(
  allEATasks: Task[],
  fallbackTasks: Record<CoreFourArea, PDFTask[]>,
): CoreFourTaskGroup[] {
  const groups: Record<CoreFourArea, PDFTask[]> = {
    email: [], calendar: [], personal: [], business: [],
  };

  // Classify each EA task
  for (const task of allEATasks) {
    const area = inferCoreTaskType(task);
    groups[area].push({ name: task.title, description: task.description, time_saved: '...' });
  }

  // Inject fallback tasks for thin areas
  for (const area of ['email', 'calendar', 'personal', 'business'] as CoreFourArea[]) {
    if (groups[area].length < 4) {
      const needed = 4 - groups[area].length;
      groups[area].push(...fallbackTasks[area].slice(0, needed));
    }
  }

  return [
    { area: 'email', title: 'Email Ownership', accent: C.emailAccent, tasks: groups.email },
    { area: 'calendar', title: 'Calendar Ownership', accent: C.calendarAccent, tasks: groups.calendar },
    { area: 'personal', title: 'Personal Life Ownership', accent: C.personalAccent, tasks: groups.personal },
    { area: 'business', title: 'Recurring Business Processes', accent: C.businessAccent, tasks: groups.business },
  ];
}
```

### Pattern 3: Core Four Section Renderer with Accent Color
**What:** A section renderer that draws a colored header bar for each Core Four area, then iterates task cards with checkPageBreak before each one.
**When to use:** For rendering each Core Four section in the flowing multi-page task layout.
**Example:**
```typescript
function renderCoreFourSection(
  doc: jsPDF,
  group: CoreFourTaskGroup,
  startingTaskNumber: number,
  y: number,
): number {
  // Section header with accent color bar
  const headerHeight = 14;
  y = checkPageBreak(doc, y, headerHeight + 40); // Header + at least one task
  doc.setFillColor(...group.accent);
  doc.rect(MARGIN, y, CONTENT_WIDTH, headerHeight, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(group.title, MARGIN + 6, y + 9);
  y += headerHeight + 6;

  // Render tasks with page break protection
  group.tasks.forEach((task, index) => {
    const descLines = doc.splitTextToSize(task.description || '', CONTENT_WIDTH - 30);
    const estimatedCardHeight = Math.max(35, 20 + descLines.length * 5 + 8);
    y = checkPageBreak(doc, y, estimatedCardHeight);
    y = renderTaskCard(doc, startingTaskNumber + index, task.name, task.description, task.time_saved, y);
  });

  return y + 8; // Spacing before next section
}
```

### Pattern 4: PDFReportData Extension for Core Four Groups
**What:** Add optional `coreFourGroups` field to PDFReportData to carry the grouped task data to the layout layer.
**When to use:** When the page builder needs Core Four grouped data.
**Example:**
```typescript
export interface PDFReportData {
  // ... existing fields ...

  // NEW: Core Four task groups (Phase 3)
  core_four_groups?: CoreFourTaskGroup[];
}
```

### Pattern 5: Full-Page CTA with Value Proposition
**What:** Replace the minimal CTA page with a full-page design that reinforces the Three Pillars, includes compelling copy, and has a large clickable booking button.
**When to use:** Final page of the PDF.
**Example:**
```typescript
function buildCTAPageV2(doc: jsPDF, userData?: CTAUserData): void {
  doc.addPage();
  let y = 20;

  // Compelling headline
  doc.setTextColor(...C.ink);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text("You Don't Have to Do This Alone", PAGE_WIDTH / 2, y + 15, { align: 'center' });
  y += 30;

  // Value proposition paragraphs
  // ... (reinforce Three Pillars: Right Person + Right Process + Right Support)

  // Large CTA button with booking URL
  const bookingUrl = buildBookingUrl(userData);
  const btnWidth = 100;
  const btnHeight = 16;
  const btnX = (PAGE_WIDTH - btnWidth) / 2;
  doc.setFillColor(...C.accent);
  doc.roundedRect(btnX, y, btnWidth, btnHeight, 6, 6, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Book Your Free Time Audit', PAGE_WIDTH / 2, y + 10.5, { align: 'center' });
  doc.link(btnX, y, btnWidth, btnHeight, { url: bookingUrl });
}
```

### Anti-Patterns to Avoid
- **Keeping the old frequency-based pages alongside Core Four pages:** The orchestrator must replace the daily/weekly/monthly task pages with Core Four pages -- not add Core Four as additional pages. The founder task pages (`buildFounderTasksPage`) are also replaced since they were paired with frequency grouping.
- **Classifier returning undefined or throwing:** The inference classifier must ALWAYS return a valid CoreFourArea. Use 'business' as the catch-all default (it's the broadest category). Never let a task be unclassified.
- **Putting inference logic in the layout layer:** Keep classification logic in or near the data transform (`generator-v2.ts`). The layout layer should receive pre-grouped data, not raw tasks.
- **Hardcoding task numbering per section:** Task numbers should be continuous across all Core Four sections (1...N globally), not reset to 1 per section. This reinforces the overwhelm effect ("task 37 of 40").
- **Using hex strings or the old `setColor` function:** Phase 1 removed these. All colors must use `doc.setFillColor(...C.emailAccent)` pattern.
- **Skipping the CTA page entirely if tasks fill many pages:** The CTA page is critical -- it MUST always be the final page regardless of how many task pages precede it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Core Four keyword detection | New regex patterns from scratch | Existing keyword lists from report-validator.ts (hasEmailManagementTask, etc.) | These keyword lists are proven in production to correctly detect Core Four areas |
| Page overflow detection | Ad-hoc `if (y > X)` checks | Phase 1's `checkPageBreak(doc, y, height)` utility | Centralized, configurable, consistent |
| Booking URL construction | New URL builder | Existing `buildBookingUrl(userData)` in layout-v2.ts | Already handles name/email/phone pre-fill, phone formatting, iClosed params |
| Task card rendering | New task card component | Existing `renderTaskCard(doc, number, name, description, timeSaved, y)` | Already handles multi-line descriptions, dynamic height, divider lines |
| Fallback task content structure | Custom format | Same `PDFTask` interface (`{ name, description, time_saved }`) | Consistent with existing task rendering pipeline |

**Key insight:** The report-validator.ts keyword lists and the report-fixer.ts fallback task templates provide nearly everything needed for inference-based grouping and fallback content. Phase 3 is an assembly task, not an invention task -- the building blocks exist.

## Common Pitfalls

### Pitfall 1: Uneven Core Four Distribution Leaving Empty Sections
**What goes wrong:** All 15 EA tasks get classified into 2-3 Core Four areas, leaving one or two areas with zero personalized tasks.
**Why it happens:** AI-generated tasks cluster around the most obvious categories (email, calendar) and barely touch personal life or business processes, especially when form data is sparse.
**How to avoid:** The fallback system must ensure every Core Four area has a minimum of 4 tasks. Define 6-8 fallback tasks per area so even a completely empty area gets substantial content. The fallback task content should be high-quality universal EA examples (not generic filler).
**Warning signs:** Any Core Four section in the PDF with fewer than 4 tasks. Test with an empty task set (all fallbacks) to verify minimum content.

### Pitfall 2: Task Card Height Estimation Mismatch Causing Overflow
**What goes wrong:** checkPageBreak is called with an estimated height that is smaller than the actual rendered height, causing content to still overflow past the footer.
**Why it happens:** The height estimation formula must match what `renderTaskCard` actually produces. If the description wrapping or spacing changes, the estimate becomes stale.
**How to avoid:** Use the same formula as renderTaskCard: `Math.max(35, 20 + descLines.length * 5 + 8)` where `descLines = doc.splitTextToSize(description, CONTENT_WIDTH - 30)`. Pre-measure before calling checkPageBreak, exactly as Phase 1's plan 02 specifies.
**Warning signs:** Tasks appearing partially at the very bottom of a page with content cut off by the footer.

### Pitfall 3: Section Header Orphaned at Page Bottom
**What goes wrong:** A Core Four section header (e.g., "Email Ownership") renders at the bottom of a page with no tasks below it -- all tasks land on the next page.
**Why it happens:** checkPageBreak is called before each task but not before the section header, or it checks for just the header height without ensuring room for at least one task.
**How to avoid:** When rendering a section header, call checkPageBreak with `headerHeight + minimumOneTaskHeight` (at least 14 + 35 = 49mm). This ensures the header and at least one task always appear on the same page.
**Warning signs:** A colored section header bar sitting alone at the bottom of a page with white space below it.

### Pitfall 4: Orchestrator Not Removing Old Frequency-Based Pages
**What goes wrong:** The PDF has both the old daily/weekly/monthly task pages AND the new Core Four pages, doubling the page count and confusing the reader.
**Why it happens:** The new Core Four pages are added to `generateTimeFreedomReport` without removing the old `buildTasksPage` and `buildFounderTasksPage` calls.
**How to avoid:** The orchestrator change must be a REPLACEMENT, not an addition. Remove all six existing calls to `buildTasksPage` and `buildFounderTasksPage` (daily, weekly, monthly pairs) and replace them with the single Core Four task rendering call. Also remove the old `buildCTAPage` call and replace with the new CTA.
**Warning signs:** PDF has 10+ pages when it should have 4-5.

### Pitfall 5: Fallback Tasks Looking Generic vs. Personalized Tasks
**What goes wrong:** The reader can obviously tell which tasks are "real" (personalized by AI) and which are "filler" (fallback universal examples), undermining the report's credibility.
**Why it happens:** Fallback tasks use vague language while AI tasks are specific to the founder's business.
**How to avoid:** Write fallback tasks with the same level of specificity and action-oriented gerund language as good AI output. Use titles like "Coordinating vendor quotes and service renewals" not "General business management." Each fallback task needs a rich description (2-3 sentences) with concrete examples. The visual rendering should be identical -- no visual distinction between personalized and fallback tasks.
**Warning signs:** Some tasks have 1-line descriptions while others have rich 2-3 sentence descriptions.

### Pitfall 6: Booking URL Not Being Clickable in PDF
**What goes wrong:** The CTA button looks like a button but clicking it in a PDF viewer does nothing.
**Why it happens:** Forgetting to call `doc.link(x, y, width, height, { url })` after drawing the button shape. jsPDF requires an explicit link annotation; drawing a colored rectangle alone does not create a hyperlink.
**How to avoid:** The existing `renderCTABlock` function already correctly uses `doc.link()` to create clickable areas. Follow the exact same pattern: draw the visual element, then immediately call `doc.link()` with the same bounding box coordinates and the booking URL.
**Warning signs:** Button renders correctly visually but the cursor does not change to a hand icon in a PDF viewer.

### Pitfall 7: Time Saved Values Missing for Fallback Tasks
**What goes wrong:** Fallback tasks render with "Time saved: undefined" or empty time saved text.
**Why it happens:** The fallback PDFTask objects are defined without the `time_saved` field.
**How to avoid:** Every fallback PDFTask must include a realistic `time_saved` value (e.g., "1-2 hrs/week", "30 min/day", "3 hrs/month"). Define these values when creating the fallback content.
**Warning signs:** Task cards with "Time saved: " and nothing after it.

## Code Examples

Verified patterns from the existing codebase:

### Current Task Flow (to be replaced)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 756-828
// generateTimeFreedomReport currently calls:
//   buildSummaryPage(doc, data)       -- page 1 (kept, modified by Phase 2)
//   buildFrameworkPage(doc)           -- page 2 (added by Phase 2)
//   buildTasksPage(daily tasks)       -- REPLACED by Phase 3
//   buildFounderTasksPage(daily)      -- REPLACED by Phase 3
//   buildTasksPage(weekly tasks)      -- REPLACED by Phase 3
//   buildFounderTasksPage(weekly)     -- REPLACED by Phase 3
//   buildTasksPage(monthly tasks)     -- REPLACED by Phase 3
//   buildFounderTasksPage(monthly)    -- REPLACED by Phase 3
//   buildCTAPage(doc, userData)       -- REPLACED by Phase 3
//   addFootersToAllPages(doc)         -- kept
```

### Current Data Transform (to be extended)
```typescript
// Source: web/src/lib/pdf/generator-v2.ts lines 77-169
// transformToPDFData currently:
//   - Separates tasks into EA and Founder
//   - Groups by frequency (daily/weekly/monthly)
//   - Limits to 5 EA + 3 Founder per frequency
//   - Returns PDFReportData with daily_tasks, weekly_tasks, monthly_tasks arrays

// Phase 3 ADDS: group ALL EA tasks by Core Four area (not frequency)
// The existing frequency grouping stays for backward compatibility but
// the PDF now renders by Core Four area instead
```

### Existing Keyword Detection (reference for classifier)
```typescript
// Source: web/src/lib/ai/report-validator.ts lines 226-315
// These functions detect Core Four areas via keyword matching:

// Email: 'email', 'inbox', 'correspondence'
export function hasEmailManagementTask(tasks: Task[]): boolean { ... }

// Calendar: 'calendar', 'schedule', 'scheduling', 'appointment', 'meeting'
export function hasCalendarManagementTask(tasks: Task[]): boolean { ... }

// Personal: 'personal', 'travel', 'booking', 'reservation', 'vendor', 'family'
export function hasPersonalLifeManagementTask(tasks: Task[]): boolean { ... }

// Business: 'process', 'recurring', 'workflow', 'system', 'procedure', 'automation'
export function hasBusinessProcessManagementTask(tasks: Task[]): boolean { ... }
```

### Existing Fallback Task Templates (reference for content)
```typescript
// Source: web/src/lib/ai/report-fixer.ts lines 70-134
// createMissingCoreEATasks builds high-quality fallback tasks:
{
  title: 'Complete Email Management',
  description: 'Your assistant manages your entire inbox, responses, filtering, and email workflows...',
  owner: 'EA', isEA: true, frequency: 'daily', category: 'Communication',
  priority: 'high', isCoreEATask: true, coreTaskType: 'emailManagement',
}
// Phase 3 needs MANY more fallback tasks per area (6-8 each) with
// the same quality level and specificity
```

### Booking URL Builder (reuse for CTA)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 504-530
function buildBookingUrl(userData?: {
  firstName?: string; lastName?: string; email?: string; phone?: string;
}): string {
  const baseUrl = 'https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet';
  // ... pre-fills iclosedName, iclosedEmail, iclosedPhone, timeFormat=12h
  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}
// Note: The displayed URL text is 'assistantlaunch.com/book' (layout-v2.ts line 575)
// but the actual link destination is the iClosed URL with pre-fill params
```

### Existing CTA Rendering (reference for link integration)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 542-583
export function renderCTABlock(doc: jsPDF, y: number, userData?: CTAUserData): number {
  // ... draws button shape
  doc.link(btnX, btnY, btnWidth, btnHeight, { url: bookingUrl }); // Clickable!
  // ... draws URL text
  doc.link((PAGE_WIDTH - urlWidth) / 2, y + 36, urlWidth, 6, { url: bookingUrl }); // Also clickable!
  // Both the button AND the URL text are independently clickable targets
}
```

### Core Four Accent Colors (from Phase 1 palette)
```typescript
// Source: Phase 1 research -- defined as placeholder colors in C constant object
// Phase 1 plan 01 establishes these in layout-v2.ts:
emailAccent:    [59, 130, 246]  // Blue #3B82F6
calendarAccent: [168, 85, 247]  // Purple #A855F7
personalAccent: [234, 179, 8]   // Amber #EAB308
businessAccent: [34, 197, 94]   // Green #22C55E

// Usage: doc.setFillColor(...C.emailAccent);
// Phase 5 may refine these colors, but they provide visual distinction now
```

## Fallback Task Content Design

Each Core Four area needs 6-8 high-quality fallback tasks. These must use gerund-style action language (TASK-03) and rich descriptions. Here are draft examples:

### Email Ownership Fallbacks (6 tasks)
1. **"Triaging your inbox using the Email GPS system"** - Processing all incoming messages into 7 priority folders, flagging urgent items, archiving noise, and ensuring you only review what truly needs your attention during the daily standup.
2. **"Drafting and sending routine responses"** - Handling vendor inquiries, scheduling confirmations, subscription management, and standard business correspondence using your voice and tone guidelines.
3. **"Unsubscribing and filtering recurring noise"** - Auditing your email subscriptions, setting up smart filters, and eliminating newsletters, notifications, and promotional emails that waste your attention.
4. **"Managing follow-up sequences and reminders"** - Tracking open threads that need responses, setting follow-up reminders, and ensuring no important conversation falls through the cracks.
5. **"Organizing email into searchable archives"** - Creating folder structures, tagging systems, and search-friendly labels so you can find any conversation in seconds when you need it.
6. **"Handling customer and client email inquiries"** - Responding to common client questions, forwarding complex issues to the right team member, and maintaining professional communication standards.

### Calendar Ownership Fallbacks (6 tasks)
1. **"Scheduling meetings and resolving time conflicts"** - Coordinating across time zones, finding mutually available slots, sending calendar invites, and managing reschedules without bothering you.
2. **"Protecting your high-energy blocks for deep work"** - Blocking focus time on your calendar, declining low-priority meeting requests, and structuring your week around your peak performance hours.
3. **"Preparing meeting briefs and agendas"** - Researching attendees, compiling relevant documents, creating agendas, and ensuring you walk into every meeting fully prepared.
4. **"Managing recurring appointment logistics"** - Handling weekly team meetings, monthly reviews, quarterly planning sessions, and annual events so they run on autopilot.
5. **"Scheduling personal appointments during business hours"** - Booking doctor visits, car service, home maintenance, and personal errands so they fit naturally into your calendar without disrupting work.
6. **"Coordinating travel schedules with calendar commitments"** - Aligning flight times, hotel check-ins, and ground transportation with your meeting schedule so travel days flow seamlessly.

### Personal Life Ownership Fallbacks (6 tasks)
1. **"Booking travel, hotels, and transportation"** - Researching options, comparing prices, booking flights and accommodations that match your preferences, and managing loyalty programs and upgrades.
2. **"Handling Amazon orders, returns, and household purchases"** - Managing your shopping lists, tracking deliveries, processing returns, and reordering household essentials before you run out.
3. **"Coordinating family logistics and activities"** - Managing school schedules, kids' activities, family events, doctor appointments, and ensuring nothing gets double-booked or forgotten.
4. **"Negotiating with service providers and vendors"** - Calling insurance companies, utility providers, contractors, and subscription services to resolve issues, negotiate rates, and handle renewals.
5. **"Managing gift purchases and special occasions"** - Tracking birthdays, anniversaries, and holidays, selecting appropriate gifts, and ensuring they arrive on time with personal touches.
6. **"Maintaining the Partnership Playbook with your preferences"** - Documenting your preferences for food, travel, communication style, and daily routines so your assistant can anticipate your needs.

### Recurring Business Processes Fallbacks (6 tasks)
1. **"Documenting SOPs using the camcorder method"** - Recording yourself doing a task once, transcribing it into a one-page playbook with non-negotiables, and handing it off permanently to your EA.
2. **"Tracking expenses and preparing financial summaries"** - Categorizing receipts, reconciling credit card statements, preparing expense reports, and flagging unusual charges for your review.
3. **"Updating CRM records and pipeline tracking"** - Entering new contacts, updating deal stages, logging meeting notes, and ensuring your sales pipeline data is always current and accurate.
4. **"Compiling weekly and monthly performance reports"** - Gathering KPIs from various tools, creating summary dashboards, and highlighting trends that need your attention.
5. **"Coordinating vendor onboarding and contract renewals"** - Managing new vendor setup, tracking contract expiration dates, collecting renewal quotes, and preparing comparison documents for your decision.
6. **"Managing recurring team communications and updates"** - Sending weekly team updates, distributing meeting notes, tracking action items, and ensuring team members follow through on commitments.

## Data Flow Changes

### New Data Types (add to layout-v2.ts or generator-v2.ts)
```typescript
type CoreFourArea = 'email' | 'calendar' | 'personal' | 'business';

interface CoreFourTaskGroup {
  area: CoreFourArea;
  title: string;               // "Email Ownership", "Calendar Ownership", etc.
  subtitle: string;            // "Your EA owns your inbox completely"
  accent: readonly [number, number, number];  // C.emailAccent, etc.
  tasks: PDFTask[];
}
```

### PDFReportData Extension
```typescript
export interface PDFReportData {
  // ... existing fields (daily_tasks, weekly_tasks, monthly_tasks remain for backward compat) ...

  // NEW: Core Four grouped tasks (Phase 3)
  core_four_groups?: CoreFourTaskGroup[];
}
```

### Generator-v2.ts Transform Changes
The `transformToPDFData` function must:
1. Collect ALL EA tasks across daily/weekly/monthly (not just 5 per frequency)
2. Run each through `inferCoreTaskType` to classify
3. Group into 4 Core Four buckets
4. Inject fallback tasks for thin buckets (minimum 4 tasks per area)
5. Populate `core_four_groups` on the returned PDFReportData

### Orchestrator Wiring Changes
```typescript
// In generateTimeFreedomReport:
// BEFORE (current after Phase 2):
buildSummaryPage(doc, data);           // Page 1: Cover + ROI
buildFrameworkPage(doc);               // Page 2: Three Pillars + Core Four
// ... 6 calls to buildTasksPage/buildFounderTasksPage (daily/weekly/monthly)
buildCTAPage(doc, userData);           // Last: CTA

// AFTER (Phase 3):
buildSummaryPage(doc, data);           // Page 1: Cover + ROI
buildFrameworkPage(doc);               // Page 2: Three Pillars + Core Four
buildCoreFourTaskPages(doc, data, userData);  // Pages 3+: Core Four tasks (flowing, multi-page)
buildCTAPageV2(doc, userData);         // Last: Full-page CTA
addFootersToAllPages(doc);             // Footers on all pages
```

## Y-Budget Analysis for Task Pages

Task pages are flowing (not fixed-layout), so the Y-budget is per-page, not per-section:

```
Per page (A4, safe zone = 20mm to 270mm = 250mm usable):

Core Four section header:           14mm
Gap after header:                    6mm
Task card (minimum):                35mm
Task card (2-line description):     38mm
Task card (3-line description):     43mm
Gap after task card:                 6mm

Tasks per page (with one section header):
  - Minimum-height tasks: (250 - 20) / 41 ≈ 5-6 tasks
  - Average-height tasks: (250 - 20) / 49 ≈ 4-5 tasks

With 24-40 total tasks across 4 areas: expect 5-8 pages of tasks.
checkPageBreak handles all page transitions automatically.
```

## Open Questions

1. **Should founder tasks ("You" tasks) appear in the Core Four pages?**
   - What we know: The current PDF shows "Delegating this frees you up to:" sections with founder tasks after each frequency group. The Core Four redesign is about what the EA owns, not what the founder does.
   - What's unclear: Whether founder tasks should be woven into the Core Four pages (e.g., as a "What this frees you up to do" subsection per area) or dropped entirely from the Core Four layout.
   - Recommendation: Drop founder tasks from the Core Four task pages. The Core Four pages are about creating overwhelm with EA tasks ("look at everything an EA would own"). Founder tasks dilute this effect. If founder tasks are desired, they could appear as a small callout on the CTA page (e.g., "Imagine instead focusing on: [strategic activities]"), but this is optional and could be Phase 5 refinement.

2. **Continuous task numbering or per-section numbering?**
   - What we know: TASK-04 says "task volume is deliberately large" -- continuous numbering (1 through 40) reinforces the overwhelm effect better than resetting to 1 per section.
   - What's unclear: Whether the number circle on each task should show global count or section-local count.
   - Recommendation: Use continuous numbering across all Core Four sections. Task 1 in Email Ownership, continuing to task 37 in Business Processes. The final number being 30+ is itself a persuasion device.

3. **Should the CTA page repeat on every page or only as the final page?**
   - What we know: The current `buildTasksPage` has a conditional inline CTA block (`renderCTABlock`) at the end of each frequency section if space permits. The Phase 3 CTA page (CTA-01, CTA-02, CTA-03) is the full-page final CTA.
   - What's unclear: Whether to keep the inline mini-CTAs at the bottom of task pages (when space allows) in addition to the final full-page CTA.
   - Recommendation: Include a small inline CTA after the last Core Four section (before the full CTA page) if there is space on the final task page. This provides a secondary touchpoint. But the FULL CTA page is always the last page.

4. **Exact wording for CTA page value proposition (CTA-03)**
   - What we know: CTA-03 requires reinforcing the Three Pillars value proposition. The existing CTA page has generic "Where to Start" copy.
   - What's unclear: The exact marketing copy for the CTA page.
   - Recommendation: The planner should specify exact copy in the plan. Draft: Headline "You Don't Have to Do This Alone", body reinforcing "Right Person + Right Process + Right Support = your time back", bullet points about what happens on a Time Audit call, and the booking button. The implementer should not have to write marketing copy.

5. **How to handle the triage vs. discovery calendar routing**
   - What we know: The web CTA section (`cta-section.tsx`) routes leads with "Under $500k" revenue to a triage calendar (`intro-call`) and everyone else to the discovery calendar (`simple-form-for-lead-magnet`). The PDF's current `buildBookingUrl` always uses the discovery calendar URL.
   - What's unclear: Whether the PDF should also route to the triage calendar for sub-$500k leads.
   - Recommendation: For Phase 3, keep the PDF CTA pointing to the discovery calendar (current behavior). The revenue range is available on `PDFReportData.revenue_range` (added in Phase 2) so conditional routing could be added later. The web page already handles triage routing for leads who reach it.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `web/src/lib/pdf/layout-v2.ts` -- all page builders, component renderers, data types, booking URL builder
- Direct codebase inspection of `web/src/lib/pdf/generator-v2.ts` -- data transformation, task separation logic, orchestrator
- Direct codebase inspection of `web/src/types/task.ts` -- Task interface with coreTaskType field, CoreTaskType union type
- Direct codebase inspection of `web/src/lib/ai/report-validator.ts` -- keyword detection functions for all four Core Four areas
- Direct codebase inspection of `web/src/lib/ai/report-fixer.ts` -- fallback core EA task templates, task injection patterns
- Direct codebase inspection of `web/src/lib/ai/prompts/time-freedom-prompt.ts` -- current AI output structure (no coreTaskType in prompt)
- Direct codebase inspection of `web/src/lib/roi-calculator.ts` -- TaskHours interface maps to Core Four areas (email, calendar, personalLife, businessProcesses)
- Direct codebase inspection of `web/src/components/thank-you/cta-section.tsx` -- triage vs discovery calendar routing logic, booking URL patterns
- Direct codebase inspection of `web/src/lib/email/template.ts` -- booking URL constant and builder
- Phase 1 research and plans (`.planning/phases/01-cleanup-foundation/`) -- C color constants, checkPageBreak utility, Core Four accent colors
- Phase 2 research and plans (`.planning/phases/02-cover-roi-framework/`) -- buildFrameworkPage, page builder pattern, PDFReportData extension
- `.planning/PROJECT.md` -- Core Four framework definition, emotional arc, deliberate overwhelm strategy
- `.planning/ROADMAP.md` -- Phase 3 requirements and success criteria, plan outlines
- `.planning/REQUIREMENTS.md` -- TASK-01 through TASK-06, CTA-01 through CTA-03 requirement definitions

### Secondary (MEDIUM confidence)
- Fallback task content drafts are original compositions based on the Core Four framework described in PROJECT.md. They need review for tone, specificity, and alignment with Assistant Launch's actual service descriptions.
- Y-budget calculations are estimates based on existing component heights measured from code. Actual rendered heights may vary by 2-5mm depending on font metrics.

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all work extends existing code
- Architecture (inference classifier): HIGH -- keyword lists proven in production (report-validator.ts), pattern is straightforward classification
- Architecture (page rendering): HIGH -- follows exact same patterns as existing buildTasksPage, checkPageBreak from Phase 1, accent colors from Phase 1
- Architecture (orchestrator wiring): HIGH -- replacing existing calls with new ones, well-documented in Phase 2 research
- Fallback content quality: MEDIUM -- drafted content needs user review for tone and marketing accuracy
- CTA copy: MEDIUM -- marketing copy should be confirmed by user before implementation
- Pitfalls: HIGH -- all pitfalls identified from actual code inspection and data flow analysis

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- no external dependency changes expected)
