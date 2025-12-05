# Task Breakdown: AI Task Generation Service

## Overview
Total Tasks: 28

## Source Code Reference

The following production code must be ported:
- **Main Prompt Logic**: `/Users/ryanbrazzell/ea-time-freedom-report-new/app/utils/unifiedPromptJSON.ts` (372 lines)
- **Validation Logic**: `/Users/ryanbrazzell/ea-time-freedom-report-new/app/utils/reportValidator.ts` (615 lines)
- **Fallback Prompts**: `/Users/ryanbrazzell/ea-time-freedom-report-new/app/utils/aiPromptBuilder.ts` (454 lines)

## Task List

### TypeScript Interfaces

#### Task Group 1: Data Models and Type Definitions
**Dependencies:** None

- [x] 1.0 Complete TypeScript interface definitions
  - [x] 1.1 Write 4 focused tests for TypeScript interfaces
    - Test UnifiedLeadData interface accepts all required and optional fields
    - Test Task interface validates owner as "EA" | "You"
    - Test TaskGenerationResult validates 30 total tasks structure
    - Test ValidationResult interface with isValid, errors[], warnings[]
  - [x] 1.2 Create UnifiedLeadData interface at `/web/src/types/lead.ts`
    - Port from source: Personal info (firstName, lastName, email, phone, title)
    - Port from source: Business context (website, companyWebsite, businessType, revenue, employeeCount)
    - Port from source: Challenges (challenges, timeBottleneck, supportNotes, adminTimePerWeek)
    - Port from source: Metadata (leadType: 'main' | 'standard' | 'simple', timestamp)
    - Port from source: Optional (companyAnalysis, communicationPreference, instagram)
  - [x] 1.3 Create Task interface at `/web/src/types/task.ts`
    - Fields: title, description, owner ('EA' | 'You'), isEA boolean, category string
    - Optional fields: frequency, priority, isCoreEATask, coreTaskType
  - [x] 1.4 Create TaskGenerationResult interface at `/web/src/types/task.ts`
    - Fields: tasks (daily/weekly/monthly arrays of 10 Task each)
    - Fields: ea_task_percent (whole number), ea_task_count, total_task_count (30), summary
  - [x] 1.5 Create ValidationResult interface at `/web/src/types/validation.ts`
    - Fields: isValid boolean, errors string[], warnings string[]
  - [x] 1.6 Create ReportAnalysis interface at `/web/src/types/validation.ts`
    - Port from reportValidator.ts: totalTasks, dailyTasks, weeklyTasks, monthlyTasks
    - Port from reportValidator.ts: eaTasks, founderTasks, eaPercentage
    - Port from reportValidator.ts: coreTasksPresent object
  - [x] 1.7 Create index.ts barrel export at `/web/src/types/index.ts`
  - [x] 1.8 Ensure interface tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify TypeScript compilation succeeds

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- All interfaces compile without TypeScript errors
- Interfaces match the exact structure from source code
- Barrel export exposes all types

---

### AI Service Module

#### Task Group 2: Prompt System
**Dependencies:** Task Group 1

- [x] 2.0 Complete prompt system
  - [x] 2.1 Write 4 focused tests for prompt system
    - Test TIME_FREEDOM_PROMPT_JSON contains exact 240-line prompt
    - Test serializeLeadData converts UnifiedLeadData to readable string
    - Test buildUnifiedPromptJSON replaces {LEAD_CONTEXT} placeholder
    - Test engagement level calculation based on fields provided
  - [x] 2.2 Create TIME_FREEDOM_PROMPT_JSON at `/web/src/lib/ai/prompts/time-freedom-prompt.ts`
    - Port exact 240-line prompt verbatim from unifiedPromptJSON.ts (lines 8-239)
    - Preserve all formatting, requirements, and validation checklist
  - [x] 2.3 Create serializeLeadData function at `/web/src/lib/ai/prompts/serialize-lead.ts`
    - Port logic from unifiedPromptJSON.ts (lines 244-351)
    - Serialize personal info, business context, challenges
    - Include website analysis context when available
    - Calculate engagement level (High/Medium/Low based on fields provided)
  - [x] 2.4 Create buildUnifiedPromptJSON function at `/web/src/lib/ai/prompts/serialize-lead.ts`
    - Port logic from unifiedPromptJSON.ts (lines 356-372)
    - Replace {LEAD_CONTEXT} placeholder with serialized data
    - Add structured logging for prompt building
  - [x] 2.5 Create fallback prompts at `/web/src/lib/ai/prompts/fallback-prompts.ts`
    - Port buildSimplifiedPrompt from aiPromptBuilder.ts (lines 280-308)
    - Port buildEmergencyPrompt from aiPromptBuilder.ts (lines 313-326)
    - Port buildStreamlinedPrompt from aiPromptBuilder.ts (lines 332-360)
  - [x] 2.6 Create prompt index at `/web/src/lib/ai/prompts/index.ts`
  - [x] 2.7 Ensure prompt system tests pass
    - Run ONLY the 4 tests written in 2.1
    - Verify prompt output matches expected format

