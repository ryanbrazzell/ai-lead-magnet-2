/**
 * Send example email with V2 PDF
 * Run with: npx tsx scripts/send-v2-email.ts
 */

const BASE_URL = 'http://localhost:3000';

const TEST_DATA = {
  firstName: 'Ryan',
  lastName: 'Brazzell',
  email: 'ryan@assistantlaunch.com',
  businessType: 'Agency',
  revenueRange: '$500K - $1M',
  challenges: 'Email management, Calendar scheduling',
  leadType: 'main',
  timestamp: new Date().toISOString(),
};

const TASK_HOURS = {
  email: 5,
  personalLife: 6,
  calendar: 3,
  businessProcesses: 7,
};

async function main() {
  console.log('Sending V2 PDF via email...\n');

  try {
    // Step 1: Generate tasks
    console.log('1. Generating tasks...');
    const tasksRes = await fetch(`${BASE_URL}/api/generate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_DATA),
    });
    const tasksResult = await tasksRes.json();
    if (!tasksResult.success) throw new Error(`Tasks failed: ${tasksResult.error}`);
    console.log(`   Generated ${tasksResult.data.total_task_count} tasks`);

    // Step 2: Generate PDF
    console.log('2. Generating V2 PDF...');
    const pdfRes = await fetch(`${BASE_URL}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: tasksResult.data.tasks,
        eaPercentage: tasksResult.data.ea_task_percent,
        userData: {
          firstName: TEST_DATA.firstName,
          lastName: TEST_DATA.lastName,
          email: TEST_DATA.email,
          businessType: TEST_DATA.businessType,
        },
        taskHours: TASK_HOURS,
        revenueRange: TEST_DATA.revenueRange,
      }),
    });
    const pdfResult = await pdfRes.json();
    if (!pdfResult.success) throw new Error(`PDF failed: ${pdfResult.error}`);
    console.log(`   PDF generated (${Math.round(pdfResult.pdf.length / 1024)}KB)`);

    // Step 3: Send email
    console.log('3. Sending email...');
    const emailRes = await fetch(`${BASE_URL}/api/send-report-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_DATA.email,
        firstName: TEST_DATA.firstName,
        lastName: TEST_DATA.lastName,
        pdfBase64: pdfResult.pdf,
        revenueUnlocked: 109200,
        weeklyHoursSaved: 21,
        roiMultiplier: 3.3,
      }),
    });
    const emailResult = await emailRes.json();

    if (emailResult.success) {
      console.log(`   Sent! Email ID: ${emailResult.emailId}`);
      console.log('\nCheck ryan@assistantlaunch.com for the new V2 PDF.');
    } else {
      throw new Error(`Email failed: ${emailResult.error}`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
