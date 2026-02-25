---
phase: 03-task-pages-cta
plan: 01
subsystem: ui
tags: [pdf, jspdf, core-four, task-classifier, page-builder]

# Dependency graph
requires:
  - phase: 01-cleanup-foundation
    provides: "C color constants (emailAccent, calendarAccent, personalAccent, businessAccent), checkPageBreak, renderTaskCard"
provides:
  - "CoreFourArea type and CoreFourTaskGroup interface for task grouping"
  - "inferCoreTaskType classifier (keyword + explicit coreTaskType)"
  - "buildCoreFourTaskPages multi-page renderer with accent headers"
  - "PDFReportData.core_four_groups optional field"
affects: [03-02-PLAN, 03-03-PLAN, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Core Four keyword classification with explicit-field-first fallback", "Mutable tuple copy for readonly accent spread", "Continuous task numbering across grouped sections"]

key-files:
  created: []
  modified:
    - "web/src/lib/pdf/layout-v2.ts"

key-decisions:
  - "inferCoreTaskType placed after DATA TYPES section for clean type ordering"
  - "renderCoreFourSection and buildCoreFourTaskPages are internal (not exported) — called from generateTimeFreedomReport in Plan 03-03"
  - "Accent color spread uses mutable tuple copy pattern (same as Phase 2 framework page)"

patterns-established:
  - "Core Four section header: accent bar + white title text + subtitle, with checkPageBreak for header + one task minimum"
  - "Continuous global task numbering across Core Four sections (overwhelm effect)"

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 3 Plan 1: Core Four Task Page Renderer Summary

**CoreFourArea type system, keyword-based task classifier with explicit-field fallback, and multi-page buildCoreFourTaskPages renderer with accent headers and continuous task numbering**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T01:41:42Z
- **Completed:** 2026-02-25T01:44:11Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- CoreFourArea type and CoreFourTaskGroup interface define the grouped task data model
- inferCoreTaskType classifier prefers explicit coreTaskType field (Phase 4 compatibility), falls back to keyword matching on title + description, always returns valid CoreFourArea defaulting to 'business'
- buildCoreFourTaskPages renders flowing multi-page Core Four sections with accent-colored header bars, continuous task numbering (1 through N globally), and checkPageBreak protection on every header and task card
- PDFReportData extended with optional core_four_groups field for Plan 03-02 to populate

## Task Commits

Each task was committed atomically:

1. **Task 1: Add CoreFourArea type, CoreFourTaskGroup interface, and inferCoreTaskType classifier** - `367e136` (feat)
2. **Task 2: Build buildCoreFourTaskPages renderer with accent headers and page break handling** - `c5df855` (feat)

## Files Created/Modified
- `web/src/lib/pdf/layout-v2.ts` - Added CoreFourArea type, CoreFourTaskGroup interface, inferCoreTaskType classifier, renderCoreFourSection helper, buildCoreFourTaskPages page builder, and core_four_groups field on PDFReportData

## Decisions Made
- inferCoreTaskType placed after DATA TYPES section (after the types it references) for clean source ordering
- renderCoreFourSection and buildCoreFourTaskPages kept internal (not exported) — they are called by generateTimeFreedomReport, which Plan 03-03 will wire up
- Used mutable tuple copy (`[...group.accent]`) for readonly accent color spread, consistent with Phase 2 framework page pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 03-02-PLAN (fallback content and data population)
- inferCoreTaskType exported and available for generator-v2.ts to classify tasks into Core Four groups
- buildCoreFourTaskPages ready to be called once core_four_groups data is populated

## Self-Check: PASSED

- FOUND: web/src/lib/pdf/layout-v2.ts
- FOUND: 367e136 (Task 1 commit)
- FOUND: c5df855 (Task 2 commit)
- FOUND: 03-01-SUMMARY.md

---
*Phase: 03-task-pages-cta*
*Completed: 2026-02-25*
