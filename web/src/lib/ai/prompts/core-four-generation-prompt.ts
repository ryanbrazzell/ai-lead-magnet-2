/**
 * Core Four Task Generation Prompt (Call 2)
 *
 * Generates tasks organized by Core Four area (NOT by frequency).
 * Injects the business analysis brief from Call 1 as context.
 * Includes per-area rules, anti-pattern detection, and few-shot examples.
 *
 * This module exposes two shapes:
 *   - buildCoreFourGenerationPrompt(analysisBrief, leadBrief) → single string
 *     (backward compat for tests and legacy callers)
 *   - CORE_FOUR_GENERATION_SYSTEM + buildCoreFourGenerationUser(...)
 *     (preferred; stable system prompt is cache-eligible)
 */

import type { BusinessAnalysisBrief } from '@/types';
import type { LeadBrief } from '../lead-brief';

/**
 * System prompt for Core Four generation.
 *
 * This text is byte-identical across every request so it's cache-eligible
 * via prompt caching. It contains the stable rules, anti-patterns, few-shot
 * examples, task format, and output schema.
 */
export const CORE_FOUR_GENERATION_SYSTEM = `You are generating a personalized EA delegation report for a founder. This report is the primary sales asset for a premium executive assistant service. Every task must demonstrate that YOU understand THEIR business - not read like a generic brochure.

===== HARD RULE: DO NOT INVENT AN INDUSTRY =====
The Business Analysis you receive in the user turn reflects grounded information. If the analysis treats the business as unknown or uses generic language, you MUST do the same. Do NOT:
  - Read an industry into pain points (e.g. "Marketing" in pain points does NOT mean they run a marketing agency)
  - Infer industry from revenue band ("$10M+" does NOT mean agency, SaaS, or consulting)
  - Infer industry from email domain or title
When in doubt, write industry-neutral tasks. A franchise operator getting generic-but-correct tasks is a win. A franchise operator getting agency-themed tasks is a disaster.

===== TASK GENERATION RULES =====

Generate tasks organized by CORE FOUR AREA. All tasks are EA-delegatable. No "Founder tasks" section.

TARGET TASK COUNTS (targets, not hard constraints):
- businessProcesses: 8-10 tasks (most personalized, highest novelty, shown FIRST in report)
- personalLife: 5-6 tasks
- calendar: 4-5 tasks
- email: 3-4 tasks
- Total: ~22-25 tasks

===== PER-AREA RULES =====

BUSINESS PROCESSES (8-10 tasks) - THE STAR OF THE REPORT:
- Every task must reference a SPECIFIC recurring process from the analysis above
- Include industry-specific terminology and tools ONLY when industry is known and grounded
- When industry is unknown, use neutral language ("your team", "your customers", "your reporting")
- These should make the founder think "they really understand my business"

PERSONAL LIFE (5-6 tasks):
- Calibrate to the founder's revenue tier (provided in user turn)
- Lower tiers ('getting organized', 'growing'): focus on basics - personal appointments, Amazon orders, travel booking, household coordination
- Higher tiers ('scaling', 'systemizing', 'optimizing'): include executive-level - family logistics, travel coordination, vendor management, gift purchasing, household staff coordination
- Make personal, not corporate

CALENDAR (4-5 tasks):
- Reference specific meeting types from the analysis
- Focus on scheduling PATTERNS not one-off events
- Include prep work, follow-ups, and energy management

EMAIL (3-4 tasks):
- Each task must address a DIFFERENT aspect of email management
- NEVER overlap (e.g., don't have "inbox organization" AND "email filtering" as separate tasks - they're the same thing)
- Focus on: volume reduction, response drafting, follow-up tracking, priority routing

===== ANTI-PATTERN BAN LIST =====
Do NOT generate tasks that use these generic phrases as the primary task:
- "inbox zero" or "getting to inbox zero" as a standalone task title
- "manage your calendar" without specifying WHAT calendar management means
- "routine emails" or "handle routine correspondence"
- "daily priorities" or "review daily priorities"
- "performance review" without business context
- "manage vendor communications" without specifying WHICH vendors
- "prepare reports" without specifying WHAT reports
- "organize files" or "document organization"
- Any task that could apply to literally any business owner

===== FEW-SHOT EXAMPLES =====

GOOD BUSINESS PROCESS TASKS (specific, references their business):
- "Following up with your landscaping subcontractors on weekly job schedules" (specific business process, references their industry)
- "Prepping your quarterly board materials with updated KPIs from HubSpot" (specific, references their tools)
- "Reconciling your Stripe payouts against QuickBooks entries every Friday" (specific financial process)
- "Sending post-session recap emails to coaching clients within 24 hours" (specific to coaching)
- "Updating your property listing status across Zillow, Realtor.com, and MLS after each showing" (specific to real estate)

BAD BUSINESS PROCESS TASKS (vague, could be anyone):
- "Managing vendor communications and follow-ups" (generic - WHICH vendors? For what?)
- "Preparing reports for leadership meetings" (vague - WHAT reports? What meetings?)
- "Tracking business metrics and KPIs" (generic - which metrics? From where?)
- "Processing recurring transactions" (what transactions? In what system?)
- "Maintaining business documentation" (what docs? For what purpose?)

GOOD EMAIL TASKS:
- "Drafting responses to inbound client inquiries about your coaching programs in your voice" (specific client type + service)
- "Sorting partnership and sponsorship pitches from your inbox noise so you only see legit opportunities" (specific use case)

BAD EMAIL TASKS:
- "Managing your email inbox" (says nothing)
- "Responding to routine emails" (what makes them routine?)

GOOD PERSONAL LIFE TASKS:
- "Booking your quarterly family trips around your busiest client months" (business-aware personal task)
- "Coordinating your kids' activity schedule changes with your meeting calendar" (specific intersection of personal + professional)

BAD PERSONAL LIFE TASKS:
- "Managing personal appointments" (generic)
- "Handling personal errands" (vague)

===== TASK FORMAT =====
Each task needs:
- title: Conversational, specific. Write like you're talking to the founder. Use "your" and "you". Examples: "Following up with your subcontractors on weekly job completion photos", NOT "Subcontractor Follow-up Management"
- description: 2-3 sentences (40-80 words). Specific actions, specific tools/systems, specific outcomes. Reference the founder's actual business context.
- category: One of Communication|Scheduling|Operations|Strategy|Marketing|Finance|Personal|Management
- coreTaskType: emailManagement|calendarManagement|personalLifeManagement|businessProcessManagement

===== OUTPUT FORMAT =====
Return ONLY valid JSON:
{
  "tasks": {
    "businessProcesses": [
      {
        "title": "Following up with your landscaping subcontractors on weekly job schedules",
        "description": "Your EA contacts each subcontractor crew every Monday to confirm the week's job assignments, flag any scheduling conflicts, and update your project tracker with estimated completion dates.",
        "category": "Operations",
        "coreTaskType": "businessProcessManagement",
        "owner": "EA",
        "isEA": true
      }
    ],
    "personalLife": [],
    "calendar": [],
    "email": []
  },
  "analysis_summary": "Brief paragraph about the business and delegation opportunities identified",
  "total_task_count": 22
}

RULES:
- NEVER use em-dashes. Use regular hyphens only.
- Every task's owner must be "EA" and isEA must be true.
- total_task_count must match the actual number of tasks generated.
- Tasks must be UNIQUE - no two tasks should describe the same activity.
- Output ONLY valid JSON, no other text.`;

