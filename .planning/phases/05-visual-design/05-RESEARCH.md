# Phase 5: PDF Visual Design - Research

**Researched:** 2026-02-24
**Domain:** jsPDF visual design refinement through adversarial multi-perspective process; color theory, emotional design, and typographic treatment within programmatic PDF constraints
**Confidence:** HIGH

## Summary

Phase 5 is fundamentally different from Phases 1-4. It is not a code-building phase -- it is a **design decision-making process** followed by a targeted code modification phase. The user explicitly requested an adversarial multi-perspective process where design agents with different value systems (marketing impact, visual simplicity, information density/complexity) argue about the best design decisions for this specific use case. The output of the adversarial process is a set of finalized visual decisions. The output of the implementation is those decisions applied to the existing page builders in `layout-v2.ts`.

By the time Phase 5 runs, all pages exist: cover/ROI (Phase 2), framework (Phase 2), task pages (Phase 3), and CTA (Phase 3). The color system is RGB tuples in the `C` constant object (Phase 1). Core Four accent colors exist as placeholders (blue, purple, amber, green). The adversarial process evaluates and potentially revises these placeholders plus all other visual treatments: spacing, font sizes, accent bar widths, box styles, section header treatments, and the emotional tone progression across pages.

The technical constraint is absolute: jsPDF has no CSS, no HTML, no gradients, no custom fonts, no SVG icons. Every visual effect must be achievable with `doc.rect()`, `doc.roundedRect()`, `doc.circle()`, `doc.line()`, `doc.text()`, `doc.setFillColor()`, `doc.setTextColor()`, `doc.setDrawColor()`, `doc.setFontSize()`, and `doc.setFont('helvetica', 'normal'|'bold'|'italic')`. This constraint eliminates many design options but also focuses the process on what actually matters in a programmatic PDF: color, spacing, typography weight, and geometric shape treatment.

**Primary recommendation:** Split into two plans: (1) Execute the adversarial design process as a structured debate with three named perspectives, producing a DESIGN-DECISIONS.md artifact that documents the winning choices with rationale, and (2) Apply the finalized design decisions to all page builders in `layout-v2.ts` by modifying the `C` color constants, font size selections, spacing values, and component renderer implementations.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | (existing in project) | All PDF rendering -- the only rendering engine available | Already in use; all visual changes are parameter changes to existing jsPDF calls |
| TypeScript | (existing in project) | Type-safe color constants, layout parameters | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| layout-v2.ts | N/A (internal) | Contains all page builders and the C color constant object | PRIMARY modification target for applying design decisions |
| design-system.ts | N/A (internal) | V1-era design tokens -- reference for brand consistency | Reference only; not modified in Phase 5 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Modifying C constants directly in layout-v2.ts | Extracting all design tokens to a separate design-tokens.ts file | Extraction adds a file and import overhead; the C object is already centralized and easy to find. Not worth the indirection for this scope. |
| Helvetica only (jsPDF default) | Embedding a custom font as base64 | Custom fonts massively increase PDF file size (200-400KB per font weight), risk Vercel 30s timeout, and require font file licensing. Helvetica is a professional sans-serif that works well. Not worth the cost. |
| Flat color fills only | Simulating gradients with multiple thin rectangles | Gradient simulation adds rendering complexity, increases generation time, and the visual result is poor quality at PDF zoom levels. Flat fills with intentional color choices are cleaner. |

**Installation:**
```bash
# No new packages needed -- all work modifies existing rendering parameters
```

## Architecture Patterns

### Recommended Project Structure
```
.planning/phases/05-visual-design/
├── 05-RESEARCH.md                 # This document
├── 05-01-PLAN.md                  # Adversarial design process -> DESIGN-DECISIONS.md
└── 05-02-PLAN.md                  # Apply design decisions to layout-v2.ts

web/src/lib/pdf/
├── layout-v2.ts                   # PRIMARY target -- C constants + page builder visual params
├── generator-v2.ts                # Untouched (data layer, no visual concerns)
├── design-system.ts               # Reference only
└── ...
```

### Pattern 1: Adversarial Multi-Perspective Design Process
**What:** Three named design perspectives each advocate for their values, evaluate the current design state, propose specific modifications, and argue against competing proposals. A synthesis step selects the best elements from each perspective for this specific use case.
**When to use:** Phase 5 Plan 01 -- the design decision-making phase.
**Structure:**

