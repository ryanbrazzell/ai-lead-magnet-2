/**
 * Design Token Validation Tests
 *
 * These 4 tests validate that the design tokens are correctly configured
 * and accessible through the expected utility classes and CSS variables.
 *
 * Task 1.1 Requirements:
 * 1. Test that primary color #6F00FF is accessible via bg-primary and text-primary
 * 2. Test that progress color #FFFC8C is accessible via bg-progress
 * 3. Test that custom border-radius pill (50px) and input (5px) are applied correctly
 * 4. Test that custom font sizes resolve to correct pixel values
 */

import { describe, it, expect } from 'vitest';
import {
  colors,
  borderRadius,
  fontSize,
  spacing,
  transitions,
  easing,
  utilityClasses,
} from './design-tokens';

describe('Design Token Configuration', () => {
  /**
   * Test 1: Primary color #6F00FF is accessible via bg-primary and text-primary
   *
   * Validates that the primary brand color (purple) is defined correctly
   * and has the expected utility class names for both background and text.
   */
  it('primary color #6F00FF is accessible via bg-primary and text-primary', () => {
    // Verify the color value matches the spec exactly
    expect(colors.primary).toBe('#6F00FF');

    // Verify the utility class names are defined
    expect(utilityClasses.bgPrimary).toBe('bg-primary');
    expect(utilityClasses.textPrimary).toBe('text-primary');

    // Ensure the color is not accidentally white, black, or undefined
    expect(colors.primary).not.toBe('#FFFFFF');
    expect(colors.primary).not.toBe('#000000');
    expect(colors.primary).toBeDefined();
  });

  /**
   * Test 2: Progress color #FFFC8C is accessible via bg-progress
   *
   * Validates that the progress color (yellow) used for mid-journey
   * continue buttons is defined correctly.
   */
  it('progress color #FFFC8C is accessible via bg-progress', () => {
    // Verify the progress color matches the spec exactly
    expect(colors.progress).toBe('#FFFC8C');

    // Verify the utility class name is defined
    expect(utilityClasses.bgProgress).toBe('bg-progress');

    // Also verify the disabled variant
    expect(colors.progressDisabled).toBe('#F9E57F');
    expect(utilityClasses.bgProgressDisabled).toBe('bg-progress-disabled');

    // Verify input colors are also defined
    expect(colors.inputBg).toBe('#F5F8FA');
    expect(colors.inputFocus).toBe('#ECF0F3');
    expect(colors.navy).toBe('#1A1A2E');
  });

  /**
   * Test 3: Custom border-radius pill (50px) and input (5px) are applied correctly
   *
   * Validates that the border-radius tokens for pill buttons (50px)
   * and input fields (5px) are configured with the correct values.
   */
  it('custom border-radius pill (50px) and input (5px) are applied correctly', () => {
    // Verify pill border-radius is 50px (for large CTA buttons)
    expect(borderRadius.pill).toBe('50px');

    // Verify input border-radius is 5px (for form fields)
    expect(borderRadius.input).toBe('5px');

    // Verify utility class names are defined
    expect(utilityClasses.roundedPill).toBe('rounded-pill');
    expect(utilityClasses.roundedInput).toBe('rounded-input');

    // Ensure values are strings with 'px' unit
    expect(borderRadius.pill).toMatch(/^\d+px$/);
    expect(borderRadius.input).toMatch(/^\d+px$/);
  });

  /**
   * Test 4: Custom font sizes resolve to correct pixel values
   *
   * Validates that all custom font size tokens (question, button, input,
   * previous, body) are configured with the correct pixel values and
   * associated line-height/font-weight properties.
   */
  it('custom font sizes (question, button, input, previous, body) resolve to correct pixel values', () => {
    // Question text: 32px, line-height 1.2, font-weight 700
    expect(fontSize.question.size).toBe('32px');
    expect(fontSize.question.lineHeight).toBe('1.2');
    expect(fontSize.question.fontWeight).toBe('700');

    // Button text: 24px, line-height 1, font-weight 700
    expect(fontSize.button.size).toBe('24px');
    expect(fontSize.button.lineHeight).toBe('1');
    expect(fontSize.button.fontWeight).toBe('700');

    // Input text: 20px, line-height 1.5
    expect(fontSize.input.size).toBe('20px');
    expect(fontSize.input.lineHeight).toBe('1.5');

    // Previous link text: 18px, line-height 1.5
    expect(fontSize.previous.size).toBe('18px');
    expect(fontSize.previous.lineHeight).toBe('1.5');

    // Body text: 16px, line-height 1.5
    expect(fontSize.body.size).toBe('16px');
    expect(fontSize.body.lineHeight).toBe('1.5');

    // Verify utility class names are defined
    expect(utilityClasses.textQuestion).toBe('text-question');
    expect(utilityClasses.textButtonSize).toBe('text-button-size');
    expect(utilityClasses.textInputSize).toBe('text-input-size');
    expect(utilityClasses.textPrevious).toBe('text-previous');
    expect(utilityClasses.textBodySize).toBe('text-body-size');

    // Verify spacing tokens are also correctly defined
    expect(spacing.buttonHeight).toBe('84px');
    expect(spacing.buttonWidth).toBe('408px');
    expect(spacing.formMax).toBe('650px');

    // Verify transition tokens
    expect(transitions.button).toBe('200ms');
    expect(transitions.input).toBe('150ms');
    expect(transitions.step).toBe('300ms');

    // Verify easing tokens
    expect(easing.button).toBe('ease-out');
    expect(easing.input).toBe('ease-in-out');
  });
});
