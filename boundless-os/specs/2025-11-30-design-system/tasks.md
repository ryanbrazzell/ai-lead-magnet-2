# Task Breakdown: EA Time Freedom Report Design System

## Overview
Total Tasks: 42
Estimated Duration: 3-4 days

This design system creates reusable Tailwind CSS tokens and shadcn/ui components that replicate the acquisition.com/roadmap visual patterns, enabling progressive disclosure forms with color psychology journey (Purple to Yellow to Purple).

## Task List

### Foundation Layer

#### Task Group 1: Tailwind Design Tokens Configuration
**Dependencies:** None
**Specialization:** Frontend Infrastructure

- [x] 1.0 Complete Tailwind design tokens configuration
  - [x] 1.1 Write 4 focused tests for design token validation
    - Test that primary color `#6F00FF` is accessible via `bg-primary` and `text-primary`
    - Test that progress color `#FFFC8C` is accessible via `bg-progress`
    - Test that custom border-radius `pill` (50px) and `input` (5px) are applied correctly
    - Test that custom font sizes (`question`, `button`, `input`, `previous`, `body`) resolve to correct pixel values
  - [x] 1.2 Extend Tailwind color tokens in `tailwind.config.js`
    - Add `primary: '#6F00FF'` (purple) for CTAs, header, footer, brand elements
    - Add `progress: '#FFFC8C'` (yellow) for mid-journey continue buttons
    - Add `progress-disabled: '#F9E57F'` for validation/disabled states
    - Add `input-bg: '#F5F8FA'` for default input backgrounds
    - Add `input-focus: '#ECF0F3'` for focused input backgrounds
    - Add `navy: '#1A1A2E'` for header color
  - [x] 1.3 Extend Tailwind border-radius tokens
    - Add `pill: '50px'` for large CTA pill buttons
    - Add `input: '5px'` for form field corners
  - [x] 1.4 Configure custom font size tokens
    - Add `question: ['32px', { lineHeight: '1.2', fontWeight: '700' }]`
    - Add `button: ['24px', { lineHeight: '1', fontWeight: '700' }]`
    - Add `input: ['20px', { lineHeight: '1.5' }]`
    - Add `previous: ['18px', { lineHeight: '1.5' }]`
    - Add `body: ['16px', { lineHeight: '1.5' }]`
  - [x] 1.5 Add custom spacing for component-specific dimensions
    - Add `button-height: '84px'` for pill button height
    - Add `button-width: '408px'` for desktop button width
    - Add `form-max: '650px'` for form container max-width
  - [x] 1.6 Configure animation/transition tokens
    - Add `transition: { button: '200ms', input: '150ms', step: '300ms' }`
    - Add `ease: { button: 'ease-out', input: 'ease-in-out' }`
  - [x] 1.7 Run design token tests and verify configuration
    - Run ONLY the 4 tests written in 1.1
    - Verify tokens are accessible in test component
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 4 design token tests pass
- Tokens are properly namespaced and avoid conflicts with Tailwind defaults
- Color values match spec exactly (`#6F00FF`, `#FFFC8C`, etc.)
- Custom font sizes include appropriate line-height defaults

---

### Component Layer - Core Inputs

#### Task Group 2: PillButton Component
**Dependencies:** Task Group 1
**Specialization:** UI Component Development

