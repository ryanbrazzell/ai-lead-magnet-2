# Tech Stack Preferences

## Choosing Your Stack (Start Here)

Before jumping into specific technologies, determine which category your project falls into:

### High-Performance Stack (Recommended for Scale)
**Use when:**
- Expecting many users (10k+ monthly active users)
- Global audience (users worldwide)
- Real-time features or low-latency requirements
- AI/ML features with heavy compute
- Need edge computing benefits

**Stack**: Cloudflare Workers + Neon + Hono + tRPC (detailed below)

### Simple Stack (Faster to Launch)
**Use when:**
- MVP or early validation phase
- Small user base (<10k monthly active users)
- Single-region audience
- Simpler feature set
- Want fastest time-to-market

**Stack**: Vercel + Supabase + Next.js (see "Simple Stack Alternative" below)

**Decision Guidance**: When in doubt, start simple. You can always migrate to the high-performance stack later when needed.

---

## Recommended Stack (2025) - High-Performance

Use this as a starting point sourced from a senior developer. Treat it as guidance, not a mandate. Do not adopt it automatically—first run the Fit Checklist below and confirm with the founder.

---

## Adoption Policy (Guidance, not mandate)

- This stack is a strong default suggestion, not a rule.
- Always run a quick fit check before adopting.
- If any item fails the fit check, propose 1–2 alternatives with pros/cons.
- Get explicit founder confirmation before finalizing the product’s tech stack.

### Fit Checklist (run before adoption)
- Product needs SSR/SEO or server-rendered marketing site?
  - If yes, consider Next.js on Cloudflare Pages Functions (or a hybrid) instead of SPA-only.
- Region/regulatory constraints (EU-only, HIPAA, etc.)?
  - If yes, verify Cloudflare/Neon/Upstash regions and compliance; propose compliant alternatives if needed.
- Team familiarity and continuity?
  - If the team lacks experience with Workers/Hono/Drizzle, consider transitional options.
- Existing provider commitments?
  - If the org is already standardized on Vercel or AWS, ensure integrations are acceptable or propose adapters.
- Realtime/websocket-heavy requirements?
  - Validate Workers approach and Neon realtime constraints; propose alternatives if needed.
- Budget constraints?
  - Estimate monthly costs (Workers, Neon, Upstash, R2, LLMs). If tight, propose cost‑optimized variants (Workers AI fallback, fewer regions, lower plan tiers).

### Founder Confirmation (template)
"Here are the options and tradeoffs for this project’s tech stack. Do you approve Option A as the baseline, or should we choose another?"

## Frontend

**Defaults**
- **Vite + React + TypeScript**
  - What: Fast dev server + React UI + type safety.
  - Why: Instant feedback while building, fewer bugs thanks to types, huge ecosystem.
- **shadcn/ui + Tailwind CSS**
  - What: High-quality, accessible React components styled with Tailwind utilities.
  - Why: Ship polished UI quickly while keeping full control over design.
- **TanStack Router (SPA routing)**
  - What: Client-side routing for single-page apps (no full page reloads).
  - Why: Simple, modern router built for React without legacy baggage.
- **MobX (state management)**
  - What: Minimal, observable state management.
  - Why: Easy mental model; keeps UI in sync with data with less boilerplate.
- **Vercel AI SDK (streaming chat, AI Elements)**
  - What: Frontend glue for streaming AI responses and chat UIs.
  - Why: Makes AI UX (typing streams, retries) feel first-class with less code.
- **Framer Motion + Lucide Icons**
  - What: Animations and icon set.
  - Why: Professional motion and clean, consistent icons.

---

## Backend / API

**Defaults**
- **Cloudflare Workers (edge runtime)**
  - What: Serverless functions running globally close to users.
  - Why: Low latency, auto-scale, low ops overhead.
- **Hono (lightweight TS framework)**
  - What: Small, fast web framework tailored for edge runtimes.
  - Why: Express-like DX with great TypeScript support and performance.
- **tRPC (type-safe API)**
  - What: Frontend calls backend functions directly with shared types.
  - Why: No manual REST/GraphQL boilerplate, fewer integration bugs.
- **Better Auth (email, OAuth, JWT)**
  - What: Authentication library for login flows and session handling.
  - Why: First-class TypeScript, flexible providers, keeps auth in your stack.
- **Mastra (AI orchestration: agents, RAG, memory)**
  - What: Coordinates multi-step AI workflows and retrieval from your docs.
  - Why: Encodes AI “how-to” so features are reliable and repeatable.

---

## Database

**Defaults**
- **Neon (serverless Postgres)**
  - What: Managed Postgres with branching and serverless scale.
  - Why: Familiar SQL with modern workflows and great DX.
