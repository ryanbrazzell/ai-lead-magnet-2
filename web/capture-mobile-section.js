const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // iPhone 12 Pro dimensions
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Navigate to report page with test data
  const testData = {
    firstName: 'Ryan',
    lastName: 'Test',
    email: 'test@example.com',
    phone: '555-1234',
    revenue: '$500k to $1M',
    painPoints: 'Email management, calendar',
    taskHours: { email: 3, personalLife: 2, calendar: 2, businessProcesses: 3 },
    leadId: '',
  };

  const encodedData = Buffer.from(JSON.stringify(testData)).toString('base64');
  await page.goto(`http://localhost:3000/report?data=${encodeURIComponent(encodedData)}`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  // Wait for analyzing animation to complete
  await page.waitForTimeout(5000);

  // Scroll to "How Assistant Launch Solves This Problem" section
  await page.evaluate(() => {
    const howItWorks = document.querySelector('.how-it-works-grid');
    if (howItWorks) {
      howItWorks.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });

  await page.waitForTimeout(500);

  // Take full page screenshot
  await page.screenshot({
    path: 'mobile-how-it-works-section.png',
    fullPage: true
  });

  // Take screenshot of just the section from "How Assistant Launch" to objection handlers
  const sectionBounds = await page.evaluate(() => {
    // Find the section containing "How Assistant Launch Solves This Problem"
    const allSections = document.querySelectorAll('section');
    let howItWorksSection = null;
    let ctaSection = null;

    for (const section of allSections) {
      const text = section.textContent || '';
      if (text.includes('How Assistant Launch Solves This Problem')) {
        howItWorksSection = section;
      }
      if (text.includes('What if they can\'t handle my business')) {
        ctaSection = section;
      }
    }

    if (howItWorksSection) {
      const rect = howItWorksSection.getBoundingClientRect();
      return {
        y: rect.top + window.scrollY,
        height: rect.height,
      };
    }
    return null;
  });

  console.log('Section bounds:', sectionBounds);

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Take a screenshot of just the specific area we care about
  // First scroll to the how it works section
  await page.evaluate(() => {
    // Find section by looking for the text
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes('How Assistant Launch Solves')) {
        node.parentElement.scrollIntoView({ block: 'start' });
        break;
      }
    }
  });

  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'mobile-target-section-start.png',
  });

  // Scroll down more to see the objection handling
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'mobile-target-section-middle.png',
  });

  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({
    path: 'mobile-target-section-end.png',
  });

  console.log('Screenshots saved!');

  await browser.close();
})();