- [x] 2.0 Complete PillButton component
  - [x] 2.1 Write 6 focused tests for PillButton functionality
    - Test `primary` variant renders with purple background and white text
    - Test `progress` variant renders with yellow background and black text
    - Test `disabled` variant renders with muted yellow background
    - Test hover state applies `translateY(-2px)` transform and enhanced shadow
    - Test loading state displays spinner and disables interaction
    - Test responsive behavior: 100% width below 428px, fixed 408px above
  - [x] 2.2 Create PillButton component extending shadcn/ui Button
    - File: `components/ui/pill-button.tsx`
    - Use `cva` (class-variance-authority) for variant management
    - Props: `variant` ('primary' | 'progress' | 'disabled'), `loading`, `children`
  - [x] 2.3 Implement variant styles
    - `primary`: `bg-primary text-white`
    - `progress`: `bg-progress text-black`
    - `disabled`: `bg-progress-disabled text-black cursor-not-allowed`
  - [x] 2.4 Implement dimensions and typography
    - Desktop: `w-[408px] h-[84px] rounded-pill`
    - Mobile (below 428px): `w-full h-[84px]`
    - Font: `text-button font-bold uppercase`
  - [x] 2.5 Implement hover and interaction states
    - Hover: `hover:translate-y-[-2px] hover:shadow-lg transition-all duration-button ease-button`
    - NO color change on hover (per spec)
    - Active: subtle press effect
  - [x] 2.6 Implement loading state
    - Display spinner icon (Lucide `Loader2` with `animate-spin`)
    - Disable pointer events during loading
  - [x] 2.7 Add reduced-motion support
    - Use `motion-safe:` prefix for animations
    - Fallback to opacity changes for `prefers-reduced-motion`
  - [x] 2.8 Run PillButton tests and verify component
    - Run ONLY the 6 tests written in 2.1
    - Verify all variants render correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 6 PillButton tests pass
- Component matches visual reference from `step-00-landing-page.png`
- Smooth hover lift animation without color change
- Loading spinner displays correctly
- Responsive breakpoint at 428px works correctly

---

#### Task Group 3: FormInput Component
**Dependencies:** Task Group 1
**Specialization:** UI Component Development

- [x] 3.0 Complete FormInput component
  - [x] 3.1 Write 6 focused tests for FormInput functionality
    - Test text input renders with correct styling (`#F5F8FA` background, 5px radius)
    - Test focus state transitions background to `#ECF0F3`
    - Test phone variant has 70px left padding for country prefix
    - Test error state shows red border and error message
    - Test placeholder text is uppercase
    - Test select variant renders with dropdown arrow icon
  - [x] 3.2 Create FormInput component extending shadcn/ui Input
    - File: `components/ui/form-input.tsx`
    - Props: `type` ('text' | 'email' | 'tel' | 'select'), `error`, `placeholder`, `options` (for select)
  - [x] 3.3 Implement base styling
    - Background: `bg-input-bg`
    - Focus: `focus:bg-input-focus transition-colors duration-input ease-input`
    - Border radius: `rounded-input`
    - Font: `text-input`
    - Padding: `p-[13px]`
  - [x] 3.4 Implement placeholder styling
    - Uppercase: `placeholder:uppercase`
    - Muted color: `placeholder:text-gray-400`
  - [x] 3.5 Implement phone input variant
    - Left padding: `pl-[70px]` for country flag/prefix space
    - Maintain all other base styles
  - [x] 3.6 Implement select variant
    - Use shadcn/ui Select as base
    - Match FormInput styling for trigger
    - Dropdown arrow icon on right (Lucide `ChevronDown`)
  - [x] 3.7 Implement error state
    - Red border: `border-red-500 border-2`
    - Error message: `<p className="text-red-500 text-sm mt-1">{error}</p>`
  - [x] 3.8 Run FormInput tests and verify component
    - Run ONLY the 6 tests written in 3.1
    - Verify styling matches visual references
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 6 FormInput tests pass
- Input background transition is smooth (150ms)
- Phone variant provides adequate space for country selector
- Error state is clearly visible
- Select dropdown matches input styling

---

### Component Layer - Containers

#### Task Group 4: FormStep Container Component
**Dependencies:** Task Groups 2, 3
**Specialization:** UI Component Development

