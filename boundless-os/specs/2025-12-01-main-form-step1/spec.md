# Specification: Main Form - Multi-Step Progressive Disclosure

## Goal
Replace the existing 2-step main form (/) with a 6-screen progressive disclosure experience that captures leads incrementally through Close CRM integration, maximizing conversion while qualifying prospects with revenue and employee data.

## User Stories
- As a business owner, I want to provide my information one question at a time so that the process feels fast and easy rather than overwhelming
- As a sales team member, I want leads captured progressively in Close CRM so that I have partial lead data even if users don't complete the entire form

## Specific Requirements

**6-Screen Progressive Flow with Client-Side Transitions**
- All 6 screens render within single page component with no page reloads between steps
- Use React state to track current screen number (1-6) and conditionally show/hide screen content
- Smooth 300ms fade transitions between screens using Framer Motion or CSS transitions
- All form data preserved in component state as user navigates forward/backward
- Each screen has single-question focus to minimize cognitive load
- Screen progression only occurs after current screen validates successfully

**Screen 1: Name Collection with Lead Creation**
- Question text: "What's your name?"
- Two text inputs: First Name and Last Name with uppercase placeholder styling
- 2-column grid layout on tablet+ (768px), single column on mobile
- Purple "Let's Start" button using PillButton primary variant
- Required field validation for both first and last name
- On successful validation: POST to Next.js API route that creates lead in Close CRM
- Store returned lead_id in component state for subsequent updates
- Loading state on button during API call with disabled interaction

**Screen 2: Email Collection with Lead Update**
- Question text: "Where should I email it to?"
- Single email input with "BUSINESS EMAIL ADDRESS" placeholder
- Yellow "Continue" button using PillButton progress variant
- "Previous" link appears above social proof, returns to Screen 1 without data loss
- Email format validation with helpful error message
- On successful validation: PUT to Next.js API route that updates lead with email
- Non-blocking API call - log errors but allow progression to Screen 3

**Screen 3: Phone Collection with Lead Update**
- Question text: "What is your phone number?"
- Single text input with "+1" visible/pre-filled (no country code dropdown)
- Yellow "Continue" button using PillButton progress variant
- "Previous" link returns to Screen 2
- Phone validation: minimum 10 digits, accepts formats (123) 456-7890 or 123-456-7890 or 1234567890
- On successful validation: PUT to Next.js API route that updates lead with phone
- Non-blocking API call - log errors but allow progression to Screen 4

**Screen 4: Employee Count Collection**
- Question text: "How many full-time employees do you have?"
- Single number input or text input with numeric validation
- Yellow "Continue" button using PillButton progress variant
- "Previous" link returns to Screen 3
- Required positive number validation
- On successful validation: PUT to Next.js API route that updates lead custom field (custom.cf_employees)
- Non-blocking API call - log errors but allow progression to Screen 5

**Screen 5: Annual Revenue Collection**
- Question text: "What is your annual business revenue?"
- Dropdown select using FormInput type="select" with 8 revenue range options
- Options: Under $100k, $100k-$250k, $250k-$500k, $500k-$1M, $1M-$3M, $3M-$10M, $10M-$30M, $30M+
- Yellow "Continue" button using PillButton progress variant
- "Previous" link returns to Screen 4
- Required selection validation
- On successful validation: PUT to Next.js API route that updates lead custom field (custom.cf_revenue)
- Non-blocking API call - log errors but allow progression to Screen 6

**Screen 6: Pain Points Collection and Final Submission**
- Question text: "Where are you and your team stuck in the weeds the most?"
- Multi-line textarea for pain points description
- Purple "Get My EA Roadmap" button using PillButton primary variant
- Button shows "Generating Your Report..." loading text during final submission
- "Previous" link returns to Screen 5
- Optional field (no validation required)
- On submission: PUT to Next.js API route that updates lead with pain points
- After Close API success: optionally fire Zapier webhook with all collected data as backup
- Navigate to report generation/thank you page after all APIs complete

**Persistent Layout Structure**
- PageLayout wrapper with Header and Footer components on all screens
- HeroSection with headline "Get Your Free Personalized EA Roadmap...in under 30 seconds." persistent above form
- FormLayout component (650px centered container) wraps all screen content
- SocialProof component persistent below form content on all screens showing "Get Your Roadmap in Less than 30 Seconds" and "Requested by over 250,000 Business Owners"
- Testimonial section with Alex Hormozi quote below SocialProof

**Validation and Error Handling**
- Validate fields on blur to show immediate feedback
- Validate entire screen on button click before allowing progression
- Display inline error messages below fields in red text with specific remediation guidance
- Clear errors automatically when user corrects invalid input
- Prevent screen transition until all required fields on current screen are valid
- Screen 1 API failure: block progression, show error message, provide retry option
- Screens 2-6 API failures: log to console, allow user to continue (non-blocking)

**Navigation and State Management**
- "Previous" link styled as text link (not button) with left arrow icon
- Previous navigation decrements screen counter by 1, shows previous screen
- All field values retained when navigating backward or forward
- No data loss during entire flow - state persists until final submission or page refresh
- Track validation errors per field in component state
- Track loading states per screen to prevent duplicate submissions

