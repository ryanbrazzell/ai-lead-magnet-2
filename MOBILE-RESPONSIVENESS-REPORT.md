# Mobile Responsiveness Analysis: acquisition.com/roadmap

**Analysis Date:** December 1, 2025
**Tool Used:** Playwright Browser Automation
**Breakpoints Tested:** 320px, 375px, 428px, 768px, 1024px, 1280px, 1440px

---

## Executive Summary

The acquisition.com roadmap page uses a **mobile-first responsive design** with a critical breakpoint between **375px and 428px** where the primary CTA button transitions from full-width to standard width.

---

## Key Findings

### 1. Primary Mobile Breakpoint: ~400px

**Visual Analysis from Screenshots:**

- **320px (iPhone SE):** Full-width button layout, stacked form fields, mobile-optimized typography
- **375px (iPhone 13 Pro):** Full-width button layout maintained, optimized for standard mobile
- **428px (iPhone 13 Pro Max):** Layout shifts - buttons no longer full-width, more horizontal space utilized
- **768px (Tablet):** Desktop-like layout with horizontal cookie consent buttons, multi-column capable

**Conclusion:** The main mobile/desktop breakpoint appears to be around **400-428px**.

---

### 2. Button Behavior by Breakpoint

#### Main CTA Button ("LET'S START")

| Breakpoint | Width | Button Width | Full-Width | Font Size |
|------------|-------|--------------|------------|-----------|
| 320px | Mobile XS | 270px | Yes (95%+) | 23.86px |
| 375px | Mobile Small | 325px | Yes (95%+) | 23.86px |
| 428px+ | Mobile Large+ | Variable | No | 23.86px |

**Key Observation:** The primary CTA button is full-width on viewports 375px and below, transitioning to a fixed-width or max-width design above 428px.

#### Cookie Consent Buttons

| Breakpoint | Allow Button | Deny Button | Layout |
|------------|--------------|-------------|--------|
| 320px | 124px | 124px | Stacked/Side-by-side |
| 375px | 149px | 149px | Stacked/Side-by-side |
| 428px | 173px | 173px | Side-by-side |
| 768px | 200px | 200px | Side-by-side |
| 1024px+ | 200px | 200px | Side-by-side |

**Pattern:** Cookie buttons scale proportionally with viewport up to 768px, then maintain consistent width.

---

### 3. Layout Architecture

#### Container Behavior

- **No max-width constraint:** Containers expand to fill viewport width at all breakpoints
- **Fluid typography:** Font sizes scale with viewport (e.g., cookie text: 12px mobile → 15px tablet)
- **Responsive padding:** Containers maintain consistent padding ratios across breakpoints

#### Form Elements

| Breakpoint | Form Count | Input Fields | Layout Direction |
|------------|------------|--------------|------------------|
| 320px | 8 | Multiple | Stacked (vertical) |
| 375px | 8 | Multiple | Stacked (vertical) |
| 428px | 6 | Multiple | Transitional |
| 768px+ | 8 | Multiple | Optimized horizontal/vertical mix |

**Note:** The form count difference at 428px (6 vs 8 forms) suggests conditional rendering or layout shifts at this breakpoint.

---

### 4. Mobile-Specific Behaviors

#### Viewport Configuration
```
width=device-width, initial-scale=1.0
```

#### Responsive Design Patterns

1. **Full-width CTA on small mobile (≤375px)**
   - Maximum touch target size
   - Single-column form layout
   - Prominent call-to-action

2. **Transitional layout (428px-768px)**
   - Buttons transition to fixed widths
   - More horizontal space utilization
   - Cookie consent optimized for larger screens

3. **Tablet/Desktop (≥768px)**
   - Multi-column capable
   - Horizontal navigation
   - Side-by-side button layouts
   - Larger font sizes (12px → 15px for UI elements)

---

### 5. Critical Breakpoint Transitions

#### 375px → 428px: Primary Mobile Breakpoint
- **What Changes:**
  - Main CTA button: Full-width → Fixed/Max-width
  - Form rendering: 8 forms → 6 forms (conditional display)
  - Layout shifts from pure mobile to transitional

