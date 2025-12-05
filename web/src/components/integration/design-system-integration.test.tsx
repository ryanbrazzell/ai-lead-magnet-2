/**
 * Design System Integration Tests
 *
 * Task Group 9: Critical Gap Analysis - Strategic Tests
 *
 * These tests validate integration points and accessibility requirements
 * that are not fully covered by individual component tests:
 *
 * 1. Integration test: Full form step with PillButton + FormInput + FormStep
 * 2. Animation test: Verify `prefers-reduced-motion` is respected
 * 3. Accessibility test: ARIA attributes and focusability validation
 * 4. Component composition: Color psychology journey integration
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { PillButton } from '../ui/pill-button';
import { FormInput } from '../ui/form-input';
import { FormStep } from '../form/form-step';
import { StepNavigation } from '../form/step-navigation';
import { SocialProof } from '../form/social-proof';
import { useButtonVariant } from '@/hooks/use-button-variant';
import { renderHook } from '@testing-library/react';

/**
 * Helper to mock window.matchMedia for reduced motion tests
 */
function mockReducedMotion(prefersReducedMotion: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? prefersReducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe('Design System Integration Tests', () => {
  beforeEach(() => {
    // Default to no reduced motion preference
    mockReducedMotion(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 1: Full Form Step Integration
   *
   * Validates that FormStep, FormInput, and PillButton work together
   * as a cohesive form experience with proper styling and layout.
   */
  describe('Full Form Step Integration', () => {
    it('renders complete form step with FormInput and PillButton', () => {
      render(
        <FormStep question="What's your <strong>name</strong>?" layout="side-by-side">
          <FormInput type="text" placeholder="First Name" data-testid="first-name" />
          <FormInput type="text" placeholder="Last Name" data-testid="last-name" />
        </FormStep>
      );

      // Verify FormStep container renders
      const container = screen.getByTestId('form-step-container');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('max-w-[650px]');
      expect(container).toHaveClass('mx-auto');

      // Verify question with bold keyword renders
      const question = screen.getByTestId('form-step-question');
      expect(question).toHaveClass('text-question');
      const strongElement = question.querySelector('strong');
      expect(strongElement).toHaveTextContent('name');

      // Verify both inputs render with design system styling
      const firstName = screen.getByTestId('first-name');
      const lastName = screen.getByTestId('last-name');
      expect(firstName).toHaveClass('bg-input-bg');
      expect(lastName).toHaveClass('bg-input-bg');
    });

    it('integrates PillButton with color psychology hook', () => {
      // Test that useButtonVariant properly integrates with PillButton
      const { result: step0 } = renderHook(() =>
        useButtonVariant({ currentStep: 0, hasError: false })
      );

      render(
        <PillButton variant={step0.current.variant}>
          {step0.current.label}
        </PillButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveTextContent("LET'S START");
    });

    it('renders complete form flow with navigation and social proof', () => {
      const handlePrevious = vi.fn();

      render(
        <div>
          <FormStep question="Where should I <strong>email</strong> it to?" layout="single">
            <FormInput type="email" placeholder="Email Address" data-testid="email" />
          </FormStep>
          <div className="mt-4 flex flex-col items-center gap-4">
            <PillButton variant="progress">CONTINUE</PillButton>
            <StepNavigation currentStep={1} onPrevious={handlePrevious} />
            <SocialProof
              speedPromise="Get Your Roadmap in 30 Seconds"
              socialCount="250,000+ Business Owners"
              consentText="By providing your information..."
            />
          </div>
        </div>
      );

      // Verify all components render together
      expect(screen.getByTestId('email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toHaveClass('bg-progress');
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByText(/30 Seconds/)).toBeInTheDocument();
    });
  });

  /**
   * Test 2: Reduced Motion Animation Test
   *
   * Validates that animations respect the `prefers-reduced-motion` media query.
   */
  describe('Reduced Motion Support', () => {
    it('PillButton uses motion-safe prefix for hover animations', () => {
      render(<PillButton>Test Button</PillButton>);

      const button = screen.getByRole('button');

      // Check that hover animations use motion-safe prefix
      expect(button.className).toMatch(/motion-safe:hover:-translate-y-\[2px\]/);
      expect(button.className).toMatch(/motion-safe:hover:shadow-lg/);
    });

    it('PillButton has reduced motion fallback for hover state', () => {
      mockReducedMotion(true);

      render(<PillButton>Test Button</PillButton>);

      const button = screen.getByRole('button');

      // Verify reduced motion fallback classes exist
      expect(button.className).toMatch(/motion-reduce:hover:opacity-90/);
    });
  });

  /**
   * Test 3: Accessibility - ARIA Attributes and Focusability
   *
   * Validates that form components have proper ARIA attributes
   * and are properly focusable.
   */
  describe('Accessibility - ARIA Attributes and Focusability', () => {
    it('FormInput has proper ARIA attributes for error state', () => {
      render(
        <FormInput
          type="text"
          id="test-field"
          placeholder="Test Field"
          error="This field is required"
          data-testid="test-input"
        />
      );

      const input = screen.getByTestId('test-input');

      // Verify aria-invalid is set
      expect(input).toHaveAttribute('aria-invalid', 'true');

      // Verify error message has role="alert"
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('This field is required');
    });

    it('PillButton has proper aria-disabled when loading', () => {
      render(<PillButton loading>Loading...</PillButton>);

      const button = screen.getByRole('button');

      // Verify aria-disabled and disabled attribute
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
    });

    it('form inputs are focusable and have no tabindex restrictions', () => {
      render(
        <FormStep question="Test Question" layout="side-by-side">
          <FormInput type="text" placeholder="First" data-testid="first" />
          <FormInput type="text" placeholder="Second" data-testid="second" />
        </FormStep>
      );

      const firstInput = screen.getByTestId('first');
      const secondInput = screen.getByTestId('second');

      // Verify inputs are focusable (no negative tabindex)
      expect(firstInput).not.toHaveAttribute('tabindex', '-1');
      expect(secondInput).not.toHaveAttribute('tabindex', '-1');

      // Verify inputs are not disabled
      expect(firstInput).not.toBeDisabled();
      expect(secondInput).not.toBeDisabled();

      // Verify inputs have the correct type for form semantics
      expect(firstInput).toHaveAttribute('type', 'text');
      expect(secondInput).toHaveAttribute('type', 'text');
    });

    it('StepNavigation button is clickable and triggers callback', () => {
      const handlePrevious = vi.fn();

      render(<StepNavigation currentStep={1} onPrevious={handlePrevious} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });

      // Verify button is not disabled
      expect(previousButton).not.toBeDisabled();

      // Click the button
      fireEvent.click(previousButton);

      // Verify callback was triggered
      expect(handlePrevious).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Test 4: Color Psychology Journey Component Composition
   *
   * Validates that the color psychology journey works correctly
   * when components are composed together in a real-world scenario.
   */
  describe('Color Psychology Journey Composition', () => {
    it('renders correct button variants for each step of the journey', () => {
      // Step 0: Purple "LET'S START"
      const { result: step0Result } = renderHook(() =>
        useButtonVariant({ currentStep: 0, hasError: false })
      );
      expect(step0Result.current.variant).toBe('primary');
      expect(step0Result.current.label).toBe("LET'S START");

      // Step 1: Yellow "CONTINUE"
      const { result: step1Result } = renderHook(() =>
        useButtonVariant({ currentStep: 1, hasError: false })
      );
      expect(step1Result.current.variant).toBe('progress');
      expect(step1Result.current.label).toBe('CONTINUE');

      // Step 3 (address): Purple "CONTINUE"
      const { result: step3Result } = renderHook(() =>
        useButtonVariant({ currentStep: 3, hasError: false })
      );
      expect(step3Result.current.variant).toBe('primary');
      expect(step3Result.current.label).toBe('CONTINUE');

      // Final step: Purple "GET MY ROADMAP"
      const { result: finalResult } = renderHook(() =>
        useButtonVariant({ currentStep: 4, hasError: false, isFinalStep: true })
      );
      expect(finalResult.current.variant).toBe('primary');
      expect(finalResult.current.label).toBe('GET MY ROADMAP');
    });

    it('renders error state correctly with disabled button', () => {
      const { result } = renderHook(() =>
        useButtonVariant({ currentStep: 1, hasError: true })
      );

      render(
        <div>
          <FormInput
            type="email"
            placeholder="Email"
            error="Please enter a valid email"
            data-testid="email-input"
          />
          <PillButton variant={result.current.variant}>
            {result.current.label}
          </PillButton>
        </div>
      );

      // Verify input has error styling
      const input = screen.getByTestId('email-input');
      expect(input).toHaveClass('border-red-500');

      // Verify button has disabled styling
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-progress-disabled');
      expect(button).toHaveClass('cursor-not-allowed');
    });
  });
});
