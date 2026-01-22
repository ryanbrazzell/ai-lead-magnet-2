const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'responsiveness-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const url = 'https://www.acquisition.com/roadmap';

  // Breakpoints to test
  const breakpoints = [
    { name: 'mobile-xs', width: 320, height: 568 },
    { name: 'mobile-small', width: 375, height: 667 },
    { name: 'mobile-large', width: 428, height: 926 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'laptop', width: 1024, height: 768 },
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'desktop-large', width: 1440, height: 900 },
  ];

  const results = {
    breakpoints: [],
    buttonBehavior: [],
    layoutShifts: [],
    mobileSpecificStyles: []
  };

  console.log('Starting responsive analysis...\n');

  for (const bp of breakpoints) {
    console.log(`Testing ${bp.name} (${bp.width}x${bp.height})`);

    await page.setViewportSize({ width: bp.width, height: bp.height });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      console.log('  Warning: Page load timeout, continuing anyway...');
    }

    // Wait for content to be visible
    await page.waitForTimeout(3000);

    // Take full page screenshot
    const screenshotPath = path.join(screenshotsDir, `${bp.name}-${bp.width}px.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    // Analyze button styles
    const buttonAnalysis = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a[class*="button"], a[class*="btn"], input[type="submit"], [role="button"]'));

      return buttons.map((btn, index) => {
        const styles = window.getComputedStyle(btn);
        const rect = btn.getBoundingClientRect();
        const parentRect = btn.parentElement?.getBoundingClientRect();

        return {
          index,
          text: btn.textContent?.trim().substring(0, 30) || btn.value || 'N/A',
          className: btn.className,
          width: rect.width,
          display: styles.display,
          flexDirection: styles.flexDirection,
          isFullWidth: parentRect ? (rect.width / parentRect.width) > 0.95 : false,
          margin: styles.margin,
          padding: styles.padding,
          fontSize: styles.fontSize,
          position: styles.position
        };
      });
    });

    // Analyze layout structure
    const layoutAnalysis = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('main, section, div[class*="container"], div[class*="wrapper"], div[class*="content"]'));

      return containers.slice(0, 10).map((container, index) => {
        const styles = window.getComputedStyle(container);
        const rect = container.getBoundingClientRect();

        return {
          index,
          className: container.className,
          width: rect.width,
          maxWidth: styles.maxWidth,
          display: styles.display,
          flexDirection: styles.flexDirection,
          gridTemplateColumns: styles.gridTemplateColumns,
          padding: styles.padding,
          margin: styles.margin
        };
      });
    });

    // Analyze form elements
    const formAnalysis = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const inputs = Array.from(document.querySelectorAll('input[type="email"], input[type="text"], textarea'));

      return {
        formCount: forms.length,
        forms: forms.map((form, index) => {
          const styles = window.getComputedStyle(form);
          const rect = form.getBoundingClientRect();

          return {
            index,
            className: form.className,
            width: rect.width,
            display: styles.display,
            flexDirection: styles.flexDirection,
            gap: styles.gap
          };
        }),
        inputs: inputs.map((input, index) => {
          const styles = window.getComputedStyle(input);
          const rect = input.getBoundingClientRect();

          return {
            index,
            type: input.type,
            width: rect.width,
            fontSize: styles.fontSize,
            padding: styles.padding
          };
        })
      };
    });

    // Check for mobile-specific classes or attributes
    const mobileSpecific = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;

      return {
        htmlClasses: html.className,
        bodyClasses: body.className,
        viewport: document.querySelector('meta[name="viewport"]')?.content,
        hiddenElements: Array.from(document.querySelectorAll('[class*="hidden"], [class*="mobile"], [class*="desktop"]'))
          .map(el => ({
            className: el.className,
            display: window.getComputedStyle(el).display
          }))
          .filter(el => el.className.includes('hidden') || el.className.includes('mobile') || el.className.includes('desktop'))
          .slice(0, 20)
      };
    });

    // Get computed styles from body and html for media query detection
    const viewportInfo = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;

      return {
        bodyWidth: body.clientWidth,
        htmlWidth: html.clientWidth,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      };
    });

    results.breakpoints.push({
      name: bp.name,
      width: bp.width,
      height: bp.height,
      screenshot: screenshotPath,
      buttons: buttonAnalysis,
      layout: layoutAnalysis,
      forms: formAnalysis,
      mobileSpecific,
      viewportInfo
    });

    console.log(`  - Found ${buttonAnalysis.length} buttons`);
    console.log(`  - Full-width buttons: ${buttonAnalysis.filter(b => b.isFullWidth).length}`);
    console.log(`  - Screenshot saved: ${screenshotPath}\n`);
  }

  // Save detailed results
  const resultsPath = path.join(__dirname, 'responsiveness-analysis.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${resultsPath}`);

  // Generate summary report
  const summary = generateSummary(results);
  const summaryPath = path.join(__dirname, 'responsiveness-summary.md');
  fs.writeFileSync(summaryPath, summary);
  console.log(`Summary report saved to: ${summaryPath}`);

  console.log('\n' + summary);

  await browser.close();
})();

