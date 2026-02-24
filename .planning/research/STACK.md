# Stack Research

**Domain:** jsPDF — visually rich professional PDF report generation
**Researched:** 2026-02-23
**Confidence:** HIGH (core jsPDF API verified against official docs; Vercel limits verified against official docs; plugin details MEDIUM from GitHub/npm)

---

## Context

This is a **subsequent milestone** research file. The app already runs jsPDF 3.0.4 server-side in a Vercel serverless function (`/api/generate-pdf`, `maxDuration: 30`). The question is not "what technology to use" but "what jsPDF patterns produce the best professional output for a redesigned PDF layout."

The existing V2 layout (~800 lines, `layout-v2.ts`) already uses the primitives correctly. This research documents the best patterns to use in the redesign, informed by what the codebase already does, what jsPDF 3.0.4 actually exposes, and what produces professional output.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| jsPDF | 3.0.4 (installed) | PDF generation engine | Already in use; 3.x is the stable release series; dropped IE support in 3.0.0; security fixes through 3.0.4 |
| Node.js runtime on Vercel | current | Serverless execution host | Full Node.js API coverage; 2GB default memory; up to 300s timeout on Hobby |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jspdf-autotable | ^3.8.x | Structured table/grid layout | Use for the task roadmap pages (Pages 3-4) where dense 4-column organization is needed; handles column widths, cell padding, text wrapping, and page breaks automatically |
| None (built-in) | — | Rounded rect, circles, lines | jsPDF 3.x has native `roundedRect(x, y, w, h, rx, ry, style)` and `circle(x, y, r, style)` — no plugin needed |

**Note on jspdf-autotable:** Version 3.0 was released alongside jsPDF 3.0 and explicitly upgraded the peer dependency. It is confirmed compatible with jsPDF 3.x. Currently not installed in this project. Install only if the task roadmap pages use tabular layouts; skip if the redesign uses pure coordinate-based card layouts.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript types (bundled with jsPDF) | Type safety for all API calls | jsPDF ships its own `.d.ts`; no separate `@types/jspdf` needed |
| `doc.output('arraybuffer')` | Server-side buffer extraction | Already used correctly in generator-v2.ts |

---

## Key jsPDF API Patterns for the Redesign

### Pattern 1: Pre-computed RGB Color Table (Fixes Hex-Parsing-Every-Call Problem)

**Confidence: HIGH** — verified against jsPDF docs; `setFillColor(r, g, b)` accepts number triples directly.

**Problem in current code:** `setColor()` in `layout-v2.ts` runs a regex hex parse on every single draw call. With ~800+ draw operations per PDF, this is unnecessary overhead and brittle.

**Solution:** Pre-compute all colors once at module load time as RGB tuples, then call the jsPDF color methods with numbers directly.

```typescript
// Define once at module scope — zero parsing at render time
const C = {
  white:        [255, 255, 255] as const,
  ink:          [17,  24,  39]  as const,  // #111827
  inkSecondary: [75,  85,  99]  as const,  // #4B5563
  inkMuted:     [156, 163, 175] as const,  // #9CA3AF
  accent:       [13,  115, 119] as const,  // #0D7377
  accentLight:  [230, 244, 244] as const,  // #E6F4F4
  divider:      [229, 231, 235] as const,  // #E5E7EB
  background:   [249, 250, 251] as const,  // #F9FAFB
} as const;

// Usage — no parsing, direct numeric call
function setFill(doc: jsPDF, color: readonly [number, number, number]): void {
  doc.setFillColor(color[0], color[1], color[2]);
}
function setDraw(doc: jsPDF, color: readonly [number, number, number]): void {
  doc.setDrawColor(color[0], color[1], color[2]);
}
function setTextClr(doc: jsPDF, color: readonly [number, number, number]): void {
  doc.setTextColor(color[0], color[1], color[2]);
}
```

This eliminates all regex work from the render hot path and makes color intent explicit.

