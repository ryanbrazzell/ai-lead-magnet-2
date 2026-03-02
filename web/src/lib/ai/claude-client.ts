/**
 * Claude AI Client for Task Generation
 *
 * Supports two call types:
 * - Analysis call: Lower tokens, faster (business analysis brief)
 * - Generation call: Higher tokens (Core Four task generation)
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Task, TaskGenerationResult, BusinessAnalysisBrief, CoreTaskType } from '@/types';

/**
 * Retry wrapper for transient API failures
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
  delayMs = 2000
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTransient =
        message.includes('500') ||
        message.includes('529') ||
        message.includes('overloaded') ||
        message.includes('timeout') ||
        message.includes('ECONNRESET') ||
        message.includes('fetch failed');
      if (!isTransient || attempt === maxRetries) throw error;
      console.warn(
        `Claude API transient error (attempt ${attempt + 1}), retrying in ${delayMs}ms...`,
        message
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Unreachable');
}

// Claude model configuration - shared base
const MODEL = 'claude-sonnet-4-6';

// Analysis call config (Call 1) - lower tokens, faster
export const ANALYSIS_CONFIG = {
  model: MODEL,
  temperature: 0.5,
  maxTokens: 2048,
  timeout: 30000, // 30 seconds
  maxRetries: 1,
} as const;

// Generation call config (Call 2) - higher tokens for full task output
export const GENERATION_CONFIG = {
  model: MODEL,
  temperature: 0.6,
  maxTokens: 8192,
  timeout: 60000, // 60 seconds
  maxRetries: 1,
} as const;

// Legacy config alias for backward compatibility
export const CLAUDE_CONFIG = GENERATION_CONFIG;

/**
 * Get API key from environment variables
 */
export function getApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey && apiKey.trim() !== '') return apiKey;
  throw new Error('Missing API key: Set ANTHROPIC_API_KEY environment variable');
}

/**
 * Clean raw response text (strip markdown, em-dashes)
 */
function cleanResponseText(text: string): string {
  let cleaned = text.trim();

  // Strip markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  // Strip leading "json" prefix
  if (cleaned.startsWith('json\n')) {
    cleaned = cleaned.slice(5);
  }

  cleaned = cleaned.trim();

  // Replace em-dashes
  cleaned = cleaned.replace(/—/g, '-');

  return cleaned;
}

/**
 * Parse Claude response for business analysis (Call 1)
 */
export function parseAnalysisResponse(responseText: string): BusinessAnalysisBrief {
  const cleaned = cleanResponseText(responseText);

  try {
    const parsed = JSON.parse(cleaned) as BusinessAnalysisBrief;

    // Validate required fields
    if (!parsed.business_description || !parsed.recurring_processes) {
      throw new Error('Missing required fields in analysis response');
    }

    // Ensure arrays have content
    if (!Array.isArray(parsed.recurring_processes) || parsed.recurring_processes.length === 0) {
      throw new Error('recurring_processes must be a non-empty array');
    }

    // Default empty arrays for optional fields
    parsed.calendar_patterns = parsed.calendar_patterns || [];
    parsed.personal_life_opportunities = parsed.personal_life_opportunities || [];
    parsed.pain_point_decomposition = parsed.pain_point_decomposition || [];
    parsed.revenue_tier_context = parsed.revenue_tier_context || '';

    return parsed;
  } catch (error) {
    const parseError = error as Error;
    throw new Error(
      `Failed to parse analysis response: ${parseError.message}. Preview: ${cleaned.slice(0, 200)}...`
    );
  }
}

/**
 * Parse Claude response for task generation (Call 2)
 */
export function parseGenerationResponse(responseText: string): TaskGenerationResult {
  const cleaned = cleanResponseText(responseText);

  try {
    const parsed = JSON.parse(cleaned);

    // Validate tasks structure has Core Four areas
    if (!parsed.tasks) {
      throw new Error('Missing "tasks" in response');
    }

    const tasks = parsed.tasks;

    // Ensure all Core Four areas exist (default to empty arrays)
    const result: TaskGenerationResult = {
      tasks: {
        businessProcesses: tasks.businessProcesses || tasks.business_processes || [],
        personalLife: tasks.personalLife || tasks.personal_life || [],
        calendar: tasks.calendar || [],
        email: tasks.email || [],
      },
      analysis_summary: parsed.analysis_summary || '',
      total_task_count: 0,
      // Legacy fields - all tasks are EA
      ea_task_percent: 100,
      ea_task_count: 0,
      summary: parsed.analysis_summary || '',
    };

    // Set all tasks to EA ownership and calculate counts
    const allAreas = ['businessProcesses', 'personalLife', 'calendar', 'email'] as const;
    let totalCount = 0;
    for (const area of allAreas) {
      for (const task of result.tasks[area]) {
        task.owner = task.owner || 'EA';
        task.isEA = true;
        task.category = task.category || 'Operations';
      }
      totalCount += result.tasks[area].length;
    }

    result.total_task_count = totalCount;
    result.ea_task_count = totalCount;

    return result;
  } catch (error) {
    const parseError = error as Error;
    throw new Error(
      `Failed to parse generation response: ${parseError.message}. Preview: ${cleaned.slice(0, 200)}...`
    );
  }
}

