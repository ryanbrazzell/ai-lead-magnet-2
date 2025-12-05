/**
 * Tests for Email Template Generation (Task Group 2)
 *
 * These tests verify that the HTML and plain text email templates
 * are correctly generated with proper personalization and structure.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { generateEmailHtml, generateEmailText } from '../template';

describe('Email Template Generation', () => {
  // Mock the current year for consistent testing
  const mockYear = 2024;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${mockYear}-06-15T12:00:00.000Z`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Test 1: HTML template includes personalized firstName greeting
   */
  describe('HTML template personalization', () => {
    it('includes personalized firstName greeting when firstName provided', () => {
      const html = generateEmailHtml('John');

      expect(html).toContain('Hi John,');
      expect(html).not.toContain('Hi there,');
    });

    /**
     * Test 2: HTML template falls back to "there" when no firstName provided
     */
    it('falls back to "there" when no firstName provided', () => {
      const htmlNoName = generateEmailHtml();
      const htmlEmptyString = generateEmailHtml('');

      expect(htmlNoName).toContain('Hi there,');
      expect(htmlEmptyString).toContain('Hi there,');
    });
  });

  /**
   * Test 3: Plain text template mirrors HTML content structure
   */
  describe('Plain text template structure', () => {
    it('mirrors HTML content structure in plain text format', () => {
      const text = generateEmailText('Sarah');

      // Verify personalization
      expect(text).toContain('Hi Sarah,');

      // Verify key content sections exist
      expect(text).toContain('Your personalized Time Freedom Report');
      expect(text).toContain("What's Next?");
      expect(text).toContain('During your consultation');

      // Verify bullet points exist
      expect(text).toContain('Review your Time Freedom Report together');
      expect(text).toContain('Discuss your specific needs and preferences');
      expect(text).toContain('Show you how our EA matching process works');
      expect(text).toContain('Answer any questions you have');

      // Verify sign-off
      expect(text).toContain('Best regards');
      expect(text).toContain('The Assistant Launch Team');
    });

    it('falls back to "there" when no firstName provided in plain text', () => {
      const text = generateEmailText();

      expect(text).toContain('Hi there,');
    });
  });

  /**
   * Test 4: CTA button links to correct Calendly URL
   */
  describe('CTA button functionality', () => {
    it('CTA button in HTML links to correct Calendly URL', () => {
      const html = generateEmailHtml('Test');
      const expectedCalendlyUrl =
        'https://calendly.com/assistantlaunch/discovery-call';

      expect(html).toContain(`href="${expectedCalendlyUrl}"`);
      expect(html).toContain('Schedule Your Consultation');
    });

    it('plain text includes Calendly URL as text link', () => {
      const text = generateEmailText('Test');
      const expectedCalendlyUrl =
        'https://calendly.com/assistantlaunch/discovery-call';

      expect(text).toContain(expectedCalendlyUrl);
    });
  });

  /**
   * Test 5: Footer includes dynamic year
   */
  describe('Footer with dynamic year', () => {
    it('HTML footer includes dynamic current year in copyright', () => {
      const html = generateEmailHtml('Test');

      expect(html).toContain(`${mockYear} Assistant Launch`);
      expect(html).toContain('All rights reserved');
    });

    it('plain text footer includes dynamic current year', () => {
      const text = generateEmailText('Test');

      expect(text).toContain(`${mockYear} Assistant Launch`);
    });

    it('HTML footer includes assistantlaunch.com link', () => {
      const html = generateEmailHtml('Test');

      expect(html).toContain('href="https://assistantlaunch.com"');
      expect(html).toContain('assistantlaunch.com');
    });

    it('plain text footer includes assistantlaunch.com reference', () => {
      const text = generateEmailText('Test');

      expect(text).toContain('assistantlaunch.com');
    });
  });

  /**
   * Additional validation: HTML template styling
   */
  describe('HTML template styling', () => {
    it('contains proper header styling with dark background', () => {
      const html = generateEmailHtml('Test');

      expect(html).toContain('background-color: #141414');
      expect(html).toContain('color: white');
      expect(html).toContain('padding: 30px');
      expect(html).toContain('border-radius: 10px');
    });

    it('contains CTA button with green background and rounded corners', () => {
      const html = generateEmailHtml('Test');

      expect(html).toContain('background-color: #00cc6a');
      expect(html).toContain('border-radius: 25px');
    });

    it('contains proper HTML structure with DOCTYPE and charset', () => {
      const html = generateEmailHtml('Test');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('charset="utf-8"');
      expect(html).toContain('</html>');
    });
  });
});
