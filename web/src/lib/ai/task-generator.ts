/**
 * Task Generator Service
 *
 * Main service for generating personalized task reports using Claude AI.
 * Handles lead type routing, prompt selection, and fallback escalation.
 *
 * Lead Type Routing:
 * - 'main' leadType: Uses buildUnifiedPromptJSON (full 240-line prompt)
 * - 'simple'/'standard' leadType: Uses buildStreamlinedPrompt (optimized prompt)
 *
 * Fallback Escalation (on failures):
 * - Primary prompt -> buildSimplifiedPrompt -> buildEmergencyPrompt
 */

import type { UnifiedLeadData, TaskGenerationResult } from '@/types';
import { generateWithClaude } from './claude-client';
import {
  buildUnifiedPromptJSON,
  buildStreamlinedPrompt,
  buildSimplifiedPrompt,
  buildEmergencyPrompt,
} from './prompts';
import { extractDomainFromEmail, scrapeWebsiteContent } from '@/lib/website/analyzer';

/**
 * Structured logger for task generator operations
 */
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
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[TaskGenerator:DEBUG] ${message}`, context || '');
    }
  },
};

/**
 * Count the number of non-empty fields in lead data
 */
function countDataFields(leadData: UnifiedLeadData): number {
  return Object.values(leadData).filter(
    (value) => value !== undefined && value !== null && value !== ''
  ).length;
}

/**
 * Build the appropriate prompt based on lead type
 *
 * Routing logic:
 * - 'main' leadType: Uses buildUnifiedPromptJSON (full 240-line prompt)
 * - 'simple' or 'standard' leadType: Uses buildStreamlinedPrompt (optimized)
 *
 * @param leadData - The unified lead data
 * @returns The constructed prompt string
 */
function buildPromptForLeadType(leadData: UnifiedLeadData): string {
  const { leadType } = leadData;
  const dataFieldsCount = countDataFields(leadData);

  log.info('Building prompt for lead type', {
    leadType,
    dataFieldsCount,
    hasName: !!(leadData.firstName || leadData.lastName),
    hasBusinessType: !!leadData.businessType,
    hasChallenges: !!(leadData.challenges || leadData.timeBottleneck),
  });

  if (leadType === 'main') {
    log.debug('Using buildUnifiedPromptJSON for main lead type');
    return buildUnifiedPromptJSON(leadData);
  }

  // For 'simple' and 'standard' lead types, use streamlined prompt
  log.debug('Using buildStreamlinedPrompt for simple/standard lead type', {
    leadType,
  });
  return buildStreamlinedPrompt(leadData);
}

/**
 * Attempt task generation with a specific prompt
 *
 * @param prompt - The prompt to send to Gemini
 * @param attemptName - Name for logging purposes
 * @returns TaskGenerationResult
 * @throws Error if generation fails
 */
async function attemptGeneration(
  prompt: string,
  attemptName: string
): Promise<TaskGenerationResult> {
  log.info('Starting API request', {
    attemptName,
    promptLength: prompt.length,
    timeout: '30000ms',
    maxRetries: 1,
  });

  const startTime = Date.now();

  try {
    const result = await generateWithClaude(prompt);

    log.info('Response parsing successful', {
      attemptName,
      duration: Date.now() - startTime,
      totalTasks: result.total_task_count,
      eaPercent: result.ea_task_percent,
      dailyCount: result.tasks.daily.length,
      weeklyCount: result.tasks.weekly.length,
      monthlyCount: result.tasks.monthly.length,
    });

    // Log validation results
    const isValidTaskCount = result.total_task_count === 30;
    const isValidEaPercent =
      result.ea_task_percent >= 40 && result.ea_task_percent <= 60;

    log.info('Validation results', {
      attemptName,
      isValidTaskCount,
      isValidEaPercent,
      taskCount: result.total_task_count,
      eaPercent: result.ea_task_percent,
    });

    return result;
  } catch (error) {
    const err = error as Error;
    log.error('Response parsing/API failed', {
      attemptName,
      duration: Date.now() - startTime,
      error: err.message,
    });
    throw error;
  }
}

/**
 * Enrich lead data with website analysis if possible
 * 
 * @param leadData - The unified lead data
 * @returns Enriched lead data with companyAnalysis if available
 */
async function enrichWithWebsiteAnalysis(
  leadData: UnifiedLeadData
): Promise<UnifiedLeadData> {
  // Skip if already has analysis or no email
  if (leadData.companyAnalysis || !leadData.email) {
    return leadData;
  }

  // Extract domain from email
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
      log.warn('Website scrape failed', {
        domain,
        error: scrapeResult.error,
      });
    }
  } catch (error) {
    const err = error as Error;
    log.warn('Website scrape error', {
      domain,
      error: err.message,
    });
  }

  return leadData;
}

/**
 * Generate personalized tasks using AI
 *
 * Main entry point for task generation. Handles:
 * 1. Website analysis from email domain (if business email)
 * 2. Lead type routing to select appropriate prompt
 * 3. Fallback escalation on failures (simplified -> emergency)
 * 4. Structured logging throughout the process
 *
 * @param leadData - The unified lead data from the form
 * @returns TaskGenerationResult with 30 tasks
 * @throws Error with structured message if all attempts fail
 */
export async function generateTasks(
  leadData: UnifiedLeadData
): Promise<TaskGenerationResult> {
  const { leadType } = leadData;
  const dataFieldsCount = countDataFields(leadData);

  log.info('Starting task generation', {
    leadType,
    dataFieldsCount,
    email: leadData.email,
    timestamp: leadData.timestamp,
  });

  // Enrich with website analysis if possible
  const enrichedLeadData = await enrichWithWebsiteAnalysis(leadData);
  const hasWebsiteAnalysis = !!enrichedLeadData.companyAnalysis;
  
  log.info('Lead data enrichment complete', {
    hasWebsiteAnalysis,
    businessType: enrichedLeadData.companyAnalysis?.businessType,
    industry: enrichedLeadData.companyAnalysis?.industry,
  });

  // Track errors for final error message
  const errors: string[] = [];

  // Attempt 1: Primary prompt based on lead type (with enriched data)
  try {
    const primaryPrompt = buildPromptForLeadType(enrichedLeadData);
    return await attemptGeneration(primaryPrompt, 'primary');
  } catch (error) {
    const err = error as Error;
    errors.push(`Primary attempt: ${err.message}`);
    log.warn('Primary prompt failed, escalating to simplified', {
      leadType,
      error: err.message,
    });
  }

  // Attempt 2: Simplified fallback prompt
  try {
    log.info('Building simplified fallback prompt', {
      leadType,
      dataFieldsCount,
    });
    const simplifiedPrompt = buildSimplifiedPrompt(enrichedLeadData);
    return await attemptGeneration(simplifiedPrompt, 'simplified');
  } catch (error) {
    const err = error as Error;
    errors.push(`Simplified attempt: ${err.message}`);
    log.warn('Simplified prompt failed, escalating to emergency', {
      leadType,
      error: err.message,
    });
  }

  // Attempt 3: Emergency fallback prompt (minimal context)
  try {
    log.info('Building emergency fallback prompt', {
      leadType,
    });
    const emergencyPrompt = buildEmergencyPrompt();
    return await attemptGeneration(emergencyPrompt, 'emergency');
  } catch (error) {
    const err = error as Error;
    errors.push(`Emergency attempt: ${err.message}`);
    log.error('All task generation attempts failed', {
      leadType,
      dataFieldsCount,
      errors,
    });
  }

  // All attempts exhausted
  throw new Error(
    `All task generation attempts failed for lead type "${leadType}". Errors: ${errors.join('; ')}`
  );
}
