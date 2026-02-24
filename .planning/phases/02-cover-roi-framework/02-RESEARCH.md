# Phase 2: Cover & ROI + Framework Page - Research

**Researched:** 2026-02-24
**Domain:** jsPDF page layout, static content rendering, data interface extension
**Confidence:** HIGH

## Summary

Phase 2 builds two new page builders in `layout-v2.ts` and wires them into `generator-v2.ts`. Page 1 (cover/ROI) is a redesign of the existing `buildSummaryPage` function. Page 2 (framework) is entirely new -- it renders static Three Pillars and Core Four educational content that is identical for every lead. Both pages depend on Phase 1's RGB tuple color system (`C` constant object) and `checkPageBreak` utility being in place.

The primary technical challenge is **fitting Three Pillars + Core Four on a single A4 page without overflow**. The A4 usable content area is 257mm (from y=20 to y=277, reserving footer space). Three Pillars needs approximately 3 items x ~28mm each = 84mm. Core Four needs 4 items x ~28mm each = 112mm. With section headers and spacing, the total is approximately 84 + 112 + 30 (headers/dividers/padding) = 226mm -- which fits within the 257mm budget with ~31mm to spare. This is tight but feasible, provided descriptions are kept concise (2-3 sentences max, no more than 3 wrapped lines at font size 10).

The cover page requires a minor data interface extension: the current `PDFReportData` does not include company name, business type, or revenue range -- fields needed for COVER-01 ("founder's name and company") and COVER-02 ("ROI breakdown based on revenue tier"). These fields already exist on `UnifiedLeadData` and flow through `generator-v2.ts`, so the change is to thread them into `PDFReportData` and pass them to the layout.

**Primary recommendation:** Split into two plans: (1) redesign the cover/ROI page by modifying `buildSummaryPage` and extending `PDFReportData` with company context fields, and (2) add a new `buildFrameworkPage` function with hardcoded Three Pillars and Core Four content, then wire the new page into the `generateTimeFreedomReport` orchestrator.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | (existing in project) | All PDF rendering -- text, shapes, colors | Already in use; all PDF work builds on it |
| TypeScript | (existing in project) | Type-safe interfaces for PDFReportData extension | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| layout-v2.ts | N/A (internal) | Component renderers (roundedRect, renderSectionTitle, etc.) | Reuse existing patterns for consistent visual language |
| roi-calculator.ts | N/A (internal) | ROI computation (ceoHourlyRate, annualRevenueUnlocked) | Cover page ROI data already flows through this |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded string content in layout-v2.ts | Separate content file (e.g., framework-content.ts) | Content file adds indirection; since content is small (7 items, ~200 words total) and FRAME-04 says it must be static, keeping it inline in the page builder is simpler and more discoverable. If content grows, extract later. |
| Modifying buildSummaryPage in place | New buildCoverPage function alongside old | Cleaner separation but requires updating the orchestrator. Either approach works; modifying in place minimizes file changes. |

**Installation:**
```bash
# No new packages needed -- all work is on existing code
```

## Architecture Patterns

### Recommended Project Structure
```
web/src/lib/pdf/
├── layout-v2.ts         # PRIMARY target -- add buildFrameworkPage, modify buildSummaryPage
├── generator-v2.ts      # Update transformToPDFData and generateTimeFreedomReport call sequence
├── design-system.ts     # Untouched (V1 era)
├── s3Service.ts         # Untouched
└── index.ts             # May need updated re-exports if new functions are exported
```

### Pattern 1: Page Builder Function Signature
**What:** Each page is a standalone function that receives `(doc: jsPDF, data: PDFReportData)` and calls `doc.addPage()` internally (or renders on the current page for page 1).
**When to use:** Every new page added to the PDF.
**Example:**
```typescript
// Source: existing pattern from layout-v2.ts buildSummaryPage (line 610)
export function buildSummaryPage(doc: jsPDF, data: PDFReportData): void {
  let y = 20;
  y = renderHeader(doc, y);
  // ... render components, advancing y
}

// New page follows same pattern:
export function buildFrameworkPage(doc: jsPDF): void {
  doc.addPage();
  let y = 20;
  // ... render Three Pillars, then Core Four
}
```

