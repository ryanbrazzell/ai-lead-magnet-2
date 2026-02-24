# Phase 4: AI Prompt Upgrade - Research

**Researched:** 2026-02-24
**Domain:** AI prompt engineering (Claude API), JSON schema enforcement, validator/fixer pipeline compatibility
**Confidence:** HIGH

## Summary

Phase 4 modifies the AI prompt to request a `coreTaskType` field on every generated task and richer 2-3 sentence descriptions, while preserving the existing daily/weekly/monthly frequency structure that the validator/fixer pipeline depends on. The scope is narrow: update three prompt templates, update the JSON schema example in the main prompt, and ensure the validator/fixer preserve (not strip) the `coreTaskType` field through the pipeline.

The infrastructure is already favorable. The `coreTaskType` field already exists as an optional field on the `Task` interface in `web/src/types/task.ts`, the `CoreTaskType` union type already defines the four valid values (`emailManagement`, `calendarManagement`, `personalLifeManagement`, `businessProcessManagement`), and the report-fixer already creates fallback tasks WITH `coreTaskType` set. The validator already checks for core task presence using both keyword matching AND `coreTaskType` field (the `||` branch in each `has*Task` function). What is missing is: (1) the AI prompt does not ask for `coreTaskType` on every task, (2) the prompt's description instruction says "15-25 words" which is roughly one sentence, and (3) fallback/streamlined prompts do not mention `coreTaskType` at all.

The primary risk is the 4096 max output token budget. Currently, 24 tasks with short descriptions fit comfortably. Adding `coreTaskType` (one extra field per task, ~30 characters each) adds roughly 720 characters (~180 tokens). Expanding descriptions from 1 sentence to 2-3 sentences roughly doubles description length per task -- from ~20 words to ~50 words, adding ~720 words total (~960 tokens). Combined, this increases output by approximately 1,140 tokens. Current output uses an estimated 2,200-2,800 tokens (24 tasks with short descriptions + metadata), so the expanded output would need approximately 3,300-3,900 tokens -- tight but within the 4096 limit. The safest mitigation is to increase `maxTokens` to 8192 as a safety margin, which Claude Sonnet 4.5 supports (its max output is 16384 tokens per the API).

**Primary recommendation:** Update the TIME_FREEDOM_PROMPT_JSON template to include `coreTaskType` in the schema example and request 2-3 sentence descriptions. Update fallback prompts to include `coreTaskType` instruction. Increase `maxTokens` from 4096 to 8192 in claude-client.ts. The validator/fixer already handle `coreTaskType` correctly -- verify this with tests but expect no code changes needed there.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | (existing in project) | Claude API integration | Already in use for task generation |
| TypeScript | (existing in project) | Type-safe Task interface with coreTaskType | Already defines CoreTaskType union type |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | (existing in project) | Unit tests for prompt changes | Testing prompt content, validator/fixer behavior |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Free-form `coreTaskType` string in prompt | JSON Schema / tool_use structured output | Claude supports structured output via tool_use, but current architecture uses free-form JSON in a user message. Switching to tool_use is a larger refactor better suited for a future phase. Adding the field to the existing JSON example is sufficient. |
| Increasing maxTokens to 8192 | Keeping 4096 and reducing task count | Reducing tasks breaks the 24-task contract that the validator/fixer enforce. Increasing maxTokens is the correct fix. |

**Installation:**
```bash
# No new packages needed -- all work modifies existing code
```

## Architecture Patterns

### Recommended Project Structure
```
web/src/lib/ai/
├── prompts/
│   ├── time-freedom-prompt.ts  # PRIMARY: Add coreTaskType to schema, update description instruction
│   ├── fallback-prompts.ts     # Add coreTaskType instruction to simplified/streamlined/emergency prompts
│   ├── serialize-lead.ts       # No changes needed
│   └── index.ts                # No changes needed
├── claude-client.ts            # Increase maxTokens from 4096 to 8192
├── report-validator.ts         # Verify coreTaskType passthrough (likely no code changes)
├── report-fixer.ts             # Verify coreTaskType passthrough (likely no code changes)
└── task-generator.ts           # No changes needed
```