function generateSummary(results) {
  let summary = '# Mobile Responsiveness Analysis: acquisition.com/roadmap\n\n';
  summary += `Analysis Date: ${new Date().toISOString()}\n\n`;

  summary += '## Breakpoint Overview\n\n';
  summary += '| Breakpoint | Width | Buttons | Full-Width Buttons | Forms |\n';
  summary += '|------------|-------|---------|-------------------|-------|\n';

  results.breakpoints.forEach(bp => {
    const fullWidthCount = bp.buttons.filter(b => b.isFullWidth).length;
    summary += `| ${bp.name} | ${bp.width}px | ${bp.buttons.length} | ${fullWidthCount} | ${bp.forms.formCount} |\n`;
  });

  summary += '\n## Button Behavior Analysis\n\n';

  // Detect when buttons become full-width
  const fullWidthTransition = detectFullWidthTransition(results.breakpoints);
  if (fullWidthTransition) {
    summary += `### Full-Width Button Transition\n\n`;
    summary += `Buttons transition to full-width between **${fullWidthTransition.from}px** and **${fullWidthTransition.to}px**\n\n`;
  }

  summary += '### Button Details by Breakpoint\n\n';
  results.breakpoints.forEach(bp => {
    summary += `#### ${bp.name} (${bp.width}px)\n\n`;
    if (bp.buttons.length > 0) {
      bp.buttons.forEach((btn, idx) => {
        summary += `- Button ${idx + 1}: "${btn.text}"\n`;
        summary += `  - Width: ${Math.round(btn.width)}px\n`;
        summary += `  - Full-width: ${btn.isFullWidth ? 'Yes' : 'No'}\n`;
        summary += `  - Display: ${btn.display}\n`;
        summary += `  - Font size: ${btn.fontSize}\n\n`;
      });
    } else {
      summary += 'No buttons found\n\n';
    }
  });

  summary += '\n## Layout Shift Analysis\n\n';

  const layoutShift = detectLayoutShift(results.breakpoints);
  if (layoutShift) {
    summary += `### Mobile Layout Breakpoint\n\n`;
    summary += `Major layout shift detected between **${layoutShift.from}px** and **${layoutShift.to}px**\n\n`;
    summary += `Change: ${layoutShift.change}\n\n`;
  }

  summary += '### Container Widths\n\n';
  results.breakpoints.forEach(bp => {
    if (bp.layout.length > 0) {
      const mainContainer = bp.layout[0];
      summary += `- **${bp.name} (${bp.width}px)**: Container width ${Math.round(mainContainer.width)}px, max-width: ${mainContainer.maxWidth}\n`;
    }
  });

  summary += '\n## Form Behavior\n\n';
  results.breakpoints.forEach(bp => {
    if (bp.forms.formCount > 0) {
      summary += `### ${bp.name} (${bp.width}px)\n\n`;
      bp.forms.forms.forEach((form, idx) => {
        summary += `- Form ${idx + 1}:\n`;
        summary += `  - Width: ${Math.round(form.width)}px\n`;
        summary += `  - Display: ${form.display}\n`;
        summary += `  - Flex direction: ${form.flexDirection}\n`;
        summary += `  - Gap: ${form.gap}\n\n`;
      });

      if (bp.forms.inputs.length > 0) {
        summary += `- Input fields (${bp.forms.inputs.length} found):\n`;
        const firstInput = bp.forms.inputs[0];
        summary += `  - Width: ${Math.round(firstInput.width)}px\n`;
        summary += `  - Font size: ${firstInput.fontSize}\n`;
        summary += `  - Padding: ${firstInput.padding}\n\n`;
      }
    }
  });

  summary += '\n## Mobile-Specific Behaviors\n\n';

  // Check for viewport meta tag
  const viewportInfo = results.breakpoints[0].mobileSpecific.viewport;
  summary += `### Viewport Configuration\n\n`;
  summary += `\`\`\`\n${viewportInfo || 'No viewport meta tag found'}\n\`\`\`\n\n`;

  // Check for mobile-specific classes
  summary += '### Mobile/Desktop Specific Elements\n\n';
  const mobileElements = results.breakpoints[0].mobileSpecific.hiddenElements;
  if (mobileElements.length > 0) {
    summary += 'Found elements with mobile/desktop/hidden classes:\n\n';
    mobileElements.forEach(el => {
      summary += `- ${el.className} (display: ${el.display})\n`;
    });
  } else {
    summary += 'No mobile/desktop specific class patterns detected.\n';
  }

  summary += '\n## Key Findings Summary\n\n';

  if (fullWidthTransition) {
    summary += `- **Button Full-Width Breakpoint**: ${fullWidthTransition.from}px - ${fullWidthTransition.to}px\n`;
  }

  if (layoutShift) {
    summary += `- **Mobile Layout Breakpoint**: ${layoutShift.from}px - ${layoutShift.to}px\n`;
  }

  summary += '\n## Screenshots\n\n';
  results.breakpoints.forEach(bp => {
    summary += `- [${bp.name} (${bp.width}px)](${bp.screenshot})\n`;
  });

  return summary;
}

