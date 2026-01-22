const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 600
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

  async function captureStep(description) {
    const analysis = await page.evaluate(() => {
      const data = {
        question: '',
        inputs: [],
        buttons: [],
        options: []
      };

      // Get question text
      const h4 = document.querySelector('h4');
      if (h4 && !h4.closest('.CybotCookiebot')) {
        data.question = h4.innerText;
      } else {
        const h3 = document.querySelector('h3');
        if (h3 && !h3.closest('.CybotCookiebot')) {
          data.question = h3.innerText;
        }
      }

      // Get visible inputs
      document.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(input => {
        const rect = input.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          data.inputs.push({
            type: input.type,
            placeholder: input.placeholder,
            name: input.name
          });
        }
      });

      // Get visible buttons
      document.querySelectorAll('button').forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && !btn.className.includes('Cybot') && btn.innerText.trim()) {
          const styles = window.getComputedStyle(btn);
          data.buttons.push({
            text: btn.innerText.trim(),
            bgColor: styles.backgroundColor,
            color: styles.color,
            fontSize: styles.fontSize,
            padding: styles.padding,
            borderRadius: styles.borderRadius,
            width: Math.round(rect.width) + 'px',
            height: Math.round(rect.height) + 'px',
            disabled: btn.disabled
          });
        }
      });

      return data;
    });

    const filename = `step-${String(stepCounter).padStart(2, '0')}-${description.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({
      path: path.join(screenshotsDir, filename),
      fullPage: true
    });

    console.log(`\n=== Step ${stepCounter}: ${description} ===`);
    console.log(`Question: ${analysis.question}`);
    console.log(`Inputs: ${analysis.inputs.length}`);
    console.log(`Buttons: ${analysis.buttons.map(b => `"${b.text}"${b.disabled ? ' (disabled)' : ''}`).join(', ')}`);
    console.log(`Screenshot: ${filename}`);

    report.push({
      step: stepCounter,
      description,
      screenshot: filename,
      analysis
    });

    stepCounter++;
    await page.waitForTimeout(600);
    return analysis;
  }

  try {
    console.log('\n========================================');
    console.log('ACQUISITION.COM ROADMAP FORM ANALYSIS');
    console.log('========================================\n');

    // Navigate
    await page.goto('https://www.acquisition.com/roadmap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Dismiss cookie banner
    try {
      await page.click('button:has-text("Allow")', { timeout: 3000 });
      await page.waitForTimeout(500);
    } catch (e) {}

    // Step 0: Landing
    await captureStep('initial-landing');

    // Fill name
    await page.fill('input[placeholder="FIRST NAME"]', 'John');
    await page.fill('input[placeholder="LAST NAME"]', 'Doe');
    await page.waitForTimeout(500);
    await captureStep('name-filled');

    // Click start button
    await page.click('button >> text="LET\'S START"');
    await page.waitForTimeout(2500);
    await captureStep('after-start-click');

    // Now iterate through form steps
    for (let i = 0; i < 20; i++) {
      const state = await captureStep(`form-question-${i + 1}`);

      // Try to proceed
      let proceeded = false;

      // Check for CONTINUE button
      try {
        const continueBtn = await page.$('button:has-text("CONTINUE")');
        if (continueBtn) {
          const isEnabled = await continueBtn.isEnabled();
          if (isEnabled) {
            await continueBtn.click();
            await page.waitForTimeout(2000);
            proceeded = true;
          } else {
            // Button is disabled, need to fill something
            // Check if there are inputs
            if (state.inputs.length > 0) {
              console.log('Filling inputs to enable CONTINUE...');
              for (const input of state.inputs) {
                try {
                  if (input.type === 'email') {
                    await page.fill(`[name="${input.name}"]`, 'test@example.com');
                  } else if (input.type === 'tel') {
                    await page.click(`[name="${input.name}"]`);
                    await page.keyboard.type('5555551234');
                  } else if (input.type === 'text') {
                    await page.fill(`[name="${input.name}"]`, 'Test');
                  }
                } catch (e) {}
              }
              await page.waitForTimeout(500);

              // Try clicking CONTINUE again
              if (await continueBtn.isEnabled()) {
                await continueBtn.click();
                await page.waitForTimeout(2000);
                proceeded = true;
              }
            }
          }
        }
      } catch (e) {}

      // Check for GET MY ROADMAP button
      if (!proceeded) {
        try {
          const roadmapBtn = await page.$('button:has-text("GET MY ROADMAP")');
          if (roadmapBtn && await roadmapBtn.isEnabled()) {
            await roadmapBtn.click();
            await page.waitForTimeout(2000);
            proceeded = true;
          }
        } catch (e) {}
      }

      if (!proceeded) {
        console.log('Cannot proceed further - end of flow or need manual intervention');
        break;
      }

      // Check if completed
      const url = page.url();
      if (url.includes('thank') || url.includes('confirmation') || url.includes('complete')) {
        await captureStep('completion');
        break;
      }
    }

    // Save report
    fs.writeFileSync(
      path.join(screenshotsDir, 'report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n========================================');
    console.log(`ANALYSIS COMPLETE - ${stepCounter} steps captured`);
    console.log(`Saved to: ${screenshotsDir}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\nERROR:', error.message);
    await page.screenshot({
      path: path.join(screenshotsDir, 'error.png'),
      fullPage: true
    });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
})();