### Pattern 1: Adding coreTaskType to the JSON Schema Example
**What:** The main prompt (`TIME_FREEDOM_PROMPT_JSON`) contains a JSON example that the AI follows. Adding `coreTaskType` to this example teaches Claude to include it on every task.
**When to use:** In the prompt's `===== OUTPUT JSON =====` section.
**Example:**
```typescript
// Source: web/src/lib/ai/prompts/time-freedom-prompt.ts (to be modified)
// Current example task in prompt:
{
  "title": "Priority Inbox Zero Maintenance",
  "description": "Processing and organizing incoming emails, flagging urgent items, drafting responses, and maintaining inbox at zero.",
  "owner": "EA",
  "isEA": true,
  "category": "Communication"
}

// Updated example task in prompt:
{
  "title": "Priority Inbox Zero Maintenance",
  "description": "Processing and organizing all incoming emails, triaging into priority folders, drafting responses using your voice, and flagging urgent items. Your inbox stays at zero so you never waste time sorting through messages yourself.",
  "owner": "EA",
  "isEA": true,
  "category": "Communication",
  "coreTaskType": "emailManagement"
}
```

### Pattern 2: Description Length Instruction Update
**What:** Change the description instruction from "15-25 words" to request 2-3 sentences with specific, actionable detail.
**When to use:** In the prompt's `===== TASK FORMAT =====` section.
**Example:**
```typescript
// Current:
// - description: 15-25 words explaining what this involves

// Updated:
// - description: 2-3 sentences explaining what this involves, with specific actions and outcomes. Be detailed and vivid.
```

### Pattern 3: coreTaskType Classification Instruction
**What:** Add a new section or inline instruction telling Claude to classify each task into one of the four Core Four areas.
**When to use:** In the prompt's task format section and as a requirement.
**Example:**
```
===== CORE TASK CLASSIFICATION =====
Every task MUST include a coreTaskType field indicating which Core Four area it belongs to:
- "emailManagement": Email inbox, correspondence, filtering, responses
- "calendarManagement": Scheduling, meetings, appointments, time management
- "personalLifeManagement": Travel, family, personal errands, vendor coordination, personal appointments
- "businessProcessManagement": SOPs, workflows, reporting, CRM, recurring operations, automation

Choose the BEST fit for each task. When in doubt, use "businessProcessManagement" (broadest category).
```

### Pattern 4: maxTokens Increase for Token Safety
**What:** Increase the Claude API maxTokens parameter from 4096 to 8192 to accommodate the larger output.
**When to use:** In `claude-client.ts` CLAUDE_CONFIG.
**Example:**
```typescript
// Source: web/src/lib/ai/claude-client.ts line 54-60
export const CLAUDE_CONFIG = {
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.6,
  maxTokens: 8192,  // Increased from 4096 to accommodate coreTaskType + richer descriptions
  timeout: 90000,
  maxRetries: 1,
} as const;
```

### Anti-Patterns to Avoid
- **Making coreTaskType optional in the prompt instruction:** If the prompt says "optionally include coreTaskType," Claude will skip it on many tasks. The prompt must say "MUST include" and demonstrate it on every example task.
- **Using different coreTaskType values than the TypeScript type:** The prompt must use exactly `emailManagement`, `calendarManagement`, `personalLifeManagement`, `businessProcessManagement` -- not abbreviations, not different casing, not alternative names. These values must match `CoreTaskType` in `web/src/types/task.ts`.
- **Adding coreTaskType validation that rejects tasks missing it:** Since the AI is not guaranteed to always include it, the validator should NOT treat missing `coreTaskType` as an error. The field is optional on the Task interface for good reason. Phase 3's inference classifier handles the fallback.
- **Changing the daily/weekly/monthly output structure:** The validator checks for 24 total tasks (8 daily, 8 weekly, 8 monthly). The fixer enforces 8 per frequency. The prompt MUST retain this structure. `coreTaskType` is an ADDITIONAL field, not a replacement for the frequency grouping.
- **Removing the existing keyword-based core task detection:** The validator's `has*Task` functions should continue to work via keyword matching AS WELL AS `coreTaskType`. The `||` pattern already exists (e.g., `text.includes('email') || (task.isCoreEATask && task.coreTaskType === 'emailManagement')`). Do not remove the keyword branch -- it's the safety net if `coreTaskType` is absent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| coreTaskType field definition | New type or enum | Existing `CoreTaskType` union in `web/src/types/task.ts` | Already defined, already used by validator and fixer |
| Core task validation with coreTaskType | New validation logic | Existing `has*Task` functions in report-validator.ts | Already check `coreTaskType` field via the `||` branch |
| Fallback tasks with coreTaskType | New fallback task creation | Existing `createMissingCoreEATasks` in report-fixer.ts | Already sets `coreTaskType` on every fallback task |
| Token budget estimation | Manual character counting | Increase maxTokens to 8192 | Claude Sonnet 4.5 supports up to 16384 output tokens; doubling the current limit provides comfortable headroom |