### Pattern 2: Component Renderer Return Convention
**What:** Every component renderer returns the next available y-position. Callers advance layout by assigning `y = renderXxx(doc, ..., y)`.
**When to use:** All rendering within a page builder.
**Example:**
```typescript
// Source: existing pattern throughout layout-v2.ts
y = renderSectionTitle(doc, 'Three Pillars', '', y);
y = renderPillarItem(doc, 'Right Person', '...description...', y);
// y is now past the pillar item, ready for next element
```

### Pattern 3: Static Content as Module Constants
**What:** Framework text content (Three Pillars descriptions, Core Four descriptions) defined as typed constant arrays at the top of the page builder or in the function body.
**When to use:** When content is identical for every lead (FRAME-04 requirement).
**Example:**
```typescript
const THREE_PILLARS = [
  {
    title: 'Right Person',
    description: 'Trained on Buy Back Your Time principles...',
  },
  // ...
] as const;

// Render in loop
THREE_PILLARS.forEach((pillar) => {
  y = renderPillarItem(doc, pillar.title, pillar.description, y);
});
```

### Pattern 4: PDFReportData Extension for Company Context
**What:** Add optional fields to the existing PDFReportData interface for company name and revenue range. The cover page renders them if present, degrades gracefully if absent.
**When to use:** When the cover page needs data not currently in the interface.
**Example:**
```typescript
// In layout-v2.ts PDFReportData interface
export interface PDFReportData {
  // Existing fields...
  client_name: string;

  // NEW fields for cover page (COVER-01)
  company_name?: string;       // From leadData.businessType or companyAnalysis
  revenue_range?: string;      // From leadData.revenue (e.g. "$500k-$1M")
  ceo_hourly_rate?: number;    // From roi-calculator for "$X/hr work" messaging
}

// In generator-v2.ts transformToPDFData
const pdfData: PDFReportData = {
  // ...existing mappings...
  company_name: leadData.businessType || undefined,
  revenue_range: options.revenueRange || undefined,
  ceo_hourly_rate: roi?.ceoHourlyRate || undefined,
};
```

