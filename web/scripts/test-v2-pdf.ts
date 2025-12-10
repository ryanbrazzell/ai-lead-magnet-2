/**
 * Test script for V2 PDF generation
 * Run with: npx tsx scripts/test-v2-pdf.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'pdf-evaluation');

// Test data matching the new design
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

async function main() {
  console.log('Testing V2 PDF Generator...\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  try {
    // Step 1: Generate tasks
    console.log('1. Generating tasks with Claude...');
    const tasksResponse = await fetch(`${BASE_URL}/api/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_LEAD_DATA),
    });

    const tasksResult = await tasksResponse.json();
    if (!tasksResult.success) {
      throw new Error(`Task generation failed: ${tasksResult.error}`);
    }
    console.log(`   Generated ${tasksResult.data.total_task_count} tasks (${tasksResult.data.ea_task_percent}% EA)`);

    // Step 2: Generate PDF with V2 design
    console.log('\n2. Generating PDF with V2 design...');
    const pdfResponse = await fetch(`${BASE_URL}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: tasksResult.data.tasks,
        eaPercentage: tasksResult.data.ea_task_percent,
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

    const pdfResult = await pdfResponse.json();
    if (!pdfResult.success) {
      throw new Error(`PDF generation failed: ${pdfResult.error}`);
    }
    console.log(`   PDF generated (${Math.round(pdfResult.pdf.length / 1024)}KB base64)`);

    // Step 3: Save PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `v2-report-${timestamp}.pdf`;
    const filepath = join(OUTPUT_DIR, filename);
    const buffer = Buffer.from(pdfResult.pdf, 'base64');
    writeFileSync(filepath, buffer);
    console.log(`\n3. Saved PDF to: ${filepath}`);

    console.log('\n✅ V2 PDF generation successful!');
    console.log(`   Open ${filepath} to review the new design.`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
