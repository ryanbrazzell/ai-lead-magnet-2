const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to https://report.assistantlaunch.com/...');
    await page.goto('https://report.assistantlaunch.com/', { waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('Page loaded. Taking initial screenshot...');
    await page.screenshot({ path: '/tmp/screenshot-initial.png', fullPage: false });
    console.log('Screenshot saved');
    
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log('Page height: ' + pageHeight);
    
    let allVideos = [];
    let scrollPosition = 0;
    const scrollIncrement = 500;
    
    while (scrollPosition < pageHeight + 1000) {
      await page.evaluate((pos) => {
        window.scrollTo(0, pos);
      }, scrollPosition);
      
      await page.waitForTimeout(500);
      
      const videos = await page.evaluate(() => {
        const videoElements = [];
        
        document.querySelectorAll('iframe').forEach((iframe) => {
          const src = iframe.getAttribute('src') || '';
          if (src.includes('youtube') || src.includes('vimeo') || src.includes('wistia') || 
              src.includes('loom') || src.includes('video') || src.includes('embed')) {
            videoElements.push({
              type: 'iframe',
              src: src,
              title: iframe.getAttribute('title') || 'Untitled'
            });
          }
        });
        
        return videoElements;
      });
      
      allVideos = allVideos.concat(videos);
      scrollPosition += scrollIncrement;
    }
    
    await page.screenshot({ path: '/tmp/screenshot-final.png', fullPage: false });
    
    const uniqueVideos = Array.from(new Map((allVideos || []).map(v => [JSON.stringify(v), v])).values());
    
    console.log('Total videos found: ' + uniqueVideos.length);
    
    const results = {
      pageUrl: 'https://report.assistantlaunch.com/',
      timestamp: new Date().toISOString(),
      videos: uniqueVideos,
      summary: {
        totalVideos: uniqueVideos.length
      }
    };
    
    fs.writeFileSync('/tmp/exploration-results.json', JSON.stringify(results, null, 2));
    console.log('Results saved to /tmp/exploration-results.json');
    
  } catch (error) {
    console.error('Error: ' + error.message);
  } finally {
    await browser.close();
  }
})();
