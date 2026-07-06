# January Rollback - Design Spec

**Date:** 2026-07-06
**Repo:** ryanbrazzell/ai-lead-magnet-2 (Vercel project "timefreedom", report.assistantlaunch.com)
**Decision maker:** Ryan
**Status:** Approved direction, pending spec review

## Goal

Restore the entire pre-booking visitor experience (opt-in form page + report/results page) to how it looked at the end of January 2026, because it converted better then. Keep all current backend functionality: report generation, email delivery and retries, PDF, Close CRM lead creation, Meta/UTM tracking, error monitoring, and the internal dashboard.

**Target snapshot:** commit `de8189a` (2026-01-30, "fix: ensure revenue update completes before navigation") - the last January commit on main.

**Rollout:** full cutover. Everyone sees the January version. No A/B split.

## What changes and what doesn't

### Bucket 1 - Restore to the January version (visitor-visible)

All presentation and copy for the pre-booking journey:

- Landing page: `web/src/app/page.tsx` plus its layout/hero/form-layout/social-proof/bonus-stack components (minimal drift since January, restore anyway for fidelity)
- Form UI: `web/src/components/form/multi-step-form.tsx`, `form/screens/phone-screen.tsx` (visuals and copy only - see Bucket 3 for the wiring inside these files)
- Report page sections: `thank-you/` components - hero-pain, overwhelm-section, how-it-works-section, cost-card, cta-section, faq-section, final-cta-section, social-proof-section, report-section, video-section, analyzing-animation, confirmation-banner, thank-you-content (layout/order/copy)
- Report page route: `web/src/app/report/page.tsx`

January and today use the same component file set, so this is restoring file contents, not rebuilding.

### Bucket 2 - Keep exactly as today (untouched)

- All API routes: generate-report, generate-tasks, generate-pdf, send-email, send-report-email, resend-report, Resend webhooks, Close create-lead, retry-queue cron
- All of `lib/`: report-pipeline, retry-queue, AI pipeline (claude-client, research, sanity-check, validators, prompts), PDF generator v2, email template, Close client, alerts, tracking/utm-params
- Hooks: use-meta-tracking, use-utm-tracking
- Middleware, Sentry instrumentation, vercel.json cron
- Post-booking page: booking-confirmed (what people land on after booking)
- Internal dashboard (login, conversion chart)
- The report email itself and the PDF - these are "plumbing output," not the January page look

### Bucket 3 - Careful merge (January look, current wiring)

Four touchpoints where presentation and plumbing live in the same files:

1. **multi-step-form.tsx** - January UI/copy/step flow. Keep current submission plumbing: UTM capture, Meta tracking fields, and variation recording (see Lead tagging below).
2. **thank-you-content.tsx** - January layout and section order. Keep current data fetching (calls to today's generate-report/generate-tasks APIs). Remove the video-variant branching and the revenue-based calendar routing.
3. **calendar-section.tsx / cta-section.tsx** - January single-calendar look and placement. Point the embed at the **current** iClosed booking link (the one used today for discovery calls) and keep the current prefill params (name, email, phone, pain points) and the current localStorage handoff used for post-booking tracking.
4. **Data-shape adapters** - some libs the January components consume changed shape since January (roi-calculator, types/task.ts task categories). Where the restored components no longer compile against current libs, adapt the data at the component boundary. Never change the visuals to fit the data; adapt the data to fit the visuals.

### Booking flow (explicit decisions)

- **One calendar for everyone.** The triage-vs-discovery revenue split (added Feb 2026) is removed from the visitor flow.
- The calendar uses the current live iClosed URL with the same variables passed today (name, email, phone, pain, tracking).
- Booking confirmation continues to land on the current booking-confirmed page.
- **Orphaned but kept in the codebase:** the intro-call confirmation page (`booking-confirmed/intro-call-content.tsx`), the standalone book-call page (`app/book-call/`), and the triage routing logic they served. Nothing will link to them. They are not deleted, so they can be revived later.
- The live video-variant A/B test on /report ends with this cutover (acknowledged by Ryan).

### Lead tagging (so the dashboard can measure the rollback)

- Every lead created after cutover gets `january-rollback` written to the existing "Lead Magnet Variation" custom field in Close (same first-write-wins path used by the A/B test today, via `lib/close/record-variation.ts`).
- The `Variation` type gains a `january-rollback` value; `assignVariation()` 50/50 logic is bypassed - the form always records `january-rollback`.
- **Setup step:** if the Close field is a dropdown, add the `january-rollback` option in Close before cutover.
- The existing conversion dashboard can then compare booking rates for control / video / january-rollback.

## Testing and verification

- Tests added since January that assert the redesigned UI (thank-you-content.test.tsx, confirmation-banner.test.tsx, form-step1-integration.test.tsx) will be updated to match the restored January components, or removed if they only exist to pin the redesign. Plumbing tests stay green untouched.
- Build must pass `tsc -b` strictness (CI catches unused imports/vars that local `tsc --noEmit` misses).
- **Visual fidelity check:** run the `de8189a` snapshot locally, screenshot the form page and report page, and compare side by side against the rebuilt version.
- **Funnel verification on a Vercel preview deploy (never straight to production):**
  1. Submit a test lead through the form
  2. Lead appears in Close with variation `january-rollback`
  3. Report generates and the email arrives
  4. Report page renders the January layout with live data
  5. Calendar embeds the current iClosed link with name/email/phone prefilled
  6. A test booking completes and lands on the booking-confirmed page
- Browser verification uses agent-browser (per standing rule). No real messages or emails to actual prospects during testing.
- Production cutover only after Ryan eyeballs the preview.

## Risks and mitigations

- **January components vs current APIs:** the report/task data shape drifted since January. Mitigation: boundary adapters (Bucket 3.4) plus the full-funnel preview test.
- **January calendar assumptions:** January code pre-dated some iClosed param fixes made in late January (already inside the snapshot) but not the Feb+ changes. Mitigation: booking wiring is explicitly rebuilt against the current URL and params, and tested with a real preview booking.
- **Stale copy/claims:** January copy may reference offers or numbers that changed. Ryan reviews the preview before cutover; copy edits are out of scope for this rollback.

## Out of scope

- Deleting the orphaned triage/book-call/intro-call code
- Any changes to the report email, PDF, or AI generation quality
- Copy improvements beyond what January already said
- A/B testing the rollback (explicitly declined; full cutover chosen)
