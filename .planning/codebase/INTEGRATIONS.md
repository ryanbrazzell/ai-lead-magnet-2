# External Integrations

**Analysis Date:** 2026-02-23

## APIs & External Services

**AI/LLM Services:**
- Claude (Anthropic)
  - What it's used for: Task generation with detailed personalization
  - SDK/Client: @anthropic-ai/sdk 0.71.2
  - Auth: Environment variable `ANTHROPIC_API_KEY`
  - Model: claude-sonnet-4-5-20250929
  - Implementation: `web/src/lib/ai/claude-client.ts`
  - Timeout: 90 seconds with 1 retry
  - Max tokens: 4096

- Gemini (Google)
  - What it's used for: Alternative task generation model
  - Auth: Environment variables `GEMINI_API_KEY` or `GOOGLE_API_KEY`
  - Model: gemini-2.0-flash
  - Implementation: `web/src/lib/ai/gemini-client.ts`
  - Timeout: 30 seconds with 1 retry
  - Max tokens: 3000

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
- Mailgun
  - What it's used for: PDF email delivery with attachments
  - SDK/Client: mailgun.js 12.3.0
  - Auth: Environment variables `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`
  - Endpoint: `https://api.mailgun.net`
  - Implementation: `web/src/lib/email/mailgun.ts`
  - Features: Supports PDF attachments, HTML and text templates, email validation

- Resend
  - What it's used for: Critical alert emails and backup email delivery
  - SDK/Client: resend 6.5.2
  - Auth: Environment variable `RESEND_API_KEY`
  - Implementation: `web/src/lib/alerts/critical-alert.ts`, `web/src/app/api/send-email/route.ts`, `web/src/app/api/send-report-email/route.ts`
  - Features: Fire-and-forget alerts for pipeline failures

## Data Storage

**File Storage - Primary:**
- AWS S3
  - What it's used for: Permanent public PDF storage
  - SDK/Client: @aws-sdk/client-s3 3.940.0
  - Auth: Environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  - Bucket: `S3_BUCKET_NAME` or `AWS_S3_BUCKET_NAME` env var
  - Region: `S3_REGION` or `AWS_S3_REGION` or `AWS_REGION` (defaults to `us-east-1`)
  - Implementation: `web/src/lib/pdf/s3Service.ts`
  - Features: 50MB file size limit, automatic `reports/` folder prefixing, 1-year cache control
  - Error handling: Specific messages for NoSuchBucket, AccessDenied, etc.

**File Storage - Backup:**
- Vercel Blob
  - What it's used for: Backup PDF storage with permanent public URLs
  - SDK/Client: @vercel/blob 2.0.0
  - Auth: Implicit via Vercel deployment environment
  - Implementation: `web/src/app/api/generate-pdf/route.ts`
  - Used when: S3 upload fails or S3 not configured
  - Features: Permanent public URLs, non-critical failure handling

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
- Structured logs for: Claude API calls, Gemini API calls, S3 uploads, PDF generation, email delivery
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

**Required env vars for Full Functionality:**

```
# AI/LLM
ANTHROPIC_API_KEY=sk-ant-...          # Claude API (required for task generation)
GEMINI_API_KEY=AIzaSy...              # Gemini API (optional, fallback to GOOGLE_API_KEY)
GOOGLE_API_KEY=AIzaSy...              # Google API (fallback for Gemini)

# Email - Mailgun
MAILGUN_API_KEY=key-...               # Mailgun API key
MAILGUN_DOMAIN=mg.assistantlaunch.com # Mailgun domain
MAILGUN_FROM_EMAIL=ryan@assistantlaunch.com # From address

# Email - Resend
RESEND_API_KEY=re_...                 # Resend API key

# File Storage - S3
AWS_ACCESS_KEY_ID=AKIA...             # AWS access key
AWS_SECRET_ACCESS_KEY=...             # AWS secret key
S3_BUCKET_NAME=your-bucket            # OR AWS_S3_BUCKET_NAME
S3_REGION=us-east-1                   # Optional, defaults to us-east-1
AWS_REGION=us-east-1                  # Regional fallback

# CRM
CLOSE_API_KEY=api_key_...             # Close CRM API key

# Webhooks
VITE_ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://...    # Sentry DSN for error tracking

# Runtime
NODE_ENV=production                    # Set in Vercel
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
- `POST /api/send-email` - Send email via Mailgun or Resend
- `POST /api/send-report-email` - Send report email
- `POST /api/generate-tasks` - Generate AI tasks

## API Call Patterns

**Retry Strategy:**
- Claude: 1 retry on 5xx, 529, timeout, network errors
- Gemini: 1 retry on timeout/network errors
- S3: Direct attempt, no retry (errors handled with specific messages)
- Mailgun: Direct attempt, no retry
- Resend: Direct attempt, no retry
- Close CRM: Direct attempt, no retry (204+ error handling)

**Timeout Strategy:**
- Claude: 90 seconds
- Gemini: 30 seconds
- Mailgun: Default HTTP timeout
- Resend: Default HTTP timeout
- S3: Default AWS SDK timeout
- Close CRM: Default HTTP timeout

**Error Handling:**
- API errors logged to console and Sentry
- PDF generation failures: Alert sent via Resend
- Email delivery failures: Alert sent via Resend
- Task generation failures: Alert sent via Resend
- S3 upload failures: Fallback to Vercel Blob
- Non-critical failures never block user progression

---

*Integration audit: 2026-02-23*