**Acceptance Criteria:**
- The 4 tests written in 2.1 pass
- TIME_FREEDOM_PROMPT_JSON is exactly 240 lines
- Lead data serialization includes all fields
- Placeholder replacement works correctly

---

#### Task Group 3: Gemini AI Client
**Dependencies:** Task Groups 1, 2

- [x] 3.0 Complete Gemini AI client
  - [x] 3.1 Write 4 focused tests for Gemini client
    - Test API key retrieval (GEMINI_API_KEY primary, GOOGLE_API_KEY fallback)
    - Test request configuration (temperature 0.6, max tokens 3000, JSON response)
    - Test 30-second timeout handling
    - Test retry logic on failure (1 retry)
  - [x] 3.2 Create Gemini client at `/web/src/lib/ai/gemini-client.ts`
    - Use Gemini 2.0 Flash model (`gemini-2.0-flash`)
    - API endpoint: `generativelanguage.googleapis.com/v1beta`
    - Configuration: temperature 0.6, max tokens 3000
    - Response MIME type: `application/json`
  - [x] 3.3 Implement API key handling
    - Primary: `GEMINI_API_KEY` environment variable
    - Fallback: `GOOGLE_API_KEY` environment variable
    - Error message if neither key is present
  - [x] 3.4 Implement timeout and retry logic
    - 30-second timeout per request
    - 1 retry on failure before throwing
    - Structured error messages for debugging
  - [x] 3.5 Implement response parsing
    - Defensive JSON parsing to handle markdown code blocks
    - Strip ```json prefix/suffix if present
    - Parse to TaskGenerationResult type
  - [x] 3.6 Ensure Gemini client tests pass
    - Run ONLY the 4 tests written in 3.1
    - Mock API responses for unit tests

**Acceptance Criteria:**
- The 4 tests written in 3.1 pass
- API key fallback logic works
- Timeout and retry work correctly
- JSON parsing handles edge cases

---

#### Task Group 4: Task Generator Service
**Dependencies:** Task Groups 1, 2, 3

- [x] 4.0 Complete task generator service
  - [x] 4.1 Write 4 focused tests for task generator
    - Test generateTasks returns TaskGenerationResult with 30 tasks
    - Test lead type routing (main uses unified prompt, simple/standard use streamlined)
    - Test error handling returns structured error response
    - Test fallback prompt escalation on repeated failures
  - [x] 4.2 Create generateTasks function at `/web/src/lib/ai/task-generator.ts`
    - Accept UnifiedLeadData input
    - Return TaskGenerationResult or throw structured error
    - Integrate prompt building and Gemini client
  - [x] 4.3 Implement lead type routing
    - 'main' leadType: Use buildUnifiedPromptJSON
    - 'simple'/'standard' leadType: Use buildStreamlinedPrompt
    - Fallback escalation: simplified -> emergency on failures
  - [x] 4.4 Add structured logging
    - Log prompt building with lead type and data fields count
    - Log API request with timeout and retry info
    - Log response parsing success/failure
    - Log validation results
  - [x] 4.5 Ensure task generator tests pass
    - Run ONLY the 4 tests written in 4.1
    - Mock Gemini client for unit tests

**Acceptance Criteria:**
- The 4 tests written in 4.1 pass
- Lead type routing works correctly
- Fallback escalation works on failures
- Structured logging in place

---

### Validation Module

#### Task Group 5: Report Validation
**Dependencies:** Task Groups 1, 4

- [x] 5.0 Complete validation module
  - [x] 5.1 Write 6 focused tests for validation
    - Test validateReport returns ValidationResult with errors/warnings
    - Test task count validation (exactly 30 total, 10 per frequency)
    - Test EA percentage validation (>= 40%)
    - Test core EA task detection (email, calendar, personal life, business process)
    - Test analyzeReport returns correct ReportAnalysis
    - Test validateTaskQuality catches missing/short titles and descriptions
  - [x] 5.2 Create validateReport function at `/web/src/lib/ai/report-validator.ts`
    - Port from reportValidator.ts (lines 30-91)
    - Validate task count requirements
    - Validate EA percentage requirement
    - Validate core EA tasks presence
    - Return ValidationResult with isValid, errors, warnings
  - [x] 5.3 Create analyzeReport function at `/web/src/lib/ai/report-validator.ts`
    - Port from reportValidator.ts (lines 96-122)
    - Count tasks by frequency
    - Count EA vs founder tasks
    - Calculate EA percentage (Math.round)
    - Check core task presence
  - [x] 5.4 Create core EA task detection functions at `/web/src/lib/ai/report-validator.ts`
    - Port hasEmailManagementTask (lines 561-570)
    - Port hasCalendarManagementTask (lines 573-582)
    - Port hasPersonalLifeManagementTask (lines 586-600)
    - Port hasBusinessProcessManagementTask (lines 602-614)
  - [x] 5.5 Create validateCoreEATasks function at `/web/src/lib/ai/report-validator.ts`
    - Port from reportValidator.ts (lines 127-155)
    - Return errors for each missing core EA task type
  - [x] 5.6 Ensure validation tests pass
    - Run ONLY the 6 tests written in 5.1
    - Test with valid and invalid report structures

**Acceptance Criteria:**
- The 6 tests written in 5.1 pass
- All validation rules from source are implemented
- Core EA task detection works correctly
- ValidationResult structure matches spec

---

#### Task Group 6: Auto-Fix Behavior
**Dependencies:** Task Groups 1, 5

- [x] 6.0 Complete auto-fix behavior
  - [x] 6.1 Write 4 focused tests for auto-fix
    - Test ensureCoreEATasks injects missing core tasks
    - Test fixLowEAPercentage converts delegatable tasks to EA
    - Test fixTaskCount trims/pads to exactly 10 per frequency
    - Test isGoodEACandidate identifies delegatable keywords
  - [x] 6.2 Create ensureCoreEATasks function at `/web/src/lib/ai/report-fixer.ts`
    - Port from reportValidator.ts (lines 201-229)
    - Inject missing core EA tasks by replacing lowest-priority tasks
    - Recalculate EA percentage after injection
  - [x] 6.3 Create createMissingCoreEATasks function at `/web/src/lib/ai/report-fixer.ts`
    - Port from reportValidator.ts (lines 234-294)
    - Create exact core EA task definitions for injection
    - Include all required Task fields
  - [x] 6.4 Create fixLowEAPercentage function at `/web/src/lib/ai/report-fixer.ts`
    - Port from reportValidator.ts (lines 433-473)
    - Convert founder tasks to EA using isGoodEACandidate
    - Target 40% minimum EA percentage
  - [x] 6.5 Create fixTaskCount function at `/web/src/lib/ai/report-fixer.ts`
    - Port from reportValidator.ts (lines 478-500)
    - Trim to 10 if over, pad with generic tasks if under
    - Port createGenericTask helper (lines 505-540)
  - [x] 6.6 Create isGoodEACandidate helper at `/web/src/lib/ai/report-fixer.ts`
    - Port from reportValidator.ts (lines 545-555)
    - Keyword matching for delegation decisions
  - [x] 6.7 Create fixReportIssues orchestration function at `/web/src/lib/ai/report-fixer.ts`
    - Port from reportValidator.ts (lines 414-428)
    - Call appropriate fix functions based on error types
  - [x] 6.8 Ensure auto-fix tests pass
    - Run ONLY the 4 tests written in 6.1
    - Test with reports that need fixing

**Acceptance Criteria:**
- The 4 tests written in 6.1 pass
- Core EA task injection works correctly
- EA percentage fixing reaches 40% target
- Task count fixing maintains exactly 30 tasks

---

### API Layer

#### Task Group 7: API Route
**Dependencies:** Task Groups 1, 4, 5, 6

- [x] 7.0 Complete API route
  - [x] 7.1 Write 4 focused tests for API route
    - Test POST /api/generate-tasks accepts valid UnifiedLeadData
    - Test returns 400 for invalid/missing lead data
    - Test returns TaskGenerationResult on success
    - Test returns structured error response on AI failure
  - [x] 7.2 Create API route at `/web/src/app/api/generate-tasks/route.ts`
    - POST endpoint using Next.js 14 App Router pattern
    - Accept JSON body with UnifiedLeadData
    - Return TaskGenerationResult or error response
  - [x] 7.3 Implement request validation
    - Validate required fields present (email, leadType)
    - Validate leadType is 'main' | 'standard' | 'simple'
    - Return 400 with validation errors if invalid
  - [x] 7.4 Integrate task generation pipeline
    - Call generateTasks with validated lead data
    - Call validateReport on result
    - Call auto-fix functions if validation fails
    - Re-validate after fixes
  - [x] 7.5 Implement error handling
    - Return 500 with structured error for AI failures
    - Return 401 for missing API key
    - Include correlation ID for debugging
    - Log all errors with context
  - [x] 7.6 Ensure API route tests pass
    - Run ONLY the 4 tests written in 7.1
    - Use mocked dependencies for unit tests

**Acceptance Criteria:**
- The 4 tests written in 7.1 pass
- API accepts valid requests and returns correct structure
- Validation rejects invalid requests with clear errors
- Auto-fix pipeline runs when needed

---

### Integration Testing

#### Task Group 8: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-7

- [x] 8.0 Review existing tests and fill critical gaps only
  - [x] 8.1 Review tests from Task Groups 1-7
    - Review the tests written for interfaces (Task 1.1) - 9 tests
    - Review the tests written for prompt system (Task 2.1) - 7 tests
    - Review the tests written for Gemini client (Task 3.1) - 17 tests
    - Review the tests written for task generator (Task 4.1) - 15 tests
    - Review the tests written for validation (Task 5.1) - 31 tests
    - Review the tests written for auto-fix (Task 6.1) - 14 tests
    - Review the tests written for API route (Task 7.1) - 15 tests
    - Total existing tests: 108 tests
  - [x] 8.2 Analyze test coverage gaps for THIS feature only
    - Identified critical end-to-end workflows lacking coverage
    - Focused ONLY on AI task generation feature requirements
    - Prioritized integration points between modules
  - [x] 8.3 Write up to 8 additional strategic tests maximum
    - End-to-end: Valid lead data -> 30 tasks with 40%+ EA ratio
    - End-to-end: Invalid response -> auto-fix -> valid output
    - End-to-end: All 4 core EA tasks present in output
    - Integration: API route -> task generator -> validator -> fixer
    - Edge case: Lead with minimal data still generates valid report
    - Edge case: Markdown code block stripping in JSON parsing
    - Error handling: Missing API key returns proper error
    - Prompt building: buildUnifiedPromptJSON includes lead context
    - Total new tests: 11 tests
  - [x] 8.4 Run feature-specific tests only
    - Ran ONLY tests related to AI task generation feature
    - Final total: 119 tests
    - All tests pass
    - Verified critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (119 tests total)
- End-to-end workflow produces valid TaskGenerationResult
- 30-task count with 40-60% EA ratio verified
- All 4 core EA tasks present in output
- Auto-fix pipeline corrects invalid responses

---

## Execution Order

Recommended implementation sequence:

1. **TypeScript Interfaces (Task Group 1)** - Foundation for all other modules
2. **Prompt System (Task Group 2)** - Required for AI service
3. **Gemini AI Client (Task Group 3)** - Required for task generation
4. **Task Generator Service (Task Group 4)** - Core AI integration
5. **Report Validation (Task Group 5)** - Required for output quality
6. **Auto-Fix Behavior (Task Group 6)** - Required for reliability
7. **API Route (Task Group 7)** - External interface
8. **Integration Testing (Task Group 8)** - Final verification

---

## File Structure Summary

```
/web/src/
  /types/
    lead.ts              - UnifiedLeadData interface
    task.ts              - Task, TaskGenerationResult interfaces
    validation.ts        - ValidationResult, ReportAnalysis interfaces
    index.ts             - Barrel export
  /lib/ai/
    /prompts/
      time-freedom-prompt.ts  - 240-line TIME_FREEDOM_PROMPT_JSON
      serialize-lead.ts       - serializeLeadData, buildUnifiedPromptJSON
      fallback-prompts.ts     - simplified, emergency, streamlined prompts
      index.ts                - Barrel export
    gemini-client.ts     - Gemini 2.0 Flash API client
    task-generator.ts    - generateTasks main function
    report-validator.ts  - validateReport, analyzeReport, core task detection
    report-fixer.ts      - ensureCoreEATasks, fixLowEAPercentage, fixTaskCount
  /app/api/
    /generate-tasks/
      route.ts           - POST /api/generate-tasks endpoint
```

---

## Environment Variables Required

```
GEMINI_API_KEY=your-gemini-api-key    # Primary
GOOGLE_API_KEY=your-google-api-key    # Fallback
```

---

## Success Metrics

- **Task Count**: Exactly 30 tasks (10 daily, 10 weekly, 10 monthly)
- **EA Ratio**: 40-60% of tasks marked as EA-delegatable
- **Core Tasks**: All 4 core EA responsibilities present
- **Response Time**: Under 35 seconds including retry
- **Auto-Fix Rate**: Invalid responses corrected to valid output