The three perspectives are:

**Perspective A: Marketing Impact Advocate**
- Values: conversion, emotional manipulation, urgency, visual hierarchy that drives the eye to CTAs, color psychology for trust and action
- Optimizes for: "Does this design make the reader more likely to book the Time Audit call?"
- Tends to push for: bolder colors, larger CTAs, more visual contrast, urgency signals, social proof indicators

**Perspective B: Visual Simplicity Advocate**
- Values: white space, restraint, readability, professional minimalism, "less is more" aesthetic
- Optimizes for: "Does this design feel like a premium consulting deliverable?"
- Tends to push for: fewer colors, more white space, cleaner typography, removing decorative elements, tighter color palette

**Perspective C: Information Density Advocate**
- Values: scanability, visual structure, information hierarchy, pattern recognition, data visualization
- Optimizes for: "Can the reader absorb the maximum information with minimum cognitive load?"
- Tends to push for: structured grids, consistent visual rhythms, color-coding for categories, clear section delineation, numbered/badged elements

**Process flow:**
1. Each perspective evaluates the current design state (all pages as built by Phases 2-3)
2. Each perspective proposes specific modifications to: color palette, spacing, typography, section treatments, emotional tone per page
3. Perspectives critique each other's proposals (adversarial argumentation)
4. Synthesis: for each design dimension, select the winning approach with documented rationale
5. Output: DESIGN-DECISIONS.md with final values

### Pattern 2: Design Decision as Code Change Mapping
**What:** Every design decision maps to a specific code change in layout-v2.ts -- a color constant value, a font size, a spacing value, or a rendering parameter.
**When to use:** Phase 5 Plan 02 -- implementing the design decisions.
**Example:**

```
Decision: "Core Four accent colors should be muted professional tones, not bright saturated primaries"
→ Code change: Update C.emailAccent, C.calendarAccent, C.personalAccent, C.businessAccent values

Decision: "Task page section headers should use a full-width colored bar with white text"
→ Code change: Modify renderCoreFourSection() header rendering -- change fill color, text color, bar height

Decision: "CTA button should be gold (#f59e0b) to match the web brand, not teal"
→ Code change: Update the renderCTABlock() button fill color from C.accent to C.ctaBg (and update C.ctaBg value)
```

### Pattern 3: Emotional Tone Progression via Visual Treatment
**What:** Each PDF section gets a distinct visual treatment that reinforces its emotional purpose. These are not arbitrary -- they map to the pain -> education -> overwhelm -> solution arc.
**When to use:** When evaluating and finalizing design choices for each page type.
**Mapping:**

| Page | Emotional Goal | Visual Treatment Direction |
|------|---------------|--------------------------|
| Cover/ROI (Page 1) | Urgency, financial pain | High contrast, large numbers, cost-associated colors (red for money lost), professional authority signals |
| Framework (Page 2) | Trust, education, credibility | Clean structure, balanced layout, calming colors, consultant-grade aesthetic |
| Task Pages (Pages 3+) | Overwhelm, volume, "I can't do this alone" | Dense but scannable, strong section color-coding, numbered tasks creating visual volume, minimal white space between tasks |
| CTA (Final Page) | Clarity, relief, action | Open white space (contrast to dense task pages), single focal point (the button), warm/inviting colors |

