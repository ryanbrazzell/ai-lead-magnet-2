# Shared Layout Components for EA Time Freedom Report Rebuild

## Raw Concept

Build reusable page-level layout components that wrap the form steps and report display, providing consistent structure across all 3 form variants (main, standard, preselected) and the report page. These components sit ABOVE the design system primitives and compose them into complete page sections.

## Context

This is **Roadmap Item #3** from the Phase 1: Core Infrastructure work. The design system (Item #2) has been completed and provides the low-level primitives:
- `SocialProof` - Checkmark bullets with consent text
- `StepNavigation` - "Previous" link with arrow icon
- `FormStep` - Container with question text and layouts
- `PillButton`, `FormInput` - Core UI components

This spec focuses on the **page-level structural components** that:
1. Wrap content in consistent header/footer chrome
2. Provide the hero section for landing pages
3. Center form content with persistent social proof
4. Ensure mobile responsiveness at the layout level

## Components to Build

### 1. Header Component
- Navy bar (#1A1A2E) with configurable logo slot (placeholder initially)
- Full-width, fixed height
- **No navigation links** - keeps funnel focused
- Logo only, no hamburger menu on mobile

### 2. Footer Component
- Purple (#6F00FF) bar with white navigation links
- Legal disclaimer text
- Placeholder links: Privacy Policy, Terms of Service
- Full-width footer matching acquisition.com pattern
- Mobile: Links stack vertically

### 3. PageLayout
- Wrapper that includes Header + main content + Footer
- Handles page-level structural consistency
- Provides consistent max-width container for content
- White background default

### 4. FormLayout
- Centered form container (max-width 650px)
- Persistent `SocialProof` component below form area
- Handles vertical spacing and centering
- Used by all form steps across all variants

### 5. HeroSection
- Large headline with configurable text (bold keywords support)
- Product mockup image slot (placeholder initially)
- Responsive image + text layout
- Used on landing page before first form step

## Key Design Decisions

1. **Tracking handled separately** - Layout components are purely presentational. Meta Pixel and UTM tracking are Phase 3 concerns.
2. **No sidebar** - Simple Header -> Content -> Footer structure matching conversion funnel pattern.
3. **Placeholder assets** - Logo and product mockup use placeholders until real assets are available.
4. **Mobile-first responsive** - Footer stacks vertically, header stays minimal.

## Why This Spec Matters

Without shared layout components, each form variant and the report page would duplicate:
- Header/footer markup and styling
- Page-level container constraints
- Social proof positioning
- Responsive layout logic

By extracting these into reusable components, we:
1. Maintain visual consistency across all pages
2. Reduce code duplication
3. Make design updates propagate automatically
4. Simplify individual form step implementations

## Reference Materials

- Analysis: `/Users/ryanbrazzell/boundless-os-template-2/ACQUISITION-ROADMAP-ANALYSIS.md`
- Screenshots: `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/`
- Design System Spec: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/specs/2025-11-30-design-system/`
- Product Mission: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/product/mission.md`

## Existing Code to Reference

- `/tmp/ea-time-freedom-report/app/layout.tsx` - Current RootLayout structure
- `/tmp/ea-time-freedom-report/app/components/MetaPixel.tsx` - Tracking (keep separate)
- `/tmp/ea-time-freedom-report/app/utils/tracking.ts` - Tracking utilities (keep separate)

## Requirements Status

Requirements gathering complete. Full documentation available at:
`/Users/ryanbrazzell/boundless-os-template-2/boundless-os/specs/2025-12-01-shared-layout/planning/requirements.md`
