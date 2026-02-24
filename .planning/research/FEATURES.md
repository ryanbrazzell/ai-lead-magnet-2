# Feature Research

**Domain:** Lead magnet PDF reports (personalized, automated, sales-tool-oriented)
**Researched:** 2026-02-23
**Confidence:** MEDIUM — web search verified against multiple sources; jsPDF capability claims verified against official GitHub issues and documentation; design best-practice claims cross-checked across 4+ sources.

---

## Context: What This Research Is Answering

This is a **subsequent milestone** redesign of the EA Time Freedom Report — an automated jsPDF-generated PDF that is the lead magnet for Assistant Launch. The PDF is emailed to founders after form submission. The redesign must:

1. Show financial pain (ROI / cost of not having an EA)
2. Educate on Three Pillars framework (Right Person, Right Process, Right Support)
3. Present Core Four ownership areas (Email, Calendar, Personal Life, Processes) as visual boxes
4. Overwhelm with a massive personalized task list organized by those 4 areas
5. Drive to a Time Audit call CTA

Emotional arc: pain → education → overwhelm → solution

Technical constraint: **jsPDF server-side generation only** — no Puppeteer, no HTML-to-PDF, no image embeds without base64, no web fonts, page background is always white, no CSS styling.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or cheap.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cover / hero section with personalization | Every professional report starts with "Prepared for [Name]" — readers immediately check if it's truly theirs | LOW | Already exists. Client name + date on page 1. Must remain. |
| Consistent brand identity throughout | Logo, brand colors, fonts applied consistently across all pages | LOW | Navy/gold/teal palette already defined in design-system.ts. Footer already carries brand on all pages. |
| Clear section headers that telegraph structure | Readers scan before they read. Unlabeled sections = confusion = closed PDF | LOW | Already implemented. Must continue on all redesigned pages. |
| Readable body text (min 10-11pt) | PDFs read on screen demand larger text than print. Sub-10pt = instant credibility loss | LOW | Already enforced in design-system.ts (minBodySize: 9, recommend targeting 11pt for body). |
| White space / breathing room between sections | Dense text = cheap AI-generated feel. Every professional consulting report uses generous margins | LOW | Already coded (sectionGap: 20, subsectionGap: 12). Must not be compressed during redesign. |
| Footer on every page with page numbers | Signals professional document, orients reader in multi-page reports | LOW | Already implemented in addFootersToAllPages(). Keep. |
| Personalized data, not generic placeholders | Report must reflect the reader's name, revenue tier, and business context — not "Business Owner" and "$195,000" defaults | MEDIUM | Current V2 already uses leadData. Redesign must continue personalization. Critical — 54% of buyers don't trust non-personalized content. |
| At least one CTA (clickable URL) | Readers expect a "what do I do next" moment. Missing CTA = wasted funnel asset | LOW | Already implemented as a clickable button + URL in renderCTABlock(). Must remain and be strengthened. |
| Financial ROI data (personalized numbers) | The promise of the report is "here's what you're losing." Readers expect real numbers, not generic estimates | MEDIUM | Already in page 1. Must stay prominent. The $195K default for unknown revenue is acceptable but real calculated values are strongly preferred. |
| Logical reading order matching emotional arc | Pain first, education second, action items third, CTA last. Non-linear structure confuses and loses readers | LOW | Currently: summary/ROI → task list → CTA. Redesign should tighten this to pain → education → overwhelm → CTA. |

### Differentiators (Competitive Advantage)

