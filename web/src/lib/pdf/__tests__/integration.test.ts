/**
 * PDF Generation Integration Tests
 *
 * Strategic tests to cover critical end-to-end workflows and edge cases
 * for the PDF Generation Service.
 *
 * Task Group 6.3 - Up to 6 additional strategic tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePDF } from '../generator';
import { generateSafeFilename } from '../s3Service';
import type { TaskGenerationResult, Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';

// Helper to create test task
const createTestTask = (
  index: number,
  frequency: 'daily' | 'weekly' | 'monthly',
  isEA: boolean,
  options: Partial<Task> = {}
): Task => ({
  title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Task ${index + 1}`,
  description: `This is a ${frequency} task description for testing purposes.`,
  owner: isEA ? 'EA' : 'You',
  isEA,
  category: isEA ? 'Administration' : 'Strategy',
  frequency,
  ...options,
});

// Helper to create full report with 30 tasks
const createFullReport = (eaPercent: number = 50): TaskGenerationResult => {
  const dailyTasks: Task[] = Array(10)
    .fill(null)
    .map((_, i) => createTestTask(i, 'daily', i < 5));

  const weeklyTasks: Task[] = Array(10)
    .fill(null)
    .map((_, i) => createTestTask(i, 'weekly', i < 5));

  const monthlyTasks: Task[] = Array(10)
    .fill(null)
    .map((_, i) => createTestTask(i, 'monthly', i < 5));

  return {
    tasks: {
      daily: dailyTasks,
      weekly: weeklyTasks,
      monthly: monthlyTasks,
    },
    ea_task_percent: eaPercent,
    ea_task_count: 15,
    total_task_count: 30,
    summary: `Based on our analysis, ${eaPercent}% of your tasks can be delegated to an EA.`,
  };
};

// Helper to create full lead data
const createFullLeadData = (
  overrides: Partial<UnifiedLeadData> = {}
): UnifiedLeadData => ({
  leadType: 'main',
  timestamp: new Date().toISOString(),
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  title: 'CEO',
  businessType: 'Technology Consulting',
  website: 'https://example.com',
  challenges: 'Time management and delegation',
  ...overrides,
});

describe('PDF Generation Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Test 1: Full PDF generation flow (end-to-end)
   *
   * Verifies the complete PDF generation workflow from input to output,
   * ensuring all components work together correctly.
   */
  it('generates complete PDF through full workflow', async () => {
    const report = createFullReport(55);
    const leadData = createFullLeadData();

    const result = await generatePDF(report, leadData);

    // Verify success
    expect(result.success).toBe(true);

    // Verify all output fields are present
    expect(result.buffer).toBeDefined();
    expect(result.base64).toBeDefined();
    expect(result.filename).toBeDefined();
    expect(result.size).toBeDefined();
    expect(result.error).toBeUndefined();

    // Verify buffer is valid PDF (starts with %PDF)
    const pdfHeader = result.buffer!.slice(0, 4).toString('ascii');
    expect(pdfHeader).toBe('%PDF');

    // Verify base64 decodes to same content
    const decodedBuffer = Buffer.from(result.base64!, 'base64');
    expect(decodedBuffer.length).toBe(result.buffer!.length);

    // Verify filename format
    expect(result.filename).toMatch(
      /^EA_Time_Freedom_Report_John_Doe_\d{4}-\d{2}-\d{2}\.pdf$/
    );

    // Verify size is reasonable for a multi-page PDF (at least 5KB)
    expect(result.size).toBeGreaterThan(5000);
  });

  /**
   * Test 2: Edge case - very long task descriptions
   *
   * Ensures PDF generation handles tasks with extremely long descriptions
   * that require text wrapping across multiple lines.
   */
  it('handles very long task descriptions without errors', async () => {
    // Create a task with an extremely long description (500+ characters)
    const longDescription =
      'This is an extremely long task description that tests the PDF text wrapping functionality. ' +
      'It contains multiple sentences to ensure proper line breaks and pagination. ' +
      'The description goes on and on, including details about email management, calendar scheduling, ' +
      'travel arrangements, expense reports, meeting preparation, document formatting, ' +
      'client communication, vendor coordination, project tracking, and various administrative duties. ' +
      'This extended text should be properly wrapped within the PDF without causing any layout issues or errors.';

    const report = createFullReport();
    // Replace first task with long description
    report.tasks.daily[0] = createTestTask(0, 'daily', true, {
      title: 'Complex Task with Extended Description',
      description: longDescription,
    });

    const leadData = createFullLeadData();
    const result = await generatePDF(report, leadData);

    expect(result.success).toBe(true);
    expect(result.buffer).toBeDefined();
    // PDF should be larger due to more text content
    expect(result.size).toBeGreaterThan(5000);
  });

  /**
   * Test 3: Edge case - special characters in lead names
   *
   * Ensures filename sanitization works correctly for names with
   * special characters, international characters, or unusual formatting.
   */
  it('handles special characters in lead names correctly', async () => {
    // Test various special character scenarios
    const testCases = [
      { firstName: "O'Connor", lastName: "McDonnell-Smith", expected: /O_Connor.*McDonnell-Smith/ },
      { firstName: 'Jean-Pierre', lastName: 'Du Pont', expected: /Jean-Pierre.*Du_Pont/ },
      { firstName: '  Leading', lastName: 'Trailing  ', expected: /Leading.*Trailing/ },
      { firstName: 'Name@#$%', lastName: '&*()Test', expected: /Name.*Test/ },
      { firstName: '', lastName: '', expected: /Report/ },
    ];

    for (const testCase of testCases) {
      const filename = generateSafeFilename(testCase.firstName, testCase.lastName);

      // Verify filename follows expected pattern
      expect(filename).toMatch(/^EA_Time_Freedom_Report_/);
      expect(filename).toMatch(/\.pdf$/);
      expect(filename).toMatch(testCase.expected);

      // Verify no problematic characters remain
      expect(filename).not.toMatch(/[@#$%&*()]/);
      expect(filename).not.toMatch(/\s{2,}/); // No double spaces
    }

    // Also test PDF generation with special character names
    const report = createFullReport();
    const leadData = createFullLeadData({
      firstName: "María-José",
      lastName: "O'Brien-García",
    });

    const result = await generatePDF(report, leadData);
    expect(result.success).toBe(true);
    expect(result.filename).toContain('Mar');
  });

  /**
   * Test 4: Performance test - PDF generation under 5 seconds
   *
   * Ensures PDF generation completes within acceptable time limits
   * for a standard 30-task report.
   */
  it('generates PDF within 5 seconds for standard report', async () => {
    vi.useRealTimers(); // Use real timers for performance measurement

    const report = createFullReport();
    const leadData = createFullLeadData();

    const startTime = Date.now();
    const result = await generatePDF(report, leadData);
    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);
    // PDF generation should complete in under 5 seconds
    expect(duration).toBeLessThan(5000);

    // Log actual duration for reference
    console.log(`PDF generation completed in ${duration}ms`);
  });

  /**
   * Test 5: Visual validation - PDF structure verification
   *
   * Verifies the generated PDF contains expected structural elements
   * by checking the raw PDF content for key markers.
   */
  it('generates PDF with correct structural elements', async () => {
    const report = createFullReport(55);
    const leadData = createFullLeadData();

    const result = await generatePDF(report, leadData);
    expect(result.success).toBe(true);

    // Convert PDF to string for content inspection
    const pdfContent = result.buffer!.toString('latin1');

    // Verify PDF structure markers
    expect(pdfContent).toContain('%PDF'); // PDF header
    expect(pdfContent).toContain('%%EOF'); // PDF footer

    // jsPDF generates /Page objects for each page
    expect(pdfContent).toContain('/Type /Page');

    // Verify multiple pages exist (should have at least 3 for 30 tasks)
    const pageMatches = pdfContent.match(/\/Type \/Page\b/g);
    expect(pageMatches).toBeDefined();
    expect(pageMatches!.length).toBeGreaterThanOrEqual(3);

    // Verify font is embedded
    expect(pdfContent).toContain('/Type /Font');
  });

  /**
   * Test 6: Integration - API to S3 upload path simulation
   *
   * Tests the complete flow of generating a PDF and preparing it for S3 upload,
   * verifying the integration points between services.
   */
  it('prepares PDF correctly for S3 upload integration', async () => {
    const report = createFullReport(60);
    const leadData = createFullLeadData({
      firstName: 'TestUser',
      lastName: 'Integration',
    });

    // Generate PDF
    const pdfResult = await generatePDF(report, leadData);
    expect(pdfResult.success).toBe(true);

    // Simulate API route processing - convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfResult.base64!, 'base64');
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBe(pdfResult.buffer!.length);

    // Generate S3 filename
    const s3Filename = generateSafeFilename(
      leadData.firstName || 'Report',
      leadData.lastName || ''
    );

    // Verify filename is valid for S3
    expect(s3Filename).toMatch(/^EA_Time_Freedom_Report_TestUser_Integration_\d+\.pdf$/);

    // Verify buffer is under 50MB limit
    expect(pdfBuffer.length).toBeLessThan(50 * 1024 * 1024);

    // Verify buffer is not empty
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Verify buffer starts with PDF signature
    expect(pdfBuffer.slice(0, 4).toString('ascii')).toBe('%PDF');
  });
});
