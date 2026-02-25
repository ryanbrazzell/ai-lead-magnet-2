---
phase: 03-task-pages-cta
verified: 2026-02-25T01:57:49Z
status: passed
score: 7/7 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Open generated PDF and scan task pages"
    expected: "Four visually distinct colored section headers (Blue Email, Purple Calendar, Amber Personal, Green Business) each with substantial task lists; last page shows large teal CTA button that is clickable"
    why_human: "PDF visual rendering and clickable link behavior cannot be verified programmatically"
---

# Phase 3: Core Four Task Pages + CTA Verification Report

**Phase Goal:** The PDF's central conversion mechanism works — personalized tasks organized by Core Four areas create deliberate overwhelm, and a strong CTA page drives the reader to book a Time Audit call
**Verified:** 2026-02-25T01:57:49Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | PDF pages display tasks grouped by Core Four ownership area (Email, Calendar, Personal Life, Recurring Processes) — not by daily/weekly/monthly frequency | VERIFIED | `buildCoreFourTaskPages` renders 4 `CoreFourTaskGroup` objects in order: email -> calendar -> personal -> business. Page title is "Your Personalized Task Roadmap". The old frequency-based calls (`buildTasksPage` × 6) are removed from `generateTimeFreedomReport`. |
| 2   | Each Core Four section uses a visually distinct accent color | VERIFIED | Four distinct RGB colors defined and applied: `emailAccent=[59,130,246]` (Blue), `calendarAccent=[168,85,247]` (Purple), `personalAccent=[234,179,8]` (Amber), `businessAccent=[34,197,94]` (Green). Each `renderCoreFourSection` spreads `group.accent` to `doc.setFillColor(...accentColor)` before drawing the header bar. |
| 3   | Tasks include rich descriptions (not just one-line titles) with action-oriented language | VERIFIED | `renderTaskCard` renders `task.description` via `doc.splitTextToSize` into multi-line text. All 24 fallback tasks have 2–3 sentence gerund-style descriptions (e.g., "Processing all incoming messages into 7 priority folders, flagging urgent items, archiving noise..."). `transformTask` maps `task.description` from the AI-generated `Task` object directly. |
| 4   | Task volume is deliberately large — all generated tasks are shown (no slicing) | VERIFIED | `allEATasks` in `transformToPDFData` collects from all three frequency buckets with no `.slice()` call: `[...dailySeparated.eaTasks, ...weeklySeparated.eaTasks, ...monthlySeparated.eaTasks]`. The legacy `.slice(0, 5)` arrays (`dailyTasks`, `weeklyTasks`, `monthlyTasks`) are still populated for backward compatibility but are NOT used by the Core Four renderer. |
| 5   | Fallback universal EA task examples fill in when AI output is sparse | VERIFIED | `groupTasksByCoreFour` checks each area against `MIN_TASKS_PER_AREA = 6`. If below threshold, injects `FALLBACK_TASKS[area].slice(0, needed)`. `FALLBACK_TASKS` is a `Record<CoreFourArea, PDFTask[]>` with exactly 6 entries per area (24 total). Fallbacks are visually identical to personalized tasks. |
| 6   | Page breaks are handled safely — no task content clips at page boundaries | VERIFIED | `renderCoreFourSection` calls `checkPageBreak(doc, y, headerHeight + 6 + minimumOneTaskHeight)` before each section header and `checkPageBreak(doc, y, estimatedCardHeight)` before each task card. Card height is pre-measured using `doc.splitTextToSize` so the estimate matches actual render height. `checkPageBreak` adds a new page when `currentY + contentHeight > 270`. |
| 7   | The final PDF page displays a strong CTA with clickable booking link and value proposition reinforcement | VERIFIED | `buildCTAPageV2` renders: headline "You Don't Have to Do This Alone", Three Pillars recap (Right Person / Right Process / Right Support), 3 numbered Time Audit call steps, a large teal booking button, and a clickable URL text. Both button and URL are wired via `doc.link(x, y, w, h, { url: bookingUrl })` where `bookingUrl` comes from `buildBookingUrl(userData)` with pre-filled user data. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `web/src/lib/pdf/layout-v2.ts` | CoreFourArea type, CoreFourTaskGroup interface, inferCoreTaskType classifier, renderCoreFourSection, buildCoreFourTaskPages, buildCTAPageV2, FALLBACK_TASKS, updated generateTimeFreedomReport | VERIFIED | 1394 lines. All 7 items present and substantive. TypeScript compiles cleanly with `tsc --noEmit`. |
| `web/src/lib/pdf/generator-v2.ts` | groupTasksByCoreFour, updated transformToPDFData populating core_four_groups | VERIFIED | groupTasksByCoreFour at line 87. transformToPDFData populates `core_four_groups: coreFourGroups` at line 263. allEATasks collected un-sliced at lines 231-235. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `generator-v2.ts: transformToPDFData` | `layout-v2.ts: generateTimeFreedomReport` | `core_four_groups` field on `PDFReportData` | WIRED | `groupTasksByCoreFour(allEATasks)` result assigned to `core_four_groups` in return object; `generateTimeFreedomReport` calls `buildCoreFourTaskPages(doc, data, userData)` which reads `data.core_four_groups`. |
| `generator-v2.ts: generatePDFV2` | `layout-v2.ts: generateTimeFreedomReport` | direct call with `pdfData` and `userData` | WIRED | Line 319: `generateTimeFreedomReport(doc, pdfData, userData)`. `userData` carries `firstName`, `lastName`, `email`, `phone` for pre-filled booking URL. |
| `buildCoreFourTaskPages` | `renderCoreFourSection` | loop over `data.core_four_groups` | WIRED | For loop at lines 1211-1215 calls `renderCoreFourSection(doc, group, globalTaskNumber, y)` for each group, updates `globalTaskNumber += group.tasks.length` for continuous numbering. |
| `renderCoreFourSection` | `checkPageBreak` | called before header AND before each task | WIRED | Line 1147: header page break check. Line 1176: per-task page break check with pre-measured `estimatedCardHeight`. |
| `buildCTAPageV2` | `buildBookingUrl` | `bookingUrl` variable | WIRED | Line 1237: `const bookingUrl = buildBookingUrl(userData)`. Used in two `doc.link()` calls at lines 1338 and 1350. |
| `inferCoreTaskType` | `Task.coreTaskType` field | `task.coreTaskType` param | WIRED | `groupTasksByCoreFour` calls `inferCoreTaskType({ title: task.title, description: task.description, coreTaskType: task.coreTaskType })`. The `Task` type in `src/types/task.ts` defines `coreTaskType?: CoreTaskType` matching the four mapping keys. |
| `FALLBACK_TASKS` | `groupTasksByCoreFour` fallback injection | `FALLBACK_TASKS[area].slice(0, needed)` | WIRED | Lines 112-117 in generator-v2.ts. `FALLBACK_TASKS` imported from layout-v2.ts (line 19 of generator-v2.ts). |

