# External Integrations

**Analysis Date:** 2026-02-23

## APIs & External Services

**AI/LLM Services:**
- Claude (Anthropic) — **Primary and only active AI provider**
  - What it's used for: Task generation with detailed personalization + website-enriched context
  - SDK/Client: @anthropic-ai/sdk 0.71.2
  - Auth: Environment variable `ANTHROPIC_API_KEY`
  - Model: claude-sonnet-4-5-20250514 (Claude Sonnet 4.5)
  - Implementation: `web/src/lib/ai/claude-client.ts`
  - Timeout: 90 seconds with 1 retry
  - Max tokens: 4096
  - Temperature: 0.6
  - Enrichment: Task generator scrapes lead's company website (extracted from email domain) and feeds analysis into the prompt for business-specific personalization (`web/src/lib/ai/task-generator.ts` → `enrichWithWebsiteAnalysis()`)

- Gemini (Google) — **LEGACY / DEAD CODE — not actively used**
  - `web/src/lib/ai/gemini-client.ts` exists but is never imported by the task generator
  - The task generator exclusively calls `generateWithClaude()` from `claude-client.ts`
  - Dependencies (`GEMINI_API_KEY`, `GOOGLE_API_KEY`) are not required for production

**CRM & Lead Management:**
- Close CRM
  - What it's used for: Progressive lead capture and lead tracking
  - SDK/Client: Native HTTP fetch (no SDK)
  - Auth: Environment variable `CLOSE_API_KEY` (HTTP Basic auth)
  - Endpoint: `https://api.close.com/api/v1/lead/`
  - Implementation: `web/src/app/api/close/create-lead/route.ts`, `web/src/app/api/close/update-lead/route.ts`, `web/src/app/api/close/mark-call-booked/route.ts`
  - Custom fields tracked: source, Meta Click ID (fbc), Meta Browser ID (fbp), client IP, user agent

**Webhooks & Workflow Automation:**
- Zapier
  - What it's used for: Step 1 form data capture (non-blocking webhook)
  - Auth: Environment variable `VITE_ZAPIER_WEBHOOK_URL`
  - Implementation: `web/src/lib/zapier.ts`, `web/src/app/api/zapier/simplified/route.ts`
  - Behavior: Non-blocking, logs errors to console, does not prevent user progression
  - Data sent: firstName, lastName, title, phone, source, step, timestamp

**Email Services:**
- Resend — **Primary and only active email provider**
  - What it's used for: PDF report email delivery with attachments + critical alert emails
  - SDK/Client: resend 6.5.2
  - Auth: Environment variable `RESEND_API_KEY`
  - From address: `Ryan at Assistant Launch <ryan@assistantlaunch.com>`
  - Implementation: `web/src/app/api/send-email/route.ts` (report delivery), `web/src/lib/alerts/critical-alert.ts` (failure alerts)
  - Features: PDF attachments (base64), personalized HTML templates, error retry UI on report page

