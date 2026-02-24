# Architecture Research

**Domain:** PDF report redesign within existing Next.js app (EA Time Freedom Report)
**Researched:** 2026-02-23
**Confidence:** HIGH — all findings from direct codebase inspection

---

## Standard Architecture

### Current System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  thank-you-content.tsx                                        │   │
│  │  - Reads URL params (formData)                                │   │
│  │  - Calls /api/generate-tasks  →  TaskGenerationResult        │   │
│  │  - Calls /api/generate-pdf    →  base64 PDF + blobUrl        │   │
│  │  - Calls /api/send-email      →  email with PDF attachment    │   │
│  │  - Calls /api/close/update-lead → CRM update (non-blocking)  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │ POST /api/generate-tasks           │ POST /api/generate-pdf
         ▼                                    ▼
┌────────────────────────┐        ┌─────────────────────────────────┐
│  generate-tasks/route  │        │  generate-pdf/route             │
│  - validateRequestBody │        │  - Reconstructs TaskGenResult   │
│  - generateTasks()     │        │  - Constructs UnifiedLeadData   │
│  - validateReport()    │        │  - Calls generatePDFV2()        │
│  - fixReportIssues()   │        │  - Uploads to Vercel Blob       │
│  - ensureCoreEATasks() │        │  - Returns base64 + blobUrl     │
└────────────┬───────────┘        └───────────────┬─────────────────┘
             │                                    │
             ▼                                    ▼
┌────────────────────────┐        ┌─────────────────────────────────┐
│  AI Layer              │        │  PDF Layer (ACTIVE = V2 only)   │
│  task-generator.ts     │        │                                 │
│  - enrichWithWebsite() │        │  generator-v2.ts                │
│  - buildPromptFor()    │        │  - transformToPDFData()         │
│  - attemptGeneration() │        │  - calls generateTimeFreedom    │
│    (3-level fallback)  │        │    Report() in layout-v2.ts     │
│                        │        │                                 │
│  claude-client.ts      │        │  layout-v2.ts                   │
│  - generateWithClaude()│        │  - buildSummaryPage()           │
│  - parseClaudeResponse │        │  - buildTasksPage() x3          │
│                        │        │  - buildFounderTasksPage() x3   │
│  prompts/              │        │  - buildCTAPage()               │
│  - time-freedom-prompt │        │  - addFootersToAllPages()       │
│  - serialize-lead.ts   │        │                                 │
│  - fallback-prompts.ts │        │  DEAD (not called anywhere):    │
└────────────────────────┘        │  generator.ts + layout.ts       │
                                  └─────────────────────────────────┘
```

### Current Task Data Structure

The AI returns `TaskGenerationResult`:

```typescript
// web/src/types/task.ts
interface TaskGenerationResult {
  tasks: {
    daily: Task[];    // 8 tasks: 5 EA (isEA:true) + 3 Founder (isEA:false)
    weekly: Task[];   // 8 tasks: 5 EA + 3 Founder
    monthly: Task[];  // 8 tasks: 5 EA + 3 Founder
  };
  ea_task_percent: number;  // 63 (15/24)
  ea_task_count: number;    // 15
  total_task_count: number; // 24
  summary: string;
}

