# January Visitor-Experience Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the pre-booking visitor experience of report.assistantlaunch.com (form page + report page) to the end-of-January 2026 version, while keeping the current server-side report pipeline, email delivery, CRM, and tracking untouched.

**Architecture:** The January look is restored by checking out the January 30 snapshot (`de8189a`) of the report-page components, then re-attaching current plumbing at four verified touchpoints: the form's submit wiring stays current (it is 100% plumbing since January), the restored report page loses its obsolete client-side generation chain (the server pipeline now does that work - keeping both would double-send emails), the booking section keeps the current iClosed URL/params/scroll-fixes under January visuals, and every new lead is tagged `january-rollback` in Close CRM for before/after conversion measurement.

**Tech Stack:** Next.js (App Router), TypeScript, Vitest, Vercel, Close CRM API, iClosed embed, agent-browser CLI for browser verification.

**Spec:** `docs/superpowers/specs/2026-07-06-january-rollback-design.md`

## Global Constraints

- Repo: `~/ai-lead-magnet-2`. All `npm`/`npx` commands run from `~/ai-lead-magnet-2/web/`.
- All work on branch `rollback/january-visitor-experience` off `main`. NEVER push to `main` until Ryan approves the preview deploy (Task 10 gate).
- January snapshot commit: `de8189a` (2026-01-30).
- `npx tsc -b` must pass - CI is stricter than `tsc --noEmit` and catches unused vars/imports.
- Do NOT touch: anything under `web/src/app/api/` except the one-line change in Task 1; anything under `web/src/lib/` except the one-line type change in Task 1; `web/src/app/page.tsx`; `web/src/app/report/page.tsx`; `web/src/components/form/screens/`; `web/src/components/booking-confirmed/`; `web/src/components/book-call/`; dashboard code. (page.tsx / report/page.tsx / phone-screen.tsx only differ from January by Meta pixel tracking, which we keep.)
- Do NOT restore: `video-section.tsx`, `report-section.tsx`, `calendar-section.tsx` (calendar-section is already identical to January; the other two are only used by the current variant system and become inert).
- Browser verification uses `agent-browser` CLI only (never Playwright/claude-in-chrome for interactive checks).
- No real messages/emails to prospects during testing. Test submissions use a `+test` suffixed @assistantlaunch.com email.

---

### Task 1: Extend the variation vocabulary with `january-rollback`

**Files:**
- Modify: `web/src/lib/ab-test/variation.ts` (the `Variation` type, ~line 10)
- Modify: `web/src/app/api/generate-report/route.ts:60`
- Test: `web/src/app/api/generate-report/route.test.ts`

**Interfaces:**
- Consumes: existing `recordLeadVariation(leadId, variation)` (unchanged).
- Produces: `Variation` union now includes `'january-rollback'`; `/api/generate-report` accepts and records `variation: 'january-rollback'`. Task 2 relies on both.

- [ ] **Step 1: Create the branch**

```bash
cd ~/ai-lead-magnet-2 && git checkout main && git pull && git checkout -b rollback/january-visitor-experience
```

- [ ] **Step 2: Write the failing test**

Add to the `describe` block in `web/src/app/api/generate-report/route.test.ts` (follows the existing `makeRequest` pattern in that file):

