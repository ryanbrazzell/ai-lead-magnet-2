/**
 * Tests for TypeScript interfaces (Task Group 1)
 *
 * These tests verify that the interfaces correctly define the expected
 * data structures for the AI Task Generation Service.
 */
import { describe, it, expect } from 'vitest';
import type {
  UnifiedLeadData,
  Task,
  TaskGenerationResult,
  ValidationResult,
  ReportAnalysis,
} from '../index';

describe('TypeScript Interfaces', () => {
  /**
   * Test 1: UnifiedLeadData interface accepts all required and optional fields
   */
  describe('UnifiedLeadData interface', () => {
    it('accepts all required and optional fields', () => {
      const leadData: UnifiedLeadData = {
        // Required fields
        leadType: 'main',
        timestamp: '2024-01-15T10:30:00Z',

        // Optional personal info
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        title: 'CEO',

        // Optional business context
        website: 'https://example.com',
        companyWebsite: 'https://company.com',
        businessType: 'SaaS',
        revenue: '$1M-$5M',
        employeeCount: '10-50',

        // Optional challenges
        challenges: 'Time management',
        timeBottleneck: 'Email overload',
        supportNotes: 'Looking for help with admin tasks',
        adminTimePerWeek: '20+ hours',

        // Optional preferences
        communicationPreference: 'Email',
        instagram: '@johndoe',

        // Optional analysis
        companyAnalysis: {
          url: 'https://example.com',
          normalizedUrl: 'example.com',
          title: 'Example Company',
          description: 'A tech company',
          businessType: 'Technology',
          industry: 'Software',
          services: ['Consulting', 'Development'],
          teamSizeEstimate: '10-50',
          keyContent: ['SaaS', 'Enterprise'],
          analysisSuccess: true,
          processingTime: 1500,
        },
      };

      // Verify required fields
      expect(leadData.leadType).toBe('main');
      expect(leadData.timestamp).toBeDefined();

      // Verify optional fields exist
      expect(leadData.firstName).toBe('John');
      expect(leadData.email).toBe('john@example.com');
      expect(leadData.website).toBe('https://example.com');
      expect(leadData.challenges).toBe('Time management');
      expect(leadData.companyAnalysis?.analysisSuccess).toBe(true);
    });

    it('accepts minimal required fields only', () => {
      const minimalLead: UnifiedLeadData = {
        leadType: 'simple',
        timestamp: '2024-01-15T10:30:00Z',
      };

      expect(minimalLead.leadType).toBe('simple');
      expect(minimalLead.firstName).toBeUndefined();
    });

    it('validates leadType union type', () => {
      const mainLead: UnifiedLeadData = { leadType: 'main', timestamp: '2024-01-15' };
      const standardLead: UnifiedLeadData = { leadType: 'standard', timestamp: '2024-01-15' };
      const simpleLead: UnifiedLeadData = { leadType: 'simple', timestamp: '2024-01-15' };

      expect(['main', 'standard', 'simple']).toContain(mainLead.leadType);
      expect(['main', 'standard', 'simple']).toContain(standardLead.leadType);
      expect(['main', 'standard', 'simple']).toContain(simpleLead.leadType);
    });
  });

  /**
   * Test 2: Task interface validates owner as "EA" | "You"
   */
  describe('Task interface', () => {
    it('validates owner as "EA" | "You"', () => {
      const eaTask: Task = {
        title: 'Email Management',
        description: 'Managing inbox and responding to routine emails',
        owner: 'EA',
        isEA: true,
        category: 'Communication',
      };

      const founderTask: Task = {
        title: 'Strategic Planning',
        description: 'Planning quarterly business objectives and goals',
        owner: 'You',
        isEA: false,
        category: 'Strategy',
      };

      expect(eaTask.owner).toBe('EA');
      expect(eaTask.isEA).toBe(true);
      expect(founderTask.owner).toBe('You');
      expect(founderTask.isEA).toBe(false);
    });

    it('accepts optional fields', () => {
      const taskWithOptionals: Task = {
        title: 'Calendar Management',
        description: 'Scheduling and managing appointments',
        owner: 'EA',
        isEA: true,
        category: 'Scheduling',
        frequency: 'daily',
        priority: 'high',
        isCoreEATask: true,
        coreTaskType: 'calendarManagement',
      };

      expect(taskWithOptionals.frequency).toBe('daily');
      expect(taskWithOptionals.priority).toBe('high');
      expect(taskWithOptionals.isCoreEATask).toBe(true);
      expect(taskWithOptionals.coreTaskType).toBe('calendarManagement');
    });
  });

  /**
   * Test 3: TaskGenerationResult validates 30 total tasks structure
   */
  describe('TaskGenerationResult interface', () => {
    it('validates 30 total tasks structure', () => {
      // Create 10 tasks for each frequency
      const createTasks = (count: number): Task[] =>
        Array.from({ length: count }, (_, i) => ({
          title: `Task ${i + 1}`,
          description: 'A detailed description of the task that is at least 20 words long to meet requirements.',
          owner: i % 2 === 0 ? 'EA' : 'You' as const,
          isEA: i % 2 === 0,
          category: 'General',
        }));

      const result: TaskGenerationResult = {
        tasks: {
          daily: createTasks(10),
          weekly: createTasks(10),
          monthly: createTasks(10),
        },
        ea_task_percent: 50,
        ea_task_count: 15,
        total_task_count: 30,
        summary: 'Based on what I can see, around 50 percent of these tasks could be in the hands of your EA.',
      };

      // Verify structure
      expect(result.tasks.daily).toHaveLength(10);
      expect(result.tasks.weekly).toHaveLength(10);
      expect(result.tasks.monthly).toHaveLength(10);
      expect(result.total_task_count).toBe(30);

      // Verify EA metrics
      expect(result.ea_task_percent).toBe(50);
      expect(result.ea_task_count).toBe(15);
      expect(typeof result.ea_task_percent).toBe('number');
      expect(Number.isInteger(result.ea_task_percent)).toBe(true); // Must be whole number

      // Verify summary
      expect(result.summary).toContain('50 percent');
    });
  });

  /**
   * Test 4: ValidationResult interface with isValid, errors[], warnings[]
   */
  describe('ValidationResult interface', () => {
    it('contains isValid, errors[], and warnings[]', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);
      expect(validResult.warnings).toEqual([]);
    });

    it('handles errors and warnings', () => {
      const invalidResult: ValidationResult = {
        isValid: false,
        errors: [
          'EA percentage too low: 35% (minimum 40%)',
          'Missing core EA task: Email Management',
        ],
        warnings: [
          'Expected 10 daily tasks, got 9',
          'Task 5: Description too short',
        ],
      };

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(2);
      expect(invalidResult.warnings).toHaveLength(2);
      expect(invalidResult.errors[0]).toContain('EA percentage');
      expect(invalidResult.warnings[0]).toContain('daily tasks');
    });
  });

  /**
   * Bonus: ReportAnalysis interface structure
   */
  describe('ReportAnalysis interface', () => {
    it('contains all required analysis fields', () => {
      const analysis: ReportAnalysis = {
        totalTasks: 30,
        dailyTasks: 10,
        weeklyTasks: 10,
        monthlyTasks: 10,
        eaTasks: 15,
        founderTasks: 15,
        eaPercentage: 50,
        coreTasksPresent: {
          emailManagement: true,
          calendarManagement: true,
          personalLifeManagement: true,
          businessProcessManagement: false,
        },
      };

      expect(analysis.totalTasks).toBe(30);
      expect(analysis.dailyTasks).toBe(10);
      expect(analysis.weeklyTasks).toBe(10);
      expect(analysis.monthlyTasks).toBe(10);
      expect(analysis.eaTasks).toBe(15);
      expect(analysis.founderTasks).toBe(15);
      expect(analysis.eaPercentage).toBe(50);
      expect(analysis.coreTasksPresent.emailManagement).toBe(true);
      expect(analysis.coreTasksPresent.businessProcessManagement).toBe(false);
    });
  });
});