/**
 * Legacy parser - kept for backward compatibility with fallback prompts
 */
export function parseClaudeResponse(responseText: string): TaskGenerationResult {
  const cleaned = cleanResponseText(responseText);

  try {
    const parsed = JSON.parse(cleaned);

    // If response uses new Core Four format, route to new parser
    if (parsed.tasks?.businessProcesses || parsed.tasks?.business_processes) {
      return parseGenerationResponse(responseText);
    }

    // Legacy format: tasks grouped by frequency
    const legacyResult = parsed as {
      tasks: { daily: unknown[]; weekly: unknown[]; monthly: unknown[] };
      ea_task_percent: number;
      ea_task_count: number;
      total_task_count: number;
      summary: string;
    };

    // Convert legacy frequency-based to Core Four
    const allTasks = [
      ...(legacyResult.tasks.daily || []),
      ...(legacyResult.tasks.weekly || []),
      ...(legacyResult.tasks.monthly || []),
    ] as Array<{ title: string; description: string; category: string; coreTaskType?: string; owner?: string; isEA?: boolean }>;

    const coreFourTasks: TaskGenerationResult['tasks'] = {
      businessProcesses: [],
      personalLife: [],
      calendar: [],
      email: [],
    };

    for (const task of allTasks) {
      const enriched: Task = {
        title: task.title,
        description: task.description,
        category: task.category || 'Operations',
        owner: (task.owner || 'EA') as 'EA' | 'You',
        isEA: task.isEA !== false,
        coreTaskType: task.coreTaskType as CoreTaskType | undefined,
      };

      // Route to Core Four area
      const ct = task.coreTaskType;
      if (ct === 'emailManagement') {
        coreFourTasks.email.push(enriched);
      } else if (ct === 'calendarManagement') {
        coreFourTasks.calendar.push(enriched);
      } else if (ct === 'personalLifeManagement') {
        coreFourTasks.personalLife.push(enriched);
      } else {
        coreFourTasks.businessProcesses.push(enriched);
      }
    }

    const totalCount = allTasks.length;

    return {
      tasks: coreFourTasks,
      analysis_summary: legacyResult.summary || '',
      total_task_count: totalCount,
      ea_task_percent: 100,
      ea_task_count: totalCount,
      summary: legacyResult.summary || '',
    };
  } catch (error) {
    const parseError = error as Error;
    throw new Error(
      `Failed to parse Claude response: ${parseError.message}. Preview: ${cleaned.slice(0, 200)}...`
    );
  }
}

/**
 * Make a Claude API call with given config
 */
async function callClaude(
  prompt: string,
  config: typeof ANALYSIS_CONFIG | typeof GENERATION_CONFIG
): Promise<string> {
  const apiKey = getApiKey();
  const anthropic = new Anthropic({ apiKey });

  const response = await callWithRetry(
    () =>
      anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }],
      }),
    config.maxRetries
  );

  const textContent = response.content.find((block) => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Claude API returned empty or invalid response structure');
  }

  console.log('Claude API call complete', {
    model: config.model,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  });

  return textContent.text;
}

/**
 * Call 1: Business Analysis
 * Lower tokens, focused reasoning about the business
 */
export async function generateAnalysis(prompt: string): Promise<BusinessAnalysisBrief> {
  console.log('Claude API: Starting business analysis (Call 1)', {
    promptLength: prompt.length,
    model: ANALYSIS_CONFIG.model,
    maxTokens: ANALYSIS_CONFIG.maxTokens,
  });

  const startTime = Date.now();
  const responseText = await callClaude(prompt, ANALYSIS_CONFIG);
  const result = parseAnalysisResponse(responseText);

  console.log('Claude API: Business analysis complete', {
    duration: Date.now() - startTime,
    processCount: result.recurring_processes.length,
  });

  return result;
}

/**
 * Call 2: Core Four Task Generation
 * Higher tokens for full task output
 */
export async function generateCoreFourTasks(prompt: string): Promise<TaskGenerationResult> {
  console.log('Claude API: Starting Core Four task generation (Call 2)', {
    promptLength: prompt.length,
    model: GENERATION_CONFIG.model,
    maxTokens: GENERATION_CONFIG.maxTokens,
  });

  const startTime = Date.now();
  const responseText = await callClaude(prompt, GENERATION_CONFIG);
  const result = parseGenerationResponse(responseText);

  console.log('Claude API: Task generation complete', {
    duration: Date.now() - startTime,
    totalTasks: result.total_task_count,
    businessProcesses: result.tasks.businessProcesses.length,
    personalLife: result.tasks.personalLife.length,
    calendar: result.tasks.calendar.length,
    email: result.tasks.email.length,
  });

  return result;
}

/**
 * Legacy: Generate tasks using a single prompt
 * Used by fallback prompts
 */
export async function generateWithClaude(prompt: string): Promise<TaskGenerationResult> {
  console.log('Claude API: Starting legacy task generation', {
    promptLength: prompt.length,
    model: GENERATION_CONFIG.model,
  });

  const startTime = Date.now();
  const responseText = await callClaude(prompt, GENERATION_CONFIG);
  const result = parseClaudeResponse(responseText);

  console.log('Claude API: Legacy generation complete', {
    duration: Date.now() - startTime,
    totalTasks: result.total_task_count,
  });

  return result;
}
