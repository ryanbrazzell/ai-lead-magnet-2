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
import { generateAnalysis, generateCoreFourTasks, generateWithClaude } from './claude-client';
import { buildBusinessAnalysisPrompt } from './prompts/business-analysis-prompt';
import { buildCoreFourGenerationPrompt } from './prompts/core-four-generation-prompt';
import { buildLeadBrief } from './lead-brief';
import {
  buildSimplifiedPrompt,
  buildEmergencyPrompt,
} from './prompts';
import { extractDomainFromEmail, scrapeWebsiteContent } from '@/lib/website/analyzer';

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
 * Enrich lead data with website analysis if possible
 */
async function enrichWithWebsiteAnalysis(
  leadData: UnifiedLeadData
): Promise<UnifiedLeadData> {
  if (leadData.companyAnalysis || !leadData.email) {
    return leadData;
  }

  const domain = extractDomainFromEmail(leadData.email);
  if (!domain) {
    log.info('No business domain found in email, skipping website analysis', {
      email: leadData.email,
    });
    return leadData;
  }

  log.info('Scraping website from email domain', { domain });

  try {
    const scrapeResult = await scrapeWebsiteContent(domain);

    if (scrapeResult.analysisSuccess) {
      log.info('Website scrape successful', {
        domain,
        contentLength: scrapeResult.keyContent?.[0]?.length || 0,
        processingTime: scrapeResult.processingTime,
      });

      return {
        ...leadData,
        companyAnalysis: scrapeResult,
        website: leadData.website || `https://${domain}`,
      };
    } else {
      log.warn('Website scrape failed', { domain, error: scrapeResult.error });
    }
  } catch (error) {
    const err = error as Error;
    log.warn('Website scrape error', { domain, error: err.message });
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

  // Call 1: Business Analysis
  log.info('Starting Call 1: Business Analysis');
  const analysisStartTime = Date.now();

  const analysisPrompt = buildBusinessAnalysisPrompt(leadData, brief);
  const analysisBrief = await generateAnalysis(analysisPrompt);

  log.info('Call 1 complete', {
    duration: Date.now() - analysisStartTime,
    processCount: analysisBrief.recurring_processes.length,
    calendarPatterns: analysisBrief.calendar_patterns.length,
    personalOpportunities: analysisBrief.personal_life_opportunities.length,
    painDecomposition: analysisBrief.pain_point_decomposition.length,
  });

  // Call 2: Core Four Task Generation
  log.info('Starting Call 2: Core Four Task Generation');
  const generationStartTime = Date.now();

  const generationPrompt = buildCoreFourGenerationPrompt(analysisBrief, brief);
  const result = await generateCoreFourTasks(generationPrompt);

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
    return await generateWithTwoPromptChain(enrichedLeadData);
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
