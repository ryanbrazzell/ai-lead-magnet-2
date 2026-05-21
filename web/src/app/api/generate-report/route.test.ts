import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { runPipeline } from '@/lib/report-pipeline';
import { recordLeadVariation } from '@/lib/close/record-variation';

vi.mock('@/lib/report-pipeline', () => ({
  runPipeline: vi.fn(),
}));
vi.mock('@/lib/close/record-variation', () => ({
  recordLeadVariation: vi.fn(),
}));
vi.mock('@/lib/alerts/critical-alert', () => ({
  sendSlackAlert: vi.fn().mockResolvedValue(undefined),
}));

const mockRunPipeline = vi.mocked(runPipeline);
const mockRecordLeadVariation = vi.mocked(recordLeadVariation);

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/generate-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunPipeline.mockResolvedValue({
      success: true,
      submissionId: 'sub_1',
      leadId: 'lead_1',
      email: 'a@b.com',
      leadResolution: 'found',
      tasksGenerated: true,
      pdfGenerated: true,
      blobUploaded: true,
      emailSent: true,
      crmUpdated: true,
      durationMs: 1000,
    } as Awaited<ReturnType<typeof runPipeline>>);
    mockRecordLeadVariation.mockResolvedValue(true);
  });

  it('records the variation when one is supplied with a leadId', async () => {
    const res = await POST(
      makeRequest({ email: 'a@b.com', leadId: 'lead_1', variation: 'video' })
    );

    expect(res.status).toBe(200);
    expect(mockRecordLeadVariation).toHaveBeenCalledWith('lead_1', 'video');
  });

  it('does not record a variation when none is supplied', async () => {
    await POST(makeRequest({ email: 'a@b.com', leadId: 'lead_1' }));

    expect(mockRecordLeadVariation).not.toHaveBeenCalled();
  });

  it('does not record a variation when leadId is missing', async () => {
    await POST(makeRequest({ email: 'a@b.com', variation: 'video' }));

    expect(mockRecordLeadVariation).not.toHaveBeenCalled();
  });

  it('still runs the report pipeline', async () => {
    await POST(makeRequest({ email: 'a@b.com', leadId: 'lead_1', variation: 'control' }));

    expect(mockRunPipeline).toHaveBeenCalled();
  });
});
