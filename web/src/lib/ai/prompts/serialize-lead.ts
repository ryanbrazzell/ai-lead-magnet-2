/**
 * Lead Data Serialization for AI Prompts
 *
 * Ported from: /tmp/ea-time-freedom-report/app/utils/unifiedPromptJSON.ts (lines 244-372)
 *
 * These functions convert UnifiedLeadData into a readable string format
 * for AI consumption and build the final prompt with context.
 */

import type { UnifiedLeadData } from '@/types';

/**
 * Structured logger for prompt building
 * In production, replace with actual logging implementation
 */
const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, context);
    }
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context);
    }
  },
};

/**
 * Serialize lead data into readable format for AI consumption
 *
 * Converts a UnifiedLeadData object into a human-readable string that
 * provides context for AI task generation. Includes:
 * - Personal information
 * - Business context
 * - Challenges and pain points
 * - Website analysis (if available)
 * - Engagement level calculation
 *
 * @param data - The unified lead data to serialize
 * @returns A formatted string containing all lead context
 */
export function serializeLeadData(data: UnifiedLeadData): string {
  const lines: string[] = [];

  // Personal information
  if (data.firstName || data.lastName) {
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    lines.push(`Founder's Name: ${fullName}`);
  }

  if (data.title) {
    lines.push(`Role: ${data.title}`);
  }

  if (data.email) {
    lines.push(`Email: ${data.email}`);
  }

  if (data.phoneNumber || data.phone) {
    const phone = data.phoneNumber || data.phone;
    lines.push(`Phone: ${phone}`);
  }

  // Business context
  if (data.website || data.companyWebsite) {
    const website = data.website || data.companyWebsite;
    lines.push(
      `Company Website: ${website} (please analyze this website to understand their business, industry, services, and target audience)`
    );
  }

  if (data.businessType) {
    lines.push(`Business Type: ${data.businessType}`);
  }

  if (data.revenue) {
    lines.push(`Revenue: ${data.revenue}`);
  }

  if (data.employeeCount || data.employees) {
    const employees = data.employeeCount || data.employees;
    lines.push(`Team Size: ${employees}`);
  }

  // Challenges and context
  if (data.challenges || data.painPoints) {
    const challenges = data.challenges || data.painPoints;
    lines.push(`Primary Challenges: ${challenges}`);
  }

  if (data.timeBottleneck) {
    lines.push(`Biggest Time Bottleneck: ${data.timeBottleneck}`);
  }

  if (data.supportNotes) {
    lines.push(`Additional Info/Context: ${data.supportNotes}`);
  }

  if (data.adminTimePerWeek) {
    lines.push(`Admin Time Per Week: ${data.adminTimePerWeek}`);
  }

  if (data.communicationPreference) {
    lines.push(`Communication Preference: ${data.communicationPreference}`);
  }

  if (data.instagram) {
    lines.push(`Instagram: ${data.instagram}`);
  }

  // Website content context (if available)
  if (data.companyAnalysis) {
    const analysis = data.companyAnalysis;
    lines.push(`\n--- COMPANY WEBSITE CONTENT ---`);
    lines.push(`Website URL: ${analysis.url}`);
    
    if (analysis.title) {
      lines.push(`Website Title: ${analysis.title}`);
    }
    
    if (analysis.description) {
      lines.push(`Website Description: ${analysis.description}`);
    }

    // Include raw website content for AI to analyze inline
    if (analysis.keyContent && analysis.keyContent.length > 0) {
      lines.push(`\n--- RAW WEBSITE CONTENT (analyze this to understand the business) ---`);
      // Limit content to avoid prompt being too long
      const content = analysis.keyContent[0];
      if (content) {
        lines.push(content.slice(0, 4000)); // Limit to 4000 chars
      }
      lines.push(`--- END WEBSITE CONTENT ---`);
      lines.push(`\nIMPORTANT: Use the website content above to understand this founder's specific business, industry, services, and target audience. Generate tasks that are highly relevant and personalized to their actual business operations.`);
    }
  }

  // Lead source context
  lines.push(`\n--- LEAD CONTEXT ---`);
  lines.push(`Lead Type: ${data.leadType}`);
  lines.push(`Timestamp: ${data.timestamp}`);

  // Add engagement level context based on form completion
  const fieldsProvided = Object.values(data).filter(
    (v) => v !== undefined && v !== null && v !== ''
  ).length;
  let engagementLevel = 'Low';
  if (fieldsProvided > 8) engagementLevel = 'High';
  else if (fieldsProvided > 5) engagementLevel = 'Medium';

  lines.push(
    `Engagement Level: ${engagementLevel} (${fieldsProvided} fields provided)`
  );

  // If no data available, provide fallback
  if (lines.length === 0) {
    lines.push('Founder Information: Limited information provided');
    lines.push('Business Context: General business optimization needed');
    lines.push('Lead Type: Standard form submission');
  }

  return lines.join('\n');
}

/**
 * Build JSON-output unified prompt for any lead type
 *
 * Legacy function used by fallback paths. Builds a Core Four prompt
 * from serialized lead data.
 *
 * @param leadData - The unified lead data to include in the prompt
 * @returns The complete prompt with lead context injected
 */
export function buildUnifiedPromptJSON(leadData: UnifiedLeadData): string {
  const serializedData = serializeLeadData(leadData);

  const prompt = `You are a professional Executive Assistant advisor. Generate personalized EA delegation tasks organized by Core Four areas.

===== FOUNDER CONTEXT =====
${serializedData}

===== YOUR TASK =====
Generate ~22-25 personalized tasks organized by Core Four area. All tasks are EA-delegatable.

Target counts:
- businessProcesses: 8-10 tasks (most personalized)
- personalLife: 5-6 tasks
- calendar: 4-5 tasks
- email: 3-4 tasks

Every task must include coreTaskType: emailManagement, calendarManagement, personalLifeManagement, or businessProcessManagement.

Task titles: Conversational, specific, use "your" and "you".
Descriptions: 2-3 sentences with specific actions.
NEVER use em-dashes. Use regular hyphens only.
Every task must be unique.

Output ONLY valid JSON:
{
  "tasks": {
    "businessProcesses": [{"title":"...","description":"...","category":"Operations","coreTaskType":"businessProcessManagement","owner":"EA","isEA":true}],
    "personalLife": [...],
    "calendar": [...],
    "email": [...]
  },
  "analysis_summary": "Brief paragraph about delegation opportunities",
  "total_task_count": 22
}`;

  log.info('Unified prompt built', {
    leadType: leadData.leadType,
    promptLength: prompt.length,
  });

  return prompt;
}
