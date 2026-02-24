# Technology Stack

**Analysis Date:** 2026-02-23

## Languages

**Primary:**
- TypeScript 5 - All application code
- JSX/TSX - React components with type safety

**Secondary:**
- CSS - Styling via Tailwind CSS

## Runtime

**Environment:**
- Node.js 20.19.5 (current)
- No `.nvmrc` file enforcing version constraint

**Package Manager:**
- npm 10.8.2
- Lockfile: `package-lock.json` present at `/Users/ryanbrazzell/boundless-os-template-2/web/package-lock.json`

## Frameworks

**Core:**
- Next.js 16.0.8 - Full-stack React framework for web application
- React 19.2.0 - UI component library
- React DOM 19.2.0 - React rendering for web

**UI & Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- Framer Motion 12.23.25 - Animation and motion primitives
- Lucide React 0.555.0 - Icon library (555 icons)
- Radix UI primitives:
  - @radix-ui/react-select 2.2.6
  - @radix-ui/react-tabs 1.1.13
  - @radix-ui/react-slot 1.2.4
- Class Variance Authority 0.7.1 - Component variant management
- Clsx 2.1.1 - Utility for constructing className strings
- Tailwind Merge 3.4.0 - Merge Tailwind CSS classes without duplicates
- Recharts 3.5.1 - Composable charting library

**Testing:**
- Vitest 4.0.14 - Fast unit test runner
- @testing-library/react 16.3.0 - React component testing utilities
- @testing-library/dom 10.4.1 - DOM testing utilities
- @testing-library/jest-dom 6.9.1 - Jest matchers for DOM
- Playwright 1.57.0 - Browser automation and E2E testing
- JSDOM 27.2.0 - JavaScript implementation of web standards

**Build/Dev:**
- @vitejs/plugin-react 5.1.1 - Vite plugin for React
- ESLint 9 - JavaScript/TypeScript linting
- eslint-config-next 16.0.6 - Next.js ESLint configuration
- TypeScript 5 - Static type checking and compilation
- TSX 4.21.0 - TypeScript execution for Node
- Dotenv 17.2.3 - Environment variable loading

## Key Dependencies

**Critical (actively used):**
- @anthropic-ai/sdk 0.71.2 - Claude AI API integration for task generation (model: claude-sonnet-4-5-20250514)
- @vercel/blob 2.0.0 - Primary PDF storage with permanent public URLs
- resend 6.5.2 - Primary email provider for report delivery + critical alerts
- jsPDF 3.0.4 - PDF generation from JavaScript
- @sentry/nextjs 10.38.0 - Error tracking and performance monitoring

**Legacy (installed but not actively used in production routes):**
- @aws-sdk/client-s3 3.940.0 - Only `generateSafeFilename()` utility used; no S3 uploads in routes
- mailgun.js 12.3.0 - Dead code; `mailgun.ts` exists but is never imported by routes
- form-data 4.0.5 - FormData builder (used by legacy Mailgun integration)

## Configuration

**TypeScript:**
- Target: ES2017
- Module: ESNext
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- Config file: `web/tsconfig.json`

**ESLint:**
- Config: `web/eslint.config.mjs`
- Base: eslint-config-next (core web vitals + TypeScript)
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**Next.js:**
- Config file: `web/next.config.ts`
- Wrapped with Sentry config for error tracking
- Source maps disabled in Sentry
- Max request duration: varies per route (generate-tasks: 60s, generate-pdf: 30s)

**Vitest:**
- Config file: `web/vitest.config.ts`
- Environment: jsdom (browser simulation)
- Globals enabled
- Test files: `src/**/*.{test,spec}.{js,jsx,ts,tsx}`
- Setup file: `src/test/setup.ts`
- Path alias configured: `@` → `./src`

**Playwright:**
- Config file: `web/playwright.config.ts`
- Test directory: `tests/e2e`
- Projects: Chromium only (Desktop Chrome)
- Workers: 1 (sequential execution)
- Base URL: http://localhost:3000
- Retries: 2 in CI, 0 locally
- Reporter: list format
- Screenshots: only on failure
- Auto-starts dev server with `npm run dev`

**PostCSS:**
- Config file: `web/postcss.config.mjs`
- Plugin: @tailwindcss/postcss 4

## Build Output

**Next.js Build:**
- Output directory: `web/.next/`
- Type definitions: `web/.next/types/**/*.ts`, `web/.next/dev/types/**/*.ts`

## Platform Requirements

**Development:**
- Node.js 20+
- npm 10+
- Active network for API integrations (Claude, Resend, Close CRM, Vercel Blob, Sentry)

**Production:**
- Deployed on Vercel (project: `timefreedom`)
- Requires environment variables for all external integrations
- Node.js 20+ compatible runtime

## Project Structure

**Web application location:** `/Users/ryanbrazzell/boundless-os-template-2/web/`

**Key directories:**
- Source code: `web/src/`
- Public assets: `web/public/`
- Tests: `web/tests/e2e/` (Playwright), `web/src/**/*.test.tsx` (Vitest)
- Build output: `web/.next/`

---

*Stack analysis: 2026-02-23*