---

### Pattern 2: Card / Box Layout with Rounded Rectangles

**Confidence: HIGH** — `roundedRect` is a documented native jsPDF method in 3.x.

jsPDF 3.x has `doc.roundedRect(x, y, w, h, rx, ry, style)` natively. Style options: `'F'` (fill only), `'S'` (stroke only), `'FD'` (fill + stroke). The current `layout-v2.ts` wraps this correctly — keep that thin wrapper.

**Card pattern for the Three Pillars / Core Four boxes on Page 2:**

```typescript
function drawCard(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  options: {
    bgColor?: readonly [number, number, number];
    borderColor?: readonly [number, number, number];
    borderWidth?: number;
    radius?: number;
  } = {}
): void {
  const { bgColor, borderColor, borderWidth = 0.3, radius = 3 } = options;

  if (bgColor && borderColor) {
    setFill(doc, bgColor);
    setDraw(doc, borderColor);
    doc.setLineWidth(borderWidth);
    doc.roundedRect(x, y, w, h, radius, radius, 'FD');
  } else if (bgColor) {
    setFill(doc, bgColor);
    doc.roundedRect(x, y, w, h, radius, radius, 'F');
  } else if (borderColor) {
    setDraw(doc, borderColor);
    doc.setLineWidth(borderWidth);
    doc.roundedRect(x, y, w, h, radius, radius, 'S');
  }
}
```

**For the Framework Page (Page 2) — 2-column box grid:**

```typescript
// Two-column card grid example
const MARGIN = 20;
const CONTENT_WIDTH = 170; // A4: 210 - 2*20
const COL_GAP = 6;
const colWidth = (CONTENT_WIDTH - COL_GAP) / 2; // ~82mm each

function drawTwoColumnCards(
  doc: jsPDF,
  items: Array<{ title: string; body: string }>,
  startY: number
): number {
  const cardH = 35;
  let y = startY;

  for (let i = 0; i < items.length; i += 2) {
    const col0x = MARGIN;
    const col1x = MARGIN + colWidth + COL_GAP;

    drawCard(doc, col0x, y, colWidth, cardH, { bgColor: C.accentLight, radius: 3 });
    drawCard(doc, col1x, y, colWidth, cardH, { bgColor: C.accentLight, radius: 3 });

    // Render text inside each card...
    y += cardH + 6;
  }
  return y;
}
```

**For three-column metric boxes** (already working in V2 — keep this pattern):

```typescript
const boxWidth = (CONTENT_WIDTH - 16) / 3; // 3 boxes with 8mm gaps
metrics.forEach((metric, i) => {
  const x = MARGIN + i * (boxWidth + 8);
  doc.roundedRect(x, y, boxWidth, boxHeight, 3, 3, 'F');
});
```

---

### Pattern 3: Typography Hierarchy

**Confidence: HIGH** — verified against jsPDF docs; helvetica is always available without font embedding.

jsPDF built-in fonts: `helvetica`, `courier`, `times`. Each supports `'normal'`, `'bold'`, `'italic'`, `'bolditalic'`. No custom font loading required for professional output — helvetica at correct sizes reads cleanly in PDF.

**Recommended hierarchy for this report:**

| Role | Font | Style | Size (pt) | Notes |
|------|------|-------|-----------|-------|
| Page title / hero number | helvetica | bold | 48–56 | Cover page only |
| Section heading | helvetica | bold | 22–26 | One per page |
| Subsection / card title | helvetica | bold | 13–15 | Inside cards |
| Body / description | helvetica | normal | 10–11 | Main readable text |
| Label / caption | helvetica | normal | 8–9 | Muted labels below values |
| Badge text | helvetica | bold | 7–8 | Inside small pill badges |

**Key principle:** jsPDF `setFontSize()` uses points (pt), not px. A4 page is 297mm tall. At 72pt/inch, 1pt ≈ 0.35mm. 10pt body text = ~3.5mm line height, which reads well in PDF.