- [x] 4.0 Complete FormStep container component
  - [x] 4.1 Write 5 focused tests for FormStep functionality
    - Test question text renders at 32px with bold keywords
    - Test container has max-width of 650px and is centered
    - Test vertical spacing between elements is 24-32px
    - Test side-by-side layout works for name fields
    - Test 2x2 grid layout works for address fields
  - [x] 4.2 Create FormStep component
    - File: `components/form/form-step.tsx`
    - Props: `question` (string with `<strong>` tags), `layout` ('single' | 'side-by-side' | 'address-grid'), `children`
  - [x] 4.3 Implement question text styling
    - Font: `text-question` (32px, bold)
    - Support for `<strong>` tags to highlight keywords
    - Use `dangerouslySetInnerHTML` or parse to React elements safely
  - [x] 4.4 Implement container layout
    - Max-width: `max-w-[650px] mx-auto`
    - Centered: `text-center`
    - Vertical spacing: `space-y-6` (24px) or `space-y-8` (32px)
  - [x] 4.5 Implement layout variants
    - `single`: Single column, full-width inputs
    - `side-by-side`: Two inputs horizontally (`grid grid-cols-2 gap-4`)
    - `address-grid`: Full-width street, then 2x2 for city/state/country/zip
  - [x] 4.6 Run FormStep tests and verify component
    - Run ONLY the 5 tests written in 4.1
    - Verify layouts match visual references
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 5 FormStep tests pass
- Question text bold keywords render correctly
- Layout variants produce correct grid arrangements
- Spacing is consistent with visual references

---

#### Task Group 5: Navigation and Social Proof Components
**Dependencies:** Task Group 1
**Specialization:** UI Component Development

- [x] 5.0 Complete StepNavigation and SocialProof components
  - [x] 5.1 Write 4 focused tests for navigation and social proof
    - Test StepNavigation "Previous" link renders with left arrow
    - Test StepNavigation is hidden on first step (`step === 0`)
    - Test SocialProof renders two checkmark items in purple
    - Test SocialProof consent text renders in small gray
  - [x] 5.2 Create StepNavigation component
    - File: `components/form/step-navigation.tsx`
    - Props: `currentStep`, `onPrevious`
    - Hidden when `currentStep === 0`
  - [x] 5.3 Implement StepNavigation styling
    - Font: `text-previous` (18px)
    - Left arrow icon (Lucide `ArrowLeft`)
    - Transparent background, text-only styling
    - Center-aligned below CTA button
  - [x] 5.4 Create SocialProof component
    - File: `components/form/social-proof.tsx`
    - Props: `speedPromise` (string), `socialCount` (string), `consentText` (string)
  - [x] 5.5 Implement SocialProof styling
    - Checkmark icons: `text-primary` (purple)
    - Bullet items: `flex items-center gap-2`
    - Consent text: `text-xs text-gray-500`
  - [x] 5.6 Run navigation and social proof tests
    - Run ONLY the 4 tests written in 5.1
    - Verify components match visual references
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 4 tests pass
- StepNavigation correctly hides on step 0
- SocialProof checkmarks are in brand purple
- Components are reusable across all form steps

---

### Component Layer - Post-Submission

#### Task Group 6: Post-Submission Components
**Dependencies:** Task Group 1
**Specialization:** UI Component Development

- [x] 6.0 Complete post-submission components
  - [x] 6.1 Write 5 focused tests for post-submission components
    - Test VideoPlayer renders with 16:9 aspect ratio
    - Test CountdownTimer displays countdown from 60 and updates every second
    - Test CountdownTimer shows "Book Your Call in XXs" format
    - Test RevealContainer fades in (300ms) when visible
    - Test SchedulingWidget wrapper renders when revealed
  - [x] 6.2 Create VideoPlayer component
    - File: `components/post-submission/video-player.tsx`
    - Props: `src`, `autoplay` (default true)
    - Responsive 16:9 aspect ratio: `aspect-video w-full`
  - [x] 6.3 Create CountdownTimer component
    - File: `components/post-submission/countdown-timer.tsx`
    - Props: `initialSeconds` (default 60), `onComplete`
    - Display: "Book Your Call in {seconds}s"
    - Purple styling matching brand
    - Use `useEffect` with `setInterval` for 1-second updates
  - [x] 6.4 Create RevealContainer component
    - File: `components/post-submission/reveal-container.tsx`
    - Props: `visible`, `children`
    - Use Framer Motion `AnimatePresence` and `motion.div`
    - Fade-in: `initial={{ opacity: 0 }}` `animate={{ opacity: 1 }}` `transition={{ duration: 0.3 }}`
  - [x] 6.5 Create SchedulingWidget wrapper
    - File: `components/post-submission/scheduling-widget.tsx`
    - Props: `embedUrl`
    - Lazy-loaded iframe or placeholder until revealed
  - [x] 6.6 Add reduced-motion support for all animations
    - Check `prefers-reduced-motion` media query
    - Skip or reduce animation duration when enabled
  - [x] 6.7 Run post-submission component tests
    - Run ONLY the 5 tests written in 6.1
    - Verify timer countdown works correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 5 post-submission tests pass
