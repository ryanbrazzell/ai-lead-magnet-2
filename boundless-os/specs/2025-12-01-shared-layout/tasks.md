# Task Breakdown: Shared Layout Components

## Overview
Total Tasks: 5 Task Groups, ~25 sub-tasks

This spec creates reusable page-level layout components (Header, Footer, PageLayout, FormLayout, HeroSection) that provide consistent structure across all EA Time Freedom Report form variants and report pages, matching the acquisition.com/Hormozi conversion funnel aesthetic.

## Task List

### Foundation Components (Simple to Complex)

#### Task Group 1: Header Component
**Dependencies:** None (uses existing design tokens)

- [x] 1.0 Complete Header component
  - [x] 1.1 Write 2-4 focused tests for Header component
    - Test renders with placeholder logo
    - Test logo is clickable when `href` prop provided
    - Test navy background color applied (`bg-navy`)
    - Test responsive behavior (logo positioning)
  - [x] 1.2 Create Header component file structure
    - Create `/web/src/components/layout/header.tsx`
    - Define TypeScript interface for props:
      - `logo?: React.ReactNode | string` (React node or image src)
      - `href?: string` (optional link for logo)
  - [x] 1.3 Implement Header layout and styling
    - Navy background using `bg-navy` (#1A1A2E) design token
    - Full-width with fixed height (h-16 to h-20, approximately 64-80px)
    - Horizontal padding for content alignment (px-4 to px-6)
    - White text/logo color for contrast
  - [x] 1.4 Implement logo slot functionality
    - Render string prop as `<img>` element
    - Render React node prop directly
    - Default to placeholder text "LOGO" if no prop provided
    - Wrap in `<a>` tag when `href` prop is provided
  - [x] 1.5 Add accessibility attributes
    - Semantic `<header>` element
    - Logo link has appropriate aria-label
    - Proper focus states for interactive elements
  - [x] 1.6 Ensure Header tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify component renders correctly

**Acceptance Criteria:**
- The 2-4 tests written in 1.1 pass
- Header displays with navy background using design token
- Logo slot accepts both string (image src) and React node
- Logo is optionally clickable via `href` prop
- No navigation links (keeps funnel focused)
- Mobile: Logo centered or left-aligned, no hamburger menu

**Visual Reference:** `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-00-landing-page.png`

---

#### Task Group 2: Footer Component
**Dependencies:** None (uses existing design tokens)

- [x] 2.0 Complete Footer component
  - [x] 2.1 Write 2-4 focused tests for Footer component
    - Test renders with purple background (`bg-primary`)
    - Test placeholder links render (Privacy Policy, Terms of Service)
    - Test disclaimer text renders
    - Test responsive behavior (links stack on mobile)
  - [x] 2.2 Create Footer component file structure
    - Create `/web/src/components/layout/footer.tsx`
    - Define TypeScript interface for props:
      - `privacyHref?: string` (default "#")
      - `termsHref?: string` (default "#")
      - `disclaimer?: string` (legal disclaimer text)
  - [x] 2.3 Implement Footer layout and styling
    - Purple background using `bg-primary` (#6F00FF) design token
    - Full-width with generous vertical padding (py-8 to py-12)
    - White text for all content (`text-white`)
    - Centered content with max-width container
  - [x] 2.4 Implement footer links section
    - Two links: "Privacy Policy" and "Terms of Service"
    - Links accept `href` props (placeholder "#" initially)
    - Desktop: Links display inline horizontally with gap
    - Mobile: Links stack vertically
    - Minimum touch target size (min-h-11, approximately 44px)
  - [x] 2.5 Implement disclaimer text block
    - Configurable via `disclaimer` prop
    - Smaller font size (text-xs or text-sm)
    - Centered alignment
    - Adequate line-height for readability
    - Default placeholder text if no prop provided
  - [x] 2.6 Add accessibility attributes
    - Semantic `<footer>` element
    - Links have descriptive text
    - Proper focus states (visible on purple background)
  - [x] 2.7 Ensure Footer tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify component renders correctly

**Acceptance Criteria:**
- The 2-4 tests written in 2.1 pass
- Footer displays with purple background using design token
- White text for all content
- Privacy Policy and Terms of Service links render
- Links accept `href` props for future real URLs
- Legal disclaimer text displays below links
- Mobile: Links stack vertically with adequate touch targets (min 44px)
- Desktop: Links display inline horizontally

**Visual Reference:** `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-12-bottom-completion.png`

---

#### Task Group 3: HeroSection Component
**Dependencies:** None (uses existing design tokens)

- [x] 3.0 Complete HeroSection component
  - [x] 3.1 Write 2-4 focused tests for HeroSection component
    - Test headline text renders with correct styling
    - Test image placeholder renders with alt text
    - Test responsive layout (row on desktop, stack on mobile)
    - Test optional subheadline renders when provided
  - [x] 3.2 Create HeroSection component file structure
    - Create `/web/src/components/layout/hero-section.tsx`
    - Define TypeScript interface for props:
      - `headline: React.ReactNode` (supports JSX for bold keywords)
      - `subheadline?: string` (optional secondary copy)
      - `imageSrc?: string` (product mockup image)
      - `imageAlt?: string` (alt text for image)
  - [x] 3.3 Implement headline styling
    - Large headline using `text-question` (32px bold) design token
    - Support for bold keywords via JSX in `headline` prop
    - Example: `<>Get Your Free <strong>Personalized</strong> Report</>`
  - [x] 3.4 Implement image slot
    - Accept `imageSrc` and `imageAlt` props
    - Render placeholder div with border if no image provided
    - Responsive image sizing
  - [x] 3.5 Implement responsive layout
    - Desktop (md:+): Flex row layout (text left, image right)
    - Mobile: Stacked layout (text above, image below)
    - Responsive gap spacing between text and image (gap-8 to gap-12)
    - Max-width container for content (max-w-6xl or similar)
  - [x] 3.6 Add optional subheadline
    - Renders below main headline when provided
    - Smaller font size than headline (text-lg or text-xl)
    - Muted color for hierarchy
  - [x] 3.7 Ensure HeroSection tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify component renders correctly

**Acceptance Criteria:**
- The 2-4 tests written in 3.1 pass
- Large headline displays using `text-question` design token
- Bold keywords supported via JSX in headline prop
- Product mockup image slot works (placeholder initially)
- Desktop: Image and text in row layout (image right, text left)
- Mobile: Stacked layout (text above, image below)
- Optional subheadline text renders when provided

**Visual Reference:** `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-00-landing-page.png` (hero section with headline and product mockup)

---

### Composed Layout Components

#### Task Group 4: FormLayout Component
**Dependencies:** Task Groups 1-3 (for pattern consistency), existing SocialProof component

- [x] 4.0 Complete FormLayout component
  - [x] 4.1 Write 2-4 focused tests for FormLayout component
    - Test renders children content
    - Test SocialProof component appears below children
    - Test centered layout with max-width constraint
    - Test SocialProof props can be customized
  - [x] 4.2 Create FormLayout component file structure
    - Create `/web/src/components/layout/form-layout.tsx`
    - Define TypeScript interface for props:
      - `children: React.ReactNode` (form step content)
      - `speedPromise?: string` (SocialProof prop override)
      - `socialCount?: string` (SocialProof prop override)
      - `consentText?: string` (SocialProof prop override)
      - `showSocialProof?: boolean` (default true)
  - [x] 4.3 Implement FormLayout container
    - Centered form container using `max-w-form` (650px) design token
    - Automatic horizontal centering with `mx-auto`
    - Generous vertical padding (py-8 to py-16)
    - Full width on mobile, constrained on larger screens
  - [x] 4.4 Integrate SocialProof component
    - Import existing SocialProof from `/web/src/components/form/social-proof.tsx`
    - Render below children content
    - Pass through configurable props with sensible defaults:
      - Default speedPromise: "Get Your Report in Less than 60 Seconds"
      - Default socialCount: "Trusted by Business Owners Worldwide"
      - Default consentText: (standard consent language)
    - Optional `showSocialProof` prop to hide if needed
  - [x] 4.5 Ensure FormLayout tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Verify component renders correctly

**Acceptance Criteria:**
- The 2-4 tests written in 4.1 pass
- Centered form container using `max-w-form` (650px) design token
- Children content renders within container
- SocialProof component renders below form content
- SocialProof props configurable via FormLayout props
- Does NOT include Header/Footer (composed inside PageLayout)

**Existing Code to Leverage:** `/web/src/components/form/social-proof.tsx`

---

#### Task Group 5: PageLayout Component
**Dependencies:** Task Groups 1-2 (Header and Footer components)

- [x] 5.0 Complete PageLayout component
  - [x] 5.1 Write 2-4 focused tests for PageLayout component
    - Test renders Header, main content, and Footer
    - Test children render in main content area
    - Test Header can be hidden via prop
    - Test Footer can be hidden via prop
  - [x] 5.2 Create PageLayout component file structure
    - Create `/web/src/components/layout/page-layout.tsx`
    - Define TypeScript interface for props:
      - `children: React.ReactNode` (page content)
      - `showHeader?: boolean` (default true)
      - `showFooter?: boolean` (default true)
      - `logo?: React.ReactNode | string` (passed to Header)
      - `logoHref?: string` (passed to Header)
      - `footerDisclaimer?: string` (passed to Footer)
  - [x] 5.3 Implement PageLayout structure
    - Wrapper composing Header + `<main>` content area + Footer
    - White background on main content area (default)
    - Flexbox column layout for proper stacking
    - Min-height screen for viewport fill
  - [x] 5.4 Implement content area styling
    - `<main>` element for semantic structure
    - Flex-grow to fill available space between header/footer
    - Max-width container (1280px) with horizontal padding
    - Centered content using `mx-auto`
  - [x] 5.5 Implement optional Header/Footer visibility
    - `showHeader` prop (default true) controls Header rendering
    - `showFooter` prop (default true) controls Footer rendering
    - Pass through logo props to Header component
    - Pass through disclaimer prop to Footer component
  - [x] 5.6 Ensure PageLayout tests pass
    - Run ONLY the 2-4 tests written in 5.1
    - Verify component renders correctly

**Acceptance Criteria:**
- The 2-4 tests written in 5.1 pass
- Wrapper composes Header + main content area + Footer
- Children render in main content area
- White background on main content area
- Content area fills viewport minus header/footer
- Optional props to hide Header or Footer
- Consistent max-width container (1280px) with horizontal padding

---

### Testing & Integration

#### Task Group 6: Test Review & Integration Testing
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and verify integration
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 2-4 tests for Header (Task 1.1) - 6 tests found
    - Review the 2-4 tests for Footer (Task 2.1) - tests were missing, created 7 tests
    - Review the 2-4 tests for HeroSection (Task 3.1) - 4 tests found
    - Review the 2-4 tests for FormLayout (Task 4.1) - 5 tests found
    - Review the 2-4 tests for PageLayout (Task 5.1) - 4 tests found
    - Total existing tests: 26 unit tests + 6 integration tests = 32 tests
  - [x] 6.2 Analyze test coverage gaps for layout components
    - Identified missing Footer tests - created footer.test.tsx with 7 tests
    - Identified missing integration tests for component composition
    - Verified responsive behavior classes are tested
    - Verified design token usage is tested in each component
  - [x] 6.3 Write up to 6 additional integration tests if needed
    - Test full page composition: PageLayout + HeroSection + FormLayout
    - Test props pass through from PageLayout to Header/Footer
    - Test accessibility - semantic HTML structure with landmarks
    - Test design tokens applied consistently across all components
    - Test components compose with proper flexbox structure
    - Test FormLayout integrates with PageLayout when SocialProof is hidden
  - [x] 6.4 Create index export file
    - Created `/web/src/components/layout/index.ts`
    - Exports: Header, Footer, HeroSection, FormLayout, PageLayout
    - Exports all TypeScript interfaces for props
  - [x] 6.5 Run all layout component tests
    - Ran tests for all layout components
    - All 32 tests pass (6 test files)
    - Verified all components work together correctly

**Acceptance Criteria:**
- All layout component tests pass (32 tests total)
- Components compose correctly together
- Responsive behavior works across breakpoints
- Design tokens applied consistently
- Clean export structure for consuming components

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Header Component** - Standalone, no dependencies
2. **Task Group 2: Footer Component** - Standalone, no dependencies
3. **Task Group 3: HeroSection Component** - Standalone, no dependencies
4. **Task Group 4: FormLayout Component** - Depends on existing SocialProof
5. **Task Group 5: PageLayout Component** - Composes Header and Footer
6. **Task Group 6: Test Review & Integration** - Verifies all components work together

**Note:** Task Groups 1-3 can be implemented in parallel since they have no dependencies on each other.

---

## Files to Create

```
/web/src/components/layout/
  header.tsx          # Task Group 1
  footer.tsx          # Task Group 2
  hero-section.tsx    # Task Group 3
  form-layout.tsx     # Task Group 4
  page-layout.tsx     # Task Group 5
  index.ts            # Task Group 6 (exports)

/web/src/components/layout/__tests__/
  header.test.tsx     # Task Group 1
  footer.test.tsx     # Task Group 2
  hero-section.test.tsx # Task Group 3
  form-layout.test.tsx  # Task Group 4
  page-layout.test.tsx  # Task Group 5
  integration.test.tsx  # Task Group 6
```

---

## Existing Code to Leverage

| Resource | Path | Usage |
|----------|------|-------|
| Design Tokens | `/web/src/lib/design-tokens.ts` | Color values, spacing, typography |
| Global CSS | `/web/src/app/globals.css` | Utility classes: `bg-navy`, `bg-primary`, `max-w-form`, `text-question` |
| SocialProof | `/web/src/components/form/social-proof.tsx` | Compose into FormLayout |
| RootLayout | `/web/src/app/layout.tsx` | Reference for font setup (do not modify) |

---

## Design Token Reference

| Token | Value | Component Usage |
|-------|-------|-----------------|
| `bg-navy` | #1A1A2E | Header background |
| `bg-primary` | #6F00FF | Footer background |
| `max-w-form` | 650px | FormLayout container |
| `text-question` | 32px bold | HeroSection headline |
| `text-primary` | #6F00FF | Accent text color |

---

## Out of Scope (Do Not Implement)

- Tracking scripts and Meta Pixel integration
- UTM parameter handling
- Actual logo file or final branding assets (use placeholder)
- Actual product mockup image (use placeholder)
- Real Privacy Policy and Terms of Service content/pages
- Sidebar layouts or alternative page structures
- Header navigation links or hamburger menu
- Sticky/fixed header behavior
- Footer newsletter signup or social media links
- Testimonial or quote sections
