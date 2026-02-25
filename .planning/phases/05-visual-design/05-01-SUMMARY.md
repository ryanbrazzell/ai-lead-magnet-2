---
phase: 05-visual-design
plan: 01
subsystem: design
tags: [jsPDF, color-system, typography, adversarial-design, visual-design, PDF]

# Dependency graph
requires:
  - phase: 01-cleanup-foundation
    provides: C color constant object with RGB tuples, Core Four placeholder accents
  - phase: 02-cover-roi-framework
    provides: Cover page, ROI block, framework page layout
  - phase: 03-task-pages-cta
    provides: Task page renderers, CTA page, Core Four section headers
provides:
  - Finalized visual design decisions for all 8 PDF design dimensions
  - RGB color values for Core Four accents (primary, light, text variants)
  - CTA button color decision (Gold for final page, Teal for inline)
  - Typography and spacing adjustments for task density
  - Implementation Cheat Sheet mapping decisions to code targets
affects: [05-02-PLAN, layout-v2.ts]

# Tech tracking
tech-stack:
  added: []
  patterns: [adversarial-design-process, three-perspective-debate]

key-files:
  created:
    - .planning/phases/05-visual-design/05-01-DESIGN-DECISIONS.md
  modified: []

key-decisions:
  - "Core Four accents: Teal [13,115,119], Blue [37,99,235], Deep Amber [217,119,6], Emerald [5,150,105] -- brand-derived with contrast corrections"
  - "CTA final page button: Gold [245,158,11] with Navy [15,23,42] text -- visual disruption at conversion point"
  - "Inline CTAs stay teal -- gold reserved for final CTA page only"
  - "Task card gap reduced from 6mm to 4mm for density/overwhelm effect"
  - "Task name font reduced from 13pt to 12pt, section header from 14pt to 13pt"
  - "Investment block EA cost line colored muted red [186,28,28] -- financial convention"
  - "Framework page Core Four boxes use per-area light accent backgrounds with 3mm accent bars"
  - "CTA page top margin increased from 20mm to 30mm for relief contrast"
  - "Footer unchanged -- current treatment is optimal per unanimous agreement"

patterns-established:
  - "Adversarial design: 3 perspectives (Marketing/Simplicity/Density) propose, critique, synthesize per dimension"
  - "Design-to-code mapping: every decision includes Code target pointing to specific function/constant"

# Metrics
duration: 6min
completed: 2026-02-25
---

# Phase 5 Plan 01: Visual Design Decisions Summary

**Adversarial three-perspective design debate producing implementable RGB/mm/pt values for 8 PDF visual dimensions with Core Four accent palette (Teal/Blue/Amber/Emerald) and gold CTA button**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-25T03:26:31Z
- **Completed:** 2026-02-25T03:32:40Z
- **Tasks:** 1 of 2 (Task 2 is checkpoint:human-verify -- awaiting user review)
- **Files created:** 1

## Accomplishments
- Ran structured adversarial debate across all 8 design dimensions with three named perspectives
- Each dimension has 3 proposals with exact jsPDF-implementable values, 6 critiques with specific objections, and a synthesis decision
- Core Four accent colors finalized with 12 color values (4 primary + 4 light + 4 text variants)
- Implementation Cheat Sheet provides flat list of every constant change, spacing change, and renderer modification for Plan 05-02

## Task Commits

Each task was committed atomically:

1. **Task 1: Run adversarial design debate across all 8 dimensions** - `a3e131a` (feat)

**Note:** Task 2 (checkpoint:human-verify) not yet executed -- awaiting user review of design decisions.

## Files Created/Modified
- `.planning/phases/05-visual-design/05-01-DESIGN-DECISIONS.md` - Complete adversarial design process output with 8 dimension decisions and implementation cheat sheet

## Decisions Made
- **Core Four Palette:** Teal/Blue/Deep Amber/Emerald (brand-derived with contrast corrections from Density advocate). Navy rejected as calendar accent (too close to ink). Gold rejected as personal accent (poor white-text contrast). Each accent has 3 variants: full, light (~95% lightness), and text-safe.
- **CTA Button:** Gold with Navy text on final CTA page only. Inline CTAs remain teal. Gold creates visual disruption needed at conversion point -- teal fatigue after 5+ pages makes same-color CTA invisible.
- **Cover Pain Treatment:** Selective color-coding in investment block only (muted red for cost, teal for return). Full-page red treatment rejected as too aggressive for CEO audience. Pain text stays teal (authoritative, not alarming).
- **Framework Boxes:** Widened accent bars (2mm to 3mm) with per-area light accent backgrounds. Title text stays C.ink for readability (accent-colored titles rejected due to contrast risk).
- **Task Density:** 4mm card gap (from 6mm) for overwhelm. 12pt task names and 13pt section headers (both reduced by 1pt). Card backgrounds rejected as visual clutter.
- **CTA Openness:** Top margin increased to 30mm (from 20mm). Structure unchanged -- audit steps are conversion-critical.
- **Typography:** No bolditalic used anywhere. Size hierarchy preserved with subtle compression on task pages.
- **Footer:** No changes. Page numbers rejected (undermine overwhelm ambiguity). Running headers rejected (architectural complexity).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- DESIGN-DECISIONS.md is ready for user review (Task 2 checkpoint)
- Implementation Cheat Sheet provides complete mapping for Plan 05-02
- Awaiting user approval before Plan 05-02 applies these decisions to layout-v2.ts

---
*Phase: 05-visual-design*
*Completed: 2026-02-25 (Task 1 only -- Task 2 checkpoint pending)*
