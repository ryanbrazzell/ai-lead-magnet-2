# Spec Initialization: Shared Layout Components

## Spec Name
shared-layout

## Spec Path
/Users/ryanbrazzell/boundless-os-template-2/boundless-os/specs/2025-12-01-shared-layout/

## Initial Description

Build reusable page-level layout components for the EA Time Freedom Report rebuild. These components provide consistent structure across all 3 form variants (main, standard, preselected) and the report display page.

**Roadmap Reference:** Item #3 - "Shared Layout Components - Build reusable layout with persistent social proof section, progress indicators, and 'Previous' navigation link component"

## Finalized Decisions

### Header Component
- Navy bar (#1A1A2E) with configurable logo slot (placeholder initially)
- Full-width, consistent height
- **NO navigation links** - keeps funnel focused
- Logo only, no hamburger menu on mobile
- Matches acquisition.com header pattern

### Footer Component
- Purple (#6F00FF) bar with white navigation links
- Legal disclaimer text
- Placeholder links: Privacy Policy, Terms of Service
- Mobile: Links stack vertically
- Full-width footer

### PageLayout
- Wrapper composing Header + content + Footer
- Page-level container constraints
- White background, centered content

### FormLayout
- Centered container (max-width 650px)
- Persistent SocialProof below form area
- Vertical spacing and centering

### HeroSection
- Large headline with bold keyword support
- Product mockup image slot (placeholder initially)
- Landing page specific

### Key Design Decisions
1. **Tracking handled separately** - Layout components are purely presentational. Tracking (Meta Pixel, UTM) is Phase 3 work.
2. **No sidebar** - Simple Header -> Content -> Footer structure matching conversion funnel pattern.
3. **Placeholder assets** - Logo and product mockup use placeholders until real assets available.

## Existing Components (from Design System spec)

The design system has already defined these primitives that layout components will USE:
- `SocialProof` - Checkmark bullets with consent text
- `StepNavigation` - "Previous" link with arrow icon
- `FormStep` - Container with question text and layouts
- `PillButton`, `FormInput` - Core UI components

## Reference Materials

### Analysis Document
`/Users/ryanbrazzell/boundless-os-template-2/ACQUISITION-ROADMAP-ANALYSIS.md`
- Complete UX analysis of acquisition.com/roadmap
- Design specifications for all visual elements
- Color palette, typography, spacing details

### Visual Screenshots
Location: `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/`

**Most relevant for layout components:**
- `step-00-landing-page.png` - Full page layout with header, hero, form, footer
- `step-01-name-fields-filled.png` - Form state showing social proof positioning
- `step-02-form-step-1.png` - Form step showing centered layout
- `step-10-timer-complete-revealed.png` - Post-submission page layout

### Existing Code to Reference
- `/tmp/ea-time-freedom-report/app/layout.tsx` - Current RootLayout structure
- `/tmp/ea-time-freedom-report/app/components/MetaPixel.tsx` - Tracking (keep separate)
- `/tmp/ea-time-freedom-report/app/utils/tracking.ts` - Tracking utilities (keep separate)

### Design System Spec
`/Users/ryanbrazzell/boundless-os-template-2/boundless-os/specs/2025-11-30-design-system/`
- Tailwind configuration tokens
- Component specifications
- Color and typography definitions

### Product Context
- Mission: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/product/mission.md`
- Roadmap: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/product/roadmap.md`
- Tech Stack: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/product/tech-stack.md`

## Tech Stack Constraints

- **Framework:** Next.js 14.x with App Router
- **Styling:** Tailwind CSS 3.x with custom design tokens
- **Components:** shadcn/ui for accessibility primitives
- **Animations:** Framer Motion (optional)
- **TypeScript:** Strict mode

## Dependencies

This spec depends on:
- Design System spec (completed) - provides primitives we compose
- Environment setup (Item #1) - for deployment context

This spec is required by:
- Main Form (Items #7-9)
- Standard Form (Item #10)
- Preselected Form (Items #11-12)
- Report Display Page (Item #13)

## Requirements Status

Requirements gathering complete. See `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/specs/2025-12-01-shared-layout/planning/requirements.md` for full documentation.
