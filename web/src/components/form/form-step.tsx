/**
 * FormStep Container Component
 * Task Group 4: Container for multi-step form questions
 * Task Group 8: Responsive Behavior Implementation
 *
 * Provides consistent styling and layout for form steps including:
 * - Question text with 32px font and bold keyword support
 * - Centered container with 650px max-width
 * - Generous vertical spacing (24-32px)
 * - Layout variants: single, side-by-side, and address-grid
 *
 * Responsive Behavior:
 * - Mobile (< 768px): All layouts are single-column
 * - Tablet+ (768px+): side-by-side and address-grid layouts enabled
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Layout variants for FormStep children
 * - single: Single column, full-width inputs (all breakpoints)
 * - side-by-side: Single column mobile, two columns tablet+ (e.g., First/Last name)
 * - address-grid: Single column mobile, grid layout tablet+ (street full-width, then 2x2)
 */
export type FormStepLayout = 'single' | 'side-by-side' | 'address-grid';

export interface FormStepProps {
  /**
   * The question text to display.
   * Supports HTML with <strong> tags for keyword emphasis.
   * Example: "What's your <strong>name</strong>?"
   */
  question: string;

  /**
   * Layout variant for the form inputs
   * @default 'single'
   */
  layout?: FormStepLayout;

  /**
   * Child elements (form inputs) to render
   */
  children: React.ReactNode;

  /**
   * Optional additional class names
   */
  className?: string;
}

/**
 * Safely parses HTML string to React elements
 * Only allows <strong> tags for security
 */
function parseQuestionHTML(html: string): React.ReactNode {
  // Split by <strong> and </strong> tags
  const parts = html.split(/(<strong>|<\/strong>)/);

  let isStrong = false;
  const elements: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    if (part === '<strong>') {
      isStrong = true;
    } else if (part === '</strong>') {
      isStrong = false;
    } else if (part) {
      if (isStrong) {
        elements.push(
          <strong key={index} className="font-bold">
            {part}
          </strong>
        );
      } else {
        elements.push(part);
      }
    }
  });

  return elements;
}

/**
 * Get layout classes for children container based on layout variant
 *
 * Responsive behavior (Task Group 8):
 * - All layouts use single-column (flex-col) on mobile (< 768px)
 * - side-by-side: grid-cols-2 at tablet+ (768px+)
 * - address-grid: grid-cols-2 with first child full-width at tablet+ (768px+)
 */
function getLayoutClasses(layout: FormStepLayout): string {
  switch (layout) {
    case 'side-by-side':
      // Mobile: single column (grid-cols-1)
      // Tablet+: two columns (tablet:grid-cols-2)
      return 'grid grid-cols-1 tablet:grid-cols-2 gap-4';

    case 'address-grid':
      // Mobile: single column (grid-cols-1)
      // Tablet+: 2x2 grid with first child (street) spanning full width
      // Using CSS grid with special handling for first child
      return 'grid grid-cols-1 tablet:grid-cols-2 gap-4 [&>*:first-child]:col-span-1 tablet:[&>*:first-child]:col-span-2';

    case 'single':
    default:
      // Single column, full-width at all breakpoints
      return 'flex flex-col gap-4';
  }
}

/**
 * FormStep - Container component for multi-step form questions
 *
 * @example
 * // Single column layout
 * <FormStep question="Where should I <strong>email</strong> it to?" layout="single">
 *   <FormInput type="email" placeholder="Email" />
 * </FormStep>
 *
 * @example
 * // Side-by-side layout for name fields (tablet+)
 * <FormStep question="What's your <strong>name</strong>?" layout="side-by-side">
 *   <FormInput placeholder="First Name" />
 *   <FormInput placeholder="Last Name" />
 * </FormStep>
 *
 * @example
 * // Address grid layout (tablet+)
 * <FormStep question="Whats your <strong>shipping address</strong>?" layout="address-grid">
 *   <FormInput placeholder="Street Address" />
 *   <FormInput placeholder="City" />
 *   <FormInput placeholder="State/Region" />
 *   <FormInput placeholder="Country/Region" />
 *   <FormInput placeholder="Zip Code / Postal" />
 * </FormStep>
 */
export function FormStep({
  question,
  layout = 'single',
  children,
  className,
}: FormStepProps) {
  return (
    <div
      data-testid="form-step-container"
      className={cn(
        // Container layout
        'max-w-[650px] mx-auto',
        // Centered text for question
        'text-center',
        // Vertical spacing between elements (24px via space-y-6)
        'space-y-6',
        // Full width on mobile, constrained on desktop
        'w-full px-4',
        className
      )}
    >
      {/* Question Text */}
      <h2
        data-testid="form-step-question"
        // Using className string directly to avoid twMerge conflicts
        // between text-question (font-size utility) and text-gray-900 (color utility)
        className="text-question text-gray-900"
      >
        {parseQuestionHTML(question)}
      </h2>

      {/* Form Inputs Container */}
      <div
        data-testid="form-step-children"
        className={getLayoutClasses(layout)}
      >
        {children}
      </div>
    </div>
  );
}
