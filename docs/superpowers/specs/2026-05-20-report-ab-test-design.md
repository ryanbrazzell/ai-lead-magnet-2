# /report A/B Test + Conversion Dashboard - Design Spec

**Date:** 2026-05-20
**Status:** Approved (design), revised after Codex review, pending final spec review
**Repo:** ai-lead-magnet-2 (Next.js app in `web/`), deployed as Vercel project `timefreedom` -> report.assistantlaunch.com
**Branch:** report-ab-test

## 1. Background

The lead magnet funnel (Meta ads -> `/` quiz form -> `/report`) produces leads cheaply (~$7.60 per lead) but converts them to booked calls at only ~2% (sometimes 0.5%). Target is 5%+. The agreed bottleneck is the `/report` page (the post-quiz "thank you" page): the booking calendar renders below four other sections, well past the top of a long sales page.

Media buyer David Mata's recommended fix: A/B test a variation of `/report` that leads with a short founder video and the calendar, instead of leading with the long sales page. This spec covers that test, the infrastructure to run it, and a dashboard to read the results.

Source context: Fireflies call "A/B Testing for Lead Magnet Pages" (2026-05-18) and the follow-up Slack thread with David. This spec was revised after a Codex design review (2026-05-20) that hardened the measurement design.

## 2. Goal & Success Criteria

- Run a clean, single-variable A/B test on `/report`: current page (control) vs a video-led variation.
- Measure lead-to-booked-call conversion rate per variation, with numbers reliable enough to make a real decision on.
- Give Ryan, David, and Robin a dashboard showing visits, booked calls, and conversion rate per variation.
- The variation must not serve live traffic until Ryan's 60-second video exists.
- Success = the test runs, results are trustworthy and visible, and zero disruption to the existing email/PDF workflow.

## 3. Scope

**In scope (this spec):**
- A video-led variation of `/report`.
- A 50/50 traffic split between control and variation, with reliable per-lead assignment.
- Gating so the variation is dark until a video URL is configured.
- Recording the assigned variation onto each lead in Close CRM.
- A password-protected dashboard reading from Close CRM.

**Out of scope / parked (see Section 12 - Phase 2):**
- Funnel #2: the AI-trained EA direct-to-video page. Documented in full below; built in its own cycle after this ships.

**Explicitly untouched:**
- The multi-step quiz form, except (a) the variation roll added at the final redirect and (b) the variation passed into the existing final-submit server call.
- Report generation, the emailed report, the PDF.
- The `/book-call` page.
- The booking-detection chain (iClosed -> `/thank-you` -> `mark-call-booked`). The test does not change it but depends on it (see Section 9).

## 4. Current State (implementer context)

- `/report` renders `<ThankYouContent>` (`web/src/components/thank-you/thank-you-content.tsx`). After an 8-second analyzing animation, it shows a navy nav bar followed by 8 content sections in this order: `HeroPain`, `CostCard`, `OverwhelmSection`, `HowItWorksSection`, `CTASection` (the iClosed booking calendar), `SocialProofSection`, `FAQSection`, `FinalCTASection`. The calendar is content section 5 of 8 - it renders below four other sections.
- `ThankYouContent` uses `useSearchParams` today only to parse the encoded `data` payload (and legacy fallback fields). It does NOT currently read a `v` param. This spec adds that.
- The funnel: ad -> `/` -> `<MultiStepForm>`. At Screen 2 the form calls `/api/close/create-lead`, which creates a Close CRM lead and returns a `leadId`. Close dedupes by email: a repeat submission with the same email returns the existing `leadId`. At final submit the form fires server-side report generation and then runs `window.location.href = '/report?data=...'` (`web/src/components/form/multi-step-form.tsx`, ~line 283/296). The `leadId` is inside the encoded `data` payload.
- Booking: the `/report` calendar is an iClosed inline widget. After someone books, iClosed redirects them to `/thank-you` (or `/intro-call`), whose content component calls `/api/close/mark-call-booked` using the `leadId` from localStorage, flipping the Close lead status to "Strategy Call Booked" (`stat_DQePUkSNuYYtuwVyfqJ40fOf1KrgwKUqOiUJvTfZ2nP`) or "Triage Call Booked" (`stat_UEiczhS2rm7a0rcaick2wizlAlL18KRabpGPA9vc7E9`).
- There is no application database. Close CRM is the system of record for leads and bookings. Shared Close field IDs live in `web/src/lib/close/client.ts` (`CLOSE_FIELDS`). Meta Pixel and Microsoft Clarity (project `wsluerbp84`) are live site-wide.
- Already-built but currently unused components available for the variation: `VideoSection`, `ConfirmationBanner` (props `{ email }` today), `TimerCTA`, `CalendarSection` (all in `web/src/components/thank-you/`).

## 5. Design - Part 1: The /report variation

**Control:** `/report` exactly as it is today. No change.

**Variation (codename "video"):** the same page, re-ordered to lead with the video and calendar.

