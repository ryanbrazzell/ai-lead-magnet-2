---
phase: 04-ai-prompt
plan: 01
subsystem: ai
tags: [claude, prompt-engineering, core-four, task-generation]

# Dependency graph
requires:
  - phase: 03-task-pages-cta
    provides: "Core Four task grouping with inferCoreTaskType keyword classifier"
provides:
  - "AI prompt requesting explicit coreTaskType on every generated task"
  - "Richer 2-3 sentence task descriptions from AI output"
  - "8192-token budget for larger AI responses"
affects: [04-ai-prompt, 05-pdf-visual-design]

# Tech tracking
tech-stack:
  added: []
  patterns: ["AI prompt structured with explicit field classification instructions"]

key-files:
  created: []
  modified:
    - "web/src/lib/ai/prompts/time-freedom-prompt.ts"
    - "web/src/lib/ai/claude-client.ts"

key-decisions:
  - "coreTaskType added to prompt with all four CoreTaskType union values matching web/src/types/task.ts"
  - "Description instruction upgraded from 15-25 words to 2-3 sentences (40-60 words)"
  - "maxTokens doubled from 4096 to 8192 to prevent JSON truncation with richer descriptions"
  - "isCoreEATask intentionally excluded from prompt per research findings"

patterns-established:
  - "AI prompt CORE TASK CLASSIFICATION section pattern for explicit field requests"

# Metrics
duration: 1min
completed: 2026-02-25
---

# Phase 4 Plan 1: AI Prompt + Token Budget Summary

**coreTaskType classification and 2-3 sentence descriptions added to main AI prompt with maxTokens doubled to 8192**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-25T02:18:39Z
- **Completed:** 2026-02-25T02:20:05Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added CORE TASK CLASSIFICATION section to AI prompt with all four Core Four area types and selection guidance
- Upgraded description instruction from 15-25 words to 2-3 sentences (40-60 words) with specific actions and business outcomes
- Added coreTaskType field to task format spec, JSON example, and REQUIREMENTS section (5 total occurrences)
- Doubled maxTokens from 4096 to 8192 to accommodate larger output with richer descriptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add coreTaskType and richer descriptions to main prompt** - `7124094` (feat)
2. **Task 2: Increase maxTokens from 4096 to 8192** - `7b0c1ae` (feat)

## Files Created/Modified
- `web/src/lib/ai/prompts/time-freedom-prompt.ts` - Main AI prompt with CORE TASK CLASSIFICATION section, richer description instruction, coreTaskType in field list/example/requirements
- `web/src/lib/ai/claude-client.ts` - CLAUDE_CONFIG.maxTokens increased from 4096 to 8192

## Decisions Made
- coreTaskType uses exact CoreTaskType union values (emailManagement, calendarManagement, personalLifeManagement, businessProcessManagement) matching web/src/types/task.ts
- Description instruction requests 40-60 words with specific actions and business outcomes
- isCoreEATask intentionally excluded from prompt -- per research, it is not needed (inference-based)
- maxTokens doubled (not tripled) -- 8192 provides sufficient headroom for 24 tasks with 2-3 sentence descriptions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 04-02-PLAN.md (fallback prompts + stale prompt tests)
- Main prompt upgrade complete; fallback/validator pipeline next

## Self-Check: PASSED

All files exist on disk. All commits verified in git log.

---
*Phase: 04-ai-prompt*
*Completed: 2026-02-25*