**Line height pattern** — jsPDF text baseline is at the bottom of the character. For proper multi-line rendering:

```typescript
const LINE_HEIGHT = {
  body: 5.5,    // mm between baselines for 10–11pt text
  small: 4.5,   // mm for 8–9pt captions
  heading: 8,   // mm for 14–18pt headings
};

// Rendering wrapped body text
const lines = doc.splitTextToSize(text, maxWidth);
lines.forEach((line: string, i: number) => {
  doc.text(line, x, y + i * LINE_HEIGHT.body);
});
const blockHeight = lines.length * LINE_HEIGHT.body;
```

**Critical API:** `doc.splitTextToSize(text, maxWidth)` — returns `string[]` respecting current font/size. Must call AFTER `setFont` and `setFontSize`. This is already used correctly in the codebase.

**Height estimation (for page break math):**

```typescript
// Estimate rendered height BEFORE drawing — use this for page break guards
function estimateTextHeight(doc: jsPDF, text: string, maxWidth: number, lineHeight = 5.5): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  return lines.length * lineHeight;
}
```

---

### Pattern 4: Page Break Management

**Confidence: HIGH** — based on jsPDF primitives + existing codebase patterns.

jsPDF has no automatic page break. The correct pattern is to check remaining space before drawing each element, add a page if needed, and reset `y`.

**Pattern — guard every render function:**

```typescript
const PAGE_HEIGHT = 297;
const FOOTER_RESERVE = 20; // mm reserved for footer
const SAFE_BOTTOM = PAGE_HEIGHT - FOOTER_RESERVE;
const NEW_PAGE_Y = 20;

function checkPageBreak(doc: jsPDF, y: number, neededHeight: number): number {
  if (y + neededHeight > SAFE_BOTTOM) {
    doc.addPage();
    return NEW_PAGE_Y;
  }
  return y;
}

// Usage in render loop
tasks.forEach((task) => {
  const estimatedH = estimateTextHeight(doc, task.description, CONTENT_WIDTH - 20) + 20;
  y = checkPageBreak(doc, y, estimatedH);
  y = renderTaskCard(doc, task, y);
});
```

**For the dense task roadmap (Pages 3-4):** Pre-calculate all task card heights before starting the page to determine if tasks overflow. If total task content height exceeds one page, distribute across two pages with a section header on each.

**`doc.getNumberOfPages()` + `doc.setPage(i)`** — used to add footers retroactively to all pages. This pattern is correct in the existing code. Keep it.

---

### Pattern 5: Image Embedding

**Confidence: HIGH** — `addImage` is a documented jsPDF module; security note applies.

**Signature:**
```typescript
doc.addImage(
  imageData,  // base64 DataURI string, HTMLImageElement, or HTMLCanvasElement
  format,     // 'PNG', 'JPEG', 'GIF', 'WEBP', 'BMP'
  x,          // mm
  y,          // mm
  width,      // mm
  height,     // mm
  alias?,     // string — cache key for reuse across pages
  compression?, // 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW'
  rotation?   // degrees
);
```

**Serverless consideration:** jsPDF 3.0.2 replaced the PNG parser with `fast-png` to fix a DoS vulnerability (CVE-2025-57810) where malformed PNGs caused infinite loops. jsPDF 3.0.4 includes this fix. However, on a 30s serverless budget, still validate image input before calling `addImage` — corrupt images now throw rather than loop, but the exception handling must be in place.

**Pattern for logo on cover page:**

```typescript
// Pre-encode logo as base64 string at build time or module load
// Avoids filesystem reads inside serverless function
const LOGO_BASE64 = 'data:image/png;base64,...'; // baked in at build

doc.addImage(LOGO_BASE64, 'PNG', MARGIN, 20, 30, 10, 'logo');
// alias='logo' means jsPDF caches it — embedding the same image on
// multiple pages only stores the pixel data once in the PDF
```

