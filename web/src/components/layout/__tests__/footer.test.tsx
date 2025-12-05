/**
 * Footer Component Tests
 *
 * Task Group 2.1: 4 focused tests for Footer functionality
 *
 * Tests validate:
 * 1. Renders with purple background (bg-primary)
 * 2. Placeholder links render (Privacy Policy, Terms of Service)
 * 3. Disclaimer text renders
 * 4. Responsive behavior (links stack on mobile, inline on desktop)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../footer';

describe('Footer Component', () => {
  /**
   * Test 1: Renders with purple background (bg-primary)
   *
   * The footer must use the bg-primary design token (#6F00FF)
   * for consistent branding with the acquisition.com aesthetic.
   */
  it('renders with purple background (bg-primary)', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('bg-primary');
  });

  /**
   * Test 2: Placeholder links render (Privacy Policy, Terms of Service)
   *
   * By default, both links should render with href="#" as placeholders.
   * When custom hrefs are provided, they should be used.
   */
  it('placeholder links render (Privacy Policy, Terms of Service)', () => {
    render(<Footer />);

    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    const termsLink = screen.getByRole('link', { name: /terms of service/i });

    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '#');

    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '#');
  });

  /**
   * Test 3: Disclaimer text renders
   *
   * The footer should display a legal disclaimer text,
   * either the default or a custom one provided via prop.
   */
  it('disclaimer text renders', () => {
    render(<Footer />);

    const disclaimer = screen.getByTestId('footer-disclaimer');
    expect(disclaimer).toBeInTheDocument();

    // Default disclaimer should contain results warning
    expect(disclaimer.textContent).toContain('Results are not typical');
  });

  /**
   * Test 4: Responsive behavior - links use flex layout
   *
   * Links should be in a flex container that stacks on mobile
   * (flex-col) and displays inline on desktop (md:flex-row).
   */
  it('responsive behavior - links use flex layout for mobile/desktop', () => {
    render(<Footer />);

    // Find the navigation element containing links
    const nav = screen.getByRole('navigation', { name: /footer navigation/i });
    expect(nav).toBeInTheDocument();

    // Check for responsive flex classes
    expect(nav).toHaveClass('flex');
    expect(nav).toHaveClass('flex-col');
    expect(nav.className).toMatch(/md:flex-row/);
  });

  /**
   * Test 5: Custom href props are applied to links
   *
   * When privacyHref and termsHref are provided, they should
   * be used instead of the default "#" placeholders.
   */
  it('custom href props are applied to links', () => {
    render(<Footer privacyHref="/privacy" termsHref="/terms" />);

    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    const termsLink = screen.getByRole('link', { name: /terms of service/i });

    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toHaveAttribute('href', '/terms');
  });

  /**
   * Test 6: Custom disclaimer text renders when provided
   *
   * When a custom disclaimer prop is provided, it should
   * replace the default disclaimer text.
   */
  it('custom disclaimer text renders when provided', () => {
    const customDisclaimer = 'Custom legal disclaimer for testing purposes.';

    render(<Footer disclaimer={customDisclaimer} />);

    const disclaimer = screen.getByTestId('footer-disclaimer');
    expect(disclaimer).toHaveTextContent(customDisclaimer);
  });

  /**
   * Test 7: Links have minimum touch target size (44px)
   *
   * For accessibility, links should have min-h-11 class
   * to ensure adequate touch targets.
   */
  it('links have minimum touch target size for accessibility', () => {
    render(<Footer />);

    const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
    const termsLink = screen.getByRole('link', { name: /terms of service/i });

    // Check for minimum height class (min-h-11 = 44px)
    expect(privacyLink).toHaveClass('min-h-11');
    expect(termsLink).toHaveClass('min-h-11');
  });
});
