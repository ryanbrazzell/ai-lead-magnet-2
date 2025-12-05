# Spec Requirements: AI Task Generation Service

## Initial Description

AI Task Generation Service - Port existing unifiedPromptJSON.ts prompt logic to new architecture; verify Gemini 2.0 Flash integration produces identical 30-task output with 40-60% EA task ratio.

**Roadmap Reference:** Item #4 - Phase 1: Core Infrastructure

## Requirements Discussion

### Research Findings

**Primary Source Code:** `/tmp/ea-time-freedom-report/`

**Key Files Identified:**
- `unifiedPromptJSON.ts` (372 lines) - Main prompt and generation logic
- `reportValidator.ts` - Output validation and auto-fixing
- `aiPromptBuilder.ts` - Fallback/simplified prompts

### AI/Prompt Structure

**Main Prompt: `TIME_FREEDOM_PROMPT_JSON`** (240 lines)
- Generates exactly **30 tasks** (10 daily, 10 weekly, 10 monthly)
- Enforces **40-60% EA task ratio** per category (4-6 EA tasks per frequency)
- Includes 4 mandatory "Core EA Responsibilities":
  1. Email Management
  2. Calendar Management
  3. Personal Life Management
  4. Business Process Management
- Uses structured JSON output format with validation
- Serializes lead data into `{LEAD_CONTEXT}` placeholder

**Gemini Configuration:**
- Model: `gemini-2.0-flash`
- API: `generativelanguage.googleapis.com/v1beta`
- Temperature: 0.6
- Max Output Tokens: 3000
- Response MIME Type: `application/json`
- Timeout: 30 seconds
- Retries: 1

**Environment Variables:**
- `GEMINI_API_KEY` (primary)
- `GOOGLE_API_KEY` (fallback)

### Input Data Structure

```typescript
interface UnifiedLeadData {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;

  // Business Context
  website?: string;
  companyWebsite?: string;
  businessType?: string;
  revenue?: string;
  employeeCount?: string;

  // Challenges
  challenges?: string;
  timeBottleneck?: string;
  supportNotes?: string;
  adminTimePerWeek?: string;

  // Lead Metadata
  leadType: 'main' | 'standard' | 'simple';
  timestamp?: string;

  // Optional
  companyAnalysis?: string;
  communicationPreference?: string;
}
```

### Output Format

```typescript
interface TaskGenerationResult {
  tasks: {
    daily: Task[];    // Exactly 10 tasks, 4-6 EA
    weekly: Task[];   // Exactly 10 tasks, 4-6 EA
    monthly: Task[];  // Exactly 10 tasks, 4-6 EA
  };
  ea_task_percent: number;  // 40-60%
  ea_task_count: number;    // 12-18 tasks
  total_task_count: 30;
  summary: string;
}

interface Task {
  title: string;
  description: string;  // 20-30+ words
  owner: "EA" | "You";
  isEA: boolean;
  category: string;
}
```

### Validation Rules

From `reportValidator.ts`:
- Total task count must be exactly 30
- EA percentage must be 40%+ (target 40-60%)
- All 4 core EA tasks must be present
- Auto-injection of missing core tasks if needed
- Auto-fixing of low EA percentage

### Clarifying Questions & Answers

**Q1:** Preserve exact `TIME_FREEDOM_PROMPT_JSON` prompt without modification?
**Answer:** Yes - preserve exact functionality as specified by user.

**Q2:** Environment variable configuration pattern?
**Answer:** Use same pattern with `GEMINI_API_KEY` / `GOOGLE_API_KEY` fallback.

**Q3:** Keep 30-second timeout or reduce?
**Answer:** Keep 30-second timeout for safety and consistency.

**Q4:** Preserve defensive JSON parsing for markdown code blocks?
**Answer:** Yes - preserve all edge case handling.

**Q5:** Preserve auto-fixing behavior in validator?
**Answer:** Yes - this is part of existing production behavior.

**Q6:** Testing strategy for AI output consistency?
**Answer:** Create test suite validating:
- 30-task count
- 40-60% EA ratio
- 4 core EA tasks present
- JSON structure validity

**Q7:** Port only unifiedPromptJSON.ts or also fallback prompts?
**Answer:** Port both - unifiedPromptJSON.ts as primary, fallback prompts for completeness.

**Q8:** Any edge cases or production issues to address?
**Answer:** None specified - preserve all existing error handling.

### Existing Code to Leverage

| Resource | Path | Usage |
|----------|------|-------|
| Main Prompt | `/tmp/ea-time-freedom-report/unifiedPromptJSON.ts` | Port exact prompt logic |
| Validator | `/tmp/ea-time-freedom-report/reportValidator.ts` | Port validation rules |
| Fallback Prompts | `/tmp/ea-time-freedom-report/aiPromptBuilder.ts` | Port emergency/simplified prompts |
| Types | `/tmp/ea-time-freedom-report/types/` | Reference TypeScript interfaces |

### Visual Assets

None required for this backend service.

## Requirements Summary

### Functional Requirements

**AI Service Core:**
- Port exact `TIME_FREEDOM_PROMPT_JSON` prompt (240 lines)
- Use Gemini 2.0 Flash model with existing configuration
- Generate exactly 30 tasks (10 daily, 10 weekly, 10 monthly)
- Enforce 40-60% EA task ratio per frequency category
- Include 4 mandatory core EA responsibilities
- Return structured JSON with tasks, summary, and statistics

**Input Handling:**
- Accept `UnifiedLeadData` interface from form submissions
- Support all three lead types: main, standard, simple
- Serialize lead context into prompt placeholder

**Output Validation:**
- Validate 30-task count
- Validate EA percentage (40%+)
- Validate core EA tasks presence
- Auto-fix reports with missing/low EA tasks

**Error Handling:**
- 30-second timeout with 1 retry
- Defensive JSON parsing (handle markdown code blocks)
- Fallback prompts for emergency cases
- Meaningful error messages for debugging

### Technical Considerations

**API Route:**
- Create `/api/generate-tasks` endpoint
- Accept POST with lead data
- Return JSON task list or error

**Environment:**
- `GEMINI_API_KEY` required
- `GOOGLE_API_KEY` as fallback

**Testing:**
- Unit tests for prompt serialization
- Unit tests for response validation
- Integration tests with mocked Gemini responses
- E2E test with real API (optional, rate-limited)

### Scope Boundaries

**In Scope:**
- Port `unifiedPromptJSON.ts` prompt and generation logic
- Port `reportValidator.ts` validation logic
- Port TypeScript interfaces for lead data and tasks
- Create API route for task generation
- Environment variable configuration
- Error handling and retry logic
- Unit and integration tests

**Out of Scope:**
- PDF generation (separate spec)
- Email delivery (separate spec)
- Form UI (Phase 2)
- Website scraping for company analysis
- Rate limiting / usage tracking
- Prompt modifications or improvements

### Dependencies

**Required Before:**
- Environment Setup (Item #1) - for API keys

**Required By:**
- Main Form Submission (Item #9)
- Standard Form Build (Item #10)
- Preselected Form Completion (Item #12)
- Report Display Page (Item #13)
