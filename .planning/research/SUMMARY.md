# Project Research Summary

**Project:** EA Time Freedom Report PDF Redesign
**Domain:** jsPDF server-side PDF generation — personalized lead magnet report
**Researched:** 2026-02-23
**Confidence:** HIGH (stack and architecture verified against live codebase; pitfalls confirmed against jsPDF GitHub issues; features MEDIUM from industry sources cross-checked against 4+ references)

## Executive Summary

This is a brownfield redesign of an existing automated lead magnet PDF — not a greenfield build. The product is a personalized multi-page report generated server-side by jsPDF 3.0.4 on Vercel, emailed to founders after form submission. The core change: replace the current daily/weekly/monthly task frequency structure with a Core Four ownership-area structure (Email, Calendar, Personal Life, Business Processes), add a new static framework education page (Three Pillars + Core Four), and increase task volume and description richness to create deliberate "overwhelm" — the emotional fulcrum that drives the Time Audit CTA conversion.

The recommended approach is surgical modification of the existing V2 pipeline rather than creating a V3. The V2 layout system already has clean rendering primitives (roundedRect, setColor, splitTextToSize, addFootersToAllPages). The entire redesign is achievable by adding four new page builder functions to `layout-v2.ts`, modifying one data transformation function in `generator-v2.ts`, and updating the orchestrator function. The blast radius is two files for the core redesign. The AI prompt optionally gains a `coreTaskType` required field, but task grouping by Core Four area is achievable in Phase 1 through category/title inference without any prompt change.

The two highest risks are (1) the AI prompt change breaking the validator/fixer pipeline if data contract changes are not driven by TypeScript type changes first, and (2) dynamic Y-position overflow silently clipping content at the bottom of pages. Both risks are preventable with established patterns already documented in the codebase. The 30-second Vercel timeout is not a concern for the current page count — expected generation time is 200–500ms. Token budget for richer task descriptions must be profiled before the AI prompt is finalized.

## Key Findings

### Recommended Stack

The stack is already decided: jsPDF 3.0.4 on Vercel serverless, Node.js runtime, TypeScript throughout. No new dependencies are required for the core redesign. The only optional addition is `jspdf-autotable@^3.8.x` for the dense 4-column task roadmap layout — use it only if strict column alignment becomes painful with pure coordinate math; coordinate-based layout is recommended first.

**Core technologies:**
- **jsPDF 3.0.4** (installed): PDF generation engine — already in use; 3.0.2+ includes CVE-2025-57810 fix (fast-png PNG parser); no upgrade needed
- **Vercel serverless + Node.js**: Execution host — 30s timeout already configured; full PDF generation expected in under 500ms; well within budget
- **jspdf-autotable 3.8.x** (optional install): Dense table layout for 4-column task pages — compatible with jsPDF 3.x; install only if coordinate layout becomes unwieldy

**Key API patterns confirmed for the redesign:**
- Pre-computed RGB color tuples (eliminates ~300+ hex-parse regex calls per PDF)
- `doc.roundedRect(x, y, w, h, rx, ry, style)` native in jsPDF 3.x — no plugin needed for card layouts
- `doc.splitTextToSize(text, maxWidthMm)` — must be called AFTER setFont/setFontSize (order-dependent bug confirmed)
- `checkPageBreak(doc, y, neededHeight)` pattern required — jsPDF has no layout engine
- `doc.link(x, y, w, h, { url })` — clickable CTA already working in V2

### Expected Features

**Must have (table stakes — already exist or blocking for redesign):**
- Personalized cover/hero with client name, revenue tier, and calculated ROI numbers
- Consistent brand identity (navy/teal palette, Helvetica, footer on every page)
- Three Pillars + Core Four framework page with visual boxes — biggest credibility upgrade; static content, low implementation risk
- Task list organized by Core Four ownership areas (not daily/weekly/monthly) — blocking redesign goal
- Full task volume shown (25-40 tasks total, not capped at 5 per category) — "overwhelm" effect is the conversion mechanism
- Rich task descriptions referencing real systems by name (Email GPS, Partnership Playbook, camcorder method)
- Strong CTA page with urgency copy referencing the financial pain shown on page 1
- Pre-filled booking link with lead data (already works via `buildBookingUrl()`)

**Should have (competitive differentiators — add after P1 is done):**
- Visual color differentiation between Core Four sections (4-color variant system on design tokens)
- Section intro copy personalized by business type (requires AI prompt to generate 2-3 sentences per area)
- Framework name badges/pill labels on section headers (colored circles + text)

