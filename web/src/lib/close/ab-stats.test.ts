import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAbStats } from './ab-stats';
import { CLOSE_FIELDS } from './client';

const FIELD = `custom.${CLOSE_FIELDS.leadMagnetVariation}`;
const STRATEGY_BOOKED = 'stat_DQePUkSNuYYtuwVyfqJ40fOf1KrgwKUqOiUJvTfZ2nP';
const TRIAGE_BOOKED = 'stat_UEiczhS2rm7a0rcaick2wizlAlL18KRabpGPA9vc7E9';
const NOT_BOOKED = 'stat_somethingElse';

function leadPage(leads: Array<Record<string, unknown>>, hasMore = false) {
  return { ok: true, json: async () => ({ data: leads, has_more: hasMore }) };
}

beforeEach(() => {
  vi.stubEnv('CLOSE_API_KEY', 'test-key');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('getAbStats', () => {
  it('returns null when CLOSE_API_KEY is unset', async () => {
    vi.stubEnv('CLOSE_API_KEY', '');
    expect(await getAbStats()).toBeNull();
  });

  it('buckets leads by variation and counts booked calls', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      leadPage([
        { id: 'l1', status_id: STRATEGY_BOOKED, [FIELD]: 'video' },
        { id: 'l2', status_id: NOT_BOOKED, [FIELD]: 'video' },
        { id: 'l3', status_id: TRIAGE_BOOKED, [FIELD]: 'control' },
        { id: 'l4', status_id: NOT_BOOKED, [FIELD]: 'control' },
        { id: 'l5', status_id: NOT_BOOKED, [FIELD]: 'control' },
        { id: 'l6', status_id: NOT_BOOKED }, // no variation - ignored
      ])
    );
    vi.stubGlobal('fetch', fetchMock);

    const stats = await getAbStats();

    expect(stats).not.toBeNull();
    expect(stats!.video).toEqual({ visits: 2, booked: 1, rate: 0.5 });
    expect(stats!.control).toEqual({ visits: 3, booked: 1, rate: 1 / 3 });
  });

  it('returns zeroed stats (rate 0) when there are no in-test leads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(leadPage([])));
    const stats = await getAbStats();
    expect(stats!.video).toEqual({ visits: 0, booked: 0, rate: 0 });
    expect(stats!.control).toEqual({ visits: 0, booked: 0, rate: 0 });
  });

  it('paginates until has_more is false', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(leadPage([{ id: 'l1', status_id: NOT_BOOKED, [FIELD]: 'video' }], true))
      .mockResolvedValueOnce(leadPage([{ id: 'l2', status_id: STRATEGY_BOOKED, [FIELD]: 'video' }], false));
    vi.stubGlobal('fetch', fetchMock);

    const stats = await getAbStats();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(stats!.video).toEqual({ visits: 2, booked: 1, rate: 0.5 });
  });

  it('returns null when a Close request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    expect(await getAbStats()).toBeNull();
  });
});