### Anti-Patterns to Avoid
- **Changing layout structure or content:** Phase 5 modifies visual treatment only -- colors, spacing, typography, section styling. It does NOT add pages, change content, reorder sections, or modify data flow.
- **Making the PDF look like a website:** PDFs are read differently than web pages. Avoid design decisions that assume scrolling, hover states, or interactive behavior.
- **Ignoring the jsPDF constraint during design proposals:** Every proposed visual must be achievable with rectangles, circles, lines, and text. No gradients, no shadows, no transparency, no custom fonts, no images.
- **Over-designing static pages at the expense of task pages:** The task pages are the conversion mechanism. The framework page is educational. The design process should allocate proportional attention to the pages that matter most for conversion.
- **Using colors outside the brand palette without justification:** The brand is Navy (#0f172a), Gold (#f59e0b), Green (#10b981), Teal (#0D7377). Introducing new colors needs explicit rationale.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color palette generation | Manual hex picking for Core Four accents | Start from the brand palette (navy, gold, green, teal) and derive accent variants | Ensures brand consistency; the accents should feel related to the primary palette |
| Typography hierarchy | Inventing new font sizes | Use the existing size hierarchy already established in layout-v2.ts (26, 22, 18, 14, 13, 12, 11, 10, 9 pt) | Consistency; any new size should only be introduced if none of the existing sizes work |
| Section emotional treatment | Designing each page in isolation | Design the progression as a sequence where each page's visual weight is relative to the others | The emotional arc only works if the pages feel like a deliberate progression, not independent designs |
| Design mockups | Attempting pixel-perfect visual mockups | Describe design decisions as parameter values (RGB tuples, mm measurements, pt sizes) that map directly to jsPDF calls | There is no design tool that renders jsPDF output. The code IS the mockup. |

**Key insight:** In a jsPDF-based PDF, "design" means choosing specific numeric values for a constrained set of rendering parameters. The adversarial process is not about creating visual mockups -- it is about arguing over the right values for color fills, font sizes, spacing, and geometric element dimensions, with each perspective advocating from their value system.

## Common Pitfalls

### Pitfall 1: Design Process Produces Unbuildable Proposals
**What goes wrong:** The adversarial perspectives propose visual effects (gradients, shadows, transparency, complex shapes, custom fonts) that jsPDF cannot render.
**Why it happens:** Treating the design process as if it were CSS/HTML design rather than programmatic PDF design.
**How to avoid:** Every design proposal must be tagged with its jsPDF implementation method. If a proposal cannot name the specific `doc.xxx()` call that renders it, it is invalid. The process facilitator must reject proposals that violate jsPDF constraints immediately rather than debating them.
**Warning signs:** Proposals that use words like "gradient", "shadow", "opacity", "blur", "custom font", "SVG icon", or "background image" without specifying a jsPDF workaround.

### Pitfall 2: Core Four Accent Colors That Lack Sufficient Contrast
**What goes wrong:** The four accent colors are too similar to each other, or too close to the background/text colors, making Core Four sections visually indistinguishable.
**Why it happens:** Choosing colors from the same hue family, or choosing pastel variants that are too washed out on white backgrounds.
**How to avoid:** Each Core Four accent must be distinguishable at three levels: (a) the header bar fill, (b) a light background tint for task cards in that section, and (c) the accent text color for labels. Test: if the PDF is printed in grayscale, the four sections should still have distinguishable tonal weight. The colors should span different hue positions (not four shades of blue).
**Warning signs:** Two Core Four sections that look identical when quickly scanning the PDF; accent colors that disappear against the white page background.

### Pitfall 3: Design Changes That Break the Y-Budget
**What goes wrong:** Increasing font sizes, adding spacing, or adding new visual elements (divider bars, badges, etc.) pushes page content past the safe bottom boundary (y=270mm), causing overflow.
**Why it happens:** Design changes are applied without recalculating the vertical space budget per page. The framework page (Phase 2) was carefully measured to fit Three Pillars + Core Four in 250mm of usable space. Increasing spacing or font sizes on that page could push content past the boundary.
**How to avoid:** After applying any spacing or font size change, recalculate the Y-budget for the affected page. The framework page has the tightest budget (~21mm buffer in stacked layout, ~65mm in 2x2 grid). Task pages use checkPageBreak so they are safe. Cover page has ~25mm buffer. CTA page is simple and safe.
**Warning signs:** Content disappearing from the bottom of the framework page after design changes; checkPageBreak triggering unexpectedly on a page that previously fit.

### Pitfall 4: Emotional Tone Progression Not Executed in Code
**What goes wrong:** The design decisions document describes distinct emotional tones per section, but the implementation applies the same visual treatment everywhere -- same spacing, same accent color usage, same text weight patterns.
**Why it happens:** The implementer modifies global values (C constants, font sizes) without also modifying per-page rendering logic where the emotional differentiation happens.
**How to avoid:** Map each emotional tone decision to specific per-page rendering parameters. "Task pages should feel denser" means reducing spacing values ONLY in the task page section renderer, not globally. "CTA page should feel open" means increasing spacing ONLY in the CTA page builder. Document the per-page parameter differences explicitly in the design decisions.
**Warning signs:** All pages look the same after design changes; the emotional arc feels flat.

### Pitfall 5: Adversarial Process Devolves Into Endless Debate
**What goes wrong:** The three perspectives argue indefinitely without converging on decisions, producing no actionable output.
**Why it happens:** No structured decision framework, no forced convergence mechanism, no time-boxed rounds.
**How to avoid:** Structure the process with explicit rounds: (1) each perspective proposes, (2) each perspective critiques, (3) synthesis selects winners with documented rationale. Use a decision matrix for each design dimension with clear criteria. The synthesis step has final authority -- it is not consensus-seeking but evidence-weighing.
**Warning signs:** The process produces more questions than answers; decisions are deferred "for further discussion"; the output lacks specific numeric values.

### Pitfall 6: Ignoring the PDF's Primary Purpose (Conversion)
**What goes wrong:** The design process optimizes for aesthetic beauty or information clarity at the expense of conversion effectiveness.
**Why it happens:** The simplicity and complexity advocates push their values too hard without grounding in the business goal.
**How to avoid:** Every design decision should be evaluated against the primary question: "Does this make the reader more likely to book a Time Audit call?" The marketing impact advocate's perspective carries tiebreaker weight on decisions where the other two perspectives are evenly matched. The emotional arc (pain -> education -> overwhelm -> solution) is the conversion mechanism -- design choices that weaken any stage of this arc should be rejected.
**Warning signs:** A design that looks beautiful but fails to create urgency on page 1, overwhelm on task pages, or action clarity on the CTA page.

## Code Examples

Verified patterns from the existing codebase that Phase 5 will modify:

### Current C Color Constants (modification targets)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts (after Phase 1 migration)
// These are the placeholder Core Four accent colors to be finalized:
export const C = {
  // Core design system (may be refined)
  white:        [255, 255, 255] as const satisfies RGB,
  ink:          [17, 24, 39]    as const satisfies RGB,  // #111827
  inkSecondary: [75, 85, 99]    as const satisfies RGB,  // #4B5563
  inkMuted:     [156, 163, 175] as const satisfies RGB,  // #9CA3AF
  accent:       [13, 115, 119]  as const satisfies RGB,  // #0D7377 (Teal)
  accentLight:  [230, 244, 244] as const satisfies RGB,  // #E6F4F4
  divider:      [229, 231, 235] as const satisfies RGB,  // #E5E7EB
  background:   [249, 250, 251] as const satisfies RGB,  // #F9FAFB

  // Core Four area accents (PLACEHOLDER — Phase 5 finalizes these)
  emailAccent:    [59, 130, 246]  as const satisfies RGB,  // Blue #3B82F6
  calendarAccent: [168, 85, 247]  as const satisfies RGB,  // Purple #A855F7
  personalAccent: [234, 179, 8]   as const satisfies RGB,  // Amber #EAB308
  businessAccent: [34, 197, 94]   as const satisfies RGB,  // Green #22C55E

  // CTA
  ctaBg:   [13, 115, 119]  as const satisfies RGB,  // Teal
  ctaText: [255, 255, 255] as const satisfies RGB,  // White
} as const;
```

### Brand Palette (from web UI - design constraint)
```css
/* Source: web/src/app/globals.css lines 15-18 */
--primary: #0f172a;           /* Navy - CTAs, header, footer, brand elements */
--progress: #f59e0b;          /* Gold - continue buttons */
--accent-green: #10b981;      /* Green - success states */
/* Also in design-system.ts: */
costRed: '#dc2626',           /* Red-600 - cost/expense indicators */
```

### Current Font Size Hierarchy (established in layout-v2.ts)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts -- actual font sizes used across all renderers
// These sizes form the established hierarchy that Phase 5 should respect:

// 56pt - Hero metric (annual value dollar amount) -- renderHeroMetric
// 26pt - Page title ("Time Freedom Report") -- renderHeader
// 24pt - Section title (founder tasks page header) -- buildFounderTasksPage
// 22pt - Section title ("Next Steps", task frequency headers) -- renderSectionTitle
// 18pt - Client name, CTA title ("Ready to Get Started?") -- renderClientBlock, renderCTABlock
// 14pt - Net return value, founder task number badge -- renderInvestmentBlock, buildFounderTasksPage
// 13pt - Task card name -- renderTaskCard
// 12pt - Section header text, ROI badge text -- renderFounderTasksSection, renderInvestmentBlock
// 11pt - Body text, analysis block, CTA button -- renderAnalysisBlock, renderCTABlock
// 10pt - Description text, brand name -- renderTaskCard, renderHeader
// 9pt  - Captions, time saved, URL, footer, labels -- renderTaskCard, renderCTABlock, renderFooter
// 8pt  - ROI badge text -- renderInvestmentBlock
```

### Existing Spacing Values (Phase 5 may adjust)
```typescript
// Source: extracted from layout-v2.ts component renderers
// These are the spacing values baked into the current design:

PAGE_WIDTH = 210    // A4 width mm
PAGE_HEIGHT = 297   // A4 height mm
MARGIN = 20         // Left/right margin mm
CONTENT_WIDTH = 170 // Usable width mm

// Component spacing (from individual renderers):
// Header to client block gap: 3mm
// Client block to hero metric gap: 8mm
// Hero metric to metrics row gap: 8mm
// Metrics row to analysis block gap: 5mm
// Analysis block to investment block gap: 3mm
// Task card bottom divider + gap: 6mm
// Section header to first task: 5mm
// CTA block height: 45mm
// Footer divider to bottom: 15mm
```

### How Core Four Section Headers Are Rendered (Phase 3, to be styled)
```typescript
// Source: Phase 3 research -- proposed pattern for renderCoreFourSection
// This is the section header that Phase 5 will style:
function renderCoreFourSection(
  doc: jsPDF,
  group: CoreFourTaskGroup,
  startingTaskNumber: number,
  y: number,
): number {
  const headerHeight = 14;
  y = checkPageBreak(doc, y, headerHeight + 40);
  doc.setFillColor(...group.accent);           // ← Phase 5 decides these accent colors
  doc.rect(MARGIN, y, CONTENT_WIDTH, headerHeight, 'F');  // ← Phase 5 decides header style
  doc.setTextColor(...C.white);                // ← Phase 5 decides text treatment
  doc.setFontSize(14);                         // ← Phase 5 decides font size
  doc.setFont('helvetica', 'bold');
  doc.text(group.title, MARGIN + 6, y + 9);
  y += headerHeight + 6;
  // ... task cards follow
}
```

### How CTA Button Is Rendered (to be styled)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 556-570
// The CTA button styling that Phase 5 will finalize:
const btnWidth = 70;           // ← Phase 5 may adjust
const btnHeight = 13;          // ← Phase 5 may adjust
const btnX = (PAGE_WIDTH - btnWidth) / 2;
const btnY = y + 18;
doc.setFillColor(...C.accent);  // ← Phase 5 decides button color (teal? gold? navy?)
doc.roundedRect(btnX, btnY, btnWidth, btnHeight, 6, 'F');
doc.setTextColor(...C.white);
doc.setFontSize(11);            // ← Phase 5 may adjust
doc.setFont('helvetica', 'bold');
doc.text('Schedule Free Consultation', PAGE_WIDTH / 2, btnY + 8, { align: 'center' });
```

## Design Dimensions to Evaluate

The adversarial process must produce decisions for each of these dimensions:

### 1. Core Four Accent Color Palette
**Current placeholders:** Blue (#3B82F6), Purple (#A855F7), Amber (#EAB308), Green (#22C55E)
**Constraint:** Must be visually distinct from each other; must work as both fill colors (for headers) and text colors (for labels); must have a light variant derivable for background tints
**Brand context:** The web brand uses Navy (#0f172a), Gold (#f59e0b), Green (#10b981), Teal (#0D7377). The PDF V2 design system uses Teal as the primary accent.
**Key question:** Should the accents align with the web brand palette (navy, gold, green, teal derivatives) or use a broader spectrum (blue, purple, amber, green)?

### 2. CTA Button Color
**Current:** Teal (#0D7377) -- matches the V2 accent
**Options:** Teal (current), Gold (#f59e0b -- matches web brand CTAs), Navy (#0f172a -- matches web primary)
**Key question:** Which color drives the highest visual urgency and action likelihood in a PDF context?

### 3. Cover Page Emotional Treatment
**Current:** Clean minimal -- hero number, metrics row, analysis block, investment table
**Emotional goal:** Financial pain, urgency, "you're losing $X"
**Key question:** Should the cost figures use red (#dc2626) for emphasis? Should the hero metric be larger/bolder? How should the investment block signal urgency vs. opportunity?

### 4. Framework Page Visual Treatment
**Current (Phase 2):** Section titles, pillar items with number circles, Core Four boxes with accent left bars
**Emotional goal:** Trust, education, credibility, consultant-grade feel
**Key question:** How should the Three Pillars and Core Four boxes be styled to feel authoritative but not dense? Should they use color fills or just accent bars?

### 5. Task Page Density and Visual Rhythm
**Current (Phase 3):** Numbered task cards with circle markers, full-width accent header bars per section
**Emotional goal:** Overwhelm, volume, "I clearly can't do this alone"
**Key question:** How dense should task cards be? Should there be visible dividers between tasks? How thick/prominent should the section header bars be?

### 6. CTA Page Openness
**Current (Phase 3):** Full-page CTA with headline, value proposition, booking button
**Emotional goal:** Clarity, relief, single action point
**Key question:** How much white space surrounds the CTA? Should the button be centered or full-width? What visual weight should the value proposition text carry?

### 7. Typography Weight Distribution
**Current:** Bold for titles/names, normal for body, across all pages equally
**Key question:** Should task pages use lighter typography (thinner visual weight) to increase density feel? Should the CTA page use heavier typography for emphasis?

### 8. Footer and Running Header Treatment
**Current:** Simple footer on every page (divider line + brand text + "assistantlaunch.com")
**Key question:** Should task pages have running section headers ("CORE FOUR: EMAIL OWNERSHIP")? Should the footer be more/less prominent?

## jsPDF Visual Capabilities Reference

For the adversarial design process, these are ALL the visual tools available:

### Available Drawing Primitives
| Primitive | Method | Visual Effect |
|-----------|--------|---------------|
| Filled rectangle | `doc.rect(x, y, w, h, 'F')` | Solid color blocks, banners, backgrounds |
| Filled rounded rectangle | `doc.roundedRect(x, y, w, h, rx, ry, 'F')` | Cards, buttons, badges, boxes |
| Stroked rectangle | `doc.roundedRect(x, y, w, h, rx, ry, 'S')` | Outlined boxes, borders |
| Filled circle | `doc.circle(x, y, r, 'F')` | Bullet markers, number badges, decorative dots |
| Line | `doc.line(x1, y1, x2, y2)` | Dividers, accent bars, underlines |
| Text | `doc.text(string, x, y, options)` | All text content, centered/right-aligned |

### Available Typography
| Weight | Method | Use Case |
|--------|--------|----------|
| Normal | `doc.setFont('helvetica', 'normal')` | Body text, descriptions, captions |
| Bold | `doc.setFont('helvetica', 'bold')` | Titles, names, emphasis, CTAs |
| Italic | `doc.setFont('helvetica', 'italic')` | Quotes, annotations (use sparingly) |
| Bold Italic | `doc.setFont('helvetica', 'bolditalic')` | Available but rarely appropriate |

### NOT Available (Do Not Propose)
- Gradients
- Shadows / drop shadows
- Transparency / opacity
- Custom fonts (DM Sans, DM Serif, etc.)
- SVG icons
- Dashed or dotted lines
- Background images
- Text outlines / strokes
- Colored page backgrounds (page is always white)
- CSS-style borders
- Multi-column text flow (must be positioned manually)

## Emotional Design Patterns That Work in jsPDF

### Pattern: Financial Pain Through Color
Use `costRed` (#dc2626) for cost figures, "money lost" amounts, and negative financial indicators. Use the brand green (#10b981) for positive ROI figures and "money gained" amounts. This creates an immediate visceral association: red = bad (your current state), green = good (your state with an EA).

### Pattern: Authority Through Restraint
Limit the color palette on the framework page to 2-3 colors maximum (ink, accent, and one neutral). Dense educational content with minimal color signals "consulting firm" while excessive color signals "marketing brochure." The Three Pillars should feel like they came from a McKinsey deck, not a Canva template.

### Pattern: Overwhelm Through Density
On task pages, reduce vertical spacing between task cards to the minimum readable amount. Use continuous task numbering (1-40+) where the rising numbers themselves create anxiety. The section header bars serve as visual punctuation -- brief pauses before the next wave of tasks hits.

### Pattern: Relief Through Space
The CTA page should have dramatically more white space than the task pages that precede it. The visual contrast between a dense task page and a spacious CTA page creates a subconscious feeling of "relief" -- the reader's eye relaxes, and the single CTA button becomes the obvious focal point. This is the same principle as a retail store using dense shelf layouts leading to an open checkout area.

### Pattern: Brand Consistency Through Accent Repetition
The header accent line (teal), the task circle markers (teal), and the CTA button (teal or gold) create a visual thread that ties the document together. Even as section colors change for Core Four areas, the repeating brand accent keeps the document feeling unified.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single teal accent for everything | Placeholder Core Four accents (blue, purple, amber, green) | Phase 1 (planned) | Phase 5 finalizes these |
| Generic "Schedule Free Consultation" CTA | "Book Your Free Time Audit" with urgency copy | Phase 3 (planned) | Phase 5 styles the visual treatment |
| Same visual weight on all pages | Emotional arc progression (pain -> education -> overwhelm -> solution) | Planned in FEATURES.md | Phase 5 implements the visual differentiation |
| V1 Navy/Gold scheme | V2 Teal/Minimal scheme | Before this project | Phase 5 determines whether to bring back some navy/gold elements or stay fully teal |

**Key question for the adversarial process:** The V1 design system used Navy (#0f172a) as the primary with Gold (#f59e0b) as the accent -- this matches the web brand. The V2 design system switched to Teal (#0D7377) as the primary accent with a lighter, more minimal feel. Phase 5 must decide: does the PDF stay fully teal-accented (V2 direction), incorporate navy/gold from the web brand (V1 direction), or find a synthesis?

## Open Questions

1. **Should the design process produce a rendered PDF for evaluation, or only parameter values?**
   - What we know: jsPDF is the only way to see the actual visual output. There is no design tool that produces equivalent rendering. Parameter values (colors, sizes, spacing) are the most actionable output.
   - What's unclear: Whether the adversarial process should include a "render and evaluate" step where a test PDF is generated with proposed values and visually inspected.
   - Recommendation: The design process should produce specific parameter values. If time permits, a test render step adds value but is not blocking. The implementation plan (05-02) inherently includes a verification step where the PDF is rendered and inspected.

2. **How much should the PDF design align with the web brand vs. establish its own identity?**
   - What we know: The web brand is Navy/Gold/Green. The current V2 PDF uses Teal with minimal color. The PDF is received via email and opened in a PDF viewer -- it is never seen alongside the web page in the same viewport.
   - What's unclear: Whether brand consistency across web + PDF matters for conversion, or whether the PDF should optimize independently.
   - Recommendation: This is a core question for the adversarial process. The marketing advocate will likely push for brand alignment (builds trust if the reader visits the website). The simplicity advocate will push for the current teal-minimal approach. Let them argue.

3. **Should any Core Four accent colors map to the existing brand colors?**
   - What we know: The brand has Navy, Gold, Green, and Teal. There are four Core Four areas. It would be possible to assign one brand color to each area (e.g., Email=Teal, Calendar=Navy, Personal=Gold, Business=Green).
   - What's unclear: Whether this creates enough visual distinction between sections, and whether it is aesthetically coherent.
   - Recommendation: Propose this as an option during the adversarial process. The information density advocate may prefer more distinct colors (wider hue range). The simplicity advocate may prefer brand-derived colors (tighter palette). Let them argue.

4. **What is the acceptable range for task card vertical spacing?**
   - What we know: The current task card has a `cardHeight = Math.max(35, 20 + descLines.length * 5 + 8)` with a 6mm gap after the divider. For overwhelm, tighter spacing is better. For readability, more spacing is needed.
   - What's unclear: The minimum spacing that maintains readability while maximizing density.
   - Recommendation: The adversarial process should evaluate 3mm vs. 6mm vs. 8mm gap after task card dividers. 3mm may feel too tight; 8mm wastes space and reduces the overwhelm effect.

5. **Should the PDF include light accent colors that were defined in design-system.ts but not currently used?**
   - What we know: `design-system.ts` defines light variants: `greenLight: '#d1fae5'`, `costRedLight: '#fef2f2'`, `goldLight: '#fcd34d'`, `slate50: '#f8fafc'`. The V2 layout uses `accentLight: '#E6F4F4'` for the single teal accent.
   - What's unclear: Whether each Core Four accent needs a light variant for background tints.
   - Recommendation: YES -- each Core Four accent likely needs a light variant for task card backgrounds or section backgrounds. The C constant object should include `emailAccentLight`, `calendarAccentLight`, `personalAccentLight`, `businessAccentLight` values. These are computed as high-lightness, low-saturation versions of the accent colors (typically ~95% lightness in HSL).

## Design Process Facilitation Guidelines

For the agent implementing Plan 01 (the adversarial process):

### Round Structure
1. **State Assessment** (each perspective evaluates current design state)
2. **Proposals** (each perspective proposes specific changes per design dimension)
3. **Critique** (each perspective critiques the other two)
4. **Synthesis** (select winning approach per dimension with rationale)

### Decision Criteria
For each design dimension, the synthesis step should evaluate proposals against:
- **Conversion effectiveness:** Does this choice make the reader more likely to book?
- **jsPDF feasibility:** Can this be implemented with available primitives?
- **Brand coherence:** Does this feel like it comes from Assistant Launch?
- **Emotional arc integrity:** Does this support the correct emotional tone for its page position?
- **Implementation simplicity:** Simpler changes to the existing code are preferred over complex renderer rewrites

### Output Format
Each design decision should be documented as:
```
### [Design Dimension Name]
**Decision:** [specific choice]
**Values:** [exact RGB tuples, mm measurements, pt sizes]
**Rationale:** [why this wins over alternatives]
**Perspectives:** [which perspective championed this, which conceded, why]
**Code target:** [specific function/constant in layout-v2.ts to modify]
```

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `web/src/lib/pdf/layout-v2.ts` -- all rendering parameters, component renderers, color constants, font sizes, spacing values
- Direct codebase inspection of `web/src/lib/pdf/design-system.ts` -- V1-era brand color definitions, typography tokens, spacing system
- Direct codebase inspection of `web/src/app/globals.css` -- web brand color palette (Navy, Gold, Green)
- Phase 1 research and Plan 01 -- C color constant object structure, RGB tuple pattern, Core Four placeholder accents
- Phase 2 research -- framework page layout, Y-budget calculations, component renderer patterns
- Phase 3 research -- task page rendering, Core Four section header pattern, CTA page structure, fallback tasks, emotional arc implementation
- `.planning/PROJECT.md` -- emotional arc definition (pain -> education -> overwhelm -> solution), Core Four framework definition
- `.planning/research/FEATURES.md` -- jsPDF capabilities and limitations, anti-features list, design patterns that work in jsPDF, emotional arc design notes
- `.planning/research/PITFALLS.md` -- hardcoded height risks, splitTextToSize ordering bug, Y-overflow clipping
- `.planning/REQUIREMENTS.md` -- DESIGN-01, DESIGN-02, DESIGN-03 requirement definitions

### Secondary (MEDIUM confidence)
- Color psychology and conversion design principles are based on established design heuristics (red for urgency/cost, green for positive outcomes, white space for clarity). These are widely accepted but not empirically verified for THIS specific use case.
- The "relief through space" CTA pattern is based on retail design principles applied to document design -- credible but adapted from a different medium.

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries; all changes are parameter modifications to existing jsPDF calls
- Architecture (adversarial process): HIGH -- the process structure is well-defined; the output format maps directly to code changes
- Architecture (code changes): HIGH -- every design decision maps to a specific C constant, font size, spacing value, or renderer parameter in layout-v2.ts
- Pitfalls: HIGH -- Y-budget, unbuildable proposals, and contrast issues are verified from prior phase research and jsPDF documentation
- Design recommendations: MEDIUM -- color and emotional design patterns are based on established heuristics, not empirical testing on this specific document

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- no external dependency changes expected)
