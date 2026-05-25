import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThankYouContent } from './thank-you-content';

// Skip the 8s analyzing animation: render nothing and complete immediately.
vi.mock('./analyzing-animation', () => ({
  AnalyzingAnimation: ({ onComplete }: { onComplete: () => void }) => {
    onComplete();
    return null;
  },
}));

// The iClosed calendar pulls in an external widget script - stub it.
vi.mock('./cta-section', () => ({
  CTASection: () => <div data-testid="cta-section">calendar</div>,
}));
vi.mock('./video-section', () => ({
  VideoSection: () => <div data-testid="video-section">video</div>,
}));

let searchParamsValue = '';
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

function clearVidalytics() {
  vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', '');
  vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', '');
}

function setVidalytics() {
  vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', 'G62Lauei4zG6JSTX');
  vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', 'ZBEGSIbh');
}

afterEach(() => {
  vi.unstubAllEnvs();
  searchParamsValue = '';
});

describe('ThankYouContent', () => {
  it('control: renders no video section', () => {
    clearVidalytics();
    searchParamsValue = 'firstName=Sam&email=a@b.com';
    render(<ThankYouContent />);
    expect(screen.queryByTestId('video-section')).toBeNull();
    expect(screen.getByTestId('cta-section')).toBeDefined();
  });

  it('video variation: renders the video section above the calendar', () => {
    setVidalytics();
    searchParamsValue = 'firstName=Sam&email=a@b.com&v=video';
    render(<ThankYouContent />);

    const video = screen.getByTestId('video-section');
    const cta = screen.getByTestId('cta-section');
    expect(video).toBeDefined();
    // Video must appear before the calendar in document order.
    expect(video.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('video param but test gated off: falls back to control (no video)', () => {
    clearVidalytics();
    searchParamsValue = 'firstName=Sam&email=a@b.com&v=video';
    render(<ThankYouContent />);
    expect(screen.queryByTestId('video-section')).toBeNull();
  });
});
