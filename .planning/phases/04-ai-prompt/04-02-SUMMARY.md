---
phase: 04-ai-prompt
plan: 02
subsystem: ai
tags: [prompts, coreTaskType, fallback-prompts, testing, vitest]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Main prompt with coreTaskType classification and 24-task structure"
provides:
  - "Fallback prompts aligned with main prompt (coreTaskType + 24 tasks + 63% EA)"
  - "Updated prompt system tests verifying Phase 4 prompt content"
affects: [05-design]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All prompt paths (main + 3 fallbacks) request coreTaskType consistently"
    - "Test assertions match actual implementation output, not historical spec"

key-files:
  created: []
  modified:
    - "web/src/lib/ai/prompts/fallback-prompts.ts"
    - "web/src/lib/ai/prompts/__tests__/prompt-system.test.ts"

key-decisions:
  - "Fallback EA delegation minimum aligned to 15 (63%) matching main prompt ratio"
  - "Streamlined prompt (ultra-optimized) gets coreTaskType instruction despite brevity constraint"
  - "Fixed pre-existing stale website analysis test as Rule 1 deviation"

patterns-established:
  - "All AI prompt paths must include coreTaskType instruction with exact CoreTaskType union values"

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 4 Plan 2: Fallback Prompts coreTaskType + Test Updates Summary

**All three fallback prompts aligned with main prompt: coreTaskType instruction with four CoreTaskType values, 24-task counts (8/8/8), and 63% EA delegation; prompt system tests updated with Phase 4 assertions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T02:22:35Z
- **Completed:** 2026-02-25T02:25:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- All three fallback prompts (buildSimplifiedPrompt, buildEmergencyPrompt, buildStreamlinedPrompt) now include coreTaskType instruction with the four exact CoreTaskType values
- Task counts changed from 30 (10/10/10) to 24 (8/8/8) across all fallback prompts
- EA delegation minimum updated from 12 (40%) to 15 (63%) matching main prompt
- Prompt system test rewritten to verify Phase 4 content: coreTaskType classification, 2-3 sentence descriptions, 24-task structure, isCoreEATask absence

## Task Commits

Each task was committed atomically:

1. **Task 1: Update fallback prompts with coreTaskType and aligned task counts** - `68b6830` (feat)
2. **Task 2: Update prompt system tests for new prompt content** - `621dfc5` (test)

## Files Created/Modified
- `web/src/lib/ai/prompts/fallback-prompts.ts` - Added coreTaskType instruction to all three fallback prompt builders, aligned task counts to 24, updated EA delegation ratio
- `web/src/lib/ai/prompts/__tests__/prompt-system.test.ts` - Replaced stale 240-line prompt test with Phase 4 assertions, fixed website analysis test

## Decisions Made
- [04-02]: Fallback EA delegation minimum aligned to 15 (63%) matching main prompt's 5-EA-per-frequency ratio
- [04-02]: Streamlined prompt (ultra-optimized isNewForm branch) gets coreTaskType instruction despite brevity optimization
- [04-02]: Fixed pre-existing stale website analysis test assertions as deviation (Rule 1)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed stale website analysis test assertions**
- **Found during:** Task 2 (prompt system test update)
- **Issue:** The `serializeLeadData > includes website analysis context when available` test expected `--- WEBSITE ANALYSIS ---`, `Industry:`, `Business Category:`, `Key Services:`, `Estimated Team Size:`, `Website Analysis Confidence:` -- none of which exist in the current `serializeLeadData` implementation. The implementation uses `--- COMPANY WEBSITE CONTENT ---` with `Website URL:`, `Website Title:`, `Website Description:`, and raw content sections.
- **Fix:** Updated test assertions to match actual `serializeLeadData` output: `--- COMPANY WEBSITE CONTENT ---`, `Website URL:`, `Website Title:`, `Website Description:`, `RAW WEBSITE CONTENT`, `END WEBSITE CONTENT`
- **Files modified:** web/src/lib/ai/prompts/__tests__/prompt-system.test.ts
- **Verification:** All 7 prompt-system tests pass
- **Committed in:** 621dfc5 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix -- test was already broken before this plan. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 complete: all AI prompt paths (main + 3 fallbacks) now request coreTaskType with exact CoreTaskType union values
- All prompt-system tests pass with Phase 4 assertions
- Ready for Phase 5 (design/adversarial review)
- Note: report-validator and report-fixer tests have pre-existing stale assertions about 30-task counts and 40% EA ratios (from before 04-01 changes) -- these are outside scope of this plan

## Self-Check: PASSED

All files verified present. All commit hashes verified in git log.

---
*Phase: 04-ai-prompt*
*Completed: 2026-02-25*
