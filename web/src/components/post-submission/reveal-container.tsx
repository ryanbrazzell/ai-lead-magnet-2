/**
 * RevealContainer Component
 *
 * An animated container that fades in when made visible.
 * Used for revealing content after the countdown timer completes.
 *
 * Features:
 * - Fade-in animation using Framer Motion
 * - 300ms transition duration per spec
 * - AnimatePresence for proper enter/exit animations
 * - Reduced motion support (instant visibility change)
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 * @see step-10-timer-complete-revealed.png for visual reference
 */

'use client';

import * as React from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface RevealContainerProps {
  /**
   * Whether the content should be visible
   */
  visible: boolean;

  /**
   * Content to reveal
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Animation variants for fade-in effect
 * Duration: 300ms per spec
 */
const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3, // 300ms per spec
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

/**
 * Reduced motion variants (instant visibility)
 */
const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

/**
 * RevealContainer - Fade-in container for post-submission content
 *
 * @example
 * // Basic usage
 * <RevealContainer visible={timerComplete}>
 *   <SchedulingWidget embedUrl="..." />
 * </RevealContainer>
 *
 * @example
 * // With multiple children
 * <RevealContainer visible={showCTA}>
 *   <PillButton variant="primary">See If I'm a Fit</PillButton>
 *   <a href="#">No thanks, take me to the course</a>
 * </RevealContainer>
 */
const RevealContainer = React.forwardRef<HTMLDivElement, RevealContainerProps>(
  ({ visible, children, className }, ref) => {
    const [prefersReducedMotion, setPrefersReducedMotion] =
      React.useState(false);

    // Check for reduced motion preference
    React.useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Use appropriate variants based on motion preference
    const variants = prefersReducedMotion
      ? reducedMotionVariants
      : fadeVariants;

    return (
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            ref={ref}
            className={cn('w-full', className)}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            data-testid="reveal-container"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

RevealContainer.displayName = 'RevealContainer';

export { RevealContainer };
