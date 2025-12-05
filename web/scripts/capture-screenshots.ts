/**
 * Playwright Script to Capture Screenshots
 * Task Group 4.5: Generate visual test artifacts for founder review
 *
 * Captures:
 * - Desktop (1440px): All 6 screens in normal state
 * - Mobile (375px): All 6 screens in normal state
 * - Error states: Screen 1 with validation errors, Screen 2 with email error
 * - Loading states: Screen 1 button loading
 */

import { chromium } from 'playwright';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '../../../boundless-os/specs/2025-12-01-main-form-step1/verification/screenshots');
const BASE_URL = 'http://localhost:3000';

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });

  console.log('Starting screenshot capture...');

  // Desktop viewport (1440px)
  await captureDesktopScreenshots(browser);

  // Mobile viewport (375px)
  await captureMobileScreenshots(browser);

  // Error states
  await captureErrorStates(browser);

  await browser.close();
  console.log('Screenshot capture complete!');
}

async function captureDesktopScreenshots(browser: any) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Capturing desktop screenshots (1440px)...');

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Screen 1: Name Collection
  await page.waitForSelector('input[placeholder="FIRST NAME"]');
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-1-name.png`,
    fullPage: true
  });
  console.log('✓ Desktop Screen 1 captured');

  // Fill Screen 1 and navigate to Screen 2
  await page.fill('input[placeholder="FIRST NAME"]', 'John');
  await page.fill('input[placeholder="LAST NAME"]', 'Doe');
  await page.click('button:has-text("LET\'S START")');

  // Screen 2: Email Collection
  await page.waitForSelector('input[placeholder="BUSINESS EMAIL ADDRESS"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-2-email.png`,
    fullPage: true
  });
  console.log('✓ Desktop Screen 2 captured');

  // Fill Screen 2 and navigate to Screen 3
  await page.fill('input[placeholder="BUSINESS EMAIL ADDRESS"]', 'john@example.com');
  await page.click('button:has-text("CONTINUE")');

  // Screen 3: Phone Collection
  await page.waitForSelector('input[placeholder="+1"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-3-phone.png`,
    fullPage: true
  });
  console.log('✓ Desktop Screen 3 captured');

  // Fill Screen 3 and navigate to Screen 4
  await page.fill('input[placeholder="+1"]', '1234567890');
  await page.click('button:has-text("CONTINUE")');

  // Screen 4: Employee Count
  await page.waitForSelector('input[placeholder="NUMBER OF EMPLOYEES"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-4-employees.png`,
    fullPage: true
  });
  console.log('✓ Desktop Screen 4 captured');

  // Fill Screen 4 and navigate to Screen 5
  await page.fill('input[placeholder="NUMBER OF EMPLOYEES"]', '25');
  await page.click('button:has-text("CONTINUE")');

  // Screen 5: Revenue Selection
  await page.waitForSelector('select', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-5-revenue.png`,
    fullPage: true
  });
  console.log('✓ Desktop Screen 5 captured');

  // Fill Screen 5 and navigate to Screen 6
  await page.selectOption('select', '$1M-$3M');
  await page.click('button:has-text("CONTINUE")');

  // Screen 6: Pain Points
  await page.waitForSelector('textarea[placeholder*="PAIN POINTS"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-6-painpoints.png`,
    fullPage: true
  });
  console.log('✓ Desktop Screen 6 captured');

  await context.close();
}

async function captureMobileScreenshots(browser: any) {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();

  console.log('Capturing mobile screenshots (375px)...');

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Screen 1: Name Collection
  await page.waitForSelector('input[placeholder="FIRST NAME"]');
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/mobile-screen-1-name.png`,
    fullPage: true
  });
  console.log('✓ Mobile Screen 1 captured');

  // Fill Screen 1 and navigate to Screen 2
  await page.fill('input[placeholder="FIRST NAME"]', 'Jane');
  await page.fill('input[placeholder="LAST NAME"]', 'Smith');
  await page.click('button:has-text("LET\'S START")');

  // Screen 2: Email Collection
  await page.waitForSelector('input[placeholder="BUSINESS EMAIL ADDRESS"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/mobile-screen-2-email.png`,
    fullPage: true
  });
  console.log('✓ Mobile Screen 2 captured');

  // Fill Screen 2 and navigate to Screen 3
  await page.fill('input[placeholder="BUSINESS EMAIL ADDRESS"]', 'jane@example.com');
  await page.click('button:has-text("CONTINUE")');

  // Screen 3: Phone Collection
  await page.waitForSelector('input[placeholder="+1"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/mobile-screen-3-phone.png`,
    fullPage: true
  });
  console.log('✓ Mobile Screen 3 captured');

  // Fill Screen 3 and navigate to Screen 4
  await page.fill('input[placeholder="+1"]', '5551234567');
  await page.click('button:has-text("CONTINUE")');

  // Screen 4: Employee Count
  await page.waitForSelector('input[placeholder="NUMBER OF EMPLOYEES"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/mobile-screen-4-employees.png`,
    fullPage: true
  });
  console.log('✓ Mobile Screen 4 captured');

  // Fill Screen 4 and navigate to Screen 5
  await page.fill('input[placeholder="NUMBER OF EMPLOYEES"]', '50');
  await page.click('button:has-text("CONTINUE")');

  // Screen 5: Revenue Selection
  await page.waitForSelector('select', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/mobile-screen-5-revenue.png`,
    fullPage: true
  });
  console.log('✓ Mobile Screen 5 captured');

  // Fill Screen 5 and navigate to Screen 6
  await page.selectOption('select', '$3M-$10M');
  await page.click('button:has-text("CONTINUE")');

  // Screen 6: Pain Points
  await page.waitForSelector('textarea[placeholder*="PAIN POINTS"]', { timeout: 5000 });
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/mobile-screen-6-painpoints.png`,
    fullPage: true
  });
  console.log('✓ Mobile Screen 6 captured');

  await context.close();
}

async function captureErrorStates(browser: any) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Capturing error states...');

  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Screen 1: Validation errors (try to submit empty form)
  await page.waitForSelector('input[placeholder="FIRST NAME"]');
  await page.click('button:has-text("LET\'S START")');
  await page.waitForTimeout(500); // Wait for validation
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-1-validation-errors.png`,
    fullPage: true
  });
  console.log('✓ Screen 1 validation errors captured');

  // Navigate to Screen 2 and show email validation error
  await page.fill('input[placeholder="FIRST NAME"]', 'Test');
  await page.fill('input[placeholder="LAST NAME"]', 'User');
  await page.click('button:has-text("LET\'S START")');
  await page.waitForSelector('input[placeholder="BUSINESS EMAIL ADDRESS"]', { timeout: 5000 });

  // Enter invalid email
  await page.fill('input[placeholder="BUSINESS EMAIL ADDRESS"]', 'invalid-email');
  await page.click('button:has-text("CONTINUE")');
  await page.waitForTimeout(500); // Wait for validation
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/desktop-screen-2-email-validation-error.png`,
    fullPage: true
  });
  console.log('✓ Screen 2 email validation error captured');

  await context.close();
}

captureScreenshots().catch(console.error);
