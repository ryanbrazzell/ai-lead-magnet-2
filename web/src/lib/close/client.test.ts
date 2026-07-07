import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addLeadNote } from './client';

// Close's notes API requires note_html to be a single <body>...</body>
// document. Bare paragraph HTML gets a 400 ("HTML rich text fields in
// Close are expected to start with a <body> tag"). addLeadNote must wrap
// caller HTML so every call site stays simple.

const mockFetch = vi.fn();

describe('addLeadNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    vi.stubEnv('CLOSE_API_KEY', 'test_key');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function sentBody(): { lead_id: string; note_html: string } {
    const [, init] = mockFetch.mock.calls[0];
    return JSON.parse(init.body as string);
  }

  it('wraps bare paragraph HTML in a <body> document', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

    const ok = await addLeadNote('lead_1', '<p><strong>Report Delivered</strong></p><p>Details</p>');

    expect(ok).toBe(true);
    expect(sentBody().note_html).toBe(
      '<body><p><strong>Report Delivered</strong></p><p>Details</p></body>'
    );
  });

  it('does not double-wrap HTML that already has a <body> root', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

    await addLeadNote('lead_1', '<body><p>Already wrapped</p></body>');

    expect(sentBody().note_html).toBe('<body><p>Already wrapped</p></body>');
  });

  it('returns false and logs the response body on a non-ok response', async () => {
    mockFetch.mockResolvedValue(
      new Response('{"field-errors": {"note_html": "bad"}}', { status: 400 })
    );

    const ok = await addLeadNote('lead_1', '<p>x</p>');

    expect(ok).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      '[Close:addLeadNote] Non-ok response',
      400,
      expect.stringContaining('field-errors')
    );
  });
});
