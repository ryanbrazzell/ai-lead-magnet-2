# Specification: EA Time Freedom Report Design System

## Goal

Create a reusable design system with Tailwind CSS tokens and shadcn/ui components that replicate the acquisition.com/roadmap visual patterns, enabling progressive disclosure forms with color psychology journey (Purple to Yellow to Purple) while preserving all existing lead magnet functionality.

## User Stories

- As a founder, I want a polished, conversion-optimized form experience so that leads feel the premium brand quality before any sales conversation
- As a developer, I want reusable, token-based components so that all three form variants (main, standard, preselected) maintain visual consistency with minimal code duplication

## Specific Requirements

**Tailwind Configuration with Design Tokens**
- Define primary color `#6F00FF` (purple) as `primary` token for CTAs, header, footer, brand elements
- Define progress color `#FFFC8C` (yellow) as `progress` token for mid-journey continue buttons
- Define error/disabled color `#F9E57F` as `error` token for validation states
- Define input backgrounds `#F5F8FA` (default) and `#ECF0F3` (focus) as `input-bg` and `input-focus` tokens
- Define navy header color `#1A1A2E` as `navy` token
- Extend border-radius with `pill: 50px` for large CTA buttons and `input: 5px` for form fields
- Configure font sizes: `question: 32px`, `button: 24px`, `input: 20px`, `previous: 18px`, `body: 16px`

**PillButton Component**
- Three variants: `primary` (purple bg, white text), `progress` (yellow bg, black text), `disabled` (muted yellow bg, black text)
- Desktop dimensions: 408px width, 84px height, 50px border-radius
- Mobile behavior: 100% width below 428px breakpoint, maintain 84px height
- Hover state: translateY(-2px) lift + enhanced shadow, NO color change
- Loading state: spinner icon + disabled interaction
- Font: 24px bold, uppercase text

**FormInput Component**
- Support types: text, email, tel, select (dropdown)
- Styling: 20px font, 13px padding, 5px border-radius, `#F5F8FA` background
- Focus state: background transitions to `#ECF0F3`
- Phone input variant: 70px left padding for country flag/prefix display
- Select variant: dropdown arrow icon on right, same base styling
- Placeholder text: uppercase, muted color
- Error state: red border + inline error message below field

**FormStep Container**
- Question text: 32px font with bold keywords (wrap key terms in `<strong>`)
- Single-column centered layout, max-width 650px
- Generous vertical spacing between question, inputs, and button (24-32px gaps)
- Support for single input, side-by-side inputs (name fields), and grid layouts (address fields)
- Address grid: full-width street, then 2x2 grid for city/state/country/zip

**StepNavigation Component**
- "Previous" link: 18px font, left arrow icon, transparent background
- Positioned below the CTA button, center-aligned
- Hidden on first step, visible on all subsequent steps
- Text-only styling, no button chrome

**SocialProof Component**
- Two checkmark bullet items: speed promise and social proof number
- Persistent positioning below form on every step
- Checkmark icons in purple brand color
- Consent/legal text below bullets in small gray text

**Color Psychology Journey Logic**
- Step 0 (landing/name): Purple button "LET'S START"
- Steps 1-2 (email, phone): Yellow button "CONTINUE"
- Step 3+ (address, business): Purple button "CONTINUE" or "GET MY ROADMAP"
- Validation error: Disabled yellow button with red inline error text

**Post-Submission Components**
- VideoPlayer: autoplay wrapper, responsive 16:9 aspect ratio, full-width on mobile
- CountdownTimer: large prominent display "Book Your Call in XXs", purple styling, 60-second countdown
- RevealContainer: fade-in animation (300ms) when timer completes, contains CTA button and calendar
- SchedulingWidget: wrapper for iClosed embed, lazy-loaded or revealed at timer completion

