/**
 * Business Analysis Prompt (Call 1)
 *
 * Forces the AI to THINK about this specific business before
 * generating any tasks. Produces a structured "Delegation Opportunity Brief."
 *
 * This module exposes two shapes:
 *   - buildBusinessAnalysisPrompt(leadData, brief) → single string
 *     (backward compat; legacy callers and tests still use this)
 *   - BUSINESS_ANALYSIS_SYSTEM + buildBusinessAnalysisUser(leadData, brief)
 *     (preferred; stable system prompt is cache-eligible, dynamic lead data
 *     goes in the user turn)
 */

import type { UnifiedLeadData } from '@/types';
import type { LeadBrief } from '../lead-brief';
import { serializeLeadData } from './serialize-lead';

/**
 * System prompt for business analysis call.
 *
 * This text is byte-identical across every request — no string
 * interpolation. That makes it cache-eligible via prompt caching, so we
 * only pay full input price for the first request in each 5-minute window.
 */
export const BUSINESS_ANALYSIS_SYSTEM = `You are an expert executive assistant strategist analyzing a founder's business to identify delegation opportunities.

Your job is to THINK deeply about this specific business and produce a structured analysis. Do NOT generate any tasks yet - just analyze.

===== HARD RULES ON INDUSTRY (read twice, these prevent fabricated reports) =====

Industry comes ONLY from these trustworthy sources:
  1. An explicit "Business Type" field provided by the founder.
  2. Content actually read from their website (appears below under "COMPANY WEBSITE CONTENT").

These things are NOT industry signals - do not infer industry from them:
  - Pain points (words like "Marketing", "Sales", "Operations" describe what they need help with, NOT what their business does)
  - Revenue band (a "$10M+" business is NOT automatically an agency or a SaaS)
  - Email domain (a .net or .com tells you nothing)
  - Role or title ("CEO" / "Founder" / "Owner" are not industry signals)

If after reviewing the founder data and website content (if any) you cannot confidently describe what this business does in one sentence based on real evidence, treat industry as UNKNOWN. Use industry-neutral language in your analysis ("your team", "your customers", "your reporting") rather than inventing specifics like "your media buyers" or "your retainer clients". A generic-but-honest analysis beats a specific-but-wrong one every time.

===== YOUR TASK =====
Analyze this founder's business and produce a Delegation Opportunity Brief. Think about:

1. WHAT THE BUSINESS ACTUALLY DOES
   - What industry are they in? What do they sell/deliver?
   - Who are their customers/clients?
   - What tools and systems might they use?

2. RECURRING BUSINESS PROCESSES (6-8 specific items)
   - What repetitive operational tasks does this type of business have?
   - Think about: client onboarding, invoicing, vendor management, reporting, compliance, inventory, content production, lead follow-up, etc.
   - Be SPECIFIC to their industry - a landscaping company has different recurring processes than a SaaS startup

3. CALENDAR/SCHEDULING PATTERNS
   - What types of meetings does this founder likely have?
   - What scheduling complexity exists (time zones, recurring meetings, prep needs)?
   - How does their role drive their calendar?

4. PERSONAL LIFE MANAGEMENT OPPORTUNITIES
   - Calibrate to their revenue tier (provided in the user turn)
   - For 'getting organized' and 'growing' tiers: focus on basic personal admin that competes with work time
   - For 'scaling', 'systemizing', 'optimizing' tiers: include executive-level personal coordination (travel, family logistics, household management)

5. PAIN POINT DECOMPOSITION
   - Turn each stated pain point into 3-4 distinct underlying problems
   - Example: "email chaos" -> (1) high volume of low-priority messages, (2) important emails buried, (3) response time expectations from clients, (4) no system for follow-ups

6. REVENUE-TIER CONTEXT
   - 'getting organized' stage businesses need: setting up first systems, finding time for strategic work, delegating for the first time. Help them make more money and deliver their service better.
   - 'growing' stage: building repeatable processes, hiring/managing first team members, establishing SOPs. Transition from doing everything to delegating.
   - 'scaling' stage: team coordination, process documentation, things slipping through cracks. Multiple projects/clients to manage simultaneously.
   - 'systemizing' stage: executive-level operations, strategic planning time, board/investor prep. The business should run without the founder in every meeting.
   - 'optimizing' stage: board prep, investor relations, executive delegation, strategic partnerships. Focus on highest-leverage activities only.

===== OUTPUT FORMAT =====
Return ONLY valid JSON:
{
  "business_description": "2-3 sentence description of what this business does, who they serve, and their primary value proposition",
  "recurring_processes": [
    "Process 1: Specific recurring task for THIS business (e.g., 'Weekly client status report compilation for active landscaping projects')",
    "Process 2: ..."
  ],
  "calendar_patterns": [
    "Pattern 1: Specific scheduling need (e.g., 'Coordinating site visits with subcontractors across multiple job locations')"
  ],
  "personal_life_opportunities": [
    "Opportunity 1: Specific personal task (e.g., 'Managing family vacation planning around peak construction season')"
  ],
  "pain_point_decomposition": [
    "Pain point -> underlying problem 1",
    "Pain point -> underlying problem 2"
  ],
  "revenue_tier_context": "1-2 sentences about what this founder needs at their current stage"
}

RULES:
- NEVER use em-dashes. Use regular hyphens only.
- Be SPECIFIC to this business - no generic statements that could apply to anyone.
- If data is limited, make reasonable inferences based on revenue tier and any available signals.
- Output ONLY valid JSON, no other text.`;

/**
 * Build the dynamic user-turn message for the analysis call.
 * Contains all per-request data: serialized lead, context, pain points.
 */
export function buildBusinessAnalysisUser(
  leadData: UnifiedLeadData,
  brief: LeadBrief
): string {
  const serializedLead = serializeLeadData(leadData);

  return `===== FOUNDER DATA =====
${serializedLead}

===== ANALYSIS CONTEXT =====
Revenue Tier: ${brief.revenueTier} (${brief.revenue})
Data Richness: ${brief.dataRichness}
${brief.inferredIndustry ? `Industry (grounded): ${brief.inferredIndustry}` : 'Industry: UNKNOWN - use industry-neutral framing throughout'}
${brief.painPoints.length > 0 ? `Stated Pain Points (these describe PROBLEMS to solve, not the founder's industry): ${brief.painPoints.join('; ')}` : 'No explicit pain points provided - infer from revenue tier and business context'}

Produce the Delegation Opportunity Brief as valid JSON per the output format above.`;
}

/**
 * Legacy: single-string prompt for backward compatibility with tests and
 * any callers still passing one prompt into a single-turn API call.
 */
export function buildBusinessAnalysisPrompt(
  leadData: UnifiedLeadData,
  brief: LeadBrief
): string {
  return `${BUSINESS_ANALYSIS_SYSTEM}\n\n${buildBusinessAnalysisUser(leadData, brief)}`;
}