### Requirements Coverage

Phase 3 requirements fully satisfied:

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| Core Four grouping replaces frequency-based pages | SATISFIED | generateTimeFreedomReport rewired from 6 calls to 1 `buildCoreFourTaskPages` call |
| Minimum task volume per area | SATISFIED | MIN_TASKS_PER_AREA=6, fallback injection ensures every area always has at least 6 tasks |
| Page break safety | SATISFIED | checkPageBreak called for every section header and every task card |
| Strong CTA with booking link | SATISFIED | buildCTAPageV2 with doc.link() wired to buildBookingUrl |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `layout-v2.ts` | 44 | Stale comment: "placeholder — confirm with design before Phase 3" on `emailAccent`/`calendarAccent`/`personalAccent`/`businessAccent` | Info | No impact — the four accent colors ARE implemented and used by Phase 3. Comment is a leftover from Phase 2 planning. |

No blockers. No stubs. No empty handlers. TypeScript compiles cleanly.

### Human Verification Required

#### 1. Core Four Visual Scan

**Test:** Generate a PDF via the app and open it. Navigate to pages 3+.
**Expected:** Four section headers each with a distinctly colored accent bar — Blue for Email Ownership, Purple for Calendar Ownership, Amber for Personal Life Ownership, Green for Recurring Business Processes. Each section has multiple task cards with multi-line descriptions and a "Time saved:" line.
**Why human:** PDF rendering engine (jsPDF + Acrobat) must be confirmed visually. Colors may render differently than RGB values suggest.

#### 2. CTA Booking Link Click

**Test:** Open the final PDF page. Click the "Book Your Free Time Audit" button and the `assistantlaunch.com/book` URL text.
**Expected:** Both open the iClosed booking page (`https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet`) with the lead's name, email, and phone pre-filled.
**Why human:** `doc.link()` click behavior depends on PDF viewer support; pre-fill parameters must be inspected in-browser.

#### 3. Task Volume "Overwhelm" Effect

**Test:** Generate a report with sparse AI output (e.g., a lead with very few generated tasks). Count visible tasks per Core Four section.
**Expected:** Every section shows at least 6 tasks. Global task numbering runs continuously (e.g., Task 1 through Task 24+) across all four sections.
**Why human:** Fallback injection logic triggers based on AI output volume which varies per lead; needs a real generation run to confirm.

### Gaps Summary

No gaps. All seven success criteria are verified against the actual codebase.

One stale code comment (`// Core Four area accents (placeholder — confirm with design before Phase 3)`) remains at line 44 of `layout-v2.ts` but is informational only — the colors are fully implemented and wired.

One forward-looking note from the SUMMARY: `total_tasks_ea` on `PDFReportData` still uses the legacy frequency-count rather than the Core Four task count. This is acknowledged in the SUMMARY as a future refinement and does not affect the Phase 3 goal (it is a metadata field used for display on the cover/ROI page, not by the Core Four renderer).

---

_Verified: 2026-02-25T01:57:49Z_
_Verifier: Claude (gsd-verifier)_
