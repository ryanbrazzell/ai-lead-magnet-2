---
phase: 01-cleanup-foundation
plan: 02
subsystem: pdf
tags: [jspdf, page-break, overflow-protection, typescript]

# Dependency graph
requires:
  - "01-01: RGB tuple color constants (C object) in layout-v2.ts"
provides:
  - "checkPageBreak utility function in layout-v2.ts for automatic page overflow detection"
  - "Pre-measured height estimation before task card rendering using splitTextToSize"
  - "All task rendering loops protected against page boundary overflow"
affects: [phase-03, phase-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "checkPageBreak(doc, y, height) called before every variable-height content render"
    - "splitTextToSize used for pre-render height measurement (not just rendering)"

key-files:
  created: []
  modified:
    - "web/src/lib/pdf/layout-v2.ts"

key-decisions:
  - "safeBottomY default of 270mm (not 282mm) -- leaves 27mm for footer area on A4"
  - "checkPageBreak is internal (not exported) -- it is a layout implementation detail"
  - "Added checkPageBreak to renderFounderTasksSection in addition to plan-specified locations -- it has a forEach loop that advances y and is a potential overflow site"

patterns-established:
  - "All page overflow detection flows through checkPageBreak -- no ad-hoc threshold checks"
  - "Height estimation before rendering: measure with splitTextToSize, then check, then render"

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 1 Plan 2: checkPageBreak Overflow Protection Summary

**Added checkPageBreak utility with configurable thresholds and integrated it into all 4 task rendering loops in layout-v2.ts for automatic page overflow detection**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T00:18:42Z
- **Completed:** 2026-02-25T00:20:42Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `checkPageBreak` utility function with `safeBottomY=270` and `newPageStartY=20` defaults in the HELPER FUNCTIONS section
- Integrated into `buildTasksPage` forEach with pre-measured description height via `doc.splitTextToSize` before each `renderTaskCard` call
- Integrated into `buildFounderTasksPage` forEach with 55mm fixed card height estimate
- Integrated into `renderFounderTasksSection` forEach with dynamic item height (16mm with description, 10mm without)
- Replaced ad-hoc CTA overflow check (`y + 55 < PAGE_HEIGHT - 20`) with `checkPageBreak` -- CTA now renders on new page if needed instead of being silently skipped
- Zero ad-hoc page break thresholds remain in the file

## Task Commits

Each task was committed atomically:

1. **Task 1: Add checkPageBreak utility and integrate into all task rendering loops** - `4caf40a` (feat)

## Files Created/Modified
- `web/src/lib/pdf/layout-v2.ts` - Added checkPageBreak utility function, integrated into buildTasksPage, buildFounderTasksPage, renderFounderTasksSection, and CTA block

## Decisions Made
- `safeBottomY` default of 270mm is deliberately conservative -- leaves 27mm for footer content that `addFootersToAllPages` adds later (PAGE_HEIGHT 297mm - 270mm = 27mm). Did not use 282mm (PAGE_HEIGHT - 15) which would be too tight.
- `checkPageBreak` is not exported -- it is an internal layout utility, not part of the public API
- Added `checkPageBreak` to `renderFounderTasksSection` (not explicitly in plan) because it has a forEach loop advancing y with variable-height items -- a potential overflow site

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added checkPageBreak to renderFounderTasksSection**
- **Found during:** Task 1, Step 5 (checking for other variable-height loops)
- **Issue:** `renderFounderTasksSection` has a forEach loop that renders bullet items advancing y by 10-16mm per item, with no overflow protection. If many founder tasks are passed, content would overflow.
- **Fix:** Added `checkPageBreak` call before each bullet item with dynamic height estimate based on whether description exists
- **Files modified:** web/src/lib/pdf/layout-v2.ts
- **Verification:** grep confirms 5 total checkPageBreak call sites (1 definition + 4 integrations)
- **Committed in:** 4caf40a (part of task commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality)
**Impact on plan:** Essential for complete overflow protection. The plan's Step 5 explicitly asked to check for other loops -- this was the expected outcome.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 (Cleanup & Foundation) is now complete: V1 dead code eliminated, RGB color system in place, and page overflow protection integrated
- All task rendering loops are protected against page boundary overflow
- checkPageBreak is ready for Phase 3's Core Four task pages which will render 20-30+ tasks across multiple pages
- No blockers for Phase 2 (static page builders)

## Self-Check: PASSED

- FOUND: web/src/lib/pdf/layout-v2.ts
- FOUND: .planning/phases/01-cleanup-foundation/01-02-SUMMARY.md
- FOUND: commit 4caf40a (Task 1)
- CONFIRMED: 1 checkPageBreak function definition
- CONFIRMED: 5 total checkPageBreak call sites (1 definition + 4 integrations)

---
*Phase: 01-cleanup-foundation*
*Completed: 2026-02-25*
