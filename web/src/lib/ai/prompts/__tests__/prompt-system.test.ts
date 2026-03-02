/**
 * Prompt System Tests
 *
 * Tests for the AI prompt system including:
 * - serializeLeadData conversion
 * - buildUnifiedPromptJSON structure
 * - buildBusinessAnalysisPrompt structure
 * - Engagement level calculation
 */

import { describe, it, expect } from 'vitest';
import {
  serializeLeadData,
  buildUnifiedPromptJSON,
} from '../serialize-lead';
import { buildBusinessAnalysisPrompt } from '../business-analysis-prompt';
import { buildCoreFourGenerationPrompt } from '../core-four-generation-prompt';
import { buildLeadBrief } from '../../lead-brief';
import type { UnifiedLeadData, BusinessAnalysisBrief } from '@/types';

describe('Prompt System', () => {
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

      expect(serialized).toContain("Founder's Name: John Smith");
      expect(serialized).toContain('Role: CEO');
      expect(serialized).toContain('Email: john@example.com');
      expect(serialized).toContain('Company Website: https://example.com');
      expect(serialized).toContain('Business Type: SaaS');
      expect(serialized).toContain('Revenue: $1M-$5M');
      expect(serialized).toContain('Team Size: 10-20');
      expect(serialized).toContain('Primary Challenges: Email overload, scheduling conflicts');
      expect(serialized).toContain('Biggest Time Bottleneck: Administrative tasks');
      expect(serialized).toContain('--- LEAD CONTEXT ---');
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
          services: ['Consulting', 'Development'],
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
    });
  });

  describe('buildUnifiedPromptJSON', () => {
    it('builds a Core Four prompt with serialized lead data', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'Alex',
        lastName: 'Johnson',
        businessType: 'Consulting',
        challenges: 'Time management',
      };

      const prompt = buildUnifiedPromptJSON(leadData);

      expect(prompt).toContain("Founder's Name: Alex Johnson");
      expect(prompt).toContain('Business Type: Consulting');
      expect(prompt).toContain('You are a professional Executive Assistant');
      expect(prompt).toContain('businessProcesses');
      expect(prompt).toContain('personalLife');
      expect(prompt).toContain('calendar');
      expect(prompt).toContain('email');
    });
  });

  describe('buildBusinessAnalysisPrompt', () => {
    it('builds analysis prompt with lead brief context', () => {
      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'Sarah',
        lastName: 'Chen',
        businessType: 'Digital Marketing Agency',
        revenue: '$1M-$3M',
        challenges: 'Client follow-ups taking too much time',
      };

      const brief = buildLeadBrief(leadData);
      const prompt = buildBusinessAnalysisPrompt(leadData, brief);

      expect(prompt).toContain('Sarah Chen');
      expect(prompt).toContain('scaling');
      expect(prompt).toContain('RECURRING BUSINESS PROCESSES');
      expect(prompt).toContain('PAIN POINT DECOMPOSITION');
      expect(prompt).toContain('business_description');
    });
  });

  describe('buildCoreFourGenerationPrompt', () => {
    it('builds generation prompt with analysis brief', () => {
      const analysisBrief: BusinessAnalysisBrief = {
        business_description: 'A digital marketing agency serving e-commerce brands.',
        recurring_processes: ['Client reporting', 'Campaign setup', 'Invoice processing'],
        calendar_patterns: ['Client review calls', 'Team standups'],
        personal_life_opportunities: ['Travel booking', 'Family scheduling'],
        pain_point_decomposition: ['Follow-ups -> missed deadlines', 'Follow-ups -> client churn risk'],
        revenue_tier_context: 'Scaling stage - needs process documentation',
      };

      const leadData: UnifiedLeadData = {
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',
        firstName: 'Sarah',
        revenue: '$1M-$3M',
        challenges: 'Client follow-ups',
      };

      const brief = buildLeadBrief(leadData);
      const prompt = buildCoreFourGenerationPrompt(analysisBrief, brief);

      expect(prompt).toContain('digital marketing agency');
      expect(prompt).toContain('Client reporting');
      expect(prompt).toContain('businessProcesses');
      expect(prompt).toContain('ANTI-PATTERN BAN LIST');
      expect(prompt).toContain('FEW-SHOT EXAMPLES');
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