**Responsive Behavior**
- Mobile breakpoint at 375px: full-width buttons, stacked single-column layout
- Transition breakpoint at 428px: buttons switch from full-width to fixed 408px max-width
- Tablet breakpoint at 768px: enable side-by-side field layouts where appropriate
- Touch targets: minimum 44px height for all interactive elements

**Animation Specifications**
- Button hover: 200ms ease-out for lift and shadow transitions
- Input focus: 150ms ease-in-out for background color transition
- Step transitions: 300ms fade for form step changes
- Reveal animation: 300ms fade-in for post-submission content
- Timer: client-side JavaScript countdown with 1-second interval updates
- Respect `prefers-reduced-motion` media query for all animations

## Visual Design

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-00-landing-page.png`**
- Dark navy header bar with white logo, full-width
- Large bold headline with ellipsis styling ("...in under 30 seconds")
- Product mockup image showing purple-themed documents
- Side-by-side First Name / Last Name inputs with light gray backgrounds
- Purple "LET'S START" pill button centered below inputs
- Two checkmark social proof bullets below button
- Legal consent text in small gray below social proof
- Testimonial section with product image and italicized quote
- Purple footer with white navigation links

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-02-form-step-1.png`**
- Question "Where should I **email** it to?" with bold keyword
- Single email input field, full-width within form container
- Yellow "CONTINUE" button (color psychology shift from purple)
- "Previous" link with left arrow below button
- Same social proof and footer persist from landing

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-05-form-step-4.png`**
- Question "Where are you in your **business journey**?" with bold keywords
- Three select dropdowns stacked vertically with labels above each
- Required field indicators (asterisks) on labels
- Purple "GET MY ROADMAP" button (return to brand color for final step)
- Dropdown arrows visible on right side of select inputs

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-06-after-submit.png`**
- Validation error state: muted yellow button color
- Red inline error text "Please complete this required field." below each empty dropdown
- General error message "Please complete all required fields." above button
- Button remains clickable but visually indicates incomplete state

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-09-timer-countdown.png`**
- Video player with autoplay, showing Alex Hormozi presentation
- "Book Your Call in 53s" countdown button below video
- Purple/brand styling on timer button
- Video has yellow subtitle captions overlay

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-10-timer-complete-revealed.png`**
- Video continues playing after timer completion
- Purple CTA button "See If I'm a Fit for a Scaling Workshop" revealed
- Secondary link "No thanks, just take me to the Scaling Course" below button
- "While you're waiting for your Roadmap..." section appears below

## Existing Code to Leverage

**shadcn/ui Button Component**
- Use as base for PillButton, extend with custom variants for primary/progress/disabled
- Leverage built-in loading state patterns and accessibility features
- Override default sizing and border-radius via Tailwind config extensions

**shadcn/ui Input Component**
- Use as base for FormInput text, email, and tel types
- Customize background colors and focus states via Tailwind
- Preserve built-in accessibility labels and error state patterns

**shadcn/ui Select Component**
- Use for dropdown select inputs with custom chevron icon
- Style trigger to match FormInput appearance
- Leverage built-in keyboard navigation and ARIA attributes

**Tailwind CSS Extend Pattern**
- Use `theme.extend` in tailwind.config.js to add design tokens without overriding defaults
- Define semantic color names that map to hex values
- Create custom spacing values only where 8px grid does not suffice (84px button height)

**Framer Motion (from tech stack)**
- Use for step transition animations and reveal effects
- Implement `AnimatePresence` for form step enter/exit animations
- Apply `motion.div` with fade variants for post-submission reveal

## Out of Scope

- Dark mode theme variant (explicitly excluded per requirements)
- Email template styling (preserved from existing system)
- PDF report styling (preserved from existing system)
- Landing page hero content (copy, images, product mockups)
- AI prompt logic and Gemini integration
- Backend API endpoints and integrations (GHL, Mailgun, S3, Zapier)
- Meta Pixel and UTM tracking implementation
- iClosed widget internal configuration
- Form validation logic and state management
- Data persistence and form submission handling
- Phone number country selector logic and formatting