- Mailgun — **LEGACY / DEAD CODE — not actively used**
  - `web/src/lib/email/mailgun.ts` exists but is never imported by any API route
  - The send-email route exclusively uses Resend
  - Dependencies (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`) are not required for production

## Data Storage

**File Storage - Primary:**
- Vercel Blob — **Primary and only active PDF storage**
  - What it's used for: Permanent public PDF storage with downloadable URLs
  - SDK/Client: @vercel/blob 2.0.0
  - Auth: Implicit via Vercel deployment environment
  - Implementation: `web/src/app/api/generate-pdf/route.ts` (lines 148-165)
  - Path prefix: `reports/` folder
  - Access: Public URLs for direct download
  - Error handling: Non-critical — if Blob upload fails, PDF is still sent via email attachment

**File Storage - Legacy:**
- AWS S3 — **LEGACY — only `generateSafeFilename()` utility is used**
  - `web/src/lib/pdf/s3Service.ts` exists but the actual S3 `PutObject` upload is not called from any route
  - The generate-pdf route imports only `generateSafeFilename` for filename generation
  - The response field `s3Url` is an alias for `blobUrl` for backward compatibility
  - S3 SDK (@aws-sdk/client-s3) and env vars (`AWS_ACCESS_KEY_ID`, etc.) are not required for production

**Databases:**
- Not detected - Application is stateless, uses external services for all persistence
- No ORM/database client library found

**Caching:**
- Not detected - No Redis or caching layer configured

## Authentication & Identity

**Auth Provider:**
- Custom/None detected
- Third-party auth not used
- Lead tracking via Close CRM API key
- Meta tracking via cookies (first-party)

**Meta (Facebook) Tracking:**
- Implementation: `web/src/lib/tracking/meta-cookies.ts`
- Cookies tracked: Meta Click ID (fbc), Meta Browser ID (fbp)
- Usage: Passed to Close CRM as custom fields for attribution

## Monitoring & Observability

**Error Tracking:**
- Sentry (@sentry/nextjs 10.38.0)
  - What it's used for: Error tracking and performance monitoring
  - Auth: Environment variable `NEXT_PUBLIC_SENTRY_DSN`
  - Configuration files: `web/sentry.client.config.ts`, `web/sentry.server.config.ts`, `web/sentry.edge.config.ts`
  - Implementation: `web/src/instrumentation.ts`
  - Sampling: 20% of transactions in production, 100% of errors, 0% sessions
  - Enabled: Production only
  - Source maps: Disabled

**Logs:**
- Console-based logging throughout codebase
- Structured logs for: Claude API calls, Vercel Blob uploads, PDF generation, email delivery
- Example: `console.log()` and `console.error()` calls in API routes and service clients

## CI/CD & Deployment

**Hosting:**
- Vercel (project ID: `prj_2b2dXx8hAEXaHf3h9DJFMvIv4l8B`)
- Organization ID: `team_enO54bXQbbFA6vZ6a3kqylSl`
- Project name: `timefreedom`

**CI Pipeline:**
- Playwright tests with Chromium browser
- Retries: 2 in CI environment, 0 locally
- E2E tests run against deployed application
- Configuration: `web/playwright.config.ts`

## Environment Configuration

**Required env vars for Production:**

```
# AI/LLM (required)
ANTHROPIC_API_KEY=sk-ant-...          # Claude API — sole AI provider for task generation

# Email (required)
RESEND_API_KEY=re_...                 # Resend — sole email provider for report delivery + alerts

# CRM (required)
CLOSE_API_KEY=api_key_...             # Close CRM — lead capture and tracking

# Webhooks (required)
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...

# Error Tracking (required)
NEXT_PUBLIC_SENTRY_DSN=https://...    # Sentry DSN for error tracking

# Runtime
NODE_ENV=production                    # Set in Vercel
```

**Legacy env vars (NOT required — dead code):**

```
# Gemini (legacy — gemini-client.ts exists but is never called)
GEMINI_API_KEY=AIzaSy...
GOOGLE_API_KEY=AIzaSy...

# Mailgun (legacy — mailgun.ts exists but is never imported by routes)
MAILGUN_API_KEY=key-...
MAILGUN_DOMAIN=mg.assistantlaunch.com
MAILGUN_FROM_EMAIL=ryan@assistantlaunch.com

# S3 (legacy — only generateSafeFilename utility used, no actual S3 uploads)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=your-bucket
S3_REGION=us-east-1
AWS_REGION=us-east-1
```

**Secrets location:**
- Local development: `web/.env.local` (not committed)
- Production: Vercel environment variables
- Example template: `web/.env.example`

**Vercel-specific env files:**
- `web/.env.vercel` - Production Vercel environment
- `web/.env.vercel.local` - Local Vercel emulation

## Webhooks & Callbacks

**Incoming Webhooks:**
- `/api/zapier/simplified` - Receives Step 1 form data from Zapier
  - Method: POST
  - Payload: firstName, lastName, title, phone, source, step, timestamp
  - Implementation: `web/src/app/api/zapier/simplified/route.ts`

**Outgoing Webhooks:**
- Zapier webhook (VITE_ZAPIER_WEBHOOK_URL)
  - When: After Step 1 form submission
  - Data: Lead data for multi-step form progress tracking
  - Implementation: `web/src/lib/zapier.ts`

**API Endpoints (Internal):**
- `POST /api/close/create-lead` - Create lead in Close CRM
- `PUT /api/close/update-lead` - Update lead with contact info
- `POST /api/close/mark-call-booked` - Mark call as booked in Close CRM
- `POST /api/generate-pdf` - Generate and upload PDF report
- `POST /api/send-email` - Send email via Resend
- `POST /api/send-report-email` - Send report email
- `POST /api/generate-tasks` - Generate AI tasks

## API Call Patterns

**Retry Strategy:**
- Claude: 1 retry on 5xx, 529, timeout, network errors (transient only — no retry on 4xx)
- Task generator: 3-tier fallback escalation (primary prompt → simplified → emergency)
- Vercel Blob: Direct attempt, no retry (non-critical — PDF still sent via email if upload fails)
- Resend: Direct attempt, no retry
- Close CRM: Direct attempt, no retry (204+ error handling)

**Timeout Strategy:**
- Claude: 90 seconds
- generate-tasks API route: maxDuration = 60 seconds
- generate-pdf API route: maxDuration = 30 seconds
- Resend: Default HTTP timeout
- Close CRM: Default HTTP timeout

**Error Handling:**
- API errors logged to console and Sentry
- PDF generation failures: Alert sent via Resend
- Email delivery failures: Alert sent via Resend
- Task generation failures: Alert sent via Resend
- Vercel Blob upload failures: Graceful degradation (PDF sent via email attachment)
- Close CRM update failures on report page: Non-blocking (logged but doesn't fail the flow)
- Non-critical failures never block user progression

---

*Integration audit: 2026-02-23*