- **Drizzle ORM (TypeScript-first ORM)**
  - What: Type-safe schema and queries + migrations.
  - Why: Safer refactors; your DB schema lives in code.
- **Neon HTTP driver (@neondatabase/serverless)**
  - What: HTTP Postgres driver that works in edge runtimes.
  - Why: Standard DB connections aren’t available in Workers; this is the fix.

---

## AI & Data

**Defaults**
- **Models: OpenAI / Anthropic / Gemini**
  - What: Best-in-class LLMs.
  - Why: Choose per task for quality/cost/latency.
- **Cloudflare Workers AI (optional fallback)**
  - What: Cloudflare-hosted models.
  - Why: Backup or cost-saving option when appropriate.
- **Upstash Redis (chat memory, rate limiting)**
  - What: Serverless Redis for state and quotas.
  - Why: Durable conversation memory and abuse protection with simple pricing.
- **R2 (file uploads: docs/images for RAG)**
  - What: Cloudflare object storage.
  - Why: Cheap, durable storage for user uploads and knowledge docs.

---

## Infra / Deploy

**Defaults**
- **Cloudflare Workers + Pages (primary hosting)**
  - What: Backend on Workers, frontend on Pages (static SPA or bundled by Vite).
  - Why: Global performance, unified platform, generous free tier.
- **Wrangler CLI (deploy)**
  - What: Cloudflare’s CLI to build, preview, and deploy.
  - Why: One command deploys both worker and pages.
- **GitHub Actions (CI/CD)**
  - What: Automate tests, builds, and deployments on push/PR.
  - Why: Consistent releases and quality gates.
- **Vercel (optional frontend preview)**
  - What: Preview URLs for branches/PRs if you prefer Vercel previews.
  - Why: Great reviewer experience; optional if Cloudflare Pages previews suffice.

---

## Developer AI Tools (REQUIRED - not product runtime)

These tools are **mandatory** for all projects using Boundless OS:

- **Context7 MCP** ⚠️ REQUIRED
  - What: Documentation lookup tool for Claude Code
  - Why: Always check latest docs before implementing; cite sources
  - Setup: Must be installed in Claude Code settings before starting any project

- **Playwright MCP** ⚠️ REQUIRED
  - What: Visual/e2e testing automation
  - Why: Test real user flows, catch UI issues, founder can see it working
  - Setup: Must be installed in Claude Code settings + `npm install -D playwright`

- **Claude Code** (recommended)
  - What: AI coding assistant via Cursor/CLI
  - Why: Best integration with Boundless OS workflows and MCP tools

---

## Testing Strategy

**Visual Testing (preferred for founder visibility)**
- **Playwright**
  - What: Automates a browser to click through flows and take screenshots.
  - Why: You can see the app working; catches real UX issues.

**Code Testing (as needed)**
- Unit tests for core logic; integration tests for critical flows.

---

## Development Principles

**For Non-Technical Founder**
1. **It works:** Functionality comes first.
2. **It’s tested:** Use Playwright to verify key flows.
3. **It’s deployed:** Ship to Cloudflare quickly.
4. **It’s refined:** Improve based on real usage.

Iteration speed > perfection.

---

## Project Structure Defaults

```text
/web                 - Vite + React + TS app (components, routes, state)
/worker              - Cloudflare Worker (Hono routes, tRPC router, auth)
/drizzle             - DB schema & migrations (Drizzle)
/public              - Static assets (images, fonts)
/tests               - Playwright tests
wrangler.toml        - Cloudflare config
```

Environment setup:
- `.env.local` for local secrets; `.env.example` template without secrets.
- Clear README with setup and deploy commands.

---

## Deployment Workflow

1. **Local**
   - Run Vite dev server for `/web` and Wrangler dev for `/worker`.
   - Test with Playwright.
2. **Preview**
   - Push to GitHub → Cloudflare Pages preview builds (or Vercel previews if enabled).
   - Team reviews the preview URL.
3. **Production**
   - Merge to `main` → GitHub Actions runs tests and deploys via Wrangler.
   - Monitor Cloudflare & Neon dashboards.

Post-deploy checks (mandatory):
- **Cloudflare**: Verify worker status and inspect logs via CLI (e.g., `wrangler tail`).
- **Vercel (if used)**: Check deployment status via CLI and review build logs.
- **Smoke tests**: Run Playwright against the deployed URL (preview/prod) for key user flows.
- **Rollback**: If issues are detected, revert to last good build and open a follow-up task.

Branch strategy (simple):
```text
main           - Production (live)
staging        - Optional pre-prod testing
feature/*      - Feature branches
```

