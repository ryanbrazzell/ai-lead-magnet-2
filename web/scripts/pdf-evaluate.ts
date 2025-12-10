/**
 * PDF Evaluation & Feedback Loop Script
 *
 * This script:
 * 1. Generates a test PDF through the API
 * 2. Converts PDF pages to PNG images
 * 3. Saves them for visual inspection
 * 4. Can be run iteratively to test design changes
 *
 * Run with: npx tsx scripts/pdf-evaluate.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'pdf-evaluation');

// Test data that will generate a representative PDF
const TEST_LEAD_DATA = {
  firstName: 'Ryan',
  lastName: 'Brazzell',
  email: 'ryan@assistantlaunch.com',
  businessType: 'Agency',
  revenueRange: '$500K - $1M',
  challenges: 'Email management, Calendar scheduling, Client follow-ups',
  timeBottleneck: 'Administrative tasks taking too much time',
  leadType: 'main',
  timestamp: new Date().toISOString(),
};

const TEST_TASK_HOURS = {
  email: 5,
  personalLife: 6,
  calendar: 3,
  businessProcesses: 7,
};

interface EvaluationResult {
  success: boolean;
  timestamp: string;
  pdfSizeKB: number;
  taskCount: number;
  eaPercent: number;
  errors: string[];
  warnings: string[];
  outputFiles: string[];
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }
}

/**
 * Generate tasks using Claude AI
 */
async function generateTasks(): Promise<{ success: boolean; data: any; error?: string }> {
  console.log('\n📋 Step 1: Generating tasks with Claude...');

  const response = await fetch(`${BASE_URL}/api/generate-tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_LEAD_DATA),
  });

  const result = await response.json();

  if (!result.success) {
    return { success: false, data: null, error: result.error };
  }

  console.log(`   ✓ Generated ${result.data.total_task_count} tasks (${result.data.ea_task_percent}% EA)`);
  return { success: true, data: result.data };
}

/**
 * Generate PDF from tasks
 */
async function generatePDF(tasks: any): Promise<{ success: boolean; pdf?: string; error?: string }> {
  console.log('\n📄 Step 2: Generating PDF...');

  const response = await fetch(`${BASE_URL}/api/generate-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tasks: tasks.tasks,
      eaPercentage: tasks.ea_task_percent,
      userData: {
        firstName: TEST_LEAD_DATA.firstName,
        lastName: TEST_LEAD_DATA.lastName,
        email: TEST_LEAD_DATA.email,
        businessType: TEST_LEAD_DATA.businessType,
      },
      taskHours: TEST_TASK_HOURS,
      revenueRange: TEST_LEAD_DATA.revenueRange,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    return { success: false, error: result.error };
  }

  console.log(`   ✓ PDF generated (${Math.round(result.pdf.length / 1024)}KB base64)`);
  return { success: true, pdf: result.pdf };
}

/**
 * Save PDF for manual inspection
 */
function savePDF(pdfBase64: string, timestamp: string): string {
  const filename = `evaluation-${timestamp}.pdf`;
  const filepath = join(OUTPUT_DIR, filename);
  const buffer = Buffer.from(pdfBase64, 'base64');
  writeFileSync(filepath, buffer);
  console.log(`   ✓ Saved PDF: ${filepath}`);
  return filepath;
}

/**
 * Design checklist evaluation (manual inspection guide)
 */
function printDesignChecklist(): void {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 PDF DESIGN EVALUATION CHECKLIST');
  console.log('═'.repeat(60));

  console.log('\n🎨 COLOR SCHEME (Navy/Gold/Green):');
  console.log('   □ Hero section uses Navy (#0f172a) background');
  console.log('   □ NO bright purple (#6F00FF) anywhere');
  console.log('   □ CTA box uses Gold (#f59e0b) background');
  console.log('   □ EA badges use Green (#10b981)');
  console.log('   □ Cost badges use Red (#dc2626)');

  console.log('\n🔤 TYPOGRAPHY:');
  console.log('   □ Title is bold and prominent (32pt+)');
  console.log('   □ Section headers clearly distinguished');
  console.log('   □ Body text readable (10-12pt)');
  console.log('   □ Consistent font hierarchy');

  console.log('\n📐 LAYOUT:');
  console.log('   □ Proper spacing between sections (15mm+)');
  console.log('   □ No content cut off at page breaks');
  console.log('   □ Footer appears on ALL pages');
  console.log('   □ Key Insights visible on page 1');
  console.log('   □ Tasks have breathing room');

  console.log('\n✨ VISUAL QUALITY:');
  console.log('   □ Hero section feels premium/branded');
  console.log('   □ ROI numbers are impactful');
  console.log('   □ EA badges are prominent (not tiny)');
  console.log('   □ Cost amounts clearly visible');
  console.log('   □ CTA is compelling and visible');

  console.log('\n📱 CONSISTENCY WITH WEB UI:');
  console.log('   □ Matches web color scheme');
  console.log('   □ Similar visual hierarchy');
  console.log('   □ Consistent brand feel');
  console.log('   □ Professional, not generic');

  console.log('\n' + '═'.repeat(60));
}

