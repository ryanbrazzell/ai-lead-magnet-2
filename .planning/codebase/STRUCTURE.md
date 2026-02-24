# Codebase Structure

**Analysis Date:** 2026-02-23

## Directory Layout

```
web/
├── public/                    # Static assets (logo, mockups, etc)
├── src/
│   ├── app/                   # Next.js App Router (pages + API routes)
│   │   ├── api/               # API route handlers
│   │   │   ├── close/         # Close CRM integration endpoints
│   │   │   ├── generate-pdf/  # PDF generation endpoint
│   │   │   ├── generate-tasks/ # AI task generation endpoint
│   │   │   ├── send-email/    # Email delivery endpoint
│   │   │   ├── send-report-email/ # Async email endpoint
│   │   │   └── zapier/        # Zapier webhook handler
│   │   ├── report/            # /report page (thank you)
│   │   ├── intro-call/        # Call booking page
│   │   ├── design-tokens/     # Design system showcase
│   │   ├── layout.tsx         # Root layout with fonts
│   │   └── page.tsx           # / home page (main form)
│   ├── components/            # React UI components
│   │   ├── form/              # Multi-step form & screens
│   │   ├── layout/            # Shared layout (header, footer, page wrapper)
│   │   ├── thank-you/         # Report page sections (cost card, CTA, etc)
│   │   ├── ui/                # Design system primitives (buttons, inputs, cards)
│   │   ├── social-proof/      # Testimonials, social proof
│   │   ├── tracking/          # Analytics/tracking components
│   │   ├── responsive/        # Responsive behavior utilities
│   │   ├── post-submission/   # Post-form confirmation sections
│   │   ├── integration/       # External widget integrations
│   │   ├── booking-confirmed/ # Booking confirmation pages
│   │   └── test/              # Test utilities & fixtures
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-meta-tracking.ts
│   │   └── use-button-variant.ts
│   ├── lib/                   # Business logic & services
│   │   ├── ai/                # Claude AI integration
│   │   │   ├── claude-client.ts
│   │   │   ├── task-generator.ts
│   │   │   ├── report-validator.ts
│   │   │   ├── report-fixer.ts
│   │   │   ├── gemini-client.ts (legacy)
│   │   │   └── prompts/       # AI prompt templates
│   │   ├── pdf/               # PDF generation
│   │   │   ├── generator.ts
│   │   │   ├── generator-v2.ts
│   │   │   ├── layout.ts
│   │   │   ├── layout-v2.ts
│   │   │   ├── design-system.ts
│   │   │   └── s3Service.ts
│   │   ├── email/             # Email delivery
│   │   │   ├── template.ts
│   │   │   ├── mailgun.ts
│   │   │   └── asyncNotifications.ts
│   │   ├── tracking/          # Analytics
│   │   │   └── event-tracker.ts
│   │   ├── website/           # Company website analysis
│   │   ├── alerts/            # Error alerting (Sentry, etc)
│   │   ├── roi-calculator.ts  # ROI/business logic
│   │   ├── design-tokens.ts   # Color & spacing constants
│   │   ├── form-validation.ts # Form validation utilities
│   │   ├── validation.ts      # Type validation
│   │   ├── zapier.ts          # Zapier integration
│   │   └── utils.ts           # General utilities
│   ├── types/                 # TypeScript interfaces
│   │   ├── lead.ts
│   │   ├── task.ts
│   │   ├── pdf.ts
│   │   ├── email.ts
│   │   ├── validation.ts
│   │   └── index.ts (barrel)
│   ├── test/                  # Test setup & utilities
│   │   └── setup.ts
│   └── instrumentation.ts     # Sentry initialization
├── tests/
│   └── e2e/                   # Playwright E2E tests
├── src/__tests__/             # Integration & component tests
├── vitest.config.ts           # Vitest configuration
├── playwright.config.ts       # Playwright configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint configuration
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
└── README.md
```

## Directory Purposes