**For serverless:** Do NOT fetch images via HTTP inside the PDF generation function — this burns timeout budget and adds failure modes. Embed images as base64 constants at module level.

---

### Pattern 6: Visual Accent Elements (No Native Gradient)

**Confidence: HIGH** — confirmed jsPDF has no native gradient support.

jsPDF does not support CSS-style gradients. Options for visual richness:

**Option A — Solid colored header bands** (recommended for this use case):
```typescript
// Full-width colored header rectangle for cover or framework page
setFill(doc, C.accent);
doc.rect(0, 0, 210, 55, 'F'); // edge-to-edge colored band
```

**Option B — Simulated gradient using stacked thin rectangles** (LOW confidence on render quality):
Technically possible by drawing 20–30 rectangles of decreasing width or incrementing color values. Not recommended — it's a hack, adds ~30 draw calls, and the visual result is banding, not a real gradient. Solid fills look more professional in practice.

**Option C — Accent divider bars** (used in current code, works well):
```typescript
// 1.5mm vertical left-bar accent — current V2 pattern, visually effective
setFill(doc, C.accent);
doc.rect(MARGIN, y, 1.5, blockHeight, 'F');
```

**Option D — Horizontal rule with varied weight:**
```typescript
doc.setLineWidth(0.5);
setDraw(doc, C.accent);
doc.line(MARGIN, y, MARGIN + 30, y); // Short accent rule under brand name
```

**Recommendation:** Use solid fills with high-contrast color contrast (accent teal vs. white, or background gray vs. white) for card differentiation. Do not attempt gradient simulation.

---

### Pattern 7: Dense Task Roadmap Layout (Pages 3-4)

**Confidence: MEDIUM** — pattern based on coordinate math + current codebase; jspdf-autotable alternative is MEDIUM confidence on exact compatibility.

For Pages 3-4 with 4-column ownership areas, two approaches:

**Approach A — Pure jsPDF coordinate layout (recommended for full control):**

Divide `CONTENT_WIDTH` (170mm) into 4 columns with gaps:
```
4 cols × 38mm + 3 gaps × 2.67mm = 152mm + 8mm = 160mm
Remaining 10mm: use as outer margins or proportional gaps
```

```typescript
const COL_COUNT = 4;
const COL_GAP = 3;
const colWidth = (CONTENT_WIDTH - (COL_COUNT - 1) * COL_GAP) / COL_COUNT; // 40.75mm

const areas = ['Admin', 'Client Ops', 'Marketing', 'Finance'];
areas.forEach((area, i) => {
  const colX = MARGIN + i * (colWidth + COL_GAP);
  // Draw column header
  drawCard(doc, colX, y, colWidth, 10, { bgColor: C.accent, radius: 2 });
  setTextClr(doc, C.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(area, colX + colWidth / 2, y + 7, { align: 'center' });
});
```

**Approach B — jspdf-autotable** (if tabular structure fits the task layout):

AutoTable `didDrawCell` hook lets you inject custom jsPDF drawing inside any cell, enabling hybrid table structure + custom decoration. Good for the task rows because it handles text wrapping and page breaks automatically.

Requires installing `jspdf-autotable@^3.8.x` (not currently in project).

For the redesign's dense roadmap, if tasks are structured as rows under column headers, AutoTable is worth the install. If tasks are card-style with variable heights, coordinate layout is simpler.

---

### Pattern 8: Link / CTA Interactivity

**Confidence: HIGH** — `doc.link()` is documented and already used in codebase.

```typescript
// Clickable button pattern — already correct in layout-v2.ts
doc.link(btnX, btnY, btnWidth, btnHeight, { url: bookingUrl });

// Clickable text — measure width first
const textWidth = doc.getTextWidth(urlText);
doc.link((PAGE_WIDTH - textWidth) / 2, textY - 4, textWidth, 5, { url: bookingUrl });
```

