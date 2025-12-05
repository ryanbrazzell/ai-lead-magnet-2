# Specification: Shared Layout Components

## Goal

Create reusable page-level layout components (Header, Footer, PageLayout, FormLayout, HeroSection) that provide consistent structure across all EA Time Freedom Report form variants and report pages, matching the acquisition.com/Hormozi conversion funnel aesthetic.

## User Stories

- As a user, I want a consistent, focused conversion experience across all form pages so that I can complete the funnel without distractions
- As a developer, I want composable layout components so that all form variants (main, standard, preselected) and the report page share identical structural patterns with minimal duplication

## Specific Requirements

**Header Component**
- Navy background color using `bg-navy` (#1A1A2E) design token
- Full-width with fixed height (approximately 64-80px)
- Configurable logo slot via `logo` prop (React node or image src)
- Optional `href` prop to make logo clickable (links to home)
- No navigation links (keeps funnel focused on conversion)
- Mobile: Logo remains centered or left-aligned, no hamburger menu

**Footer Component**
- Purple background color using `bg-primary` (#6F00FF) design token
- White text for all content (links, disclaimer)
- Two placeholder links: "Privacy Policy" and "Terms of Service"
- Links accept `href` props for future real URLs (placeholder "#" initially)
- Legal disclaimer text block below links (configurable via prop)
- Full-width footer with generous vertical padding (py-8 to py-12)
- Mobile: Links stack vertically with adequate touch targets (min 44px)
- Desktop: Links display inline horizontally

**PageLayout Component**
- Wrapper composing Header + `<main>` content area + Footer
- Accepts `children` for page content
- White background on main content area (default)
- Content area uses `min-h-screen` minus header/footer for proper viewport fill
- Optional props to hide Header or Footer for special pages
- Provides consistent max-width container (1280px) with horizontal padding

**FormLayout Component**
- Centered form container using `max-w-form` (650px) design token
- Automatic horizontal centering with `mx-auto`
- Persistent SocialProof component rendered below form content
- SocialProof props configurable via FormLayout props or defaults
- Generous vertical padding (py-8 to py-16)
- Accepts `children` for form step content
- Does NOT include Header/Footer (composed inside PageLayout)

**HeroSection Component**
- Large headline text using `text-question` (32px bold) design token
- Support for bold keywords via `headline` prop with JSX or markdown-style formatting
- Product mockup image slot via `imageSrc` and `imageAlt` props (placeholder initially)
- Desktop: Image and text in row layout (image right, text left)
- Mobile: Stacked layout (text above, image below)
- Responsive gap spacing between text and image
- Optional subheadline text prop for secondary copy

## Visual Design

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-00-landing-page.png`**
- Navy header bar spans full viewport width, contains white logo only
- Hero section shows large bold headline with "...in under 30 seconds" pattern
- Product mockup image positioned to right of headline on desktop
- Form container centered below hero, max-width approximately 650px
- Social proof bullets appear directly below form inputs/button
- Purple footer bar at page bottom with white links and legal text
- Testimonial/quote section between main content and footer

**`/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/step-12-bottom-completion.png`**
- Purple footer shows "ACQUISITION.COM" logo on left, nav links center/right
- Secondary row with "DMCA Policy" and "Do Not Sell My Info" links
- Legal disclaimer paragraph in white text, centered, smaller font size
- Footer has adequate vertical padding for comfortable reading

## Existing Code to Leverage

**Design Tokens (`/web/src/lib/design-tokens.ts` and `/web/src/app/globals.css`)**
- `bg-navy` (#1A1A2E) for Header background color
- `bg-primary` (#6F00FF) for Footer background color
- `max-w-form` (650px) for FormLayout container width
- `text-question` (32px bold) for HeroSection headline
- Responsive breakpoints: 375px (mobile), 428px (transition), 768px (tablet)

**SocialProof Component (`/web/src/components/form/social-proof.tsx`)**
- Already built with checkmark bullets and consent text
- Import and compose within FormLayout, passing through props
- Maintains consistent styling with purple checkmarks and gray consent text

**Current RootLayout (`/web/src/app/layout.tsx`)**
- Uses Geist font family with CSS variables
- PageLayout should not replace RootLayout, but be used within page components
- Preserve existing font and base styling configuration

**Tailwind Utility Classes (from globals.css)**
- Use existing custom utilities: `bg-navy`, `bg-primary`, `text-primary`
- Leverage responsive prefixes: `mobile:`, `transition:`, `tablet:` and `md:`/`lg:`
- Follow 8px spacing grid using Tailwind spacing scale

**Lucide Icons (from design system)**
- Available for any icons needed in Header or Footer
- Maintain consistent 16/20/24px sizing per style guide

## Out of Scope

- Tracking scripts and Meta Pixel integration (Phase 3 separate concern)
- UTM parameter handling and preservation
- Actual logo file or final branding assets (placeholder only)
- Actual product mockup image (placeholder only)
- Real Privacy Policy and Terms of Service content/pages
- Real DMCA Policy and Do Not Sell content
- Sidebar layouts or alternative page structures
- Header navigation links or hamburger menu
- Sticky/fixed header behavior (simple static header)
- Footer newsletter signup or social media links
- Testimonial or quote sections (separate component concern)
