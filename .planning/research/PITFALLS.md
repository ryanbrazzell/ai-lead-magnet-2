# Pitfalls Research

**Domain:** PDF report redesign — jsPDF + AI prompt restructuring in a brownfield production lead-magnet funnel
**Researched:** 2026-02-23
**Confidence:** HIGH (codebase read directly; issues confirmed against jsPDF GitHub issues and Anthropic docs)

---

## Critical Pitfalls

### Pitfall 1: Dynamic Y-Position Accumulation — Overflow Silently Clips Content

**What goes wrong:**
jsPDF has no layout engine. Every element is placed at an absolute (x, y) coordinate. When a section grows taller than expected — because an AI-generated description is longer than anticipated, or a static framework block is taller than designed — content overflows below the bottom of the page and is silently clipped. There is no error. The PDF looks complete in code but the bottom items are invisible in the rendered document.

**Why it happens:**
The codebase already uses manual y-position tracking (`let y = 20; ... y = renderSomething(doc, y)`). Each renderer returns a new y. If any renderer underestimates how tall it is — especially ones using `splitTextToSize` for dynamic text — the accumulated y drifts downward past `PAGE_HEIGHT - MARGIN` (277mm for A4). The existing layout-v2.ts `buildTasksPage` does not guard against overflow; it renders all tasks and then checks if there's room for the CTA.

**How to avoid:**
Every renderer that contains dynamic text must return the actual consumed height. Before rendering any block, check `if (y + estimatedBlockHeight > PAGE_HEIGHT - 20) { doc.addPage(); y = 20; }`. Build a `checkPageBreak(doc, y, neededHeight)` utility used consistently across all renderers. Treat the page break check as non-optional, not an optimization.

**Warning signs:**
- CTA block or last task item is missing in rendered PDF
- The PDF has fewer pages than expected
- Text appears visually cut off at the bottom of a page with no continuation

**Phase to address:** PDF layout implementation phase — before any content is added to the redesigned pages.

---

### Pitfall 2: AI Prompt Structure Change Breaks the Validator/Fixer Pipeline

**What goes wrong:**
The current system expects `{ tasks: { daily: [...], weekly: [...], monthly: [...] } }` with exactly 24 tasks, `ea_task_count`, `ea_task_percent`, and `total_task_count`. The redesign changes this to Core Four areas (`emailOwnership`, `calendarOwnership`, `personalLife`, `recurringProcesses`). If the prompt is changed but `report-validator.ts`, `report-fixer.ts`, `task-generator.ts`, and the `generate-tasks` route are not simultaneously updated to expect the new structure, every single AI response will fail validation and trigger the fixer, or worse — the fixer will inject phantom tasks using hardcoded daily/weekly/monthly keys that no longer exist in the output, generating a structurally broken report that the PDF renderer will then receive.

**Why it happens:**
The validator checks for `analysis.dailyTasks !== 8`, `analysis.weeklyTasks !== 8` etc. The fixer's `createGenericTask` function hardcodes `frequency: 'daily' | 'weekly' | 'monthly'` keys. None of these are aware of Core Four keys. Changing the prompt alone — without updating the entire pipeline — creates a multi-component mismatch that fails silently in production (the fixer "fixes" the report into the old structure).

**How to avoid:**
Treat the data contract change as a migration, not a prompt edit. The TypeScript types (`TasksByFrequency`, `Task`, `TaskGenerationResult` in `types/task.ts`) must change first, which will produce compile errors everywhere the old structure is consumed. Fix every compile error before deploying. Run the existing test suite after each change. Update validator, fixer, type definitions, and generator in a single coordinated PR — never in isolation.

**Warning signs:**
- TypeScript compiles but tests fail after prompt change
- `generate-tasks` route returns data but `generate-pdf` route crashes
- PDF renders with all generic filler tasks (fixer ran but produced old-structure output)
- `ea_task_count` is 0 or NaN in the PDF

**Phase to address:** AI prompt redesign phase — the types must be the first thing changed, driven by TypeScript enforcement.

---

### Pitfall 3: Token Budget Exhaustion Truncates the JSON Mid-Object

