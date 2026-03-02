/**
 * Fallback Prompts for AI Task Generation
 *
 * Used as fallbacks when the two-prompt chain fails.
 * Aligned with Core Four architecture (no frequency references).
 */

import type { UnifiedLeadData } from '@/types';

const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, context);
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context);
  },
};

/**
 * Build simplified prompt as fallback
 *
 * Used when the two-prompt chain encounters issues.
 * Generates Core Four grouped tasks in a single call.
 */
export function buildSimplifiedPrompt(leadData: UnifiedLeadData): string {
  const businessContext = leadData.businessType || 'business';
  const challengeContext =
    leadData.challenges || leadData.timeBottleneck || 'operational efficiency';
  const name =
    [leadData.firstName, leadData.lastName].filter(Boolean).join(' ') ||
    'Business Owner';

  log.info('Using simplified AI prompt as fallback', {
    leadType: leadData.leadType,
    businessType: leadData.businessType,
  });

  return `Create a personalized EA Task Delegation Report for ${name}, a ${businessContext} owner, focusing on ${challengeContext}.

Generate tasks organized by Core Four area. All tasks are EA-delegatable.

MANDATORY areas and target counts:
1. businessProcesses: 8-10 tasks (coreTaskType: "businessProcessManagement") - recurring ops, CRM, reporting, vendor management, SOPs
2. personalLife: 5-6 tasks (coreTaskType: "personalLifeManagement") - travel, family, personal admin, errands
3. calendar: 4-5 tasks (coreTaskType: "calendarManagement") - scheduling, meeting prep, energy management
4. email: 3-4 tasks (coreTaskType: "emailManagement") - inbox processing, response drafting, follow-ups

Requirements:
- Task titles: conversational, specific, use "your" and "you"
- Descriptions: 2-3 sentences with specific actions
- NEVER use em-dashes. Use regular hyphens only.
- Every task must be unique - no duplicates.
- All tasks: owner "EA", isEA true
- Include category field (Communication|Scheduling|Operations|Strategy|Marketing|Finance|Personal|Management)

Output ONLY valid JSON:
{
  "tasks": {
    "businessProcesses": [{"title":"...","description":"...","category":"Operations","coreTaskType":"businessProcessManagement","owner":"EA","isEA":true}],
    "personalLife": [...],
    "calendar": [...],
    "email": [...]
  },
  "analysis_summary": "Brief paragraph about delegation opportunities for this founder",
  "total_task_count": 22
}`;
}

/**
 * Build emergency fallback prompt (minimal context)
 *
 * Last resort when no lead context is available.
 */
export function buildEmergencyPrompt(): string {
  log.warn('Using emergency fallback prompt - minimal context available');

  return `Generate an EA Task Delegation Report with ~22 tasks organized by Core Four area.

All tasks are EA-delegatable (owner: "EA", isEA: true).

Structure:
- businessProcesses: 8 tasks (coreTaskType: "businessProcessManagement")
- personalLife: 5 tasks (coreTaskType: "personalLifeManagement")
- calendar: 4 tasks (coreTaskType: "calendarManagement")
- email: 3 tasks (coreTaskType: "emailManagement")

Task titles should be conversational (e.g., "Getting your inbox to zero every day").
NEVER use em-dashes. Use regular hyphens only.
Include category field on each task.
Focus on common business owner delegation opportunities.

Output ONLY valid JSON:
{
  "tasks": {
    "businessProcesses": [{"title":"...","description":"...","category":"Operations","coreTaskType":"businessProcessManagement","owner":"EA","isEA":true}],
    "personalLife": [...],
    "calendar": [...],
    "email": [...]
  },
  "analysis_summary": "Brief summary",
  "total_task_count": 20
}`;
}

/**
 * Build streamlined prompt for simple/standard lead types
 */
export function buildStreamlinedPrompt(leadData: UnifiedLeadData): string {
  const businessContext = leadData.businessType || 'business';
  const challengeContext =
    leadData.challenges || leadData.timeBottleneck || 'operational efficiency';
  const name =
    [leadData.firstName, leadData.lastName].filter(Boolean).join(' ') ||
    'Business Owner';

  log.info('Using streamlined prompt', { leadType: leadData.leadType });

  return `${name} - ${businessContext} owner. Generate ~22 EA delegation tasks by Core Four area.

Focus: ${challengeContext}

businessProcesses: 8 tasks (coreTaskType: "businessProcessManagement")
personalLife: 5 tasks (coreTaskType: "personalLifeManagement")
calendar: 4 tasks (coreTaskType: "calendarManagement")
email: 3 tasks (coreTaskType: "emailManagement")

All tasks: owner "EA", isEA true, include category field.
Conversational titles. 2-3 sentence descriptions. No em-dashes.

Output ONLY valid JSON with structure: { "tasks": { "businessProcesses": [...], "personalLife": [...], "calendar": [...], "email": [...] }, "analysis_summary": "...", "total_task_count": 20 }`;
}