`doc.getTextWidth(text)` returns width in mm for the current font/size. Must be called AFTER `setFont` and `setFontSize`.

---

### Pattern 9: Document Metadata

**Confidence: HIGH** — `doc.setProperties()` is documented.

```typescript
doc.setProperties({
  title: 'Time Freedom Report',
  subject: 'EA Task Delegation Analysis',
  author: 'Assistant Launch',
  keywords: 'executive assistant, delegation, time management',
  creator: 'Assistant Launch PDF Generator V2',
});
```

Set once after all pages are rendered, before calling `doc.output()`.

---

## Performance Profile for Vercel Serverless (30s Timeout)

**Confidence: HIGH for limits; MEDIUM for timing estimates.**

### Vercel Limits (verified Feb 2026)

| Resource | Limit |
|----------|-------|
| Max duration (with `maxDuration: 30` set) | 30s — matches current `export const maxDuration = 30` |
| Default timeout without config | 300s on Hobby/Pro with Fluid Compute |
| Memory | 2GB default, 4GB max (Pro) |
| Response payload | 4.5MB max — important: a complex 8-page PDF rendered as base64 in JSON response can exceed this |

**Payload size risk:** A 5-page PDF with images can be 500KB–2MB binary. Base64 encoding adds ~33% overhead. The current approach uploads to Vercel Blob and returns a URL, which sidesteps the 4.5MB payload limit. Keep this pattern.

### jsPDF Timing Budget

For the redesigned 5-page PDF (cover, framework, 2 task pages, CTA):

| Operation | Estimated time | Notes |
|-----------|---------------|-------|
| `new jsPDF()` instantiation | ~5–20ms | Cold start adds ~100ms first time |
| Per-page rendering (primitives) | ~10–50ms | ~100–300 draw calls per page |
| `splitTextToSize` calls | ~1–5ms each | O(n) over word count; not a bottleneck |
| `doc.addImage` with logo | ~20–100ms | Depends on image size; PNG decoding via fast-png |
| `doc.output('arraybuffer')` | ~10–30ms | Serialization scales with page count and image data |
| Vercel Blob upload | ~500ms–2s | Network I/O, not CPU — won't count against CPU time billing |

**Total expected PDF render time:** ~200–500ms for a 5-page text-heavy PDF with one image. Well within the 30s budget. The current code already measures this and logs duration.

### Performance Patterns

**Do:**
- Pre-compute RGB color tuples at module load (eliminates ~300+ regex calls per PDF)
- Call `splitTextToSize` once per text block, store result, use for both height estimation and rendering
- Use `alias` parameter in `addImage` for any image appearing on multiple pages
- Keep `doc` instance creation inside the async function (not at module scope) to avoid state leakage across concurrent requests

**Avoid:**
- Calling `doc.getTextDimensions()` for height calculations — it's known to have issues with multi-line text and is slower than `splitTextToSize(text).length * lineHeight`
- HTTP fetches inside the PDF generator (loading fonts, images, etc.) — embed as base64 constants
- Drawing more than ~500 primitives per page — no hard limit, but each adds serialization overhead

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| jsPDF primitives for layout | jspdf-autotable | Use AutoTable for the dense task roadmap pages if the layout is inherently tabular (rows + columns); skip for cards with variable heights |
| Solid fills for color regions | Gradient simulation with stacked rects | Never — visual quality poor, extra draw overhead |
| Base64-embedded images | HTTP image fetch in function | Never in serverless — latency, failure modes, timeout risk |
| Helvetica built-in font | Custom font via addFileToVFS + addFont | Use custom font if brand requires it; adds ~100–500KB to function bundle per font weight; latency for font parsing |
| Coordinate-based layout system | html2canvas + jsPDF | Never for server-side — html2canvas requires a DOM; not compatible with Node.js serverless |
| Coordinate-based layout system | Puppeteer/Playwright | Consider only if HTML/CSS rendering fidelity is critical and Vercel Pro budget is available; Puppeteer adds ~50MB+ to function bundle |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `doc.getTextDimensions()` for multi-line blocks | Known bugs with multi-line text; inconsistent results | `doc.splitTextToSize(text, width).length * lineHeight` |
| `html()` method on jsPDF | Requires DOM parsing via html2canvas; doesn't work reliably in Node.js serverless | Pure coordinate drawing |
| Gradient simulation (stacked rects) | Banded visual artifact, adds ~30 extra draw calls, doesn't look professional | Solid fills with high-contrast colors |
| `wrapText()` character-count heuristic (current layout.ts V1 pattern) | Character count doesn't account for proportional font widths — breaks on long words or variable-width characters | `doc.splitTextToSize(text, widthInMm)` which is font-aware |

