const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 800
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'roadmap-analysis');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  let stepCounter = 0;
  const analysis = {
    url: 'https://www.acquisition.com/roadmap',
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    console.log('Step 0: Navigating to landing page...');
    await page.goto('https://www.acquisition.com/roadmap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Dismiss cookie banner if present
    try {
      const cookieButton = await page.$('.CybotCookiebotDialogBodyButton:has-text("Allow")');
      if (cookieButton) {
        console.log('Dismissing cookie banner...');
        await cookieButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('No cookie banner found or already dismissed');
    }

    // Capture initial landing page
    await page.screenshot({
      path: path.join(screenshotsDir, `step-${stepCounter}-landing.png`),
      fullPage: true
    });
    console.log(`Screenshot saved: step-${stepCounter}-landing.png`);

    // Analyze landing page
    const landingAnalysis = await page.evaluate(() => {
      const data = {
        title: document.title,
        heroHeadline: '',
        heroSubheadline: '',
        ctaButton: {},
        allVisibleText: ''
      };

      // Find hero elements
      const h1 = document.querySelector('h1');
      if (h1) data.heroHeadline = h1.innerText;

      const h2 = document.querySelector('h2');
      if (h2) data.heroSubheadline = h2.innerText;

      // Find main CTA button (not cookie buttons)
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn =>
        !btn.className.includes('Cybot') && btn.innerText.includes('START')
      );
      if (buttons.length > 0) {
        const mainButton = buttons[0];
        const styles = window.getComputedStyle(mainButton);
        data.ctaButton = {
          text: mainButton.innerText,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontSize: styles.fontSize,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          width: mainButton.offsetWidth + 'px',
          height: mainButton.offsetHeight + 'px'
        };
      }

      // Get visible page text (excluding cookie banner)
      const main = document.querySelector('main') || document.body;
      data.allVisibleText = main.innerText.substring(0, 2000);

      return data;
    });

    analysis.steps.push({
      step: stepCounter,
      type: 'landing',
      screenshot: `step-${stepCounter}-landing.png`,
      analysis: landingAnalysis
    });

    stepCounter++;

    // Click the main CTA
    console.log('\nStep 1: Clicking main CTA button...');
    const mainCTA = await page.$('button.hsfc-Button:has-text("LET\'S START")');
    if (mainCTA) {
      await mainCTA.click();
      await page.waitForTimeout(2000);

      // Capture after click
      await page.screenshot({
        path: path.join(screenshotsDir, `step-${stepCounter}-after-cta-click.png`),
        fullPage: true
      });
      console.log(`Screenshot saved: step-${stepCounter}-after-cta-click.png`);
      stepCounter++;
    }

    // Now iterate through form steps
    for (let i = 0; i < 15; i++) {
      console.log(`\nStep ${stepCounter}: Analyzing current form step...`);

      await page.waitForTimeout(1500);

      // Analyze current form step
      const stepAnalysis = await page.evaluate(() => {
        const data = {
          question: '',
          inputType: '',
          options: [],
          buttons: [],
          formFields: []
        };

        // Find question/heading (exclude cookie banner)
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).filter(h =>
          !h.closest('.CybotCookiebot')
        );
        if (headings.length > 0) {
          data.question = headings[0].innerText;
        }

        // Find form-specific elements
        const formInputs = Array.from(document.querySelectorAll('input[name*="/"], select, textarea'));
        formInputs.forEach(input => {
          if (input.type !== 'hidden') {
            data.formFields.push({
              type: input.type,
              name: input.name,
              placeholder: input.placeholder,
              required: input.required
            });
          }
        });

        // Find clickable options (for multiple choice questions)
        const optionElements = Array.from(document.querySelectorAll('[class*="Option"], [data-option]'));
        optionElements.forEach(opt => {
          data.options.push({
            text: opt.innerText,
            className: opt.className
          });
        });

        // Find action buttons (exclude cookie banner and "Previous")
        const actionButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
          !btn.className.includes('Cybot') &&
          !btn.innerText.includes('Previous') &&
          btn.innerText.trim().length > 0
        );
        actionButtons.forEach(btn => {
          const styles = window.getComputedStyle(btn);
          data.buttons.push({
            text: btn.innerText,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontSize: styles.fontSize,
            padding: styles.padding,
            borderRadius: styles.borderRadius,
            width: btn.offsetWidth + 'px',
            height: btn.offsetHeight + 'px'
          });
        });

        return data;
      });

      // Capture screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `step-${stepCounter}-form-step.png`),
        fullPage: true
      });
      console.log(`Screenshot saved: step-${stepCounter}-form-step.png`);

      analysis.steps.push({
        step: stepCounter,
        type: 'form-step',
        screenshot: `step-${stepCounter}-form-step.png`,
        analysis: stepAnalysis
      });

      console.log('Question:', stepAnalysis.question);
      console.log('Form fields:', stepAnalysis.formFields.length);
      console.log('Options:', stepAnalysis.options.length);
      console.log('Buttons:', stepAnalysis.buttons.map(b => b.text).join(', '));

      // Determine what to click next
      let actionTaken = false;

      // If there are clickable options, click the first one
      if (stepAnalysis.options.length > 0) {
        console.log('Clicking first option...');
        const firstOption = await page.$('[class*="Option"], [data-option]');
        if (firstOption) {
          await firstOption.click();
          await page.waitForTimeout(1500);
          actionTaken = true;
        }
      }
      // If there are form fields, fill them with dummy data
      else if (stepAnalysis.formFields.length > 0) {
        console.log('Filling form fields...');
        for (const field of stepAnalysis.formFields) {
          try {
            const selector = `[name="${field.name}"]`;
            if (field.type === 'email') {
              await page.fill(selector, 'test@example.com');
            } else if (field.type === 'tel') {
              await page.fill(selector, '+15555551234');
            } else if (field.type === 'text') {
              if (field.placeholder.includes('NAME')) {
                await page.fill(selector, 'Test');
              } else {
                await page.fill(selector, 'Test Value');
              }
            }
          } catch (e) {
            console.log(`Could not fill field: ${field.name}`);
          }
        }
        await page.waitForTimeout(500);
      }

      // Click Continue/Next button
      const continueButton = await page.$('button.hsfc-Button:has-text("CONTINUE"), button.hsfc-Button:has-text("GET MY ROADMAP")');
      if (continueButton) {
        const isEnabled = await continueButton.isEnabled();
        if (isEnabled) {
          console.log('Clicking CONTINUE button...');
          await continueButton.click();
          await page.waitForTimeout(2000);
          actionTaken = true;
        } else {
          console.log('CONTINUE button is disabled');
        }
      }

      if (!actionTaken) {
        console.log('No action could be taken. Form flow may be complete.');
        break;
      }

      stepCounter++;

      // Check if we've reached a completion/thank you page
      const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
      if (pageText.includes('thank you') || pageText.includes('roadmap') && pageText.includes('download')) {
        console.log('Reached completion page.');
        await page.screenshot({
          path: path.join(screenshotsDir, `step-${stepCounter}-completion.png`),
          fullPage: true
        });
        stepCounter++;
        break;
      }
    }

    // Save analysis to JSON
    fs.writeFileSync(
      path.join(screenshotsDir, 'analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    console.log('\nAnalysis saved to analysis.json');

    console.log(`\nTotal steps captured: ${stepCounter}`);
    console.log(`Screenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('Error during analysis:', error);
    await page.screenshot({
      path: path.join(screenshotsDir, `error-screenshot.png`),
      fullPage: true
    });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();
