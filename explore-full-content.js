const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to page...');
    await page.goto('https://report.assistantlaunch.com/', { waitUntil: 'networkidle', timeout: 30000 });
    
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    let scrollPosition = 0;
    
    while (scrollPosition < pageHeight + 500) {
      await page.evaluate((pos) => {
        window.scrollTo(0, pos);
      }, scrollPosition);
      await page.waitForTimeout(200);
      scrollPosition += 300;
    }
    
    const allContent = await page.evaluate(() => {
      return {
        pageTitle: document.title,
        bodyText: document.body.innerText,
        allHeadings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({ tag: h.tagName, text: h.innerText })),
        allParagraphs: Array.from(document.querySelectorAll('p')).map(p => p.innerText).filter(t => t.length > 30),
        videosCount: document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"], video').length
      };
    });
    
    fs.writeFileSync('/tmp/full-content.json', JSON.stringify(allContent, null, 2));
    console.log('Saved full content to file');
    
  } catch (error) {
    console.error('Error: ' + error.message);
  } finally {
    await browser.close();
  }
})();
