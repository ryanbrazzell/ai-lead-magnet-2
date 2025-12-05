# Specification: AI Task Generation Service

## Goal
Port the existing production AI task generation logic to the new Next.js architecture, preserving exact functionality including the 240-line TIME_FREEDOM_PROMPT_JSON prompt, Gemini 2.0 Flash integration, 30-task output with 40-60% EA ratio, and all validation/auto-fix behavior.

## User Stories
- As a founder completing the lead form, I want to receive 30 personalized tasks categorized by frequency so that I understand what I can delegate to an EA
- As the system, I want to validate and auto-fix AI responses to ensure every report meets the 40%+ EA ratio and includes all 4 core EA tasks

## Specific Requirements

**API Route: /api/generate-tasks**
- Create POST endpoint at `/web/src/app/api/generate-tasks/route.ts`
- Accept JSON body with UnifiedLeadData interface
- Return TaskGenerationResult JSON or structured error response
- Use Next.js 14 App Router API route pattern with edge runtime consideration
- Implement request validation before calling AI service

**AI Service Module**
- Create `/web/src/lib/ai/task-generator.ts` with `generateTasks(leadData)` function
- Use Gemini 2.0 Flash model (`gemini-2.0-flash`) via `generativelanguage.googleapis.com/v1beta` API
- Configuration: temperature 0.6, max tokens 3000, response MIME type `application/json`
- Implement 30-second timeout with 1 retry on failure
- Environment variables: `GEMINI_API_KEY` (primary), `GOOGLE_API_KEY` (fallback)

**Prompt System**
- Port exact `TIME_FREEDOM_PROMPT_JSON` (240 lines) to `/web/src/lib/ai/prompts/time-freedom-prompt.ts`
- Implement `serializeLeadData()` function to convert UnifiedLeadData to readable string format
- Replace `{LEAD_CONTEXT}` placeholder with serialized lead data
- Port fallback prompts from aiPromptBuilder.ts: `buildSimplifiedPrompt()`, `buildEmergencyPrompt()`, `buildStreamlinedPrompt()`

**Input Data Interface: UnifiedLeadData**
- Port interface to `/web/src/types/lead.ts` with fields: firstName, lastName, email, phone, title, website, companyWebsite, businessType, revenue, employeeCount, challenges, timeBottleneck, supportNotes, adminTimePerWeek, leadType ('main' | 'standard' | 'simple'), timestamp, companyAnalysis, communicationPreference, instagram
- Support all three lead types with appropriate prompt selection
- Calculate engagement level based on fields provided

**Output Structure: TaskGenerationResult**
- Port interface to `/web/src/types/task.ts` with: tasks (daily/weekly/monthly arrays of 10 Task each), ea_task_percent, ea_task_count, total_task_count (30), summary
- Task interface: title, description (20-30+ words), owner ('EA' | 'You'), isEA boolean, category string
- ea_task_percent must be whole number (use Math.round)

**Validation Module**
- Create `/web/src/lib/ai/report-validator.ts` porting logic from original reportValidator.ts
- Validate exactly 30 tasks (10 daily, 10 weekly, 10 monthly)
- Validate EA percentage >= 40% (target 40-60%)
- Validate all 4 core EA tasks present: Email Management, Calendar Management, Personal Life Management, Business Process Management
- Return ValidationResult with isValid, errors[], warnings[]

**Auto-Fix Behavior**
- Implement `ensureCoreEATasks()` to inject missing core EA tasks by replacing lowest-priority tasks
- Implement `fixLowEAPercentage()` to convert delegatable founder tasks to EA tasks
- Implement `fixTaskCount()` to trim or pad tasks to exactly 10 per frequency
- Use `isGoodEACandidate()` helper with keyword matching for delegation decisions

**Error Handling**
- Defensive JSON parsing to handle markdown code blocks (strip ```json prefix/suffix)
- Meaningful error messages for: API key missing, timeout, invalid response structure, rate limiting
- Log all operations with context using structured logging pattern
- Graceful fallback to simplified/emergency prompts on repeated failures

## Existing Code to Leverage

**unifiedPromptJSON.ts** (`/Users/ryanbrazzell/ea-time-freedom-report-new/app/utils/unifiedPromptJSON.ts`)
- Contains exact 240-line TIME_FREEDOM_PROMPT_JSON to preserve verbatim
- Contains serializeLeadData() function with all field mappings and engagement level calculation
- Contains buildUnifiedPromptJSON() orchestration function

**reportValidator.ts** (`/Users/ryanbrazzell/ea-time-freedom-report-new/app/utils/reportValidator.ts`)
- Contains validateReport(), analyzeReport(), validateCoreEATasks() functions
- Contains core EA task detection functions: hasEmailManagementTask(), hasCalendarManagementTask(), hasPersonalLifeManagementTask(), hasBusinessProcessManagementTask()
- Contains auto-fix functions: ensureCoreEATasks(), fixReportIssues(), fixLowEAPercentage(), fixTaskCount()
- Contains createMissingCoreEATasks() with exact task definitions for injection

**aiPromptBuilder.ts** (`/Users/ryanbrazzell/ea-time-freedom-report-new/app/utils/aiPromptBuilder.ts`)
- Contains fallback prompts: buildSimplifiedPrompt(), buildEmergencyPrompt(), buildStreamlinedPrompt()
- Contains helper functions: classifyDelegationUrgency(), getPromptComplexityLevel()
- Use streamlined prompts for 'simple' and 'standard' lead types

## Out of Scope
- PDF generation (separate spec)
- Email delivery and notification system
- Form UI components and pages (Phase 2)
- Website scraping or company analysis enrichment
- Rate limiting and usage tracking
- Any prompt modifications or improvements to existing logic
- CRM integration or lead storage
- Analytics or tracking of AI responses
- Real-time streaming of AI responses (use standard request/response)
- Caching of AI responses
