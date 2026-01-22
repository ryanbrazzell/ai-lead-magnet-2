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

  const screenshotsDir = path.join(__dirname, 'roadmap-final-analysis');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  let stepCounter = 0;
  const report = {
    url: 'https://www.acquisition.com/roadmap',
    timestamp: new Date().toISOString(),
    steps: []
  };

  async function captureAndAnalyze(description) {
    const analysis = await page.evaluate(() => {
      const data = {
        question: '',
        visibleInputs: [],
        visibleButtons: [],
        socialProof: [],
        bodyText: ''
      };

      // Get question
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).filter(h =>
        !h.closest('.CybotCookiebot') && !h.closest('nav') && !h.closest('footer')
      );
      if (headings.length > 0) {
        data.question = headings[0].innerText.trim();
      }

      // Get all visible inputs
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const rect = input.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && input.type !== 'hidden') {
          const styles = window.getComputedStyle(input);
          data.visibleInputs.push({
            type: input.type,
            placeholder: input.placeholder,
            name: input.name,
            fontSize: styles.fontSize,
            padding: styles.padding,
            backgroundColor: styles.backgroundColor,
            borderRadius: styles.borderRadius
          });
        }
      });

      // Get visible buttons (exclude cookie banner)
      document.querySelectorAll('button.hsfc-Button').forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const styles = window.getComputedStyle(btn);
          data.visibleButtons.push({
            text: btn.innerText.trim(),
            backgroundColor: styles.backgroundColor,
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

      // Get page text for context
      const main = document.querySelector('main') || document.body;
      data.bodyText = main.innerText.substring(0, 1500);

      return data;
    });

    const filename = `step-${String(stepCounter).padStart(2, '0')}-${description.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    await page.screenshot({
      path: path.join(screenshotsDir, filename),
      fullPage: true
    });

    console.log(`\n====== STEP ${stepCounter}: ${description.toUpperCase()} ======`);
    console.log(`Question: "${analysis.question}"`);
    console.log(`Inputs (${analysis.visibleInputs.length}):`);
    analysis.visibleInputs.forEach(inp => {
      console.log(`  - ${inp.type}: ${inp.placeholder}`);
    });
    console.log(`Buttons (${analysis.visibleButtons.length}):`);
    analysis.visibleButtons.forEach(btn => {
      console.log(`  - "${btn.text}" ${btn.disabled ? '(DISABLED)' : ''} [${btn.width} x ${btn.height}, BG: ${btn.backgroundColor}]`);
    });
    console.log(`Screenshot: ${filename}`);

    report.steps.push({
      step: stepCounter,
      description,
      screenshot: filename,
      analysis
    });

    stepCounter++;
    await page.waitForTimeout(500);
    return analysis;
  }

  try {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║   ACQUISITION.COM ROADMAP - COMPREHENSIVE ANALYSIS   ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');

    // Navigate to page
    console.log('Navigating to https://www.acquisition.com/roadmap...');
    await page.goto('https://www.acquisition.com/roadmap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    // Dismiss cookie banner
    try {
      const cookieBtn = await page.$('button.CybotCookiebotDialogBodyButton:has-text("Allow")');
      if (cookieBtn && await cookieBtn.isVisible()) {
        console.log('Dismissing cookie consent...');
        await cookieBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {}

    // STEP 0: Initial landing page
    await captureAndAnalyze('Landing Page');

    // Fill in name fields
    console.log('\nFilling name fields...');
    await page.fill('input[placeholder="FIRST NAME"]', 'John');
    await page.fill('input[placeholder="LAST NAME"]', 'Doe');
    await page.waitForTimeout(300);

    await captureAndAnalyze('Name Fields Filled');

    // Click LET'S START button
    console.log('\nClicking LET\'S START button...');
    const startBtn = await page.$('button.hsfc-Button:visible');
    if (startBtn) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // Now walk through all form steps
    for (let i = 0; i < 15; i++) {
      const state = await captureAndAnalyze(`Form Step ${i + 1}`);

      // If there are inputs visible, fill them
      if (state.visibleInputs.length > 0) {
        console.log(`\nFilling ${state.visibleInputs.length} input field(s)...`);
        for (const input of state.visibleInputs) {
          try {
            const selector = `[name="${input.name}"]`;
            if (input.type === 'email') {
              await page.fill(selector, 'john.doe@businessemail.com');
            } else if (input.type === 'tel') {
              await page.click(selector);
              await page.keyboard.type('2125551234');
            } else if (input.type === 'text') {
              if (input.placeholder.includes('FIRST')) await page.fill(selector, 'John');
              else if (input.placeholder.includes('LAST')) await page.fill(selector, 'Doe');
              else if (input.placeholder.includes('ADDRESS')) await page.fill(selector, '123 Main Street');
              else if (input.placeholder.includes('CITY')) await page.fill(selector, 'New York');
              else if (input.placeholder.includes('STATE') || input.placeholder.includes('REGION')) await page.fill(selector, 'NY');
              else if (input.placeholder.includes('ZIP') || input.placeholder.includes('POSTAL')) await page.fill(selector, '10001');
              else if (input.placeholder.includes('COUNTRY')) await page.fill(selector, 'United States');
              else await page.fill(selector, 'Value');
            }
          } catch (e) {
            console.log(`  Could not fill: ${input.name}`);
          }
        }
        await page.waitForTimeout(500);
      }

      // Find and click the next button
      let clicked = false;

      // Look for CONTINUE button
      const continueBtn = await page.$('button.hsfc-Button:visible:has-text("CONTINUE")');
      if (continueBtn && await continueBtn.isEnabled()) {
        console.log('\nClicking CONTINUE...');
        await continueBtn.click();
        await page.waitForTimeout(2000);
        clicked = true;
      }

      // Look for GET MY ROADMAP button
      if (!clicked) {
        const roadmapBtn = await page.$('button.hsfc-Button:visible:has-text("GET MY ROADMAP")');
        if (roadmapBtn && await roadmapBtn.isEnabled()) {
          console.log('\nClicking GET MY ROADMAP...');
          await roadmapBtn.click();
          await page.waitForTimeout(3000);
          clicked = true;

          // This is likely the final step
          await captureAndAnalyze('After Submit');
          break;
        }
      }

      if (!clicked) {
        console.log('\nNo enabled button found - end of flow');
        break;
      }
    }

    // Save complete report
    fs.writeFileSync(
      path.join(screenshotsDir, 'complete-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                  ANALYSIS COMPLETE                    ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Total Steps Captured: ${stepCounter}`);
    console.log(`Output Directory: ${screenshotsDir}`);
    console.log(`Report File: complete-report.json`);
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({
      path: path.join(screenshotsDir, 'error.png'),
      fullPage: true
    });
  } finally {
    console.log('\nKeeping browser open for 5 seconds for review...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