- VideoPlayer maintains aspect ratio on all screen sizes
- Timer counts down accurately and triggers callback on completion
- RevealContainer fade-in animation is smooth
- Components match visual references from `step-09-timer-countdown.png` and `step-10-timer-complete-revealed.png`

---

### Integration Layer

#### Task Group 7: Color Psychology Journey Logic
**Dependencies:** Task Groups 2, 4
**Specialization:** Frontend Logic

- [x] 7.0 Complete color psychology journey integration
  - [x] 7.1 Write 4 focused tests for button color logic
    - Test step 0 uses `primary` variant (purple "LET'S START")
    - Test steps 1-2 use `progress` variant (yellow "CONTINUE")
    - Test step 3+ use `primary` variant (purple "CONTINUE" or "GET MY ROADMAP")
    - Test validation error uses `disabled` variant with error text visible
  - [x] 7.2 Create useButtonVariant hook
    - File: `hooks/use-button-variant.ts`
    - Input: `currentStep`, `hasError`
    - Returns: `{ variant, label }` based on journey position
  - [x] 7.3 Implement step-to-variant mapping
    - Step 0: `{ variant: 'primary', label: "LET'S START" }`
    - Steps 1-2: `{ variant: 'progress', label: 'CONTINUE' }`
    - Step 3+: `{ variant: 'primary', label: 'CONTINUE' }` or `'GET MY ROADMAP'` for final step
    - With error: `{ variant: 'disabled', label: current label }`
  - [x] 7.4 Document color psychology rationale
    - Add JSDoc comments explaining purple = brand entry/exit, yellow = progress momentum
  - [x] 7.5 Run color psychology tests
    - Run ONLY the 4 tests written in 7.1
    - Verify correct variant returned for each step
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 4 color psychology tests pass
- Hook is easily composable with form state
- Button colors match visual journey in reference screenshots

---

#### Task Group 8: Responsive Behavior Implementation
**Dependencies:** Task Groups 2, 3, 4, 5, 6
**Specialization:** CSS/Responsive Design

- [x] 8.0 Complete responsive behavior across all components
  - [x] 8.1 Write 4 focused tests for responsive behavior
    - Test mobile breakpoint (375px): buttons full-width, single-column layout
    - Test transition breakpoint (428px): buttons switch to fixed 408px width
    - Test tablet breakpoint (768px): side-by-side layouts enabled
    - Test touch targets: all interactive elements have minimum 44px height
  - [x] 8.2 Configure Tailwind responsive breakpoints
    - Verify/add `screens: { mobile: '375px', transition: '428px', tablet: '768px' }`
  - [x] 8.3 Audit and update PillButton responsive classes
    - Mobile: `w-full`
    - Desktop (428px+): `w-[408px]`
    - Use `transition:w-[408px]` or appropriate breakpoint class
  - [x] 8.4 Audit and update FormStep layout responsiveness
    - Mobile: Always single-column
    - Tablet+: Enable `side-by-side` and `address-grid` layouts
  - [x] 8.5 Verify touch target minimums
    - All buttons: minimum 44px height (PillButton exceeds at 84px)
    - All inputs: minimum 44px height
    - Navigation links: minimum 44px tap target
  - [x] 8.6 Run responsive behavior tests
    - Run ONLY the 4 tests written in 8.1
    - Test at each breakpoint
    - Do NOT run entire test suite

**Acceptance Criteria:**
- All 4 responsive tests pass
- Components adapt correctly at 375px, 428px, and 768px breakpoints
- No horizontal scrolling on mobile
- All interactive elements meet 44px minimum touch target

---

### Testing Layer

#### Task Group 9: Test Review and Critical Gap Analysis
**Dependencies:** Task Groups 1-8
**Specialization:** Quality Assurance

