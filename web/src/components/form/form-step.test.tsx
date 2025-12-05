/**
 * FormStep Component Tests
 *
 * Task 4.1: 5 focused tests for FormStep functionality
 * Updated for Task 8: Responsive Behavior Implementation
 *
 * Tests validate:
 * 1. Question text renders at 32px with bold keywords
 * 2. Container has max-width of 650px and is centered
 * 3. Vertical spacing between elements is 24-32px
 * 4. Side-by-side layout works for name fields (responsive: single column mobile, 2 columns tablet+)
 * 5. 2x2 grid layout works for address fields (responsive)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormStep } from './form-step';

describe('FormStep Component', () => {
  /**
   * Test 1: Question text renders at 32px with bold keywords
   *
   * The question should use the text-question class (32px, bold)
   * and support <strong> tags for keyword emphasis.
   */
  it('question text renders at 32px with bold keywords', () => {
    render(
      <FormStep question="What's your <strong>name</strong>?" layout="single">
        <input type="text" placeholder="Name" />
      </FormStep>
    );

    // Check that the question is rendered
    const questionElement = screen.getByTestId('form-step-question');
    expect(questionElement).toBeInTheDocument();

    // Check for text-question class (32px font size)
    expect(questionElement).toHaveClass('text-question');

    // Check that the strong tag is rendered within the question
    const strongElement = questionElement.querySelector('strong');
    expect(strongElement).toBeInTheDocument();
    expect(strongElement).toHaveTextContent('name');
  });

  /**
   * Test 2: Container has max-width of 650px and is centered
   *
   * The FormStep container should be constrained to 650px max-width
   * and horizontally centered using mx-auto.
   */
  it('container has max-width of 650px and is centered', () => {
    render(
      <FormStep question="Test question" layout="single">
        <input type="text" />
      </FormStep>
    );

    const container = screen.getByTestId('form-step-container');
    expect(container).toBeInTheDocument();

    // Check for max-width class (max-w-[650px] or max-w-form)
    expect(container.className).toMatch(/max-w-\[650px\]|max-w-form/);

    // Check for centering class
    expect(container).toHaveClass('mx-auto');
  });

  /**
   * Test 3: Vertical spacing between elements is 24-32px
   *
   * The FormStep should have consistent vertical spacing
   * between question, inputs, and other elements (space-y-6 or space-y-8).
   */
  it('vertical spacing between elements is 24-32px', () => {
    render(
      <FormStep question="Test question" layout="single">
        <input type="text" />
      </FormStep>
    );

    const container = screen.getByTestId('form-step-container');

    // Check for vertical spacing class (space-y-6 = 24px or space-y-8 = 32px)
    expect(container.className).toMatch(/space-y-6|space-y-8/);
  });

  /**
   * Test 4: Side-by-side layout works for name fields
   *
   * When layout is 'side-by-side', the children should be arranged
   * in a two-column grid with gap spacing (responsive at tablet+ breakpoint).
   *
   * Task Group 8 Update: Now uses responsive classes
   * - Mobile (< 768px): grid-cols-1 (single column)
   * - Tablet+ (768px+): tablet:grid-cols-2 (two columns)
   */
  it('side-by-side layout works for name fields', () => {
    render(
      <FormStep question="What's your <strong>name</strong>?" layout="side-by-side">
        <input type="text" placeholder="First Name" />
        <input type="text" placeholder="Last Name" />
      </FormStep>
    );

    const childrenContainer = screen.getByTestId('form-step-children');
    expect(childrenContainer).toBeInTheDocument();

    // Check for grid layout
    expect(childrenContainer).toHaveClass('grid');

    // Check for responsive column classes (Task Group 8)
    // Mobile: grid-cols-1, Tablet+: tablet:grid-cols-2
    expect(childrenContainer).toHaveClass('grid-cols-1');
    expect(childrenContainer.className).toMatch(/tablet:grid-cols-2/);

    // Check for gap spacing
    expect(childrenContainer.className).toMatch(/gap-4|gap-\[16px\]/);
  });

  /**
   * Test 5: 2x2 grid layout works for address fields
   *
   * When layout is 'address-grid', the container should support:
   * - Full-width street address
   * - 2x2 grid for city/state/country/zip
   *
   * Task Group 8 Update: Responsive at tablet+ breakpoint
   */
  it('2x2 grid layout works for address fields', () => {
    render(
      <FormStep question="Whats your <strong>shipping address</strong>?" layout="address-grid">
        <input type="text" placeholder="Street Address" data-field="street" />
        <input type="text" placeholder="City" data-field="city" />
        <input type="text" placeholder="State/Region" data-field="state" />
        <input type="text" placeholder="Country/Region" data-field="country" />
        <input type="text" placeholder="Zip Code / Postal" data-field="zip" />
      </FormStep>
    );

    const childrenContainer = screen.getByTestId('form-step-children');
    expect(childrenContainer).toBeInTheDocument();

    // Check for address-grid layout container
    // The container should have grid classes for the 2-column layout
    expect(childrenContainer).toHaveClass('grid');

    // For address-grid, we should have responsive layout:
    // Mobile: grid-cols-1, Tablet+: tablet:grid-cols-2
    expect(childrenContainer).toHaveClass('grid-cols-1');
    expect(childrenContainer.className).toMatch(/tablet:grid-cols-2|gap-4/);
  });
});