**Defer (v2+):**
- Dynamic cover with website-scraped company name prominently featured
- Confidence scoring (highly-likely vs. common tasks per business)
- Multi-language support

**Explicit anti-features (do not build):**
- Frequency-based organization (daily/weekly/monthly) — remove from redesign entirely
- Founder tasks / "delegation frees you up to" pages — dilutes overwhelm, remove
- Generic AI filler prose ("in today's fast-paced business environment") — framework copy must be hand-written by Ryan
- Table of contents, long introductions, stock photography, gradient simulations

### Architecture Approach

The redesign modifies V2 in place — no V3 generator. The key architectural insight is that `generateTimeFreedomReport()` in `layout-v2.ts` is the sole page-order orchestrator, and `transformToPDFData()` in `generator-v2.ts` is the sole data-shaping function. All Core Four grouping logic belongs in `transformToPDFData()` — layout functions receive pre-shaped data and never make business logic decisions. New page builders are added additively to `layout-v2.ts` without modifying existing ones until the new design is verified. The safe-feature-gate pattern (checking for the optional `core_four_tasks` field before choosing the new vs. old page sequence) allows zero-risk deployment.

**Major components:**
1. `layout-v2.ts` — PRIMARY change target: four new page builder functions + modified orchestrator + extended PDFReportData interface
2. `generator-v2.ts` — SECONDARY change target: Core Four grouping logic added to `transformToPDFData()`
3. `time-freedom-prompt.ts` — OPTIONAL Phase 5: add `coreTaskType` as required field only if grouping-by-inference quality is insufficient
4. All other files (routes, AI client, validator, fixer, types, email, CRM) — DO NOT TOUCH

**Proposed new page sequence:**
- Page 1: ROI/Pain summary (existing, keep)
- Page 2: Three Pillars + Core Four framework (new static page)
- Pages 3-6: Core Four task pages, one per ownership area
- Page 7+: Strong CTA page (redesigned)

### Critical Pitfalls

1. **Dynamic Y-overflow silently clips content** — jsPDF has no layout engine; any renderer that underestimates height causes content to vanish without an error. Prevention: build `checkPageBreak(doc, y, neededHeight)` as a non-optional guard before every draw call; use `splitTextToSize(...).length * lineHeight` for height estimation, never fixed numeric heights.

2. **AI prompt change breaks validator/fixer pipeline** — changing the AI output structure without updating `report-validator.ts`, `report-fixer.ts`, and TypeScript types simultaneously causes the fixer to silently corrupt every report with old-structure generic tasks. Prevention: change TypeScript types first (compile errors as forcing function); update validator and fixer in the same PR as the prompt change; never deploy prompt change in isolation.

3. **Token budget exhaustion truncates JSON mid-object** — richer task descriptions + longer prompt + 24+ tasks risks hitting the 4096 token limit; `JSON.parse` throws on truncated output; fixer cannot repair truncated JSON. Prevention: count tokens on the new prompt before finalizing; add `stop_reason === 'max_tokens'` check to claude-client.ts; consider increasing `maxTokens` if needed.

4. **Dead V1 generator accidentally activated** — `generator.ts` and `layout.ts` (V1) are dead code that compiles cleanly; a single wrong import line in `route.ts` activates them in production, causing crashes or wrong-design PDFs. Prevention: delete V1 files or add a runtime throw guard before redesign begins.