**Key insight:** The entire coreTaskType infrastructure already exists in the TypeScript layer (types, validator, fixer). Phase 4's job is simply to make the AI actually emit this field by asking for it in the prompt. The downstream code is already ready.

## Common Pitfalls

### Pitfall 1: Token Truncation Causing Malformed JSON
**What goes wrong:** The AI response gets cut off at the token limit mid-JSON, producing invalid JSON that `parseClaudeResponse` cannot parse.
**Why it happens:** With 4096 maxTokens, the expanded descriptions + coreTaskType fields push the output past the limit. Claude stops generating mid-token, producing incomplete JSON like `{"tasks":{"daily":[...], "weekly":[...], "month`.
**How to avoid:** Increase `maxTokens` to 8192 in `CLAUDE_CONFIG`. This is the single most important change in Phase 4. Without it, all other prompt changes are moot because the output will be truncated.
**Warning signs:** `Failed to parse Claude response: Unexpected end of JSON input` errors in production logs. The `parseClaudeResponse` function in claude-client.ts will throw with this exact error message.

### Pitfall 2: AI Generating Inconsistent coreTaskType Values
**What goes wrong:** Claude returns values like `"email_management"`, `"Email Management"`, `"email"`, or `"emailMgmt"` instead of the exact `"emailManagement"` value.
**Why it happens:** The prompt instruction is not specific enough about exact string values, or the AI "improvises" similar-looking values.
**How to avoid:** The prompt must list ALL FOUR exact values, demonstrate them in the example JSON, and include them in the REQUIREMENTS section. The JSON example is the strongest signal -- Claude follows examples closely.
**Warning signs:** The `coreTaskType` field is present but the value does not match any of the four `CoreTaskType` union values. A post-parse normalizer could fix this, but a clear prompt prevents it.

### Pitfall 3: Prompt Test Expectations Becoming Stale
**What goes wrong:** The test in `web/src/lib/ai/prompts/__tests__/prompt-system.test.ts` has hardcoded expectations like `toContain('CRITICAL DISTRIBUTION REQUIREMENT')` and line count checks (`expect(lineCount).toBeGreaterThanOrEqual(230)`). These assertions will fail when the prompt text changes.
**Why it happens:** Tests were written for the original 240-line prompt version. The current prompt is only 98 lines long. The test expectations are already partially stale (they check for sections that do not exist in the current prompt).
**How to avoid:** Update the test expectations to match the new prompt content. Add tests that verify the prompt contains `coreTaskType` instruction and the richer description guidance. Fix or remove the line count assertion (the current prompt is ~98 lines; after Phase 4 changes it may be ~120-140 lines).
**Warning signs:** Test failures on CI after prompt changes, with error messages about missing prompt sections.

