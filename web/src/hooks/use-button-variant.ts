/**
 * useButtonVariant Hook
 *
 * Determines the PillButton variant and label based on the user's position
 * in the form journey. Implements the color psychology journey pattern from
 * acquisition.com/roadmap.
 *
 * ## Color Psychology Rationale
 *
 * The color journey creates a deliberate psychological progression:
 *
 * **Purple (#6F00FF) - Brand Entry & Exit**
 * Used at Step 0 and Step 3+. Purple conveys:
 * - Authority and premium positioning
 * - Brand recognition and trust
 * - A sense of "coming home" when returning at the end
 *
 * **Yellow (#FFFC8C) - Progress Momentum**
 * Used during Steps 1-2 (email, phone collection). Yellow conveys:
 * - Energy and urgency
 * - Action and forward motion
 * - Visual distinction that progress is being made
 *
 * **Muted Yellow (#F9E57F) - Error/Disabled State**
 * Used when validation errors are present. Conveys:
 * - Incomplete state requiring attention
 * - Soft warning without alarming red
 * - User needs to take corrective action
 *
 * The transition from Purple -> Yellow -> Purple creates a subconscious
 * "journey complete" satisfaction when users reach the final CTA.
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md#color-psychology-journey-logic
 * @see PillButton component for variant styling implementation
 *
 * @example
 * ```tsx
 * function FormStep({ step, totalSteps, hasValidationError }) {
 *   const { variant, label } = useButtonVariant({
 *     currentStep: step,
 *     hasError: hasValidationError,
 *     isFinalStep: step === totalSteps - 1,
 *   });
 *
 *   return (
 *     <PillButton variant={variant}>{label}</PillButton>
 *   );
 * }
 * ```
 */

import { useMemo } from 'react';

/**
 * Button variant types matching the PillButton component variants
 */
export type ButtonVariant = 'primary' | 'progress' | 'disabled';

/**
 * Props for the useButtonVariant hook
 */
export interface UseButtonVariantProps {
  /**
   * The current step in the form journey (0-indexed)
   * - Step 0: Landing/name collection (purple)
   * - Steps 1-2: Email/phone collection (yellow)
   * - Step 3+: Address/business info (purple)
   */
  currentStep: number;

  /**
   * Whether the form currently has validation errors
   * When true, returns 'disabled' variant regardless of step
   */
  hasError: boolean;

  /**
   * Whether the current step is the final step in the form
   * When true, uses "GET MY ROADMAP" instead of "CONTINUE"
   * @default false
   */
  isFinalStep?: boolean;
}

/**
 * Return type for the useButtonVariant hook
 */
export interface UseButtonVariantReturn {
  /**
   * The PillButton variant to use for styling
   * - 'primary': Purple background, white text
   * - 'progress': Yellow background, black text
   * - 'disabled': Muted yellow background, black text
   */
  variant: ButtonVariant;

  /**
   * The button label text (uppercase)
   * - Step 0: "LET'S START"
   * - Steps 1+: "CONTINUE"
   * - Final step: "GET MY ROADMAP"
   */
  label: string;
}

/**
 * Determines the appropriate button variant and label based on form journey position
 *
 * @param props - The hook configuration
 * @param props.currentStep - Current step index (0-based)
 * @param props.hasError - Whether validation errors exist
 * @param props.isFinalStep - Whether this is the final form step
 * @returns Object containing variant and label for the PillButton
 *
 * @remarks
 * ## Step-to-Variant Mapping
 *
 * | Step | Variant | Label | Color Psychology |
 * |------|---------|-------|------------------|
 * | 0 | primary | LET'S START | Brand entry - establishes authority |
 * | 1-2 | progress | CONTINUE | Energy - creates momentum |
 * | 3+ | primary | CONTINUE | Brand return - "coming home" |
 * | Final | primary | GET MY ROADMAP | Clear completion signal |
 * | Error | disabled | (current) | Soft warning state |
 */
export function useButtonVariant({
  currentStep,
  hasError,
  isFinalStep = false,
}: UseButtonVariantProps): UseButtonVariantReturn {
  return useMemo(() => {
    // First, determine the label based on step position
    let label: string;

    if (currentStep === 0) {
      // Step 0: Entry point - clear call to action
      label = "LET'S START";
    } else if (isFinalStep) {
      // Final step: Clear completion signal
      label = 'GET MY ROADMAP';
    } else {
      // All other steps: Generic progress action
      label = 'CONTINUE';
    }

    // If there's an error, use disabled variant but keep the current label
    // This helps users understand what action they're trying to complete
    if (hasError) {
      return {
        variant: 'disabled' as const,
        label,
      };
    }

    // Determine variant based on step position (color psychology journey)
    let variant: ButtonVariant;

    if (currentStep === 0) {
      // Step 0: Purple - Brand entry establishes authority and trust
      variant = 'primary';
    } else if (currentStep >= 1 && currentStep <= 2) {
      // Steps 1-2: Yellow - Creates energy and momentum during data collection
      variant = 'progress';
    } else {
      // Step 3+: Purple - Returns to brand color for "coming home" effect
      variant = 'primary';
    }

    return {
      variant,
      label,
    };
  }, [currentStep, hasError, isFinalStep]);
}

/**
 * Export default for convenient importing
 */
export default useButtonVariant;