/**
 * Generate evaluation report
 */
function generateReport(result: EvaluationResult): void {
  const reportContent = `
# PDF Evaluation Report
Generated: ${result.timestamp}

## Summary
- **Status**: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}
- **PDF Size**: ${result.pdfSizeKB}KB
- **Task Count**: ${result.taskCount}
- **EA Percentage**: ${result.eaPercent}%

## Output Files
${result.outputFiles.map(f => `- ${f}`).join('\n')}

## Errors
${result.errors.length ? result.errors.map(e => `- ❌ ${e}`).join('\n') : '- None'}

## Warnings
${result.warnings.length ? result.warnings.map(w => `- ⚠️ ${w}`).join('\n') : '- None'}

## Design Checklist
Review the PDF manually against these criteria:

### Colors
- [ ] Navy (#0f172a) used for hero/headers
- [ ] No purple (#6F00FF)
- [ ] Gold (#f59e0b) for CTAs
- [ ] Green (#10b981) for EA badges

### Layout
- [ ] No content cut off
- [ ] Footer on all pages
- [ ] Proper spacing

### Visual Quality
- [ ] Premium branded feel
- [ ] Impactful ROI numbers
- [ ] Prominent badges

---
To iterate: Make changes to layout.ts, then run this script again.
`;

  const reportPath = join(OUTPUT_DIR, `report-${result.timestamp}.md`);
  writeFileSync(reportPath, reportContent.trim());
  console.log(`\n📊 Evaluation report saved: ${reportPath}`);
}

/**
 * Main evaluation flow
 */
async function runEvaluation(): Promise<void> {
  console.log('🚀 Starting PDF Evaluation');
  console.log('═'.repeat(50));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const result: EvaluationResult = {
    success: false,
    timestamp,
    pdfSizeKB: 0,
    taskCount: 0,
    eaPercent: 0,
    errors: [],
    warnings: [],
    outputFiles: [],
  };

  try {
    ensureOutputDir();

    // Generate tasks
    const tasksResult = await generateTasks();
    if (!tasksResult.success) {
      result.errors.push(`Task generation failed: ${tasksResult.error}`);
      throw new Error(tasksResult.error);
    }
    result.taskCount = tasksResult.data.total_task_count;
    result.eaPercent = tasksResult.data.ea_task_percent;

    // Generate PDF
    const pdfResult = await generatePDF(tasksResult.data);
    if (!pdfResult.success) {
      result.errors.push(`PDF generation failed: ${pdfResult.error}`);
      throw new Error(pdfResult.error);
    }
    result.pdfSizeKB = Math.round(pdfResult.pdf!.length / 1024);

    // Save PDF
    const pdfPath = savePDF(pdfResult.pdf!, timestamp);
    result.outputFiles.push(pdfPath);

    result.success = true;
    console.log('\n✅ PDF generated successfully!');

    // Print manual checklist
    printDesignChecklist();

    // Generate report
    generateReport(result);

    console.log('\n📁 Output location:', OUTPUT_DIR);
    console.log('📄 PDF file:', pdfPath);
    console.log('\n💡 Open the PDF and use the checklist above to evaluate the design.');
    console.log('   After making changes to layout.ts, run this script again to iterate.');

  } catch (error) {
    const err = error as Error;
    console.error('\n❌ Evaluation failed:', err.message);
    result.errors.push(err.message);
    generateReport(result);
    process.exit(1);
  }
}

// Run the evaluation
runEvaluation();