**src/app/**
- Purpose: Next.js App Router structure (pages and API routes)
- Contains: Page components (.tsx), API handlers (route.ts), layout files
- Key pattern: File-based routing where `page.tsx` renders the route, `route.ts` handles API
- Generated: Next.js auto-generates routes from directory structure

**src/app/api/**
- Purpose: Backend HTTP endpoints for external integrations
- Contains: Route handlers organized by feature (close/, email/, pdf/)
- Key files:
  - `src/app/api/close/create-lead/route.ts` - POST to create Close CRM lead
  - `src/app/api/generate-tasks/route.ts` - POST to generate AI tasks (calls Claude)
  - `src/app/api/generate-pdf/route.ts` - POST to generate PDF (calls jsPDF)
  - `src/app/api/send-email/route.ts` - POST to send email (calls Resend)
- Pattern: Each route validates input, calls service libraries, returns JSON

**src/components/**
- Purpose: Reusable React UI components
- Contains: Component files organized by feature domain
- Subdirectories:
  - `src/components/form/` - MultiStepForm orchestrator + form screens (NameScreen, EmailScreen, etc)
  - `src/components/layout/` - PageLayout, Header, Footer, HeroSection
  - `src/components/thank-you/` - Report page sections (ThankYouContent, CostCard, CTASection)
  - `src/components/ui/` - Design system primitives (Button, Input, Card, Select, PillButton)
- Pattern: Functional components using React hooks, client/server split via "use client" directive

**src/components/form/screens/**
- Purpose: Individual form screens within MultiStepForm
- Contains: Named screen components (NameScreen, EmailScreen, PhoneScreen, etc)
- Pattern: Each screen is a controlled component that calls updateField() and onNext()
- Usage: Imported by MultiStepForm, rendered conditionally based on currentScreen state

**src/lib/ai/**
- Purpose: Claude AI integration and task generation pipeline
- Contains: AI client, task generator, output validation, repair logic, prompt templates
- Key files:
  - `src/lib/ai/claude-client.ts` - Anthropic SDK wrapper with retry logic
  - `src/lib/ai/task-generator.ts` - Main orchestrator with leadType routing
  - `src/lib/ai/report-validator.ts` - Validates task counts and structure
  - `src/lib/ai/report-fixer.ts` - Fixes common validation failures
  - `src/lib/ai/prompts/` - Prompt template builders (unified, streamlined, simplified, emergency)
- Pattern: Fallback escalation on failures (main prompt → streamlined → simplified → emergency)

**src/lib/pdf/**
- Purpose: PDF document generation using jsPDF
- Contains: PDF generation engines, layout logic, color/design system, Vercel Blob upload
- Key files:
  - `src/lib/pdf/generator-v2.ts` - Main PDF orchestrator (v2, preferred)
  - `src/lib/pdf/layout-v2.ts` - Page layout logic with sections (header, tasks, ROI, footer)
  - `src/lib/pdf/design-system.ts` - Color constants, typography settings
  - `src/lib/pdf/s3Service.ts` - S3 filename generation
- Pattern: Generator calls layout functions, layout composes jsPDF primitives

**src/lib/email/**
- Purpose: Email template generation and delivery
- Contains: HTML template builders, email service clients, async notifications
- Key files:
  - `src/lib/email/template.ts` - Builds personalized HTML from task data
  - `src/lib/email/mailgun.ts` - Mailgun client wrapper (legacy)
  - `src/lib/email/asyncNotifications.ts` - Sends confirmation/status emails
- Pattern: Template generates HTML; service routes through Resend (preferred over Mailgun)

**src/types/**
- Purpose: Centralized TypeScript interface definitions
- Contains: Barrel export (index.ts) + specific type files
- Key files:
  - `src/types/lead.ts` - UnifiedLeadData, WebsiteAnalysis
  - `src/types/task.ts` - Task, TaskGenerationResult, CoreEATasks, CoreTaskType
  - `src/types/pdf.ts` - PDFGenerationOptions, PDFGenerationResult
  - `src/types/email.ts` - EmailSendOptions, EmailSendResult, EmailErrorResponse
- Pattern: Each domain has its own file; barrel export for convenience

**src/test/**
- Purpose: Test setup and utilities
- Contains: Vitest setup file with globals
- Key file: `src/test/setup.ts` - Imports testing-library/jest-dom for custom matchers
- Usage: Referenced in vitest.config.ts setupFiles

**tests/e2e/**
- Purpose: End-to-end browser tests using Playwright
- Contains: E2E test files (.test.ts)
- Pattern: Full form flow testing from / → /report

**src/__tests__/**
- Purpose: Integration and component tests
- Contains: Test files co-located with source or in __tests__ directories
- Pattern: .test.ts and .spec.ts files, Vitest as runner

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - Home page with MultiStepForm (marketing funnel)
- `src/app/report/page.tsx` - Report/thank you page after form submission
- `src/app/layout.tsx` - Root layout with global fonts (DM Sans, DM Serif, Montserrat)

**Configuration:**
- `tsconfig.json` - TypeScript paths: `@/*` → `./src/*`
- `vitest.config.ts` - Vitest setup with jsdom environment
- `playwright.config.ts` - Playwright E2E setup
- `eslint.config.mjs` - ESLint rules (Next.js core + TypeScript)

**Core Logic:**
- `src/lib/roi-calculator.ts` - Revenue mappings, hourly rates, task hour distribution
- `src/lib/design-tokens.ts` - Color palette and spacing constants
- `src/lib/form-validation.ts` - Email, phone, field validation utilities

**Design System:**
- `src/components/ui/` - Atomic components (button, input, card, select, pill-button)
- `src/lib/design-tokens.ts` - Color names and values
- `src/app/design-tokens/page.tsx` - Design system showcase page

**API Orchestration:**
- `src/app/api/generate-tasks/route.ts` - Main task generation entry point
- `src/app/api/generate-pdf/route.ts` - PDF generation entry point
- `src/app/api/send-email/route.ts` - Email delivery entry point

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Test files: `*.test.ts`, `*.test.tsx`, `*.spec.ts` (Vitest pattern)
- Types: `{domain}.ts` (lead.ts, task.ts, email.ts)
- Services/utilities: camelCase (`roi-calculator.ts`, `form-validation.ts`)
- Components: PascalCase in file name if exporting default component (`MultiStepForm.tsx`), but usually just match component name

**Directories:**
- Feature-based organization: `form/`, `email/`, `pdf/`, `ai/`
- Domain matching filenames: `lib/email/` for email services, `components/form/` for form components
- Test directories: `__tests__/` or alongside source with `.test.ts` extension
- Nested screens: `form/screens/` for individual form screens

## Where to Add New Code

**New Feature:**
- Primary code: Feature domain under `src/lib/{domain}/` (e.g., `src/lib/analytics/`)
- Tests: `src/lib/{domain}/__tests__/` for unit tests
- Types: Add to `src/types/{domain}.ts` or extend existing type file

**New Component/Module:**
- Implementation: `src/components/{feature}/{ComponentName}.tsx`
- Tests: `src/components/{feature}/__tests__/` or `{ComponentName}.test.tsx` co-located
- Hooks: `src/hooks/use{HookName}.ts` if reusable logic
- Styling: Inline Tailwind classes using `cn()` utility from `src/lib/utils.ts`

**New API Endpoint:**
- Route: `src/app/api/{feature}/{action}/route.ts`
- Validation: Validate request body in route handler (top of POST/PUT)
- Service call: Import service from `src/lib/{domain}/`
- Types: Use or create types in `src/types/{domain}.ts`
- Example: POST /api/analytics/track → `src/app/api/analytics/track/route.ts`

**Utilities & Helpers:**
- Shared utilities: `src/lib/utils.ts` (general purpose like `cn()` for class names)
- Domain utilities: `src/lib/{domain}/utilities.ts` or integrate into service files
- Validation: `src/lib/form-validation.ts` or `src/lib/validation.ts`

**Test Files:**
- Unit tests: `src/lib/{domain}/__tests__/{filename}.test.ts`
- Component tests: `src/components/{feature}/__tests__/{ComponentName}.test.tsx`
- Integration tests: `src/app/__tests__/` for cross-layer flows
- E2E tests: `tests/e2e/{feature}.test.ts` for user flows

## Special Directories

**src/__tests__/**
- Purpose: Integration and end-to-end tests for app layer
- Generated: No (user-created)
- Committed: Yes
- Contains: Tests that span multiple components/pages

**web/.next/**
- Purpose: Next.js build output
- Generated: Yes (by `npm run build`)
- Committed: No (.gitignored)
- Contains: Compiled pages, server functions, static assets

**src/app/api/ (__tests__ subdirectories)**
- Purpose: Unit tests for specific API routes
- Generated: No
- Committed: Yes
- Pattern: One test file per route handler (e.g., `route.test.ts` next to `route.ts`)

**public/**
- Purpose: Static files served at web root
- Generated: No
- Committed: Yes
- Contains: Logo, product mockup images, favicon, fonts (if not CDN-hosted)

---

*Structure analysis: 2026-02-23*