```typescript
  it('records the january-rollback variation', async () => {
    const res = await POST(
      makeRequest({ email: 'a@b.com', leadId: 'lead_1', variation: 'january-rollback' })
    );

    expect(res.status).toBe(200);
    expect(mockRecordLeadVariation).toHaveBeenCalledWith('lead_1', 'january-rollback');
  });
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd ~/ai-lead-magnet-2/web && npx vitest run src/app/api/generate-report/route.test.ts`
Expected: the new test FAILS (`recordLeadVariation` not called - the route's guard only allows 'control' | 'video'). The four existing tests still pass.

- [ ] **Step 4: Widen the type and the route guard**

In `web/src/lib/ab-test/variation.ts`, change:

```typescript
export type Variation = 'control' | 'video';
```

to:

```typescript
export type Variation = 'control' | 'video' | 'january-rollback';
```

(Leave `isVariation`, `assignVariation`, and the cookie logic untouched - they are only used by the retired A/B path.)

In `web/src/app/api/generate-report/route.ts` line 60, change:

```typescript
  if (leadId && (variation === 'control' || variation === 'video')) {
```

to:

```typescript
  if (leadId && (variation === 'control' || variation === 'video' || variation === 'january-rollback')) {
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ~/ai-lead-magnet-2/web && npx vitest run src/app/api/generate-report/route.test.ts src/lib/ab-test/variation.test.ts src/lib/close/record-variation.test.ts`
Expected: ALL PASS.

- [ ] **Step 6: Commit**

```bash
cd ~/ai-lead-magnet-2 && git add web/src/lib/ab-test/variation.ts web/src/app/api/generate-report/route.ts web/src/app/api/generate-report/route.test.ts && git commit -m "feat: accept january-rollback as a recordable lead variation"
```

---

### Task 2: Form tags every lead `january-rollback` (retires the 50/50 roll)

**Files:**
- Modify: `web/src/components/form/multi-step-form.tsx`

**Interfaces:**
- Consumes: `Variation` type from Task 1; `/api/generate-report` accepting `variation: 'january-rollback'`.
- Produces: every submit POSTs `variation: 'january-rollback'` to `/api/generate-report`; the `/report` URL no longer carries a `v=` param (Task 4's restored page does not read one).

- [ ] **Step 1: Swap the variation assignment**

In `web/src/components/form/multi-step-form.tsx`:

Change the import (top of file):

```typescript
import { assignVariation } from '@/lib/ab-test/variation';
```

to:

```typescript
import type { Variation } from '@/lib/ab-test/variation';
```

Change (inside the final-step `onSubmit`):

```typescript
            // A/B test: assign this lead a /report variation (null when the
            // test is gated off - see lib/ab-test/variation.ts).
            const variation = assignVariation();
```

to:

```typescript
            // January-rollback cutover: tag every lead so the dashboard can
            // compare conversion against the pre-rollback variants.
            const variation: Variation = 'january-rollback';
```

Change (in the generate-report fetch body):

```typescript
                variation: variation ?? undefined,
```

to:

```typescript
                variation,
```

Change (the navigation block):

```typescript
              const variationParam = variation ? `&v=${variation}` : '';
              window.location.href = `/report?data=${encodeURIComponent(encodedData)}${variationParam}`;
```

to:

```typescript
              window.location.href = `/report?data=${encodeURIComponent(encodedData)}`;
```

And in the catch-fallback just below, delete this line:

```typescript
              if (variation) params.set('v', variation);
```

- [ ] **Step 2: Verify compile and existing form tests**

Run: `cd ~/ai-lead-magnet-2/web && npx tsc -b && npx vitest run src/__tests__/form-step1-integration.test.tsx`
Expected: tsc clean, form test PASSES (form UI is untouched).

- [ ] **Step 3: Commit**

```bash
cd ~/ai-lead-magnet-2 && git add web/src/components/form/multi-step-form.tsx && git commit -m "feat: tag all leads january-rollback, retire 50/50 variation roll"
```

---

### Task 3: Restore January's report-page components wholesale

**Files:**
- Restore from `de8189a`: 11 files listed in Step 1 (all under `web/src/components/thank-you/`)
- Delete: `web/src/components/thank-you/thank-you-content.test.tsx`, `web/src/components/thank-you/confirmation-banner.test.tsx`

**Interfaces:**
- Produces: the January versions of `ThankYouContent` (default report page orchestrator) and its child sections. `CTASection` at this point has January props `{firstName, lastName, email, phone, leadId, meta_fbc, meta_fbp}` - Task 5 adds `painPoints`. `ConfirmationBanner` takes `{email}` (not `firstName`).
- Note: after this task the page compiles but temporarily contains January's client-side generation chain (removed in Task 4). Do not deploy between Tasks 3 and 4.

- [ ] **Step 1: Restore the January files**

```bash
cd ~/ai-lead-magnet-2 && git checkout de8189a -- \
  web/src/components/thank-you/thank-you-content.tsx \
  web/src/components/thank-you/hero-pain.tsx \
  web/src/components/thank-you/cost-card.tsx \
  web/src/components/thank-you/cta-section.tsx \
  web/src/components/thank-you/overwhelm-section.tsx \
  web/src/components/thank-you/how-it-works-section.tsx \
  web/src/components/thank-you/social-proof-section.tsx \
  web/src/components/thank-you/faq-section.tsx \
  web/src/components/thank-you/final-cta-section.tsx \
  web/src/components/thank-you/analyzing-animation.tsx \
  web/src/components/thank-you/confirmation-banner.tsx
```

- [ ] **Step 2: Delete the tests that pin the retired redesign**

```bash
cd ~/ai-lead-magnet-2 && git rm web/src/components/thank-you/thank-you-content.test.tsx web/src/components/thank-you/confirmation-banner.test.tsx
```

(These test the Feb-May redesign props/markup - e.g. `ConfirmationBanner firstName` - which no longer exist. The restored page is covered by the build gate and the Task 9 end-to-end funnel check instead.)

- [ ] **Step 3: Verify it compiles**

Run: `cd ~/ai-lead-magnet-2/web && npx tsc -b`
Expected: clean. (January's components import only React, next/script, lucide-react, `@/components/layout/header`, and `@/lib/roi-calculator` - all verified still compatible: `calculateROI`, `getTaskHoursByRevenue`, `TaskHours` are exported with unchanged names.)

- [ ] **Step 4: Commit**

```bash
cd ~/ai-lead-magnet-2 && git add -A web/src/components/thank-you && git commit -m "revert: restore January (de8189a) report page components"
```

---

### Task 4: Strip the obsolete client-side pipeline from the restored report page

The January page generated the report in the browser (generate-tasks -> generate-pdf -> send-email -> CRM update). Today the form fires `/api/generate-report`, a server pipeline that does all of that with retries. Keeping both would DOUBLE-generate reports and DOUBLE-send emails. This task removes the client chain and ports the current Unicode-safe URL decoding.

**Files:**
- Modify: `web/src/components/thank-you/thank-you-content.tsx` (the January version restored in Task 3)

**Interfaces:**
- Consumes: nothing new. Produces: `ThankYouContent` renders January layout purely from URL data; makes zero API calls. Passes `painPoints` to `CTASection` (prop added in Task 5 - Tasks 4 and 5 must both land before the next `tsc -b` gate; do Task 5 immediately after).

- [ ] **Step 1: Trim the imports**

Change:

```typescript
import { calculateROI, getTaskHoursByRevenue, type TaskHours } from '@/lib/roi-calculator';
```

to:

```typescript
import { getTaskHoursByRevenue, type TaskHours } from '@/lib/roi-calculator';
```

- [ ] **Step 2: Remove pipeline state**

Change:

```typescript
  const [showAnalyzing, setShowAnalyzing] = React.useState(true);
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
```

to:

```typescript
  const [showAnalyzing, setShowAnalyzing] = React.useState(true);
```

- [ ] **Step 3: Port the current Unicode-safe decoder**

Replace the `try { ... } catch` at the end of the `formData` useMemo:

```typescript
    try {
      const decoded = atob(encodedData);
      return JSON.parse(decoded) as FormDataFromURL;
    } catch {
      console.error('Failed to decode form data from URL');
      return null;
    }
```

with (verbatim from the current production file - the form now encodes Unicode-safely, so plain `atob` alone breaks accented names):

```typescript
    try {
      // Unicode-safe base64 decoding (reverse of the encodeURIComponent + btoa pattern)
      const jsonString = decodeURIComponent(
        Array.from(atob(encodedData), (c) =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      return JSON.parse(jsonString) as FormDataFromURL;
    } catch {
      // Fallback: try plain atob for backward compatibility with old-format URLs
      try {
        const decoded = atob(encodedData);
        return JSON.parse(decoded) as FormDataFromURL;
      } catch {
        console.error('Failed to decode form data from URL');
        return null;
      }
    }
```

- [ ] **Step 4: Delete the ROI memo (only consumer was the deleted pipeline)**

Delete this block:

```typescript
  // Calculate ROI based on revenue
  const roi = React.useMemo(
    () => calculateROI(taskHours, revenueRange),
    [taskHours, revenueRange]
  );
```

- [ ] **Step 5: Delete the client generation chain**

Delete the entire `generateAndSendReport` callback - from the comment `// Generate PDF and send email when analysis completes` through its closing `}, [formData, taskHours, roi]);` (it contains the fetches to `/api/generate-tasks`, `/api/generate-pdf`, `/api/send-email`, and `/api/close/update-lead`).

- [ ] **Step 6: Simplify the animation-complete handler**

Change:

```typescript
  // Handle analysis complete
  const handleAnalysisComplete = React.useCallback(() => {
    setShowAnalyzing(false);
    generateAndSendReport();
  }, [generateAndSendReport]);
```

to:

```typescript
  // Animation done = page reveals (report generates server-side, fired at form submit)
  const handleAnalysisComplete = React.useCallback(() => {
    setShowAnalyzing(false);
  }, []);
```

- [ ] **Step 7: Pass painPoints to the booking section**

In the JSX, change the `<CTASection>` call:

```typescript
      <CTASection
        firstName={formData?.firstName || ''}
        lastName={formData?.lastName || ''}
        email={formData?.email || ''}
        phone={formData?.phone || ''}
        leadId={formData?.leadId || ''}
        meta_fbc={formData?.meta_fbc || ''}
        meta_fbp={formData?.meta_fbp || ''}
      />
```

to:

```typescript
      <CTASection
        firstName={formData?.firstName || ''}
        lastName={formData?.lastName || ''}
        email={formData?.email || ''}
        phone={formData?.phone || ''}
        painPoints={formData?.painPoints || ''}
        leadId={formData?.leadId || ''}
        meta_fbc={formData?.meta_fbc || ''}
        meta_fbp={formData?.meta_fbp || ''}
      />
```

- [ ] **Step 8: Commit (compile gate comes after Task 5, which adds the painPoints prop)**

```bash
cd ~/ai-lead-magnet-2 && git add web/src/components/thank-you/thank-you-content.tsx && git commit -m "fix: report page is display-only - server pipeline owns generation"
```

---

### Task 5: January booking section, current booking wiring

The restored January `cta-section.tsx` already uses the correct live calendar URL (`https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet` - verified identical to today's discovery URL) and already contains the localStorage handoff for post-booking tracking. This task re-applies four plumbing improvements made after January, without touching January's visible copy/layout: the `pain` prefill param, `%20` space encoding (iClosed rejects `+`), PII-free logging, and the robust scroll-hijack prevention.

**Files:**
- Modify: `web/src/components/thank-you/cta-section.tsx` (the January version restored in Task 3)

**Interfaces:**
- Consumes: `painPoints` prop passed by Task 4.
- Produces: `CTASection` props `{firstName?, lastName?, email?, phone?, painPoints?, leadId?, meta_fbc?, meta_fbp?}`. Embeds iClosed with params `iclosedName`, `iclosedEmail`, `iclosedPhone`, `timeFormat`, `pain`, `fbc`, `fbp`.

- [ ] **Step 1: Add the painPoints prop**

In the `CTASectionProps` interface, after `phone?: string;` add:

```typescript
  painPoints?: string;
```

In the destructured parameters, after `phone = '',` add:

```typescript
  painPoints = '',
```

- [ ] **Step 2: Replace January's scroll-lock with the current API-patch version**

Replace the first `React.useEffect` (starts after the comment `// Store scroll position to prevent iClosed widget from auto-scrolling`, uses `scrollPositionRef`/`scrollLockActiveRef`, ends `}, []);`) AND the two ref declarations above it, with (verbatim from current production):

```typescript
  // Prevent iClosed widget from auto-scrolling the page.
  // The widget can use scrollIntoView, window.scrollTo, window.scroll, or element.focus()
  // to hijack scroll position. We patch all of them during initialization.
  // User scrolling (wheel, touch, keyboard) is unaffected - those don't call these APIs.
  // The CTA "Book Your Time Audit" button uses scrollIntoView (not scrollTo), so we
  // allow scrollIntoView for elements OUTSIDE the widget container.
  React.useEffect(() => {
    const origScrollIntoView = Element.prototype.scrollIntoView;
    const origScrollTo = window.scrollTo;
    const origScroll = window.scroll;
    const origFocus = HTMLElement.prototype.focus;

    // Block scrollIntoView only for elements inside the widget
    Element.prototype.scrollIntoView = function (...args: Parameters<typeof origScrollIntoView>) {
      const widgetContainer = document.getElementById('calendar-section');
      if (widgetContainer && widgetContainer.contains(this)) {
        return; // Block widget auto-scroll
      }
      return origScrollIntoView.apply(this, args);
    };

    // Block all programmatic window.scrollTo / window.scroll during init
    window.scrollTo = function () { /* blocked during widget init */ } as typeof window.scrollTo;
    window.scroll = function () { /* blocked during widget init */ } as typeof window.scroll;

    // Force preventScroll on focus() for elements inside the widget
    HTMLElement.prototype.focus = function (options?: FocusOptions) {
      const widgetContainer = document.getElementById('calendar-section');
      if (widgetContainer && widgetContainer.contains(this)) {
        return origFocus.call(this, { ...options, preventScroll: true });
      }
      return origFocus.call(this, options);
    };

    const timeoutId = setTimeout(() => {
      Element.prototype.scrollIntoView = origScrollIntoView;
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
      HTMLElement.prototype.focus = origFocus;
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      Element.prototype.scrollIntoView = origScrollIntoView;
      window.scrollTo = origScrollTo;
      window.scroll = origScroll;
      HTMLElement.prototype.focus = origFocus;
    };
  }, []);
```

- [ ] **Step 3: Replace the scroll-restoring script-load handler with the no-op**

Replace the entire `handleScriptLoad` callback (the version using `scrollLockActiveRef`/`setInterval`) with:

```typescript
  // No-op callback - scroll prevention is handled by the useEffect above
  const handleScriptLoad = React.useCallback(() => {
    console.log('[iClosed] Widget script loaded');
  }, []);
```

- [ ] **Step 4: Add the pain param and %20 encoding to the URL build**

After the line `params.set('timeFormat', '12h');` add:

```typescript
  // Pass pain points (challenges) to iClosed custom field
  if (painPoints) params.set('pain', painPoints);
```

Replace:

```typescript
  const iClosedUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

  // Debug logging
  console.log('[iClosed] Prefill data:', { firstName, lastName, email, phone, meta_fbc, meta_fbp, iClosedUrl });
```

with:

```typescript
  // Build URL and replace + with %20 for spaces (iClosed expects %20, not +)
  const queryString = params.toString().replace(/\+/g, '%20');
  const iClosedUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  // Debug logging (sanitized - no PII)
  console.log('[iClosed] Widget configured:', { hasName: !!fullName, hasEmail: !!email, hasPhone: !!phone });
```

Do NOT change `baseUrl` - January's single URL is the correct live discovery calendar. Do NOT change any JSX below the URL build (that is the January look).

- [ ] **Step 5: Compile gate for Tasks 4+5**

Run: `cd ~/ai-lead-magnet-2/web && npx tsc -b`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
cd ~/ai-lead-magnet-2 && git add web/src/components/thank-you/cta-section.tsx && git commit -m "feat: January booking visuals with current iClosed wiring (pain param, %20, scroll patch)"
```

---

### Task 6: Full local verification

**Files:** none created; fixes only if gates fail.

- [ ] **Step 1: Type-check, unit tests, lint, build**

```bash
cd ~/ai-lead-magnet-2/web && npx tsc -b && npm run test:run && npm run lint && npm run build
```

Expected: all clean. If a stray test references restored components' old props, fix the test to match the January component (never the component to match the test). Known safe: `form-step1-integration.test.tsx`, `variation.test.ts`, `record-variation.test.ts`, `ab-stats.test.ts`, `generate-report/route.test.ts`.

- [ ] **Step 2: Review the e2e spec for stale assumptions**

Read `web/tests/e2e/roi-test.spec.ts`. If it asserts Feb-May-redesign-only markup, mark those assertions `test.skip` with comment `// skipped: january-rollback cutover (see docs/superpowers/specs/2026-07-06-january-rollback-design.md)`. Do not rewrite it.

- [ ] **Step 3: Commit any fixes**

```bash
cd ~/ai-lead-magnet-2 && git add -A && git commit -m "test: align suites with january-rollback cutover" || echo "nothing to fix"
```

---

### Task 7: Visual fidelity check against the real January build

**Files:** screenshots into `/private/tmp` scratch; nothing committed.

- [ ] **Step 1: Run the rollback branch locally**

```bash
cd ~/ai-lead-magnet-2/web && npm run dev -- --port 3000 &
```

- [ ] **Step 2: Run the true January snapshot side-by-side in a worktree**

```bash
cd ~/ai-lead-magnet-2 && git worktree add /tmp/jan-snapshot de8189a && cd /tmp/jan-snapshot/web && npm install && cp ~/ai-lead-magnet-2/web/.env.local .env.local && npm run dev -- --port 3001 &
```

- [ ] **Step 3: Screenshot both with agent-browser and compare**

Sample report URL data (base64 of a test payload) - generate it once:

```bash
node -e "const d={firstName:'Test',lastName:'Founder',email:'test@example.com',phone:'+16154381988',revenue:'\$1M-\$3M',painPoints:'Email and calendar overload',leadId:''};console.log(encodeURIComponent(Buffer.from(unescape(encodeURIComponent(JSON.stringify(d)))).toString('base64')))"
```

Then with `agent-browser` (see `agent-browser skills get core --full`): screenshot `http://localhost:3000/` vs `http://localhost:3001/`, and `http://localhost:3000/report?data=<ENCODED>` vs `http://localhost:3001/report?data=<ENCODED>` (full-page screenshots). Wait ~5s after load on /report for the analyzing animation to finish.

Expected: report pages visually identical section-for-section (banner, hero pain, cost card, overwhelm, how-it-works, CTA+calendar, social proof, FAQ, final CTA). Form pages identical. The ONLY acceptable difference: none visible (all kept changes are non-visual).

- [ ] **Step 4: Clean up the worktree**

```bash
git worktree remove /tmp/jan-snapshot --force
```

---

### Task 8: Close CRM pre-flight for the new variation value

**Files:** none (external system check).

- [ ] **Step 1: Find the field ID**

Read the `leadMagnetVariation` entry in `CLOSE_FIELDS` in `web/src/lib/close/client.ts`.

- [ ] **Step 2: Check the field type in Close**

```bash
cd ~/ai-lead-magnet-2/web && source .env.local 2>/dev/null; curl -s -u "$CLOSE_API_KEY:" "https://api.close.com/api/v1/custom_field/lead/<FIELD_ID_FROM_STEP_1>/" | head -c 2000
```

(If the env var has a different name, check `.env.local` for the Close key used by `lib/close/client.ts`.)

- [ ] **Step 3: Add the choice if needed**

If the response shows `"type": "choices"` and `january-rollback` is not in `choices`, add it via API:

```bash
curl -s -u "$CLOSE_API_KEY:" -X PUT "https://api.close.com/api/v1/custom_field/lead/<FIELD_ID>/" -H "Content-Type: application/json" -d '{"choices": [<EXISTING_CHOICES_PLUS>"january-rollback"]}'
```

If `"type": "text"`, nothing to do. Record the outcome in the task notes.

---

### Task 9: Preview deploy and end-to-end funnel verification

**Files:** none; verification on the Vercel preview URL.

- [ ] **Step 1: Push the branch and get the preview URL**

```bash
cd ~/ai-lead-magnet-2 && git push -u origin rollback/january-visitor-experience
```

Get the preview URL from the Vercel MCP tools (`list_deployments` for the "timefreedom" project, newest deployment for this branch) or `npx vercel ls` from `web/`. Wait for the build to be READY; if it fails, read build logs, fix, push again.

- [ ] **Step 2: Submit a test lead through the preview form (agent-browser)**

On `<PREVIEW_URL>/`: complete the 4-step form with firstName `Rollback`, lastName `Test`, email `ryan+jan-rollback-test@assistantlaunch.com`, phone `6154381988`, any revenue option, pain points `testing january rollback`. Verify each step advances and the final submit navigates to `/report?data=...`.

- [ ] **Step 3: Verify the January report page renders with live data**

On the resulting /report page (after the ~3.5s analyzing animation): confirm the January section order (confirmation banner with the email address, "Hi Rollback" hero pain, cost card, overwhelm, how-it-works, CTA with embedded calendar, social proof, FAQ, final CTA). Confirm via browser console/network: ZERO client calls to `/api/generate-tasks`, `/api/generate-pdf`, `/api/send-email`.

- [ ] **Step 4: Verify the booking embed wiring**

Inspect the calendar iframe's `src`: must start `https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet?` and contain `iclosedName=Rollback%20Test`, `iclosedEmail=`, `iclosedPhone=`, `pain=`, no `+` characters in values. Confirm the widget renders time slots. Click a hero CTA button and confirm smooth-scroll to the calendar. Do NOT complete a real booking unless Ryan asks - a booking creates a real calendar event for the sales team.

- [ ] **Step 5: Verify the plumbing fired**

- Close CRM: the test lead exists and its "Lead Magnet Variation" field = `january-rollback` (Close MCP `lead_search` for `ryan+jan-rollback-test@assistantlaunch.com`, then `fetch_lead`).
- Email: the report email arrived at the + address inbox (ask Ryan to confirm, or check the Resend dashboard / `resend-report` logs via Vercel runtime logs).
- No duplicate email (exactly one report email - proves the double-generation removal worked).

- [ ] **Step 6: Clean up the test lead**

Note the test lead's Close ID for Ryan; do not delete without asking (deletion is destructive).

---

### Task 10: Ryan review gate, production cutover, post-deploy check

**Files:** none.

- [ ] **Step 1: HARD GATE - Ryan reviews the preview**

Send Ryan the preview URL plus the Task 7 side-by-side screenshots. Do not proceed until he explicitly approves.

- [ ] **Step 2: Merge to main (production auto-deploys)**

```bash
cd ~/ai-lead-magnet-2 && git checkout main && git pull && git merge --no-ff rollback/january-visitor-experience -m "feat: cut over to January visitor experience (rollback)" && git push origin main
```

- [ ] **Step 3: Production smoke check**

Wait for the production deployment to be READY. With agent-browser on `https://report.assistantlaunch.com/`: form renders, submit one `ryan+prod-rollback-check@assistantlaunch.com` test lead end-to-end, January report page renders, calendar loads with prefill, Close lead tagged `january-rollback`, one report email arrives.

- [ ] **Step 4: Hand off monitoring**

Tell Ryan: the dashboard's variation stats now accumulate `january-rollback` rows; compare booking rate against `control`/`video` after 2-4 weeks of traffic.

---

## Self-Review Notes

- Spec coverage: Bucket 1 -> Tasks 3-5; Bucket 2 -> Global Constraints do-not-touch list; Bucket 3 merges -> Tasks 2, 4, 5; lead tagging -> Tasks 1, 2, 8; booking decisions -> Task 5 (verified: January URL == current discovery URL); test updates -> Tasks 3, 6; visual fidelity + funnel verification + preview-first -> Tasks 7, 9, 10.
- Deliberate deviations from the spec, justified: `page.tsx`, `report/page.tsx`, `phone-screen.tsx`, and `multi-step-form.tsx` are NOT restored because their diffs are 100% tracking/plumbing (verified line-by-line) - restoring them would delete tracking we're keeping while changing nothing visible. `calendar-section.tsx` is not restored because it is byte-identical to January already.
- Type consistency: `Variation` union (Task 1) matches the literal in Task 2 and the route guard; `painPoints` prop name matches between Task 4 (caller) and Task 5 (interface).
