# Spec Requirements: Shared Layout Components

## Initial Description

Build reusable page-level layout components for the EA Time Freedom Report rebuild. These components provide consistent structure across all 3 form variants (main, standard, preselected) and the report display page.

**Roadmap Reference:** Item #3 - "Shared Layout Components - Build reusable layout with persistent social proof section, progress indicators, and 'Previous' navigation link component"

## Requirements Discussion

### First Round Questions

**Q1:** What logo should appear in the Header?
**Answer:** Use a placeholder/configurable logo slot. No specific logo file available yet.

**Q2:** What links should appear in the Footer?
**Answer:** Create placeholder links for Privacy Policy, Terms of Service (make up the content/URLs).

**Q3:** What is the layout structure?
**Answer:** Confirmed - Simple Header -> Content -> Footer layout (no sidebar). Match acquisition.com/Hormozi style conversion funnel.

**Q4:** What should be used for the Hero product mockup?
**Answer:** Use placeholder image for now.

**Q5:** What navigation should appear in the Header?
**Answer:** Confirmed - Logo only, no nav links, to keep funnel focused.

**Q6:** How should mobile behavior work?
**Answer:** Footer stacks links vertically on mobile. Header stays simple (logo only, no hamburger menu).

**Q7:** How should tracking scripts be handled?
**Answer:** Handle SEPARATELY from layout components. Layout components should be purely presentational. Tracking is its own concern (Phase 3 of roadmap).

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Current RootLayout - Path: `/tmp/ea-time-freedom-report/app/layout.tsx`
- Tracking components (keep separate): `/tmp/ea-time-freedom-report/app/components/MetaPixel.tsx`
- Tracking utilities (keep separate): `/tmp/ea-time-freedom-report/app/utils/tracking.ts`

**From Design System Spec (already completed):**
- `SocialProof` component - Checkmark bullets with consent text
- `StepNavigation` component - "Previous" link with arrow
- Design tokens for colors, spacing, typography

### Follow-up Questions

No follow-up questions required. User provided comprehensive answers covering all layout requirements.

## Visual Assets

### Files Provided:

No visual files were placed directly in the spec's `planning/visuals/` folder.

### Reference Screenshots Available:

The following reference screenshots exist at `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/`:

- `step-00-landing-page.png`: Full page layout showing header, hero section, initial form, and footer - PRIMARY REFERENCE for layout components
- `step-01-name-fields-filled.png`: Form state showing social proof positioning below form
- `step-02-form-step-1.png`: Form step showing centered layout container
- `step-06-after-submit.png`: Post-submission layout
- `step-10-timer-complete-revealed.png`: Report page layout structure
- `step-12-bottom-completion.png`: Footer section reference

### Visual Insights:

- Header: Navy bar (#1A1A2E) with white logo, minimal/no navigation
- Footer: Purple bar (#6F00FF) with white text links and legal disclaimer
- Content area: White background, centered container
- Form container: Max-width approximately 650px, centered
- Social proof: Persistent below form area
- Hero section: Large headline with product mockup image to the right

## Requirements Summary

### Functional Requirements

**Header Component:**
- Navy bar (#1A1A2E) background color
- Full-width, fixed height
- Configurable logo slot (placeholder initially)
- No navigation links (keeps funnel focused)
- Logo can optionally link to home

**Footer Component:**
- Purple bar (#6F00FF) background color
- White text for links and legal disclaimer
- Placeholder links: Privacy Policy, Terms of Service
- Legal disclaimer text
- Full-width footer
- Mobile: Links stack vertically

**PageLayout Component:**
- Wrapper composing Header + main content area + Footer
- White background default
- Provides consistent max-width container for content
- Handles page-level structural consistency

**FormLayout Component:**
- Centered form container (max-width 650px)
- Persistent SocialProof component below form area
- Vertical spacing and centering
- Used by all form steps across all variants

**HeroSection Component:**
- Large headline with configurable text
- Support for bold keywords in headline
- Product mockup image slot (placeholder initially)
- Responsive image + text layout
- Used on landing page before first form step

### Reusability Opportunities

**From Design System (already built):**
- `SocialProof` component - will be composed into FormLayout
- `StepNavigation` component - available for page-level navigation
- Design tokens - colors, typography, spacing

**Code Patterns to Reference:**
- `/tmp/ea-time-freedom-report/app/layout.tsx` - Current RootLayout structure

### Scope Boundaries

**In Scope:**
- Header component with configurable logo slot
- Footer component with placeholder legal links
- PageLayout wrapper component
- FormLayout with persistent social proof
- HeroSection with headline and image placeholder
- Mobile responsive behavior for all components
- Tailwind styling using established design tokens

**Out of Scope:**
- Tracking scripts (Phase 3 - separate concern)
- Meta Pixel integration
- UTM parameter handling
- Actual logo file (placeholder only)
- Actual product mockup image (placeholder only)
- Real Privacy Policy/Terms of Service content
- Sidebar layouts (confirmed not needed)
- Header navigation links (confirmed not needed)

### Technical Considerations

**Framework:**
- Next.js 14.x with App Router
- React Server Components where appropriate
- TypeScript strict mode

**Styling:**
- Tailwind CSS 3.x
- Custom design tokens from Design System spec
- Colors: Navy (#1A1A2E), Purple (#6F00FF), White
- Mobile-first responsive approach

**Component Architecture:**
- shadcn/ui for accessibility primitives (optional)
- Framer Motion for animations (optional)
- Components should be purely presentational
- Props for configuration (logo, links, headline text)

**Dependencies:**
- Depends on: Design System spec (completed) for primitives
- Required by: Main Form, Standard Form, Preselected Form, Report Display Page

**Integration Points:**
- These layout components wrap all form steps and report page
- Must compose with SocialProof from design system
- Must use design tokens for consistent styling
