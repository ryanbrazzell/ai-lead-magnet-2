# Architecture

**Analysis Date:** 2026-02-23

## Pattern Overview

**Overall:** Next.js 16 Server Components with Client-side Form State Management and Asynchronous AI-Driven Report Generation

**Key Characteristics:**
- Multi-step form with progressive disclosure (4 screens)
- Server API routes for external integrations (Close CRM, Claude AI, Resend, Vercel Blob)
- Layered separation: UI components → hooks → API routes → service libraries → external integrations
- Asynchronous task generation with AI (Claude Sonnet), PDF generation, and email delivery
- State passed via URL parameters (base64-encoded form data) from form to report page

## Layers

**Presentation Layer (UI Components):**
- Purpose: Render user interfaces for form, report pages, and shared layout
- Location: `src/components/`
- Contains: React components for form screens, layout containers, design system UI
- Depends on: Hooks, utilities, design tokens
- Used by: Next.js pages in `src/app/`
- Examples:
  - `src/components/form/multi-step-form.tsx` - Stateful form orchestrator
  - `src/components/layout/page-layout.tsx` - Shared page wrapper
  - `src/components/thank-you/thank-you-content.tsx` - Report page composition

**Client Hooks Layer:**
- Purpose: Encapsulate reusable client-side logic and external integrations
- Location: `src/hooks/`
- Contains: Custom React hooks like `useMetaTracking` (Meta pixel cookies), `useButtonVariant` (design system logic)
- Depends on: External APIs (Meta Pixel), design tokens
- Used by: Client components
- Examples:
  - `src/hooks/use-meta-tracking.ts` - Extracts Meta _fbc/_fbp cookies for Close CRM attribution

**API Routes Layer (Backend):**
- Purpose: Expose REST endpoints for client and external service communication
- Location: `src/app/api/`
- Contains: Next.js route handlers (POST endpoints)
- Depends on: Service libraries, types, external SDKs
- Used by: Browser fetch calls, Zapier webhooks, internal services
- Endpoints:
  - `src/app/api/close/*` - Close CRM integration (create/update leads, mark calls booked)
  - `src/app/api/generate-tasks/route.ts` - AI task generation (Claude)
  - `src/app/api/generate-pdf/route.ts` - PDF generation with Vercel Blob upload
  - `src/app/api/send-email/route.ts` - Email delivery via Resend
  - `src/app/api/send-report-email/route.ts` - Report email async delivery
  - `src/app/api/zapier/simplified/route.ts` - Zapier webhook handler

**Service Libraries Layer:**
- Purpose: Business logic, external integrations, data processing
- Location: `src/lib/`
- Contains: Organized subdirectories for specific domains
- Depends on: Types, external SDKs, utilities
- Used by: API routes, client components, other services
- Core subdirectories:
  - `src/lib/ai/` - Claude AI client, task generation, prompts, report validation/fixing
  - `src/lib/pdf/` - PDF generation engines (generator.ts, generator-v2.ts), layout logic, Vercel Blob upload
  - `src/lib/email/` - Email template generation, Mailgun/Resend clients, async notifications
  - `src/lib/tracking/` - Analytics and event tracking
  - `src/lib/website/` - Website scraping for company analysis
  - `src/lib/alerts/` - Critical error alerting

**Types Layer:**
- Purpose: Centralized TypeScript interfaces for all data structures
- Location: `src/types/`
- Contains: Unified interfaces for leads, tasks, PDFs, emails
- Depends on: Nothing (foundational layer)
- Used by: All layers
- Key files:
  - `src/types/lead.ts` - Lead data (UnifiedLeadData, WebsiteAnalysis)
  - `src/types/task.ts` - Task structures (Task, TaskGenerationResult, CoreEATasks)
  - `src/types/pdf.ts` - PDF options and results
  - `src/types/email.ts` - Email options and responses
  - `src/types/index.ts` - Barrel export

## Data Flow

**Main Form → Report Generation Flow:**

1. **Form Entry** (`src/app/page.tsx`):
   - User completes MultiStepForm (4 screens: name → email → phone → business details)
   - Form state held in React.useState

2. **Lead Creation** (Screen 2 - Email):
   - Client calls `POST /api/close/create-lead` with name + email
   - API creates lead in Close CRM
   - Returns leadId and stores in form state

3. **Form Submission** (Screen 4 - Business Details):
   - Client encodes all form data (base64) and adds to URL params
   - Client navigates to `/report?data=[encoded]...`

4. **Report Page Load** (`src/app/report/page.tsx`):
   - Server renders with Suspense fallback
   - ThankYouContent client component mounts
   - Decodes form data from URL params

5. **Task Generation**:
   - Client calls `POST /api/generate-tasks` with form data
   - API validates and routes to appropriate AI prompt based on leadType
   - Claude Sonnet generates 30 tasks (10 daily, 10 weekly, 10 monthly)
   - Validator checks output structure; report-fixer corrects issues
   - Returns TaskGenerationResult