**What goes wrong:**
The current prompt generates 24 tasks with descriptions of 15-25 words each. At 4096 max tokens, this is tight. The redesign adds: Three Pillars static content context in the prompt, Core Four area taxonomy in the output, richer task descriptions (to create the "overwhelming volume" effect). A longer prompt reduces the token budget for output. If Claude hits `max_tokens` while writing JSON, the response is truncated mid-string, mid-array, or mid-object. `JSON.parse()` throws. The fixer pipeline is not equipped to handle a truncation failure — it only handles structurally-valid-but-wrong-count reports. The `generate-tasks` route returns a 500 and the lead gets no report.

**Why it happens:**
The existing `claude-client.ts` uses `maxTokens: 4096`. The existing prompt is already approximately 500 tokens of instructions + variable lead context. Richer task descriptions (more words per task) multiply across 24+ tasks. The `parseClaudeResponse` function strips markdown fences but does not attempt to repair truncated JSON.

**How to avoid:**
Token-budget the prompt before implementation: count tokens on the new prompt template using the Anthropic tokenizer or `claude-tokenizer` NPM package. If the sum of (prompt tokens) + (expected output tokens for all tasks) approaches 4096, either increase `maxTokens` (claude-sonnet-4-5 supports higher limits with explicit configuration) or reduce per-task description verbosity in the prompt instructions. Also add a `stop_reason` check after the API call: if `response.stop_reason === 'max_tokens'`, log a critical alert and return a structured error rather than attempting to parse a broken response.

**Warning signs:**
- `Failed to parse Claude response` errors in logs
- `JSON.parse` exceptions in `generate-tasks` route
- Output token count in logs is exactly 4096
- Reports with missing closing braces in raw response logs

**Phase to address:** AI prompt redesign phase — token budget must be calculated before finalizing prompt structure.

---

### Pitfall 4: The Dead V1 Generator Is Accidentally Activated

**What goes wrong:**
The codebase has two PDF generators: `generator.ts` (V1, imports from `layout.ts`) and `generator-v2.ts` (V2, active, imports from `layout-v2.ts`). The `generate-pdf` route imports and calls `generatePDFV2`. If during the redesign a developer edits the import in `route.ts` to test V1, or accidentally imports from the wrong generator while adding a new page builder, V1 becomes active in production. V1 uses a completely different data structure (`PDFColorScheme`, `addROIHeroSection`, `addSplitTaskSection`) and different page layout logic. A V1 PDF under Core Four data will crash or produce a blank/corrupt document.

**Why it happens:**
Both generator files export functions with similar signatures. The route file has a single import line that switches between them. There are no runtime guards that enforce "V2 only." Dead code that compiles cleanly is indistinguishable from live code to a reviewer who isn't familiar with the history.

**How to avoid:**
Delete `generator.ts` and `layout.ts` (V1 files) before beginning the redesign work, or at minimum add a clearly documented deprecation comment and a runtime guard in V1 that throws immediately: `throw new Error('generator.ts (V1) is deprecated — use generator-v2.ts')`. The existing test files `pdf/__tests__/generator.test.ts` and `pdf/__tests__/layout.test.ts` should be updated to test V2, not V1, so they don't give false confidence.

**Warning signs:**
- Import path in `route.ts` points to `generator` instead of `generator-v2`
- TypeScript complains about `PDFColorScheme` being passed to a function expecting `PDFReportData`
- PDF is generated but pages look like the old design

**Phase to address:** Pre-redesign cleanup phase — remove or guard V1 before any new code is written.

---

### Pitfall 5: Static Framework Content Has Hardcoded Heights That Break for Long Names / Long Text

**What goes wrong:**
The redesign adds static content pages (Three Pillars, Core Four) with visual boxes. In jsPDF, boxes are drawn as rectangles with fixed height (`doc.rect(x, y, w, h, 'F')`). If the static text inside a box is hardcoded but the content is later edited to be longer, the text overflows the box boundaries and renders on top of whatever is below. This is especially likely for section headers, pillar descriptions, and Core Four explanations that a designer or copywriter may revise without realizing the height constants must also change.

