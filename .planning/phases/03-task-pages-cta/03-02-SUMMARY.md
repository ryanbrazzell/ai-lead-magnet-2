---
phase: 03-task-pages-cta
plan: 02
subsystem: ui
tags: [pdf, jspdf, core-four, fallback-tasks, data-transform]

# Dependency graph
requires:
  - phase: 03-task-pages-cta
    plan: 01
    provides: "CoreFourArea type, CoreFourTaskGroup interface, inferCoreTaskType classifier, buildCoreFourTaskPages renderer"
  - phase: 01-cleanup-foundation
    provides: "C color constants (emailAccent, calendarAccent, personalAccent, businessAccent)"
provides:
  - "FALLBACK_TASKS constant with 24 universal EA task examples (6 per Core Four area)"
  - "groupTasksByCoreFour data transform classifying ALL EA tasks into Core Four groups"
  - "Fallback injection ensuring minimum 6 tasks per Core Four area"
  - "transformToPDFData populates core_four_groups on PDFReportData"
affects: [03-03-PLAN, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Fallback injection for thin Core Four areas with configurable MIN_TASKS_PER_AREA", "All EA tasks collected un-sliced for Core Four grouping (frequency limits only on legacy path)"]

key-files:
  created: []
  modified:
    - "web/src/lib/pdf/layout-v2.ts"
    - "web/src/lib/pdf/generator-v2.ts"

key-decisions:
  - "FALLBACK_TASKS placed after inferCoreTaskType and before COMPONENT RENDERERS section"
  - "MIN_TASKS_PER_AREA set to 6 (matching 6 fallback tasks per area for overwhelm effect)"
  - "allEATasks collected from un-sliced eaTasks arrays (not the .slice(0,5) versions used by legacy frequency-based rendering)"

patterns-established:
  - "Fallback injection pattern: check area count < MIN, inject from FALLBACK_TASKS[area].slice(0, needed)"
  - "AREA_CONFIG mapping: Core Four area -> display title + subtitle + accent color"

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 3 Plan 2: Fallback Content and Core Four Data Transform Summary

**24 fallback PDFTask objects with gerund titles and rich descriptions, groupTasksByCoreFour classifier with fallback injection, and transformToPDFData wiring to populate core_four_groups**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T01:46:28Z
- **Completed:** 2026-02-25T01:49:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- 24 fallback PDFTask objects exported as FALLBACK_TASKS (6 per Core Four area) with gerund-style titles, 2-3 sentence descriptions with concrete examples, and realistic time_saved values
- groupTasksByCoreFour function classifies ALL EA tasks (un-sliced across all frequencies) via inferCoreTaskType, then injects fallback tasks for areas with fewer than 6 personalized tasks
- transformToPDFData now populates core_four_groups on the returned PDFReportData, alongside existing frequency-based fields (backward compatible)

## Task Commits

Each task was committed atomically:

1. **Task 1: Define fallback PDFTask arrays for all four Core Four areas** - `b757679` (feat)
2. **Task 2: Build groupTasksByCoreFour data transform and wire into transformToPDFData** - `b60e408` (feat)

## Files Created/Modified
- `web/src/lib/pdf/layout-v2.ts` - Added FALLBACK_TASKS constant with 24 universal EA task examples (6 per Core Four area)
- `web/src/lib/pdf/generator-v2.ts` - Added groupTasksByCoreFour function, updated imports (CoreFourArea, CoreFourTaskGroup, inferCoreTaskType, FALLBACK_TASKS, C), wired core_four_groups into transformToPDFData return

## Decisions Made
- FALLBACK_TASKS placed after inferCoreTaskType function definition (end of DATA TYPES section) and before COMPONENT RENDERERS section for logical source ordering
- MIN_TASKS_PER_AREA set to 6 (plan text says "minimum 4" in done criteria but "minimum 6 tasks per area for overwhelm effect" in the function code template -- used 6 from the code template to match the 6 fallback tasks per area)
- allEATasks collects from un-sliced `.eaTasks` arrays (dailySeparated.eaTasks, etc.), not from the `.slice(0, 5)` versions used by the legacy frequency-based rendering path

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 03-03-PLAN (wire buildCoreFourTaskPages into generateTimeFreedomReport)
- core_four_groups is now populated on PDFReportData by transformToPDFData
- buildCoreFourTaskPages (from Plan 03-01) checks for core_four_groups and renders when present
- FALLBACK_TASKS ensures every Core Four area always has at least 6 tasks

## Self-Check: PASSED

- FOUND: web/src/lib/pdf/layout-v2.ts
- FOUND: web/src/lib/pdf/generator-v2.ts
- FOUND: b757679 (Task 1 commit)
- FOUND: b60e408 (Task 2 commit)
- FOUND: 03-02-SUMMARY.md

---
*Phase: 03-task-pages-cta*
*Completed: 2026-02-25*
