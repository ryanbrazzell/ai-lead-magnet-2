// @vitest-environment node
/**
 * End-to-end regression test for generatePDFV2.
 *
 * Runs in the Node test environment (not jsdom) so it exercises the
 * server-side jsPDF Node build — the exact path used by the API route and
 * report pipeline. This is where jsPDF v4's only breaking change (Node build
 * filesystem restriction) would surface; the test passing here proves the
 * base64 VFS font path needs no `jsPDF.allowFsRead` opt-in.
 *
 *
 * Imports the REAL (un-mocked) generatePDFV2 and produces a Time Freedom
 * Report PDF end-to-end: jsPDF construction, base64 VFS font registration,
 * full layout drawing, and both output forms (arraybuffer + datauristring).
 *
 * This is the acceptance guard for the jspdf 3.x -> 4.x security upgrade
 * (FN-002): it must stay GREEN across the bump, proving the upgrade did not
 * break PDF generation, fonts, multi-page paths, or output encoding.
 */

import { describe, it, expect } from 'vitest';
import { generatePDFV2 } from '../generator-v2';
import type { PDFGenerationResult } from '@/types/pdf';
import type { Task, TaskGenerationResult, TasksByCoreFour } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';
import type { TaskHours } from '@/lib/roi-calculator';

const PDF_MAGIC = '%PDF';

function makeTask(title: string, description: string, category: string): Task {
  return { title, description, category, owner: 'EA', isEA: true };
}

function makeTasks(area: string, count: number, category: string): Task[] {
  return Array.from({ length: count }, (_, i) =>
    makeTask(`${area} task ${i + 1}`, `Delegatable ${area} responsibility number ${i + 1}.`, category)
  );
}

function buildReport(tasks: TasksByCoreFour): TaskGenerationResult {
  const total =
    tasks.businessProcesses.length +
    tasks.personalLife.length +
    tasks.calendar.length +
    tasks.email.length;
  return {
    tasks,
    analysis_summary: 'Summary of delegatable workload across the Core Four.',
    total_task_count: total,
    ea_task_percent: 100,
    ea_task_count: total,
    summary: 'All tasks are EA-delegatable.',
  };
}

const leadData: UnifiedLeadData = {
  leadType: 'standard',
  timestamp: new Date().toISOString(),
  firstName: 'Jordan',
  lastName: 'Rivera',
  email: 'jordan@example.com',
  phone: '+15551234567',
  businessType: 'Consulting Agency',
  revenue: '$1M-$3M',
  employeeCount: '10-25',
  challenges: 'Too much time spent on email triage and scheduling.',
};

const taskHours: TaskHours = {
  email: 10,
  calendar: 5,
  personalLife: 4,
  businessProcesses: 8,
};

/**
 * Assert a generation result is a complete, valid PDF.
 * Verifies BOTH output forms produced real %PDF bytes:
 * - result.buffer  -> doc.output('arraybuffer')
 * - result.base64  -> doc.output('datauristring')
 */
function expectValidPdfResult(result: PDFGenerationResult): void {
  expect(result.success).toBe(true);
  expect(result.error).toBeUndefined();

  // arraybuffer form
  expect(Buffer.isBuffer(result.buffer)).toBe(true);
  expect(result.buffer!.length).toBeGreaterThan(0);
  expect(result.buffer!.subarray(0, PDF_MAGIC.length).toString('latin1')).toBe(PDF_MAGIC);

  // datauristring (base64) form must also decode to valid PDF bytes
  expect(typeof result.base64).toBe('string');
  expect(result.base64!.length).toBeGreaterThan(0);
  const fromBase64 = Buffer.from(result.base64!, 'base64');
  expect(fromBase64.length).toBeGreaterThan(0);
  expect(fromBase64.subarray(0, PDF_MAGIC.length).toString('latin1')).toBe(PDF_MAGIC);

  // filename shape
  expect(result.filename).toMatch(/^Time_Freedom_Report_.*\.pdf$/);
  expect(result.size).toBeGreaterThan(0);
}

describe('generatePDFV2 (end-to-end)', () => {
  it('generates a complete PDF for a fully populated report (multi-page)', async () => {
    // Many tasks across every Core Four area -> forces addPage / multi-page layout.
    const report = buildReport({
      businessProcesses: makeTasks('Business process & SOP', 8, 'business'),
      personalLife: makeTasks('Personal life & family logistics', 6, 'personal'),
      calendar: makeTasks('Calendar & meeting prep', 6, 'calendar'),
      email: makeTasks('Email & inbox', 6, 'email'),
    });

    const result = await generatePDFV2(report, leadData, {
      includeMetadata: true,
      taskHours,
      revenueRange: '$1M-$3M',
    });

    expectValidPdfResult(result);
  });

  it('generates a complete PDF for a thin/minimal report (triggers fallback injection)', async () => {
    // Each area below MIN_TASKS thresholds -> exercises fallback-task injection path.
    const report = buildReport({
      businessProcesses: makeTasks('Business process', 1, 'business'),
      personalLife: [],
      calendar: makeTasks('Calendar', 1, 'calendar'),
      email: [],
    });

    const minimalLead: UnifiedLeadData = {
      leadType: 'simple',
      timestamp: new Date().toISOString(),
      firstName: 'Sam',
    };

    const result = await generatePDFV2(report, minimalLead, {
      includeMetadata: false,
    });

    expectValidPdfResult(result);
  });
});