### Pitfall 4: Fallback Prompts Not Updated
**What goes wrong:** The main prompt produces tasks with `coreTaskType`, but when the fallback prompts are used (simplified, streamlined, emergency), the output lacks `coreTaskType` entirely.
**Why it happens:** Only the main prompt (`TIME_FREEDOM_PROMPT_JSON`) is updated; the fallback prompts in `fallback-prompts.ts` are forgotten.
**How to avoid:** Update all three fallback prompts (`buildSimplifiedPrompt`, `buildEmergencyPrompt`, `buildStreamlinedPrompt`) to include the `coreTaskType` instruction. For the ultra-streamlined prompt (which is intentionally minimal), at minimum add a one-line note: "Include coreTaskType on each task: emailManagement, calendarManagement, personalLifeManagement, or businessProcessManagement."
**Warning signs:** Tasks generated via fallback prompts (when primary fails) lack `coreTaskType`, causing Phase 3's Core Four classifier to fall back to inference for 100% of tasks.

### Pitfall 5: Breaking the 24-Task / 8-Per-Frequency Contract
**What goes wrong:** The new prompt inadvertently changes the task count or frequency distribution, causing the validator to reject the output and trigger the fixer, which then creates generic filler tasks.
**Why it happens:** Adding new instructions to the prompt can "distract" the AI from the existing count requirements. If the `coreTaskType` classification section is too prominent, the AI may reorganize tasks by Core Four area instead of by frequency.
**How to avoid:** Keep the task count and frequency requirements prominent and repeated. The REQUIREMENTS section must still say "Exactly 24 tasks total (8 daily, 8 weekly, 8 monthly)". The `coreTaskType` instruction should be framed as an additional field, not an alternative grouping. Include a reminder: "Tasks are grouped by frequency (daily/weekly/monthly), NOT by coreTaskType."
**Warning signs:** Validator errors like "Expected 24 total tasks, got 16" or "Expected 8 daily tasks, got 4".

### Pitfall 6: isCoreEATask Not Set When coreTaskType Is
**What goes wrong:** The AI sets `coreTaskType` but does not set `isCoreEATask: true`, or vice versa. The validator's `has*Task` functions check `task.isCoreEATask && task.coreTaskType === '...'` (both must be true).
**Why it happens:** The prompt mentions `coreTaskType` but does not explain the relationship to `isCoreEATask`. The AI does not know these are related.
**How to avoid:** Do NOT add `isCoreEATask` to the prompt. The current detection functions use keyword matching as the primary path (`text.includes('email')`) and the `isCoreEATask && coreTaskType` as a secondary path. Since keyword matching is sufficient and already proven, there is no need to ask the AI for `isCoreEATask`. If desired in the future, the fixer can set `isCoreEATask = true` on any task that has `coreTaskType` set.
**Warning signs:** No practical impact since keyword matching handles detection. This is a theoretical concern only.

## Code Examples

Verified patterns from the existing codebase:

### Current Main Prompt (to be modified)
```typescript
// Source: web/src/lib/ai/prompts/time-freedom-prompt.ts (full file, 98 lines)
// Key sections that need updating:
//
// Line 19: "Generate 24 personalized tasks (8 per category: Daily, Weekly, Monthly)."
//   -> No change needed (task count stays the same)
//
// Line 64: "- description: 15-25 words explaining what this involves"
//   -> Change to: "- description: 2-3 sentences (40-60 words) explaining what this involves, with specific actions and outcomes"
//
// Line 67: "- category: One of Communication|Scheduling|..."
//   -> Add after this: "- coreTaskType: One of emailManagement|calendarManagement|personalLifeManagement|businessProcessManagement"
//
// Lines 70-81 (JSON example): Add coreTaskType to example task
//
// Lines 92-97 (REQUIREMENTS): Add requirement for coreTaskType
```

### Current Claude Config (to be modified)
```typescript
// Source: web/src/lib/ai/claude-client.ts lines 54-60
export const CLAUDE_CONFIG = {
  model: 'claude-sonnet-4-5-20250929',
  temperature: 0.6,
  maxTokens: 4096,   // <- Change to 8192
  timeout: 90000,
  maxRetries: 1,
} as const;
```

### Validator Core Task Detection (already compatible -- no changes needed)
```typescript
// Source: web/src/lib/ai/report-validator.ts lines 226-237
export function hasEmailManagementTask(tasks: Task[]): boolean {
  return tasks.some((task) => {
    const text = `${task.title} ${task.description}`.toLowerCase();
    return (
      task.isEA &&
      (text.includes('email') ||
        text.includes('inbox') ||
        text.includes('correspondence') ||
        (task.isCoreEATask && task.coreTaskType === 'emailManagement'))
      // ^^^ Already handles coreTaskType! No changes needed.
    );
  });
}
```

