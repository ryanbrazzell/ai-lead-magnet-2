/**
 * Playwright E2E Test to Capture Visual Artifacts
 * Task Group 4.5: Generate visual test artifacts for founder review
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '../../../boundless-os/specs/2025-12-01-main-form-step1/verification/screenshots');

test.describe('Visual Test Artifacts - Desktop (1440px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('capture all 6 screens at desktop viewport', async ({ page }) => {
    await page.goto('/');

    // Screen 1: Name Collection
    await page.waitForSelector('input[placeholder="FIRST NAME"]');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-1-name.png`, fullPage: true });

    // Fill and proceed to Screen 2
    await page.fill('input[placeholder="FIRST NAME"]', 'John');
    await page.fill('input[placeholder="LAST NAME"]', 'Doe');
    await page.click('button:has-text("LET\'S START")');

    // Screen 2: Email Collection
    await page.waitForSelector('input[placeholder="BUSINESS EMAIL ADDRESS"]');
    await page.waitForTimeout(500); // Wait for animation
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-2-email.png`, fullPage: true });

    // Fill and proceed to Screen 3
    await page.fill('input[placeholder="BUSINESS EMAIL ADDRESS"]', 'john@example.com');
    await page.click('button:has-text("CONTINUE")');

    // Screen 3: Phone Collection
    await page.waitForSelector('input[placeholder="+1"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-3-phone.png`, fullPage: true });

    // Fill and proceed to Screen 4
    await page.fill('input[placeholder="+1"]', '1234567890');
    await page.click('button:has-text("CONTINUE")');

    // Screen 4: Employee Count
    await page.waitForSelector('input[placeholder="NUMBER OF EMPLOYEES"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-4-employees.png`, fullPage: true });

    // Fill and proceed to Screen 5
    await page.fill('input[placeholder="NUMBER OF EMPLOYEES"]', '25');
    await page.click('button:has-text("CONTINUE")');

    // Screen 5: Revenue Selection
    await page.waitForSelector('select');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-5-revenue.png`, fullPage: true });

    // Fill and proceed to Screen 6
    await page.selectOption('select', '$1M-$3M');
    await page.click('button:has-text("CONTINUE")');

    // Screen 6: Pain Points
    await page.waitForSelector('textarea');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-6-painpoints.png`, fullPage: true });
  });

  test('capture validation error states', async ({ page }) => {
    await page.goto('/');

    // Screen 1: Validation errors
    await page.waitForSelector('input[placeholder="FIRST NAME"]');
    await page.click('button:has-text("LET\'S START")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-1-validation-errors.png`, fullPage: true });

    // Navigate to Screen 2 for email validation
    await page.fill('input[placeholder="FIRST NAME"]', 'Test');
    await page.fill('input[placeholder="LAST NAME"]', 'User');
    await page.click('button:has-text("LET\'S START")');
    await page.waitForSelector('input[placeholder="BUSINESS EMAIL ADDRESS"]');

    // Enter invalid email
    await page.fill('input[placeholder="BUSINESS EMAIL ADDRESS"]', 'invalid-email');
    await page.click('button:has-text("CONTINUE")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/desktop-screen-2-email-validation-error.png`, fullPage: true });
  });
});

test.describe('Visual Test Artifacts - Mobile (375px)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('capture all 6 screens at mobile viewport', async ({ page }) => {
    await page.goto('/');

    // Screen 1: Name Collection
    await page.waitForSelector('input[placeholder="FIRST NAME"]');
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/mobile-screen-1-name.png`, fullPage: true });

    // Fill and proceed to Screen 2
    await page.fill('input[placeholder="FIRST NAME"]', 'Jane');
    await page.fill('input[placeholder="LAST NAME"]', 'Smith');
    await page.click('button:has-text("LET\'S START")');

    // Screen 2: Email Collection
    await page.waitForSelector('input[placeholder="BUSINESS EMAIL ADDRESS"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/mobile-screen-2-email.png`, fullPage: true });

    // Fill and proceed to Screen 3
    await page.fill('input[placeholder="BUSINESS EMAIL ADDRESS"]', 'jane@example.com');
    await page.click('button:has-text("CONTINUE")');

    // Screen 3: Phone Collection
    await page.waitForSelector('input[placeholder="+1"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/mobile-screen-3-phone.png`, fullPage: true });

    // Fill and proceed to Screen 4
    await page.fill('input[placeholder="+1"]', '5551234567');
    await page.click('button:has-text("CONTINUE")');

    // Screen 4: Employee Count
    await page.waitForSelector('input[placeholder="NUMBER OF EMPLOYEES"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/mobile-screen-4-employees.png`, fullPage: true });

    // Fill and proceed to Screen 5
    await page.fill('input[placeholder="NUMBER OF EMPLOYEES"]', '50');
    await page.click('button:has-text("CONTINUE")');

    // Screen 5: Revenue Selection
    await page.waitForSelector('select');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/mobile-screen-5-revenue.png`, fullPage: true });

    // Fill and proceed to Screen 6
    await page.selectOption('select', '$3M-$10M');
    await page.click('button:has-text("CONTINUE")');

    // Screen 6: Pain Points
    await page.waitForSelector('textarea');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/mobile-screen-6-painpoints.png`, fullPage: true });
  });
});
