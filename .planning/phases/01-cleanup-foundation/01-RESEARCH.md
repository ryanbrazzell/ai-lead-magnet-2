# Phase 1: Cleanup & Foundation - Research

**Researched:** 2026-02-24
**Domain:** PDF generation codebase cleanup, color system refactoring, page overflow protection
**Confidence:** HIGH

## Summary

The PDF generation subsystem has a clear V1/V2 split. Production traffic (the `/api/generate-pdf` route) exclusively uses V2 (`generator-v2.ts` and `layout-v2.ts`). The V1 files (`generator.ts` and `layout.ts`) are only referenced by the barrel export (`index.ts`), test files, and two development scripts. Deleting V1 requires updating six files that reference them.

The V2 layout file (`layout-v2.ts`) uses a `setColor(doc, hex, type)` helper that regex-parses hex strings on every call -- approximately 65 call sites. Replacing this with pre-computed RGB tuple constants is straightforward: define `[r, g, b]` tuples, then call `doc.setFillColor(r, g, b)` / `doc.setTextColor(r, g, b)` / `doc.setDrawColor(r, g, b)` directly. jsPDF natively accepts `(r: number, g: number, b: number)` for all three methods (verified from codebase usage in layout.ts lines 30-32).

The V2 layout has no page-break protection. The `buildTasksPage` function iterates tasks and advances `y` without checking whether content would overflow past the footer area (y=282, given PAGE_HEIGHT=297 and a 15mm footer). V1's `layout.ts` has a primitive `PAGE_BREAK_THRESHOLD = 255` check, providing a pattern to follow. A `checkPageBreak` utility needs to compare the current y plus the estimated content height against a safe threshold, add a new page if needed, and return the new y.

**Primary recommendation:** Execute four surgical changes -- delete V1 files (with reference cleanup), replace `setColor` with direct RGB calls from tuple constants, define the full color palette (existing V2 colors plus planned Core Four accent colors), and add a `checkPageBreak` utility.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsPDF | (existing in project) | PDF document generation | Already in use; all PDF work builds on it |
| TypeScript | (existing in project) | Type safety for color tuples and utilities | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| design-system.ts | N/A (internal module) | Pre-existing PDF design tokens | Already defines `PDF_COLORS`, `PDF_LAYOUT`, `hexToRgb()`, `getRgbValues()` -- potential reuse for color constants |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Module-level `const` tuples | `design-system.ts` existing `getRgbValues()` | `getRgbValues()` still does hex parsing at runtime; pre-computed tuples avoid all runtime parsing -- prefer tuples |
| Manual page break checks | jsPDF auto-paging | jsPDF auto-paging only works with `doc.text()` when `doc.setAutoPageBreak(true)` is called, and does NOT work for custom-drawn shapes/rects. Manual checking is required. |

**Installation:**
```bash
# No new packages needed -- all work is on existing code
```

## Architecture Patterns

### Recommended Project Structure
```
web/src/lib/pdf/
├── layout-v2.ts         # Active layout builder (PRIMARY target of changes)
├── generator-v2.ts      # PDF generator orchestrator (minor updates)
├── design-system.ts     # Design tokens (reference, may be extended)
├── s3Service.ts         # Upload service (untouched)
├── index.ts             # Barrel export (update: remove V1 re-exports)
└── __tests__/
    ├── layout-v2.test.ts    # (future - not part of this phase)
    ├── s3Service.test.ts    # (untouched)
    ├── generator.test.ts    # DELETE (V1 test)
    ├── layout.test.ts       # DELETE (V1 test)
    └── integration.test.ts  # DELETE (V1 integration test)
```

### Pattern 1: Pre-computed RGB Tuple Constants
**What:** Define colors as `[number, number, number]` tuples at module level. Call jsPDF color methods directly with spread.
**When to use:** Every place a color is set in the PDF layout.
**Example:**
```typescript
// Type alias for clarity
type RGB = readonly [number, number, number];

// Pre-computed constants -- no runtime hex parsing
const C = {
  white:        [255, 255, 255] as const satisfies RGB,
  ink:          [17, 24, 39]    as const satisfies RGB,  // #111827
  inkSecondary: [75, 85, 99]    as const satisfies RGB,  // #4B5563
  inkMuted:     [156, 163, 175] as const satisfies RGB,  // #9CA3AF
  accent:       [13, 115, 119]  as const satisfies RGB,  // #0D7377
  accentLight:  [230, 244, 244] as const satisfies RGB,  // #E6F4F4
  divider:      [229, 231, 235] as const satisfies RGB,  // #E5E7EB
  background:   [249, 250, 251] as const satisfies RGB,  // #F9FAFB
} as const;

// Usage: direct jsPDF calls -- no wrapper function, no hex parsing
doc.setFillColor(...C.accent);
doc.setTextColor(...C.ink);
doc.setDrawColor(...C.divider);
```