#### 768px+: Tablet/Desktop Breakpoint
- **What Changes:**
  - Font size increases (12px → 15px for UI text)
  - Cookie consent buttons reach maximum width (200px)
  - Multi-column layouts become available
  - Desktop navigation elements visible

---

## Mobile-Specific Styling Changes

### Typography
- **Mobile (320-375px):** Base font size ~12px for UI, 23.86px for CTAs
- **Tablet (768px+):** Base font size ~15px for UI, maintains 23.86px for CTAs

### Touch Targets
- **Mobile:** Full-width buttons ensure large touch targets (minimum 270px wide)
- **Desktop:** Buttons sized appropriately for cursor interaction (~200px)

### Spacing
- Fluid padding system maintains proportional spacing
- No fixed max-width on containers (full-width design)

---

## Recommendations for Implementation

### If Building a Similar Design:

1. **Primary breakpoint at ~400px**
   - Use `@media (max-width: 400px)` for full-width mobile buttons
   - Consider touch-friendly 44px+ height for all interactive elements

2. **Secondary breakpoint at ~768px**
   - Transition to tablet/desktop layout
   - Increase base font sizes
   - Enable multi-column layouts

3. **Button Strategy**
   - Mobile (≤400px): Full-width CTAs with 24px font size
   - Desktop (>400px): Max-width 200-300px with centering

4. **Form Layout**
   - Mobile: Single-column, stacked fields
   - Desktop: Consider side-by-side for short fields (name, email)

5. **Cookie Consent**
   - Scale button widths with viewport until 768px
   - Maintain 200px maximum width for desktop

---

## Screenshots Reference

All screenshots saved to: `/Users/ryanbrazzell/boundless-os-template-2/responsiveness-screenshots/`

- `mobile-xs-320px.png` - iPhone SE, smallest mobile
- `mobile-small-375px.png` - Standard iPhone size
- `mobile-large-428px.png` - Large mobile (breakpoint transition)
- `tablet-768px.png` - Tablet view
- `laptop-1024px.png` - Small laptop
- `desktop-1280px.png` - Standard desktop
- `desktop-large-1440px.png` - Large desktop

---

## Technical Implementation Notes

### Detected Patterns

1. **No mobile/desktop specific classes detected** - likely using CSS media queries exclusively
2. **Fluid container system** - no fixed max-widths, containers span full viewport
3. **Proportional scaling** - elements scale with viewport rather than jumping at breakpoints
4. **Progressive enhancement** - mobile-first approach with desktop enhancements

### CSS Media Query Strategy (Inferred)

```css
/* Mobile First (Base Styles) */
.cta-button {
  width: 100%;
  font-size: 23.86px;
  padding: /* fluid */;
}

/* Transitional (~400px+) */
@media (min-width: 428px) {
  .cta-button {
    width: auto;
    max-width: 400px;
  }
}

/* Tablet/Desktop (768px+) */
@media (min-width: 768px) {
  body {
    font-size: 15px; /* up from 12px */
  }

  .cookie-buttons {
    max-width: 200px;
  }
}
```

---

## Summary Answer to Your Questions

### 1. Breakpoints Used
- **Primary mobile breakpoint:** 375-428px (main CTA transitions here)
- **Secondary tablet breakpoint:** 768px (typography and layout enhancements)
- **No strict breakpoints at:** 320px, 1024px, 1280px (progressive scaling instead)

### 2. Button Full-Width Transition
- **Full-width:** ≤375px
- **Fixed/Max-width:** ≥428px
- **Transition occurs between:** 375px and 428px

### 3. Layout Shift (Mobile to Desktop)
- **Primary shift:** 375-428px (mobile → transitional)
- **Secondary shift:** 768px (transitional → desktop)

### 4. Mobile-Specific Behaviors
- Full-width CTAs on small screens (≤375px)
- Stacked form layouts on mobile
- Proportional button scaling (124px @ 320px → 200px @ 768px)
- Font size increase at tablet breakpoint (12px → 15px)
- Conditional form rendering (8 forms → 6 forms at 428px)
- No max-width constraints on containers (fluid design)

---

**Analysis Complete**
Full data available in: `/Users/ryanbrazzell/boundless-os-template-2/responsiveness-analysis.json`