**Why it happens:**
Layout-v2.ts already uses hardcoded block heights: `const blockHeight = 42` in `renderInvestmentBlock`. This pattern — hardcode a height, render content inside, assume it fits — works until the content changes. Static content is the highest-risk area because it feels "safe" (it doesn't depend on AI output) but the coordinates are tightly coupled to the exact character count of the copy.

**How to avoid:**
Calculate box heights dynamically from content. For text blocks: wrap the text first using `doc.splitTextToSize(text, maxWidth)`, count the returned array length, multiply by line height, add padding. Then draw the rectangle using that computed height. Never use a fixed numeric height for any box that contains text. For the static framework pages, write a helper `renderFrameworkBox(doc, title, body, y)` that computes its own height and returns it.

**Warning signs:**
- Box border drawn around a smaller area than the text it contains
- Text from one box visually overlaps the next section
- Copy changes during design review break the PDF layout

**Phase to address:** PDF static page design phase — enforce computed-height-only policy before writing any framework page renderers.

---

### Pitfall 6: `splitTextToSize` Width Is in Document Units But Font Size Is Always in Points

**What goes wrong:**
The document is initialized with `unit: 'mm'`. All coordinate arguments to `doc.rect()`, `doc.text()` etc. are in mm. But `doc.setFontSize(12)` sets the font in points regardless of the unit setting. When calling `doc.splitTextToSize(text, maxWidthInMm)`, the width argument must be in the document's unit (mm) — but the internal character width calculation is tied to the current font size in points. If the font size is set after `splitTextToSize` is called, or the wrong unit is passed, text wraps at the wrong column. This is a confirmed jsPDF bug (GitHub Issue #2781, #2212) that is order-dependent and not caught by TypeScript.

**Why it happens:**
jsPDF's internal scale factor (`k = 72 / 25.4` for mm) is applied during character width calculation. If the active font or font size has changed since the last `setFontSize` call, the split calculation uses stale metrics. Because this is a pure side effect of call order, it produces incorrect results only under specific ordering conditions, making it intermittent and hard to reproduce in unit tests.

**How to avoid:**
Always call `doc.setFont(...)` and `doc.setFontSize(...)` before calling `doc.splitTextToSize(text, width)` in the same render block. Treat font setup + text split + text render as an atomic sequence — never split them across function calls. Add a code review checklist item for this specific ordering requirement.

**Warning signs:**
- Text wraps at a different point than expected in certain sections but not others
- Long task descriptions overflow into the right margin
- Intermittent layout differences between deploys

**Phase to address:** PDF layout implementation — enforce the font-set-before-split pattern in code review.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding block heights for static pages | Faster to write | Any copy change breaks layout silently | Never — use computed heights |
| Skipping `stop_reason` check after Claude API | Less code | Truncated JSON crashes the pipeline in production | Never — add the check |
| Keeping V1 generator files around "just in case" | Easy rollback option | Accidental V1 activation; dead code confusion; tests give false confidence | Delete it; use git for rollback |
| Using `wrapText(text, maxChars)` (character count) instead of `doc.splitTextToSize(text, maxWidthMm)` | Simple to write | Character-count wrapping ignores proportional fonts — narrow chars (`i`, `l`) vs wide chars (`W`, `M`) cause wrong breaks | Never for proportional fonts like Helvetica |
| Changing the prompt without updating TypeScript types first | Faster iteration | Runtime errors instead of compile errors; fixer pipeline silently corrupts output | Never in production code |
| Generating fallback tasks with hardcoded frequency keys (`daily`/`weekly`/`monthly`) after Core Four migration | Reuses existing fixer | Fallback tasks use wrong structure for new layout | Requires full fixer rewrite alongside prompt change |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude API (task generation) | Assume 4096 tokens is enough for a longer prompt + richer output | Count tokens on the new prompt before finalizing; check `stop_reason === 'max_tokens'` after every call |
| Vercel Blob upload (in `generate-pdf` route) | Assume the 30s timeout is budget for both PDF generation and upload | PDF generation + Blob upload must both complete in 30s; profile generation time locally before adding content |
| Vercel serverless (`generate-pdf` maxDuration: 30) | Adding more complex jsPDF rendering (more pages, more computed heights) increases generation time proportionally | Benchmark generation time with the new layout before deploying; the existing 30s is already tight |
| `report-validator.ts` (task structure validation) | Validate using old frequency-based counts (8 daily, 8 weekly, 8 monthly) after migrating to Core Four | Update validator to check Core Four counts before deploying the new prompt |
| `report-fixer.ts` (auto-fix pipeline) | Fixer injects `frequency: 'daily'` hardcoded tasks after Core Four migration | Either update fixer to use Core Four keys or disable the auto-fixer until it is rewritten for the new structure |
| Vercel Blob (PDF URL in Close CRM) | Assume `blobUrl` is always present; store it immediately | Blob upload can fail gracefully (the route handles it) — but the lead record in Close will have no PDF URL; test the failure path |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No page-break pre-checks before rendering task cards | Generation completes but PDF content is clipped; no error logged | Add `checkPageBreak()` guard before every `renderTaskCard()` call | Any time a task description exceeds ~2 lines |
| `doc.getTextWidth()` called inside a loop for every word | Noticeable generation slowdown as task count grows | Pre-calculate widths once per section; use `splitTextToSize` once per block | At 30+ tasks or 5+ pages |
| Recomputing ROI values in `transformToPDFData` on every call | Minimal now, cumulative if generation is retried | Extract ROI calculation into a cached step before `generatePDFV2` is called | Not critical at current scale |
| Adding more visual elements (borders, circles, gradient-like patterns via multiple rects) to static pages | PDF generation time creeps up toward the 30s limit | Budget rendering operations; profile before shipping; keep static page element count low | When total generation time exceeds ~25s |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Embedding lead PII (email, phone, name) in PDF filename stored publicly in Vercel Blob | Lead's personal data visible in URL; GDPR exposure | The existing `generateSafeFilename()` already sanitizes names — do not bypass it in the redesign |
| Rendering unescaped lead input directly into PDF text | XSS is not a risk in jsPDF (it is not HTML), but malformed Unicode characters can crash `splitTextToSize` or `getTextWidth` | Sanitize lead input (especially `painPoints` field) to strip control characters before passing to any jsPDF text function |
| Including lead email in booking URL pre-fill params without encoding | Email with `+` or `&` breaks URL params | The existing `buildBookingUrl()` in layout-v2.ts uses `URLSearchParams` which handles encoding correctly — maintain this pattern |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Three Pillars + Core Four on separate pages makes the PDF too long | Reader disengages before reaching the task section (which is the conversion content) | Keep Three Pillars + Core Four on one page as specified in PROJECT.md; ruthlessly cut copy length |
| Core Four task sections with thin AI output show short, generic descriptions | The "overwhelming volume" effect fails; reader is not impressed | Build the fallback content system before or alongside the AI prompt redesign, not after |
| CTA only on the last page | High-intent readers who finish the task section may not flip to the final CTA page | Place the CTA link on each task page (layout-v2.ts already attempts this) and on the final page |
| Static framework content with no personalization signals | Reader feels they got a generic brochure, not a custom report | Inject the lead's name and revenue tier into framework copy where natural ("For founders at your stage...") |

---

## "Looks Done But Isn't" Checklist

- [ ] **PDF page break logic:** Every section has a `checkPageBreak` guard — verify by testing with a lead who has an unusually long `painPoints` field (300+ chars)
- [ ] **Token budget:** New prompt + expected output for a max-verbosity lead fits within max_tokens — verify by running the prompt through the Anthropic tokenizer with a long pain-points input before deploying
- [ ] **Validator updated:** `report-validator.ts` checks Core Four keys, not daily/weekly/monthly counts — verify by running the existing test suite against a Core Four response
- [ ] **Fixer updated:** `report-fixer.ts` filler tasks use Core Four keys — verify by intentionally sending a malformed AI response through the full pipeline
- [ ] **V1 generator inactive:** `generate-pdf/route.ts` imports `generatePDFV2` only — verify with a grep for `generatePDF` (non-V2) in the route file
- [ ] **Vercel timeout:** Full PDF generation (AI call excluded) completes in under 25s for a max-size report — verify by timing `generatePDFV2` locally with a 5-page output
- [ ] **Email delivery unbroken:** Lead still receives the PDF email after redesign — verify with an end-to-end form submission in staging before any production deploy
- [ ] **Close CRM unbroken:** `blobUrl` is correctly attached to the lead record after redesign — verify by checking a test lead's record in Close after staging submission

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Token truncation crashes generate-tasks in production | HIGH — every lead gets a broken experience | Revert prompt to previous version immediately via env var or feature flag; investigate token budget offline |
| Y-overflow clips content silently | MEDIUM — leads receive incomplete PDFs; no crash alert | Deploy hotfix adding page-break guards; regenerate affected PDFs via manual trigger if blobUrls are stored in Close |
| V1 generator accidentally activated | HIGH — PDF crashes or renders wrong design for all leads | Single-line import fix; deploy immediately; takes ~5 min to fix but impacts all leads until fixed |
| Validator/fixer mismatch after prompt change | HIGH — fixer corrupts every report with generic tasks | Revert `generate-tasks` route to previous version; restore previous prompt; fix data contract mismatch offline |
| Vercel 30s timeout exceeded | HIGH — generate-pdf returns 500; email contains no PDF | Optimize page count and rendering complexity; consider moving static page rendering to a prebuilt buffer |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dynamic Y-overflow clips content | PDF layout implementation | Test with max-length AI output on every page; inspect rendered PDFs for bottom clipping |
| Prompt change breaks validator/fixer pipeline | AI prompt redesign (type changes first) | TypeScript compile succeeds; full test suite passes with new structure before merging |
| Token budget exhaustion truncates JSON | AI prompt redesign (before finalizing prompt) | Token count check on new prompt + max output; `stop_reason` check added to client |
| Dead V1 generator accidentally activated | Pre-redesign cleanup | V1 files deleted or guarded; imports grep-verified in route files |
| Static content has hardcoded heights | PDF static page design | All box heights computed from content; no numeric height literals in static page renderers |
| `splitTextToSize` / font-size ordering bug | PDF layout implementation | Font always set before split in every render block; verified in code review checklist |
| Vercel 30s timeout exceeded | PDF layout implementation | Local timing benchmark before deploy; alert if generation exceeds 20s |
| Email delivery or Close CRM broken | Final integration testing | End-to-end form submission in staging; check Close lead record + email inbox |

---

## Sources

- jsPDF GitHub Issue #650 — Page split breaks content when page size exceeded: https://github.com/parallax/jsPDF/issues/650
- jsPDF GitHub Issue #2781 — Text scaleFactor incorrect depending on unit: https://github.com/parallax/jsPDF/issues/2781
- jsPDF GitHub Issue #2212 — mm unit no longer respected: https://github.com/parallax/jsPDF/issues/2212
- jsPDF GitHub Issue #3644 — `splitTextToSize()` wrong calculations with spaceless string: https://github.com/parallax/jsPDF/issues/3644
- Brahma Putra, Medium — "Client-side PDF Generation: dynamic content positioning in jsPDF": https://brahmaputra1996.medium.com/client-side-pdf-generation-if-you-struggled-with-dynamic-content-positioning-in-jspdf-459aef48dc30
- Anthropic Docs — Handling stop reasons: https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
- Anthropic Docs — Structured outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Anthropic Docs — Increase output consistency: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency
- Vercel KB — What can I do about Vercel Functions timing out: https://vercel.com/kb/guide/what-can-i-do-about-vercel-serverless-functions-timing-out
- Codebase: `/web/src/lib/pdf/generator-v2.ts`, `/web/src/lib/pdf/layout-v2.ts`, `/web/src/lib/pdf/layout.ts`, `/web/src/lib/pdf/generator.ts`
- Codebase: `/web/src/lib/ai/claude-client.ts`, `/web/src/lib/ai/report-validator.ts`, `/web/src/lib/ai/report-fixer.ts`
- Codebase: `/web/src/lib/ai/prompts/time-freedom-prompt.ts`, `/web/src/app/api/generate-tasks/route.ts`, `/web/src/app/api/generate-pdf/route.ts`
- Codebase: `/web/src/types/task.ts`, `/.planning/PROJECT.md`

---
*Pitfalls research for: jsPDF PDF report redesign + AI prompt restructuring in brownfield production funnel*
*Researched: 2026-02-23*
