# Design System for EA Time Freedom Report Rebuild

## Raw Concept

Create a comprehensive design system that enables the acquisition.com/roadmap-inspired UI for the EA Time Freedom Report lead magnet rebuild. The design system must:

1. **Adopt acquisition.com visual patterns** - Full purple color palette
2. **Enable progressive disclosure forms** with one question per screen
3. **Support color psychology journey** through form steps (Purple -> Yellow -> Purple)
4. **Provide reusable components** for all three form variants (main, standard, preselected)
5. **Preserve accessibility** via shadcn/ui primitives
6. **Support post-submission flow** with video, timer, and reveal pattern

## Decisions Made

### Brand Color Strategy
**Decision: Fully adopt purple palette**
- Replace existing teal (#00cc6a) with acquisition.com purple (#6F00FF)
- Apply consistently across all form variants and report pages

### Component Library
**Decision: shadcn/ui + Tailwind CSS**
- Use shadcn/ui for accessibility (ARIA, keyboard nav) out of the box
- Customize with acquisition.com design tokens
- Full ownership of component code

### Button Hover/Active States
**Decision: Motion only (match acquisition.com)**
- Lift + shadow on hover
- Color stays static (no darkening)

### Form Validation Styling
**Decision: Acquisition.com style**
- Yellow button color (#F9E57F) indicates error state
- Red inline text for validation messages

### Loading States
**Decision: Animated progress bar**
- Purple → Yellow → Purple color psychology
- Messaging: "Generating your personalized report..."

### Mobile Breakpoints
**Decision: Match acquisition.com responsive behavior**
- ≤375px: Full-width buttons, single column
- 428px: Buttons transition to fixed-width (408px)
- 768px: Font sizes increase, tablet optimizations

### Dark Mode
**Decision: Out of scope**
- Light mode only for initial rebuild

## Key Design Patterns to Implement

### Large Pill Buttons
- Dimensions: 408x84px (desktop), full-width (mobile ≤375px)
- Border radius: 50px (fully rounded pill)
- Font size: 24px
- Padding: 27px vertical, 10px horizontal

### Color System
| Token | Hex | Usage |
|-------|-----|-------|
| Primary Purple | #6F00FF | Brand, start/end CTAs, headers |
| Progress Yellow | #FFFC8C | Mid-journey "CONTINUE" buttons |
| Disabled/Error Yellow | #F9E57F | Validation error states |
| Input Background | #F5F8FA | Form field backgrounds |
| Active Input | #ECF0F3 | Focused input fields |
| Navy Header | #1A1A2E | Dark header bar |
| White | #FFFFFF | Page backgrounds |
| Black | #000000 | Primary text |

### Typography Scale
| Element | Size | Weight |
|---------|------|--------|
| Headlines | 48-52px | Bold |
| Question text | 32-36px | Bold (keywords) |
| Input text | 20px | Regular |
| Button text | 24px | Bold |
| Previous link | 18px | Regular |
| Body text | 15-16px | Regular |

### Form Input Styling
- Background: #F5F8FA
- Padding: 13px
- Border radius: 5px
- Font size: 20px
- Focus: Background changes to #ECF0F3

### Social Proof Component
- Persistent on every form step
- Checkmark bullets pattern
- Positioned below form area
- Consistent placement across steps

### Navigation
- "Previous" link appears after step 1
- Text-only, transparent background
- Left-aligned, 18px font

## Post-Submission Flow Components

### Video Player
- Autoplay on submission complete
- Full-width or prominent placement
- Optimized for fast loading

### Countdown Timer
- 60-second countdown
- Large, prominent display
- Center-aligned
- "Your Report Will Be Revealed In: 00:XX" pattern

### Reveal Animation
- Smooth fade/slide transition
- Download button appears
- Calendar scheduling widget reveals
- Purple CTA for download

### Calendar Widget
- Embedded scheduling (iClosed for EA Time Freedom)
- Revealed after timer completes
- Full calendar interface

## Reference Materials

### Screenshots (12 total)
Location: `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/`

**Form Flow:**
- step-00 through step-06: Form progression

**Post-Submission:**
- step-07 through step-12: Video, timer, reveal, calendar

### Analysis Document
`/Users/ryanbrazzell/boundless-os-template-2/ACQUISITION-ROADMAP-ANALYSIS.md`

### Mobile Responsiveness Report
`/Users/ryanbrazzell/boundless-os-template-2/MOBILE-RESPONSIVENESS-REPORT.md`

## Scope

### In Scope
- Tailwind configuration with design tokens
- shadcn/ui component customization
- Form step components
- Button variants (purple, yellow, disabled)
- Input field components
- Social proof component
- Navigation (Previous link)
- Post-submission components (timer, reveal)
- Mobile responsive behavior

### Out of Scope
- Email templates
- PDF styling (preserved from existing)
- Dark mode
- Landing page hero content (copy/images)
- AI prompt logic
- Backend integrations
