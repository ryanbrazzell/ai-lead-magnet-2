const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    await page.goto('https://report.assistantlaunch.com/', { waitUntil: 'networkidle', timeout: 30000 });
    
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    let scrollPosition = 0;
    
    while (scrollPosition < pageHeight + 500) {
      await page.evaluate((pos) => { window.scrollTo(0, pos); }, scrollPosition);
      await page.waitForTimeout(200);
      scrollPosition += 300;
    }
    
    const data = await page.evaluate(() => {
      const results = {
        videos: [],
        testimonials: [],
        headings: [],
        paragraphs: [],
        body_text_samples: []
      };
      
      // Get all videos
      document.querySelectorAll('iframe').forEach(iframe => {
        const src = iframe.getAttribute('src') || '';
        if (src.includes('youtube') || src.includes('vimeo') || src.includes('video') || src.includes('embed')) {
          results.videos.push({
            src: src,
            title: iframe.getAttribute('title'),
            width: iframe.getAttribute('width'),
            height: iframe.getAttribute('height')
          });
        }
      });
      
      // Get all headings
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
        results.headings.push({
          level: h.tagName,
          text: h.innerText
        });
      });
      
      // Get all paragraphs
      document.querySelectorAll('p').forEach(p => {
        const text = p.innerText;
        if (text && text.length > 0) {
          results.paragraphs.push(text);
        }
      });
      
      // Sample body text
      results.body_text_samples = document.body.innerText.split('\\n').filter(l => l.trim().length > 20).slice(0, 100);
      
      return results;
    });
    
    fs.writeFileSync('/tmp/all-data.json', JSON.stringify(data, null, 2));
    
    // Print summary
    console.log('Videos: ' + data.videos.length);
    console.log('Headings: ' + data.headings.length);
    console.log('Paragraphs: ' + data.paragraphs.length);
    console.log('Data saved to /tmp/all-data.json');
    
  } catch (error) {
    console.error('Error: ' + error.message);
  } finally {
    await browser.close();
  }
})();
