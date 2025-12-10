/**
 * PillButton Component
 *
 * A pill-shaped CTA button for the EA Time Freedom Report design system.
 * Supports three color variants:
 * - primary: Navy (#0f172a) for brand CTAs and main actions
 * - progress: Gold (#f59e0b) for mid-journey momentum (Steps 1-2)
 * - disabled: Light gold (#fcd34d) for validation/error states
 *
 * Features:
 * - Hover lift animation (translateY(-2px)) without color change
 * - Loading state with spinner and disabled interaction
 * - Responsive: 100% width on mobile, 408px fixed on desktop (428px breakpoint)
 * - Reduced motion support for accessibility
 *
 * Touch Target (Task Group 8):
 * - Height: 84px (exceeds 44px minimum requirement)
 * - All interactive states meet WCAG 2.1 touch target requirements
 *
 * Responsive Behavior (Task Group 8):
 * - Mobile (< 428px): w-full (100% width)
 * - Desktop (428px+): w-[408px] (fixed 408px width)
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Pill button variant styles using class-variance-authority (cva)
 *
 * Base styles include:
 * - Pill shape (50px border-radius)
 * - 84px height (exceeds 44px touch target minimum)
 * - 24px bold uppercase font
 * - Responsive width (full on mobile, 408px on desktop at 428px breakpoint)
 * - Hover lift animation with shadow
 */
const pillButtonVariants = cva(
  // Base classes - consistent across all variants
  [
    // Shape and dimensions
    'inline-flex items-center justify-center',
    'rounded-pill', // 50px border-radius from design tokens
    'h-[64px]', // 64px height (exceeds 44px touch target minimum)
    'w-full min-[428px]:w-[408px]', // Responsive: full width mobile, fixed desktop

    // Typography - 24px bold uppercase per spec
    'text-2xl tracking-wider',
    'font-bold uppercase',

    // Focus states for accessibility
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',

    // Transitions for hover effects
    'transition-all',

    // Motion-safe hover animations (translateY lift + shadow)
    // NO color change on hover per spec
    'motion-safe:hover:-translate-y-[2px] motion-safe:hover:shadow-lg',
    'motion-safe:active:translate-y-0 motion-safe:active:shadow-md',

    // Reduced motion fallback - use opacity instead of transform
    'motion-reduce:hover:opacity-90 motion-reduce:active:opacity-80',

    // Disable text selection
    'select-none',

    // Duration and easing from design tokens
    'duration-[200ms] ease-out', // --transition-button: 200ms, --ease-button: ease-out
  ],
  {
    variants: {
      /**
       * Color variants for navy/gold brand scheme
       */
      variant: {
        /**
         * Primary (Navy) - Main CTAs
         * Used for Step 0 "LET'S START" and final actions
         */
        primary: [
          'bg-primary text-white',
          'focus-visible:ring-primary',
        ],

        /**
         * Progress (Gold) - Mid-journey momentum
         * Used for Steps 1-2 "CONTINUE" buttons
         */
        progress: [
          'bg-progress text-navy',
          'focus-visible:ring-progress',
        ],

        /**
         * Disabled (Light Gold) - Validation/error states
         * Used when form has validation errors
         */
        disabled: [
          'bg-progress-disabled text-navy',
          'cursor-not-allowed',
          'focus-visible:ring-progress-disabled',
        ],
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillButtonVariants> {
  /**
   * Whether the button should render as a child component (Slot)
   * Useful for rendering as a link while keeping button styles
   */
  asChild?: boolean;

  /**
   * Whether the button is in a loading state
   * Displays spinner and disables interaction
   */
  loading?: boolean;
}

/**
 * PillButton - Large pill-shaped CTA button
 *
 * @example
 * // Primary variant (default) - Navy
 * <PillButton>LET'S START</PillButton>
 *
 * @example
 * // Progress variant - Gold
 * <PillButton variant="progress">CONTINUE</PillButton>
 *
 * @example
 * // Loading state
 * <PillButton loading>SUBMITTING...</PillButton>
 */
const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  (
    {
      className,
      variant,
      asChild = false,
      loading = false,
      disabled,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // Determine if button should be disabled
    const isDisabled = disabled || loading || variant === 'disabled';

    // Track if click was already handled to prevent double submission
    const clickHandledRef = React.useRef(false);

    // Handle touch events for mobile compatibility
    const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
      if (isDisabled) return;
      
      // For submit buttons, ensure form submission works on mobile
      if (props.type === 'submit' && !clickHandledRef.current) {
        const form = (e.currentTarget as HTMLElement).closest('form');
        if (form) {
          clickHandledRef.current = true;
          // Use requestSubmit to trigger form validation and submission
          form.requestSubmit();
          // Reset after a short delay
          setTimeout(() => {
            clickHandledRef.current = false;
          }, 100);
        }
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      clickHandledRef.current = true;
      if (onClick) {
        onClick(e);
      }
      setTimeout(() => {
        clickHandledRef.current = false;
      }, 100);
    };

    return (
      <Comp
        className={cn(
          pillButtonVariants({ variant }),
          // Add pointer-events-none when loading
          loading && 'pointer-events-none',
          // Ensure touch-action is enabled for mobile (prevents double-tap zoom)
          'touch-action-manipulation',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              className="mr-2 h-6 w-6 animate-spin"
              data-testid="loading-spinner"
              aria-hidden="true"
            />
            <span className="sr-only">Loading, please wait</span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

PillButton.displayName = 'PillButton';

export { PillButton, pillButtonVariants };