function detectFullWidthTransition(breakpoints) {
  // Find where buttons transition from not full-width to full-width
  for (let i = breakpoints.length - 1; i > 0; i--) {
    const current = breakpoints[i];
    const previous = breakpoints[i - 1];

    const currentFullWidth = current.buttons.filter(b => b.isFullWidth).length;
    const previousFullWidth = previous.buttons.filter(b => b.isFullWidth).length;

    if (currentFullWidth === 0 && previousFullWidth > 0) {
      return {
        from: previous.width,
        to: current.width
      };
    }
  }

  return null;
}

function detectLayoutShift(breakpoints) {
  // Detect major layout changes based on flex-direction or grid changes
  for (let i = breakpoints.length - 1; i > 0; i--) {
    const current = breakpoints[i];
    const previous = breakpoints[i - 1];

    if (current.layout.length > 0 && previous.layout.length > 0) {
      const currentLayout = current.layout[0];
      const previousLayout = previous.layout[0];

      // Check if flex direction changes
      if (currentLayout.flexDirection !== previousLayout.flexDirection) {
        return {
          from: previous.width,
          to: current.width,
          change: `Flex direction: ${previousLayout.flexDirection} -> ${currentLayout.flexDirection}`
        };
      }

      // Check if grid columns change
      if (currentLayout.gridTemplateColumns !== previousLayout.gridTemplateColumns) {
        return {
          from: previous.width,
          to: current.width,
          change: `Grid: ${previousLayout.gridTemplateColumns} -> ${currentLayout.gridTemplateColumns}`
        };
      }
    }
  }

  return null;
}