### Anti-Patterns to Avoid
- **AI-generating framework content:** FRAME-04 explicitly requires static content. Do NOT pass Three Pillars / Core Four text through any AI generation step. Hardcode it.
- **Splitting Three Pillars and Core Four across two pages:** FRAME-03 requires they combine on a single page. The layout must be compact enough to fit both.
- **Ignoring the y-budget for page 2:** The single biggest risk is content overflow. Each description must be measured against available space. If descriptions are too long, they will push Core Four off the page.
- **Using the old hex `COLORS` object or `setColor` function:** Phase 1 removes these. Phase 2 must use `doc.setFillColor(...C.accent)` pattern exclusively.
- **Hardcoding RGB values directly:** All colors must reference the `C` constant object, never inline `doc.setFillColor(13, 115, 119)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text wrapping / line measurement | Custom character counting | `doc.splitTextToSize(text, maxWidth)` | jsPDF's built-in method accounts for actual font metrics; the existing `wrapText` function in layout-v2.ts uses character counting which is less accurate |
| Rounded rectangles | Canvas-path manual drawing | `doc.roundedRect(x, y, w, h, rx, ry, style)` | Already wrapped in layout-v2.ts helper; jsPDF supports this natively |
| Page overflow detection | Ad-hoc `if (y > 260)` checks | Phase 1's `checkPageBreak(doc, y, height)` utility | Centralized, configurable, consistent |
| Currency formatting | String concatenation `"$" + amount` | Existing `formatCurrency(amount)` in layout-v2.ts | Handles thousands separators, no decimals, consistent |

**Key insight:** The existing `layout-v2.ts` already has well-established component renderers (renderHeader, renderClientBlock, renderHeroMetric, renderMetricsRow, renderAnalysisBlock, renderInvestmentBlock) that can be reused or adapted for the cover page. The framework page needs new renderers but should follow the same patterns (receive y, return y, use C colors, use doc.splitTextToSize for text measurement).

## Common Pitfalls

### Pitfall 1: Three Pillars + Core Four Overflowing Page 2
**What goes wrong:** The combined content exceeds 257mm of usable vertical space, causing Core Four boxes to extend past the footer area or get cut off.
**Why it happens:** Description text that wraps to 4+ lines per item, excessive spacing between items, or section headers consuming too much vertical space.
**How to avoid:** Pre-calculate the y-budget before writing any code:
- Page top: y = 20mm
- Page section title: ~15mm
- Three Pillars (3 items): 3 x ~25-28mm = 75-84mm
- Divider/spacing: ~8mm
- Core Four section title: ~12mm
- Core Four (4 boxes): 4 x ~25-28mm = 100-112mm OR 2x2 grid layout at ~60mm
- Footer reserve: y must not exceed ~270mm
- Total needed: 20 + 15 + 84 + 8 + 12 + 112 = 251mm (fits in 270mm with 19mm buffer)
**Warning signs:** Running `checkPageBreak` inside the framework page -- if it triggers, the content is too tall and needs to be compressed rather than paginated.

### Pitfall 2: PDFReportData Extension Breaking Existing Callers
**What goes wrong:** Adding required fields to PDFReportData causes TypeScript errors in generator-v2.ts or test files that construct PDFReportData objects.
**Why it happens:** New fields added as required instead of optional.
**How to avoid:** ALL new fields on PDFReportData must be optional (`?`). The cover page renderer should have fallback behavior when fields are absent (e.g., omit company name line, use generic wording if no revenue range). The generator-v2.ts `transformToPDFData` function populates them from `UnifiedLeadData` when available.
**Warning signs:** TypeScript errors after interface change; existing PDF generation breaks.

### Pitfall 3: Cover Page ROI Display Inconsistency with Current Build
**What goes wrong:** The redesigned cover page shows different ROI numbers than the current summary page, confusing users who compare versions.
**Why it happens:** Changing the ROI calculation logic or defaults during the redesign.
**How to avoid:** Keep the ROI calculation path unchanged -- same defaults in generator-v2.ts (annualValue=195000, weeklyHours=10, eaInvestment=33000 when no ROI data provided). Only change the visual presentation and what data is displayed, not how it is computed.
**Warning signs:** Different dollar amounts appearing on cover page vs what the existing buildSummaryPage would show for the same lead data.

### Pitfall 4: Framework Content Not Actually Fitting the Design
**What goes wrong:** The Three Pillars and Core Four descriptions from PROJECT.md are too long or too detailed to fit in the compact visual boxes planned for a single page.
**Why it happens:** The PROJECT.md descriptions are detailed (suitable for a discovery call script), not concise (suitable for a PDF box with limited vertical space).
**How to avoid:** Write PDF-specific copy for each item. Each pillar description should be 2-3 concise sentences (no more than 3 lines at font size 10 with ~150mm text width). Each Core Four box description should be 1-2 sentences. Pre-measure with `doc.splitTextToSize()` to confirm line counts.
**Warning signs:** Descriptions wrapping to 4+ lines per item; total page content exceeding 250mm.

### Pitfall 5: Forgetting to Wire New Pages into the Orchestrator
**What goes wrong:** `buildFrameworkPage` is created but never called -- the PDF output does not include the new page.
**Why it happens:** The page builder function exists in layout-v2.ts but `generateTimeFreedomReport` in layout-v2.ts (the orchestrator) is not updated to call it.
**How to avoid:** After creating the page builder, immediately update `generateTimeFreedomReport` to call it in the correct position (after page 1, before task pages). Also update `generator-v2.ts` if needed to pass additional data.
**Warning signs:** PDF generates without errors but only has the same pages as before.

### Pitfall 6: Font/Size Inconsistency Between Cover and Framework Pages
**What goes wrong:** The cover page uses different font sizes or spacing conventions than the framework page, creating visual inconsistency.
**Why it happens:** Building two pages in separate sessions without referencing the same design token system.
**How to avoid:** Both pages should reference the same font size hierarchy already established in layout-v2.ts: 26pt for page title, 22pt for section title, 18pt for names, 13pt for item headings, 11pt for body, 10pt for secondary body, 9pt for captions/labels. Do not invent new sizes.
**Warning signs:** New font sizes appearing that are not used elsewhere in layout-v2.ts.

## Code Examples

Verified patterns from the existing codebase:

### Current buildSummaryPage (to be redesigned as cover/ROI page)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 610-628
export function buildSummaryPage(doc: jsPDF, data: PDFReportData): void {
  let y = 20;
  y = renderHeader(doc, y);          // Brand + title (30mm)
  y += 3;
  y = renderClientBlock(doc, data.client_name, data.date, y);  // Name + date (25mm)
  y += 8;
  y = renderHeroMetric(doc, formatCurrency(data.annual_value), '...', y);  // Big number (40mm)
  y += 8;
  y = renderMetricsRow(doc, [...], y);  // Three metric boxes (38mm)
  y += 5;
  y = renderAnalysisBlock(doc, 'Summary Analysis', data.analysis_text, y);  // Text block (~30-40mm)
  y += 3;
  renderInvestmentBlock(doc, data.annual_value, data.ea_investment, data.net_return, data.roi_multiplier, y);  // ROI table (52mm)
}
// Total estimated height: ~225-245mm on A4 (fits within 270mm safe zone)
```

