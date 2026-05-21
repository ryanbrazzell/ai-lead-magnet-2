# /report A/B Test + Conversion Dashboard - Design Spec

**Date:** 2026-05-20
**Status:** Approved (design), pending spec review
**Repo:** ai-lead-magnet-2 (Next.js app in `web/`), deployed as Vercel project `timefreedom` -> report.assistantlaunch.com
**Branch:** report-ab-test

## 1. Background

The lead magnet funnel (Meta ads -> `/` quiz form -> `/report`) produces leads cheaply (~$7.60 per lead) but converts them to booked calls at only ~2% (sometimes 0.5%). Target is 5%+. The agreed bottleneck is the `/report` page (the post-quiz "thank you" page): the booking calendar is buried about two-thirds down a 10-section sales page.

Media buyer David Mata's recommended fix: A/B test a variation of `/report` that leads with a short founder video and the calendar, instead of leading with the long sales page. This spec covers that test, the infrastructure to run it, and a dashboard to read the results.

Source context: Fireflies call "A/B Testing for Lead Magnet Pages" (2026-05-18) and the follow-up Slack thread with David.

## 2. Goal & Success Criteria

- Run a clean, single-variable A/B test on `/report`: current page (control) vs a video-led variation.
- Measure lead-to-booked-call conversion rate per variation.
- Give Ryan, David, and Robin a dashboard showing visits, booked calls, and conversion rate per variation.
- The variation must not serve live traffic until Ryan's 60-second video exists.
- Success = the test can run, results are trustworthy and visible, and zero disruption to the existing email/PDF workflow.

## 3. Scope

**In scope (this spec):**
- A video-led variation of `/report`.
- A 50/50 traffic split between control and variation.
- Gating so the variation is dark until a video URL is configured.
- Recording the assigned variation onto each lead in Close CRM.
- A password-protected dashboard reading from Close CRM.

**Out of scope / parked (see Section 12 - Phase 2):**
- Funnel #2: the AI-trained EA direct-to-video page. Documented in full below; built in its own cycle after this ships.

**Explicitly untouched:**
- The multi-step quiz form (except the one redirect line where the split is injected).
- Report generation, the emailed report, the PDF.
- The `/book-call` page (the booking page linked from the emailed PDF).

## 4. Current State (implementer context)

- `/report` renders `<ThankYouContent>` (`web/src/components/thank-you/thank-you-content.tsx`). After an 8-second analyzing animation, it shows a 10-section page. The booking calendar (`CTASection`) is section ~7 of 10.
- The funnel: ad -> `/` -> `<MultiStepForm>`. At Screen 2 the form calls `/api/close/create-lead`, which creates a Close CRM lead and returns a `leadId`. At the final screen the form runs `window.location.href = '/report?data=...'` (`web/src/components/form/multi-step-form.tsx`, ~line 283/296). The `leadId` is inside that encoded `data` payload.
- Booking: the `/report` calendar is an iClosed widget. After someone books, iClosed redirects them to `/thank-you`, whose `BookingConfirmedContent` calls `/api/close/mark-call-booked`, flipping the Close lead status to "Strategy Call Booked" (`stat_DQePUkSNuYYtuwVyfqJ40fOf1KrgwKUqOiUJvTfZ2nP`) or "Triage Call Booked" (`stat_UEiczhS2rm7a0rcaick2wizlAlL18KRabpGPA9vc7E9`).
- There is no application database. Close CRM is the system of record for leads and bookings. Meta Pixel and Microsoft Clarity (project `wsluerbp84`) are live site-wide.
- Already-built but currently unused components available for the variation: `VideoSection`, `ConfirmationBanner`, `TimerCTA`, `CalendarSection` (all in `web/src/components/thank-you/`).

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

This is the current page with `CTASection` moved from position ~7 to position 4, and `ConfirmationBanner` + `VideoSection` added above it. No component is duplicated - the variation has exactly one calendar. The full sales page still sits below the calendar for anyone who scrolls. This is a single conceptual change ("lead with the video and calendar"), satisfying David's one-variable-at-a-time rule.

The 8-second analyzing animation runs for both control and variation (not part of the test).

**Implementation:** `ThankYouContent` reads the assigned variation (Section 6) and conditionally renders either the current order or the variation order. Both orders use the same components; only sequence and the two added components differ.

**Component changes:**
- `VideoSection`: replace the placeholder YouTube URL with Ryan's real video, sourced from the env var `NEXT_PUBLIC_REPORT_VIDEO_URL` (Section 7). Header/subhead copy updated to match the "one step left" framing.
- `ConfirmationBanner`: reword to David's framing. Draft copy - headline "Congrats {firstName}, you're one step away." / subline "Watch this 60-second video, then book your call right below." Final wording to be confirmed against David's script points during implementation.
- `CTASection`: no change to the component itself; only its position changes in the variation.

