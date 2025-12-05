/**
 * Header Component Tests
 *
 * Task Group 1.1: 4 focused tests for Header functionality
 *
 * Tests validate:
 * 1. Renders with placeholder logo when no logo prop provided
 * 2. Logo is clickable when href prop is provided
 * 3. Navy background color is applied (bg-navy)
 * 4. Responsive behavior - logo positioning (left-aligned)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../header';

describe('Header Component', () => {
  /**
   * Test 1: Renders with placeholder logo when no logo prop provided
   *
   * When no logo prop is provided, the Header should display
   * a placeholder "LOGO" text to indicate where branding goes.
   */
  it('renders with placeholder logo when no logo prop provided', () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // Should display placeholder text
    expect(screen.getByText('LOGO')).toBeInTheDocument();
  });

  /**
   * Test 2: Logo is clickable when href prop is provided
   *
   * When href prop is passed, the logo should be wrapped in an
   * anchor tag that links to the specified URL.
   */
  it('logo is clickable when href prop is provided', () => {
    render(<Header href="/" />);

    const logoLink = screen.getByRole('link', { name: /go to homepage/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  /**
   * Test 3: Navy background color is applied (bg-navy)
   *
   * The header must use the bg-navy design token (#1A1A2E)
   * for consistent branding with the acquisition.com aesthetic.
   */
  it('navy background color is applied (bg-navy)', () => {
    render(<Header />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-navy');
  });

  /**
   * Test 4: Responsive behavior - logo positioning
   *
   * Logo should be left-aligned on mobile and desktop.
   * Header should have proper padding and height.
   */
  it('responsive behavior - proper dimensions and padding', () => {
    render(<Header />);

    const header = screen.getByRole('banner');

    // Check for full width
    expect(header).toHaveClass('w-full');

    // Check for proper height (h-16 or h-20)
    expect(header.className).toMatch(/h-16|h-20/);

    // Check for horizontal padding
    expect(header.className).toMatch(/px-4|px-6/);
  });

  /**
   * Additional test: Logo renders as img when string src is provided
   */
  it('logo renders as img element when string src is provided', () => {
    render(<Header logo="/images/logo.png" />);

    const logoImg = screen.getByRole('img', { name: /logo/i });
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/images/logo.png');
  });

  /**
   * Additional test: Logo renders React node directly
   */
  it('logo renders React node directly when provided', () => {
    render(
      <Header logo={<span data-testid="custom-logo">Custom Logo</span>} />
    );

    const customLogo = screen.getByTestId('custom-logo');
    expect(customLogo).toBeInTheDocument();
    expect(customLogo).toHaveTextContent('Custom Logo');
  });
});
