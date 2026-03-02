/**
 * Business Analysis Prompt (Call 1)
 *
 * Forces the AI to THINK about this specific business before
 * generating any tasks. Produces a structured "Delegation Opportunity Brief."
 */

import type { UnifiedLeadData } from '@/types';
import type { LeadBrief } from '../lead-brief';
import { serializeLeadData } from './serialize-lead';

/**
 * Build the business analysis prompt
 *
 * Input: all available lead data
 * Output: structured JSON "Delegation Opportunity Brief"
 */
export function buildBusinessAnalysisPrompt(
  leadData: UnifiedLeadData,
  brief: LeadBrief
): string {
  const serializedLead = serializeLeadData(leadData);

  return `You are an expert executive assistant strategist analyzing a founder's business to identify delegation opportunities.

Your job is to THINK deeply about this specific business and produce a structured analysis. Do NOT generate any tasks yet - just analyze.

===== FOUNDER DATA =====
${serializedLead}

===== ANALYSIS CONTEXT =====
Revenue Tier: ${brief.revenueTier} (${brief.revenue})
Data Richness: ${brief.dataRichness}
${brief.inferredIndustry ? `Inferred Industry: ${brief.inferredIndustry}` : 'Industry: Not yet determined - infer from available data'}
${brief.painPoints.length > 0 ? `Stated Pain Points: ${brief.painPoints.join('; ')}` : 'No explicit pain points provided - infer from revenue tier and business context'}

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
   - Calibrate to revenue tier: ${brief.revenueTier}
   - ${brief.revenueTier === 'getting organized' || brief.revenueTier === 'growing' ? 'Focus on basic personal admin that competes with work time' : 'Include executive-level personal coordination (travel, family logistics, household management)'}

5. PAIN POINT DECOMPOSITION
   - Turn each stated pain point into 3-4 distinct underlying problems
   - Example: "email chaos" -> (1) high volume of low-priority messages, (2) important emails buried, (3) response time expectations from clients, (4) no system for follow-ups

6. REVENUE-TIER CONTEXT
   - "${brief.revenueTier}" stage businesses need: ${getRevenueTierNeeds(brief.revenueTier)}

===== OUTPUT FORMAT =====
Return ONLY valid JSON:
{
  "business_description": "2-3 sentence description of what this business does, who they serve, and their primary value proposition",
  "recurring_processes": [
    "Process 1: Specific recurring task for THIS business (e.g., 'Weekly client status report compilation for active landscaping projects')",
    "Process 2: ...",
    // 6-8 items, each specific to their business
  ],
  "calendar_patterns": [
    "Pattern 1: Specific scheduling need (e.g., 'Coordinating site visits with subcontractors across multiple job locations')",
    // 3-5 items
  ],
  "personal_life_opportunities": [
    "Opportunity 1: Specific personal task (e.g., 'Managing family vacation planning around peak construction season')",
    // 3-5 items, calibrated to revenue tier
  ],
  "pain_point_decomposition": [
    "Pain point -> underlying problem 1",
    "Pain point -> underlying problem 2",
    // Decompose each stated pain point into distinct problems
  ],
  "revenue_tier_context": "1-2 sentences about what this founder needs at the '${brief.revenueTier}' stage"
}

RULES:
- NEVER use em-dashes. Use regular hyphens only.
- Be SPECIFIC to this business - no generic statements that could apply to anyone.
- If data is limited, make reasonable inferences based on revenue tier and any available signals.
- Output ONLY valid JSON, no other text.`;
}

function getRevenueTierNeeds(tier: string): string {
  switch (tier) {
    case 'getting organized':
      return 'Setting up first systems, finding time for strategic work, delegating for the first time. Help them make more money and deliver their service better.';
    case 'growing':
      return 'Building repeatable processes, hiring/managing first team members, establishing SOPs. Transition from doing everything to delegating.';
    case 'scaling':
      return 'Team coordination, process documentation, things slipping through cracks. Multiple projects/clients to manage simultaneously.';
    case 'systemizing':
      return 'Executive-level operations, strategic planning time, board/investor prep. The business should run without the founder in every meeting.';
    case 'optimizing':
      return 'Board prep, investor relations, executive delegation, strategic partnerships. Focus on highest-leverage activities only.';
    default:
      return 'General business optimization and delegation opportunities.';
  }
}
