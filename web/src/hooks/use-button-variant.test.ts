/**
 * useButtonVariant Hook Tests
 *
 * Task 7.1: 4 focused tests for button color logic
 *
 * Tests validate the color psychology journey:
 * 1. Step 0 uses `primary` variant (purple "LET'S START")
 * 2. Steps 1-2 use `progress` variant (yellow "CONTINUE")
 * 3. Step 3+ use `primary` variant (purple "CONTINUE" or "GET MY ROADMAP")
 * 4. Validation error uses `disabled` variant with error text visible
 *
 * Color Psychology Rationale (from acquisition.com analysis):
 * - Purple (#6F00FF): Brand authority, premium feel - used at START and END of journey
 * - Yellow (#FFFC8C): Energy, action, progress - used in MIDDLE of journey
 * - This creates a psychological "coming home" feeling when returning to purple
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useButtonVariant } from './use-button-variant';

describe('useButtonVariant Hook - Color Psychology Journey', () => {
  /**
   * Test 1: Step 0 uses `primary` variant (purple "LET'S START")
   *
   * Step 0 is the entry point where users first engage with the form.
   * The purple brand color establishes authority and premium positioning.
   */
  it('step 0 uses primary variant with "LET\'S START" label', () => {
    const { result } = renderHook(() =>
      useButtonVariant({ currentStep: 0, hasError: false })
    );

    expect(result.current.variant).toBe('primary');
    expect(result.current.label).toBe("LET'S START");
  });

  /**
   * Test 2: Steps 1-2 use `progress` variant (yellow "CONTINUE")
   *
   * Mid-journey steps (email, phone) use yellow to create energy and
   * momentum. The bright yellow signals action and encourages completion.
   */
  it('steps 1-2 use progress variant with "CONTINUE" label', () => {
    // Test step 1
    const { result: result1 } = renderHook(() =>
      useButtonVariant({ currentStep: 1, hasError: false })
    );
    expect(result1.current.variant).toBe('progress');
    expect(result1.current.label).toBe('CONTINUE');

    // Test step 2
    const { result: result2 } = renderHook(() =>
      useButtonVariant({ currentStep: 2, hasError: false })
    );
    expect(result2.current.variant).toBe('progress');
    expect(result2.current.label).toBe('CONTINUE');
  });

  /**
   * Test 3: Step 3+ use `primary` variant (purple "CONTINUE" or "GET MY ROADMAP")
   *
   * Returns to brand purple to create a "coming home" feeling.
   * The final step uses "GET MY ROADMAP" to clearly signal form completion.
   */
  it('step 3+ uses primary variant with "CONTINUE" or "GET MY ROADMAP" label', () => {
    // Test step 3 - should be CONTINUE (not final)
    const { result: result3 } = renderHook(() =>
      useButtonVariant({ currentStep: 3, hasError: false })
    );
    expect(result3.current.variant).toBe('primary');
    expect(result3.current.label).toBe('CONTINUE');

    // Test step 4 (final step) - should be GET MY ROADMAP
    const { result: resultFinal } = renderHook(() =>
      useButtonVariant({ currentStep: 4, hasError: false, isFinalStep: true })
    );
    expect(resultFinal.current.variant).toBe('primary');
    expect(resultFinal.current.label).toBe('GET MY ROADMAP');
  });

  /**
   * Test 4: Validation error uses `disabled` variant with error text visible
   *
   * When form validation fails, the button switches to disabled state.
   * The muted yellow signals the user needs to complete required fields.
   * The label is preserved so users know what action they're trying to take.
   */
  it('validation error uses disabled variant while preserving current label', () => {
    // Test error on step 0 - should keep "LET'S START" label but disabled variant
    const { result: result0Error } = renderHook(() =>
      useButtonVariant({ currentStep: 0, hasError: true })
    );
    expect(result0Error.current.variant).toBe('disabled');
    expect(result0Error.current.label).toBe("LET'S START");

    // Test error on step 1 - should keep "CONTINUE" label but disabled variant
    const { result: result1Error } = renderHook(() =>
      useButtonVariant({ currentStep: 1, hasError: true })
    );
    expect(result1Error.current.variant).toBe('disabled');
    expect(result1Error.current.label).toBe('CONTINUE');

    // Test error on final step - should keep "GET MY ROADMAP" label but disabled variant
    const { result: resultFinalError } = renderHook(() =>
      useButtonVariant({ currentStep: 4, hasError: true, isFinalStep: true })
    );
    expect(resultFinalError.current.variant).toBe('disabled');
    expect(resultFinalError.current.label).toBe('GET MY ROADMAP');
  });
});
