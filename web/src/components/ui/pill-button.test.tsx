/**
 * PillButton Component Tests
 *
 * Task 2.1: 6 focused tests for PillButton functionality
 *
 * Tests validate:
 * 1. Primary variant renders with purple background and white text
 * 2. Progress variant renders with yellow background and black text
 * 3. Disabled variant renders with muted yellow background
 * 4. Hover state applies translateY(-2px) transform and enhanced shadow
 * 5. Loading state displays spinner and disables interaction
 * 6. Responsive behavior: 100% width below 428px, fixed 408px above
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PillButton } from './pill-button';

describe('PillButton Component', () => {
  /**
   * Test 1: Primary variant renders with purple background and white text
   *
   * The primary variant should be used for step 0 (LET'S START) and
   * final steps (GET MY ROADMAP). It uses the brand purple color.
   */
  it('primary variant renders with purple background and white text', () => {
    render(<PillButton variant="primary">LET&apos;S START</PillButton>);

    const button = screen.getByRole('button', { name: /let's start/i });
    expect(button).toBeInTheDocument();

    // Check for primary variant classes
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-white');
  });

  /**
   * Test 2: Progress variant renders with yellow background and black text
   *
   * The progress variant is used during steps 1-2 to create visual
   * momentum and indicate progress through the form.
   */
  it('progress variant renders with yellow background and black text', () => {
    render(<PillButton variant="progress">CONTINUE</PillButton>);

    const button = screen.getByRole('button', { name: /continue/i });
    expect(button).toBeInTheDocument();

    // Check for progress variant classes
    expect(button).toHaveClass('bg-progress');
    expect(button).toHaveClass('text-black');
  });

  /**
   * Test 3: Disabled variant renders with muted yellow background
   *
   * The disabled variant is used when form validation fails.
   * It uses a muted yellow to indicate the button is not actionable.
   */
  it('disabled variant renders with muted yellow background', () => {
    render(<PillButton variant="disabled">CONTINUE</PillButton>);

    const button = screen.getByRole('button', { name: /continue/i });
    expect(button).toBeInTheDocument();

    // Check for disabled variant classes
    expect(button).toHaveClass('bg-progress-disabled');
    expect(button).toHaveClass('text-black');
    expect(button).toHaveClass('cursor-not-allowed');
  });

  /**
   * Test 4: Hover state applies translateY(-2px) transform and enhanced shadow
   *
   * Per spec: hover state should lift the button (translateY(-2px))
   * and add enhanced shadow WITHOUT changing the color.
   */
  it('hover state applies translateY(-2px) transform and enhanced shadow', () => {
    render(<PillButton variant="primary">LET&apos;S START</PillButton>);

    const button = screen.getByRole('button', { name: /let's start/i });

    // Check for hover transform classes using motion-safe prefix
    expect(button.className).toMatch(/motion-safe:hover:-translate-y-\[2px\]|hover:-translate-y-\[2px\]/);

    // Check for hover shadow class
    expect(button.className).toMatch(/motion-safe:hover:shadow-lg|hover:shadow-lg/);

    // Check for transition classes
    expect(button.className).toMatch(/transition/);
  });

  /**
   * Test 5: Loading state displays spinner and disables interaction
   *
   * When loading is true, the button should:
   * - Display a spinning Loader2 icon
   * - Disable pointer events to prevent multiple submissions
   * - Be aria-disabled for accessibility
   */
  it('loading state displays spinner and disables interaction', () => {
    render(<PillButton loading>CONTINUE</PillButton>);

    const button = screen.getByRole('button');

    // Check for loading spinner (Loader2 from Lucide)
    const spinner = button.querySelector('[data-testid="loading-spinner"]');
    expect(spinner).toBeInTheDocument();

    // Check that spinner has animation class
    expect(spinner).toHaveClass('animate-spin');

    // Check that button has pointer-events-none when loading
    expect(button).toHaveClass('pointer-events-none');

    // Check aria-disabled for accessibility
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  /**
   * Test 6: Responsive behavior - 100% width below 428px, fixed 408px above
   *
   * The button should be full-width on mobile and fixed 408px on desktop.
   * This is implemented using Tailwind responsive classes.
   */
  it('responsive behavior: 100% width below 428px, fixed 408px above', () => {
    render(<PillButton variant="primary">LET&apos;S START</PillButton>);

    const button = screen.getByRole('button', { name: /let's start/i });

    // Check for mobile-first full width
    expect(button).toHaveClass('w-full');

    // Check for desktop fixed width at 428px breakpoint
    // The class should be something like min-[428px]:w-[408px] or similar
    expect(button.className).toMatch(/min-\[428px\]:w-\[408px\]|sm:w-\[408px\]|w-\[408px\]/);

    // Check for consistent height of 84px
    expect(button.className).toMatch(/h-\[84px\]|h-button/);
  });
});