6. **Simultaneous: PDF Generation and Email**:
   - Client calls `POST /api/generate-pdf` with tasks + user data
   - API generates PDF using jsPDF layout, uploads to Vercel Blob
   - Returns base64 PDF + public URL
   - Client calls `POST /api/send-email` with PDF
   - API sends via Resend with personalized template

**State Management:**
- Form state: React.useState in MultiStepForm component
- Report data: URL query parameters (base64-encoded JSON)
- Async operations: Custom promise tracking (pendingLeadIdRef) + loading states
- Cross-page communication: URL params, localStorage not used

## Key Abstractions

**UnifiedLeadData:**
- Purpose: Single interface for all lead types ('main', 'standard', 'simple')
- Examples: `src/types/lead.ts`
- Pattern: Extends across all form variants without duplication

**TaskGenerationResult:**
- Purpose: Standardized AI output with 30 tasks + metrics
- Examples: `src/types/task.ts`
- Pattern: Ensures consistent structure regardless of prompt variant

**PDF Generation Pipeline:**
- Purpose: Compose jsPDF document from task data
- Examples: `src/lib/pdf/generator-v2.ts`, `src/lib/pdf/layout-v2.ts`
- Pattern: Generator handles orchestration; layout handles positioning

**Email Service Abstraction:**
- Purpose: Decouple email template from delivery provider
- Examples: `src/lib/email/template.ts`, `src/lib/email/mailgun.ts`
- Pattern: Template generates HTML; service routes through Resend/Mailgun

**ROI Calculator:**
- Purpose: Centralized business logic for time/revenue calculations
- Examples: `src/lib/roi-calculator.ts`
- Pattern: Functions for revenue mapping, hourly rates, task hour distribution

## Entry Points

**Home Page (Marketing Funnel):**
- Location: `src/app/page.tsx`
- Triggers: User visits /
- Responsibilities:
  - Render PageLayout wrapper
  - Show hero section with product mockup
  - Render MultiStepForm orchestrator
  - Display bonus stack and video testimonials

**Report/Thank You Page:**
- Location: `src/app/report/page.tsx`
- Triggers: Form submission redirect
- Responsibilities:
  - Parse form data from URL params
  - Trigger task generation via API
  - Fetch task results and display
  - Trigger PDF/email generation
  - Show confirmation + CTA sections

**API Route: POST /api/generate-tasks:**
- Location: `src/app/api/generate-tasks/route.ts`
- Triggers: Client fetch after form submit, thresholds checked
- Responsibilities:
  - Validate request body
  - Route to appropriate AI prompt (main/standard/simple)
  - Call Claude API with retry logic
  - Validate and fix output
  - Return TaskGenerationResult

**API Route: POST /api/generate-pdf:**
- Location: `src/app/api/generate-pdf/route.ts`
- Triggers: Client fetch after task generation completes
- Responsibilities:
  - Accept tasks + user data
  - Generate jsPDF with layout
  - Upload to Vercel Blob
  - Return base64 + public URL

**API Route: POST /api/send-email:**
- Location: `src/app/api/send-email/route.ts`
- Triggers: Client fetch after PDF generation
- Responsibilities:
  - Validate email address
  - Generate personalized HTML template
  - Send via Resend with PDF attachment
  - Return message ID or error

## Error Handling

**Strategy:** Multi-layer validation with graceful degradation and critical alerts

**Patterns:**
- Request validation at API entry point (field presence, type checking)
- AI output validation (structure, task count, EA percentage ranges)
- Fallback prompts in task generator (unified → streamlined → simplified → emergency)
- Report fixer service to correct common validation failures
- Critical alert service for unrecoverable errors
- Logging with correlation IDs for request tracing

**Examples:**
- `src/app/api/generate-tasks/route.ts` validates leadType, email, phone
- `src/lib/ai/report-validator.ts` checks task counts (must be 10 per frequency)
- `src/lib/ai/report-fixer.ts` adds missing EA tasks, fixes frequency mismatches
- `src/lib/alerts/critical-alert.ts` sends Sentry/email for critical failures

## Cross-Cutting Concerns

**Logging:** Structured console logs with prefixed namespaces:
- `[API:generate-tasks:INFO]`, `[TaskGenerator:WARN]`, `[PDFGenerator:ERROR]`
- Correlation ID generation for request tracing across services
- Log levels: info, warn, error, debug (dev only)

**Validation:** Type-safe via TypeScript strict mode
- Request body validation at API boundaries
- Runtime validation for AI output structures
- Email/phone validation using regex patterns
- Form field validation via form-validation.ts utilities

**Authentication:** None enforced (public funnel)
- Close CRM API key in environment
- Claude API key in environment
- Resend API key in environment
- IP/User-Agent logging for security monitoring

**Instrumentation:** Sentry error tracking
- `src/instrumentation.ts` registers Sentry for Node runtime
- Captures request errors via `onRequestError`
- Config split between server and edge runtimes
- `sentry.server.config`, `sentry.edge.config` files

**Tracking:** Meta Pixel and Close CRM attribution
- `useMetaTracking` hook extracts Meta _fbc/_fbp cookies
- Cookies passed to Close CRM lead creation for attribution
- Zapier webhooks track form completions and report downloads

---

*Architecture analysis: 2026-02-23*
