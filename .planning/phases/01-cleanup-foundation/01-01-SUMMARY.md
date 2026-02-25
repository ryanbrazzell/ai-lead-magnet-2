---
phase: 01-cleanup-foundation
plan: 01
subsystem: pdf
tags: [jspdf, rgb, color-system, dead-code-cleanup, typescript]

# Dependency graph
requires: []
provides:
  - "V1 dead code eliminated (generator.ts, layout.ts, 3 test files)"
  - "RGB tuple color constants (C object) in layout-v2.ts"
  - "Extended color palette with Core Four area accents, cover, framework, CTA colors"
  - "All barrel exports and scripts updated to V2"
affects: [01-02-PLAN, phase-02, phase-03, phase-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RGB tuple constants with `as const satisfies RGB` for type-safe jsPDF color calls"
    - "Direct doc.setFillColor/setTextColor/setDrawColor spread pattern (`...C.xxx`)"

key-files:
  created: []
  modified:
    - "web/src/lib/pdf/layout-v2.ts"
    - "web/src/lib/pdf/index.ts"
    - "web/scripts/generate-sample-pdf.ts"
    - "web/scripts/send-test-email.ts"
    - "web/src/app/api/generate-pdf/__tests__/route.test.ts"

key-decisions:
  - "Named color constant object `C` (not `COLORS`) — shorter, matches spread pattern readability"
  - "16 color constants: 8 core + coverBg + frameworkBg + 4 Core Four accents + ctaBg + ctaText"
  - "Core Four accents are placeholders — marked for design confirmation before Phase 3"

patterns-established:
  - "Color usage pattern: `doc.setTextColor(...C.ink)` — no hex strings in color-setting calls"
  - "RGB type alias: `type RGB = readonly [number, number, number]`"

# Metrics
duration: 5min
completed: 2026-02-25
---

# Phase 1 Plan 1: V1 Cleanup & RGB Color System Summary

**Deleted 5 V1 dead-code files (2200+ lines), updated 4 reference files to V2, and replaced hex-parsing color system with 16 pre-computed RGB tuple constants in layout-v2.ts**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-25T00:10:58Z
- **Completed:** 2026-02-25T00:16:03Z
- **Tasks:** 2
- **Files modified:** 9 (5 deleted, 4 updated)

## Accomplishments
- Eliminated all V1 dead code: generator.ts (349 lines), layout.ts (994 lines), and 3 test files (841 lines total) -- 2,184 lines removed
- Updated barrel exports (index.ts), scripts (generate-sample-pdf.ts, send-test-email.ts), and test mocks (route.test.ts) to reference V2
- Replaced runtime hex-parsing COLORS object and setColor function with type-safe C RGB tuple constants
- Extended palette from 8 core colors to 16 named constants including future section accents
- Zero V1 imports remain; TypeScript compiles cleanly; production route untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete V1 files and clean all V1 references** - `e7f55d0` (feat)
2. **Task 2: Replace hex color system with RGB tuple constants** - `672e3c6` (feat)

## Files Created/Modified
- `web/src/lib/pdf/generator.ts` - DELETED (V1 generator, 349 lines)
- `web/src/lib/pdf/layout.ts` - DELETED (V1 layout, 994 lines)
- `web/src/lib/pdf/__tests__/generator.test.ts` - DELETED (V1 tests, 182 lines)
- `web/src/lib/pdf/__tests__/layout.test.ts` - DELETED (V1 tests, 365 lines)
- `web/src/lib/pdf/__tests__/integration.test.ts` - DELETED (V1 tests, 294 lines)
- `web/src/lib/pdf/layout-v2.ts` - Replaced COLORS/setColor with C RGB tuple constants (16 colors, 55 call sites migrated)
- `web/src/lib/pdf/index.ts` - Updated barrel exports from V1 to V2
- `web/scripts/generate-sample-pdf.ts` - Updated import from generatePDF to generatePDFV2
- `web/scripts/send-test-email.ts` - Updated import from generatePDF to generatePDFV2
- `web/src/app/api/generate-pdf/__tests__/route.test.ts` - Updated mock from generator to generator-v2

## Decisions Made
- Named the color constant `C` instead of `COLORS` for shorter, more readable spread syntax (`...C.ink` vs `...COLORS.ink`)
- Core Four area accent colors (emailAccent, calendarAccent, personalAccent, businessAccent) use Tailwind-standard values as placeholders, marked for design review before Phase 3
- Production route (route.ts) was confirmed untouched -- it already imported V2

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- V1 code fully eliminated, clean codebase for all future PDF work
- RGB color palette ready for Phase 2 (cover page, framework page) and Phase 3 (task pages, CTA page)
- Core Four accent colors need design confirmation before Phase 3 implementation
- Plan 01-02 (design system extraction) can proceed immediately

## Self-Check: PASSED

- FOUND: web/src/lib/pdf/layout-v2.ts
- FOUND: web/src/lib/pdf/index.ts
- FOUND: .planning/phases/01-cleanup-foundation/01-01-SUMMARY.md
- FOUND: commit e7f55d0 (Task 1)
- FOUND: commit 672e3c6 (Task 2)
- CONFIRMED DELETED: web/src/lib/pdf/generator.ts
- CONFIRMED DELETED: web/src/lib/pdf/layout.ts

---
*Phase: 01-cleanup-foundation*
*Completed: 2026-02-25*
