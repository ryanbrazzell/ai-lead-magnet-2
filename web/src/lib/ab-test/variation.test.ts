import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getVidalyticsConfig,
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

function stubConfig(embedId = 'G62Lauei4zG6JSTX', shard = 'ZBEGSIbh') {
  vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', embedId);
  vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', shard);
}

describe('getVidalyticsConfig', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns null when the embed ID is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', '');
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', 'ZBEGSIbh');
    expect(getVidalyticsConfig()).toBeNull();
  });

  it('returns null when the shard is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', 'G62Lauei4zG6JSTX');
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', '');
    expect(getVidalyticsConfig()).toBeNull();
  });

  it('returns the config when both env vars are set', () => {
    stubConfig();
    expect(getVidalyticsConfig()).toEqual({
      embedId: 'G62Lauei4zG6JSTX',
      shard: 'ZBEGSIbh',
    });
  });

  it('trims whitespace from env values', () => {
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', '  G62Lauei4zG6JSTX  ');
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', '  ZBEGSIbh  ');
    expect(getVidalyticsConfig()).toEqual({
      embedId: 'G62Lauei4zG6JSTX',
      shard: 'ZBEGSIbh',
    });
  });
});

describe('isReportTestLive', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is false when no Vidalytics config is set', () => {
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', '');
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', '');
    expect(isReportTestLive()).toBe(false);
  });

  it('is true when the Vidalytics config is fully set', () => {
    stubConfig();
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
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', '');
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', '');
    expect(assignVariation()).toBeNull();
  });

  it('rolls "control" when Math.random < 0.5 and persists it to a cookie', () => {
    stubConfig();
    vi.spyOn(Math, 'random').mockReturnValue(0.2);
    expect(assignVariation()).toBe('control');
    expect(document.cookie).toContain('al_report_variation=control');
  });

  it('rolls "video" when Math.random >= 0.5', () => {
    stubConfig();
    vi.spyOn(Math, 'random').mockReturnValue(0.8);
    expect(assignVariation()).toBe('video');
    expect(document.cookie).toContain('al_report_variation=video');
  });

  it('reuses an existing cookie instead of re-rolling (stickiness)', () => {
    stubConfig();
    document.cookie = 'al_report_variation=video;path=/';
    vi.spyOn(Math, 'random').mockReturnValue(0.1); // would roll control if re-rolled
    expect(assignVariation()).toBe('video');
  });
});

describe('readVariationParam', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('returns "video" when v=video and the test is live', () => {
    stubConfig();
    expect(readVariationParam(new URLSearchParams('v=video'))).toBe('video');
  });

  it('falls back to "control" when v=video but no VSL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_EMBED_ID', '');
    vi.stubEnv('NEXT_PUBLIC_VIDALYTICS_VSL_SHARD', '');
    expect(readVariationParam(new URLSearchParams('v=video'))).toBe('control');
  });

  it('returns "control" when v is absent', () => {
    stubConfig();
    expect(readVariationParam(new URLSearchParams(''))).toBe('control');
  });
});
