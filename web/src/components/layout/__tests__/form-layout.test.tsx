/**
 * FormLayout Component Tests
 *
 * Task Group 4.1: 4 focused tests for FormLayout functionality
 *
 * Tests validate:
 * 1. Renders children content within the container
 * 2. SocialProof component appears below children
 * 3. Centered layout with max-width constraint (max-w-form)
 * 4. SocialProof props can be customized
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormLayout } from '../form-layout';

describe('FormLayout Component', () => {
  /**
   * Test 1: Renders children content within the container
   *
   * The FormLayout must render any children passed to it,
   * allowing form steps to be composed inside.
   */
  it('renders children content', () => {
    render(
      <FormLayout>
        <div data-testid="child-content">Form Step Content</div>
      </FormLayout>
    );

    const childContent = screen.getByTestId('child-content');
    expect(childContent).toBeInTheDocument();
    expect(childContent).toHaveTextContent('Form Step Content');
  });

  /**
   * Test 2: SocialProof component appears below children
   *
   * By default, the SocialProof component should render below
   * the children content with default props.
   */
  it('SocialProof component appears below children', () => {
    render(
      <FormLayout>
        <div data-testid="form-content">Form Content</div>
      </FormLayout>
    );

    // Check that SocialProof is rendered (checkmarks are a key indicator)
    const checkmarks = screen.getAllByTestId('social-proof-checkmark');
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);

    // Verify default text content appears
    expect(
      screen.getByText('Get Your Report in Less than 60 Seconds')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Trusted by Business Owners Worldwide')
    ).toBeInTheDocument();
  });

  /**
   * Test 3: Centered layout with max-width constraint
   *
   * The FormLayout container must use the max-w-form design token (650px)
   * and be centered with mx-auto.
   */
  it('centered layout with max-width constraint', () => {
    render(
      <FormLayout>
        <div>Test Content</div>
      </FormLayout>
    );

    const container = screen.getByTestId('form-layout-container');
    expect(container).toBeInTheDocument();

    // Check for max-width and centering classes
    expect(container).toHaveClass('max-w-form');
    expect(container).toHaveClass('mx-auto');
  });

  /**
   * Test 4: SocialProof props can be customized
   *
   * The FormLayout should pass through custom props to the
   * SocialProof component, allowing customization of copy.
   */
  it('SocialProof props can be customized', () => {
    const customSpeedPromise = 'Get Results Instantly';
    const customSocialCount = 'Used by 1 Million+ Users';
    const customConsentText = 'Custom consent text here';

    render(
      <FormLayout
        speedPromise={customSpeedPromise}
        socialCount={customSocialCount}
        consentText={customConsentText}
      >
        <div>Form Content</div>
      </FormLayout>
    );

    expect(screen.getByText(customSpeedPromise)).toBeInTheDocument();
    expect(screen.getByText(customSocialCount)).toBeInTheDocument();
    expect(screen.getByText(customConsentText)).toBeInTheDocument();
  });

  /**
   * Additional test: SocialProof can be hidden via showSocialProof prop
   *
   * When showSocialProof is false, the SocialProof component
   * should not be rendered.
   */
  it('SocialProof can be hidden via showSocialProof prop', () => {
    render(
      <FormLayout showSocialProof={false}>
        <div data-testid="form-content">Form Content</div>
      </FormLayout>
    );

    // Form content should still render
    expect(screen.getByTestId('form-content')).toBeInTheDocument();

    // SocialProof checkmarks should not be present
    const checkmarks = screen.queryAllByTestId('social-proof-checkmark');
    expect(checkmarks).toHaveLength(0);
  });
});
