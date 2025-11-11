# Ryan's UI Style Guide

## Quick Reference for AI Agents

This is a simplified style guide extracted from the comprehensive design principles. Use this as a quick reference when building UI components.

---

## Typography

**Font Family:** Inter, SF Pro, Figtree, or system-ui fallback

**Font Sizes:**
- H1: 36px
- H2: 30px
- H3: 24px
- H4: 20px
- Body: 16px (default)
- Body Small: 14px
- Caption: 12px

**Font Weights:**
- Regular (400)
- Medium (500)
- SemiBold (600)
- Bold (700)
- ❌ Avoid: Ultra-light or thin weights

**Line Heights:**
- Body text: 1.5-1.7
- Headings: 1.2

---

## Colors

**Philosophy:** Keep it simple with neutrals + one primary brand color

**Structure:**
- Neutral grays: 8-12 step scale (for backgrounds, text, borders)
- Primary brand color: For key actions and highlights
- Semantic colors:
  - Success: Green
  - Error: Red
  - Warning: Amber
  - Info: Blue

**Accessibility Rule:** All text/background combinations must pass WCAG AA (4.5:1 contrast ratio)

---

## Spacing

**Base Unit:** 8px

**Spacing Scale:** 4, 8, 12, 16, 24, 32, 48, 64

**Golden Rule:** Use spacing from the scale above. No random numbers like 13px or 27px!

---

## Border Radius

**Small:** 4-6px (for inputs, buttons)
**Medium:** 8-12px (for cards, modals)

---

## Components

### Buttons

**Variants:**
- Primary: High emphasis actions
- Secondary: Medium emphasis
- Tertiary/Ghost: Low emphasis

**States Required:**
- Default
- Hover
- Focus
- Active
- Disabled
- Loading (with spinner)

**Sizes:** Small, Medium, Large

### Forms & Inputs

- Always show visible labels
- Use correct input types (email, number, password, etc.)
- Provide inline validation with clear error messages
- Show success confirmation (checkmark, toast)
- Pre-fill sensible defaults when possible

### Data Tables

- Left-align text
- Right-align numbers
- Bold column headers
- Minimum 44px row height
- Include: sorting, filtering, search
- Hover states on rows
- Action buttons per row (Edit, Delete, View)

---

## Layout Rules

**Visual Hierarchy:** Make the most important thing the most obvious thing

**White Space:** Be generous. More is better than cramped.

**Responsive:** Mobile-first approach

**Main Layout:**
- Persistent left sidebar for navigation
- Main content area
- Optional top bar for search/profile/notifications

---

## Motion & Animation

**Purpose:** Guide attention and communicate state (not decoration!)

**Timing:**
- Micro-feedback: <100ms
- Transitions: 200-300ms
- Page transitions: 400-500ms

**Easing:** Use ease-in-out (avoid linear)

**Accessibility:** Respect "Reduce Motion" OS setting

---

## Accessibility Requirements (Non-Negotiable)

- ✅ Touch targets: Minimum 44×44px
- ✅ Body text: Minimum 14px web
- ✅ WCAG AA contrast ratios
- ✅ Visible focus states
- ✅ Keyboard navigation for all primary flows
- ✅ Semantic HTML with proper ARIA labels

---

## CSS Implementation

**Preferred:** Tailwind CSS (utility-first)

**Golden Rules:**
- Define all values as design tokens
- No magic numbers in code
- Use semantic token names
- Enable JIT mode for performance

---

## Icons

**Family:** Choose ONE icon set and stick with it (Lucide or Heroicons recommended)

**Sizes:** 16, 20, or 24px only

**Rule:** Pair icons with text for ambiguous actions

---

## Quick Checklist Before Shipping

- [ ] Spacing follows 8px grid
- [ ] Typography uses scale (no random sizes)
- [ ] Colors pass WCAG AA contrast
- [ ] All button states implemented
- [ ] Forms have validation and error messages
- [ ] Touch targets are 44×44px minimum
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Loading states exist
- [ ] Animations respect Reduced Motion preference

---

## Module-Specific Patterns

### Data Tables
Use when: Displaying lists of contacts, admin settings, structured data
Key features: Sorting, filtering, search, pagination, row actions

### Moderation Interfaces
Use when: Reviewing/approving content
Key features: Clear approve/reject buttons, status badges, bulk actions, keyboard shortcuts

### Configuration Panels
Use when: Settings pages, admin controls
Key features: Logical grouping, progressive disclosure, sensible defaults, reset options