### Current PDFReportData Interface (to be extended)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 119-136
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
}
// MISSING for Phase 2: company_name, revenue_range, ceo_hourly_rate
```

### How Data Flows from API Route to PDF Layout
```typescript
// Source: web/src/app/api/generate-pdf/route.ts lines 102-113
// The API route constructs UnifiedLeadData with these fields:
const leadData: UnifiedLeadData = {
  leadType: 'main',
  firstName: userData.firstName || '',   // Available for cover
  lastName: userData.lastName || '',      // Available for cover
  email: userData.email || '',
  phone: userData.phone || '',
  title: userData.title || '',
  businessType: userData.businessType || userData.company || '',  // Company context
  website: userData.website || '',
};

// Source: web/src/lib/pdf/generator-v2.ts lines 77-80
// transformToPDFData currently does NOT pass businessType/revenue to PDFReportData
// Phase 2 must add: company_name from leadData.businessType
//                    revenue_range from options.revenueRange
//                    ceo_hourly_rate from roi.ceoHourlyRate
```

### Existing Component Renderers Reusable for Cover Page
```typescript
// These existing renderers can be reused directly on the redesigned cover page:
renderHeader(doc, y)           // Brand bar + "Time Freedom Report" title
renderClientBlock(doc, name, date, y)  // "Prepared for [Name]" + date
renderHeroMetric(doc, value, label, y) // Large dollar amount display
renderMetricsRow(doc, metrics, y)      // Three side-by-side metric boxes
renderInvestmentBlock(doc, ...)        // ROI calculation table

// These may need adaptation:
renderAnalysisBlock(doc, title, text, y) // Left accent bar + text -- could use for "hours lost" messaging
renderSectionTitle(doc, title, subtitle, y) // Section headers -- reuse for framework page
```

### Framework Content Rendering Pattern (new)
```typescript
// Proposed pattern for Three Pillars rendering
// Uses existing roundedRect + text patterns from layout-v2.ts

function renderPillarItem(
  doc: jsPDF,
  number: number,
  title: string,
  description: string,
  y: number,
): number {
  const itemHeight = 25; // Conservative estimate

  // Number circle (same pattern as renderTaskCard)
  doc.setFillColor(...C.accent);
  doc.circle(MARGIN + 5, y + 5, 5, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(String(number), MARGIN + 5, y + 6.2, { align: 'center' });

  // Title
  doc.setTextColor(...C.ink);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 16, y + 7);

  // Description (wrapped)
  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(description, CONTENT_WIDTH - 16);
  let lineY = y + 14;
  for (const line of lines) {
    doc.text(line, MARGIN + 16, lineY);
    lineY += 4.5;
  }

  return y + Math.max(itemHeight, 14 + lines.length * 4.5 + 4);
}
```

### Core Four Box Rendering Pattern (new)
```typescript
// Proposed pattern for Core Four visual boxes
// Two layout options:

// Option A: Stacked (4 boxes vertically, ~28mm each = 112mm total)
function renderCoreFourBox(
  doc: jsPDF,
  title: string,
  description: string,
  accentColor: readonly [number, number, number],
  y: number,
): number {
  const boxHeight = 25;

  // Accent bar on left
  doc.setFillColor(...accentColor);
  doc.rect(MARGIN, y, 2, boxHeight, 'F');

  // Background
  doc.setFillColor(...C.background);
  doc.roundedRect(MARGIN + 3, y, CONTENT_WIDTH - 3, boxHeight, 2, 2, 'F');

  // Title
  doc.setTextColor(...C.ink);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN + 8, y + 8);

  // Description
  doc.setTextColor(...C.inkSecondary);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(description, CONTENT_WIDTH - 12);
  doc.text(lines.slice(0, 2), MARGIN + 8, y + 15);

  return y + boxHeight + 4;
}

// Option B: 2x2 Grid (saves ~50mm vertical space)
// Two boxes per row, each (CONTENT_WIDTH - 8) / 2 = 81mm wide
// Total height: 2 rows x ~30mm = 60mm
// This is the RECOMMENDED layout if vertical space is tight.
```

## Page 2 Y-Budget Analysis

This is the critical calculation for FRAME-03 (everything on one page):

```
Position  Element                      Height (mm)
────────  ─────────────────────────────  ──────────
y = 20    Page start
          Section title "The Framework"  12
y = 32    Spacing                        5
          Pillar 1: Right Person         28
y = 65    Pillar 2: Right Process        28
y = 93    Pillar 3: Right Support        28
y = 121   Section divider               8
          Section title "Core Four"      12
y = 141   Core Four Box 1: Email        27
y = 168   Core Four Box 2: Calendar     27
y = 195   Core Four Box 3: Personal     27
y = 222   Core Four Box 4: Business     27
y = 249   ─── End of content ───
y = 270   ─── Safe bottom (footer) ───

Margin: 270 - 249 = 21mm buffer (FITS)
```

With a 2x2 grid for Core Four:
```
y = 141   Core Four Row 1 (Email + Calendar)   32
y = 173   Core Four Row 2 (Personal + Business) 32
y = 205   ─── End of content ───

Margin: 270 - 205 = 65mm buffer (FITS EASILY)
```

**Recommendation:** Start with vertically stacked boxes (simpler to implement, proven pattern). Only switch to 2x2 grid if stacked layout overflows during testing.

## Data Interface Changes Required

### PDFReportData Extension
```typescript
// Fields to ADD (all optional for backward compatibility):
export interface PDFReportData {
  // ... existing fields unchanged ...

  // Cover page context (COVER-01)
  company_name?: string;       // From UnifiedLeadData.businessType
  revenue_range?: string;      // From GeneratorV2Options.revenueRange (e.g., "$500k-$1M")