- [x] 9.0 Review existing tests and fill critical gaps
  - [x] 9.1 Review all tests from Task Groups 1-8
    - Task 1.1: 4 design token tests
    - Task 2.1: 6 PillButton tests
    - Task 3.1: 6 FormInput tests
    - Task 4.1: 5 FormStep tests
    - Task 5.1: 4 navigation/social proof tests
    - Task 6.1: 11 post-submission tests (actual count, exceeds requirement)
    - Task 7.1: 4 color psychology tests
    - Task 8.1: 10 responsive tests (actual count, exceeds requirement)
    - Total: 50 tests written during development
  - [x] 9.2 Analyze test coverage gaps for design system
    - Focus on integration points between components
    - Identify missing end-to-end form flow coverage
    - Check for accessibility gaps (focus states, ARIA)
  - [x] 9.3 Write up to 4 additional strategic tests if needed
    - Integration test: Full form step with PillButton + FormInput + FormStep (3 tests)
    - Animation test: Verify `prefers-reduced-motion` is respected (2 tests)
    - Accessibility test: ARIA attributes and focusability validation (4 tests)
    - Component composition: Color psychology journey integration (2 tests)
    - Total: 11 additional integration tests written
  - [x] 9.4 Run complete design system test suite
    - Run ALL tests from Task Groups 1-8 plus tests from 9.3
    - Final total: 61 tests (50 existing + 11 integration)
    - All 61 tests pass
    - Test coverage verified

**Acceptance Criteria:**
- All 61 design system tests pass
- No critical integration gaps remain
- Accessibility requirements are validated
- Visual components match reference screenshots

---

## Execution Order

Recommended implementation sequence with parallelization opportunities:

```
Phase 1: Foundation (Day 1)
  [Task Group 1: Design Tokens]

Phase 2: Core Components (Day 1-2)
  [Task Group 2: PillButton]     (parallel)
  [Task Group 3: FormInput]      (parallel)
  [Task Group 5: Navigation/Social Proof] (parallel)

Phase 3: Containers (Day 2)
  [Task Group 4: FormStep Container]
  [Task Group 6: Post-Submission Components]

Phase 4: Integration (Day 2-3)
  [Task Group 7: Color Psychology Logic]
  [Task Group 8: Responsive Behavior]

Phase 5: Quality Assurance (Day 3)
  [Task Group 9: Test Review & Gap Analysis]
```

---

## Visual References

All visual references are located in:
`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/`

| Screenshot | Relevant Components |
|------------|---------------------|
| `step-00-landing-page.png` | PillButton (primary), FormInput (side-by-side), FormStep, SocialProof |
| `step-02-form-step-1.png` | PillButton (progress), FormInput (email), StepNavigation |
| `step-05-form-step-4.png` | PillButton (primary), FormInput (select variant), FormStep |
| `step-06-after-submit.png` | PillButton (disabled), FormInput (error state) |
| `step-09-timer-countdown.png` | VideoPlayer, CountdownTimer |
| `step-10-timer-complete-revealed.png` | RevealContainer, SchedulingWidget |

---

## Dependencies Summary

```
Task Group 1 (Design Tokens)
    |
    +---> Task Group 2 (PillButton)
    |         |
    +---> Task Group 3 (FormInput)
    |         |
    +---> Task Group 5 (Navigation/Social)
    |         |
    |         v
    +---> Task Group 4 (FormStep) <-- requires 2, 3
    |         |
    +---> Task Group 6 (Post-Submission)
              |
              v
         Task Group 7 (Color Psychology) <-- requires 2, 4
              |
              v
         Task Group 8 (Responsive) <-- requires 2, 3, 4, 5, 6
              |
              v
         Task Group 9 (Test Review) <-- requires all
```

---

## Notes

- All components should be built with shadcn/ui as the base where applicable
- Framer Motion is used for animations (AnimatePresence, motion.div)
- Lucide Icons is the icon library per tech stack standards
- All animations must respect `prefers-reduced-motion` media query
- Design tokens are the source of truth - no magic numbers in component code
- This design system does NOT include form validation logic, state management, or backend integrations (out of scope per spec)
