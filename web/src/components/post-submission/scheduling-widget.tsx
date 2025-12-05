/**
 * SchedulingWidget Component
 *
 * A wrapper component for embedding scheduling tools (like iClosed).
 * Implements lazy loading to defer iframe load until the widget is revealed.
 *
 * Features:
 * - Lazy-loaded iframe that only loads when visible
 * - Placeholder state while waiting to be revealed
 * - Full-width responsive design
 * - Loading state indicator
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 * @see step-10-timer-complete-revealed.png for visual reference
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SchedulingWidgetProps {
  /**
   * The embed URL for the scheduling widget (e.g., iClosed embed URL)
   */
  embedUrl: string;

  /**
   * Title for the iframe (for accessibility)
   */
  title?: string;

  /**
   * Height of the widget (default: 600px)
   */
  height?: string | number;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * SchedulingWidget - Lazy-loaded scheduling widget wrapper
 *
 * @example
 * // Basic usage
 * <SchedulingWidget embedUrl="https://iclosed.io/embed/12345" />
 *
 * @example
 * // Custom height
 * <SchedulingWidget
 *   embedUrl="https://iclosed.io/embed/12345"
 *   height={700}
 *   title="Schedule your strategy call"
 * />
 */
const SchedulingWidget = React.forwardRef<
  HTMLDivElement,
  SchedulingWidgetProps
>(
  (
    {
      embedUrl,
      title = 'Schedule a call',
      height = 600,
      className,
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    // Handle iframe load
    const handleLoad = () => {
      setIsLoaded(true);
    };

    // Handle iframe error
    const handleError = () => {
      setHasError(true);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full relative',
          'bg-gray-50 rounded-lg overflow-hidden',
          className
        )}
        style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
        data-testid="scheduling-widget"
      >
        {/* Loading state */}
        {!isLoaded && !hasError && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
            data-testid="scheduling-widget-loading"
          >
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="mt-4 text-gray-600 text-body-size">
                Loading scheduling widget...
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
            data-testid="scheduling-widget-error"
          >
            <div className="text-center">
              <p className="text-gray-600 text-body-size">
                Unable to load scheduling widget.
              </p>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoaded(false);
                }}
                className="mt-4 text-primary underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Iframe - rendered but hidden until loaded */}
        <iframe
          src={embedUrl}
          title={title}
          width="100%"
          height={height}
          frameBorder="0"
          allow="camera; microphone; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full',
            // Hide iframe until loaded
            !isLoaded && 'opacity-0',
            isLoaded && 'opacity-100',
            'transition-opacity duration-300'
          )}
          data-testid="scheduling-widget-iframe"
        />
      </div>
    );
  }
);

SchedulingWidget.displayName = 'SchedulingWidget';

export { SchedulingWidget };