  // ROI display (COVER-02)
  ceo_hourly_rate?: number;    // From roi-calculator, for "$X/hr work" copy
}
```

### generator-v2.ts Data Threading
```typescript
// In transformToPDFData, ADD these lines:
company_name: leadData.businessType || undefined,
revenue_range: options?.revenueRange || undefined,  // Need to thread options through
ceo_hourly_rate: roi?.ceoHourlyRate || undefined,
```

**Note:** `transformToPDFData` currently does not receive `options` -- it receives `(report, leadData, roi)`. The `revenueRange` is on the `options` object. Either (a) pass `revenueRange` separately, or (b) get it from the ROI object (`roi.revenueRange` exists on the ROICalculation interface).

Looking at the ROICalculation interface in `roi-calculator.ts` (line 91): `revenueRange: string` IS already a field on the returned ROI object. So `roi?.revenueRange` provides the value without needing to thread options through.

## Orchestrator Wiring Changes

The `generateTimeFreedomReport` function in layout-v2.ts (lines 756-828) currently calls:
1. `buildSummaryPage(doc, data)` -- page 1
2. `buildTasksPage(...)` -- daily tasks (page 2)
3. `buildFounderTasksPage(...)` -- daily founder tasks (page 3)
4. `buildTasksPage(...)` -- weekly tasks (page 4)
5. `buildFounderTasksPage(...)` -- weekly founder tasks (page 5)
6. `buildTasksPage(...)` -- monthly tasks (page 6)
7. `buildFounderTasksPage(...)` -- monthly founder tasks (page 7)
8. `buildCTAPage(doc, userData)` -- CTA (last page)
9. `addFootersToAllPages(doc)` -- footers on all pages

Phase 2 needs to insert `buildFrameworkPage(doc)` after `buildSummaryPage` and before the task pages. This shifts all subsequent page numbers up by 1. The task pages themselves are not modified in Phase 2 (that is Phase 3's responsibility).

**Change:**
```typescript
// Page 1: Cover + ROI (modified buildSummaryPage)
buildSummaryPage(doc, data);

// Page 2: Framework (NEW)
buildFrameworkPage(doc);

// Page 3+: Tasks (unchanged, just shifted)
if (data.daily_tasks.length > 0) {
  buildTasksPage(doc, data.daily_tasks, ...);
}
// ... rest unchanged
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single summary page with ROI | Same (current state) | Before this phase | Phase 2 redesigns this |
| No framework content in PDF | No framework content (current state) | N/A | Phase 2 adds this |
| Hex string colors | RGB tuple C constants (Phase 1) | Phase 1 (prerequisite) | Phase 2 uses C.xxx everywhere |
| No page overflow protection | checkPageBreak utility (Phase 1) | Phase 1 (prerequisite) | Available but framework page should not need it (single-page content) |

**Deprecated/outdated:**
- `buildSummaryPage` name may be misleading after redesign -- consider renaming to `buildCoverPage` for clarity, but this is optional
- `setColor` function and `COLORS` hex object -- deleted in Phase 1, must not be referenced

## Open Questions

1. **Cover page visual layout: redesign or refinement?**
   - What we know: COVER-03 says "refreshed visual design consistent with new color system." The current `buildSummaryPage` has a clean layout with header, client block, hero metric, metrics row, analysis block, and investment block. All of these components exist and work.
   - What's unclear: How dramatically the cover page visual structure should change. The requirements say "displays personalized cover" and "shows ROI breakdown" -- both of which the current page already does.
   - Recommendation: Keep the existing component structure (renderHeader, renderClientBlock, renderHeroMetric, etc.) but (a) add company name display, (b) add revenue-tier-specific language (e.g., "You're spending X hours/week on $15/hr work when your time is worth $Y/hr"), (c) ensure all colors use the new C constants. This is a refinement, not a rebuild. A more dramatic visual overhaul belongs in Phase 5 (visual design).