---

## Simple Stack Alternative (Vercel + Supabase)

For MVPs, simple apps, and fast launches:

### Frontend
- **Next.js 14+ (App Router)** - Full-stack React framework with SSR/SSG
- **Tailwind CSS + shadcn/ui** - Same design system as high-performance stack
- **Vercel** - Zero-config deployment, automatic previews

### Backend & Database
- **Supabase** - PostgreSQL + Auth + Storage + Edge Functions in one
  - Built-in authentication (email, OAuth, magic links)
  - PostgreSQL database with realtime subscriptions
  - Built-in file storage (images, documents)
  - Edge functions for serverless APIs

### AI (if needed)
- **Vercel AI SDK** - Streaming chat UIs, AI elements
- **OpenAI/Anthropic** - LLM APIs (same as high-performance stack)

### Deployment
- **Vercel** - Push to GitHub, auto-deploy, instant previews
- **Supabase** - Managed database, auth, storage (no ops)

### When to Migrate
Move to high-performance stack when you hit:
- 10k+ monthly active users
- Need for edge computing (global latency)
- Complex AI orchestration (multi-step agents)
- Advanced caching/performance requirements

### Migration Path
Supabase → Neon (same PostgreSQL, easy migration)
Vercel → Cloudflare Workers (rewrite backend, keep frontend)

---

## When to Choose Different Technologies

- **Mobile app**: React Native or Flutter (confirm scope first).
- **Heavy data processing**: Consider a Python service (only if needed).
- **Payments/e-commerce**: Shopify + Stripe may be faster to market.
- **SSR/SEO-heavy marketing site**: Next.js already handles this well (both stacks).

Always confirm deviation with the founder.

---

## Cost Considerations (free-tier friendly)

- **Cloudflare Workers/Pages**: generous free tier, global CDN.
- **Neon**: free tier Postgres for development.
- **Upstash Redis**: free tier for low-volume memory/rate limiting.
- **GitHub Actions**: included minutes for public/private repos (limits apply).
- **Vercel (optional)**: free preview tier if using.

Alert the founder before:
- Exceeding free-tier limits
- Adding paid services
- Integrating ongoing-cost services

---

## Performance Targets

- **Page Load**: < 3s
- **Time to Interactive**: < 5s
- **Edge-first**: Serve static and APIs from Cloudflare’s edge
- **Uptime**: 99%+ (Cloudflare + Neon)

Optimize after it’s working and measured.

---

## Security Defaults

- ✅ HTTPS (Cloudflare provides TLS by default)
- ✅ Environment variables for secrets (never commit)
- ✅ Input validation on all forms
- ✅ Authentication with Better Auth (email/OAuth/JWT)
- ✅ CORS via Hono middleware
- ✅ Rate limiting via Upstash Redis

Security review before launch:
- [ ] No API keys in code
- [ ] Auth flows work (signup/login/logout, token refresh)
- [ ] Protected routes are enforced server-side
- [ ] Forms validate input; errors don’t leak sensitive info

---

## Monitoring and Debugging

- **Cloudflare**: Logs, analytics, worker traces
- **Neon**: Query logs, performance insights
- **Upstash**: Metrics for rate limits and memory
- **Browser DevTools**: Frontend debugging
- Consider: **Sentry** (errors), **LogRocket** (session replay) for production apps

---

## Operational Defaults & Guardrails

- **CLI-first**: Prefer official CLIs for auth/logins and platform operations (e.g., `wrangler login`, `vercel login`, `gh auth login`). Avoid ad‑hoc browser flows when a CLI exists.
- **Docs-first**: Before using a service/API, query **Context7 MCP** for latest docs and cite in notes/PRs.
- **Idempotent deploys**: All deploy commands should be safe to rerun.
- **Secrets management**: Configure env vars via Cloudflare/Vercel dashboards or `wrangler.toml` bindings; never commit secrets.
- **Post-deploy verification**: Treat status checks, logs review, and smoke tests as required steps, not optional.

---

## Summary (Quick Reference)

- **Frontend**: Vite + React + TS, shadcn/ui + Tailwind, TanStack Router, MobX, Framer Motion, Lucide, Vercel AI SDK
- **Backend**: Cloudflare Workers, Hono, tRPC, Better Auth, Mastra
- **Database**: Neon Postgres, Drizzle ORM, Neon HTTP driver
- **AI & Data**: OpenAI/Anthropic/Gemini; Workers AI (optional); Upstash Redis; R2
- **Infra/Deploy**: Cloudflare Workers + Pages, Wrangler, GitHub Actions; Vercel (optional previews)

Philosophy: Start simple, ship fast, measure, iterate.
