# /report A/B Conversion Dashboard - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a password-protected `/dashboard` page that reads the A/B test results from Close CRM and shows, per variation (control vs video), the visit count, booked-call count, and conversion rate.

**Architecture:** A server component at `/dashboard` checks a signed auth cookie. Without it, it renders a password form that posts to a server action; the action validates the password against `DASHBOARD_PASSWORD` and sets the cookie. With it, the page fetches stats from Close CRM (paginating all leads, bucketing by the "Lead Magnet Variation" custom field and booked-status) and renders a comparison view with a recharts bar chart.

**Tech Stack:** Next.js 16 (App Router, server components + server actions), React 19, TypeScript (strict, CI runs `tsc -b`), Vitest + @testing-library/react, recharts 3 (already a dependency), Close CRM REST API, Node `crypto`.

**Scope:** This is Plan 2 of 2. Plan 1 (the A/B test mechanics) is built on branch `report-ab-test` and is a prerequisite — it created `CLOSE_FIELDS.leadMagnetVariation` and records each lead's variation. This plan covers spec section 9 of `docs/superpowers/specs/2026-05-20-report-ab-test-design.md`. Build this on the `report-ab-test` branch (or a branch off it).

**Conventions for every task:**
- Paths are relative to the repo root; the Next.js app is in `web/`.
- Run `npm`/`npx` commands from inside `web/`.
- Single test file: `npx vitest run <path>`.
- Commit after each task with the message shown.

---

## Task 1: Dashboard auth module

Pure server-side functions: validate the password, and mint/verify a signed auth cookie. Signed = an HMAC keyed by the password, so rotating `DASHBOARD_PASSWORD` invalidates old cookies.

**Files:**
- Create: `web/src/lib/dashboard/auth.ts`
- Test: `web/src/lib/dashboard/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/dashboard/auth.test.ts`:

```ts
import { describe, it, expect, afterEach, vi } from 'vitest';
import { checkPassword, mintAuthToken, isValidAuthToken, AUTH_COOKIE_NAME } from './auth';

afterEach(() => vi.unstubAllEnvs());

describe('checkPassword', () => {
  it('accepts the correct password', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(checkPassword('secret123')).toBe(true);
  });

  it('rejects a wrong password', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(checkPassword('wrong')).toBe(false);
  });

  it('rejects an empty submission', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(checkPassword('')).toBe(false);
  });

  it('rejects everything when DASHBOARD_PASSWORD is unset', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', '');
    expect(checkPassword('anything')).toBe(false);
  });
});

describe('mintAuthToken / isValidAuthToken', () => {
  it('a freshly minted token validates', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(isValidAuthToken(mintAuthToken())).toBe(true);
  });

  it('rejects an undefined or empty token', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(isValidAuthToken(undefined)).toBe(false);
    expect(isValidAuthToken('')).toBe(false);
  });

  it('rejects a garbage token', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'secret123');
    expect(isValidAuthToken('not-a-real-token')).toBe(false);
  });

  it('a token minted under the old password fails after rotation', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', 'oldpass');
    const old = mintAuthToken();
    vi.stubEnv('DASHBOARD_PASSWORD', 'newpass');
    expect(isValidAuthToken(old)).toBe(false);
  });

  it('rejects all tokens when DASHBOARD_PASSWORD is unset', () => {
    vi.stubEnv('DASHBOARD_PASSWORD', '');
    expect(isValidAuthToken('anything')).toBe(false);
  });

  it('exports a stable cookie name', () => {
    expect(typeof AUTH_COOKIE_NAME).toBe('string');
    expect(AUTH_COOKIE_NAME.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `web/`: `npx vitest run src/lib/dashboard/auth.test.ts`
Expected: FAIL - `Cannot find module './auth'`.

- [ ] **Step 3: Implement the module**

Create `web/src/lib/dashboard/auth.ts`:

```ts
/**
 * Dashboard auth - server-side only.
 *
 * The password is checked against DASHBOARD_PASSWORD. A successful login
 * gets a cookie whose value is an HMAC keyed by the password itself, so
 * rotating DASHBOARD_PASSWORD instantly invalidates every old cookie.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export const AUTH_COOKIE_NAME = 'al_dashboard_auth';

// Fixed payload the HMAC signs. The secret is the password, so the token
// is unguessable without it and changes when the password changes.
const TOKEN_PAYLOAD = 'al-dashboard-session-v1';

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** True only when `submitted` exactly matches DASHBOARD_PASSWORD. */
export function checkPassword(submitted: string): boolean {
  const real = process.env.DASHBOARD_PASSWORD;
  if (!real || !submitted) return false;
  return timingSafeStringEqual(submitted, real);
}