### Pattern 2: checkPageBreak Utility
**What:** A function that checks if the next content block would overflow the page, and if so, adds a new page and returns the reset y-position.
**When to use:** Before rendering any variable-height content block (task cards, analysis blocks, founder tasks).
**Example:**
```typescript
/**
 * Check if content would overflow the current page.
 * If so, add a new page and return the starting y for the new page.
 *
 * @param doc - jsPDF document instance
 * @param currentY - Current y position on the page
 * @param contentHeight - Estimated height of the next content block
 * @param safeBottomY - Maximum y before footer area (default: 270)
 * @param newPageStartY - Y position to start content on a new page (default: 20)
 * @returns The y position to use (either currentY or newPageStartY)
 */
function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  contentHeight: number,
  safeBottomY: number = 270,
  newPageStartY: number = 20,
): number {
  if (currentY + contentHeight > safeBottomY) {
    doc.addPage();
    return newPageStartY;
  }
  return currentY;
}
```

### Pattern 3: Color Palette for Core Four Sections
**What:** Extend the color constant object with accent colors for each Core Four area and planned PDF sections.
**When to use:** When building new section-specific pages (cover, framework, email, calendar, personal life, business process, CTA).
**Example:**
```typescript
const C = {
  // Existing V2 design system colors
  // ... (ink, accent, etc. from Pattern 1)

  // Cover page
  coverBg:     [13, 115, 119]  as const satisfies RGB,  // Teal -- same as accent

  // Framework page
  frameworkBg: [17, 24, 39]    as const satisfies RGB,  // Dark ink

  // Core Four area accents (planned -- to be finalized)
  emailAccent:    [59, 130, 246]  as const satisfies RGB,  // Blue #3B82F6
  calendarAccent: [168, 85, 247]  as const satisfies RGB,  // Purple #A855F7
  personalAccent: [234, 179, 8]   as const satisfies RGB,  // Amber #EAB308
  businessAccent: [34, 197, 94]   as const satisfies RGB,  // Green #22C55E

  // CTA
  ctaBg:       [13, 115, 119]  as const satisfies RGB,  // Teal
  ctaText:     [255, 255, 255] as const satisfies RGB,  // White
} as const;
```

### Anti-Patterns to Avoid
- **Hex strings passed to color helpers at runtime:** The whole point of CLEAN-02 is to eliminate `setColor(doc, '#XXYYZZ', 'fill')` calls. Do NOT create a new wrapper that still accepts hex strings.
- **Inline RGB values:** Do NOT scatter `doc.setFillColor(13, 115, 119)` without a named constant. All colors must flow through the constant object `C`.
- **Partial migration:** Do NOT leave some calls using the old `setColor` helper and some using the new pattern. The old `setColor` function should be deleted entirely when migration is complete.
- **Touching generator-v2.ts for color changes:** Color usage is entirely in `layout-v2.ts`. The generator orchestrates but does not set colors. Keep the change surface minimal.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex-to-RGB conversion at render time | Custom `setColor` wrapper that parses hex every call | Pre-computed tuple constants with jsPDF's native `(r, g, b)` signature | Eliminates ~65 regex executions per PDF render; simpler code; type-safe |
| Page overflow detection | Per-section threshold checks with inconsistent magic numbers | Single `checkPageBreak(doc, y, height)` utility with configurable thresholds | V1's layout.ts has THREE different threshold values (240, 255, 220) -- centralizing avoids inconsistency |

**Key insight:** jsPDF's `setFillColor`, `setTextColor`, and `setDrawColor` all natively accept `(r: number, g: number, b: number)`. The `setColor` / `setHexColor` wrappers in V1 and V2 exist only because the original code stored colors as hex strings. Changing the storage format to tuples makes the wrappers unnecessary.

## Common Pitfalls