Variation section order:
1. Navy header (unchanged)
2. `ConfirmationBanner` - reworded to a "congrats, one step left" message
3. `VideoSection` - Ryan's 60-second video
4. `CTASection` - the existing iClosed calendar section, moved up to here
5. `HeroPain`
6. `CostCard`
7. `OverwhelmSection`
8. `HowItWorksSection`
9. `SocialProofSection`
10. `FAQSection`
11. `FinalCTASection`

This is the current page with `CTASection` moved up to position 4, and `ConfirmationBanner` + `VideoSection` added above it. No section is dropped and no component is duplicated - the variation has exactly one calendar. The full sales page still sits below the calendar for anyone who scrolls. This is a single conceptual change ("lead with the video and calendar"), satisfying David's one-variable-at-a-time rule.

The 8-second analyzing animation runs for both control and variation (not part of the test).

**Implementation:** `ThankYouContent` reads the assigned variation from the `v` URL param (Section 6) and conditionally renders either the current order or the variation order. Both orders use the same components; only sequence and the two added components differ.

**Component changes:**
- `VideoSection`: replace the placeholder YouTube URL with Ryan's real video, sourced from `NEXT_PUBLIC_REPORT_VIDEO_URL` (Section 7). Header/subhead copy updated to match the "one step left" framing. The component currently assumes an embeddable iframe URL with YouTube-style params; implementation must accept and correctly embed whatever host Ryan uses (YouTube / Loom / Vimeo) - acceptance criteria: the configured video plays inline on desktop and mobile.
- `ConfirmationBanner`: today it takes only `{ email }`. Add a `firstName` prop and reword to David's framing. Draft copy - headline "Congrats {firstName}, you're one step away." / subline "Watch this 60-second video, then book your call right below." Final wording confirmed against David's script points during implementation.
- `CTASection`: no change to the component itself; only its position changes in the variation.

## 6. Design - Part 2: The 50/50 split and per-lead assignment

The unit of the experiment is the **lead** (one person / one Close record). Assignment must be decided once per lead and never change for the life of the test.

- **Split point:** `web/src/components/form/multi-step-form.tsx`, at the final submit / redirect to `/report`.
- **Assignment:** at final submit, if the test is live (Section 7): reuse the variation from the `al_report_variation` cookie if present; otherwise roll `control` or `video` 50/50 and write the cookie. If the test is not live, always `control` and do not record anything (Section 8).
- **Source of truth:** the variation recorded on the Close lead (Section 8) is the source of truth for the dashboard. The cookie is only a same-browser convenience so a returning visitor on the same device sees the same page. First-write-wins on the lead (Section 8) protects against re-submissions changing a lead's assignment.
- **Hand-off to the page:** the variation is appended to the existing redirect URL as `&v=control` or `&v=video` (the URL already carries `?data=...`). `ThankYouContent` is extended to read `v` and choose the layout.
- **Safety fallback:** if `ThankYouContent` receives `v=video` but no valid video URL is configured, it renders control. The variation can never render without a video.

## 7. Design - Part 3: Video gating

The variation must not serve live traffic until Ryan has filmed and hosted the 60-second video.

- **Mechanism:** a single env var, `NEXT_PUBLIC_REPORT_VIDEO_URL`.
  - Empty / unset / not a valid video URL -> the test is OFF. The form always assigns `control`, records nothing, and 100% of traffic sees the current page.
  - Set to a valid, embeddable video URL -> the test is ON. The form begins the 50/50 split and recording.
- **Validation:** the URL is validated and normalized to an embeddable form at build/use time. A malformed value is treated as gate-OFF (test stays dark) rather than enabling a broken variation.
- **Go-live:** Ryan sets `NEXT_PUBLIC_REPORT_VIDEO_URL` in the Vercel project env vars and redeploys. No code change required to launch. The test cannot go live without a video.

## 8. Design - Part 4: Recording the variation on the lead

Goal: each Close lead reliably carries which variation it was assigned, set once, so the dashboard can compute conversion per variation.

- **New Close custom field:** a lead custom field "Lead Magnet Variation" (values `control` / `video`). Created once via the Close API (Claude runs a one-time script using `CLOSE_API_KEY` - approved by Ryan). The resulting field ID is added to the shared `CLOSE_FIELDS` map in `web/src/lib/close/client.ts` (not duplicated inline).
- **Where it is recorded:** server-side, as part of the form's existing final-submit server flow (the same trusted, authenticated path that already triggers report generation) - NOT from a public browser endpoint, and NOT from the `/report` page. The rolled variation is passed from the form into that server call along with the `leadId`.
- **First-write-wins:** the server reads the lead first; it writes the variation only if the field is currently empty. A re-submission (same email -> same `leadId`) never overwrites an existing assignment. Recording only happens while the test is live; gated-off and pre-test leads get no variation field, so the dashboard only ever sees live-test leads.
- **No browser-callable mutation endpoint.** There is no "set variation by email" endpoint. The variation is written only through the trusted server flow keyed by the server-issued `leadId`. This avoids exposing arbitrary Close lead mutation to the public.
- **Definition of a "visit":** a lead whose "Lead Magnet Variation" field is set. Because the field is written server-side during form completion - which is also what redirects the user to `/report` - "leads with a variation" reliably equals "people who completed the funnel and were sent to `/report`." This is the denominator for the conversion rate.
- **Booking (unchanged):** the existing `mark-call-booked` flow flips the lead status to a "Call Booked" status when someone books through iClosed. That status is the dashboard's "booked" signal.

