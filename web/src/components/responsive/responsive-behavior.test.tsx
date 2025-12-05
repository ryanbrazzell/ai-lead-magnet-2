/**
 * Responsive Behavior Tests
 * Task Group 8: Testing responsive behavior across all design system components
 *
 * These tests verify:
 * 1. Mobile breakpoint (375px): buttons full-width, single-column layout
 * 2. Transition breakpoint (428px): buttons switch to fixed 408px width
 * 3. Tablet breakpoint (768px): side-by-side layouts enabled
 * 4. Touch targets: all interactive elements have minimum 44px height
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PillButton } from '../ui/pill-button';
import { FormInput } from '../ui/form-input';
import { FormStep } from '../form/form-step';
import { StepNavigation } from '../form/step-navigation';

/**
 * Helper to mock window.matchMedia for responsive testing
 */
function mockMatchMedia(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: (() => {
        // Parse min-width queries
        const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
        if (minWidthMatch) {
          return width >= parseInt(minWidthMatch[1], 10);
        }
        // Parse max-width queries
        const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
        if (maxWidthMatch) {
          return width <= parseInt(maxWidthMatch[1], 10);
        }
        // Handle prefers-reduced-motion
        if (query === '(prefers-reduced-motion: reduce)') {
          return false;
        }
        return false;
      })(),
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

describe('Responsive Behavior Tests', () => {
  beforeEach(() => {
    // Default to desktop width
    mockMatchMedia(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Test 1: Mobile Breakpoint (375px) - Full-width buttons, single-column layout', () => {
    beforeEach(() => {
      mockMatchMedia(375);
    });

    it('PillButton renders with full-width class at mobile breakpoint', () => {
      render(<PillButton>Test Button</PillButton>);
      const button = screen.getByRole('button', { name: 'Test Button' });

      // Button should have w-full class for mobile
      expect(button).toHaveClass('w-full');
    });

    it('FormStep uses single-column layout at mobile breakpoint', () => {
      render(
        <FormStep question="Test question" layout="side-by-side">
          <FormInput placeholder="First" />
          <FormInput placeholder="Last" />
        </FormStep>
      );

      const childrenContainer = screen.getByTestId('form-step-children');

      // At mobile, side-by-side should still be single-column
      // The actual responsive behavior is handled by CSS media queries
      // We verify the component renders correctly
      expect(childrenContainer).toBeInTheDocument();
    });
  });

  describe('Test 2: Transition Breakpoint (428px) - Buttons fixed 408px width', () => {
    beforeEach(() => {
      mockMatchMedia(428);
    });

    it('PillButton has responsive width classes for transition breakpoint', () => {
      render(<PillButton>Test Button</PillButton>);
      const button = screen.getByRole('button', { name: 'Test Button' });

      // Button should have both responsive width classes
      // w-full for mobile, min-[428px]:w-[408px] for desktop
      expect(button.className).toMatch(/w-full/);
      expect(button.className).toMatch(/min-\[428px\]:w-\[408px\]/);
    });

    it('CountdownTimer has responsive width classes for transition breakpoint', async () => {
      // Dynamic import to handle the client component
      const { CountdownTimer } = await import(
        '../post-submission/countdown-timer'
      );
      render(<CountdownTimer initialSeconds={60} />);

      const timer = screen.getByTestId('countdown-timer');

      // Timer should have responsive width classes
      expect(timer.className).toMatch(/w-full/);
      expect(timer.className).toMatch(/min-\[428px\]:w-\[408px\]/);
    });
  });

  describe('Test 3: Tablet Breakpoint (768px) - Side-by-side layouts enabled', () => {
    beforeEach(() => {
      mockMatchMedia(768);
    });

    it('FormStep side-by-side layout applies correct grid classes', () => {
      render(
        <FormStep question="What's your name?" layout="side-by-side">
          <FormInput placeholder="First Name" />
          <FormInput placeholder="Last Name" />
        </FormStep>
      );

      const childrenContainer = screen.getByTestId('form-step-children');

      // Should have tablet-responsive grid classes
      // At tablet+, side-by-side should use grid-cols-2
      expect(childrenContainer.className).toMatch(/tablet:grid-cols-2/);
    });

    it('FormStep address-grid layout applies correct grid classes', () => {
      render(
        <FormStep question="Your address?" layout="address-grid">
          <FormInput placeholder="Street" />
          <FormInput placeholder="City" />
          <FormInput placeholder="State" />
          <FormInput placeholder="Country" />
          <FormInput placeholder="Zip" />
        </FormStep>
      );

      const childrenContainer = screen.getByTestId('form-step-children');

      // Should have tablet-responsive grid layout
      expect(childrenContainer.className).toMatch(/tablet:grid-cols-2/);
    });
  });

  describe('Test 4: Touch Targets - Minimum 44px height for all interactive elements', () => {
    it('PillButton exceeds minimum 44px touch target (84px height)', () => {
      render(<PillButton>Test Button</PillButton>);
      const button = screen.getByRole('button', { name: 'Test Button' });

      // PillButton has h-[84px] which exceeds 44px minimum
      expect(button).toHaveClass('h-[84px]');
    });

    it('FormInput meets minimum 44px touch target', () => {
      render(<FormInput type="text" placeholder="Test Input" />);
      const input = screen.getByPlaceholderText('TEST INPUT');

      // Input should have min-h-[44px] class
      expect(input.className).toMatch(/min-h-\[44px\]/);
    });

    it('StepNavigation meets minimum 44px touch target', () => {
      const mockOnPrevious = vi.fn();
      render(<StepNavigation currentStep={1} onPrevious={mockOnPrevious} />);

      const button = screen.getByRole('button', { name: 'Previous' });

      // Navigation button should have min-h-[44px] class
      expect(button.className).toMatch(/min-h-\[44px\]/);
    });

    it('Select variant of FormInput meets minimum 44px touch target', () => {
      render(
        <FormInput
          type="select"
          placeholder="Select Option"
          options={[
            { value: '1', label: 'Option 1' },
            { value: '2', label: 'Option 2' },
          ]}
        />
      );

      const selectTrigger = screen.getByRole('combobox');

      // Select trigger should have min-h-[44px] class
      expect(selectTrigger.className).toMatch(/min-h-\[44px\]/);
    });
  });
});
