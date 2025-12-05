/**
 * Website Analyzer Service
 * 
 * Extracts domain from email and analyzes the website content
 * to provide business context for AI task generation.
 */

import type { WebsiteAnalysis } from '@/types';

/**
 * Extract domain from an email address
 * @param email - Email address to extract domain from
 * @returns Domain string or null if invalid
 */
export function extractDomainFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) {
    return null;
  }

  const domain = email.split('@')[1]?.toLowerCase();
  
  // Skip common free email providers
  const freeEmailProviders = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'outlook.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'zoho.com',
    'yandex.com',
    'live.com',
    'msn.com',
    'me.com',
    'mac.com',
  ];

  if (!domain || freeEmailProviders.includes(domain)) {
    return null;
  }

  return domain;
}

/**
 * Fetch website content for inclusion in task generation prompt
 * This is a lightweight scrape - no AI analysis, just content extraction
 * The task generation AI will analyze the content inline
 * 
 * @param domain - Domain to scrape (e.g., "example.com")
 * @returns WebsiteAnalysis object with raw content (no AI analysis)
 */
export async function scrapeWebsiteContent(domain: string): Promise<WebsiteAnalysis> {
  const startTime = Date.now();
  const url = `https://${domain}`;
  
  try {
    console.log(`[WebsiteAnalyzer] Fetching ${url}...`);
    
    // Fetch the website HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EAReportBot/1.0; +https://example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract key content from HTML
    const extractedContent = extractContentFromHTML(html, url);
    
    const processingTime = Date.now() - startTime;
    console.log(`[WebsiteAnalyzer] Scraped ${extractedContent.length} chars in ${processingTime}ms`);
    
    // Extract basic info without AI
    const basicInfo = extractBasicInfo(extractedContent, domain);
    
    return {
      url,
      normalizedUrl: url,
      title: basicInfo.title || domain,
      description: basicInfo.description || '',
      businessType: 'To be analyzed', // Will be analyzed by task generation AI
      industry: 'To be analyzed',
      services: [],
      teamSizeEstimate: 'Unknown',
      keyContent: [extractedContent], // Store raw content for prompt injection
      analysisSuccess: true,
      processingTime,
      confidence: 0.8,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[WebsiteAnalyzer] Error scraping ${url}:`, errorMessage);
    
    return {
      url,
      normalizedUrl: url,
      title: '',
      description: '',
      businessType: 'Unknown',
      industry: 'Unknown',
      services: [],
      teamSizeEstimate: 'Unknown',
      keyContent: [],
      analysisSuccess: false,
      processingTime: Date.now() - startTime,
      error: errorMessage,
      confidence: 0,
    };
  }
}

/**
 * @deprecated Use scrapeWebsiteContent instead for faster processing
 * Fetch and analyze a website to extract business information
 * Uses Claude to analyze the scraped content
 * 
 * @param domain - Domain to analyze (e.g., "example.com")
 * @returns WebsiteAnalysis object with extracted information
 */
export async function analyzeWebsite(domain: string): Promise<WebsiteAnalysis> {
  // Now just calls the lightweight scraper
  return scrapeWebsiteContent(domain);
}

/**
 * Extract relevant content from HTML
 * Strips scripts, styles, and extracts text from key elements
 */
function extractContentFromHTML(html: string, url: string): string {
  // Remove scripts, styles, and comments
  let content = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');

  // Extract title
  const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const metaDescMatch = content.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

  // Extract headings
  const headings: string[] = [];
  const headingMatches = content.matchAll(/<h[1-3][^>]*>([^<]*)<\/h[1-3]>/gi);
  for (const match of headingMatches) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text && text.length > 3) {
      headings.push(text);
    }
  }

  // Extract paragraph text (first 10 paragraphs)
  const paragraphs: string[] = [];
  const pMatches = content.matchAll(/<p[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/p>/gi);
  let pCount = 0;
  for (const match of pMatches) {
    if (pCount >= 10) break;
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text && text.length > 20) {
      paragraphs.push(text);
      pCount++;
    }
  }

  // Build structured content
  const parts = [
    `URL: ${url}`,
    `Title: ${title}`,
    `Description: ${metaDesc}`,
    `\nHeadings:\n${headings.slice(0, 10).join('\n')}`,
    `\nContent:\n${paragraphs.join('\n\n')}`,
  ];

  // Limit total content length
  const fullContent = parts.join('\n');
  return fullContent.slice(0, 8000);
}

/**
 * Use Claude to analyze website content and extract business information
 */
async function analyzeContentWithAI(content: string, domain: string): Promise<Partial<WebsiteAnalysis>> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[WebsiteAnalyzer] No API key, returning basic analysis');
    return extractBasicInfo(content, domain);
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Analyze this website content and extract business information. Return a JSON object with these exact fields:

{
  "title": "Company/website name",
  "description": "One sentence description of what the business does",
  "businessType": "Type of business (e.g., Consulting, SaaS, Agency, E-commerce, Professional Services)",
  "industry": "Industry sector (e.g., Technology, Healthcare, Finance, Marketing, Real Estate)",
  "services": ["List of main services or products offered (max 5)"],
  "teamSizeEstimate": "Estimated team size based on content (Solo, Small (2-10), Medium (11-50), Large (50+), Unknown)",
  "confidence": 0.0 to 1.0 confidence score
}

Website content:
${content}

Return ONLY valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content[0];
    if (textBlock.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Clean and parse JSON
    let jsonStr = textBlock.text.trim();
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\s*/g, '');
    }

    const analysis = JSON.parse(jsonStr);
    
    return {
      title: analysis.title || '',
      description: analysis.description || '',
      businessType: analysis.businessType || 'Unknown',
      industry: analysis.industry || 'Unknown',
      services: Array.isArray(analysis.services) ? analysis.services : [],
      teamSizeEstimate: analysis.teamSizeEstimate || 'Unknown',
      keyContent: [],
      confidence: analysis.confidence || 0.5,
    };
  } catch (error) {
    console.error('[WebsiteAnalyzer] AI analysis failed:', error);
    return extractBasicInfo(content, domain);
  }
}

/**
 * Extract basic info from content without AI (fallback)
 */
function extractBasicInfo(content: string, domain: string): Partial<WebsiteAnalysis> {
  const titleMatch = content.match(/Title: ([^\n]*)/);
  const descMatch = content.match(/Description: ([^\n]*)/);
  
  return {
    title: titleMatch?.[1] || domain,
    description: descMatch?.[1] || '',
    businessType: 'Unknown',
    industry: 'Unknown',
    services: [],
    teamSizeEstimate: 'Unknown',
    keyContent: [],
    confidence: 0.2,
  };
}

