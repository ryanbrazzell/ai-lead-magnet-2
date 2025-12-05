/**
 * Post-Submission Components Tests
 *
 * Tests for the post-submission experience components:
 * - VideoPlayer: 16:9 aspect ratio
 * - CountdownTimer: Countdown display and updates
 * - RevealContainer: Fade-in animation
 * - SchedulingWidget: Revealed state rendering
 *
 * @see Task Group 6 in tasks.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

import { VideoPlayer } from './video-player';
import { CountdownTimer } from './countdown-timer';
import { RevealContainer } from './reveal-container';
import { SchedulingWidget } from './scheduling-widget';

// Mock matchMedia for reduced motion tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Post-Submission Components', () => {
  beforeEach(() => {
    // Default to no reduced motion preference
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 1: VideoPlayer renders with 16:9 aspect ratio
   * Verifies the aspect-video class is applied for proper aspect ratio
   */
  describe('VideoPlayer', () => {
    it('renders with 16:9 aspect ratio', () => {
      render(<VideoPlayer src="/test-video.mp4" />);

      const container = screen.getByTestId('video-player-container');
      expect(container).toBeInTheDocument();

      // Check for aspect-video class (Tailwind's 16:9 aspect ratio utility)
      expect(container).toHaveClass('aspect-video');
      expect(container).toHaveClass('w-full');
    });

    it('renders video element with correct src', () => {
      render(<VideoPlayer src="/test-video.mp4" />);

      const video = screen.getByTestId('video-player');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', '/test-video.mp4');
    });
  });

  /**
   * Test 2: CountdownTimer displays countdown from 60 and updates every second
   * Test 3: CountdownTimer shows "Book Your Call in XXs" format
   */
  describe('CountdownTimer', () => {
    beforeEach(() => {
      // Use fake timers for countdown tests
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('displays countdown from 60 and updates every second', async () => {
      const onComplete = vi.fn();

      render(<CountdownTimer initialSeconds={60} onComplete={onComplete} />);

      const timer = screen.getByTestId('countdown-timer');
      expect(timer).toBeInTheDocument();

      // Initial state should show 60
      expect(timer).toHaveTextContent('60s');

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(timer).toHaveTextContent('59s');

      // Advance another second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(timer).toHaveTextContent('58s');
    });

    it('shows "Book Your Call in XXs" format', () => {
      render(<CountdownTimer initialSeconds={53} />);

      const timer = screen.getByTestId('countdown-timer');
      expect(timer).toHaveTextContent('Book Your Call in 53s');
    });

    it('triggers onComplete callback when countdown reaches 0', async () => {
      const onComplete = vi.fn();

      render(<CountdownTimer initialSeconds={3} onComplete={onComplete} />);

      // Advance to completion
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Check callback was called
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('displays purple styling matching brand', () => {
      render(<CountdownTimer />);

      const timer = screen.getByTestId('countdown-timer');
      expect(timer).toHaveClass('bg-primary');
      expect(timer).toHaveClass('text-white');
    });
  });

  /**
   * Test 4: RevealContainer fades in (300ms) when visible
   * Note: Uses real timers because Framer Motion uses requestAnimationFrame
   */
  describe('RevealContainer', () => {
    it('fades in (300ms) when visible', async () => {
      const { rerender } = render(
        <RevealContainer visible={false}>
          <div data-testid="revealed-content">Revealed Content</div>
        </RevealContainer>
      );

      // Content should not be in DOM when not visible
      expect(screen.queryByTestId('reveal-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('revealed-content')).not.toBeInTheDocument();

      // Rerender with visible=true
      rerender(
        <RevealContainer visible={true}>
          <div data-testid="revealed-content">Revealed Content</div>
        </RevealContainer>
      );

      // Container should now be in DOM (Framer Motion renders immediately, then animates)
      await waitFor(
        () => {
          const container = screen.getByTestId('reveal-container');
          expect(container).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Content should be visible
      expect(screen.getByTestId('revealed-content')).toBeInTheDocument();
      expect(screen.getByText('Revealed Content')).toBeInTheDocument();
    });

    it('renders children when visible', () => {
      render(
        <RevealContainer visible={true}>
          <button>See If I&apos;m a Fit for a Scaling Workshop</button>
        </RevealContainer>
      );

      expect(
        screen.getByText("See If I'm a Fit for a Scaling Workshop")
      ).toBeInTheDocument();
    });
  });

  /**
   * Test 5: SchedulingWidget wrapper renders when revealed
   */
  describe('SchedulingWidget', () => {
    it('wrapper renders when revealed', () => {
      render(
        <RevealContainer visible={true}>
          <SchedulingWidget embedUrl="https://example.com/schedule" />
        </RevealContainer>
      );

      // Widget container should be in DOM
      const widget = screen.getByTestId('scheduling-widget');
      expect(widget).toBeInTheDocument();

      // Iframe should be present
      const iframe = screen.getByTestId('scheduling-widget-iframe');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', 'https://example.com/schedule');
    });

    it('shows loading state initially', () => {
      render(<SchedulingWidget embedUrl="https://example.com/schedule" />);

      const loading = screen.getByTestId('scheduling-widget-loading');
      expect(loading).toBeInTheDocument();
      expect(loading).toHaveTextContent('Loading scheduling widget...');
    });

    it('has lazy loading attribute on iframe', () => {
      render(<SchedulingWidget embedUrl="https://example.com/schedule" />);

      const iframe = screen.getByTestId('scheduling-widget-iframe');
      expect(iframe).toHaveAttribute('loading', 'lazy');
    });
  });
});
