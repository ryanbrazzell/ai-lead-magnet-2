---
phase: 04-ai-prompt
verified: 2026-02-25T02:29:15Z
status: gaps_found
score: 3/4 must-haves verified
gaps:
  - truth: "The report validator and fixer accept and preserve the coreTaskType field — they do not strip it or reject tasks that include it"
    status: partial
    reason: "The implementation correctly handles coreTaskType (accepts, preserves, uses in injection). However, the test files for report-validator.test.ts, report-fixer.test.ts, integration.test.ts, and task-generator.test.ts contain stale assertions hardcoded to 30 tasks / 10 per frequency / 40% EA thresholds from before Phase 4. The implementation now requires 24 tasks / 8 per frequency / 63% EA. This means 25 of 95 tests FAIL, blocking CI and signaling that the validator/fixer pipeline is not coherently tested for the new spec."
    artifacts:
      - path: "web/src/lib/ai/__tests__/report-validator.test.ts"
        issue: "createValidReport() builds 30-task (10/10/10) reports; tests assert isValid: true for 30-task reports, but validator expects exactly 24. Three tests fail: 'returns isValid: true for a valid report', 'validates exactly 30 total tasks', 'passes when EA percentage is exactly 40%'."
      - path: "web/src/lib/ai/__tests__/report-fixer.test.ts"
        issue: "createValidReport() builds 30-task (10/10/10) fixtures; fixTaskCount tests assert trim/pad to 10 per frequency, but the implementation enforces 8. Two fixTaskCount tests and two fixReportIssues tests fail."
      - path: "web/src/lib/ai/__tests__/integration.test.ts"
        issue: "createValidReportWithCoreEATasks() and helper fixtures use 30-task structure. Five integration tests fail, including the critical end-to-end and pipeline-flow tests, plus 'buildUnifiedPromptJSON includes lead context' which asserts 'DAILY TASKS MIX' — a string that no longer exists in the upgraded prompt."
      - path: "web/src/lib/ai/__tests__/task-generator.test.ts"
        issue: "Tests mock generateWithGemini but the implementation uses generateWithClaude (no ANTHROPIC_API_KEY in test env). Three error-handling tests and two fallback-escalation tests fail because Claude raises 'Missing API key' rather than the Gemini error patterns the tests expect."
    missing:
      - "Update report-validator.test.ts createValidReport() to build 24-task (8/8/8) fixtures; update 'exactly 30 total tasks' assertions to 24; update '40%' threshold assertions to match the new 50% floor for 24-task reports"
      - "Update report-fixer.test.ts createValidReport() to 24-task (8/8/8) fixtures; update fixTaskCount assertions from 10 to 8 per frequency; update fixReportIssues assertions to match"
      - "Update integration.test.ts helper fixtures to 24-task structure; remove 'DAILY TASKS MIX' assertion (string does not exist in Phase 4 prompt); update task count assertions throughout"
      - "Update task-generator.test.ts to mock generateWithClaude instead of generateWithGemini (task-generator now uses claude-client, not gemini-client); update error-message assertions to match Claude error strings"
---

# Phase 4: AI Prompt Upgrade — Verification Report

**Phase Goal:** The AI generates tasks with explicit Core Four classification and richer descriptions, improving grouping precision and content quality without breaking the existing validator/fixer pipeline

