---
phase: 02-cover-roi-framework
verified: 2026-02-25T01:37:24Z
status: human_needed
score: 4/5 must-haves verified (criterion 4 is borderline — needs visual confirmation)
re_verification: false
human_verification:
  - test: "Render a PDF with a typical lead and inspect page 2 visually"
    expected: "Three Pillars and Core Four content both appear on a single page without any text clipping off the bottom margin"
    why_human: "Layout budget calculation shows the content is borderline (269-282mm depending on jsPDF font metrics at 10pt Helvetica). Static analysis cannot determine exact character-width-to-mm mapping for splitTextToSize — the actual fit requires visual inspection of a rendered PDF."
---

# Phase 2: Cover & ROI + Framework Page Verification Report

**Phase Goal:** Pages 1 and 2 of the PDF deliver the first two emotional beats — financial pain (ROI) and framework education (Three Pillars + Core Four) — as complete, visually polished pages
**Verified:** 2026-02-25T01:37:24Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | PDF page 1 displays the founder's name, company context, and personalized ROI breakdown (hours lost, dollar cost) using the refreshed color system | VERIFIED | `renderClientBlock` renders `data.client_name`; optional `data.company_name` block at line 657; `renderMetricsRow` shows `${data.weekly_hours} hrs` labeled "Reclaimed Weekly"; ROI pain text at line 677 shows `$${data.ceo_hourly_rate}/hr`; analysis block shows annual hours lost (`weeklyHours * 52`); all color calls use `C.xxx` spread pattern — zero hex strings |
| 2 | PDF page 2 shows Three Pillars (Right Person, Right Process, Right Support) with heading and 2-3 sentence description each | VERIFIED | `buildFrameworkPage` at line 695 declares `THREE_PILLARS` const with 3 items: "Right Person" (2 sentences, 269 chars), "Right Process & Systems" (2 sentences, 223 chars), "Right Support" (2 sentences, 219 chars). Each renders with bold title + wrapped description lines. |
| 3 | PDF page 2 shows Core Four ownership areas in distinct visual boxes with heading and brief description each | VERIFIED | `CORE_FOUR` const at line 715 declares 4 items: Email Ownership, Calendar Ownership, Personal Life Ownership, Recurring Business Processes. Each box renders: colored left accent bar (`area.accent` via mutable copy) + rounded-rect background + bold title + description (capped at 2 lines via `lines.slice(0, 2)`). 4 distinct accent colors: blue, purple, amber, green. |
| 4 | Three Pillars and Core Four content fit on a single page without overflow | UNCERTAIN | No `checkPageBreak` in `buildFrameworkPage` (by design — FRAME-03). Static layout budget: at optimistic 80-char/line wrapping = ~269mm (fits within 270mm safe zone); at conservative 70-char/line wrapping = ~278mm (overflows by 8mm). Actual jsPDF metrics for 10pt Helvetica at 154mm width cannot be determined without rendering. **Needs human visual confirmation.** |
| 5 | All framework content is static (hardcoded copy, not AI-generated) and identical for every lead | VERIFIED | `buildFrameworkPage(doc: jsPDF): void` takes only the `doc` parameter — no data parameter. `THREE_PILLARS` and `CORE_FOUR` are `as const` literals declared inside the function body. No external data references. |

**Score:** 4/5 truths verified (1 uncertain pending human check)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `web/src/lib/pdf/layout-v2.ts` | Core layout file with `buildSummaryPage`, `buildFrameworkPage`, `PDFReportData`, `C` color system | VERIFIED | File exists, 1026 lines, substantive. Contains all required components. TypeScript compiles clean (`tsc --noEmit` exits 0). |
| `web/src/lib/pdf/generator-v2.ts` | Generator threading `company_name`, `revenue_range`, `ceo_hourly_rate` into `transformToPDFData` | VERIFIED | File exists, 279 lines. Lines 170-172 populate `company_name: leadData.businessType`, `revenue_range: roi?.revenueRange`, `ceo_hourly_rate: roi?.ceoHourlyRate`. |
| `PDFReportData` interface | Extended with 3 optional cover page fields | VERIFIED | Lines 167-171 in `layout-v2.ts`: `company_name?: string`, `revenue_range?: string`, `ceo_hourly_rate?: number` — all optional for backward compatibility. |
| `buildFrameworkPage` function | Internal (non-exported) function, takes only `doc: jsPDF` | VERIFIED | Declared as `function buildFrameworkPage(doc: jsPDF): void` at line 695 — no `export` keyword. Called at line 955 within `generateTimeFreedomReport`. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `generator-v2.ts` | `layout-v2.ts` | `generateTimeFreedomReport` call at line 228 | WIRED | `generatePDFV2` calls `generateTimeFreedomReport(doc, pdfData, userData)` |
| `generateTimeFreedomReport` | `buildSummaryPage` | Call at line 952 | WIRED | Page 1 cover page rendered |
| `generateTimeFreedomReport` | `buildFrameworkPage` | Call at line 955 | WIRED | Page 2 framework page rendered immediately after cover |
| `leadData.businessType` | `PDFReportData.company_name` | `transformToPDFData` line 170 | WIRED | `company_name: leadData.businessType \|\| undefined` |
| `roi.ceoHourlyRate` | `buildSummaryPage` pain text | `PDFReportData.ceo_hourly_rate` → line 676-683 | WIRED | `if (data.ceo_hourly_rate)` block renders pain messaging |
| ROI calculator | `ceoHourlyRate` field | `roi-calculator.ts` line 11, 117, 142 | WIRED | `calculateROI` returns `ceoHourlyRate` keyed to revenue tier |

