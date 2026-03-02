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
 * Industry signal keywords mapped to inferred industries
 */
const INDUSTRY_SIGNALS: Record<string, string[]> = {
  'healthcare/medical': ['patient', 'clinic', 'medical', 'health', 'therapy', 'dental', 'doctor', 'nurse', 'practice'],
  'legal': ['attorney', 'legal', 'law firm', 'lawyer', 'litigation', 'paralegal', 'case'],
  'real estate': ['property', 'real estate', 'listing', 'broker', 'agent', 'mls', 'showing', 'escrow'],
  'e-commerce': ['shopify', 'ecommerce', 'e-commerce', 'online store', 'product listing', 'inventory', 'shipping'],
  'SaaS/tech': ['saas', 'software', 'app', 'platform', 'api', 'developer', 'tech', 'startup', 'onboarding'],
  'agency/marketing': ['agency', 'marketing', 'campaign', 'creative', 'client work', 'retainer', 'ads'],
  'coaching/consulting': ['coaching', 'consulting', 'client', 'session', 'workshop', 'course', 'program', 'certification'],
  'financial services': ['financial', 'accounting', 'bookkeeping', 'tax', 'insurance', 'investment', 'advisor', 'portfolio'],
  'construction/trades': ['contractor', 'construction', 'plumbing', 'electrical', 'hvac', 'landscaping', 'roofing', 'subcontractor', 'bid'],
  'professional services': ['firm', 'engagement', 'proposal', 'deliverable', 'scope', 'retainer'],
  'fitness/wellness': ['gym', 'fitness', 'personal training', 'nutrition', 'wellness', 'class'],
  'food/restaurant': ['restaurant', 'menu', 'catering', 'food', 'chef', 'kitchen'],
};

/**
 * Infer industry from pain points and business type when no website data exists
 */
export function inferIndustry(leadData: UnifiedLeadData): string | null {
  // If we have business type, that's the best signal
  if (leadData.businessType) {
    return leadData.businessType;
  }

  // Check pain points and other text fields for industry signals
  const textFields = [
    leadData.challenges,
    leadData.painPoints,
    leadData.timeBottleneck,
    leadData.supportNotes,
  ].filter(Boolean).join(' ').toLowerCase();

  if (!textFields) return null;

  let bestMatch: string | null = null;
  let bestCount = 0;

  for (const [industry, keywords] of Object.entries(INDUSTRY_SIGNALS)) {
    const count = keywords.filter(kw => textFields.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestMatch = industry;
    }
  }

  return bestMatch;
}

/**
 * Score data richness based on available information
 */
export function scoreDataRichness(leadData: UnifiedLeadData): DataRichness {
  const hasWebsite = !!leadData.companyAnalysis;
  const hasPainPoints = !!(leadData.challenges || leadData.painPoints || leadData.timeBottleneck);
  const hasBusinessType = !!leadData.businessType;
  const hasRevenue = !!leadData.revenue;

  if (hasWebsite && hasPainPoints) return 'high';
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