Result: each in-test lead carries its variation (set once) and its booked / not-booked status.

## 9. Design - Part 5: The dashboard

- **Route:** a new page, `/dashboard`, in the same app.
- **Auth:**
  - The password is checked **server-side** against the `DASHBOARD_PASSWORD` env var (value set in Vercel, never committed). The password is never sent to or evaluated in the client.
  - On success the server sets a signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookie with a fixed expiry (e.g. 7 days); later requests are validated server-side against that cookie.
  - Protected dashboard responses are served `no-store` (never cached). A basic per-IP attempt limit on the password check is a nice-to-have.
  - Shared with Ryan, David, and Robin.
- **Data source:** the Close CRM API (`CLOSE_API_KEY`), queried server-side from the route.
- **Metrics, per variation (control vs video):**
  - Visits = count of leads whose "Lead Magnet Variation" field equals that variation.
  - Booked calls = count of those leads whose status is "Strategy Call Booked" or "Triage Call Booked".
  - Conversion rate = booked / visits.
- **Querying:** uses Close's lead search with an explicit query for the custom field value and status; handles pagination (fetches all pages for an accurate count); filters by lead-created date so the view can be scoped to the test window (default: test start date onward). Exact Close query syntax is finalized during implementation.
- **Caching:** dashboard data is cached server-side briefly (e.g. 60 seconds), keyed by date range, to stay within Close API rate limits.
- **Display:** side-by-side comparison (control vs video) of the three numbers, plus a simple bar chart (recharts, already a dependency), and a date range control.
- **Data-quality note:** booking detection (`mark-call-booked`) is non-blocking and can silently fail (missing key, Close error). The dashboard should surface a count of bookings it could not attribute to a variation, and `mark-call-booked` failures should be logged, so a low conversion number is not mistaken for a real result when it is actually a tracking gap.

## 10. Setup & inputs

- **Video URL (Ryan):** the 60-second video, hosted (YouTube/Loom/etc.). Set as `NEXT_PUBLIC_REPORT_VIDEO_URL` in Vercel. This is what turns the test on.
- **Close custom field (Claude):** Claude creates the "Lead Magnet Variation" field via the Close API.
- **Dashboard password (Ryan):** set as `DASHBOARD_PASSWORD` in Vercel env vars. Value provided by Ryan, held outside the repo. Should be reasonably strong since the dashboard exposes CRM-derived numbers; rotatable anytime via the env var.
- **Build approach:** everything in Sections 5-9 is built now, on the `report-ab-test` branch, behind the video gate, so the test is paste-and-go the moment the video exists.

## 11. Risks & open points

- **Timeline depends on the video.** The build can complete fully, but the test produces zero data until Ryan films and configures the video. This is the critical-path item.
- **Booking-detection accuracy.** The "booked" signal depends on the iClosed -> `/thank-you` -> `mark-call-booked` chain, which is non-blocking and silent on failure. Mitigation: log failures and surface unattributed bookings on the dashboard (Section 9).
- **Close API rate limits.** The dashboard makes several paginated Close API calls per load; server-side caching mitigates this.
- **Video host format.** Embed handling must be confirmed against the actual host Ryan uses; acceptance is defined in Section 5.
- **Cross-browser re-submissions.** A person who completes the funnel twice from two different browsers/devices could be rolled twice; first-write-wins on the lead (Section 8) keeps their assignment fixed to the first one. Residual contamination is negligible for a directional test.

## 12. Phase 2 (parked): Funnel #2 - AI-trained EA direct-to-video page

Not built in this spec. Documented here so the requirements are not lost. This gets its own design -> plan -> build cycle after Test #1 ships.

David's funnel #2 concept (from the Fireflies call and Slack):
- A separate new landing page, run as its own ad campaign.
- The ad goes straight to the video page. No opt-in, no PDF, no email capture.
- The page hosts a 10-15 minute video on the AI-trained Executive Assistant: what it is, how it works, value, use cases, testimonials.
- A timer forces the viewer to consume part of the video before the booking option unlocks. (The existing `TimerCTA` component was built for exactly this.)
- A pre-call survey segments leads: those who want an AI-trained EA vs those who want to train their existing assistant. The survey routes them to one of two calendars. Only the "good fit" calendar fires the booked-call event back to Facebook, so Meta optimizes toward the right audience.
- Purpose: split-test the current "PDF lead magnet" funnel against this "direct-to-video, book a call, no opt-in" funnel.
- Sequencing: comes after Test #1.
