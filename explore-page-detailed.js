const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    console.log('Navigating to https://report.assistantlaunch.com/...');
    await page.goto('https://report.assistantlaunch.com/', { waitUntil: 'networkidle', timeout: 30000 });
    
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log('Page height: ' + pageHeight);
    
    let scrollPosition = 0;
    const scrollIncrement = 300;
    
    while (scrollPosition < pageHeight + 1000) {
      await page.evaluate((pos) => {
        window.scrollTo(0, pos);
      }, scrollPosition);
      
      await page.waitForTimeout(300);
      scrollPosition += scrollIncrement;
    }
    
    const data = await page.evaluate(() => {
      const testimonials = [];
      
      const testimonialContainers = document.querySelectorAll('[class*="testimonial"], [class*="quote"], [class*="review"], [class*="client"], .card, [data-testid*="testimonial"]');
      
      testimonialContainers.forEach((container) => {
        const text = container.innerText || '';
        
        if (text.length > 30) {
          const testimonial = {
            raw_text: text,
            html_classes: container.className,
            html_id: container.id
          };
          
          // Look for patterns like "Name - Title" or just text
          const lines = text.split('\\n').filter(line => line.trim().length > 0);
          if (lines.length > 0) {
            testimonial.lines = lines;
          }
          
          testimonials.push(testimonial);
        }
      });
      
      return {
        testimonials: testimonials.slice(0, 50),
        totalTestimonialContainers: testimonialContainers.length
      };
    });
    
    console.log('Found testimonial containers: ' + data.totalTestimonialContainers);
    console.log('Extracted testimonials: ' + data.testimonials.length);
    
    fs.writeFileSync('/tmp/exploration-detailed.json', JSON.stringify(data, null, 2));
    console.log('Detailed results saved');
    
  } catch (error) {
    console.error('Error: ' + error.message);
  } finally {
    await browser.close();
  }
})();
