/**
 * Grounded Website Research
 *
 * Replaces the legacy regex-based HTML scraper with a Claude-powered
 * research step. Claude actually reads the prospect's website using the
 * server-side web_fetch tool and returns a structured analysis with
 * explicit confidence labels for every claim.
 *
 * Goal: eliminate industry hallucination by grounding every downstream
 * prompt in information that came from real content Claude read, not
 * keyword-based inference from pain points.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { WebsiteAnalysis } from '@/types';
import { getApiKey } from './claude-client';

const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[Research:INFO] ${message}`, context || '');
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[Research:WARN] ${message}`, context || '');
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[Research:ERROR] ${message}`, context || '');
  },
};

// Claude model configuration for research
const RESEARCH_MODEL = 'claude-sonnet-4-6';
const RESEARCH_MAX_TOKENS = 2000;
const RESEARCH_MAX_PAUSE_RESUMES = 1;
const WEB_FETCH_MAX_USES = 2;

// Hard wall-clock timeout so a pathological site can't blow our budget.
// Still well below the /api/generate-tasks route's maxDuration = 120s.
const RESEARCH_TIMEOUT_MS = 60_000;

/**
 * Structured research output. Every factual claim carries a confidence
 * label so downstream prompts can decide how much to lean on it.
 */
export interface GroundedResearch {
  /** "https://example.com" — the URL we actually tried to fetch */
  url: string;
  /** True when Claude fetched and extracted meaningful content */
  fetchSucceeded: boolean;
  /** Short reason string when fetch failed (logged, not shown to users) */
  fetchFailureReason?: string;
  /** One-sentence description, or "Unknown" */
  businessDescription: string;
  /** Industry label or "Unknown" — NEVER a guess */
  industry: string;
  /** Industry confidence: 'high' = from site content, 'low' = from form field, 'unknown' = nothing */
  industryConfidence: 'high' | 'medium' | 'low' | 'unknown';
  /** Services or products found on the site */
  services: string[];
  /** Team size signal if visible on the site ("Solo", "Small", "Medium", etc.) */
  teamSize: string;
  /** Freeform notes Claude wanted to surface to the writer */
  notes: string;
  /** Processing time in ms */
  processingTime: number;
}

const RESEARCH_PROMPT_SYSTEM = `You are a careful business analyst. Your only job is to fetch a prospect's website and report what is actually there. This report will feed a downstream AI that writes a personalized business report for a paying prospect. If you fabricate industry or business details, the downstream report will be wrong and the prospect will be harmed.

HARD RULES:
1. Use the web_fetch tool exactly once on the provided URL. If it fails, DO NOT invent content. Mark fetch as failed and stop.
2. Never guess an industry based on the domain name, the prospect's pain points, their revenue band, or their email address. Industry comes ONLY from content you actually read on the fetched page.
3. If the site is a login screen, a redirect loop, a 404, blocked by a bot wall, or returns a near-empty body, treat fetch as failed.
4. If the site loads but the content is too sparse to confidently describe the business (e.g. just a logo and contact info), mark industry as "Unknown" with confidence "unknown".
5. Every field you output needs to be either grounded in the content you read, or explicitly "Unknown".
6. Do not use code_execution to process the fetched content. Read it directly and output JSON. No tmp files, no scripts, no validation passes.
7. Output ONLY valid JSON. No preamble, no explanation, no markdown code fences.

OUTPUT SHAPE (copy exactly):
{
  "fetchSucceeded": true | false,
  "fetchFailureReason": "short reason or empty string",
  "businessDescription": "one sentence about what the business actually does, or 'Unknown'",
  "industry": "specific industry like 'McDonald's franchise operations' or 'Family law practice', or 'Unknown'",
  "industryConfidence": "high" | "medium" | "low" | "unknown",
  "services": ["service 1", "service 2"],
  "teamSize": "Solo" | "Small (2-10)" | "Medium (11-50)" | "Large (50+)" | "Unknown",
  "notes": "short freeform notes (max 200 chars) or empty string"
}`;

/**
 * Normalize a URL or bare domain into a full URL we can pass to web_fetch.
 */
function normalizeUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Conduct grounded research on a prospect's website.
 *
 * Returns an "Unknown" result (never throws) if:
 *   - No URL was provided
 *   - The fetch failed
 *   - Claude couldn't extract meaningful content
 *   - The whole research step exceeded RESEARCH_TIMEOUT_MS
 *
 * Downstream code should treat any "Unknown" industry as a hard signal to
 * fall back on industry-neutral framing in the generated report.
 */
export async function researchWebsite(
  urlOrDomain: string | null | undefined
): Promise<GroundedResearch> {
  const startTime = Date.now();
  const url = normalizeUrl(urlOrDomain);

  if (!url) {
    log.info('No URL provided, skipping research');
    return buildUnknown('', 'no url provided', startTime);
  }

  const apiKey = getApiKey();
  const client = new Anthropic({ apiKey });

  const userPrompt = `Fetch this URL and report what you find:\n\n${url}`;

  let messages: { role: 'user' | 'assistant'; content: unknown }[] = [
    { role: 'user', content: userPrompt },
  ];
  let response: Anthropic.Messages.Message | null = null;
  let resumeCount = 0;

  try {
    const deadline = startTime + RESEARCH_TIMEOUT_MS;

    for (let attempt = 0; attempt <= RESEARCH_MAX_PAUSE_RESUMES; attempt++) {
      if (Date.now() > deadline) {
        log.warn('Research deadline exceeded before API call', { url });
        return buildUnknown(url, 'deadline exceeded', startTime);
      }

      log.info('Calling Claude for research', {
        url,
        attempt: attempt + 1,
        messageTurns: messages.length,
      });

      response = await client.messages.create({
        model: RESEARCH_MODEL,
        max_tokens: RESEARCH_MAX_TOKENS,
        system: RESEARCH_PROMPT_SYSTEM,
        messages: messages as Anthropic.Messages.MessageParam[],
        tools: [
          {
            type: 'web_fetch_20260209',
            name: 'web_fetch',
            max_uses: WEB_FETCH_MAX_USES,
          },
        ] as unknown as Anthropic.Messages.Tool[],
      });

      log.info('Research response received', {
        url,
        stopReason: response.stop_reason,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        cacheReadInputTokens: response.usage?.cache_read_input_tokens,
      });

      if (response.stop_reason !== 'pause_turn') break;

      resumeCount++;
      if (resumeCount > RESEARCH_MAX_PAUSE_RESUMES) {
        log.warn('Research exceeded max pause resumes', { url });
        return buildUnknown(url, 'too many pauses', startTime);
      }

      messages = [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: response.content },
      ];
    }

    if (!response) {
      return buildUnknown(url, 'no response', startTime);
    }

    if (response.stop_reason === 'refusal') {
      log.warn('Claude refused research request', { url });
      return buildUnknown(url, 'refused', startTime);
    }

    const parsed = extractResearchJson(response.content);
    if (!parsed) {
      const textPreview = extractTextPreview(response.content);
      log.error('Could not parse research JSON', { url, textPreview });
      return buildUnknown(url, 'unparseable output', startTime);
    }

    const processingTime = Date.now() - startTime;
    log.info('Research complete', {
      url,
      fetchSucceeded: parsed.fetchSucceeded,
      industry: parsed.industry,
      industryConfidence: parsed.industryConfidence,
      processingTime,
    });

    return {
      url,
      fetchSucceeded: !!parsed.fetchSucceeded,
      fetchFailureReason: typeof parsed.fetchFailureReason === 'string' && parsed.fetchFailureReason
        ? parsed.fetchFailureReason
        : undefined,
      businessDescription: sanitizeString(parsed.businessDescription) || 'Unknown',
      industry: sanitizeString(parsed.industry) || 'Unknown',
      industryConfidence: validConfidence(parsed.industryConfidence),
      services: Array.isArray(parsed.services)
        ? parsed.services.map(sanitizeString).filter(Boolean)
        : [],
      teamSize: sanitizeString(parsed.teamSize) || 'Unknown',
      notes: sanitizeString(parsed.notes) || '',
      processingTime,
    };
  } catch (error) {
    const err = error as Error;
    log.error('Research call threw', { url, error: err.message });
    return buildUnknown(url, `exception: ${err.message.slice(0, 120)}`, startTime);
  }
}