**Verified:** 2026-02-25T02:29:15Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AI-generated tasks include a coreTaskType field with one of four values (emailManagement, calendarManagement, personalLifeManagement, businessProcessManagement) | VERIFIED | `time-freedom-prompt.ts` lines 62-78 contain a dedicated `CORE TASK CLASSIFICATION` section. The field appears 5 times: in the classification section, task format spec, JSON example, and REQUIREMENTS block. All three fallback prompts (buildSimplifiedPrompt, buildEmergencyPrompt, buildStreamlinedPrompt) also include coreTaskType instruction with the four exact union values. |
| 2 | AI-generated task descriptions are 2-3 sentences each, specific to the lead's business context | VERIFIED | `time-freedom-prompt.ts` line 74: `"description: 2-3 sentences (40-60 words) explaining what this involves, with specific actions and business outcomes. Be detailed and reference the founder's context."` The fallback simplified prompt also states "2-3 sentence descriptions with specific actions". |
| 3 | AI output retains the daily/weekly/monthly frequency structure so the existing validator/fixer pipeline continues to pass without errors | VERIFIED | The prompt structure (`daily: [...], weekly: [...], monthly: [...]`) is unchanged. The validator in `report-validator.ts` still validates `report.tasks.daily`, `report.tasks.weekly`, `report.tasks.monthly`. The fixer in `report-fixer.ts` still operates on those three frequency buckets. The data shape is intact. |
| 4 | The report validator and fixer accept and preserve the coreTaskType field — they do not strip it or reject tasks that include it | PARTIAL | The implementation correctly handles coreTaskType in both files. The validator detects coreTaskType via `task.isCoreEATask && task.coreTaskType === 'emailManagement'` (and other variants). The fixer's `createMissingCoreEATasks()` injects tasks with `coreTaskType` set. However, 25 of 95 tests FAIL across 4 test files due to stale 30-task/10-per-frequency/40%-EA fixture data and mock targets not updated to reflect Phase 4 changes. |

**Score:** 3/4 truths verified

---

## Required Artifacts

| Artifact | Role | Status | Details |
|----------|------|--------|---------|
| `web/src/lib/ai/prompts/time-freedom-prompt.ts` | Main prompt with coreTaskType + richer descriptions | VERIFIED | CORE TASK CLASSIFICATION section present, coreTaskType in field list/example/REQUIREMENTS, 2-3 sentence description instruction at line 74 |
| `web/src/lib/ai/claude-client.ts` | Token budget for richer descriptions | VERIFIED | `CLAUDE_CONFIG.maxTokens: 8192` at line 57, doubled from previous 4096 |
| `web/src/lib/ai/prompts/fallback-prompts.ts` | Fallback prompts aligned with main | VERIFIED | All three functions (buildSimplifiedPrompt, buildEmergencyPrompt, buildStreamlinedPrompt) include coreTaskType instruction with four values |
| `web/src/lib/ai/report-validator.ts` | Accepts coreTaskType without rejection | VERIFIED (impl) | Correctly passes through coreTaskType; detection functions use it as positive signal |
| `web/src/lib/ai/report-fixer.ts` | Preserves coreTaskType in injected tasks | VERIFIED (impl) | createMissingCoreEATasks() sets coreTaskType on injected tasks; injectCoreEATasks() spreads full task object preserving all fields |
| `web/src/lib/ai/prompts/__tests__/prompt-system.test.ts` | Tests verify Phase 4 prompt content | VERIFIED | All 7 prompt-system tests pass; verifies CORE TASK CLASSIFICATION, coreTaskType values, 2-3 sentences, 24-task structure |
| `web/src/lib/ai/__tests__/report-validator.test.ts` | Tests for validator | STUB (stale) | 3 of 22 tests fail; createValidReport() fixture hardcoded to 30 tasks (10/10/10), but validator now expects 24 (8/8/8) |
| `web/src/lib/ai/__tests__/report-fixer.test.ts` | Tests for fixer | STUB (stale) | 4 of 13 tests fail; createValidReport() fixture hardcoded to 30 tasks; fixTaskCount asserts 10 per frequency, impl enforces 8 |
| `web/src/lib/ai/__tests__/integration.test.ts` | End-to-end pipeline tests | STUB (stale) | 5 of 11 tests fail; fixtures use 30-task structure; one test asserts 'DAILY TASKS MIX' string which was removed in Phase 4 |
| `web/src/lib/ai/__tests__/task-generator.test.ts` | Task generator service tests | STALE MOCK | 5 of 14 tests fail; tests mock generateWithGemini but task-generator.ts now imports generateWithClaude; error-message expectations don't match Claude error strings |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `time-freedom-prompt.ts` | Task type system | `CoreTaskType` union values | WIRED | Values `emailManagement`, `calendarManagement`, `personalLifeManagement`, `businessProcessManagement` match `src/types/task.ts` exactly |
| `fallback-prompts.ts` | Main prompt instruction | coreTaskType requirement | WIRED | All three fallback prompt functions include identical coreTaskType instruction |
| `report-fixer.ts` | `report-validator.ts` | `validateCoreEATasks` import | WIRED | Line 20: `import { validateCoreEATasks } from './report-validator'` |
| `task-generator.ts` | `claude-client.ts` | `generateWithClaude` import | WIRED | Line 16: `import { generateWithClaude } from './claude-client'` |
| `task-generator.test.ts` | `gemini-client` mock | vi.mock('../gemini-client') | NOT_WIRED | Test mocks gemini-client but implementation uses claude-client — mock does not apply, tests fail with ANTHROPIC_API_KEY errors |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| PROMPT-01: coreTaskType field in AI output | SATISFIED | Main prompt and all fallbacks instruct AI to include coreTaskType |
| PROMPT-02: 2-3 sentence richer descriptions | SATISFIED | Prompt upgraded from 15-25 words to 2-3 sentences (40-60 words) |
| PROMPT-03: daily/weekly/monthly structure retained | SATISFIED | JSON output structure unchanged; pipeline intact |
| PROMPT-04: validator/fixer accept coreTaskType | PARTIALLY SATISFIED | Implementation correct; test suite fails (25/95 tests) |