---

## Stack Patterns by Variant

**For Page 2 (Framework with visual boxes — Three Pillars + Core Four):**
- Use `roundedRect` cards in 2-column grid
- Each card: solid background fill + white or dark text
- Left accent bar (1.5mm wide rect) for section differentiation
- No plugins needed

**For Pages 3-4 (Dense task roadmap by area):**
- If layout is strict 4-column rows: consider `jspdf-autotable`
- If layout is stacked cards per area with variable heights: use coordinate system with `checkPageBreak`
- Recommended: coordinate system first; add AutoTable if column alignment becomes painful

**For Page 1 (Cover + ROI):**
- Full-width solid color header band (`doc.rect(0, 0, 210, 60, 'F')`)
- Large hero number (`setFontSize(56)`, `helvetica`, `bold`)
- Three metric boxes in a row (existing `renderMetricsRow` pattern is correct)
- ROI block with divider line + net return value (existing `renderInvestmentBlock` is correct)

**For Final CTA Page:**
- Existing `renderCTABlock` + `doc.link()` pattern is correct
- Keep `buildBookingUrl()` with pre-filled params

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| jspdf@3.0.4 | jspdf-autotable@3.8.x | AutoTable 3.0 upgraded peer dep to jsPDF 3.x |
| jspdf@3.0.4 | Node.js 18+ | Ships `jspdf.node.min.js` as `main` entry point |
| jspdf@3.0.4 | fast-png (bundled) | Bundled internally since 3.0.2; no separate install |

---

## Installation

```bash
# Already installed — no changes needed for core jsPDF
# jspdf@3.0.4 is in package.json

# Install only if using AutoTable for task roadmap pages:
npm install jspdf-autotable
```

---

## Sources

- [jsPDF Official Docs — artskydj.github.io](https://artskydj.github.io/jsPDF/docs/jsPDF.html) — API method signatures (HIGH confidence)
- [jsPDF GitHub Releases](https://github.com/parallax/jsPDF/releases) — 3.0.x changelog verified (HIGH confidence)
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) — memory (2GB), max duration (300s default, configurable), payload (4.5MB) (HIGH confidence)
- [CVE-2025-57810 jsPDF PNG DoS Fix](https://www.miggo.io/vulnerability-database/cve/CVE-2025-57810) — fast-png replacement confirmed in 3.0.2 (HIGH confidence)
- [jsPDF AutoTable GitHub](https://github.com/simonbengtsson/jsPDF-AutoTable) — features and jsPDF 3.x compatibility (MEDIUM confidence — no explicit 3.0.4 CI badge visible)
- [jsPDF GitHub Issue #2289 — Gradient limitation](https://github.com/parallax/jsPDF/issues/2289) — no native gradient support confirmed (HIGH confidence)
- Existing codebase: `web/src/lib/pdf/layout-v2.ts`, `design-system.ts`, `generator-v2.ts` — current patterns verified by reading source (HIGH confidence)

---

*Stack research for: jsPDF professional PDF report generation (EA Time Freedom Report redesign)*
*Researched: 2026-02-23*
