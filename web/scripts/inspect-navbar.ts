import { chromium } from 'playwright';

async function inspectNavbar() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3001...');
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

  // Take full page screenshot
  console.log('Taking full page screenshot...');
  await page.screenshot({
    path: '/Users/ryanbrazzell/boundless-os-template-2/navbar-debug-full.png',
    fullPage: true
  });

  // Take screenshot of just the header area
  console.log('Taking header area screenshot...');
  await page.screenshot({
    path: '/Users/ryanbrazzell/boundless-os-template-2/navbar-debug-header.png',
    clip: { x: 0, y: 0, width: 1920, height: 150 }
  });

  // Inspect the header element
  console.log('\n=== HEADER INSPECTION ===\n');

  // Find all potential header elements
  const headerSelectors = [
    'header',
    'nav',
    '[role="banner"]',
    '.navbar',
    '.header',
    'header nav',
    'nav.navbar'
  ];

  for (const selector of headerSelectors) {
    const elements = await page.$$(selector);
    if (elements.length > 0) {
      console.log(`\nFound ${elements.length} element(s) matching: ${selector}`);

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];

        // Get computed styles
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            display: computed.display,
            position: computed.position,
            zIndex: computed.zIndex,
            opacity: computed.opacity,
            visibility: computed.visibility,
            height: computed.height,
            width: computed.width,
            top: computed.top,
            left: computed.left,
            padding: computed.padding,
            margin: computed.margin,
          };
        });

        // Get HTML structure
        const html = await element.evaluate((el) => el.outerHTML.substring(0, 500));

        // Get bounding box
        const box = await element.boundingBox();

        // Get class and id
        const className = await element.getAttribute('class');
        const id = await element.getAttribute('id');

        console.log(`\nElement ${i + 1}:`);
        console.log(`  Classes: ${className || 'none'}`);
        console.log(`  ID: ${id || 'none'}`);
        console.log(`  Bounding Box:`, box);
        console.log(`  Computed Styles:`, JSON.stringify(styles, null, 2));
        console.log(`  HTML (first 500 chars):\n${html}`);
      }
    }
  }

  // Check for any elements with specific background colors
  console.log('\n=== CHECKING FOR BACKGROUND COLORS ===\n');
  const coloredElements = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const results: any[] = [];

    allElements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      const bgColor = computed.backgroundColor;

      // Check if it has a non-transparent background
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        const rect = el.getBoundingClientRect();
        // Only include elements in the top 200px
        if (rect.top < 200) {
          results.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            backgroundColor: bgColor,
            top: rect.top,
            height: rect.height,
            width: rect.width
          });
        }
      }
    });

    return results;
  });

  console.log('Elements with background colors in top 200px:');
  coloredElements.forEach((el, i) => {
    console.log(`${i + 1}. <${el.tag}> class="${el.class}" id="${el.id}"`);
    console.log(`   Background: ${el.backgroundColor}`);
    console.log(`   Position: top=${el.top}px, height=${el.height}px, width=${el.width}px`);
  });

  // Check for CSS issues
  console.log('\n=== CHECKING FOR CSS CONFLICTS ===\n');
  const cssIssues = await page.evaluate(() => {
    const header = document.querySelector('header') || document.querySelector('nav');
    if (!header) return { error: 'No header or nav element found' };

    const computed = window.getComputedStyle(header);
    const issues: string[] = [];

    if (computed.display === 'none') issues.push('display: none is set');
    if (computed.visibility === 'hidden') issues.push('visibility: hidden is set');
    if (parseFloat(computed.opacity) === 0) issues.push('opacity: 0 is set');
    if (computed.backgroundColor === 'transparent' || computed.backgroundColor === 'rgba(0, 0, 0, 0)') {
      issues.push('Background is transparent');
    }
    if (parseFloat(computed.height) === 0) issues.push('Height is 0');

    return {
      computed: {
        backgroundColor: computed.backgroundColor,
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        height: computed.height,
        position: computed.position,
      },
      issues,
      classList: Array.from(header.classList),
      inlineStyles: header.getAttribute('style') || 'none'
    };
  });

  console.log('CSS Analysis:', JSON.stringify(cssIssues, null, 2));

  // Get the full page HTML for the header section
  console.log('\n=== FULL PAGE HEAD AND BODY START ===\n');
  const pageContent = await page.content();
  const headSection = pageContent.match(/<head>[\s\S]*?<\/head>/)?.[0] || 'No head found';
  const bodyStart = pageContent.match(/<body[^>]*>[\s\S]{0,2000}/)?.[0] || 'No body found';

  console.log('HEAD section (for CSS links):');
  console.log(headSection.substring(0, 1000));
  console.log('\nBODY start (first 2000 chars):');
  console.log(bodyStart);

  await browser.close();
  console.log('\n=== INSPECTION COMPLETE ===');
  console.log('Screenshots saved:');
  console.log('  - /Users/ryanbrazzell/boundless-os-template-2/navbar-debug-full.png');
  console.log('  - /Users/ryanbrazzell/boundless-os-template-2/navbar-debug-header.png');
}

inspectNavbar().catch(console.error);
