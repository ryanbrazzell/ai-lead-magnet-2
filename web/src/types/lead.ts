/**
 * Lead Data Types for AI Task Generation Service
 *
 * Ported from: /tmp/ea-time-freedom-report/app/types/index.ts
 * These interfaces define the structure of lead data used for task generation.
 */

/**
 * Website analysis data from company website scraping
 */
export interface WebsiteAnalysis {
  url: string;
  normalizedUrl: string;
  title: string;
  description: string;
  businessType: string;
  industry: string;
  services: string[];
  teamSizeEstimate: string;
  keyContent: string[];
  analysisSuccess: boolean;
  processingTime: number;
  error?: string;
  confidence?: number;
}

/**
 * Unified lead data interface for AI task generation
 *
 * This interface consolidates data from all lead form types:
 * - 'main': Two-step detailed form
 * - 'standard': Detailed business info form
 * - 'simple': Pre-selected options form
 */
export interface UnifiedLeadData {
  // Required metadata
  leadType: 'main' | 'standard' | 'simple';
  timestamp: string;

  // Personal information (optional based on form type)
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  title?: string;

  // Business context
  website?: string;
  companyWebsite?: string;
  businessType?: string;
  revenue?: string;
  employeeCount?: string;
  employees?: string; // Alternative field name from form

  // Challenges and context
  challenges?: string;
  painPoints?: string; // Alternative field name from form
  timeBottleneck?: string;
  supportNotes?: string;
  adminTimePerWeek?: string;

  // Preferences
  communicationPreference?: 'Call/Text' | 'Email' | 'Both';
  instagram?: string;

  // Enhanced context from website analysis
  companyAnalysis?: WebsiteAnalysis;

  // Delivery preferences (computed)
  preferredDeliveryMethod?: 'email' | 'sms' | 'imessage';
}
