/**
 * Layout Integration Tests
 *
 * Task Group 6.3: Integration tests for layout component composition
 *
 * Tests validate:
 * 1. Full page composition: PageLayout + HeroSection + FormLayout
 * 2. Props pass through correctly from PageLayout to Header/Footer
 * 3. Accessibility - semantic structure and keyboard navigation
 * 4. Design tokens applied consistently across all components
 */

import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PageLayout } from '../page-layout';
import { HeroSection } from '../hero-section';
import { FormLayout } from '../form-layout';

describe('Layout Integration Tests', () => {
  /**
   * Test 1: Full page composition renders all sections correctly
   *
   * Tests that PageLayout, HeroSection, and FormLayout work together
   * to create a complete page structure.
   */
  it('full page composition: PageLayout + HeroSection + FormLayout', () => {
    render(
      <PageLayout>
        <HeroSection
          headline={
            <>
              Get Your Free <strong>Time Freedom</strong> Report
            </>
          }
          subheadline="Discover insights in under 30 seconds"
        />
        <FormLayout>
          <div data-testid="form-content">
            <input type="email" placeholder="Enter your email" />
            <button type="submit">Get Report</button>
          </div>
        </FormLayout>
      </PageLayout>
    );

    // Verify Header renders
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('bg-navy');

    // Verify main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Verify HeroSection renders within main
    const heroHeadline = screen.getByTestId('hero-headline');
    expect(heroHeadline).toBeInTheDocument();
    expect(heroHeadline).toHaveTextContent('Get Your Free Time Freedom Report');

    // Verify subheadline renders
    const subheadline = screen.getByTestId('hero-subheadline');
    expect(subheadline).toHaveTextContent('Discover insights in under 30 seconds');

    // Verify FormLayout container renders
    const formLayoutContainer = screen.getByTestId('form-layout-container');
    expect(formLayoutContainer).toBeInTheDocument();
    expect(formLayoutContainer).toHaveClass('max-w-form');

    // Verify form content renders within FormLayout
    const formContent = screen.getByTestId('form-content');
    expect(formContent).toBeInTheDocument();

    // Verify SocialProof renders within FormLayout
    const checkmarks = screen.getAllByTestId('social-proof-checkmark');
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);

    // Verify Footer renders
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('bg-primary');
  });

  /**
   * Test 2: Props pass through from PageLayout to Header and Footer
   *
   * Tests that logo and footer disclaimer props are correctly
   * passed through to child components.
   */
  it('props pass through correctly from PageLayout to Header and Footer', () => {
    const customDisclaimer = 'Custom legal disclaimer for this page.';

    render(
      <PageLayout
        logo={<span data-testid="custom-logo">BRAND</span>}
        logoHref="/"
        footerDisclaimer={customDisclaimer}
      >
        <div>Page content</div>
      </PageLayout>
    );

    // Verify custom logo renders in Header
    const customLogo = screen.getByTestId('custom-logo');
    expect(customLogo).toBeInTheDocument();
    expect(customLogo).toHaveTextContent('BRAND');

    // Verify logo is wrapped in link with correct href
    const logoLink = screen.getByRole('link', { name: /go to homepage/i });
    expect(logoLink).toHaveAttribute('href', '/');

    // Verify custom footer disclaimer renders
    const disclaimer = screen.getByTestId('footer-disclaimer');
    expect(disclaimer).toHaveTextContent(customDisclaimer);
  });

  /**
   * Test 3: Accessibility - semantic structure
   *
   * Tests that the page has proper semantic HTML structure
   * with header, main, and footer landmarks.
   */
  it('accessibility - proper semantic HTML structure with landmarks', () => {
    render(
      <PageLayout>
        <HeroSection headline="Test Headline" />
        <FormLayout>
          <form aria-label="Test form">
            <label htmlFor="test-input">Test Input</label>
            <input id="test-input" type="text" />
          </form>
        </FormLayout>
      </PageLayout>
    );

    // Verify semantic landmarks are present
    const header = screen.getByRole('banner');
    expect(header.tagName).toBe('HEADER');

    const main = screen.getByRole('main');
    expect(main.tagName).toBe('MAIN');

    const footer = screen.getByRole('contentinfo');
    expect(footer.tagName).toBe('FOOTER');

    // Verify HeroSection has region with label
    const heroRegion = screen.getByRole('region', { name: /hero section/i });
    expect(heroRegion).toBeInTheDocument();

    // Verify heading hierarchy - h1 should be present
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();

    // Verify footer navigation has proper aria-label
    const footerNav = screen.getByRole('navigation', { name: /footer navigation/i });
    expect(footerNav).toBeInTheDocument();
  });

  /**
   * Test 4: Design tokens applied consistently across components
   *
   * Tests that design tokens (bg-navy, bg-primary, max-w-form, text-question)
   * are correctly applied to the appropriate components.
   */
  it('design tokens applied consistently across all components', () => {
    render(
      <PageLayout>
        <HeroSection headline="Test Headline" />
        <FormLayout>
          <div>Form content</div>
        </FormLayout>
      </PageLayout>
    );

    // Header uses bg-navy token
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-navy');

    // Footer uses bg-primary token
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-primary');

    // FormLayout uses max-w-form token
    const formContainer = screen.getByTestId('form-layout-container');
    expect(formContainer).toHaveClass('max-w-form');

    // HeroSection headline uses text-question token
    const headline = screen.getByTestId('hero-headline');
    expect(headline).toHaveClass('text-question');
  });

  /**
   * Test 5: Components compose without layout overlap
   *
   * Tests that composed components do not conflict or overlap visually
   * (verified via proper flexbox structure).
   */
  it('components compose with proper flexbox structure', () => {
    const { container } = render(
      <PageLayout>
        <HeroSection headline="Test" />
        <FormLayout>
          <div>Content</div>
        </FormLayout>
      </PageLayout>
    );

    // PageLayout wrapper should have flex column layout
    const pageWrapper = container.firstChild as HTMLElement;
    expect(pageWrapper).toHaveClass('flex');
    expect(pageWrapper).toHaveClass('flex-col');
    expect(pageWrapper).toHaveClass('min-h-screen');

    // Main content should have flex-1 to fill space
    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex-1');
  });

  /**
   * Test 6: FormLayout without SocialProof integrates correctly
   *
   * Tests that FormLayout can be used without SocialProof
   * and still integrates properly with PageLayout.
   */
  it('FormLayout integrates with PageLayout when SocialProof is hidden', () => {
    render(
      <PageLayout>
        <FormLayout showSocialProof={false}>
          <div data-testid="special-content">Special Form Content</div>
        </FormLayout>
      </PageLayout>
    );

    // Main structure should remain intact
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    // FormLayout container should render
    const formContainer = screen.getByTestId('form-layout-container');
    expect(formContainer).toBeInTheDocument();

    // Content should render
    expect(screen.getByTestId('special-content')).toBeInTheDocument();

    // SocialProof should NOT be present
    const checkmarks = screen.queryAllByTestId('social-proof-checkmark');
    expect(checkmarks).toHaveLength(0);
  });
});