**Close CRM API Integration**
- Create two Next.js API routes: /api/close/create-lead and /api/close/update-lead
- Routes proxy to Close CRM API to protect API key server-side
- Use CLOSE_API_KEY environment variable for authentication
- Screen 1: POST /api/v1/lead/ with name field combined from first and last
- Screens 2-6: PUT /api/v1/lead/{lead_id}/ with contacts array or custom fields
- Email/phone stored in contacts[0].emails[0].email and contacts[0].phones[0].phone
- Employees and revenue stored in custom fields like custom.cf_employees
- Pain points stored in custom field or note field

## Visual Design

**roadmap-final-analysis/step-00-landing-page.png**
- Large centered headline with "$100M Scaling Roadmap" emphasizing value proposition
- Single-column centered layout approximately 400-500px wide for inputs
- First Name and Last Name fields side-by-side on desktop in light gray background (#F5F8FA)
- Purple "LET'S START" button (408x84px pill shape) with high contrast
- Generous white space above and below form elements (32-48px vertical spacing)
- Social proof text directly below button: "Get Your Roadmap in Less than 30 Seconds"
- Testimonial section with Alex Hormozi quote below social proof
- Clean typography hierarchy: large bold headline, smaller question text, input placeholders in uppercase

**roadmap-final-analysis/step-02-form-step-1.png**
- Question "Where should I email it to?" with "email" in bold
- Single email input field centered, full-width within container
- Yellow "CONTINUE" button (#FFFC8C) replacing purple for mid-journey momentum
- "Previous" text link with left arrow positioned above social proof
- Same social proof persistent: "Get Your Roadmap in Less than 30 Seconds" and "Requested by over 250,000 Business Owners"
- Consistent spacing and layout structure from Screen 1

**roadmap-final-analysis/step-03-form-step-2.png**
- Question "What is your phone number?" with "phone number" in bold
- Phone input with small flag icon on left side and "+1" country code visible
- Yellow "CONTINUE" button maintains progress variant styling
- "Previous" link maintains same positioning and styling
- Same social proof and testimonial section persistent
- Input field maintains same background color and border radius (5px) as previous screens

**roadmap-final-analysis/step-05-form-step-4.png**
- Question "Where are you in your business journey?" with "business journey" in bold
- Three dropdown select fields stacked vertically for business qualification questions
- Purple "GET MY ROADMAP" button returns for final conversion action
- "Previous" link maintains consistency
- Dropdown fields use same styling as text inputs with chevron indicator
- Final screen uses completion color (purple) to signal end of journey

## Existing Code to Leverage

**PillButton component (src/components/ui/pill-button.tsx)**
- Reuse exactly as-is for all 6 screens with primary and progress variants
- Primary variant (purple #6F00FF) for Screen 1 "Let's Start" and Screen 6 "Get My EA Roadmap"
- Progress variant (yellow #FFFC8C) for Screens 2-5 "Continue" buttons
- Built-in loading state with spinner for API calls and proper accessibility
- Responsive sizing: full width mobile, 408px fixed desktop at 428px breakpoint

**FormInput component (src/components/ui/form-input.tsx)**
- Reuse for text, email, and tel input types with built-in error display
- Select variant available for revenue dropdown on Screen 5
- Uppercase placeholder styling matches design reference
- Background color transitions (#F5F8FA to #ECF0F3 on focus) match visual design
- 44px minimum touch target and error state with red border already built

**FormStep component (src/components/form/form-step.tsx)**
- Reuse as container for each screen's question and inputs
- Supports side-by-side layout for Screen 1 name fields (2-column grid on tablet+)
- Single layout for Screens 2-6 (one input per screen)
- Question text with bold keyword support using strong tags
- 650px max-width centered container with proper responsive behavior

**FormLayout component (src/components/layout/form-layout.tsx)**
- Reuse as wrapper for entire multi-step form flow
- 650px centered container with SocialProof component persistent below
- Configurable social proof text via speedPromise and socialCount props
- Integrates seamlessly with PageLayout for Header/Footer structure

**Zapier webhook API route (src/app/api/zapier/simplified/route.ts)**
- Reference pattern for creating Close CRM API routes
- Non-blocking error handling pattern (log errors, return success)
- Environment variable pattern for API keys and POST request handling
- Use similar structure for /api/close/create-lead and /api/close/update-lead routes

## Out of Scope
- Standard Form (/standard) with all questions on one screen - separate future spec
- Preselected Form feature - deleted from roadmap entirely
- Title field (CEO, Founder, etc.) - removed from data collection
- Company Website field - may appear in Standard Form only
- Shipping Address collection - not needed for digital report delivery
- Report generation and PDF creation logic - covered in separate spec (Item #9)
- Thank you page or post-submission flow design - separate spec
- Meta Pixel tracking integration - Phase 3 future work
- UTM parameter capture and storage - Phase 3 future work
- A/B testing variants or conversion optimization experiments
- Email delivery of generated report - separate spec
- Calendar scheduling integration - separate spec
- Multi-language or internationalization support
- User authentication or login functionality
- Lead assignment or routing logic in Close CRM
- Sales team notification system
