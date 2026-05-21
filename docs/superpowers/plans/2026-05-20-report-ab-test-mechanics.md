# /report A/B Test Mechanics - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the infrastructure to run a 50/50 A/B test on `/report` (current page vs a video-led variation), gated so the variation stays dark until a video URL is configured, with each lead's variation recorded in Close CRM.

**Architecture:** A small client-side module decides the variation at form submit (gated on the `NEXT_PUBLIC_REPORT_VIDEO_URL` env var, sticky via cookie). The variation rides to `/report` on a `&v=` URL param and is recorded server-side on the Close lead (first-write-wins) inside the existing `/api/generate-report` call. `ThankYouContent` reads the param and renders either the current section order or the video-led order.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict, CI runs `tsc -b`), Vitest + @testing-library/react, Close CRM REST API.

**Scope:** This is Plan 1 of 2. Plan 2 (the conversion dashboard) is a separate document and is built after this. This plan covers spec sections 5-8 of `docs/superpowers/specs/2026-05-20-report-ab-test-design.md`.

**Conventions for every task below:**
- All paths are relative to the repo root. The Next.js app lives in `web/`.
- Run all `npm` / `npx` commands from inside `web/`.
- Run a single test file with: `npx vitest run <path>`.
- Commit after each task with the message shown.

---

## Task 1: Create the "Lead Magnet Variation" custom field in Close CRM

This is a one-time setup script. It creates the Close custom field the test writes to, prints its ID, then the ID is wired into the shared field map.

**Files:**
- Create: `web/scripts/create-close-variation-field.ts`
- Modify: `web/src/lib/close/client.ts` (add one entry to `CLOSE_FIELDS`)

- [ ] **Step 1: Write the field-creation script**

Create `web/scripts/create-close-variation-field.ts`:

```ts
/**
 * One-time setup script: creates the "Lead Magnet Variation" custom field
 * on Close CRM leads. Run once, then paste the printed ID into
 * src/lib/close/client.ts -> CLOSE_FIELDS.leadMagnetVariation.
 *
 * Usage (from web/):  npx tsx scripts/create-close-variation-field.ts
 * Requires CLOSE_API_KEY in the environment (.env.local is loaded by tsx).
 */

import 'dotenv/config';

async function main() {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) {
    console.error('CLOSE_API_KEY is not set. Add it to web/.env.local and retry.');
    process.exit(1);
  }

  const auth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;

  // First, check whether the field already exists, so re-running is safe.
  const listResp = await fetch('https://api.close.com/api/v1/custom_field/lead/?_limit=200', {
    headers: { 'Content-Type': 'application/json', Authorization: auth },
  });
  if (listResp.ok) {
    const list = await listResp.json();
    const existing = (list.data ?? []).find(
      (f: { id: string; name: string }) => f.name === 'Lead Magnet Variation'
    );
    if (existing) {
      console.log(`Field already exists. ID: ${existing.id}`);
      return;
    }
  }

  const resp = await fetch('https://api.close.com/api/v1/custom_field/lead/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      name: 'Lead Magnet Variation',
      type: 'choices',
      accepts_multiple_values: false,
      choices: ['control', 'video'],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Failed to create field: HTTP ${resp.status}\n${text}`);
    process.exit(1);
  }

  const field = await resp.json();
  console.log(`Created custom field "Lead Magnet Variation".`);
  console.log(`ID: ${field.id}`);
  console.log(`Next: paste this ID into src/lib/close/client.ts -> CLOSE_FIELDS.leadMagnetVariation`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the script and capture the field ID**

Run from `web/`:

```bash
npx tsx scripts/create-close-variation-field.ts
```

Expected output: a line `ID: cf_XXXXXXXX...`. Copy that ID.
If it prints "Field already exists", use the ID it shows.

- [ ] **Step 3: Add the field ID to the shared `CLOSE_FIELDS` map**

In `web/src/lib/close/client.ts`, add one line to the `CLOSE_FIELDS` object (after the `utmTerm` entry, before the closing `} as const;`):

```ts
  // A/B test: which /report variation a lead was assigned (control | video)
  leadMagnetVariation: 'cf_PASTE_THE_ID_FROM_STEP_2',
```

Replace `cf_PASTE_THE_ID_FROM_STEP_2` with the actual ID from Step 2. After this task, all later tasks reference the symbol `CLOSE_FIELDS.leadMagnetVariation`, never the literal ID.

- [ ] **Step 4: Verify it typechecks**

Run from `web/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add web/scripts/create-close-variation-field.ts web/src/lib/close/client.ts
git commit -m "feat: add Lead Magnet Variation custom field to Close CRM"
```

---

## Task 2: Variation assignment + gating module

A pure-logic module that decides the variation, enforces the video gate, validates the video URL, and persists the assignment in a cookie. This is the testable core of the split.

**Files:**
- Create: `web/src/lib/ab-test/variation.ts`
- Test: `web/src/lib/ab-test/variation.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/ab-test/variation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `web/`:

```bash
npx vitest run src/lib/ab-test/variation.test.ts
```

Expected: FAIL - `Cannot find module './variation'`.

- [ ] **Step 3: Implement the module**

Create `web/src/lib/ab-test/variation.ts`:

```ts
/**
 * /report A/B test - variation assignment and gating.
 *
 * The test is GATED on NEXT_PUBLIC_REPORT_VIDEO_URL. With no valid video
 * URL configured the test is dark: assignVariation() returns null and
 * everyone sees the control page.
 */

export type Variation = 'control' | 'video';

const COOKIE_NAME = 'al_report_variation';
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Validate and normalize the configured video URL to an embeddable form.
 * Returns null if unset or not a usable URL (which keeps the test dark).
 */
export function getReportVideoUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_REPORT_VIDEO_URL ?? '').trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '');

  // youtu.be/<id>  ->  youtube.com/embed/<id>
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  // youtube.com/watch?v=<id>  ->  youtube.com/embed/<id>
  if (host === 'youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // already an /embed/ URL, or some other youtube path - pass through
    return raw;
  }

  // Loom, Vimeo, or anything else: pass the URL through as-is and let the
  // iframe load it. Ryan is responsible for supplying an embeddable URL.
  return raw;
}

