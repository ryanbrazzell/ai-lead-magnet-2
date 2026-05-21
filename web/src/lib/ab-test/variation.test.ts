import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getReportVideoUrl,
  isReportTestLive,
  assignVariation,
  readVariationParam,
} from './variation';

function clearCookies() {
  document.cookie
    .split(';')
    .forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
}

describe('getReportVideoUrl', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns null when the env var is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', '');
    expect(getReportVideoUrl()).toBeNull();
  });

  it('returns null when the value is not a valid URL', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'not a url');
    expect(getReportVideoUrl()).toBeNull();
  });

  it('normalizes a YouTube watch URL to an embed URL', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://www.youtube.com/watch?v=ABC123');
    expect(getReportVideoUrl()).toBe('https://www.youtube.com/embed/ABC123');
  });

  it('normalizes a youtu.be short URL to an embed URL', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    expect(getReportVideoUrl()).toBe('https://www.youtube.com/embed/ABC123');
  });

  it('passes through an already-embeddable URL unchanged', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://www.loom.com/embed/xyz');
    expect(getReportVideoUrl()).toBe('https://www.loom.com/embed/xyz');
  });

  it('returns null for a non-embeddable youtube.com URL (playlist)', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://www.youtube.com/playlist?list=PL123');
    expect(getReportVideoUrl()).toBeNull();
  });
});

describe('isReportTestLive', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is false when no video URL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', '');
    expect(isReportTestLive()).toBe(false);
  });

  it('is true when a valid video URL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    expect(isReportTestLive()).toBe(true);
  });
});

describe('assignVariation', () => {
  beforeEach(() => clearCookies());
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns null when the test is not live', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', '');
    expect(assignVariation()).toBeNull();
  });

  it('rolls "control" when Math.random < 0.5 and persists it to a cookie', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    expect(assignVariation()).toBe('control');
    expect(document.cookie).toContain('al_report_variation=control');
  });

  it('rolls "video" when Math.random >= 0.5', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    vi.spyOn(Math, 'random').mockReturnValue(0.8);
    expect(assignVariation()).toBe('video');
    expect(document.cookie).toContain('al_report_variation=video');
  });

  it('reuses an existing cookie instead of re-rolling (stickiness)', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    document.cookie = 'al_report_variation=video;path=/';
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // would roll control if re-rolled
    expect(assignVariation()).toBe('video');
  });
});

describe('readVariationParam', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns "video" when v=video and the test is live', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    expect(readVariationParam(new URLSearchParams('v=video'))).toBe('video');
  });

  it('falls back to "control" when v=video but no video is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', '');
    expect(readVariationParam(new URLSearchParams('v=video'))).toBe('control');
  });

  it('returns "control" when v is absent', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    expect(readVariationParam(new URLSearchParams(''))).toBe('control');
  });
});
