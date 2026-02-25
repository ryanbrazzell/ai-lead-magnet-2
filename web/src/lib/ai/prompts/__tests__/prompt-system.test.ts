/**
 * Prompt System Tests
 *
 * Tests for the AI prompt system including:
 * - TIME_FREEDOM_PROMPT_JSON structure and content
 * - serializeLeadData conversion
 * - buildUnifiedPromptJSON placeholder replacement
 * - Engagement level calculation
 */

import { describe, it, expect } from 'vitest';
import { TIME_FREEDOM_PROMPT_JSON } from '../time-freedom-prompt';
import {
  serializeLeadData,
  buildUnifiedPromptJSON,
} from '../serialize-lead';
import type { UnifiedLeadData } from '@/types';

describe('Prompt System', () => {
  describe('TIME_FREEDOM_PROMPT_JSON', () => {
    it('contains required sections and coreTaskType classification', () => {
      expect(TIME_FREEDOM_PROMPT_JSON).toBeDefined();
      expect(typeof TIME_FREEDOM_PROMPT_JSON).toBe('string');

      // Core structure sections
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('You are a professional Executive Assistant');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('{LEAD_CONTEXT}');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('YOUR TASK');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('TASK GUIDELINES');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('PERSONALIZATION');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('TASK FORMAT');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('OUTPUT JSON');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('REQUIREMENTS');

      // Task count requirements preserved
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('Exactly 24 tasks total');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('8 daily, 8 weekly, 8 monthly');

      // Phase 4: coreTaskType classification
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('CORE TASK CLASSIFICATION');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('coreTaskType');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('emailManagement');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('calendarManagement');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('personalLifeManagement');
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('businessProcessManagement');

      // Phase 4: richer descriptions
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('2-3 sentences');

      // Must NOT contain isCoreEATask (per research decision)
      expect(TIME_FREEDOM_PROMPT_JSON).not.toContain('isCoreEATask');

      // Output must be valid JSON only
      expect(TIME_FREEDOM_PROMPT_JSON).toContain('Output ONLY valid JSON, no other text');

      // Line count sanity check (prompt is ~100-150 lines after Phase 4)
      const lineCount = TIME_FREEDOM_PROMPT_JSON.split('\n').length;
      expect(lineCount).toBeGreaterThanOrEqual(90);
      expect(lineCount).toBeLessThanOrEqual(160);
    });
  });

  describe('serializeLeadData', () => {
    it('converts UnifiedLeadData to readable string format', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        title: 'CEO',
        website: 'https://example.com',
        businessType: 'SaaS',
        revenue: '$1M-$5M',
        employeeCount: '10-20',
        challenges: 'Email overload, scheduling conflicts',
        timeBottleneck: 'Administrative tasks',
        adminTimePerWeek: '20+ hours',
        communicationPreference: 'Email',
      };

      const serialized = serializeLeadData(leadData);

      // Verify personal info
      expect(serialized).toContain("Founder's Name: John Smith");
      expect(serialized).toContain('Role: CEO');
      expect(serialized).toContain('Email: john@example.com');

      // Verify business context
      expect(serialized).toContain('Company Website: https://example.com');
      expect(serialized).toContain('Business Type: SaaS');
      expect(serialized).toContain('Revenue: $1M-$5M');
      expect(serialized).toContain('Team Size: 10-20');

      // Verify challenges
      expect(serialized).toContain(
        'Primary Challenges: Email overload, scheduling conflicts'
      );
      expect(serialized).toContain(
        'Biggest Time Bottleneck: Administrative tasks'
      );
      expect(serialized).toContain('Admin Time Per Week: 20+ hours');

      // Verify lead context section
      expect(serialized).toContain('--- LEAD CONTEXT ---');
      expect(serialized).toContain('Lead Type: main');
    });

    it('includes website analysis context when available', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'Jane',
        companyAnalysis: {
          url: 'https://techstartup.com',
          normalizedUrl: 'https://techstartup.com',
          title: 'TechStartup Inc',
          description: 'Leading tech solutions provider',
          businessType: 'Technology',
          industry: 'Software',
          services: ['Consulting', 'Development', 'Support'],
          teamSizeEstimate: '50-100',
          keyContent: ['innovation', 'growth'],
          analysisSuccess: true,
          processingTime: 1200,
        },
      };

      const serialized = serializeLeadData(leadData);

      expect(serialized).toContain('--- COMPANY WEBSITE CONTENT ---');
      expect(serialized).toContain('Website URL: https://techstartup.com');
      expect(serialized).toContain('Website Title: TechStartup Inc');
      expect(serialized).toContain(
        'Website Description: Leading tech solutions provider'
      );
      expect(serialized).toContain('RAW WEBSITE CONTENT');
      expect(serialized).toContain('innovation');
      expect(serialized).toContain('END WEBSITE CONTENT');
    });
  });

  describe('buildUnifiedPromptJSON', () => {
    it('replaces {LEAD_CONTEXT} placeholder with serialized lead data', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'Alex',
        lastName: 'Johnson',
        businessType: 'Consulting',
        challenges: 'Time management',
      };

      const prompt = buildUnifiedPromptJSON(leadData);

      // Verify placeholder was replaced (should NOT contain the placeholder)
      expect(prompt).not.toContain('{LEAD_CONTEXT}');

      // Verify the lead data is now in the prompt
      expect(prompt).toContain("Founder's Name: Alex Johnson");
      expect(prompt).toContain('Business Type: Consulting');
      expect(prompt).toContain('Primary Challenges: Time management');

      // Verify prompt structure is still intact
      expect(prompt).toContain('You are a professional Executive Assistant');
      expect(prompt).toContain('OUTPUT JSON');
    });
  });

  describe('Engagement Level Calculation', () => {
    it('calculates High engagement for leads with more than 8 fields', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        phone: '555-1234',
        title: 'CEO',
        website: 'https://example.com',
        businessType: 'SaaS',
        revenue: '$1M-$5M',
        employeeCount: '10-20',
        challenges: 'Time management',
      };

      const serialized = serializeLeadData(leadData);
      expect(serialized).toContain('Engagement Level: High');
    });

    it('calculates Medium engagement for leads with 6-8 fields', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'standard',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'Jane',
        email: 'jane@example.com',
        businessType: 'Consulting',
        challenges: 'Email overload',
        website: 'https://example.com',
      };

      const serialized = serializeLeadData(leadData);
      expect(serialized).toContain('Engagement Level: Medium');
    });

    it('calculates Low engagement for leads with 5 or fewer fields', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'simple',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'Bob',
        email: 'bob@example.com',
      };

      const serialized = serializeLeadData(leadData);
      expect(serialized).toContain('Engagement Level: Low');
    });
  });
});