/**
 * Convert a successful GroundedResearch into the legacy WebsiteAnalysis
 * shape so the existing serializer and prompt builders still work.
 */
export function toWebsiteAnalysis(research: GroundedResearch): WebsiteAnalysis {
  const confidenceMap: Record<GroundedResearch['industryConfidence'], number> = {
    high: 0.9,
    medium: 0.6,
    low: 0.3,
    unknown: 0.1,
  };

  const keyContent = research.fetchSucceeded
    ? [
        `Business: ${research.businessDescription}`,
        `Industry: ${research.industry} [confidence: ${research.industryConfidence}]`,
        research.services.length ? `Services: ${research.services.join(', ')}` : '',
        research.teamSize !== 'Unknown' ? `Team size: ${research.teamSize}` : '',
        research.notes ? `Notes: ${research.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : [];

  return {
    url: research.url,
    normalizedUrl: research.url,
    title: research.businessDescription.slice(0, 120),
    description: research.businessDescription,
    businessType: research.industry,
    industry: research.industry,
    services: research.services,
    teamSizeEstimate: research.teamSize,
    keyContent: Array.isArray(keyContent) ? keyContent : [keyContent].filter(Boolean),
    analysisSuccess: research.fetchSucceeded && research.industryConfidence !== 'unknown',
    processingTime: research.processingTime,
    confidence: confidenceMap[research.industryConfidence],
    error: research.fetchFailureReason,
  };
}

// --- helpers ---

function buildUnknown(
  url: string,
  reason: string,
  startTime: number
): GroundedResearch {
  return {
    url,
    fetchSucceeded: false,
    fetchFailureReason: reason,
    businessDescription: 'Unknown',
    industry: 'Unknown',
    industryConfidence: 'unknown',
    services: [],
    teamSize: 'Unknown',
    notes: '',
    processingTime: Date.now() - startTime,
  };
}

function validConfidence(
  value: unknown
): GroundedResearch['industryConfidence'] {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'unknown';
}

function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/—/g, '-').trim();
}

/**
 * Scan Claude's response blocks newest-first for a JSON payload.
 * Claude may interleave narration and tool_use blocks with the final JSON.
 * Tries whole-block parsing, then fenced code blocks, then outermost braces.
 */
function extractResearchJson(content: unknown[]): Record<string, unknown> | null {
  const textBlocks = content.filter(
    (b): b is { type: 'text'; text: string } =>
      typeof b === 'object' && b !== null && (b as { type?: unknown }).type === 'text'
  );

  for (let i = textBlocks.length - 1; i >= 0; i--) {
    const raw = textBlocks[i].text;
    if (!raw) continue;

    // Strategy 1: whole block with fences stripped
    const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    if (stripped) {
      const parsed = tryParse(stripped);
      if (parsed) return parsed;
    }

    // Strategy 2: any fenced code block contents
    const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    const fenced: string[] = [];
    while ((match = fenceRegex.exec(raw)) !== null) {
      fenced.push(match[1].trim());
    }
    for (let j = fenced.length - 1; j >= 0; j--) {
      const parsed = tryParse(fenced[j]);
      if (parsed) return parsed;
    }

    // Strategy 3: first-brace to last-brace substring
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const parsed = tryParse(raw.substring(firstBrace, lastBrace + 1));
      if (parsed) return parsed;
    }
  }
  return null;
}

function tryParse(text: string): Record<string, unknown> | null {
  try {
    const result = JSON.parse(text);
    return typeof result === 'object' && result !== null ? result : null;
  } catch {
    return null;
  }
}

function extractTextPreview(content: unknown[]): string {
  const textBlock = content.find(
    (b): b is { type: 'text'; text: string } =>
      typeof b === 'object' && b !== null && (b as { type?: unknown }).type === 'text'
  );
  return textBlock ? textBlock.text.slice(0, 400) : '';
}