### Requirements Coverage

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| COVER-01: Personalized cover with founder's name and company | SATISFIED | `renderClientBlock` renders client name; `company_name` block renders `businessType` below client block |
| COVER-02: ROI breakdown — annual hours lost, dollar cost | SATISFIED | Hero metric shows `annual_value`; metrics row shows `weekly_hours hrs` reclaimed; analysis block mentions `weeklyHours * 52` annual hours; pain text shows `$ceo_hourly_rate/hr` dollar cost |
| COVER-03: Cover page uses refreshed color system | SATISFIED | All color calls in `buildSummaryPage` use `C.xxx` spread pattern. Zero `setColor` or hex string calls found in the function. |
| FRAME-01: Three Pillars with heading + 2-3 sentence descriptions | SATISFIED | 3 pillars hardcoded with bold titles and 2-sentence descriptions each |
| FRAME-02: Core Four in visual boxes with heading + brief description | SATISFIED | 4 boxes with distinct accent-colored left bars, bold titles, 1-2 sentence descriptions capped at 2 lines |
| FRAME-03: Three Pillars + Core Four on single page | UNCERTAIN | No `checkPageBreak` present by design. Static analysis suggests borderline fit (269-282mm depending on font metrics). |
| FRAME-04: Framework content static, same for all leads | SATISFIED | `buildFrameworkPage(doc: jsPDF)` — no data parameter. All content hardcoded as `as const` literals. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `layout-v2.ts` | 44 | Comment: "Core Four area accents (placeholder — confirm with design before Phase 3)" | Info | Intentional — colors are functional placeholder values (blue, purple, amber, green) pending design confirmation. Does not affect Phase 2 goal. Tracked for Phase 5. |

No blocker anti-patterns found. No TODO/FIXME/stub implementations. No empty handlers or placeholder return values.

### Human Verification Required

#### 1. Single-Page Fit for Framework Page

**Test:** Generate a full PDF for any lead (use the web report page or a test harness) and open the resulting PDF. Navigate to page 2.

**Expected:** All Three Pillars content and all four Core Four boxes are fully visible on page 2. No text is clipped below the bottom margin. The footer line at ~270mm is not obscured by content.

**Why human:** Static layout budget analysis shows the framework page content is right at the boundary of the 270mm safe zone. At an optimistic jsPDF font-width estimate (80+ chars/line at 10pt Helvetica over 154mm), total y ends at ~269mm — just inside the limit. At a conservative estimate (70 chars/line), total y reaches ~278mm — overflowing by 8mm. The actual jsPDF `splitTextToSize` character metrics for Helvetica 10pt cannot be determined without a running jsPDF instance. A rendered PDF inspection will confirm in under 30 seconds.

---

## Commits Verified

All 4 commits documented in SUMMARYs were verified in git history:

| Commit | Description |
| ------ | ----------- |
| `082de8a` | feat(02-01): extend PDFReportData with company context and thread from generator |
| `d1952eb` | feat(02-01): add company context and ROI pain messaging to cover page |
| `2351764` | feat(02-02): add buildFrameworkPage with Three Pillars and Core Four renderers |
| `2686883` | feat(02-02): wire buildFrameworkPage into generateTimeFreedomReport as page 2 |

---

## Summary

Phase 2 goal is **substantially achieved**. The two key emotional beats are implemented with real content, proper wiring, and clean TypeScript:

- **Page 1 (Cover + ROI):** Fully implemented. Founder name, company context, personalized ROI breakdown (weekly hours, annual value, CEO hourly rate pain message, investment block), and refreshed C-constant color system — all wired end-to-end from `leadData` and `roi` through `transformToPDFData` into `buildSummaryPage`.

- **Page 2 (Framework):** Fully implemented. Three Pillars (3 numbered items with circle indicators, bold titles, 2-sentence descriptions) and Core Four (4 accent-bar boxes with distinct colors, bold titles, brief descriptions) are hardcoded static content, wired as page 2 in `generateTimeFreedomReport`.

The one open item is a visual sanity check on single-page fit — a borderline layout calculation that automated static analysis cannot resolve definitively.

---

_Verified: 2026-02-25T01:37:24Z_
_Verifier: Claude (gsd-verifier)_
