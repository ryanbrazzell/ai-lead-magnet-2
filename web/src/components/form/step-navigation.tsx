/**
 * StepNavigation Component
 * Task Group 5: Navigation component for multi-step form
 *
 * Displays a "Previous" link with left arrow for navigating back through form steps.
 * Hidden on the first step (step === 0) and visible on all subsequent steps.
 */
import { ArrowLeft } from 'lucide-react';

export interface StepNavigationProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Callback function when Previous is clicked */
  onPrevious: () => void;
}

/**
 * StepNavigation provides a "Previous" link for navigating back in multi-step forms.
 *
 * Design specifications:
 * - Font: text-previous (18px)
 * - Left arrow icon (Lucide ArrowLeft)
 * - Transparent background, text-only styling
 * - Center-aligned below CTA button
 * - Hidden when currentStep === 0
 */
export function StepNavigation({
  currentStep,
  onPrevious,
}: StepNavigationProps) {
  // Do not render on the first step
  if (currentStep === 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onPrevious}
      className="flex items-center justify-center gap-2 text-previous text-gray-700 hover:text-gray-900 transition-colors duration-200 bg-transparent border-none cursor-pointer mx-auto py-3 px-4 min-h-[44px]"
      aria-label="Previous"
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span>Previous</span>
    </button>
  );
}
