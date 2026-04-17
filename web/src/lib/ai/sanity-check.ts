/**
 * Sanity Check Pass
 *
 * After the main generation step, we ask Claude (Haiku 4.5 — cheap and fast)
 * to compare the generated tasks against the research findings. Catches
 * cases where the writer drifted into industry specifics despite being
 * told to stay neutral, or where tasks contradict what we actually learned
 * about the business.
 *
 * This is cheap insurance. ~$0.002 per report, ~5-10 seconds added latency.
 * Non-blocking: if the check itself fails, we log and return the original
 * report unchanged.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { TaskGenerationResult, WebsiteAnalysis } from '@/types';
import { getApiKey } from './claude-client';

const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[SanityCheck:INFO] ${message}`, context || '');
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[SanityCheck:WARN] ${message}`, context || '');
  },
};

const CHECK_MODEL = 'claude-haiku-4-5';
const CHECK_MAX_TOKENS = 500;
const CHECK_TIMEOUT_MS = 15_000;

export interface SanityCheckResult {
  /** True when no serious issues were found */
  passed: boolean;
  /** Concerns found, each a short string */
  issues: string[];
  /** Whether we were able to run the check at all */
  ran: boolean;
  processingTime: number;
}

/**
 * Run a quick sanity check on a generated report.
 *
 * Takes the business context we grounded on (from research) and a flattened
 * preview of the generated tasks. Returns a pass/fail with any concerns.
 *
 * The caller decides what to do with failures — typically log them for
 * review but still ship the report (failures are often false positives on
 * generic-but-valid tasks).
 */
export async function sanityCheckReport(
  result: TaskGenerationResult,
  companyAnalysis: WebsiteAnalysis | undefined
): Promise<SanityCheckResult> {
  const startTime = Date.now();

  const industryKnown =
    !!companyAnalysis &&
    companyAnalysis.analysisSuccess &&
    companyAnalysis.industry &&
    companyAnalysis.industry !== 'Unknown' &&
    companyAnalysis.industry !== 'To be analyzed';

  // Build a compact summary of what the grounded research found
  const contextSummary = industryKnown
    ? `GROUNDED CONTEXT (what we actually know about this business):
- Industry: ${companyAnalysis!.industry}
- Business: ${companyAnalysis!.description || companyAnalysis!.title || 'See industry'}
${companyAnalysis!.services?.length ? `- Services: ${companyAnalysis!.services.join(', ')}` : ''}`
    : `GROUNDED CONTEXT: Industry is UNKNOWN. Tasks must use industry-neutral language ("your team", "your customers"), NOT industry specifics ("your media buyers", "your retainer clients", "your patients").`;

  // Flatten the top few tasks from each area for the check
  const taskPreview = [
    ...result.tasks.businessProcesses.slice(0, 6),
    ...result.tasks.personalLife.slice(0, 3),
    ...result.tasks.calendar.slice(0, 3),
    ...result.tasks.email.slice(0, 2),
  ]
    .map((t, i) => `${i + 1}. ${t.title}: ${t.description}`)
    .join('\n');

  const prompt = `${contextSummary}

GENERATED TASKS (a sample):
${taskPreview}

YOUR JOB: Quickly check whether these tasks are consistent with the grounded context.

Flag a CONCERN when:
- A task references an industry detail that contradicts the grounded industry (e.g. tasks about "media buyers" when the grounded industry is a franchise operation)
- A task invents specific industry machinery ("Google Ads reporting", "retainer client onboarding", "patient intake", "MLS listings") when grounded industry is UNKNOWN
- Tasks reference tools, roles, or workflows that clearly don't fit the grounded industry

DO NOT flag:
- Generic business tasks (email triage, calendar management, vendor follow-up) — these are universal and fine
- Slight stylistic drift
- Tasks that are specific but plausible for the grounded industry

Output ONLY valid JSON:
{
  "passed": true | false,
  "issues": ["short concern 1", "short concern 2"]
}

No markdown fences, no explanation, just JSON.`;

  try {
    const apiKey = getApiKey();
    const client = new Anthropic({ apiKey });

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    let response: Anthropic.Messages.Message;
    try {
      response = await client.messages.create(
        {
          model: CHECK_MODEL,
          max_tokens: CHECK_MAX_TOKENS,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }],
        },
        { signal: controller.signal }
      );
    } finally {
      clearTimeout(timeoutHandle);
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.Messages.TextBlock => b.type === 'text'
    );
    if (!textBlock) {
      log.warn('Sanity check returned no text block');
      return { passed: true, issues: [], ran: false, processingTime: Date.now() - startTime };
    }

    const parsed = parseCheckOutput(textBlock.text);
    if (!parsed) {
      log.warn('Sanity check returned unparseable JSON', {
        preview: textBlock.text.slice(0, 200),
      });
      return { passed: true, issues: [], ran: false, processingTime: Date.now() - startTime };
    }

    const passed = parsed.passed === true;
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues.map((i) => String(i)).filter(Boolean).slice(0, 10)
      : [];

    log.info('Sanity check complete', {
      passed,
      issueCount: issues.length,
      processingTime: Date.now() - startTime,
    });

    return {
      passed,
      issues,
      ran: true,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    const err = error as Error;
    log.warn('Sanity check threw', { error: err.message });
    return { passed: true, issues: [], ran: false, processingTime: Date.now() - startTime };
  }
}

function parseCheckOutput(raw: string): { passed?: boolean; issues?: unknown[] } | null {
  const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(stripped);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    // Try to find { ... } substring
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        const parsed = JSON.parse(raw.substring(firstBrace, lastBrace + 1));
        return typeof parsed === 'object' && parsed !== null ? parsed : null;
      } catch {
        return null;
      }
    }
    return null;
  }
}
