const { chromium } = require('playwright');

async function captureNavbarDetails() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Navigating to Assistant Launch...');
  await page.goto('https://www.assistantlaunch.com/', { waitUntil: 'networkidle' });

  // Wait for navbar to load
  await page.waitForTimeout(2000);

  // Take initial screenshot
  console.log('Taking initial navbar screenshot...');
  await page.screenshot({
    path: '/Users/ryanbrazzell/boundless-os-template-2/navbar-screenshots/01-navbar-default.png',
    fullPage: false
  });

  // Get navbar details
  const navbarDetails = await page.evaluate(() => {
    const nav = document.querySelector('nav') || document.querySelector('header');
    if (!nav) return { error: 'Navbar not found' };

    const styles = window.getComputedStyle(nav);
    const links = Array.from(nav.querySelectorAll('a'));

    return {
      backgroundColor: styles.backgroundColor,
      height: styles.height,
      padding: styles.padding,
      links: links.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        color: window.getComputedStyle(link).color,
        fontSize: window.getComputedStyle(link).fontSize,
        fontWeight: window.getComputedStyle(link).fontWeight,
        fontFamily: window.getComputedStyle(link).fontFamily,
        className: link.className
      }))
    };
  });

  console.log('Navbar Details:', JSON.stringify(navbarDetails, null, 2));

  // Try to find and hover over navigation items
  const navItems = await page.locator('nav a, header a').all();
  console.log(`Found ${navItems.length} navigation items`);

  for (let i = 0; i < Math.min(navItems.length, 8); i++) {
    try {
      const text = await navItems[i].textContent();
      console.log(`Hovering over: ${text}`);
      await navItems[i].hover();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `/Users/ryanbrazzell/boundless-os-template-2/navbar-screenshots/02-hover-${i}-${text.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`,
        fullPage: false
      });
    } catch (e) {
      console.log(`Could not hover item ${i}: ${e.message}`);
    }
  }

  // Look for "Get Started" button specifically
  try {
    const getStartedBtn = page.locator('text=/Get Started/i').first();
    console.log('Found Get Started button, hovering...');
    await getStartedBtn.hover();
    await page.waitForTimeout(500);

    const btnDetails = await getStartedBtn.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        padding: styles.padding,
        borderRadius: styles.borderRadius,
        border: styles.border,
        fontFamily: styles.fontFamily
      };
    });

    console.log('Get Started Button Details:', JSON.stringify(btnDetails, null, 2));

    await page.screenshot({
      path: '/Users/ryanbrazzell/boundless-os-template-2/navbar-screenshots/03-get-started-hover.png',
      fullPage: false
    });
  } catch (e) {
    console.log('Could not find Get Started button:', e.message);
  }

  // Capture the logo
  try {
    const logo = page.locator('nav img, header img').first();
    await logo.screenshot({
      path: '/Users/ryanbrazzell/boundless-os-template-2/navbar-screenshots/04-logo.png'
    });

    const logoDetails = await logo.evaluate(el => ({
      src: el.src,
      alt: el.alt,
      width: el.width,
      height: el.height
    }));

    console.log('Logo Details:', JSON.stringify(logoDetails, null, 2));
  } catch (e) {
    console.log('Could not capture logo:', e.message);
  }

  // Get all computed styles from navbar
  const fullNavbarStyles = await page.evaluate(() => {
    const nav = document.querySelector('nav') || document.querySelector('header');
    if (!nav) return null;

    const styles = window.getComputedStyle(nav);
    return {
      position: styles.position,
      top: styles.top,
      left: styles.left,
      right: styles.right,
      width: styles.width,
      height: styles.height,
      backgroundColor: styles.backgroundColor,
      boxShadow: styles.boxShadow,
      borderBottom: styles.borderBottom,
      zIndex: styles.zIndex,
      display: styles.display,
      alignItems: styles.alignItems,
      justifyContent: styles.justifyContent,
      padding: styles.padding,
      margin: styles.margin
    };
  });

  console.log('Full Navbar Styles:', JSON.stringify(fullNavbarStyles, null, 2));

  await browser.close();
  console.log('\nScreenshots saved to navbar-screenshots/');
}

captureNavbarDetails().catch(console.error);
