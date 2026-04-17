/**
 * Task Generator Service — Two-Prompt Chain
 *
 * Replaces the single monolithic prompt with:
 * 1. Business Analysis (Call 1): Focused reasoning about the specific business
 * 2. Core Four Task Generation (Call 2): Tasks organized by Core Four area
 *
 * Fallback escalation on failures: simplified -> emergency prompt (legacy single-call)
 */

import type { UnifiedLeadData, TaskGenerationResult } from '@/types';
import {
  generateAnalysis,
  generateAnalysisCached,
  generateCoreFourTasks,
  generateCoreFourTasksCached,
  generateWithClaude,
} from './claude-client';
import { buildBusinessAnalysisPrompt } from './prompts/business-analysis-prompt';
import { buildCoreFourGenerationPrompt } from './prompts/core-four-generation-prompt';
import { buildLeadBrief } from './lead-brief';
import {
  buildSimplifiedPrompt,
  buildEmergencyPrompt,
} from './prompts';
import { extractDomainFromEmail, scrapeWebsiteContent } from '@/lib/website/analyzer';
import { researchWebsite, toWebsiteAnalysis } from './research';
import { sanityCheckReport } from './sanity-check';

const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[TaskGenerator:INFO] ${message}`, context || '');
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[TaskGenerator:WARN] ${message}`, context || '');
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[TaskGenerator:ERROR] ${message}`, context || '');
  },
};

/**
 * Enrich lead data with grounded website research.
 *
 * Flow:
 *   1. Determine the URL (explicit website field wins over email domain)
 *   2. Ask Claude to fetch the page and return structured research
 *   3. On success, attach the research as companyAnalysis
 *   4. On failure or low-confidence, fall back to the legacy regex scraper
 *      as a best-effort source of raw page text
 *
 * Never throws — downstream prompts treat a missing companyAnalysis as
 * "industry unknown, use neutral framing".
 */
async function enrichWithWebsiteAnalysis(
  leadData: UnifiedLeadData
): Promise<UnifiedLeadData> {
  if (leadData.companyAnalysis) {
    return leadData;
  }

  // Prefer an explicit website URL over email domain
  const explicitWebsite = leadData.website || leadData.companyWebsite;
  const domain = !explicitWebsite && leadData.email
    ? extractDomainFromEmail(leadData.email)
    : null;
  const target = explicitWebsite || domain;

  if (!target) {
    log.info('No website or business domain available; skipping research', {
      email: leadData.email,
    });
    return leadData;
  }

  log.info('Starting grounded research', { target });

  try {
    const research = await researchWebsite(target);

    if (research.fetchSucceeded && research.industryConfidence !== 'unknown') {
      log.info('Grounded research succeeded', {
        target,
        industry: research.industry,
        confidence: research.industryConfidence,
        processingTime: research.processingTime,
      });

      return {
        ...leadData,
        companyAnalysis: toWebsiteAnalysis(research),
        website: leadData.website || (domain ? `https://${domain}` : target),
      };
    }

    log.warn('Grounded research returned unknown; falling back to raw scrape', {
      target,
      reason: research.fetchFailureReason,
      confidence: research.industryConfidence,
    });
  } catch (error) {
    const err = error as Error;
    log.warn('Grounded research threw; falling back to raw scrape', {
      target,
      error: err.message,
    });
  }

  // Fallback: legacy regex scrape so the generation prompts still see raw
  // page text. The prompts treat placeholder businessType/industry ("Unknown",
  // "To be analyzed") as "industry unknown" and use neutral framing.
  const scrapeDomain = domain || target.replace(/^https?:\/\//, '').split('/')[0];
  try {
    const fallback = await scrapeWebsiteContent(scrapeDomain);
    if (fallback.analysisSuccess) {
      log.info('Fallback scrape returned content', {
        target: scrapeDomain,
        contentLength: fallback.keyContent?.[0]?.length || 0,
      });
      return {
        ...leadData,
        companyAnalysis: fallback,
        website: leadData.website || `https://${scrapeDomain}`,
      };
    }
    log.warn('Fallback scrape also failed', {
      target: scrapeDomain,
      error: fallback.error,
    });
  } catch (error) {
    const err = error as Error;
    log.warn('Fallback scrape threw', { target: scrapeDomain, error: err.message });
  }

  return leadData;
}

/**
 * Two-prompt chain: Business Analysis -> Core Four Generation
 */