5. **`splitTextToSize` / font-size ordering bug** — calling `splitTextToSize` before `setFont`/`setFontSize` produces wrong wrap widths (confirmed jsPDF issue #2781). Prevention: treat font setup + split + render as atomic in every render block; add to code review checklist.

## Implications for Roadmap

Based on combined research, the build dependency graph dictates a 5-phase sequence. Phases 1-3 have hard ordering requirements. Phases 4-5 are parallel or deferred.

### Phase 1: Pre-Redesign Cleanup + Data Layer Foundation
**Rationale:** Before any new code is written, two blockers must be cleared: (a) V1 generator files create dangerous accidental-activation risk during development; (b) the `PDFReportData` interface extension and Core Four grouping logic in `transformToPDFData()` must exist before any page builder can be written that consumes Core Four data. This is the lowest-risk, highest-leverage phase — no visual changes, no AI changes, maximum safety for everything that follows.
**Delivers:** V1 files deleted/guarded; `PDFReportData` extended with optional `core_four_tasks`; Core Four grouping logic in `transformToPDFData()` with fallback for missing `coreTaskType`; `checkPageBreak()` utility built and enforced
**Addresses:** Anti-features (removes V1 risk); table-stakes data structure for all subsequent pages
**Avoids:** Dead V1 generator activation pitfall; Y-overflow pitfall (checkPageBreak established here)

### Phase 2: Static Framework Page (Three Pillars + Core Four)
**Rationale:** The Three Pillars + Core Four page is fully static content — no AI dependency, no Core Four grouping needed, no prompt changes required. It is the lowest-risk highest-credibility improvement in the entire redesign. Building it second proves the new page builder pattern (additive functions, computed heights, safe feature gate) before tackling dynamic task pages. Framework copy (Three Pillars, Core Four descriptions) must be written by hand here — not AI-generated.
**Delivers:** `buildThreePillarsPage()` and `buildCoreFourOwnershipPage()` in `layout-v2.ts`; visual boxes with roundedRect; section counts sourced from `core_four_tasks` data; static copy for the education stage of the emotional arc
**Uses:** roundedRect card pattern, two-column grid, pre-computed RGB color table, computed box heights
**Avoids:** Hardcoded height pitfall (computed heights enforced); adds no AI risk

### Phase 3: Core Four Task Pages + Orchestrator Wiring
**Rationale:** This is the highest-value phase — replacing the daily/weekly/monthly task layout with Core Four ownership areas is the central redesign goal. It depends on Phase 1 (data layer) and Phase 2 (pattern established). The orchestrator is wired last within this phase after all builders are confirmed working. The safe feature gate means the old layout remains as fallback until the new layout is fully verified.
**Delivers:** `buildCoreFourTasksPage()` for all four areas; redesigned `buildStrongCTAPage()` with urgency copy; `generateTimeFreedomReport()` orchestrator rewritten to new page sequence; full task volume shown (all tasks, no cap); numbered tasks by area
**Uses:** checkPageBreak (from Phase 1), Core Four task arrays (from Phase 1), existing renderTaskCard pattern extended
**Avoids:** V1 accidental activation (V1 already removed); orchestrator wired only after all builders exist (critical dependency per ARCHITECTURE.md)

### Phase 4: AI Prompt Upgrade (coreTaskType Required Field)
**Rationale:** Phase 4 is optional and separate from Phases 1-3. Phases 1-3 work with grouping-by-inference (coreTaskType optional, category fallback). Phase 4 upgrades the AI prompt to make `coreTaskType` required in the output JSON, improving grouping precision. This is isolated to one file (`time-freedom-prompt.ts`) but requires coordinated updates to `report-validator.ts` and `report-fixer.ts`. Token budget must be calculated before this phase begins.
**Delivers:** Precise Core Four grouping from AI (no inference needed); richer task descriptions; section intro copy per area (if included)
**Uses:** claude-client.ts `stop_reason` check (must be added here); token budget analysis (pre-phase gate)
**Avoids:** Validator/fixer pipeline breakage pitfall (types change first, compile errors as forcing function); token truncation pitfall (token budget checked before prompt finalized)

### Phase 5: Polish + v1.x Differentiators
**Rationale:** After Phase 3 is verified in production, polish features can be added without risk. These are additive design tokens and copy changes — no structural dependencies.
**Delivers:** 4-color variant system for Core Four sections in `design-system.ts`; personalized section intro copy per business type; framework badge/pill labels on section headers; urgency copy referencing financial pain in CTA
**Uses:** existing design token system, existing AI prompt (or Phase 4 prompt if done)

### Phase Ordering Rationale

- **Data layer before page builders:** Core Four grouping in `transformToPDFData()` must exist before any page builder can receive `core_four_tasks` arrays (ARCHITECTURE.md build order, Phase 1a before 2a-2d)
- **Cleanup before everything:** V1 accidental activation is highest-consequence risk; eliminate it before writing any new code
- **Static pages before dynamic:** Three Pillars page proves the new page builder pattern with zero AI risk before tackling dynamic task content
- **Orchestrator wired last:** ARCHITECTURE.md is explicit — "Critical dependency: [3a] must be the LAST step" — wiring the orchestrator before all builders are complete causes runtime errors
- **Prompt change isolated:** AI prompt + validator + fixer changes are tightly coupled; isolating them in Phase 4 keeps blast radius bounded and allows Phases 1-3 to ship independently

### Research Flags

Phases requiring careful attention during task planning:
- **Phase 3 (Core Four task pages):** The `buildCoreFourTasksPage()` function must handle variable task counts per area and dynamic page overflow — this is the most complex rendering function and needs detailed task-level planning
- **Phase 4 (AI prompt upgrade):** Token budget calculation is a required pre-phase gate; must run Anthropic tokenizer on new prompt + max output before writing a single line of code; validator/fixer coordination is a multi-file change that needs careful sequencing

Phases with standard patterns (well-documented, low planning risk):
- **Phase 1 cleanup:** Deleting files and adding TypeScript fields are mechanical; patterns are clear
- **Phase 2 static page:** roundedRect card layout pattern is fully documented in STACK.md with working code examples; static content = no AI risk
- **Phase 5 polish:** Design token additions and copy changes are lowest-risk changes in the codebase

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | jsPDF 3.0.4 API verified against official docs; Vercel limits verified against official docs; all patterns verified against existing codebase |
| Features | MEDIUM | Industry lead-magnet conversion sources are medium-confidence marketing blogs; jsPDF capability claims verified HIGH via GitHub issues; emotional arc design is opinionated but well-reasoned |
| Architecture | HIGH | All findings from direct codebase inspection; no inference or assumptions; change boundaries verified by reading every affected file |
| Pitfalls | HIGH | jsPDF issues confirmed against GitHub issue tracker; AI pipeline risks confirmed by reading validator/fixer source; all 6 critical pitfalls have reproduction conditions and recovery steps |

**Overall confidence:** HIGH — this is a brownfield redesign with a thoroughly understood codebase. The uncertainties are in AI output quality (will the AI generate sufficiently rich descriptions?), not in technical implementation.

### Gaps to Address

- **AI output quality validation:** Will generated task descriptions be specific enough to create the "overwhelming volume" effect without prompt-engineering? This cannot be known until the first real AI run with the new prompt. Plan for a review cycle after Phase 4 where real generated PDFs are evaluated against the emotional arc goal.
- **jspdf-autotable compatibility:** Confirmed compatible with jsPDF 3.x but no explicit CI badge for 3.0.4 specifically (MEDIUM confidence). If autotable is used for 4-column layout, test against the installed version before committing to it.
- **Token budget for richer descriptions:** 4096 tokens may be tight for 24+ tasks with 30-50 word descriptions. Must verify via tokenizer before Phase 4 begins. May require increasing `maxTokens` in claude-client.ts.
- **Fallback content quality:** If AI produces thin output for an unfamiliar business type, the fallback generic tasks must be specific enough to the Core Four areas to still create overwhelm. Static fallback arrays need to be written with the same care as the hand-written framework copy.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `web/src/lib/pdf/layout-v2.ts`, `generator-v2.ts`, `design-system.ts` — current V2 patterns verified
- Direct codebase inspection: `web/src/lib/ai/task-generator.ts`, `claude-client.ts`, `report-validator.ts`, `report-fixer.ts` — pipeline constraints verified
- Direct codebase inspection: `web/src/types/task.ts`, `web/src/app/api/generate-pdf/route.ts` — data contracts verified
- jsPDF Official Docs (artskydj.github.io) — API method signatures
- jsPDF GitHub Releases — 3.0.x changelog
- Vercel Functions Limits (vercel.com/docs) — memory, timeout, payload
- CVE-2025-57810 — fast-png PNG DoS fix confirmed in 3.0.2
- jsPDF GitHub Issues #2781, #2212 — splitTextToSize unit bug confirmed
- Anthropic Docs — stop_reason handling, structured outputs

### Secondary (MEDIUM confidence)
- jspdf-autotable GitHub — jsPDF 3.x compatibility (no explicit 3.0.4 CI badge)
- Sublyme Digital, Productive and Free, BusySeed, Magnetly — lead magnet conversion best practices
- Chris Koehl, Netwave Interactive — CTA placement and urgency copy patterns
- Amra and Elma — lead magnet conversion statistics (54% distrust non-personalized content)

### Tertiary (LOW confidence)
- Ian Brodie — Lead Magnets That Convert (404 at fetch time; cited from search summary only)

---
*Research completed: 2026-02-23*
*Ready for roadmap: yes*