/**
 * Build the dynamic user-turn message for the generation call.
 */
export function buildCoreFourGenerationUser(
  analysisBrief: BusinessAnalysisBrief,
  leadBrief: LeadBrief
): string {
  return `Writing the report for: ${leadBrief.name}.

===== BUSINESS ANALYSIS (from prior analysis) =====
Business: ${analysisBrief.business_description}

Recurring Processes Identified:
${analysisBrief.recurring_processes.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Calendar Patterns:
${analysisBrief.calendar_patterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Personal Life Opportunities:
${analysisBrief.personal_life_opportunities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Pain Point Decomposition:
${analysisBrief.pain_point_decomposition.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Revenue Tier Context: ${analysisBrief.revenue_tier_context}

===== LEAD CONTEXT =====
Name: ${leadBrief.name}
Revenue: ${leadBrief.revenue} (${leadBrief.revenueTier} stage)
${leadBrief.inferredIndustry ? `Industry (grounded - from explicit field or website research): ${leadBrief.inferredIndustry}` : 'Industry: UNKNOWN — write tasks with industry-neutral language. Use "your team" not "your media buyers", "your customers" not "your retainer clients", "your reporting" not "your Google Ads dashboards".'}
Data Richness: ${leadBrief.dataRichness}
Specificity Target: ${leadBrief.specificityExpectation}

Generate the Core Four task report as valid JSON per the output format in the system instructions.`;
}

/**
 * Legacy: single-string prompt for backward compatibility with tests and
 * any callers still passing one prompt into a single-turn API call.
 */
export function buildCoreFourGenerationPrompt(
  analysisBrief: BusinessAnalysisBrief,
  leadBrief: LeadBrief
): string {
  return `${CORE_FOUR_GENERATION_SYSTEM}\n\n${buildCoreFourGenerationUser(analysisBrief, leadBrief)}`;
}
