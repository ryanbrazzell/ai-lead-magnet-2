const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(__dirname, 'roadmap-analysis');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  let stepCounter = 0;
  const report = [];

  async function captureStep(description, analysis = {}) {
    const filename = `step-${String(stepCounter).padStart(2, '0')}-${description.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({
      path: path.join(screenshotsDir, filename),
      fullPage: true
    });
    console.log(`Step ${stepCounter}: ${description}`);
    console.log(`Screenshot: ${filename}`);

    report.push({
      step: stepCounter,
      description,
      screenshot: filename,
      ...analysis
    });

    stepCounter++;
    await page.waitForTimeout(800);
  }

  async function analyzeCurrentState() {
    return await page.evaluate(() => {
      const data = {
        currentQuestion: '',
        inputFields: [],
        buttons: [],
        visibleOptions: [],
        progressInfo: ''
      };

      // Get current question
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).filter(h =>
        !h.closest('.CybotCookiebot') && !h.closest('footer') && !h.closest('nav')
      );
      if (headings.length > 0) {
        data.currentQuestion = headings[0].innerText;
      }

      // Get visible input fields
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      inputs.forEach(input => {
        const rect = input.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          data.inputFields.push({
            type: input.type,
            placeholder: input.placeholder,
            name: input.name,
            required: input.required
          });
        }
      });

      // Get visible buttons
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn =>
        !btn.className.includes('Cybot') && btn.innerText.trim().length > 0
      );
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const styles = window.getComputedStyle(btn);
          data.buttons.push({
            text: btn.innerText.trim(),
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontSize: styles.fontSize,
            padding: styles.padding,
            borderRadius: styles.borderRadius,
            width: Math.round(rect.width) + 'px',
            height: Math.round(rect.height) + 'px'
          });
        }
      });

      // Look for multiple choice options
      const options = Array.from(document.querySelectorAll('[class*="option" i], [role="radio"], [role="checkbox"]'));
      options.forEach(opt => {
        const rect = opt.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && opt.innerText.trim()) {
          data.visibleOptions.push({
            text: opt.innerText.trim(),
            type: opt.getAttribute('role') || 'option'
          });
        }
      });

      return data;
    });
  }

  try {
    console.log('\n=== STARTING ANALYSIS ===\n');

    // Step 0: Navigate to landing page
    await page.goto('https://www.acquisition.com/roadmap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Dismiss cookie banner
    try {
      const cookieButton = await page.$('button:has-text("Allow")');
      if (cookieButton && await cookieButton.isVisible()) {
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    const landingState = await analyzeCurrentState();
    await captureStep('landing-page', landingState);

    // Step 1: Fill in name fields and click LET'S START
    console.log('\n--- Filling initial name fields ---');
    await page.fill('input[placeholder="FIRST NAME"]', 'John');
    await page.fill('input[placeholder="LAST NAME"]', 'Doe');
    await page.waitForTimeout(500);

    const stateAfterName = await analyzeCurrentState();
    await captureStep('filled-name-fields', stateAfterName);

    // Click LET'S START
    await page.click('button:has-text("LET\'S START")');
    await page.waitForTimeout(2000);

    // Now we should be in the multi-step form
    // Let's iterate through each step
    for (let i = 0; i < 15; i++) {
      const currentState = await analyzeCurrentState();

      console.log(`\n--- Form Step ${i + 1} ---`);
      console.log(`Question: ${currentState.currentQuestion}`);
      console.log(`Input fields: ${currentState.inputFields.length}`);
      console.log(`Options: ${currentState.visibleOptions.length}`);
      console.log(`Buttons: ${currentState.buttons.map(b => b.text).join(', ')}`);

      await captureStep(`form-step-${i + 1}`, currentState);

      // Determine action based on what's visible
      let actionTaken = false;

      // If there are visible options (multiple choice), click the first one
      if (currentState.visibleOptions.length > 0) {
        console.log('Clicking first option...');
        const firstOption = await page.$('[class*="option" i], [role="radio"]');
        if (firstOption) {
          await firstOption.click();
          await page.waitForTimeout(1500);
          actionTaken = true;
        }
      }
      // If there are input fields, fill them
      else if (currentState.inputFields.length > 0) {
        console.log('Filling input fields...');
        for (const field of currentState.inputFields) {
          try {
            const selector = `[name="${field.name}"]`;
            if (field.type === 'email') {
              await page.fill(selector, 'john.doe@example.com');
            } else if (field.type === 'tel') {
              // Just type the number part
              await page.click(selector);
              await page.keyboard.type('5555551234');
            } else if (field.type === 'text') {
              if (field.placeholder.includes('FIRST')) {
                await page.fill(selector, 'John');
              } else if (field.placeholder.includes('LAST')) {
                await page.fill(selector, 'Doe');
              } else if (field.placeholder.includes('ADDRESS')) {
                await page.fill(selector, '123 Main St');
              } else if (field.placeholder.includes('CITY')) {
                await page.fill(selector, 'New York');
              } else if (field.placeholder.includes('STATE')) {
                await page.fill(selector, 'NY');
              } else if (field.placeholder.includes('ZIP') || field.placeholder.includes('POSTAL')) {
                await page.fill(selector, '10001');
              } else if (field.placeholder.includes('COUNTRY')) {
                await page.fill(selector, 'United States');
              } else {
                await page.fill(selector, 'Test Value');
              }
            } else if (field.type === 'select-one') {
              // Try to select first option
              await page.selectOption(selector, { index: 1 });
            }
          } catch (e) {
            console.log(`Could not fill field: ${field.name} - ${e.message}`);
          }
        }
        await page.waitForTimeout(500);
      }

      // Now try to click CONTINUE or GET MY ROADMAP button
      const continueBtn = await page.$('button:has-text("CONTINUE")');
      const getRoadmapBtn = await page.$('button:has-text("GET MY ROADMAP")');

      const btnToClick = continueBtn || getRoadmapBtn;
      if (btnToClick) {
        const isEnabled = await btnToClick.isEnabled();
        const btnText = await btnToClick.innerText();

        if (isEnabled) {
          console.log(`Clicking "${btnText}" button...`);
          await btnToClick.click();
          await page.waitForTimeout(2000);
          actionTaken = true;
        } else {
          console.log(`"${btnText}" button is disabled`);
        }
      }

      if (!actionTaken) {
        console.log('No action could be taken - may be at the end or need manual intervention');
        break;
      }

      // Check if we've completed the flow
      const url = page.url();
      const content = await page.content();
      if (content.toLowerCase().includes('thank you') ||
          content.toLowerCase().includes('download') ||
          url.includes('thank-you') ||
          url.includes('confirmation')) {
        console.log('\n=== REACHED COMPLETION PAGE ===');
        const finalState = await analyzeCurrentState();
        await captureStep('completion-page', finalState);
        break;
      }
    }

    // Save report
    fs.writeFileSync(
      path.join(screenshotsDir, 'detailed-analysis.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n=== ANALYSIS COMPLETE ===');
    console.log(`Total steps captured: ${stepCounter}`);
    console.log(`Screenshots saved to: ${screenshotsDir}`);
    console.log('Report saved to: detailed-analysis.json');

  } catch (error) {
    console.error('Error during analysis:', error);
    await page.screenshot({
      path: path.join(screenshotsDir, 'error.png'),
      fullPage: true
    });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