## 6. Design - Part 2: The 50/50 split

- **Split point:** `web/src/components/form/multi-step-form.tsx`, at the final redirect to `/report`.
- **Assignment:** when the form is about to redirect, if the test is live (Section 7) assign the lead to `control` or `video` with a 50/50 random roll. If the test is not live, always assign `control`.
- **Stickiness:** the assignment is stored in a cookie `al_report_variation` (values `control` | `video`, 30-day expiry). If the cookie already exists, reuse it instead of re-rolling, so a returning visitor always sees the same version.
- **Hand-off to the page:** the variation is appended to the redirect URL as `?v=control` or `?v=video`. `ThankYouContent` already parses search params; it reads `v` to choose the layout.
- **Safety fallback:** if `ThankYouContent` receives `v=video` but no video URL is configured, it renders control. The variation can never render without a video.

## 7. Design - Part 3: Video gating

The variation must not serve live traffic until Ryan has filmed and hosted the 60-second video.

- **Mechanism:** a single env var, `NEXT_PUBLIC_REPORT_VIDEO_URL`.
  - Empty / unset -> the test is OFF. The form always assigns `control`. 100% of traffic sees the current page.
  - Set to a valid video URL -> the test is ON. The form begins the 50/50 split.
- **Go-live:** Ryan sets `NEXT_PUBLIC_REPORT_VIDEO_URL` in the Vercel project env vars and redeploys. No code change required to launch. The test cannot go live without a video.

## 8. Design - Part 4: Variation tracking into Close CRM

Goal: Close CRM should know, per lead, which variation they saw, so the dashboard can compute conversion per variation.

- **New Close custom field:** a lead custom field named "Lead Magnet Variation" (values `control` / `video`). Created once via the Close API (Claude runs a one-time script using `CLOSE_API_KEY` - approved by Ryan). The resulting custom field ID is then added alongside the existing field IDs in the codebase, matching the pattern in `create-lead/route.ts`.
- **New endpoint:** `POST /api/close/set-variation` accepting `{ leadId, variation }`. It writes the variation to the lead's custom field. Non-blocking and fault-tolerant, matching the existing `mark-call-booked` / `update-lead` pattern. If `leadId` is missing it falls back to finding the lead by email.
- **When it fires:** on `/report` load, `ThankYouContent` fires this call once (the `leadId` is in the page's `data` payload). Because only people who reach `/report` get stamped, "leads with a variation set" equals "/report visits" - this is the dashboard's definition of a visit. Repeat loads overwrite with the same value, so no double counting.
- **Booking:** unchanged. The existing `mark-call-booked` flow already flips lead status to a "Call Booked" status when someone books through iClosed.

Result: each lead in Close carries its variation and its booked / not-booked status.

## 9. Design - Part 5: The dashboard

- **Route:** a new page, `/dashboard`, in the same app.
- **Auth:** password gate. The password is read from the env var `DASHBOARD_PASSWORD` (value set in Vercel env vars, never committed to the repo). Simple password entry; once entered, access is held in a session cookie. Shared with Ryan, David, and Robin.
- **Data source:** the Close CRM API (`CLOSE_API_KEY`), queried server-side from the route.
- **Metrics shown, per variation (control vs video):**
  - Visits = count of leads whose "Lead Magnet Variation" field is set to that variation.
  - Booked calls = count of those leads whose status is "Strategy Call Booked" or "Triage Call Booked".
  - Conversion rate = booked / visits.
- **Display:** a side-by-side comparison (control vs video) of the three numbers, plus a simple bar chart (recharts, already a dependency). Optional date range filter.
- **Refresh:** data fetched live from Close on page load, with light caching to avoid hammering the Close API.

## 10. Setup & inputs

- **Video URL (Ryan):** the 60-second video, hosted (YouTube/Loom/etc.). Set as `NEXT_PUBLIC_REPORT_VIDEO_URL` in Vercel. This is what turns the test on.
- **Close custom field (Claude):** Claude creates the "Lead Magnet Variation" field via the Close API.
- **Dashboard password (Ryan):** set as `DASHBOARD_PASSWORD` in Vercel env vars. Value provided by Ryan, held outside the repo.
- **Build approach:** everything in Sections 5-9 is built now, on the `report-ab-test` branch, behind the video gate, so the test is paste-and-go the moment the video exists.

## 11. Risks & open points

- **Timeline depends on the video.** The build can complete fully, but the test produces zero data until Ryan films and configures the video. This is the critical-path item.
- **Close API rate limits.** The dashboard makes several Close API calls per load; light caching mitigates this.
- **Video host format.** `VideoSection` currently expects a YouTube-style embed. If Ryan uses Loom or Vimeo, the embed handling needs a small adjustment once the URL is known.

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