---

## Anti-Patterns Found

| File | Issue | Severity | Impact |
|------|-------|----------|--------|
| `web/src/lib/ai/__tests__/report-validator.test.ts` | createValidReport() builds 30-task fixture; 3 tests assert behavior matching old spec (30 tasks, 40% EA) | Blocker | Tests fail against production implementation — CI broken for report-validator |
| `web/src/lib/ai/__tests__/report-fixer.test.ts` | createValidReport() builds 30-task fixture; fixTaskCount asserts trim/pad to 10 (impl: 8) | Blocker | 4 tests fail — CI broken for report-fixer |
| `web/src/lib/ai/__tests__/integration.test.ts` | createValidReportWithCoreEATasks() uses 30-task structure; one test asserts 'DAILY TASKS MIX' (removed string) | Blocker | 5 integration tests fail — end-to-end pipeline untestable |
| `web/src/lib/ai/__tests__/task-generator.test.ts` | Mocks `../gemini-client` but implementation imports `./claude-client` | Blocker | 5 tests fail — mock target is wrong module |
| `web/src/types/task.ts` (comment) | JSDoc comment at line 64 still reads "Contains exactly 30 tasks (10 daily, 10 weekly, 10 monthly) with EA percentage between 40-60%" — does not reflect Phase 4 spec | Warning | Misleading documentation but does not block runtime |

---

## Human Verification Required

None identified for automated checks that pass. The prompt content changes (richer descriptions, coreTaskType instruction) are structural — they can be read directly from the prompt file and confirmed correct. Runtime verification of actual AI output quality would require a live API call with a real ANTHROPIC_API_KEY.

---

## Gaps Summary

Phase 4's core implementation work is correct and complete. The main prompt (`time-freedom-prompt.ts`), the token budget (`claude-client.ts`), and all three fallback prompts now request coreTaskType and 2-3 sentence descriptions. The validator and fixer implementations correctly accept and preserve coreTaskType without stripping it.

The single gap is that **four test files were not fully updated to match the Phase 4 spec**, resulting in 25 failing tests out of 95:

1. `report-validator.test.ts` and `report-fixer.test.ts` — fixtures still use 30-task / 10-per-frequency / 40% EA structure from before Phase 4. The implementation now enforces 24 tasks / 8 per frequency / ~63% EA.

2. `integration.test.ts` — same fixture problem, plus one test asserts the string `'DAILY TASKS MIX'` which was part of the old prompt and is no longer present.

3. `task-generator.test.ts` — tests mock `../gemini-client` but `task-generator.ts` was updated to use `./claude-client`. The mock does not intercept the right module, so 5 tests fail with `ANTHROPIC_API_KEY` missing errors instead of the expected Gemini error patterns.

The 04-02-SUMMARY.md acknowledged this as out-of-scope: "Note: report-validator and report-fixer tests have pre-existing stale assertions about 30-task counts and 40% EA ratios — these are outside scope of this plan." However, the stale tests leave the test suite in a failing state (25/95 failures) which blocks the pipeline from being verified as coherent and prevents CI from being a reliable signal.

---

_Verified: 2026-02-25T02:29:15Z_
_Verifier: Claude (gsd-verifier)_