interface Task {
  title: string;
  description: string;
  owner: 'EA' | 'You';
  isEA: boolean;
  category: string;         // Communication|Scheduling|Operations|Strategy|...
  // Optional: coreTaskType, frequency, priority, timeEstimate, etc.
}
```

### Current PDF Structure (V2 Active)

The current layout renders pages in this order:
1. Page 1: Summary (header, client, hero metric, ROI metrics row, analysis block, investment block)
2. Page 2: Daily EA Tasks (top 5, renderTaskCard per task)
3. Page 3: Daily Founder Tasks (what delegation frees them for)
4. Page 4: Weekly EA Tasks (top 5)
5. Page 5: Weekly Founder Tasks
6. Page 6: Monthly EA Tasks (top 5)
7. Page 7: Monthly Founder Tasks
8. Page 8: CTA page (Next Steps)

The current `transformToPDFData()` in `generator-v2.ts` separates tasks by:
- EA tasks (`isEA === true`): goes to `daily_tasks`, `weekly_tasks`, `monthly_tasks`
- Founder tasks (`isEA === false`): goes to `daily_founder_tasks`, `weekly_founder_tasks`, `monthly_founder_tasks`

The current `PDFReportData` interface in `layout-v2.ts` is:
```typescript
interface PDFReportData {
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
```

---

## Change vs. Don't Touch Map

### DO NOT TOUCH (Zero Changes Allowed)

| File | Why |
|------|-----|
| `web/src/components/thank-you/thank-you-content.tsx` | Landing on report page — client-facing, calls the APIs |
| `web/src/app/api/generate-tasks/route.ts` | API contract must stay stable |
| `web/src/app/api/send-email/route.ts` | Email delivery, unrelated to PDF content |
| `web/src/app/api/close/` (all files) | CRM integration, unrelated |
| `web/src/lib/ai/task-generator.ts` | Core AI orchestration layer |
| `web/src/lib/ai/claude-client.ts` | AI client, no changes needed |
| `web/src/lib/ai/report-validator.ts` | Validates 24-task / 63% structure |
| `web/src/lib/ai/report-fixer.ts` | Auto-fix logic |
| `web/src/types/task.ts` | Shared type — `Task` and `TaskGenerationResult` |
| `web/src/types/pdf.ts` | `PDFGenerationResult` used by route.ts |
| `web/src/lib/pdf/generator.ts` | V1 — dead code, leave alone |
| `web/src/lib/pdf/layout.ts` | V1 — dead code, leave alone |
| All landing page files, form files, other components | CRITICAL CONSTRAINT |

### MAY CHANGE (PDF Pipeline Only)

| File | What Changes |
|------|--------------|
| `web/src/lib/pdf/layout-v2.ts` | Primary change target — new page builders, new data fields |
| `web/src/lib/pdf/generator-v2.ts` | `transformToPDFData()` — add Core Four grouping logic |
| `web/src/lib/ai/prompts/time-freedom-prompt.ts` | Optional: add `coreFour` area field to output schema |
| `web/src/lib/ai/prompts/serialize-lead.ts` | No structural change needed |
| `web/src/lib/ai/prompts/fallback-prompts.ts` | No structural change needed |
| `web/src/lib/pdf/design-system.ts` | Optional: add new color tokens for Core Four boxes |
| `web/src/app/api/generate-pdf/route.ts` | Unlikely to need changes; only if new request fields needed |

---

## Proposed Architecture: Modify V2 In Place (Recommended)

**Verdict: Modify V2 in place. Do NOT create a V3.**

Rationale:
- The V2 functions (`buildTasksPage`, `buildFounderTasksPage`, `buildCTAPage`, etc.) are independent, composable renderers. New page types can be added alongside them without disrupting existing ones.
- `generateTimeFreedomReport()` in `layout-v2.ts` is the single orchestrator function — it is the only place page order is defined. The page redesign only requires changing what gets called here, in what order.
- `transformToPDFData()` in `generator-v2.ts` is the single data-shaping function — all Core Four grouping logic belongs here.
- Creating a V3 would duplicate rendering primitives (`roundedRect`, `setColor`, `wrapText`, `renderHeader`, `renderFooter`, etc.) with no benefit. V2 primitives are already clean.

---

## Proposed Data Flow: Current vs. New

### Current Data Flow

```
Claude API response (JSON)
    → TaskGenerationResult { tasks: { daily, weekly, monthly } }
    → generate-tasks/route.ts returns { success: true, data: result }
    → thank-you-content.tsx passes tasks to /api/generate-pdf
    → generate-pdf/route.ts reconstructs TaskGenerationResult
    → generatePDFV2(report, leadData, options)
        → transformToPDFData()
            separates by isEA flag → daily_tasks (EA), daily_founder_tasks (Founder)
        → generateTimeFreedomReport(doc, pdfData)
            Page order: Summary → Daily EA → Daily Founder → Weekly EA → Weekly Founder → Monthly EA → Monthly Founder → CTA
```

### Proposed Data Flow (Core Four)

```
Claude API response (JSON)
    → TaskGenerationResult { tasks: { daily, weekly, monthly } }
        Each Task has: title, description, owner, isEA, category, [coreTaskType?]
    → generate-tasks/route.ts: NO CHANGE
    → thank-you-content.tsx: NO CHANGE
    → generate-pdf/route.ts: NO CHANGE (or minor: pass new flag)
    → generatePDFV2(report, leadData, options)
        → transformToPDFData()  [MODIFIED]
            NEW: group EA tasks by Core Four area (email, calendar, personal, business)
            NEW: add core_four_tasks: { email: PDFTask[], calendar: PDFTask[], personal: PDFTask[], business: PDFTask[] }
            KEEP: existing daily/weekly/monthly fields for fallback
        → generateTimeFreedomReport(doc, pdfData)  [MODIFIED orchestration]
            NEW Page order:
            Page 1: Summary (unchanged)
            Page 2: Three Pillars framework section (static, NEW)
            Page 3: Core Four ownership boxes (static visual, NEW)
            Page 4: Email Management tasks (Core Four area 1)
            Page 5: Calendar & Scheduling tasks (Core Four area 2)
            Page 6: Personal Life tasks (Core Four area 3)
            Page 7: Business Processes tasks (Core Four area 4)
            Page 8: Strong CTA page (redesigned)
```

### Core Four Grouping Logic (in transformToPDFData)

The `Task.category` field already contains values like `Communication`, `Scheduling`, `Operations`, `Personal`. The `Task.coreTaskType` optional field (`emailManagement`, `calendarManagement`, `personalLifeManagement`, `businessProcessManagement`) is the canonical mapping.

Grouping strategy for `transformToPDFData()`:
1. First preference: use `task.coreTaskType` if present
2. Second preference: infer from `task.category` (e.g., `Communication` → email area)
3. Third preference: infer from `task.title` keywords (existing logic in generator-v2.ts already does this for `time_saved` calculation)
4. Fallback: distribute evenly across four areas

This grouping logic lives entirely within `generator-v2.ts::transformToPDFData()` — it does not require any change to the AI prompt or the `Task` type.

---

## AI Prompt Change Strategy

### Option A: No Prompt Changes (Preferred for Phase 1)

The existing `coreTaskType` field is already in the `Task` interface (optional). The AI sometimes populates it; when it does not, the grouping falls back to category/title inference. This approach:
- Zero blast radius to generate-tasks pipeline
- Works with current 24-task output structure
- Can be done entirely in `transformToPDFData()`

**Risk:** Grouping by inference may occasionally be imprecise. Acceptable for a PDF report.

### Option B: Prompt Change (If Precision Required)

Modify `time-freedom-prompt.ts` to add `coreTaskType` as a required field in the JSON schema. This ensures clean grouping with no inference needed.

**Impact:**
- Only `web/src/lib/ai/prompts/time-freedom-prompt.ts` changes
- The JSON response structure adds one field per task — backward compatible with existing validator
- `report-validator.ts` validates task counts (24 total), NOT field names — so no validator change needed
- `report-fixer.ts` only patches task counts — no change needed
- The fallback prompts (`fallback-prompts.ts`, `buildEmergencyPrompt`) do NOT need updating since they produce a degenerate output that the grouping fallback handles

**Recommended:** Do Option A first. Upgrade to Option B in a later phase if grouping quality is insufficient.

---

## New Page/Component Inventory

These are the new renderers to add to `layout-v2.ts`:

| New Function | Description | Dependencies |
|---|---|---|
| `buildThreePillarsPage(doc)` | Static framework section — Right Person, Right Process, Right Support | Uses existing `setColor`, `roundedRect`, `renderHeader` primitives |
| `buildCoreFourOwnershipPage(doc, data)` | 4 boxes showing Core Four areas with task counts | Uses `PDFReportData` for counts; new visual layout |
| `buildCoreFourTasksPage(doc, tasks, areaName, areaIcon, userData)` | One page per Core Four area, tasks listed | Replaces/extends existing `buildTasksPage()` |
| `buildStrongCTAPage(doc, userData, data)` | Full-page CTA with urgency copy, ROI summary, booking button | Replaces existing `buildCTAPage()` |

The existing `buildFounderTasksPage()` may be repurposed or eliminated depending on whether the new design retains "what this frees you up for" content.

---

## New Data Shape in PDFReportData

Add to `PDFReportData` interface in `layout-v2.ts`:

```typescript
// NEW fields for Core Four redesign
core_four_tasks?: {
  email: PDFTask[];       // Email & Communication tasks
  calendar: PDFTask[];    // Calendar & Scheduling tasks
  personal: PDFTask[];    // Personal Life & Logistics tasks
  business: PDFTask[];    // Business Processes & Operations tasks
};

// Static content flags (no data needed — page builders handle copy)
// (no new fields required for Three Pillars — fully static)
```

These fields are optional. `generateTimeFreedomReport()` checks for them and falls back to the existing daily/weekly/monthly structure if absent. This allows the redesign to be deployed safely — if `core_four_tasks` is not populated, the old page structure renders.

---

## Build Order (Dependency Graph)

```
Phase 1 — Data layer (no UI risk)
    [1a] Extend PDFReportData interface in layout-v2.ts
         → Add core_four_tasks?: { email, calendar, personal, business }
    [1b] Extend transformToPDFData() in generator-v2.ts
         → Add Core Four grouping logic
         → Populate core_four_tasks
         → Verify fallback when coreTaskType absent

Phase 2 — Static page builders (additive, no removal yet)
    [2a] Add buildThreePillarsPage() to layout-v2.ts
         → Depends on: existing rendering primitives only
    [2b] Add buildCoreFourOwnershipPage() to layout-v2.ts
         → Depends on: [1a] (needs core_four_tasks for task counts)
    [2c] Add buildCoreFourTasksPage() to layout-v2.ts
         → Depends on: [1a] (needs Core Four task arrays)
    [2d] Add buildStrongCTAPage() to layout-v2.ts
         → Depends on: existing primitives + userData

Phase 3 — Wire up new page order in orchestrator
    [3a] Modify generateTimeFreedomReport() in layout-v2.ts
         → Replace old page sequence with new sequence
         → Gate on core_four_tasks presence (safe fallback)
         → Depends on: [1b], [2a], [2b], [2c], [2d]

Phase 4 — Fallback content (thin form data)
    [4a] Add fallback defaults in transformToPDFData()
         → When a Core Four bucket is empty, supply generic tasks
         → Depends on: [1b]

Phase 5 — Prompt upgrade (optional, if needed)
    [5a] Add coreTaskType as required field in time-freedom-prompt.ts
         → Update JSON schema in TIME_FREEDOM_PROMPT_JSON
         → No other file changes required
```

Critical dependency: [3a] must be the LAST step. All page builders must exist before the orchestrator is wired to call them. Wiring the orchestrator before all builders are complete will cause runtime errors.

---

## Recommended Project Structure (after changes)

No new directories needed. All changes are confined to:

```
web/src/
├── lib/
│   ├── pdf/
│   │   ├── layout-v2.ts          ← PRIMARY CHANGE TARGET
│   │   │   + buildThreePillarsPage()
│   │   │   + buildCoreFourOwnershipPage()
│   │   │   + buildCoreFourTasksPage()
│   │   │   + buildStrongCTAPage()
│   │   │   ~ generateTimeFreedomReport() (modified orchestration)
│   │   │   ~ PDFReportData interface (extended)
│   │   ├── generator-v2.ts       ← SECONDARY CHANGE TARGET
│   │   │   ~ transformToPDFData() (Core Four grouping added)
│   │   ├── design-system.ts      ← MINOR: add color tokens if needed
│   │   ├── generator.ts          ← DO NOT TOUCH (V1 dead)
│   │   ├── layout.ts             ← DO NOT TOUCH (V1 dead)
│   │   └── index.ts              ← DO NOT TOUCH (exports V1)
│   └── ai/
│       └── prompts/
│           └── time-freedom-prompt.ts  ← OPTIONAL: Phase 5 only
├── types/
│   ├── task.ts                   ← DO NOT TOUCH
│   └── pdf.ts                    ← DO NOT TOUCH
└── app/api/
    └── generate-pdf/route.ts     ← DO NOT TOUCH (or minor flag addition)
```

---

## Architectural Patterns

### Pattern 1: Additive Page Builders

**What:** Each new page section is a standalone function `buildXxxPage(doc, data, userData)` that mutates the jsPDF document. No return value affects other functions.

**When to use:** Any new full-page section. Each builder is independently testable.

**Example from existing code:**
```typescript
// layout-v2.ts — all builders follow this pattern
export function buildTasksPage(doc: jsPDF, tasks: PDFTask[], title: string, subtitle: string, userData?: CTAUserData): void {
  doc.addPage();
  let y = 20;
  y = renderSectionTitle(doc, title, subtitle, y);
  // ... render tasks
}
```

**New builders follow the same signature:**
```typescript
export function buildThreePillarsPage(doc: jsPDF): void {
  doc.addPage();
  // fully static content — no data dependency
}

export function buildCoreFourOwnershipPage(doc: jsPDF, data: PDFReportData): void {
  doc.addPage();
  // uses data.core_four_tasks for task counts per area
}
```

### Pattern 2: Safe Feature Gating via Optional Fields

**What:** New features are gated behind optional fields in `PDFReportData`. If the field is absent, the old behavior runs. If present, the new behavior activates.

**When to use:** Any time new PDF content depends on new data that might not be populated during rollout.

**Example:**
```typescript
// In generateTimeFreedomReport():
if (data.core_four_tasks && Object.values(data.core_four_tasks).some(arr => arr.length > 0)) {
  // New Core Four layout
  buildThreePillarsPage(doc);
  buildCoreFourOwnershipPage(doc, data);
  buildCoreFourTasksPage(doc, data.core_four_tasks.email, 'Email & Communication', userData);
  // ...
} else {
  // Existing daily/weekly/monthly fallback
  buildTasksPage(doc, data.daily_tasks, 'Top 5 Daily Tasks...', '...', userData);
  // ...
}
```

### Pattern 3: Grouping at Transform Time, Not Render Time

**What:** All data reshaping (Core Four grouping) happens in `transformToPDFData()` in `generator-v2.ts`, not inside the layout functions.

**When to use:** Always. Layout functions receive clean, pre-shaped data. They do not make business logic decisions.

**Why:** Layout functions are harder to test because they depend on jsPDF. Grouping logic in `transformToPDFData()` is pure TypeScript, easily unit-tested in isolation.

---

## Anti-Patterns

### Anti-Pattern 1: Modifying generate-tasks Route for PDF Changes

**What people do:** Add new fields to `TaskGenerationResult` or change the generate-tasks API response shape to serve PDF needs.

**Why it's wrong:** The generate-tasks API is consumed by `thank-you-content.tsx` as a pass-through. Changing its contract risks breaking the web report page. The generate-tasks route returns raw AI output — PDF concerns do not belong there.

**Do this instead:** All PDF-specific data shaping happens in `transformToPDFData()` inside `generator-v2.ts`. The generate-pdf route receives the same `TaskGenerationResult` it always has.

### Anti-Pattern 2: Creating a V3 Generator

**What people do:** Create `generator-v3.ts` and `layout-v3.ts` as copies of V2, then modify the copies.

**Why it's wrong:** V2 already has a clean primitive layer (`setColor`, `roundedRect`, `wrapText`, `renderHeader`, `renderFooter`, etc.). Duplicating these creates maintenance burden — any future fix must be applied to both files. The orchestrator function `generateTimeFreedomReport()` is the right seam to modify.

**Do this instead:** Add new page builder functions to the existing `layout-v2.ts`. Modify only `generateTimeFreedomReport()` to call the new builders.

### Anti-Pattern 3: Hardcoding Core Four Buckets in the Prompt

**What people do:** Restructure the entire AI prompt to output `{ core_four: { email: [...], calendar: [...], ... } }` instead of the current `{ daily: [...], weekly: [...], monthly: [...] }`.

**Why it's wrong:** The generate-tasks route, the report-validator, the report-fixer, and `ensureCoreEATasks()` all depend on the `tasks.daily / tasks.weekly / tasks.monthly` shape. Changing the AI output structure requires changing all four of those files plus the types.

**Do this instead:** Keep the AI outputting `daily/weekly/monthly`. Add `coreTaskType` as an optional field per task. Do the Core Four grouping in `transformToPDFData()` using `coreTaskType` and/or `category` inference.

### Anti-Pattern 4: Removing Existing Page Builders Before New Ones Work

**What people do:** Delete `buildTasksPage()`, `buildFounderTasksPage()` etc. immediately when starting the redesign.

**Why it's wrong:** The old builders are the fallback path. Until new builders are fully tested, removing them makes debugging impossible.

**Do this instead:** Keep all existing builders. Wire the new orchestration first, test it, then mark old builders as `@deprecated` comments. Remove them in a cleanup phase only after the new design is verified in production.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `thank-you-content.tsx` → `generate-tasks` route | POST JSON (UnifiedLeadData shape) | DO NOT CHANGE — any field addition must be backward compatible |
| `thank-you-content.tsx` → `generate-pdf` route | POST JSON (tasks + userData + taskHours + revenueRange) | DO NOT CHANGE contract |
| `generate-pdf/route.ts` → `generatePDFV2()` | Direct TypeScript call | Safe to evolve — same process boundary |
| `generatePDFV2()` → `transformToPDFData()` | Direct TypeScript call | Primary change seam for Core Four grouping |
| `transformToPDFData()` → `generateTimeFreedomReport()` | PDFReportData struct | Add optional `core_four_tasks` field — backward compatible |
| `generateTimeFreedomReport()` → page builders | Direct function calls | Add new builders, modify orchestrator last |

### External Services (Unchanged)

| Service | Integration | Notes |
|---------|-------------|-------|
| Claude AI (claude-sonnet-4-5) | `claude-client.ts::generateWithClaude()` | No changes |
| Vercel Blob | `generate-pdf/route.ts` | No changes |
| iClosed booking | `buildBookingUrl()` in layout-v2.ts | Already in place; CTA redesign uses same function |

---

## Blast Radius Assessment

| Change | Files Affected | Risk |
|--------|----------------|------|
| Extend `PDFReportData` with optional `core_four_tasks` | layout-v2.ts only | LOW — optional field, backward compatible |
| Add Core Four grouping to `transformToPDFData()` | generator-v2.ts only | LOW — additive logic, existing paths unchanged |
| Add new page builders to layout-v2.ts | layout-v2.ts only | LOW — new functions, no modification to existing |
| Modify `generateTimeFreedomReport()` orchestration | layout-v2.ts only | MEDIUM — this is the page sequence; must be guarded |
| Add `coreTaskType` to AI prompt (optional Phase 5) | time-freedom-prompt.ts only | LOW — additive JSON field, validator does not check field names |

Total blast radius: **2 files for core redesign** (layout-v2.ts, generator-v2.ts), with 1 optional (time-freedom-prompt.ts).

---

## Sources

- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/pdf/generator-v2.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/pdf/layout-v2.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/pdf/design-system.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/ai/task-generator.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/ai/claude-client.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/ai/prompts/time-freedom-prompt.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/ai/prompts/serialize-lead.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/ai/prompts/fallback-prompts.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/lib/ai/report-validator.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/types/task.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/types/pdf.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/app/api/generate-pdf/route.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/app/api/generate-tasks/route.ts`
- Direct inspection: `/Users/ryanbrazzell/boundless-os-template-2/web/src/components/thank-you/thank-you-content.tsx`

---
*Architecture research for: PDF Report Redesign (Core Four framework)*
*Researched: 2026-02-23*