/** True when a valid video URL is configured, i.e. the test should run. */
export function isReportTestLive(): boolean {
  return getReportVideoUrl() !== null;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

function isVariation(value: string | null): value is Variation {
  return value === 'control' || value === 'video';
}

/**
 * Assign this visitor a variation, called once at form submit.
 * - Returns null when the test is not live (caller records nothing).
 * - Reuses the cookie if present (same-browser stickiness).
 * - Otherwise rolls 50/50 and persists the result to the cookie.
 */
export function assignVariation(): Variation | null {
  if (!isReportTestLive()) return null;

  const existing = readCookie(COOKIE_NAME);
  if (isVariation(existing)) return existing;

  const rolled: Variation = Math.random() < 0.5 ? 'control' : 'video';
  writeCookie(COOKIE_NAME, rolled);
  return rolled;
}

/**
 * Read the variation the /report page should render, from its URL params.
 * Safety fallback: v=video only renders the video layout when a video is
 * actually configured; otherwise it falls back to control.
 */
export function readVariationParam(params: Pick<URLSearchParams, 'get'>): Variation {
  if (params.get('v') === 'video' && isReportTestLive()) return 'video';
  return 'control';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run from `web/`:

```bash
npx vitest run src/lib/ab-test/variation.test.ts
```

Expected: PASS - all tests green.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/ab-test/variation.ts web/src/lib/ab-test/variation.test.ts
git commit -m "feat: add /report A/B variation assignment and gating module"
```

---

## Task 3: Record the variation on the Close lead (first-write-wins)

A server-side function that writes the variation to the lead, but only if the field is currently empty - so re-submissions never change a lead's assignment.

**Files:**
- Create: `web/src/lib/close/record-variation.ts`
- Test: `web/src/lib/close/record-variation.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/close/record-variation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `web/`:

```bash
npx vitest run src/lib/close/record-variation.test.ts
```

Expected: FAIL - `Cannot find module './record-variation'`.

- [ ] **Step 3: Implement the function**

Create `web/src/lib/close/record-variation.ts`:

```ts
/**
 * Record the assigned A/B variation on a Close CRM lead.
 *
 * First-write-wins: if the lead already has a variation, it is left
 * untouched. This keeps a lead's assignment fixed for the life of the
 * test even though Close dedupes leads by email and a person may submit
 * the funnel more than once.
 */

import type { Variation } from '@/lib/ab-test/variation';
import { getLead, updateLeadFields, CLOSE_FIELDS } from './client';

const FIELD_KEY = `custom.${CLOSE_FIELDS.leadMagnetVariation}`;

export async function recordLeadVariation(
  leadId: string,
  variation: Variation
): Promise<boolean> {
  if (!leadId) {
    console.error('[recordLeadVariation] Missing leadId');
    return false;
  }

  const lead = await getLead(leadId);
  if (!lead) {
    console.error('[recordLeadVariation] Lead not found', { leadId });
    return false;
  }

  // First-write-wins: never overwrite an existing assignment.
  if (lead[FIELD_KEY]) {
    return true;
  }

  return updateLeadFields(leadId, { [FIELD_KEY]: variation });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run from `web/`:

```bash
npx vitest run src/lib/close/record-variation.test.ts
```

Expected: PASS - all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/close/record-variation.ts web/src/lib/close/record-variation.test.ts
git commit -m "feat: record A/B variation on Close lead with first-write-wins"
```

---

## Task 4: Accept and record the variation in `/api/generate-report`

Add `variation` to the request type and have the route record it on the lead before running the report pipeline.

**Files:**
- Modify: `web/src/lib/report-pipeline.ts` (add one field to an interface)
- Modify: `web/src/app/api/generate-report/route.ts`
- Test: `web/src/app/api/generate-report/route.test.ts`

- [ ] **Step 1: Add `variation` to the `GenerateReportRequest` type**

In `web/src/lib/report-pipeline.ts`, find the exported `GenerateReportRequest` interface. Add this field to it (alongside the existing optional fields like `apologyIntro`):

```ts
  /** A/B test: which /report variation this lead was assigned. */
  variation?: 'control' | 'video';
```

- [ ] **Step 2: Write the failing test**

Create `web/src/app/api/generate-report/route.test.ts`:

```ts
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
      leadResolution: 'existing',
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run from `web/`:

```bash
npx vitest run src/app/api/generate-report/route.test.ts
```

Expected: FAIL - the route does not import or call `recordLeadVariation` yet.

- [ ] **Step 4: Wire `recordLeadVariation` into the route**

In `web/src/app/api/generate-report/route.ts`:

Add this import next to the existing imports:

```ts
import { recordLeadVariation } from '@/lib/close/record-variation';
```

Add `variation` to the destructured body (the line currently reads `const { email, firstName, lastName, phone, revenue, painPoints, leadId, apologyIntro } = body;`):

```ts
  const { email, firstName, lastName, phone, revenue, painPoints, leadId, apologyIntro, variation } = body;
```

Immediately after the `if (!email) { ... }` block and before the `console.log(...Report generation started...)` line, add:

```ts
  // A/B test: record which /report variation this lead saw. First-write-wins,
  // non-blocking - a failure here must never block report generation.
  if (leadId && (variation === 'control' || variation === 'video')) {
    try {
      await recordLeadVariation(leadId, variation);
    } catch (err) {
      console.error(`[API:generate-report] [${submissionId}] recordLeadVariation failed`, err);
    }
  }
```

- [ ] **Step 5: Run the test to verify it passes**

Run from `web/`:

```bash
npx vitest run src/app/api/generate-report/route.test.ts
```

Expected: PASS - all 4 tests green.

- [ ] **Step 6: Verify the typecheck passes**

Run from `web/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add web/src/lib/report-pipeline.ts web/src/app/api/generate-report/route.ts web/src/app/api/generate-report/route.test.ts
git commit -m "feat: record A/B variation on lead in generate-report route"
```

---

## Task 5: Assign the variation in the form and pass it through

Wire the split into the form's final submit: assign a variation, send it to `/api/generate-report`, and append it to the `/report` redirect URL.

**Files:**
- Modify: `web/src/components/form/multi-step-form.tsx`

- [ ] **Step 1: Import the assignment function**

In `web/src/components/form/multi-step-form.tsx`, add to the imports:

```ts
import { assignVariation } from '@/lib/ab-test/variation';
```

- [ ] **Step 2: Assign the variation at the start of the Screen 4 final submit**

In the Screen 4 `BusinessDetailsScreen` `onSubmit` handler, immediately after `setIsLoading(true);`, add:

```ts
            // A/B test: assign this lead a /report variation (null when the
            // test is gated off - see lib/ab-test/variation.ts).
            const variation = assignVariation();
```

- [ ] **Step 3: Include the variation in the generate-report call**

Add `variation` to the `/api/generate-report` request body (after the `utm_term: utm.utm_term,` line inside that `fetch` body):

```ts
                variation: variation ?? undefined,
```

(The `/report` page reads the variation from the `&v=` URL param added in Step 4, so it does not need to be added to the encoded `reportData` blob.)

- [ ] **Step 4: Append the variation to the redirect URL (both code paths)**

In the primary redirect (the `try` block), change:

```ts
              window.location.href = `/report?data=${encodeURIComponent(encodedData)}`;
```

to:

```ts
              const variationParam = variation ? `&v=${variation}` : '';
              window.location.href = `/report?data=${encodeURIComponent(encodedData)}${variationParam}`;
```

In the `catch` fallback, change the `URLSearchParams` construction so the variation is included. Replace:

```ts
              const params = new URLSearchParams({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                revenue: revenue,
                painPoints: painPoints,
                leadId: currentLeadId,
              });
```

with:

```ts
              const params = new URLSearchParams({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                revenue: revenue,
                painPoints: painPoints,
                leadId: currentLeadId,
              });
              if (variation) params.set('v', variation);
```

- [ ] **Step 5: Verify the typecheck passes**

Run from `web/`:

```bash
npx tsc -b
```

Expected: no errors. (If `tsc` reports that `variation` is unused, recheck Steps 3-4 - it must be referenced in the body, reportData, and both redirects.)

- [ ] **Step 6: Manual smoke check**

Run the dev server (`npm run dev` from `web/`). With no `NEXT_PUBLIC_REPORT_VIDEO_URL` set, complete the form: the redirect URL must be `/report?data=...` with NO `&v=` (test is gated off). Then add `NEXT_PUBLIC_REPORT_VIDEO_URL=https://youtu.be/dQw4w9WgXcQ` to `web/.env.local`, restart dev, complete the form again: the redirect URL must now include `&v=control` or `&v=video`.

- [ ] **Step 7: Commit**

```bash
git add web/src/components/form/multi-step-form.tsx
git commit -m "feat: assign and propagate /report A/B variation from the form"
```

---

## Task 6: Render the video-led variation in `ThankYouContent`

Make `/report` render the video-led section order when `v=video`, and the current order otherwise.

**Files:**
- Modify: `web/src/components/thank-you/thank-you-content.tsx`
- Test: `web/src/components/thank-you/thank-you-content.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/thank-you/thank-you-content.test.tsx`:

```tsx
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

afterEach(() => {
  vi.unstubAllEnvs();
  searchParamsValue = '';
});

describe('ThankYouContent', () => {
  it('control: renders no video section', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', '');
    searchParamsValue = 'firstName=Sam&email=a@b.com';
    render(<ThankYouContent />);
    expect(screen.queryByTestId('video-section')).toBeNull();
    expect(screen.getByTestId('cta-section')).toBeDefined();
  });

  it('video variation: renders the video section above the calendar', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', 'https://youtu.be/ABC123');
    searchParamsValue = 'firstName=Sam&email=a@b.com&v=video';
    render(<ThankYouContent />);

    const video = screen.getByTestId('video-section');
    const cta = screen.getByTestId('cta-section');
    expect(video).toBeDefined();
    // Video must appear before the calendar in document order.
    expect(video.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('video param but test gated off: falls back to control (no video)', () => {
    vi.stubEnv('NEXT_PUBLIC_REPORT_VIDEO_URL', '');
    searchParamsValue = 'firstName=Sam&email=a@b.com&v=video';
    render(<ThankYouContent />);
    expect(screen.queryByTestId('video-section')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `web/`:

```bash
npx vitest run src/components/thank-you/thank-you-content.test.tsx
```

Expected: FAIL - `ThankYouContent` does not render `VideoSection` for `v=video` yet.

- [ ] **Step 3: Implement the conditional layout**

In `web/src/components/thank-you/thank-you-content.tsx`:

Add to the imports:

```ts
import { ConfirmationBanner } from './confirmation-banner';
import { VideoSection } from './video-section';
import { readVariationParam, getReportVideoUrl } from '@/lib/ab-test/variation';
```

Inside the component, right after `const formData = React.useMemo(...)`, add:

```ts
  const variation = readVariationParam(searchParams);
  const reportVideoUrl = getReportVideoUrl();
```

Replace the JSX block from `{/* 2. Hero Pain Section */}` through `{/* 9. Final CTA */}` (the `<HeroPain ... />` ... `<FinalCTASection ... />` sequence) with section variables plus an ordered render. First, just before the `return (`, build the sections:

```ts
  const navHeader = (
    <div
      key="nav"
      style={{
        background: '#0f172a',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <a href="https://www.assistantlaunch.com" style={{ textDecoration: 'none', display: 'inline-block' }}>
        <span style={{ fontFamily: 'var(--font-dm-serif), "DM Serif Display", serif', fontSize: '24px', color: '#f59e0b' }}>
          Assistant Launch &#128640;
        </span>
      </a>
    </div>
  );

  const heroPain = <HeroPain key="hero" firstName={formData?.firstName || 'there'} onCTAClick={handleCTAClick} />;
  const costCard = (
    <CostCard key="cost" taskHours={taskHours} revenueRange={revenueRange} onCTAClick={handleCTAClick} />
  );
  const overwhelm = <OverwhelmSection key="overwhelm" onCTAClick={handleCTAClick} />;
  const howItWorks = <HowItWorksSection key="how" onCTAClick={handleCTAClick} />;
  const ctaSection = (
    <CTASection
      key="cta"
      firstName={formData?.firstName || ''}
      lastName={formData?.lastName || ''}
      email={formData?.email || ''}
      phone={formData?.phone || ''}
      painPoints={formData?.painPoints || ''}
      leadId={formData?.leadId || ''}
      meta_fbc={formData?.meta_fbc || ''}
      meta_fbp={formData?.meta_fbp || ''}
      revenue={revenueRange}
    />
  );
  const socialProof = <SocialProofSection key="social" onCTAClick={handleCTAClick} />;
  const faq = <FAQSection key="faq" onCTAClick={handleCTAClick} />;
  const finalCta = <FinalCTASection key="final" annualHours={annualHours} onButtonClick={handleCTAClick} />;

  const confirmationBanner = (
    <ConfirmationBanner key="banner" firstName={formData?.firstName || ''} email={formData?.email || ''} />
  );
  const videoSection =
    variation === 'video' && reportVideoUrl ? (
      <VideoSection key="video" videoUrl={reportVideoUrl} />
    ) : null;

  const controlOrder = [
    navHeader, heroPain, costCard, overwhelm, howItWorks, ctaSection, socialProof, faq, finalCta,
  ];
  const videoOrder = [
    navHeader, confirmationBanner, videoSection, ctaSection, heroPain, costCard, overwhelm, howItWorks, socialProof, faq, finalCta,
  ];

  const sections = variation === 'video' ? videoOrder : controlOrder;
```

Then in the returned JSX, replace the nav-header `<div>` and the sequence of section components with `{sections}`. The wrapping `<div className="w-full" style={{ background: '#f1f5f9' }}>`, the email toast block, and the `<style>` block all stay exactly as they are. The result is:

```tsx
  return (
    <div className="w-full" style={{ background: '#f1f5f9' }}>
      {sections}

      {/* Email toast notification - unchanged */}
      {showEmailToast && formData?.email && (
        /* ...existing toast JSX, unchanged... */
      )}

      {/* Page-level styles - unchanged */}
      <style>{`
        /* ...existing styles, unchanged... */
      `}</style>
    </div>
  );
```

(Keep the existing toast JSX and `<style>` contents verbatim - only the nav div and the section components are replaced by `{sections}`.)

- [ ] **Step 4: Run the test to verify it passes**

Run from `web/`:

```bash
npx vitest run src/components/thank-you/thank-you-content.test.tsx
```

Expected: PASS - all 3 tests green. If a non-mocked section component throws under jsdom (for example a chart library failing to measure layout), add a `vi.mock(...)` stub for that component at the top of the test file, the same way `cta-section` is mocked.

- [ ] **Step 5: Verify the typecheck passes**

Run from `web/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/thank-you/thank-you-content.tsx web/src/components/thank-you/thank-you-content.test.tsx
git commit -m "feat: render video-led /report variation when v=video"
```

---

## Task 7: Update `ConfirmationBanner` for the variation

`ConfirmationBanner` currently takes only `email`. Add a `firstName` prop and the "one step left" copy used by the variation.

**Files:**
- Modify: `web/src/components/thank-you/confirmation-banner.tsx`
- Test: `web/src/components/thank-you/confirmation-banner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/components/thank-you/confirmation-banner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmationBanner } from './confirmation-banner';

describe('ConfirmationBanner', () => {
  it('greets the user by first name', () => {
    render(<ConfirmationBanner firstName="Sam" email="sam@example.com" />);
    expect(screen.getByText(/Congrats Sam/i)).toBeDefined();
  });

  it('tells the user there is one step left', () => {
    render(<ConfirmationBanner firstName="Sam" email="sam@example.com" />);
    expect(screen.getByText(/one step/i)).toBeDefined();
  });

  it('renders without a first name', () => {
    render(<ConfirmationBanner email="sam@example.com" />);
    expect(screen.getByText(/one step/i)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `web/`:

```bash
npx vitest run src/components/thank-you/confirmation-banner.test.tsx
```

Expected: FAIL - the banner does not accept `firstName` or render "Congrats" copy yet.

- [ ] **Step 3: Update the component**

Replace the contents of `web/src/components/thank-you/confirmation-banner.tsx` with:

```tsx
/**
 * ConfirmationBanner Component
 * Green gradient banner at the top of the video-led /report variation.
 * "Congrats, one step left" framing per the A/B test design.
 */

"use client";

interface ConfirmationBannerProps {
  firstName?: string;
  email?: string;
}

export function ConfirmationBanner({ firstName, email }: ConfirmationBannerProps) {
  const greeting = firstName ? `Congrats ${firstName}, you're one step away.` : "Congrats, you're one step away.";

  return (
    <div
      className="text-center text-white"
      style={{
        fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif',
        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        padding: '20px 16px',
        fontWeight: 500,
      }}
    >
      <div style={{ marginBottom: '4px' }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }}
        >
          <path
            d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"
            fill="currentColor"
          />
        </svg>
        <strong>{greeting}</strong>
      </div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        Watch this 60-second video, then book your call right below.
        {email ? ` Your full report is on its way to ${email}.` : ''}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run from `web/`:

```bash
npx vitest run src/components/thank-you/confirmation-banner.test.tsx
```

Expected: PASS - all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/thank-you/confirmation-banner.tsx web/src/components/thank-you/confirmation-banner.test.tsx
git commit -m "feat: add firstName + one-step-left copy to ConfirmationBanner"
```

---

## Task 8: Full verification

Confirm the whole test suite, typecheck, and production build all pass together.

- [ ] **Step 1: Run the full test suite**

Run from `web/`:

```bash
npx vitest run
```

Expected: PASS - all tests, including the existing suite, green.

- [ ] **Step 2: Run the typecheck**

Run from `web/`:

```bash
npx tsc -b
```

Expected: no errors.

- [ ] **Step 3: Run the production build**

Run from `web/`:

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Manual end-to-end smoke test**

Add `NEXT_PUBLIC_REPORT_VIDEO_URL=https://youtu.be/dQw4w9WgXcQ` to `web/.env.local`, run `npm run dev`, and complete the funnel a few times:
- The redirect URL alternates `&v=control` / `&v=video` across fresh browser sessions (clear the `al_report_variation` cookie between runs).
- `v=video` shows the green banner, then the video, then the calendar, then the rest of the page.
- `v=control` shows the current page unchanged.
- In Close CRM, the test leads have the "Lead Magnet Variation" field set, and a re-submit with the same email does not change it.
Remove the placeholder video URL from `.env.local` when done (real go-live happens via the Vercel env var).

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "test: verify /report A/B test mechanics build and pass"
```

(Skip this commit if there were no changes.)

---

## Notes for the executor

- **Do not set `NEXT_PUBLIC_REPORT_VIDEO_URL` in production.** The test going live is Ryan's call - he sets the real video URL in the Vercel env vars when his 60-second video is ready. Until then, production has no video URL and serves 100% control.
- **The variation copy** in `ConfirmationBanner` (Task 7) and the `VideoSection` heading are drafts. Final wording is confirmed with David's script points before the test goes live; that is a content change, not a code change.
- After this plan is complete, Plan 2 (the conversion dashboard) is written and executed.
