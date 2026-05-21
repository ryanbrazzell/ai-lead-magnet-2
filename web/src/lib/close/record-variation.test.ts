import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordLeadVariation } from './record-variation';
import { getLead, updateLeadFields, CLOSE_FIELDS } from './client';

vi.mock('./client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./client')>();
  return {
    ...actual,
    getLead: vi.fn(),
    updateLeadFields: vi.fn(),
  };
});

const mockGetLead = vi.mocked(getLead);
const mockUpdateLeadFields = vi.mocked(updateLeadFields);
const FIELD_KEY = `custom.${CLOSE_FIELDS.leadMagnetVariation}`;

describe('recordLeadVariation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes the variation when the field is empty', async () => {
    mockGetLead.mockResolvedValue({ id: 'lead_1' });
    mockUpdateLeadFields.mockResolvedValue(true);

    const result = await recordLeadVariation('lead_1', 'video');

    expect(result).toBe(true);
    expect(mockUpdateLeadFields).toHaveBeenCalledWith('lead_1', {
      [FIELD_KEY]: 'video',
    });
  });

  it('does NOT overwrite an already-set variation (first-write-wins)', async () => {
    mockGetLead.mockResolvedValue({ id: 'lead_1', [FIELD_KEY]: 'control' });

    const result = await recordLeadVariation('lead_1', 'video');

    expect(result).toBe(true);
    expect(mockUpdateLeadFields).not.toHaveBeenCalled();
  });

  it('returns false and does nothing when leadId is missing', async () => {
    const result = await recordLeadVariation('', 'video');

    expect(result).toBe(false);
    expect(mockGetLead).not.toHaveBeenCalled();
    expect(mockUpdateLeadFields).not.toHaveBeenCalled();
  });

  it('returns false when the lead cannot be fetched', async () => {
    mockGetLead.mockResolvedValue(null);

    const result = await recordLeadVariation('lead_1', 'control');

    expect(result).toBe(false);
    expect(mockUpdateLeadFields).not.toHaveBeenCalled();
  });
});
