/**
 * Lead Brief Construction
 *
 * Builds a structured brief from available lead data BEFORE any AI calls.
 * Ensures even Gmail users with minimal data get reasonable personalization.
 */

import type { UnifiedLeadData } from '@/types';

/**
 * Revenue tier context labels
 */
export type RevenueTierLabel =
  | 'getting organized'
  | 'growing'
  | 'scaling'
  | 'systemizing'
  | 'optimizing';

/**
 * Data richness levels
 */
export type DataRichness = 'high' | 'medium' | 'low';

/**
 * Structured lead brief for AI prompt injection
 */
export interface LeadBrief {
  name: string;
  email: string;
  domain: string | null;
  revenue: string;
  revenueTier: RevenueTierLabel;
  painPoints: string[];
  inferredIndustry: string | null;
  hasWebsiteData: boolean;
  dataRichness: DataRichness;
  specificityExpectation: string;
}

/**
 * Map revenue string to tier label
 */
export function mapRevenueTier(revenue?: string): RevenueTierLabel {
  if (!revenue) return 'getting organized';

  const lower = revenue.toLowerCase();

  if (lower.includes('under') || lower.includes('<') || lower.includes('less than')) {
    return 'getting organized';
  }
  if (lower.includes('500k') && lower.includes('1m') || lower === '$500k-$1m' || lower === '$500k to $1m') {
    return 'growing';
  }
  if (lower.includes('1m') && (lower.includes('3m') || lower.includes('2m'))) {
    return 'scaling';
  }
  if (lower.includes('3m') && lower.includes('5m')) {
    return 'systemizing';
  }
  if (lower.includes('5m') || lower.includes('10m') || lower.includes('over')) {
    return 'optimizing';
  }

  // Fallback: try to parse a number
  const numMatch = revenue.replace(/[^0-9.]/g, '');
  const num = parseFloat(numMatch);
  if (!isNaN(num)) {
    if (num < 500000) return 'getting organized';
    if (num < 1000000) return 'growing';
    if (num < 3000000) return 'scaling';
    if (num < 5000000) return 'systemizing';
    return 'optimizing';
  }

  return 'growing'; // safe default
}

/**
 * Parse free-text pain points into discrete items
 */
export function parsePainPoints(leadData: UnifiedLeadData): string[] {
  const sources: string[] = [];

  if (leadData.challenges) sources.push(leadData.challenges);
  if (leadData.painPoints) sources.push(leadData.painPoints);
  if (leadData.timeBottleneck) sources.push(leadData.timeBottleneck);
  if (leadData.supportNotes) sources.push(leadData.supportNotes);

  if (sources.length === 0) return [];

  const combined = sources.join('. ');

  // Split on common delimiters
  const items = combined
    .split(/[,;\n]|(?:\. )/)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  // Deduplicate
  const seen = new Set<string>();
  return items.filter(item => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Return an industry label only when we have a trustworthy source.
 *
 * Previously this function scanned pain-point text for keywords and mapped
 * matches to industry labels — e.g. "Marketing" in pain points became
 * "agency/marketing", which cascaded into fabricated agency-themed reports
 * for prospects who were not in marketing at all. The keyword map has been
 * removed.
 *
 * Trustworthy sources (in order):
 *   1. Explicit `businessType` field from the form
 *   2. Grounded industry from website research (set on the leadData before
 *      this function is called by the enrichment step)
 *
 * Pain points, revenue band, email domain, and role title are NOT industry
 * signals. If neither trustworthy source is populated, return null and let
 * downstream prompts fall back to industry-neutral language.
 */
export function inferIndustry(leadData: UnifiedLeadData): string | null {
  if (leadData.businessType) {
    return leadData.businessType;
  }

  if (leadData.companyAnalysis?.industry) {
    const industry = leadData.companyAnalysis.industry.trim();
    // Guard against placeholder strings the legacy scraper emitted
    if (industry && industry !== 'To be analyzed' && industry !== 'Unknown') {
      return industry;
    }
  }

  return null;
}

/**
 * Score data richness based on available information.
 *
 * "high" requires grounded industry knowledge — not just a successful
 * website fetch. The legacy regex scraper's analysisSuccess flag is true
 * whenever the page returns any HTML, but the industry field can still be
 * a placeholder ("To be analyzed" / "Unknown"). Letting those through as
 * "high" pushed the downstream prompt to demand "70% business-specific
 * context" while the industry was in fact unknown — which is exactly the
 * trap that produced the Jonathan Lewis agency hallucination.
 */
export function scoreDataRichness(leadData: UnifiedLeadData): DataRichness {
  const hasPainPoints = !!(leadData.challenges || leadData.painPoints || leadData.timeBottleneck);
  const hasBusinessType = !!leadData.businessType;
  const hasRevenue = !!leadData.revenue;

  const analysis = leadData.companyAnalysis;
  const industry = analysis?.industry?.trim();
  const hasGroundedIndustry =
    !!analysis &&
    analysis.analysisSuccess === true &&
    !!industry &&
    industry !== 'Unknown' &&
    industry !== 'To be analyzed';

  if (hasGroundedIndustry && hasPainPoints) return 'high';
  if (hasPainPoints && (hasBusinessType || hasRevenue)) return 'medium';
  if (hasPainPoints) return 'medium';
  return 'low';
}

/**
 * Extract domain from email (null for common providers)
 */
function extractBusinessDomain(email?: string): string | null {
  if (!email) return null;

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  const genericDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'me.com', 'mail.com',
    'protonmail.com', 'live.com', 'msn.com',
  ];

  if (genericDomains.includes(domain)) return null;

  return domain;
}

/**
 * Build structured lead brief from all available data
 */
export function buildLeadBrief(leadData: UnifiedLeadData): LeadBrief {
  const name = [leadData.firstName, leadData.lastName].filter(Boolean).join(' ') || 'Business Owner';
  const domain = extractBusinessDomain(leadData.email);
  const revenueTier = mapRevenueTier(leadData.revenue);
  const painPoints = parsePainPoints(leadData);
  const hasWebsiteData = !!leadData.companyAnalysis;
  const inferredIndustry = inferIndustry(leadData);
  const dataRichness = scoreDataRichness(leadData);

  // Set specificity expectations based on data richness
  let specificityExpectation: string;
  switch (dataRichness) {
    case 'high':
      specificityExpectation = 'Reference their specific industry, services, tools, and stated pain points by name. At least 70% of tasks should contain business-specific context.';
      break;
    case 'medium':
      specificityExpectation = 'Use their pain points and inferred industry to personalize. At least 50% of tasks should reference their specific situation.';
      break;
    case 'low':
      specificityExpectation = 'Use revenue-tier appropriate tasks calibrated to their stage. Focus on universal high-value delegation opportunities for their revenue level.';
      break;
  }

  return {
    name,
    email: leadData.email || '',
    domain,
    revenue: leadData.revenue || 'Unknown',
    revenueTier,
    painPoints,
    inferredIndustry,
    hasWebsiteData,
    dataRichness,
    specificityExpectation,
  };
}