/** Mint the signed cookie value for a logged-in session. */
export function mintAuthToken(): string {
  const password = process.env.DASHBOARD_PASSWORD ?? '';
  return createHmac('sha256', password).update(TOKEN_PAYLOAD).digest('hex');
}

/** Validate a cookie value. False if unset, malformed, or minted under a different password. */
export function isValidAuthToken(token: string | undefined): boolean {
  if (!token) return false;
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return false;
  const expected = createHmac('sha256', password).update(TOKEN_PAYLOAD).digest('hex');
  return timingSafeStringEqual(token, expected);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run from `web/`: `npx vitest run src/lib/dashboard/auth.test.ts`
Expected: PASS - all tests green.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/dashboard/auth.ts web/src/lib/dashboard/auth.test.ts
git commit -m "feat: add dashboard auth module (password check + signed cookie)"
```

---

## Task 2: Close A/B stats module

A server-side function that pages through Close leads and buckets them by variation and booked-status into the numbers the dashboard shows.

**Files:**
- Create: `web/src/lib/close/ab-stats.ts`
- Test: `web/src/lib/close/ab-stats.test.ts`

**Context:** Close custom fields come back on a lead as flat keys, e.g. `lead["custom.cf_xxx"]` - the same shape Plan 1's `record-variation.ts` reads. The two booked-call status IDs are defined in `web/src/app/api/close/mark-call-booked/route.ts` (`STATUS_STRATEGY_CALL_BOOKED`, `STATUS_TRIAGE_CALL_BOOKED`).

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/close/ab-stats.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `web/`: `npx vitest run src/lib/close/ab-stats.test.ts`
Expected: FAIL - `Cannot find module './ab-stats'`.

- [ ] **Step 3: Implement the module**

Create `web/src/lib/close/ab-stats.ts`:

```ts
/**
 * A/B test stats from Close CRM, for the /dashboard page.
 *
 * Pages through Close leads and buckets them by the "Lead Magnet Variation"
 * custom field and booked-call status. Leads with no variation (pre-test or
 * gated-off) are ignored, so the numbers only reflect the live test.
 */

import { CLOSE_FIELDS } from './client';

const CLOSE_API_BASE = 'https://api.close.com/api/v1';
const PAGE_SIZE = 100;
const MAX_PAGES = 200; // safety ceiling: 20k leads

// Booked-call lead statuses (see app/api/close/mark-call-booked/route.ts).
const BOOKED_STATUS_IDS = new Set<string>([
  'stat_DQePUkSNuYYtuwVyfqJ40fOf1KrgwKUqOiUJvTfZ2nP', // Strategy Call Booked
  'stat_UEiczhS2rm7a0rcaick2wizlAlL18KRabpGPA9vc7E9', // Triage Call Booked
]);

export interface VariationStats {
  visits: number;
  booked: number;
  rate: number; // booked / visits, 0 when visits === 0
}

export interface AbStats {
  control: VariationStats;
  video: VariationStats;
  generatedAt: string;
}

interface CloseLead {
  id?: string;
  status_id?: string;
  [key: string]: unknown;
}

const FIELD_KEY = `custom.${CLOSE_FIELDS.leadMagnetVariation}`;

function toStats(visits: number, booked: number): VariationStats {
  return { visits, booked, rate: visits > 0 ? booked / visits : 0 };
}

/**
 * Fetch and compute A/B stats. Returns null if Close is unreachable or
 * misconfigured - the dashboard treats null as a data-unavailable state.
 */
export async function getAbStats(): Promise<AbStats | null> {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) {
    console.error('[getAbStats] CLOSE_API_KEY is not set');
    return null;
  }

  const auth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  const counts = {
    control: { visits: 0, booked: 0 },
    video: { visits: 0, booked: 0 },
  };

  for (let page = 0; page < MAX_PAGES; page++) {
    const url =
      `${CLOSE_API_BASE}/lead/` +
      `?_fields=id,status_id,${encodeURIComponent(FIELD_KEY)}` +
      `&_limit=${PAGE_SIZE}&_skip=${page * PAGE_SIZE}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', Authorization: auth },
      });
    } catch (err) {
      console.error('[getAbStats] Close request threw', err);
      return null;
    }

    if (!res.ok) {
      console.error('[getAbStats] Close request failed', res.status);
      return null;
    }

    const body = (await res.json()) as { data?: CloseLead[]; has_more?: boolean };
    const leads = body.data ?? [];

    for (const lead of leads) {
      const variation = lead[FIELD_KEY];
      if (variation !== 'control' && variation !== 'video') continue;
      counts[variation].visits += 1;
      if (lead.status_id && BOOKED_STATUS_IDS.has(lead.status_id)) {
        counts[variation].booked += 1;
      }
    }

    if (!body.has_more) break;
  }

  return {
    control: toStats(counts.control.visits, counts.control.booked),
    video: toStats(counts.video.visits, counts.video.booked),
    generatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run from `web/`: `npx vitest run src/lib/close/ab-stats.test.ts`
Expected: PASS - all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/close/ab-stats.ts web/src/lib/close/ab-stats.test.ts
git commit -m "feat: add Close A/B stats query module"
```

---

## Task 3: The `/dashboard` route and login server action

The page (a server component) gates on the auth cookie; the server action handles login.

**Files:**
- Create: `web/src/app/dashboard/actions.ts`
- Create: `web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Create the login server action**

Create `web/src/app/dashboard/actions.ts`:

```ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkPassword, mintAuthToken, AUTH_COOKIE_NAME } from '@/lib/dashboard/auth';

const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Login server action. On the correct password it sets the signed auth
 * cookie and reloads /dashboard; otherwise it redirects back with ?error=1.
 */
export async function login(formData: FormData): Promise<void> {
  const submitted = String(formData.get('password') ?? '');

  if (!checkPassword(submitted)) {
    redirect('/dashboard?error=1');
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, mintAuthToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/dashboard',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  redirect('/dashboard');
}
```

- [ ] **Step 2: Create the page**

Create `web/src/app/dashboard/page.tsx`:

```tsx
/**
 * /dashboard - password-protected A/B test results.
 * Server component: gates on the signed auth cookie, then renders either
 * the login form or the live stats from Close.
 */

import { cookies } from 'next/headers';
import { isValidAuthToken, AUTH_COOKIE_NAME } from '@/lib/dashboard/auth';
import { getAbStats } from '@/lib/close/ab-stats';
import { login } from './actions';
import { LoginForm } from '@/components/dashboard/login-form';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const metadata = { title: 'A/B Dashboard | Assistant Launch' };

// Never cache a protected page.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  const authed = isValidAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!authed) {
    const params = await searchParams;
    return <LoginForm loginAction={login} showError={params.error === '1'} />;
  }

  const stats = await getAbStats();
  return <DashboardView stats={stats} />;
}
```

- [ ] **Step 3: Verify the typecheck passes**

Run from `web/`: `npx tsc -b`
Expected: it will FAIL only because `LoginForm` and `DashboardView` do not exist yet (Task 4). Confirm the only errors are the two missing `@/components/dashboard/*` modules. Any other error is a real problem - fix it.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/dashboard/actions.ts web/src/app/dashboard/page.tsx
git commit -m "feat: add /dashboard route and login server action"
```

---

## Task 4: Dashboard UI components

The login form and the stats view (with the recharts bar chart).

**Files:**
- Create: `web/src/components/dashboard/login-form.tsx`
- Create: `web/src/components/dashboard/dashboard-view.tsx`
- Test: `web/src/components/dashboard/dashboard-view.test.tsx`

- [ ] **Step 1: Create the login form**

Create `web/src/components/dashboard/login-form.tsx`:

```tsx
"use client";

interface LoginFormProps {
  loginAction: (formData: FormData) => void | Promise<void>;
  showError: boolean;
}

export function LoginForm({ loginAction, showError }: LoginFormProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <form
        action={loginAction}
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h1 style={{ fontSize: '18px', margin: 0, color: '#0f172a' }}>A/B Dashboard</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          required
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        />
        {showError && (
          <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Log in
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Write the failing test for the stats view**

Create `web/src/components/dashboard/dashboard-view.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from './dashboard-view';
import type { AbStats } from '@/lib/close/ab-stats';

// recharts needs layout measurement that jsdom lacks - stub the chart.
vi.mock('./conversion-chart', () => ({
  ConversionChart: () => <div data-testid="conversion-chart" />,
}));

const stats: AbStats = {
  control: { visits: 100, booked: 2, rate: 0.02 },
  video: { visits: 100, booked: 6, rate: 0.06 },
  generatedAt: '2026-05-20T00:00:00.000Z',
};

describe('DashboardView', () => {
  it('shows visit and booked counts for both variations', () => {
    render(<DashboardView stats={stats} />);
    expect(screen.getByText('Control')).toBeDefined();
    expect(screen.getByText('Video')).toBeDefined();
    // Both variations have 100 visits.
    expect(screen.getAllByText('100').length).toBe(2);
    expect(screen.getByText('2')).toBeDefined(); // control booked
    expect(screen.getByText('6')).toBeDefined(); // video booked
  });

  it('renders conversion rates as percentages', () => {
    render(<DashboardView stats={stats} />);
    expect(screen.getByText('2.0%')).toBeDefined();
    expect(screen.getByText('6.0%')).toBeDefined();
  });

  it('shows a data-unavailable message when stats is null', () => {
    render(<DashboardView stats={null} />);
    expect(screen.getByText(/could not load/i)).toBeDefined();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run from `web/`: `npx vitest run src/components/dashboard/dashboard-view.test.tsx`
Expected: FAIL - `Cannot find module './dashboard-view'`.

- [ ] **Step 4: Create the conversion chart**

Create `web/src/components/dashboard/conversion-chart.tsx`:

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ConversionChartProps {
  controlRate: number; // 0..1
  videoRate: number; // 0..1
}

export function ConversionChart({ controlRate, videoRate }: ConversionChartProps) {
  const data = [
    { name: 'Control', rate: Number((controlRate * 100).toFixed(1)) },
    { name: 'Video', rate: Number((videoRate * 100).toFixed(1)) },
  ];

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip formatter={(v: number) => `${v}%`} />
          <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
            <Cell fill="#94a3b8" />
            <Cell fill="#10b981" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 5: Create the dashboard view**

Create `web/src/components/dashboard/dashboard-view.tsx`:

```tsx
"use client";

import type { AbStats, VariationStats } from '@/lib/close/ab-stats';
import { ConversionChart } from './conversion-chart';

interface DashboardViewProps {
  stats: AbStats | null;
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function StatColumn({ label, stats }: { label: string; stats: VariationStats }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <h2 style={{ fontSize: '15px', color: '#0f172a', margin: '0 0 12px' }}>{label}</h2>
      <Metric label="Visits" value={String(stats.visits)} />
      <Metric label="Booked calls" value={String(stats.booked)} />
      <Metric label="Conversion rate" value={pct(stats.rate)} emphasis />
    </div>
  );
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ color: '#64748b', fontSize: '13px' }}>{label}</span>
      <span
        style={{
          color: emphasis ? '#10b981' : '#0f172a',
          fontWeight: emphasis ? 700 : 500,
          fontSize: emphasis ? '18px' : '14px',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function DashboardView({ stats }: DashboardViewProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        padding: '32px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', color: '#0f172a' }}>/report A/B Test</h1>

        {stats === null ? (
          <p style={{ color: '#dc2626' }}>
            Could not load stats from Close CRM. Check CLOSE_API_KEY and try again.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <StatColumn label="Control" stats={stats.control} />
              <StatColumn label="Video" stats={stats.video} />
            </div>
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '16px',
              }}
            >
              <h2 style={{ fontSize: '15px', color: '#0f172a', margin: '0 0 12px' }}>
                Conversion rate
              </h2>
              <ConversionChart controlRate={stats.control.rate} videoRate={stats.video.rate} />
            </div>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '12px' }}>
              Live from Close CRM. Generated {new Date(stats.generatedAt).toLocaleString()}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run from `web/`: `npx vitest run src/components/dashboard/dashboard-view.test.tsx`
Expected: PASS - all 3 tests green.

- [ ] **Step 7: Verify the typecheck passes**

Run from `web/`: `npx tsc -b`
Expected: no errors (Task 3's missing-module errors are now resolved).

- [ ] **Step 8: Commit**

```bash
git add web/src/components/dashboard/
git commit -m "feat: add dashboard login form and stats view with chart"
```

---

## Task 5: Full verification

- [ ] **Step 1: Run the new tests**

Run from `web/`:

```bash
npx vitest run src/lib/dashboard src/lib/close/ab-stats.test.ts src/components/dashboard
```

Expected: PASS - all dashboard tests green.

- [ ] **Step 2: Typecheck**

Run from `web/`: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Production build**

Run from `web/`: `npm run build`
Expected: success; the route list includes `/dashboard`.

- [ ] **Step 4: Manual smoke test**

Add `DASHBOARD_PASSWORD=testpass` to `web/.env.local`, run `npm run dev`, and visit `/dashboard`:
- With no cookie: the password form shows.
- Wrong password: form reloads with "Incorrect password."
- Correct password (`testpass`): the stats view renders. Without a real `CLOSE_API_KEY` it shows the "Could not load stats" message - that is expected and correct behavior for the misconfigured state.
- Reload `/dashboard`: still authed (cookie persists).
Remove `DASHBOARD_PASSWORD` from `.env.local` when done; the real value is set in Vercel at go-live.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "test: verify A/B dashboard build and pass"
```

(Skip if there were no changes.)

---

## Notes for the executor

- **Pre-existing test suite:** the repo's Vitest suite has ~90 unrelated pre-existing failures (Meta Pixel `fbq` in jsdom). Run only the dashboard test paths (Task 5 Step 1); do not be alarmed by the unrelated failures, and do not try to fix them here.
- **`DASHBOARD_PASSWORD`** is set in Vercel env vars at go-live, never committed. The dashboard is shared with Ryan, David, and Robin.
- **The Close field ID** (`CLOSE_FIELDS.leadMagnetVariation`) is empty until Plan 1's go-live step runs the create-field script. `getAbStats` works correctly once it is filled; with it empty, every lead's `custom.` lookup is undefined and stats read all-zero - harmless.
- **Date filtering** was in the spec as a "nice to have." It is intentionally omitted from v1: because Plan 1 only records a variation while the test is live, every lead with a variation is already a live-test lead, so all-time stats already equal test-window stats. Add a date selector later only if sub-range views are wanted.
- **Spec's "unattributed bookings" data-quality item:** the spec asked the dashboard to surface bookings it could not attribute to a variation. This is not cleanly computable - a booked Close lead with no variation field is indistinguishable from any booked lead that never came through the lead magnet at all. The real mitigation is Plan 1's design: the variation is recorded server-side during form submission, awaited and first-write-wins, so a form-completer reliably gets tagged; and `mark-call-booked` failures are already logged. If a hard tracking-gap check is wanted later, compare the dashboard's total visits against Meta's lead count for the campaign - a large gap would signal a recording problem. Flagged here for review rather than silently dropped.
