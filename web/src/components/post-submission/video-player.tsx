/**
 * VideoPlayer Component
 *
 * A responsive video player wrapper for the EA Time Freedom Report design system.
 * Maintains a 16:9 aspect ratio and supports autoplay functionality.
 *
 * Features:
 * - Responsive 16:9 aspect ratio using Tailwind's aspect-video
 * - Full-width on all screen sizes
 * - Autoplay support with muted default for browser autoplay policies
 * - Reduced motion support (autoplay disabled when prefers-reduced-motion)
 *
 * @see /boundless-os/specs/2025-11-30-design-system/spec.md
 * @see step-09-timer-countdown.png for visual reference
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface VideoPlayerProps
  extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /**
   * Video source URL
   */
  src: string;

  /**
   * Whether the video should autoplay (default: true)
   * Note: Browsers require muted videos for autoplay to work
   */
  autoplay?: boolean;

  /**
   * Additional CSS classes for the container
   */
  containerClassName?: string;
}

/**
 * VideoPlayer - Responsive video wrapper with 16:9 aspect ratio
 *
 * @example
 * // Basic usage with autoplay
 * <VideoPlayer src="/videos/intro.mp4" />
 *
 * @example
 * // Disable autoplay
 * <VideoPlayer src="/videos/intro.mp4" autoplay={false} />
 */
const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      src,
      autoplay = true,
      containerClassName,
      className,
      muted = true, // Required for autoplay in most browsers
      playsInline = true, // Required for iOS inline playback
      controls = true,
      ...props
    },
    ref
  ) => {
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

    // Disable autoplay if user prefers reduced motion
    const shouldAutoplay = autoplay && !prefersReducedMotion;

    return (
      <div
        className={cn(
          // 16:9 aspect ratio container
          'aspect-video w-full',
          // Background for loading state
          'bg-black',
          // Rounded corners matching design
          'rounded-lg overflow-hidden',
          containerClassName
        )}
        data-testid="video-player-container"
      >
        <video
          ref={ref}
          src={src}
          autoPlay={shouldAutoplay}
          muted={muted}
          playsInline={playsInline}
          controls={controls}
          className={cn(
            'h-full w-full object-cover',
            className
          )}
          data-testid="video-player"
          {...props}
        />
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export { VideoPlayer };
