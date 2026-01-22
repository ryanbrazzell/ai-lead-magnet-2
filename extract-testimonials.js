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
    console.log('Page height: ' + pageHeight);
    
    let scrollPosition = 0;
    while (scrollPosition < pageHeight + 500) {
      await page.evaluate((pos) => { window.scrollTo(0, pos); }, scrollPosition);
      await page.waitForTimeout(200);
      scrollPosition += 300;
    }
    
    const data = await page.evaluate(() => {
      const testimonials = [];
      
      // Get all visible text blocks that might be testimonials
      const allElements = document.querySelectorAll('*');
      
      // Look for common testimonial patterns
      allElements.forEach(el => {
        const text = el.innerText || '';
        const html = el.innerHTML || '';
        
        // Check if this looks like it contains a testimonial (initials or name patterns)
        if (text.includes('KF') || text.includes('DH') || text.includes('JK') || text.includes('MS') ||
            (text.length > 80 && text.includes('Founder') && text.length < 500)) {
          
          // Try to parse the testimonial
          const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
          
          if (lines.length >= 2) {
            testimonials.push({
              raw: text,
              lines: lines,
              className: el.className,
              tagName: el.tagName
            });
          }
        }
      });
      
      // Also look specifically for elements with role or specific structure
      const structuredTestimonials = [];
      
      // Look for patterns: quote text followed by name and title
      document.querySelectorAll('[class*="testimonial"], [class*="card"], [class*="review"], article, section').forEach(section => {
        const sectionText = section.innerText || '';
        if (sectionText.length > 100 && sectionText.length < 800) {
          const lines = sectionText.split('\\n').map(l => l.trim()).filter(l => l);
          
          if (lines.length >= 2) {
            structuredTestimonials.push({
              text: sectionText,
              lines: lines,
              structure: {
                firstLine: lines[0],
                lastLine: lines[lines.length - 1],
                allLines: lines
              }
            });
          }
        }
      });
      
      return {
        allTestimonials: testimonials.slice(0, 50),
        structuredTestimonials: structuredTestimonials.slice(0, 30),
        totalElements: allElements.length
      };
    });
    
    fs.writeFileSync('/tmp/testimonials-extracted.json', JSON.stringify(data, null, 2));
    console.log('Testimonials extracted');
    
  } catch (error) {
    console.error('Error: ' + error.message);
  } finally {
    await browser.close();
  }
})();
