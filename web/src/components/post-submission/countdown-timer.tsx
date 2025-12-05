/**
 * CountdownTimer Component
 *
 * A countdown timer button for the EA Time Freedom Report post-submission experience.
 * Displays "Book Your Call in XXs" and triggers a callback when complete.
 *
 * Features:
 * - Counts down from initialSeconds (default 60) in 1-second intervals
 * - Purple styling matching brand colors
 * - Pill shape matching PillButton component
 * - Triggers onComplete callback when timer reaches 0
 * - Reduced motion support (timer still works, just no animations)
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 * @see step-09-timer-countdown.png for visual reference
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CountdownTimerProps {
  /**
   * Initial seconds to count down from (default: 60)
   */
  initialSeconds?: number;

  /**
   * Callback fired when countdown reaches 0
   */
  onComplete?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * CountdownTimer - Countdown button with "Book Your Call in XXs" format
 *
 * @example
 * // Basic usage with 60-second countdown
 * <CountdownTimer onComplete={() => setShowCTA(true)} />
 *
 * @example
 * // Custom countdown duration
 * <CountdownTimer initialSeconds={30} onComplete={handleComplete} />
 */
const CountdownTimer = React.forwardRef<HTMLDivElement, CountdownTimerProps>(
  ({ initialSeconds = 60, onComplete, className }, ref) => {
    const [seconds, setSeconds] = React.useState(initialSeconds);
    const [isComplete, setIsComplete] = React.useState(false);

    // Countdown effect with 1-second interval
    React.useEffect(() => {
      // Don't start if already complete
      if (isComplete) return;

      // Create interval for countdown
      const interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds <= 1) {
            // Clear interval and trigger completion
            clearInterval(interval);
            setIsComplete(true);
            onComplete?.();
            return 0;
          }
          return prevSeconds - 1;
        });
      }, 1000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    }, [isComplete, onComplete]);

    // Reset timer if initialSeconds changes
    React.useEffect(() => {
      setSeconds(initialSeconds);
      setIsComplete(false);
    }, [initialSeconds]);

    return (
      <div
        ref={ref}
        className={cn(
          // Pill shape matching PillButton
          'inline-flex items-center justify-center',
          'rounded-pill',
          'h-[84px]',
          'w-full min-[428px]:w-[408px]',
          // Purple styling matching brand
          'bg-primary',
          // Typography - font-size first, then color to avoid tailwind-merge conflict
          'text-button-size font-bold',
          // Text color AFTER text-button-size to avoid merge conflict
          'text-white',
          // Disabled/non-interactive appearance
          'cursor-default',
          'select-none',
          className
        )}
        role="timer"
        aria-live="polite"
        aria-label={`Book your call countdown: ${seconds} seconds remaining`}
        data-testid="countdown-timer"
      >
        Book Your Call in {seconds}s
      </div>
    );
  }
);

CountdownTimer.displayName = 'CountdownTimer';

export { CountdownTimer };
