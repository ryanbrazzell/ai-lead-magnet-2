/**
 * PageLayout Component Tests
 *
 * Task Group 5.1: 4 focused tests for PageLayout functionality
 *
 * Tests validate:
 * 1. Renders Header, main content, and Footer
 * 2. Children render in main content area
 * 3. Header can be hidden via prop
 * 4. Footer can be hidden via prop
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageLayout } from '../page-layout';

describe('PageLayout Component', () => {
  /**
   * Test 1: Renders Header, main content, and Footer
   *
   * The PageLayout should compose Header and Footer components
   * around a main content area by default.
   */
  it('renders Header, main content, and Footer', () => {
    render(
      <PageLayout>
        <p>Page content</p>
      </PageLayout>
    );

    // Check for Header (banner role)
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Check for Footer (contentinfo role)
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  /**
   * Test 2: Children render in main content area
   *
   * Children passed to PageLayout should render within
   * the main content area with proper styling.
   */
  it('children render in main content area', () => {
    render(
      <PageLayout>
        <div data-testid="page-content">Test Content</div>
      </PageLayout>
    );

    const main = screen.getByRole('main');
    const content = screen.getByTestId('page-content');

    // Content should be within main
    expect(main).toContainElement(content);
    expect(content).toHaveTextContent('Test Content');
  });

  /**
   * Test 3: Header can be hidden via prop
   *
   * When showHeader is false, the Header component
   * should not be rendered.
   */
  it('Header can be hidden via showHeader prop', () => {
    render(
      <PageLayout showHeader={false}>
        <p>Content</p>
      </PageLayout>
    );

    // Header should not be present
    const header = screen.queryByRole('banner');
    expect(header).not.toBeInTheDocument();

    // Main and Footer should still be present
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  /**
   * Test 4: Footer can be hidden via prop
   *
   * When showFooter is false, the Footer component
   * should not be rendered.
   */
  it('Footer can be hidden via showFooter prop', () => {
    render(
      <PageLayout showFooter={false}>
        <p>Content</p>
      </PageLayout>
    );

    // Footer should not be present
    const footer = screen.queryByRole('contentinfo');
    expect(footer).not.toBeInTheDocument();

    // Header and Main should still be present
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