### Pitfall 1: Deleting V1 Files Without Cleaning All References
**What goes wrong:** Build fails with "Cannot find module" errors because imports in barrel files, tests, and scripts still point to deleted files.
**Why it happens:** V1 files are referenced in 6 places beyond the files themselves: `index.ts`, `__tests__/generator.test.ts`, `__tests__/layout.test.ts`, `__tests__/integration.test.ts`, `scripts/generate-sample-pdf.ts`, and `scripts/send-test-email.ts`. The route test (`__tests__/route.test.ts`) mocks the V1 generator but the actual route uses V2.
**How to avoid:** Delete files AND update all six referencing files in a single atomic operation. The barrel `index.ts` should re-export from V2 equivalents (or remove those exports if they're unused downstream). Test files for V1 should be deleted. Scripts should be updated to use V2.
**Warning signs:** TypeScript compilation errors after deletion; broken CI.

### Pitfall 2: Incomplete setColor Migration Leaving Mixed Patterns
**What goes wrong:** Some calls use the old `setColor(doc, COLORS.ink, 'text')` pattern while others use `doc.setTextColor(...C.ink)`, creating inconsistency and leaving dead code.
**Why it happens:** layout-v2.ts has ~65 `setColor` call sites. Easy to miss some during find-and-replace.
**How to avoid:** After migration, grep for any remaining `setColor(` calls in layout-v2.ts. Also grep for any remaining hex string references in the COLORS object. Delete the `setColor` function and the hex-string `COLORS` object entirely -- the compiler will catch any missed call sites.
**Warning signs:** The old `setColor` function still exists after migration; hex strings still present in the COLORS constant.

### Pitfall 3: checkPageBreak Not Accounting for Dynamic Content Height
**What goes wrong:** `checkPageBreak` is called with a fixed height estimate, but actual rendered content (especially multi-line text wrapped by `doc.splitTextToSize`) is taller, causing overflow anyway.
**Why it happens:** Task card height depends on description length. The current `renderTaskCard` calculates `cardHeight = Math.max(35, 20 + descLines.length * 5 + 8)` AFTER rendering. The check needs to happen BEFORE rendering.
**How to avoid:** Either (a) compute description line count BEFORE calling checkPageBreak by using `doc.splitTextToSize` for measurement without rendering, or (b) use a conservative maximum height estimate for task cards.
**Warning signs:** Content still overflows onto footer area despite checkPageBreak being "in place."

### Pitfall 4: Route Test File Still Mocking V1 Generator
**What goes wrong:** The route test at `__tests__/route.test.ts` mocks `@/lib/pdf/generator` (V1) but the actual route imports from `@/lib/pdf/generator-v2`. Tests pass trivially because they mock the wrong module.
**Why it happens:** The test was written for the V1 route and never updated when the route switched to V2.
**How to avoid:** When deleting V1, also update the route test to mock `@/lib/pdf/generator-v2` and test the actual `generatePDFV2` function.
**Warning signs:** Route test passes but doesn't actually validate the PDF generation path used in production.

### Pitfall 5: Core Four Accent Colors Not Aligned With Design
**What goes wrong:** Colors chosen for email/calendar/personal/business accents don't match the web UI or the designer's intent.
**Why it happens:** Phase 1 defines the palette constants, but the actual page designs come in later phases. If colors are locked in Phase 1 without design alignment, they'll need changing later.
**How to avoid:** Define the Core Four accent slots in the constant object but mark them with a comment like `// Placeholder -- confirm with design before Phase 3`. Use the existing V2 accent (teal) as a safe default for any early testing.
**Warning signs:** Color values change in Phase 3/4 after already being "locked" in Phase 1.

## Code Examples

Verified patterns from the existing codebase:

### Current setColor Pattern (to be replaced)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 47-58
function setColor(doc: jsPDF, hex: string, type: 'fill' | 'text' | 'draw'): void {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  if (type === 'fill') doc.setFillColor(r, g, b);
  else if (type === 'text') doc.setTextColor(r, g, b);
  else if (type === 'draw') doc.setDrawColor(r, g, b);
}
```

### Current COLORS Object (hex strings -- to be replaced)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 23-32
export const COLORS = {
  white: '#FFFFFF',
  ink: '#111827',
  inkSecondary: '#4B5563',
  inkMuted: '#9CA3AF',
  accent: '#0D7377',
  accentLight: '#E6F4F4',
  divider: '#E5E7EB',
  background: '#F9FAFB',
} as const;
```

### Example Call Site Migration (renderHeader)
```typescript
// BEFORE (current): layout-v2.ts lines 147-162
setColor(doc, COLORS.inkMuted, 'text');
doc.setFontSize(9);
doc.text('www.assistantlaunch.com', PAGE_WIDTH - MARGIN, y, { align: 'right' });
setColor(doc, COLORS.accent, 'text');
doc.setFontSize(10);
doc.text('ASSISTANT LAUNCH', MARGIN, y);
setColor(doc, COLORS.accent, 'draw');
doc.setLineWidth(0.5);
doc.line(MARGIN, y + 3, MARGIN + 30, y + 3);

// AFTER (target):
doc.setTextColor(...C.inkMuted);
doc.setFontSize(9);
doc.text('www.assistantlaunch.com', PAGE_WIDTH - MARGIN, y, { align: 'right' });
doc.setTextColor(...C.accent);
doc.setFontSize(10);
doc.text('ASSISTANT LAUNCH', MARGIN, y);
doc.setDrawColor(...C.accent);
doc.setLineWidth(0.5);
doc.line(MARGIN, y + 3, MARGIN + 30, y + 3);
```

### V1 Page Break Pattern (reference for checkPageBreak design)
```typescript
// Source: web/src/lib/pdf/layout.ts lines 73-79, 306-310
const PAGE_BREAK_THRESHOLD = 255;
const NEW_PAGE_START_Y = 25;

// Used inconsistently:
if (yPosition > 240) { doc.addPage(); yPosition = NEW_PAGE_START_Y; }  // Line 287
if (yPosition > PAGE_BREAK_THRESHOLD) { doc.addPage(); yPosition = NEW_PAGE_START_Y; }  // Line 306
if (yPosition > 220) { doc.addPage(); yPosition = NEW_PAGE_START_Y; }  // Line 371, 715, 782

// Problem: Three different thresholds (220, 240, 255) used ad-hoc.
// Solution: Single checkPageBreak utility with one configurable threshold.
```

### buildTasksPage (where checkPageBreak is most needed)
```typescript
// Source: web/src/lib/pdf/layout-v2.ts lines 633-655
export function buildTasksPage(
  doc: jsPDF,
  tasks: PDFTask[],
  title: string,
  subtitle: string,
  userData?: CTAUserData
): void {
  doc.addPage();
  let y = 20;
  y = renderSectionTitle(doc, title, subtitle, y);
  y += 5;
  tasks.forEach((task, index) => {
    // BUG: No overflow check before rendering each task card
    y = renderTaskCard(doc, index + 1, task.name, task.description, task.time_saved, y);
  });
  // Conditional CTA only checks remaining space once, after all tasks
  if (userData && y + 55 < PAGE_HEIGHT - 20) {
    y += 5;
    renderCTABlock(doc, y, userData);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| V1 generator/layout (Navy+Gold scheme) | V2 generator/layout (Teal minimal scheme) | Before this phase | V1 is dead code; route already uses V2 |
| Hex string colors with setColor wrapper | Direct RGB tuples with jsPDF native API | This phase (planned) | Eliminates runtime hex parsing; better type safety |
| Ad-hoc page break thresholds (220/240/255) | Centralized checkPageBreak utility | This phase (planned) | Consistent overflow protection |
| Flat task frequency grouping | Core Four area grouping via `coreTaskType` | Already typed in task.ts | `coreTaskType` field exists on Task type but unused in PDF layer |

**Deprecated/outdated:**
- `generator.ts` (V1): Dead code. Route uses `generator-v2.ts`. To be deleted.
- `layout.ts` (V1): Dead code. All rendering uses `layout-v2.ts`. To be deleted.
- `setColor()` function in layout-v2.ts: To be replaced with direct RGB tuple calls.
- `COLORS` hex-string object in layout-v2.ts: To be replaced with RGB tuple constant object.

## Open Questions

1. **Core Four accent color values**
   - What we know: The phase spec says the palette must "cover all planned sections: cover, framework, each Core Four area accent, and CTA." The four areas are: emailManagement, calendarManagement, personalLifeManagement, businessProcessManagement (from `CoreTaskType` in task.ts).
   - What's unclear: The specific hex/RGB values for each Core Four accent color have not been specified by design. The V2 layout uses only teal (#0D7377) as a single accent.
   - Recommendation: Define placeholder values (blue, purple, amber, green -- common SaaS category colors) in the constant object with explicit "placeholder" comments. Actual values can be refined in later phases when pages are built. This satisfies "constants exist" without blocking design decisions.

2. **What to do with V1 test files**
   - What we know: Three test files exist that exclusively test V1 code: `__tests__/generator.test.ts`, `__tests__/layout.test.ts`, `__tests__/integration.test.ts`. Additionally, `__tests__/route.test.ts` mocks V1 generator but tests the route handler.
   - What's unclear: Whether the V1 tests should be deleted outright or adapted to test V2 equivalents.
   - Recommendation: Delete the three V1-only test files (they test deleted code). Update `route.test.ts` to mock V2 generator instead of V1. Creating comprehensive V2 layout tests is out of scope for Phase 1 (could be a follow-up).

3. **Should `design-system.ts` be the single source of truth for colors?**
   - What we know: `design-system.ts` already defines `PDF_COLORS` (hex), `PDF_LAYOUT`, `PDF_SPACING`, etc. It even has `hexToRgb()` and `getRgbValues()` utility functions. But `layout-v2.ts` ignores it entirely and defines its own `COLORS` object.
   - What's unclear: Whether to consolidate all color constants into `design-system.ts` or keep them local to `layout-v2.ts`.
   - Recommendation: Keep the RGB tuple constants in `layout-v2.ts` for now. The design-system.ts defines a V1 color scheme (Navy+Gold) that differs from V2's (Teal). Consolidation would be a larger refactor. The phase goal is to replace hex-parsing, not unify the design system. A future phase could unify.

4. **Handling the `COLORS` export**
   - What we know: The `COLORS` object is exported from `layout-v2.ts` (line 23: `export const COLORS`). It may be imported elsewhere.
   - What's unclear: Whether anything outside layout-v2.ts imports `COLORS`.
   - Recommendation: Grep confirmed no external imports of `COLORS` from layout-v2.ts. Safe to replace with the RGB tuple constant. However, the new constant should also be exported (as `C` or a renamed `COLORS`) in case future code needs it.

## Detailed File Impact Analysis

### Files to DELETE
| File | Lines | Why Dead |
|------|-------|----------|
| `web/src/lib/pdf/generator.ts` | 349 | V1 generator; route uses generator-v2 |
| `web/src/lib/pdf/layout.ts` | 994 | V1 layout; all rendering uses layout-v2 |
| `web/src/lib/pdf/__tests__/generator.test.ts` | 182 | Tests V1 generator only |
| `web/src/lib/pdf/__tests__/layout.test.ts` | 365 | Tests V1 layout only |
| `web/src/lib/pdf/__tests__/integration.test.ts` | 294 | Tests V1 generator only |

### Files to UPDATE (reference cleanup after V1 deletion)
| File | Change |
|------|--------|
| `web/src/lib/pdf/index.ts` | Remove V1 re-exports; optionally add V2 re-exports |
| `web/scripts/generate-sample-pdf.ts` | Change import from `generator` to `generator-v2` |
| `web/scripts/send-test-email.ts` | Change import from `generator` to `generator-v2` |
| `web/src/app/api/generate-pdf/__tests__/route.test.ts` | Update mock from `@/lib/pdf/generator` to `@/lib/pdf/generator-v2` |

### Files to MODIFY (core changes)
| File | Change |
|------|--------|
| `web/src/lib/pdf/layout-v2.ts` | Replace COLORS hex object with RGB tuples; replace all setColor calls with direct jsPDF calls; delete setColor function; add checkPageBreak utility; add Core Four accent colors to palette |

### Files UNTOUCHED
| File | Why |
|------|-----|
| `web/src/lib/pdf/generator-v2.ts` | No color calls; no page break logic; only orchestrates |
| `web/src/lib/pdf/design-system.ts` | Out of scope; V1-era design tokens |
| `web/src/lib/pdf/s3Service.ts` | Unrelated to PDF layout |
| `web/src/types/task.ts` | CoreTaskType already exists; no changes needed |
| `web/src/app/api/generate-pdf/route.ts` | Already uses V2; no changes needed |

## Quantitative Summary

| Metric | Value |
|--------|-------|
| V1 files to delete | 5 (2 source + 3 test) |
| V1 reference files to update | 4 |
| `setColor` call sites to migrate | ~65 |
| Unique colors in current V2 palette | 8 |
| New Core Four accent colors to add | 4 (+ cover, framework, CTA slots) |
| Estimated `checkPageBreak` integration points | 4 (buildTasksPage, buildFounderTasksPage, renderFounderTasksSection, buildCTAPage) |

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all PDF files in `web/src/lib/pdf/`
- Direct codebase inspection of `web/src/types/task.ts` for CoreTaskType
- Direct codebase inspection of `web/src/app/api/generate-pdf/route.ts` confirming V2 usage
- jsPDF API usage verified from existing code: `doc.setFillColor(r, g, b)`, `doc.setTextColor(r, g, b)`, `doc.setDrawColor(r, g, b)` all accept three numeric arguments

### Secondary (MEDIUM confidence)
- Core Four accent color suggestions (blue/purple/amber/green) are placeholder recommendations based on common SaaS design patterns, not verified against any specific design spec for this project

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- jsPDF is already in use; no new libraries needed
- Architecture: HIGH -- patterns derived directly from existing codebase analysis
- Pitfalls: HIGH -- all pitfalls identified from actual code inspection (reference counts verified, threshold inconsistencies documented with line numbers)
- Color palette values for Core Four: MEDIUM -- placeholder values; actual design colors not specified

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- no external dependency changes expected)
