/**
 * Fallback Prompts for AI Task Generation
 *
 * Ported from: /tmp/ea-time-freedom-report/app/utils/aiPromptBuilder.ts (lines 280-360)
 *
 * These prompts are used as fallbacks when the main prompt system
 * encounters issues or for simpler lead types.
 */

import type { UnifiedLeadData } from '@/types';

/**
 * Structured logger for fallback prompt usage
 * In production, replace with actual logging implementation
 */
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
 * Ported from aiPromptBuilder.ts (lines 280-308)
 * Used when the main prompt system encounters issues or for
 * leads with minimal context.
 *
 * @param leadData - The unified lead data
 * @returns A simplified prompt string
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
    hasChallenges: !!(leadData.challenges || leadData.timeBottleneck),
  });

  return `Create a personalized EA Time Freedom Report for ${name}, a ${businessContext} owner.

Generate exactly 24 tasks (8 daily, 8 weekly, 8 monthly) focusing on ${challengeContext}.

MANDATORY: Include these 4 core EA areas:
1. Complete email management (daily EA task, coreTaskType: "emailManagement")
2. Calendar and scheduling management (daily EA task, coreTaskType: "calendarManagement")
3. Personal life coordination (weekly EA task, coreTaskType: "personalLifeManagement")
4. Business process management (monthly EA task, coreTaskType: "businessProcessManagement")

Every task must include a coreTaskType field: "emailManagement", "calendarManagement", "personalLifeManagement", or "businessProcessManagement".

Requirements:
- At least 15 tasks delegatable to EA (63%)
- Task titles should be personal and relatable (e.g. "Getting your inbox to zero every day", not "Priority Inbox Zero Maintenance"). Use "your" and "you" - write like you're talking to the founder.
- NEVER use em-dashes. Use regular hyphens only.
- Every task must be unique - no duplicates or near-duplicates.
- 2-3 sentence descriptions with specific actions
- Professional HTML format with sections
- Executive summary and conclusion

Focus on practical, actionable tasks that save the most time when delegated.`;
}

/**
 * Build emergency fallback prompt (minimal context)
 *
 * Ported from aiPromptBuilder.ts (lines 313-326)
 * Used as last resort when no lead context is available.
 *
 * @returns An emergency fallback prompt string
 */
export function buildEmergencyPrompt(): string {
  log.warn('Using emergency fallback prompt - minimal context available');

  return `Generate a standard EA Time Freedom Report with 24 tasks.

Structure:
- 8 daily tasks (include email management, calendar management)
- 8 weekly tasks (include personal life management)
- 8 monthly tasks (include business process management)

At least 15 tasks must be EA-delegatable (isEA: true).
Every task must include coreTaskType: emailManagement, calendarManagement, personalLifeManagement, or businessProcessManagement.
Include professional HTML formatting with executive summary.
Focus on common business owner pain points and delegation opportunities.`;
}

/**
 * Build streamlined prompt for new forms (custom/simple)
 * Optimized for speed with reduced complexity
 *
 * Ported from aiPromptBuilder.ts (lines 332-360)
 * Used for simple and standard lead types where a faster
 * response is preferred over deep personalization.
 *
 * @param leadData - The unified lead data
 * @returns A streamlined prompt string
 */
export function buildStreamlinedPrompt(leadData: UnifiedLeadData): string {
  const businessContext = leadData.businessType || 'business';
  const challengeContext =
    leadData.challenges || leadData.timeBottleneck || 'operational efficiency';
  const name =
    [leadData.firstName, leadData.lastName].filter(Boolean).join(' ') ||
    'Business Owner';

  // Use streamlined approach for new form types
  const isNewForm =
    leadData.leadType === 'standard' || leadData.leadType === 'simple';

  log.info('Using ultra-streamlined AI prompt for performance optimization', {
    leadType: leadData.leadType,
    businessType: leadData.businessType,
    isNewForm,
    optimizationLevel: 'high-performance',
  });

  // If it's a new form, use the ultra-optimized version (under 200 chars)
  if (isNewForm) {
    return `${name} EA Report - ${businessContext}:

24 tasks (8 each: daily/weekly/monthly). 63%+ EA-owned.

Include coreTaskType on each task: emailManagement, calendarManagement, personalLifeManagement, or businessProcessManagement.
Include: Email Mgmt (daily EA), Calendar (daily EA), Personal Life (weekly EA), Process Mgmt (monthly EA).

Focus: ${challengeContext}. HTML format.`;
  }

  // Default to simplified prompt for other types
  return buildSimplifiedPrompt(leadData);
}
