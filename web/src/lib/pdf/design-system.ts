/**
 * PDF Design System
 *
 * Unified design tokens matching the web UI exactly.
 * Color Scheme: Navy (#0f172a) + Gold (#f59e0b) + Green (#10b981)
 *
 * This ensures PDF output matches the Assistant Launch brand.
 */

/**
 * Brand Colors - Direct match to globals.css
 */
export const PDF_COLORS = {
  // Primary brand colors
  navy: '#0f172a',         // Primary - headers, hero backgrounds, brand elements
  navyLight: '#1e293b',    // Slate-800 - lighter navy for contrast
  gold: '#f59e0b',         // Accent - CTAs, highlights, continue buttons
  goldLight: '#fcd34d',    // Light gold - subtle accents
  green: '#10b981',        // Success - EA badges, positive indicators
  greenLight: '#d1fae5',   // Light green - EA badge backgrounds

  // Semantic colors
  costRed: '#dc2626',      // Red-600 - cost/expense indicators
  costRedLight: '#fef2f2', // Red-50 - cost badge backgrounds

  // Neutrals
  white: '#ffffff',
  slate50: '#f8fafc',      // Lightest gray - alternating rows
  slate100: '#f1f5f9',     // Page background (matches web)
  slate200: '#e2e8f0',     // Borders, dividers
  slate400: '#94a3b8',     // Muted text
  slate600: '#475569',     // Secondary text
  slate700: '#334155',     // Body text
  slate900: '#0f172a',     // Headings (same as navy)
} as const;

/**
 * Typography Configuration
 *
 * jsPDF doesn't support custom fonts by default, but we can:
 * 1. Use helvetica-bold for a cleaner look
 * 2. Adjust sizing to feel more premium
 * 3. Add proper spacing between elements
 */
export const PDF_TYPOGRAPHY = {
  // Title hierarchy (simulating DM Serif feel)
  titleXL: { size: 32, weight: 'bold' as const },    // Main report title
  titleLG: { size: 24, weight: 'bold' as const },    // Section titles
  titleMD: { size: 18, weight: 'bold' as const },    // Subsection titles
  titleSM: { size: 14, weight: 'bold' as const },    // Card headers

  // Body text (simulating DM Sans)
  bodyLG: { size: 12, weight: 'normal' as const },   // Primary body
  bodyMD: { size: 11, weight: 'normal' as const },   // Standard body
  bodySM: { size: 10, weight: 'normal' as const },   // Secondary body
  bodyXS: { size: 9, weight: 'normal' as const },    // Captions, labels

  // Special
  heroAmount: { size: 36, weight: 'bold' as const }, // Big money numbers
  badge: { size: 8, weight: 'bold' as const },       // EA/cost badges
  stat: { size: 28, weight: 'bold' as const },       // Key statistics
} as const;

/**
 * Spacing System (in mm, jsPDF default units)
 */
export const PDF_SPACING = {
  // Page margins
  pageMargin: 20,
  contentWidth: 170, // 210 - 2*20

  // Section spacing
  sectionGap: 20,    // Between major sections
  subsectionGap: 12, // Between subsections
  itemGap: 8,        // Between list items

  // Element padding
  cardPadding: 12,
  boxPadding: 8,
  badgePadding: 4,

  // Border radius (visual, not actual rounded corners in jsPDF)
  borderRadius: 4,
} as const;

/**
 * Page Layout Configuration
 */
export const PDF_LAYOUT = {
  pageWidth: 210,     // A4 width in mm
  pageHeight: 297,    // A4 height in mm

  // Safe areas
  headerY: 20,        // Start of content from top
  footerY: 280,       // Footer position
  contentEndY: 270,   // Stop content here to avoid footer

  // Page break threshold
  pageBreakAt: 260,   // Add new page when y exceeds this
  newPageStartY: 25,  // Y position after page break
} as const;

/**
 * Component-specific styles
 */
export const PDF_COMPONENTS = {
  // Hero section (navy background with gold accents)
  hero: {
    height: 70,
    background: PDF_COLORS.navy,
    accentBar: PDF_COLORS.gold,
    accentBarHeight: 4,
    textColor: PDF_COLORS.white,
    subtitleColor: PDF_COLORS.slate400,
  },

  // ROI Analysis card
  roiCard: {
    background: PDF_COLORS.white,
    border: PDF_COLORS.slate200,
    headerBg: PDF_COLORS.slate50,
    positiveColor: PDF_COLORS.green,
    negativeColor: PDF_COLORS.slate600,
    resultColor: PDF_COLORS.gold,
  },

  // Task list styling
  taskList: {
    titleColor: PDF_COLORS.navy,
    alternateRowBg: PDF_COLORS.slate50,
    descriptionColor: PDF_COLORS.slate600,
    eaBadgeBg: PDF_COLORS.greenLight,
    eaBadgeText: PDF_COLORS.green,
    costBadgeBg: PDF_COLORS.costRedLight,
    costBadgeText: PDF_COLORS.costRed,
  },

  // CTA box
  cta: {
    background: PDF_COLORS.gold,
    textColor: PDF_COLORS.navy,
  },

  // Footer
  footer: {
    lineColor: PDF_COLORS.slate200,
    textColor: PDF_COLORS.slate400,
    brandColor: PDF_COLORS.navy,
  },
} as const;

/**
 * Design Validation Rules
 *
 * These rules can be used to programmatically validate PDF output
 */
export const PDF_DESIGN_RULES = {
  // Color usage rules
  colors: {
    primaryUsage: 'Navy (#0f172a) must be used for all major headers and hero backgrounds',
    accentUsage: 'Gold (#f59e0b) must be used for CTAs and highlights',
    successUsage: 'Green (#10b981) must be used for EA badges and positive indicators',
    costUsage: 'Red (#dc2626) must be used for cost/expense indicators only',
    noPurple: 'Purple (#6F00FF) must NOT be used anywhere',
  },

  // Spacing rules
  spacing: {
    minSectionGap: 15, // Minimum spacing between sections
    minItemGap: 6,     // Minimum spacing between list items
    maxContentWidth: 175, // Maximum width for text content
  },

  // Typography rules
  typography: {
    minBodySize: 9,    // Minimum readable body text size
    maxTitleSize: 36,  // Maximum title size
    titlesMustBeBold: true,
  },

  // Layout rules
  layout: {
    footerMustBeOnAllPages: true,
    noCutOffContent: true,
    minFooterSpace: 25, // Space reserved for footer
  },
};

/**
 * Convert hex color to RGB components for jsPDF
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Get RGB values for jsPDF setFillColor/setTextColor
 */
export function getRgbValues(hex: string): [number, number, number] {
  const { r, g, b } = hexToRgb(hex);
  return [r, g, b];
}