### Fixer Fallback Tasks (already set coreTaskType -- no changes needed)
```typescript
// Source: web/src/lib/ai/report-fixer.ts lines 73-86
// createMissingCoreEATasks already sets coreTaskType:
coreEATasks.push({
  title: 'Complete Email Management',
  description: 'Your assistant manages your entire inbox, responses, filtering...',
  owner: 'EA',
  isEA: true,
  frequency: 'daily',
  category: 'Communication',
  priority: 'high',
  isCoreEATask: true,
  coreTaskType: 'emailManagement',  // Already set!
});
```

### parseClaudeResponse (already compatible -- no changes needed)
```typescript
// Source: web/src/lib/ai/claude-client.ts lines 92-122
// This function parses raw JSON text into TaskGenerationResult.
// It uses JSON.parse which preserves ALL fields, including coreTaskType.
// Since Task.coreTaskType is optional, unknown fields are not rejected.
// No changes needed.
```

### Existing Inconsistencies to Be Aware Of
```typescript
// INCONSISTENCY: Task count discrepancy between prompt and tests
//
// Main prompt (time-freedom-prompt.ts):
//   "Generate 24 personalized tasks (8 per category)"
//   "ea_task_count must equal 15 (5 EA tasks x 3 categories)"
//   "total_task_count: 24"
//
// Validator (report-validator.ts):
//   "if (analysis.totalTasks !== 24)" -- validates 24
//   "if (analysis.dailyTasks !== 8)" -- validates 8 per frequency
//
// Fixer (report-fixer.ts):
//   "updatedReport.total_task_count = 24" -- enforces 24
//   "if (tasks.length !== 8)" -- enforces 8 per frequency
//
// Fallback prompts (fallback-prompts.ts):
//   "Generate exactly 30 tasks (10 daily, 10 weekly, 10 monthly)" -- says 30!
//   "30 tasks (10 each: daily/weekly/monthly)" -- says 30!
//
// Tests (task-generator.test.ts, integration.test.ts):
//   "expect(result.total_task_count).toBe(30)" -- expects 30!
//
// RESOLUTION: The validator and fixer enforce 24 tasks (8 per frequency).
// The main prompt asks for 24. The fallback prompts ask for 30 but the
// fixer trims to 24 (8 per frequency). Tests are stale and reference the
// old 30-task count. Phase 4 should align fallback prompts to say 24,
// but test fixes are out of scope unless they block the work.
```

## Detailed File-by-File Change Analysis

### 1. `web/src/lib/ai/prompts/time-freedom-prompt.ts` -- MODIFY
**Changes needed:**
- Add `coreTaskType` to the task format section
- Change description instruction from "15-25 words" to "2-3 sentences"
- Add `coreTaskType` field to the JSON example task
- Add `coreTaskType` instruction block
- Add coreTaskType requirement to REQUIREMENTS section
- Update example description to be 2-3 sentences (to demonstrate the desired length)

**Risk:** LOW -- prompt text changes only; no logic changes.

### 2. `web/src/lib/ai/prompts/fallback-prompts.ts` -- MODIFY
**Changes needed:**
- `buildSimplifiedPrompt`: Add coreTaskType instruction and richer description guidance
- `buildStreamlinedPrompt`: Add coreTaskType instruction (minimal -- this prompt is intentionally brief)
- `buildEmergencyPrompt`: Add coreTaskType instruction (minimal -- this is last resort)
- Align all three to say 24 tasks (8 per frequency) instead of 30 tasks (10 per frequency)

**Risk:** LOW -- prompt text changes only.

### 3. `web/src/lib/ai/claude-client.ts` -- MODIFY
**Changes needed:**
- Change `maxTokens: 4096` to `maxTokens: 8192` in CLAUDE_CONFIG
- Update the file header comment to reflect the new maxTokens value