2. **Core Four accent colors: use Phase 1 placeholders or define final values?**
   - What we know: Phase 1 research defined placeholder colors: blue (#3B82F6) for email, purple (#A855F7) for calendar, amber (#EAB308) for personal, green (#22C55E) for business. The Phase 1 plan includes these in the C constant object with "placeholder -- confirm with design" comments.
   - What's unclear: Whether to use these placeholders as-is in Phase 2's framework page or wait for Phase 5's design process.
   - Recommendation: Use the placeholder colors in Phase 2. They provide visual distinction (the primary goal). Phase 5 can refine them. The C constant makes swapping trivial -- change one value, all usages update.

3. **Should the framework page have a header/footer consistent with the cover page?**
   - What we know: The current `addFootersToAllPages` function adds footers to every page. The cover page has `renderHeader` (brand + title). Task pages do NOT have a header -- they start directly with section title.
   - What's unclear: Whether page 2 (framework) should repeat the brand header or start clean like task pages.
   - Recommendation: Framework page should NOT repeat the full header (it would waste 30mm of precious vertical space on a page that needs to fit 7 items). Instead, use a minimal brand tag or section title at the top. The footer will be added automatically by `addFootersToAllPages`.

4. **Three Pillars copy: what exact wording?**
   - What we know: PROJECT.md has detailed descriptions suitable for a discovery call. The PDF needs 2-3 concise sentences per pillar.
   - What's unclear: The exact PDF-ready copy.
   - Recommendation: The planner should specify exact copy in the plan. Draft copy based on PROJECT.md, condensed to 2-3 sentences each. The implementer should not need to write marketing copy.

## Three Pillars PDF Copy (Draft)

Based on PROJECT.md, condensed for PDF (2-3 sentences each, targeting 2-3 wrapped lines at 10pt on 154mm width):

**1. Right Person**
"Your EA must be trained in proven delegation frameworks, not just task execution. We place assistants skilled in email management, calendar optimization, personal life coordination, and business process ownership -- so they can think ahead, not just follow instructions."

**2. Right Process & Systems**
"Even a talented assistant will fail without the right systems. Our EAs deploy the Email GPS framework, calendar energy management, and documented playbooks for every recurring task -- turning chaos into repeatable workflows."

**3. Right Support**
"Delegation is not 'set it and forget it.' Assistant Launch provides active daily oversight, communication rhythm tracking, and ongoing integration support -- so your EA relationship improves every week, not just the first."

## Core Four PDF Copy (Draft)

Based on PROJECT.md, condensed for PDF (1-2 sentences each):

**1. Email Ownership**
"Your assistant triages everything using the Email GPS system -- 7 folders, zero inbox for you. You review only what matters during a quick daily standup."

**2. Calendar Ownership**
"Your assistant manages energy, not just time. They schedule two weeks ahead, protect your highest-value hours, and ensure your calendar reflects your priorities."

**3. Personal Life Ownership**
"Hotels, flights, Amazon returns, family logistics -- all handled. Enabled by the Partnership Playbook, a detailed document that captures your preferences and routines."

**4. Recurring Business Processes**
"Every repetitive task becomes a one-page playbook using the camcorder method: record yourself doing it once, and your assistant owns it forever."

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `web/src/lib/pdf/layout-v2.ts` (all component renderers, page builders, data interfaces)
- Direct codebase inspection of `web/src/lib/pdf/generator-v2.ts` (data transformation, orchestrator flow)
- Direct codebase inspection of `web/src/app/api/generate-pdf/route.ts` (available lead data fields)
- Direct codebase inspection of `web/src/types/task.ts` and `web/src/types/lead.ts` (data types)
- Direct codebase inspection of `web/src/lib/roi-calculator.ts` (ROICalculation interface, ceoHourlyRate field availability)
- Phase 1 research and plans (`.planning/phases/01-cleanup-foundation/01-RESEARCH.md`, `01-01-PLAN.md`, `01-02-PLAN.md`)
- `.planning/PROJECT.md` (Three Pillars and Core Four framework content)
- `.planning/ROADMAP.md` (Phase 2 requirements and success criteria)
- A4 page dimensions: 210mm x 297mm (standard, verified from layout-v2.ts PAGE_WIDTH and PAGE_HEIGHT constants)

### Secondary (MEDIUM confidence)
- Y-budget calculations are estimates based on existing component heights measured from code. Actual rendered heights may vary slightly depending on text wrapping with helvetica font metrics.
- Draft copy for Three Pillars and Core Four is paraphrased from PROJECT.md -- may need user review for tone and accuracy.

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all work extends existing code
- Architecture: HIGH -- patterns directly extracted from existing layout-v2.ts component renderers and page builders
- Pitfalls: HIGH -- overflow risk quantified with actual mm calculations; data interface extension verified against existing types
- Content copy: MEDIUM -- drafted from PROJECT.md but needs user confirmation for final wording
- Y-budget calculations: MEDIUM -- based on font size to mm conversion estimates; actual jsPDF rendering may differ by 2-5mm

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- no external dependency changes expected)
