import { test, expect } from '@playwright/test';

test('ROI Calculator full flow', async ({ page }) => {
  test.setTimeout(180000); // 3 minute timeout

  // Navigate to ROI Calculator
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Take screenshot of landing page
  await page.screenshot({ path: '/tmp/final-test/01-landing-page.png', fullPage: true });
  console.log('Step 1: Landing page loaded');

  // Step 1: First Name and Last Name (using id selectors)
  await page.fill('#firstName', 'John');
  await page.fill('#lastName', 'Smith');
  await page.screenshot({ path: '/tmp/final-test/02-name-filled.png', fullPage: true });
  console.log('Step 1: Filled name fields');

  // Click LET'S START
  await page.click('button:has-text("LET\'S START")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/final-test/03-after-name.png', fullPage: true });
  console.log('Step 1: Clicked LET\'S START');

  // Step 2: Email
  await page.fill('#email', 'john@test.com');
  await page.screenshot({ path: '/tmp/final-test/04-email-filled.png', fullPage: true });
  console.log('Step 2: Filled email');

  await page.click('button:has-text("CONTINUE")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/final-test/05-after-email.png', fullPage: true });
  console.log('Step 2: Clicked CONTINUE');

  // Step 3: Phone
  await page.fill('#phone', '(555) 555-1234');
  await page.screenshot({ path: '/tmp/final-test/06-phone-filled.png', fullPage: true });
  console.log('Step 3: Filled phone');

  await page.click('button:has-text("CONTINUE")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/final-test/07-after-phone.png', fullPage: true });
  console.log('Step 3: Clicked CONTINUE');

  // Step 4: Revenue - This is a dropdown/select, click on the dropdown which shows "Select..."
  // Wait for the select element to appear
  await page.waitForSelector('text=Select...', { timeout: 10000 });
  await page.screenshot({ path: '/tmp/final-test/07a-revenue-page.png', fullPage: true });

  // Click on the dropdown
  await page.click('text=Select...');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-test/07b-revenue-dropdown-open.png', fullPage: true });

  // Select $500k to $1M option
  await page.click('text="$500k to $1M"');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/final-test/08-revenue-selected.png', fullPage: true });
  console.log('Step 4: Selected revenue');

  await page.click('button:has-text("CONTINUE")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/final-test/09-after-revenue.png', fullPage: true });
  console.log('Step 4: Clicked CONTINUE');

  // Step 5: Hours - Use aria-label to find the increment buttons
  await page.screenshot({ path: '/tmp/final-test/09a-hours-page.png', fullPage: true });
  console.log('Step 5: Hours page loaded');

  // Click on increment buttons using aria-label
  // Email: 3 hours - click "Increase Managing Email hours" 3 times
  for (let i = 0; i < 3; i++) {
    await page.click('button[aria-label="Increase Managing Email hours"]');
    await page.waitForTimeout(300);
  }
  console.log('Added 3 hours to Email');

  // Personal Life: 2 hours
  for (let i = 0; i < 2; i++) {
    await page.click('button[aria-label="Increase Personal Life hours"]');
    await page.waitForTimeout(300);
  }
  console.log('Added 2 hours to Personal Life');

  // Calendar: 2 hours
  for (let i = 0; i < 2; i++) {
    await page.click('button[aria-label="Increase Calendar & Booking hours"]');
    await page.waitForTimeout(300);
  }
  console.log('Added 2 hours to Calendar');

  // Business Processes: 3 hours
  for (let i = 0; i < 3; i++) {
    await page.click('button[aria-label="Increase Business Processes hours"]');
    await page.waitForTimeout(300);
  }
  console.log('Added 3 hours to Business Processes');

  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/final-test/10-hours-filled.png', fullPage: true });
  console.log('Step 5: Set all hours');

  // Click SEE MY ROI REPORT
  await page.click('button:has-text("SEE MY ROI REPORT")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/final-test/11-report-loading.png', fullPage: true });
  console.log('Step 5: Clicked SEE MY ROI REPORT');

  // Wait for task generation (up to 60 seconds)
  console.log('Waiting for task generation (up to 60 seconds)...');
  await page.waitForTimeout(60000);

  await page.screenshot({ path: '/tmp/final-test/12-report-final.png', fullPage: true });
  console.log('Final report page captured');

  // Scroll down to capture more content
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-test/13-report-scrolled.png', fullPage: true });

  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-test/14-report-scrolled2.png', fullPage: true });

  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-test/15-report-scrolled3.png', fullPage: true });

  // Scroll to very bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-test/16-report-bottom.png', fullPage: true });

  // Verify key elements
  const pageContent = await page.content();

  const hasVideoSection = pageContent.toLowerCase().includes('watch') && pageContent.toLowerCase().includes('video');
  console.log('Video section found:', hasVideoSection);

  const hasROIValue = pageContent.includes('195,000');
  console.log('ROI value $195,000 found:', hasROIValue);

  const hasMultiplier = pageContent.includes('5.9x');
  console.log('Multiplier 5.9x found:', hasMultiplier);
});