**Risk:** LOW -- single numeric change. Claude Sonnet 4.5 supports up to 16384 output tokens per the Anthropic API.

### 4. `web/src/lib/ai/report-validator.ts` -- VERIFY (likely no changes)
**Changes needed:**
- VERIFY that existing `has*Task` functions correctly detect tasks via `coreTaskType` field
- Already confirmed: each function has `(task.isCoreEATask && task.coreTaskType === '...')` as an alternative detection path
- No code changes expected

**Risk:** NONE -- verification only.

### 5. `web/src/lib/ai/report-fixer.ts` -- VERIFY (likely no changes)
**Changes needed:**
- VERIFY that `fixReportIssues`, `ensureCoreEATasks`, `fixTaskCount`, and `fixLowEAPercentage` preserve the `coreTaskType` field on tasks they process
- Already confirmed: `fixTaskCount` uses array slicing (preserves all fields), `fixLowEAPercentage` uses spread operator (preserves all fields), `ensureCoreEATasks` creates tasks with `coreTaskType` already set
- No code changes expected

**Risk:** NONE -- verification only.

### 6. `web/src/lib/ai/prompts/__tests__/prompt-system.test.ts` -- MODIFY
**Changes needed:**
- Update test expectations for prompt content (add coreTaskType checks)
- Fix stale assertions (line count, section names that do not match current prompt)
- Add test: prompt contains coreTaskType instruction
- Add test: prompt requests 2-3 sentence descriptions

**Risk:** LOW -- test updates only.

## Token Budget Analysis

### Current Output Estimate (24 tasks, short descriptions)
```
Fixed structure overhead:
  {"tasks":{"daily":[...],"weekly":[...],"monthly":[...]},
  "ea_task_percent":63,"ea_task_count":15,"total_task_count":24,
  "summary":"..."}
  ~= 150 tokens

Per task (current short description):
  {"title":"...(5 words)","description":"...(20 words)","owner":"EA","isEA":true,"category":"..."}
  ~= 50-60 tokens per task

24 tasks x 55 tokens = 1,320 tokens
Total current: ~1,470 tokens (well within 4096)
```

### Estimated Output After Phase 4 (24 tasks, rich descriptions + coreTaskType)
```
Per task (expanded):
  {"title":"...(5 words)","description":"...(50 words, 2-3 sentences)","owner":"EA","isEA":true,
   "category":"...","coreTaskType":"emailManagement"}
  ~= 90-110 tokens per task

24 tasks x 100 tokens = 2,400 tokens
Total after Phase 4: ~2,550 tokens

Safety margin with 8192 maxTokens: 5,642 tokens headroom
Safety margin with 4096 maxTokens: 1,546 tokens headroom (risky -- one verbose response could truncate)
```

### Recommendation
Increase `maxTokens` to 8192. The cost difference is negligible (you only pay for actual tokens generated, not the maximum). The risk of truncation with 4096 is real; the risk with 8192 is near-zero.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Keyword inference for Core Four classification | Still current (Phase 3) | Phase 3 | Phase 4 adds explicit `coreTaskType` from AI, but keyword inference remains as fallback |
| Short 15-25 word descriptions | Still current | Original implementation | Phase 4 upgrades to 2-3 sentence descriptions for richer PDF content |
| 4096 maxTokens | Still current | Original implementation | Phase 4 increases to 8192 for safety margin |

**Deprecated/outdated:**
- The test suite references 30 tasks (10 per frequency) but the validator/fixer enforce 24 tasks (8 per frequency). The tests are stale.
- The prompt test expects 230-250 lines but the current prompt is 98 lines. The test is stale.
- The fallback prompts request 30 tasks but the fixer trims to 24. The prompts should be aligned.

## Open Questions