Features that set this report apart. Not expected by default, but create "wow" reactions and increase conversion.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Named framework education (Three Pillars / Core Four) | Frameworks make the report feel like a consulting deliverable, not a task list. They position Assistant Launch as a thought leader with a proprietary methodology. Most lead magnets are generic listicles — a named framework is rare and memorable. | MEDIUM | Static content — same for all readers. Design as two-column or boxed layout on page 2. jsPDF supports colored boxes via roundedRect(). |
| Visual ownership area boxes (Core Four) | Grouping tasks into Email / Calendar / Personal Life / Processes with distinct visual containers teaches AND overwhelms simultaneously. Readers see the breadth visually, not just as a wall of text. | MEDIUM | Each Core Four area should have a colored header box (use accentLight fill + accent text). Four boxes side-by-side or in 2x2 grid is achievable in jsPDF. |
| Deliberately overwhelming task volume | The emotional goal is "I can't do all of this alone." This requires density — not 5 tasks per category but 15-25 tasks total across 4 areas. Most lead magnets trim content; this report deliberately maximizes it. | HIGH | Current design shows only 5 tasks per daily/weekly/monthly bucket. Redesign must surface ALL personalized tasks, not truncate. jsPDF dynamic page height handles this. |
| Rich task descriptions (not just titles) | Short task titles are easy to dismiss. Detailed descriptions ("Your EA monitors all incoming email via the Email GPS system, triaging into 7 folders so you only review 5 items at your daily standup") make each task feel real and specific. | HIGH | Currently the description field exists in PDFTask. AI prompt redesign needed to generate genuinely specific descriptions using form data + website scraping. |
| Visual differentiation between Core Four areas | Subtle color differentiation (e.g., Email = teal accent, Calendar = gold accent, Personal Life = green, Processes = navy) creates visual separation and makes the overwhelm more scannable. | MEDIUM | jsPDF supports different fill colors per section. Requires defining a 4-color variant system on top of the existing design tokens. |
| Framework name badge or icon per section header | A small icon or badge beside each Core Four header (e.g., "EMAIL OWNERSHIP" with a small colored pill) elevates the report from a task list to a branded framework document. | LOW-MEDIUM | jsPDF supports circles (doc.circle()) and filled pills (roundedRect()). No SVG icon support without rasterizing — use text symbols or colored shapes. |
| Pre-filled CTA booking link (with user's name, email, phone) | Clickable button that opens the scheduling page with user data pre-filled eliminates friction at the conversion moment. Reduces the "I'll do this later" response. | LOW | Already implemented in buildBookingUrl(). Maintains competitive edge. |
| Urgency framing in CTA copy | CTAs that reference the financial pain just shown ("You've just seen how $162,000 walks out the door each year — here's how to stop it") convert better than generic "Book a Call." | LOW | Copy change only. No code change. |
| Section intro copy connecting education to action | A 2-3 sentence paragraph at the start of each Core Four section that says "Here's what your EA would own in this area for [BusinessType]" personalizes the transition from framework education to task list. | MEDIUM | Requires AI prompt to generate these intro sentences. jsPDF renders them as renderAnalysisBlock() style content. |
| Visual progress indicators across pages | Page X of Y or section titles in running headers help readers know they're in a structured document, not a random wall of content. | LOW | Add section label (e.g., "CORE FOUR: EMAIL OWNERSHIP") to page header on task pages. jsPDF supports header text per page. |

### Anti-Features (Deliberately NOT Include)

Features to explicitly avoid — either they degrade quality, signal cheapness, or undermine the funnel goal.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Generic AI-generated filler prose | Phrases like "In today's fast-paced business environment..." signal AI slop immediately. 54% of buyers distrust low-quality content. | Write framework content (Three Pillars, Core Four) once by hand (Ryan's own methodology). AI generates task descriptions only, not framework copy. |
| Task titles without context or detail | "Email management" as a task title says nothing. It reads like a lazy list, not a consulting deliverable. | Every task must have a rich description explaining *how* the EA does this, using the specific systems (Email GPS, camcorder method, Partnership Playbook) by name. |
| Frequency-based organization (daily/weekly/monthly) | Organizing by frequency teaches readers about task cadence, not about EA ownership. It makes the report feel like a to-do app, not a strategic consulting document. | Organize by Core Four ownership areas. Frequency is a secondary attribute, not the organizing principle. |
| Showing only 5 tasks per category | Capping at 5 undermines the "overwhelm" goal. 5 tasks = "I could figure this out myself." 25 tasks = "I genuinely cannot do this alone." | Show all AI-generated tasks. Let the volume be the message. Paginate across multiple pages if needed. |
| Founder tasks / "delegation frees you up to" pages | These pages dilute the overwhelm moment by pivoting to positivity too early. They also expand page count without adding to the sales argument. The current V2 has these; they should be removed. | Let the overwhelm pages do the work. The CTA is where the positive transformation happens. |
| Images, stock photography, or decorative graphics | jsPDF supports addImage() but base64 encoding large images bloats file size and increases generation time in serverless functions. Stock photos also signal generic, not premium. | Use colored geometric shapes, filled boxes, and typography to create visual interest. Zero images. |
| Password protection or form fields inside PDF | Not supported in jsPDF without additional libraries. Forms inside lead magnet PDFs also friction-add without value. | The booking CTA link is the only interactive element needed. |
| Table of contents | Appropriate for 20+ page documents. For a 5-7 page lead magnet, a TOC adds length and formality that slows momentum toward the CTA. | Let section headers on each page serve as navigation. |
| Long-form introduction / welcome page | "Hello, I'm Ryan and I want to help you..." delays the reader from seeing the financial pain hook. Every second before the hook is a second they might close the PDF. | Jump straight to the ROI data on page 1. The "Prepared for [Name]" header provides enough orientation. |
| Excessive legal disclaimers or fine print | Disclaimer language destroys the high-value consulting feel and plants doubt. | One subtle footer note maximum ("ROI projections based on industry benchmarks") is sufficient. |
| Purple color (#6F00FF) | Already called out in PDF_DESIGN_RULES. Not in the brand palette. | Stick to navy / gold / teal / green / red (cost only) palette. |

---

## Feature Dependencies

```
[Personalized ROI data on page 1]
    └──requires──> [Revenue range from form data]
                       └──enhances──> [Task hours from ROI calculator]

[Core Four visual boxes on page 2]
    └──requires──> [Framework copy (static, pre-written)]
    └──enhances──> [Colored section headers per ownership area]

[Overwhelming task list (pages 3+)]
    └──requires──> [AI prompt redesign: Core Four organization instead of daily/weekly/monthly]
    └──requires──> [Fallback content: universal EA examples per Core Four area]
    └──enhances──> [Rich task descriptions with system names]
    └──enhances──> [Section intro copy (personalized per business type)]

[CTA with pre-filled booking link]
    └──requires──> [User data passed to layout-v2.ts buildBookingUrl()]
    └──enhances──> [Urgency copy referencing financial pain shown on page 1]

[Visual differentiation between Core Four areas]
    └──enhances──> [Core Four visual boxes]
    └──enhances──> [Task list section headers]

[Section intro copy]
    └──requires──> [AI prompt redesign]
    └──requires──> [businessType field from form data]
```

### Dependency Notes

- **Task list requires AI prompt redesign:** Current AI generates daily/weekly/monthly tasks. Redesign must generate by Core Four area. This is a blocking dependency for all task list changes.
- **Fallback content is an independent parallel feature:** Can be built as static arrays without AI. Should be built first as a safety net.
- **Framework copy (Three Pillars + Core Four) is fully static:** No AI, no personalization. Write once, ship in code. This is the lowest-risk, highest-value page to build first.
- **Rich task descriptions depend on AI prompt quality:** The AI must receive businessType and website scraping data to generate specific descriptions. Thin form data = thin descriptions. Fallback content handles the worst case.

---

## MVP Definition

### Launch With (v1 — this milestone)

The minimum that makes the redesign meaningful and the emotional arc work.

- [ ] Page 1: ROI / pain data (refine existing) — keep current structure, ensure real calculated values when available
- [ ] Page 2: Three Pillars + Core Four framework page with visual boxes — static content, biggest credibility upgrade
- [ ] Pages 3+: Task list organized by Core Four areas (not daily/weekly/monthly) — volume is the message
- [ ] Final page: Strong CTA with urgency copy and pre-filled booking link
- [ ] Remove founder tasks / "delegation frees you up to" pages — they dilute the overwhelm
- [ ] AI prompt redesign to generate Core Four-organized tasks with rich descriptions

### Add After Validation (v1.x)

- [ ] Visual color differentiation between Core Four sections (4-color variant system) — adds polish but not blocking
- [ ] Section intro copy per Core Four area (personalized per business type) — adds personalization layer
- [ ] Framework name badges / pill labels on section headers

### Future Consideration (v2+)

- [ ] Dynamic cover page with business type and website-scraped company name prominently featured
- [ ] Confidence scoring: show which tasks are "highly likely for your business" vs "common for most founders"
- [ ] Multi-language support

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Core Four framework page (visual boxes) | HIGH | LOW | P1 |
| AI prompt redesign → Core Four organized tasks | HIGH | MEDIUM | P1 |
| Remove frequency-based organization | HIGH | LOW | P1 |
| Show full task volume (not capped at 5) | HIGH | LOW | P1 |
| Rich task descriptions (not just titles) | HIGH | MEDIUM | P1 |
| Remove founder tasks pages | HIGH (negative complexity) | LOW | P1 |
| Urgency CTA copy | HIGH | LOW | P1 |
| Fallback content for thin form data | MEDIUM | MEDIUM | P2 |
| Section intro copy per Core Four area | MEDIUM | MEDIUM | P2 |
| Color differentiation between Core Four areas | MEDIUM | LOW | P2 |
| Section progress labels in page headers | LOW | LOW | P3 |
| Framework badge/pill labels | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch — redesign is incomplete without these
- P2: Should have, adds meaningful quality — add when P1 is done
- P3: Nice to have — only if time permits

---

## Competitor / Reference Analysis

| Pattern | What Competing Reports Do | What We Should Do |
|---------|--------------------------|-------------------|
| Content organization | Most use frequency (daily/weekly) or generic categories | Core Four ownership areas — distinctive, teaches the framework |
| Task volume | Most show 5-10 tasks to avoid overwhelming | Deliberately overwhelming volume — 25-40 tasks total across 4 areas |
| Framework education | Rare — most lead magnets are generic checklists | Named Three Pillars + Core Four framework makes us a thought leader |
| Personalization | Name and maybe industry | Name + revenue + business type + website-scraped context in task descriptions |
| CTA placement | Final page only | Final page as primary, but section-level CTAs on task pages (if space) |
| CTA language | "Schedule a consultation" (generic) | "Book Your Time Audit" + financial urgency reference |
| Visual design | Either over-designed (templates) or plain (DIY) | Clean, minimal, brand-consistent — consulting deliverable aesthetic |

---

## jsPDF-Specific Design Constraints and Patterns

This section is specific to jsPDF generation (not HTML-to-PDF). These constraints directly affect which design features are achievable.

### What jsPDF Can Do (Use These)

- **Filled colored rectangles with rounded corners:** `doc.roundedRect(x, y, w, h, rx, ry, 'F')` — use for Core Four ownership area boxes, section headers, CTA blocks, metric cards
- **Circles:** `doc.circle(x, y, r, 'F')` — use for numbered bullet markers, icon-like decorative elements
- **Colored text:** `doc.setTextColor(r, g, b)` — use to create visual hierarchy within text-only sections
- **Multiple text weights:** `doc.setFont('helvetica', 'bold')` / `'normal'` — the only reliable font variation in jsPDF without custom font loading
- **Line drawing:** `doc.line(x1, y1, x2, y2)` — use for dividers, accent bars (left accent bar pattern in renderAnalysisBlock)
- **Clickable links:** `doc.link(x, y, w, h, { url: '...' })` — use for CTA button and URL text
- **Text wrapping:** `doc.splitTextToSize(text, maxWidth)` — use for all description text
- **Multi-page with add page:** `doc.addPage()` — use for Core Four area pages
- **Page count + set page:** `doc.getNumberOfPages()` / `doc.setPage(i)` — use for footers and section headers

### What jsPDF Cannot Do (Avoid Designing For These)

- **Page background color:** Always white. Do not design expecting colored page backgrounds. Use large colored rectangles at y=0 as a workaround for section header areas, but this is hacky.
- **Custom web fonts:** Only helvetica (normal/bold/italic) reliably available without embedding custom fonts as base64. Do NOT design for DM Serif or DM Sans — the font will fallback to helvetica in production.
- **CSS border-radius on text boxes:** Must use roundedRect() explicitly. CSS styling does not transfer.
- **SVG icons:** Not supported. Use colored circles, rectangles, and text characters as pseudo-icons.
- **Dashed or dotted borders:** Not supported. Use solid lines only.
- **Background images:** Avoid. Base64 encoding large images bloats file size and risks Vercel 30s timeout.
- **Gradients:** Not supported in basic jsPDF without plugins.
- **Table of contents with anchor links:** Internal PDF links require complex annotation API. Not worth implementing for this use case.

### Design Patterns That Work Well in jsPDF

**Pattern 1: Colored Header Box per Section**
Use a filled roundedRect() with accentLight fill, then text in accent color for the section title. Already used in renderFounderTasksSection(). Apply this to Core Four area headers.

**Pattern 2: Left Accent Bar**
A 1.5mm wide filled rectangle on the left edge of a block. Already implemented in renderAnalysisBlock(). Use for callout sections, framework descriptions, key insights.

**Pattern 3: Metric Cards Row**
Three equal-width boxes with a value + label. Already implemented in renderMetricsRow(). Adapt for Core Four area icons (use initials or symbols in boxes instead of metrics).

**Pattern 4: Numbered Circle Bullets**
`doc.circle()` + centered number text. Already in renderTaskCard(). Extend to all task areas.

**Pattern 5: Full-Width Banner**
`doc.rect(0, 0, PAGE_WIDTH, height, 'F')` with background fill to create page-spanning header. Used in buildFounderTasksPage(). Can be used for Three Pillars / Core Four page header.

---

## Emotional Arc — Design Implementation Notes

The emotional arc is: **pain → education → overwhelm → solution**

Each stage must be a distinct visual section. Here is how to implement the arc in jsPDF:

| Stage | Page | Visual Signal | Content |
|-------|------|---------------|---------|
| **Pain** | Page 1 | Large hero number ($162,000 annual loss), 3 metric cards, ROI breakdown table | "Here is what you are losing. Here are the numbers." |
| **Education** | Page 2 | Two-column framework layout with Three Pillars + Core Four visual boxes | "Here is why most EA relationships fail and what it actually takes to succeed." |
| **Overwhelm** | Pages 3-5+ | Dense task lists grouped by Core Four area, numbered tasks, rich descriptions | "Here is everything your EA would own in your specific business. All of it." |
| **Solution** | Final page | Full-width CTA block with urgency copy, pre-filled booking button, URL | "You have seen the problem. You have seen the solution. Here is the one step to take." |

**Critical design principle:** The education page (page 2) must not feel like a detour from the pain. It must feel like a direct answer to "why isn't my current approach working?" The Three Pillars (Right Person, Right Process, Right Support) are the answer to why a founder's previous EA attempts may have failed — this is empathetic education, not generic filler.

**Critical design principle:** The overwhelm section (pages 3+) must visually signal volume. The reader must think "I cannot even scroll past this." Headers per Core Four area, numbered tasks starting at 1 for each area, rich multi-line descriptions — all contribute to the sense that this is too much for any founder to manage alone.

---

## Sources

- Sublyme Digital — PDF Farming for High-Converting Lead Magnets 2025: https://sublymedigital.com/pdf-farming-high-converting-lead-magnets-2025/ [MEDIUM confidence — practical but single source]
- Productive and Free — 9 Tips to Design a Lead Magnet: https://www.productiveandfree.com/blog/lead-magnet-design [MEDIUM confidence]
- Natsu Nishizumi — How to Design a Lead Magnet PDF eBook That Converts: https://www.natsuminishizumi.com/blog/lead-magnet-pdf-ebook [MEDIUM confidence]
- BusySeed — Lead Magnets That Convert in 2025: https://www.busyseed.com/lead-magnets-that-convert-in-2025whats-actually-working-and-why-yours-might-be-failing [MEDIUM confidence]
- Magnetly — PDF vs Interactive Lead Magnets: https://www.magnetly.co/blog/pdf-vs-interactive-lead-magnets [MEDIUM confidence]
- Chris Koehl — 10 Powerful Lead Magnet CTA Examples: https://chriskoehl.com/lead-magnet-cta-examples/ [MEDIUM confidence]
- Netwave Interactive — CTA Placement and Design Tips: https://www.netwaveinteractive.com/blog/blog/call-to-action-cta-placement-and-design-tips-boost-conversions-like-a-pro/ [MEDIUM confidence]
- Ian Brodie — Lead Magnets That Convert: https://www.ianbrodie.com/lead-magnets-that-convert/ (404 at fetch time, cited from search summary) [LOW confidence]
- jsPDF GitHub Issues — Capability/Limitation references: https://github.com/parallax/jsPDF/issues/876 (border-radius), https://github.com/parallax/jsPDF/issues/3864 (page background), https://github.com/parallax/jsPDF/issues/1284 (images) [HIGH confidence — official repo]
- Amra and Elma — Lead Magnet Conversion Statistics 2025: https://www.amraandelma.com/lead-magnet-conversion-statistics/ [MEDIUM confidence]
- Existing codebase: /Users/ryanbrazzell/boundless-os-template-2/web/src/lib/pdf/layout-v2.ts, design-system.ts, generator-v2.ts [HIGH confidence — source of truth for current implementation]

---
*Feature research for: EA Time Freedom Report PDF Redesign*
*Researched: 2026-02-23*
