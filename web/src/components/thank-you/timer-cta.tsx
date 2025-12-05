/**
 * TimerCTA Component
 * Countdown timer with call-to-action button
 * After timer completes, reveals the main CTA
 */

"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TimerCTAProps {
  initialSeconds: number;
  primaryText: string;
  primaryHref: string;
  secondaryText: string;
  onSecondaryClick: () => void;
  onPrimaryClick?: () => void;
}

export function TimerCTA({
  initialSeconds,
  primaryText,
  primaryHref,
  secondaryText,
  onSecondaryClick,
  onPrimaryClick,
}: TimerCTAProps) {
  const [secondsLeft, setSecondsLeft] = React.useState(initialSeconds);
  const [timerComplete, setTimerComplete] = React.useState(false);

  React.useEffect(() => {
    if (secondsLeft <= 0) {
      setTimerComplete(true);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setTimerComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Timer Button */}
      <a
        href={timerComplete ? primaryHref : undefined}
        onClick={(e) => {
          if (!timerComplete) {
            e.preventDefault();
          } else if (onPrimaryClick) {
            e.preventDefault();
            onPrimaryClick();
          }
        }}
        className={cn(
          "inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-bold transition-all duration-300",
          "min-w-[320px] text-center",
          timerComplete
            ? "bg-primary text-white hover:bg-primary/90 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            : "bg-violet-200 text-violet-600 cursor-wait"
        )}
        aria-disabled={!timerComplete}
      >
        {timerComplete ? (
          primaryText
        ) : (
          <>Book Your Call in {secondsLeft}s</>
        )}
      </a>

      {/* Secondary Link */}
      <button
        onClick={onSecondaryClick}
        className="text-primary underline hover:no-underline text-base transition-colors"
      >
        {secondaryText}
      </button>
    </div>
  );
}

