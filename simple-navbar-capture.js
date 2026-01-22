const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    console.log('Navigating to https://www.assistantlaunch.com/...');
    await page.goto('https://www.assistantlaunch.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Waiting for page to settle...');
    await page.waitForTimeout(3000);

    // Screenshot 1: Default state
    console.log('Capturing default navbar...');
    await page.screenshot({
      path: 'navbar-screenshots/01-default.png',
      fullPage: false
    });

    // Get navbar HTML structure
    const navbarHTML = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('header') || document.querySelector('[role="navigation"]');
      return nav ? nav.outerHTML : 'No navbar found';
    });
    console.log('\n=== NAVBAR HTML ===');
    console.log(navbarHTML.substring(0, 1000));

    // Get all links in navbar
    const links = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('header');
      if (!nav) return [];

      const linkElements = nav.querySelectorAll('a');
      return Array.from(linkElements).map(link => {
        const styles = window.getComputedStyle(link);
        return {
          text: link.textContent.trim(),
          href: link.href,
          color: styles.color,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          fontFamily: styles.fontFamily,
          backgroundColor: styles.backgroundColor,
          padding: styles.padding,
          margin: styles.margin
        };
      });
    });
    console.log('\n=== NAVBAR LINKS ===');
    console.log(JSON.stringify(links, null, 2));

    // Try hovering over navigation items
    const navLinks = await page.locator('nav a, header a').all();
    console.log(`\nFound ${navLinks.length} navigation links`);

    for (let i = 0; i < Math.min(navLinks.length, 5); i++) {
      try {
        const text = await navLinks[i].textContent();
        const cleanText = text.trim().replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
        console.log(`Hovering over link ${i + 1}: ${text.trim()}`);

        await navLinks[i].hover({ timeout: 2000 });
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: `navbar-screenshots/02-hover-${cleanText}.png`,
          fullPage: false
        });
      } catch (e) {
        console.log(`Could not hover link ${i}: ${e.message}`);
      }
    }

    // Get Started button
    try {
      const getStarted = page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first();
      console.log('\nFound Get Started button, capturing details...');

      await getStarted.scrollIntoViewIfNeeded();
      await getStarted.hover();
      await page.waitForTimeout(1000);

      const btnStyles = await getStarted.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          fontFamily: styles.fontFamily,
          padding: styles.padding,
          borderRadius: styles.borderRadius,
          border: styles.border,
          textTransform: styles.textTransform
        };
      });

      console.log('Get Started Button Styles:');
      console.log(JSON.stringify(btnStyles, null, 2));

      await page.screenshot({
        path: 'navbar-screenshots/03-get-started-hover.png',
        fullPage: false
      });
    } catch (e) {
      console.log('Could not find Get Started button:', e.message);
    }

    // Get logo
    try {
      const logo = page.locator('nav img, header img, [class*="logo"] img').first();
      const logoSrc = await logo.getAttribute('src');
      const logoAlt = await logo.getAttribute('alt');

      console.log('\nLogo Details:');
      console.log(`  Source: ${logoSrc}`);
      console.log(`  Alt: ${logoAlt}`);

      await logo.screenshot({
        path: 'navbar-screenshots/04-logo.png'
      });
    } catch (e) {
      console.log('Could not capture logo:', e.message);
    }

    // Get overall navbar styles
    const navbarStyles = await page.evaluate(() => {
      const nav = document.querySelector('nav') || document.querySelector('header');
      if (!nav) return null;

      const styles = window.getComputedStyle(nav);
      return {
        backgroundColor: styles.backgroundColor,
        height: styles.height,
        position: styles.position,
        top: styles.top,
        width: styles.width,
        boxShadow: styles.boxShadow,
        borderBottom: styles.borderBottom,
        padding: styles.padding,
        display: styles.display,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent,
        zIndex: styles.zIndex
      };
    });

    console.log('\n=== NAVBAR CONTAINER STYLES ===');
    console.log(JSON.stringify(navbarStyles, null, 2));

    console.log('\n✓ Capture complete! Check navbar-screenshots/ folder');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
})();