async function generateWithTwoPromptChain(
  leadData: UnifiedLeadData
): Promise<TaskGenerationResult> {
  const brief = buildLeadBrief(leadData);

  log.info('Built lead brief', {
    name: brief.name,
    revenueTier: brief.revenueTier,
    dataRichness: brief.dataRichness,
    painPointCount: brief.painPoints.length,
    inferredIndustry: brief.inferredIndustry,
    hasWebsiteData: brief.hasWebsiteData,
  });

  // Call 1: Business Analysis (system prompt is cacheable)
  log.info('Starting Call 1: Business Analysis');
  const analysisStartTime = Date.now();

  const analysisBrief = await generateAnalysisCached(leadData, brief);

  log.info('Call 1 complete', {
    duration: Date.now() - analysisStartTime,
    processCount: analysisBrief.recurring_processes.length,
    calendarPatterns: analysisBrief.calendar_patterns.length,
    personalOpportunities: analysisBrief.personal_life_opportunities.length,
    painDecomposition: analysisBrief.pain_point_decomposition.length,
  });

  // Call 2: Core Four Task Generation (system prompt is cacheable)
  log.info('Starting Call 2: Core Four Task Generation');
  const generationStartTime = Date.now();

  const result = await generateCoreFourTasksCached(analysisBrief, brief);

  log.info('Call 2 complete', {
    duration: Date.now() - generationStartTime,
    totalTasks: result.total_task_count,
    businessProcesses: result.tasks.businessProcesses.length,
    personalLife: result.tasks.personalLife.length,
    calendar: result.tasks.calendar.length,
    email: result.tasks.email.length,
  });

  return result;
}

/**
 * Generate personalized tasks using AI
 *
 * Main entry point. Handles:
 * 1. Website analysis from email domain
 * 2. Two-prompt chain (analysis + generation)
 * 3. Fallback escalation on failures
 */
export async function generateTasks(
  leadData: UnifiedLeadData
): Promise<TaskGenerationResult> {
  const { leadType } = leadData;

  log.info('Starting task generation', {
    leadType,
    email: leadData.email,
    timestamp: leadData.timestamp,
  });

  // Enrich with website analysis
  const enrichedLeadData = await enrichWithWebsiteAnalysis(leadData);

  log.info('Lead data enrichment complete', {
    hasWebsiteAnalysis: !!enrichedLeadData.companyAnalysis,
    businessType: enrichedLeadData.companyAnalysis?.businessType,
    industry: enrichedLeadData.companyAnalysis?.industry,
  });

  const errors: string[] = [];

  // Attempt 1: Two-prompt chain (primary)
  try {
    const result = await generateWithTwoPromptChain(enrichedLeadData);

    // Sanity check: did we drift from the grounded context? Non-blocking.
    try {
      const check = await sanityCheckReport(result, enrichedLeadData.companyAnalysis);
      if (check.ran && !check.passed && check.issues.length > 0) {
        log.warn('Sanity check flagged concerns (report still shipped)', {
          leadType,
          email: enrichedLeadData.email,
          issues: check.issues,
        });
      }
    } catch (checkError) {
      const err = checkError as Error;
      log.warn('Sanity check threw (report still shipped)', { error: err.message });
    }

    return result;
  } catch (error) {
    const err = error as Error;
    errors.push(`Two-prompt chain: ${err.message}`);
    log.warn('Two-prompt chain failed, falling back to simplified', {
      leadType,
      error: err.message,
    });
  }

  // Attempt 2: Simplified fallback (single prompt)
  try {
    log.info('Building simplified fallback prompt');
    const simplifiedPrompt = buildSimplifiedPrompt(enrichedLeadData);
    return await generateWithClaude(simplifiedPrompt);
  } catch (error) {
    const err = error as Error;
    errors.push(`Simplified attempt: ${err.message}`);
    log.warn('Simplified prompt failed, escalating to emergency', {
      error: err.message,
    });
  }

  // Attempt 3: Emergency fallback (minimal context)
  try {
    log.info('Building emergency fallback prompt');
    const emergencyPrompt = buildEmergencyPrompt();
    return await generateWithClaude(emergencyPrompt);
  } catch (error) {
    const err = error as Error;
    errors.push(`Emergency attempt: ${err.message}`);
    log.error('All task generation attempts failed', { errors });
  }

  throw new Error(
    `All task generation attempts failed for lead type "${leadType}". Errors: ${errors.join('; ')}`
  );
}
