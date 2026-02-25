---
phase: 03-task-pages-cta
plan: 03
subsystem: ui
tags: [pdf, jspdf, cta, booking-link, orchestrator, core-four]

# Dependency graph
requires:
  - phase: 03-task-pages-cta
    plan: 01
    provides: "buildCoreFourTaskPages renderer, CoreFourArea type, CoreFourTaskGroup interface"
  - phase: 03-task-pages-cta
    plan: 02
    provides: "FALLBACK_TASKS, groupTasksByCoreFour, core_four_groups populated on PDFReportData"
  - phase: 01-cleanup-foundation
    provides: "C color constants, checkPageBreak, renderTaskCard, buildBookingUrl, CTAUserData"
provides:
  - "buildCTAPageV2 full-page CTA with Three Pillars recap, Time Audit steps, and clickable booking button"
  - "Rewired generateTimeFreedomReport: Cover/ROI -> Framework -> Core Four Tasks -> CTA -> Footers"
  - "Complete Phase 3 page sequence replacing old frequency-based task pages"
affects: [phase-04, phase-05]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Full-page CTA with dual clickable elements (button + URL text via doc.link)", "Orchestrator rewire pattern: replace N old calls with single multi-page renderer"]

key-files:
  created: []
  modified:
    - "web/src/lib/pdf/layout-v2.ts"

key-decisions:
  - "buildCTAPageV2 is internal (not exported) — called only by generateTimeFreedomReport"
  - "Removed Unicode checkmark from pillar bullets — jsPDF renders filled accent circles instead for reliable cross-viewer display"
  - "Old buildTasksPage/buildFounderTasksPage/buildCTAPage definitions retained (they are exported) but removed from orchestrator"
  - "total_tasks_ea still reflects old 15-task count from legacy frequency-based rendering — should be updated in future refinement"

patterns-established:
  - "Full-page CTA pattern: headline -> subheadline -> value proposition bullets -> numbered steps -> CTA button + URL -> reassurance"
  - "Orchestrator simplification: single multi-page renderer call replaces multiple conditional page builder calls"

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 3 Plan 3: Full-Page CTA and Orchestrator Rewire Summary

**buildCTAPageV2 full-page CTA with Three Pillars recap, Time Audit call steps, and clickable booking button; generateTimeFreedomReport rewired to Cover/ROI -> Framework -> Core Four Tasks -> CTA page sequence**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T01:52:09Z
- **Completed:** 2026-02-25T01:53:57Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- buildCTAPageV2 renders a full-page CTA with: headline ("You Don't Have to Do This Alone"), subheadline on delegation risk, Three Pillars compact recap (Right Person / Right Process / Right Support), numbered Time Audit call steps, large clickable booking button, clickable URL text, and reassurance line
- Both button and URL text are clickable via doc.link() with pre-filled booking URL from buildBookingUrl(userData)
- generateTimeFreedomReport simplified from 7 page builder calls (6 frequency-based + 1 old CTA) to 4 calls: buildSummaryPage -> buildFrameworkPage -> buildCoreFourTaskPages -> buildCTAPageV2

## Task Commits

Each task was committed atomically:

1. **Task 1: Build buildCTAPageV2 with full-page CTA design and value proposition** - `83863e8` (feat)
2. **Task 2: Rewire generateTimeFreedomReport to use Core Four pages + new CTA** - `7df6171` (feat)

## Files Created/Modified
- `web/src/lib/pdf/layout-v2.ts` - Added buildCTAPageV2 function (134 lines) and rewired generateTimeFreedomReport to use Core Four + CTA page sequence (replaced 64 lines with 4 clean calls)

## Decisions Made
- buildCTAPageV2 is internal (not exported) — consistent with buildCoreFourTaskPages and renderCoreFourSection
- Removed Unicode checkmark character from Three Pillars bullet rendering — jsPDF doesn't reliably render Unicode in all viewers, so filled accent circles serve as the bullet indicator
- Retained old buildTasksPage, buildFounderTasksPage, and buildCTAPage function definitions since they are exported — only removed their calls from the orchestrator
- total_tasks_ea on PDFReportData still reflects the old 15-task count from legacy frequency-based slicing; should be updated in a future refinement to count all tasks across Core Four groups

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed Unicode checkmark from pillar bullets**
- **Found during:** Task 1 (buildCTAPageV2 implementation)
- **Issue:** Plan included `doc.text('✓', ...)` for checkmark rendering in pillar bullets, but noted jsPDF may not render Unicode characters reliably
- **Fix:** Omitted the checkmark text, relying on the filled accent circle alone as the bullet indicator (as the plan's IMPORTANT note suggested)
- **Files modified:** web/src/lib/pdf/layout-v2.ts
- **Verification:** TypeScript compiles cleanly, no Unicode dependency
- **Committed in:** 83863e8 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug prevention)
**Impact on plan:** Proactive fix per plan's own guidance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 is complete: the PDF now generates Cover/ROI -> Framework -> Core Four Tasks (multi-page) -> Full-page CTA
- Ready for Phase 4 (prompt engineering) — the rendering pipeline and data transforms are in place
- Ready for Phase 5 (design refinement) — all pages exist for adversarial design evaluation
- Note: total_tasks_ea should be updated in a future refinement to reflect Core Four task count

## Self-Check: PASSED

- FOUND: web/src/lib/pdf/layout-v2.ts
- FOUND: 03-03-SUMMARY.md
- FOUND: 83863e8 (Task 1 commit)
- FOUND: 7df6171 (Task 2 commit)

---
*Phase: 03-task-pages-cta*
*Completed: 2026-02-25*
