import { chromium } from 'playwright';

async function testLeadFlow() {
  console.log('Starting browser automation test...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  // Enable request/response logging
  page.on('request', request => {
    if (request.url().includes('/api/close')) {
      console.log('>> API Request:', request.method(), request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/close')) {
      console.log('<< API Response:', response.status(), response.url());
      try {
        const body = await response.json();
        console.log('   Response body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('   Could not parse response body');
      }
    }
  });

  try {
    // Go to the live site
    console.log('\n1. Navigating to report.assistantlaunch.com...');
    await page.goto('https://report.assistantlaunch.com');
    await page.waitForLoadState('domcontentloaded');
    console.log('   Page loaded');

    // Take screenshot
    await page.screenshot({ path: '/tmp/step1-landing.png' });
    console.log('   Screenshot saved: /tmp/step1-landing.png');

    // Wait for form to appear
    await page.waitForTimeout(2000);

    // Find the CTA button and click it
    console.log('\n2. Looking for CTA button...');
    const ctaButton = await page.locator('text=Get Your Free Report').first();
    if (await ctaButton.isVisible()) {
      console.log('   Found CTA button, clicking...');
      await ctaButton.click();
      await page.waitForTimeout(1000);
    }

    // Take screenshot of form
    await page.screenshot({ path: '/tmp/step2-form.png' });
    console.log('   Screenshot saved: /tmp/step2-form.png');

    // Fill out the form with test data
    const timestamp = new Date().getTime();
    const testFirstName = 'TestLeadClaude';
    const testLastName = 'Automation';
    const testEmail = `test.claude.${timestamp}@example.com`;

    console.log(`\n3. Filling form with test data:`);
    console.log(`   First Name: ${testFirstName}`);
    console.log(`   Last Name: ${testLastName}`);
    console.log(`   Email: ${testEmail}`);

    // Try to find and fill form fields
    const firstNameInput = await page.locator('input[name="firstName"], input[placeholder*="first" i]').first();
    const lastNameInput = await page.locator('input[name="lastName"], input[placeholder*="last" i]').first();
    const emailInput = await page.locator('input[name="email"], input[type="email"]').first();

    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill(testFirstName);
      console.log('   Filled first name');
    }
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill(testLastName);
      console.log('   Filled last name');
    }
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail);
      console.log('   Filled email');
    }

    await page.screenshot({ path: '/tmp/step3-filled.png' });
    console.log('   Screenshot saved: /tmp/step3-filled.png');

    // Look for submit/next button
    console.log('\n4. Looking for submit button...');
    const submitButton = await page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit")').first();

    if (await submitButton.isVisible()) {
      console.log('   Found submit button, clicking...');
      await submitButton.click();

      // Wait for API call
      console.log('   Waiting for API response...');
      await page.waitForTimeout(5000);

      await page.screenshot({ path: '/tmp/step4-submitted.png' });
      console.log('   Screenshot saved: /tmp/step4-submitted.png');
    } else {
      console.log('   No submit button found on this step');
    }

    console.log('\n5. Checking console errors...');

    // Keep browser open for inspection
    console.log('\nTest complete. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: '/tmp/error.png' });
  } finally {
    await browser.close();
  }
}

testLeadFlow().catch(console.error);