1. **Should the prompt explicitly request `isCoreEATask: true` alongside `coreTaskType`?**
   - What we know: The validator's `has*Task` functions check `task.isCoreEATask && task.coreTaskType` together (both must be true). If the AI sets `coreTaskType` but not `isCoreEATask`, the coreTaskType-based detection path does not trigger.
   - What's unclear: Whether to add `isCoreEATask` to the prompt (increases output tokens, adds complexity for the AI) or to fix the validator to check just `coreTaskType`.
   - Recommendation: Do NOT add `isCoreEATask` to the prompt. The keyword-based detection path is the primary path and works without `isCoreEATask`. The `coreTaskType` field's primary consumer is Phase 3's inference classifier (`inferCoreTaskType`), which does NOT check `isCoreEATask`. If strict validator compatibility is desired, the fixer could add a post-processing step: `if (task.coreTaskType) task.isCoreEATask = true;`. This is a 2-line change in the fixer.

2. **Should the fallback prompts be aligned to 24 tasks (8 per frequency) while we are modifying them?**
   - What we know: The fallback prompts currently say "30 tasks (10 per frequency)" but the fixer enforces 24 tasks (8 per frequency). This is wasteful -- the AI generates 30 tasks and 6 get trimmed.
   - What's unclear: Whether aligning this is in scope for Phase 4 or a separate cleanup.
   - Recommendation: Align while we are already modifying the fallback prompts. It is a one-line change per fallback prompt and reduces wasted AI generation tokens.

3. **Should we add a post-parse coreTaskType normalizer?**
   - What we know: If the AI returns a slightly wrong value (e.g., `"email_management"` instead of `"emailManagement"`), it would not match the TypeScript type.
   - What's unclear: How reliable Claude Sonnet 4.5 is at following exact string values from examples.
   - Recommendation: Add a lightweight normalizer in `parseClaudeResponse` or as a post-processing step: map common variations to the canonical values. This is defensive coding with minimal cost. If testing shows Claude reliably follows the example, the normalizer becomes a no-op safety net.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `web/src/lib/ai/prompts/time-freedom-prompt.ts` -- current prompt text, JSON schema, task count requirements
- Direct codebase inspection of `web/src/lib/ai/prompts/fallback-prompts.ts` -- all three fallback prompt builders
- Direct codebase inspection of `web/src/lib/ai/claude-client.ts` -- CLAUDE_CONFIG with maxTokens: 4096, model: claude-sonnet-4-5-20250929
- Direct codebase inspection of `web/src/lib/ai/report-validator.ts` -- all four `has*Task` functions, `validateReport`, task count validation (24 total, 8 per frequency)
- Direct codebase inspection of `web/src/lib/ai/report-fixer.ts` -- `createMissingCoreEATasks` (already sets coreTaskType), `fixTaskCount` (enforces 8 per frequency), all spread operators preserve fields
- Direct codebase inspection of `web/src/types/task.ts` -- `CoreTaskType` union type, `Task` interface with optional `coreTaskType` field
- Direct codebase inspection of `web/src/app/api/generate-tasks/route.ts` -- full pipeline: generate -> validate -> fix -> ensureCoreEATasks -> return
- Direct codebase inspection of `web/src/lib/ai/prompts/__tests__/prompt-system.test.ts` -- stale test expectations identified
- Phase 3 research (`.planning/phases/03-task-pages-cta/03-RESEARCH.md`) -- confirms Phase 3's `inferCoreTaskType` will prefer explicit `coreTaskType` field and fall back to keyword matching

### Secondary (MEDIUM confidence)
- Token budget calculations are estimates based on typical Claude tokenization ratios (~1.3 tokens per word for English, ~4 characters per token for JSON). Actual token usage will vary based on AI response verbosity.
- Claude Sonnet 4.5 max output token support (16384 tokens) is based on Anthropic API documentation as of model version `claude-sonnet-4-5-20250929`.

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all work modifies existing prompt text and one config value
- Architecture (prompt changes): HIGH -- adding a field to an existing JSON schema example is well-understood; Claude follows JSON examples reliably
- Architecture (validator/fixer compatibility): HIGH -- verified through direct code inspection that both already handle coreTaskType
- Token budget: MEDIUM -- estimates are theoretical; actual token usage depends on AI response verbosity. The 8192 maxTokens increase provides generous safety margin.
- Pitfalls: HIGH -- all pitfalls identified from code inspection, known inconsistencies documented

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- no external dependency changes expected)
