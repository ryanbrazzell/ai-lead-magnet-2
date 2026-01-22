# Acquisition.com Roadmap Lead Magnet - Complete UX Analysis

**URL:** https://www.acquisition.com/roadmap
**Analysis Date:** November 30, 2024
**Total Form Steps:** 5 steps (6 including initial landing)

---

## Executive Summary

The Acquisition.com roadmap lead magnet is a multi-step form designed to capture qualified business owner leads through progressive disclosure. The form collects increasingly detailed information across 5 steps, starting with basic contact info and ending with business qualification questions. The experience is optimized for conversion through visual consistency, smooth transitions, and strategic use of color psychology.

**Key Characteristics:**
- Single-column, centered layout throughout
- Consistent hero section with personalized headline
- Progressive form steps (one question at a time)
- Strategic button color changes to indicate progress/completion
- Social proof elements (testimonials, usage stats)
- Mobile-responsive design

---

## 1. Landing Page Analysis

### Hero Section

**Headline:**
"Get Your Free Personalized $100M Scaling Roadmap...in under 30 seconds."

**Design Elements:**
- Dark navy header bar (#1A1A2E approximate) with white ACQUISITION.COM logo
- Banner notification: "Celebrate Black Friday & One Year Anniversary of Scaling Roadmap. The Best Gifts Are Free."
- Hero headline in bold black text, large typography
- Visual product preview: 3D mockup showing purple-themed roadmap documents
- Clean white background

**Initial Form Fields:**

**Question:** "What's your name?"

**Fields:**
- First Name (text input)
  - Placeholder: "FIRST NAME"
  - Background: Light blue-gray (#F5F8FA)
  - Font size: 20px
  - Padding: 13px
  - Border radius: 5px

- Last Name (text input)
  - Placeholder: "LAST NAME"
  - Same styling as First Name

**Call-to-Action Button:**
- Text: "LET'S START"
- Background: Purple (#6F00FF - signature brand color)
- Text color: White
- Font size: 23.86px (approximately 24px)
- Padding: 27px vertical, 10px horizontal
- Border radius: 50px (fully rounded pill shape)
- Width: 408px
- Height: 84px
- No disabled state (always active)

**Social Proof Elements:**

1. **Checkmark bullets:**
   - "Get Your Roadmap in Less than 30 Seconds"
   - "Requested by over 250,000 Business Owners"

2. **Testimonial (below fold):**
   - $100M Scaling Roadmap visual mockup on left
   - Quote: "I vetted this framework with 3 billionaires who said -in their own words: 'holy shit this is so accurate. I can't believe you took the time to put all this stuff together and organize it.'"
   - Attribution: "- Alex Hormozi"

3. **Legal disclaimer:**
   - Consent language for phone/email contact
   - Privacy policy and terms of service links

**Footer:**
- Purple background (#6F00FF)
- White text with navigation links
- DMCA Policy, Do Not Sell My Info links
- Full legal disclaimer about results and testimonials

---

## 2. Form Flow - Step by Step

### STEP 1: Email Collection

**Question:** "Where should I **email** it to?"
(Note: "email" is bolded for emphasis)

**Input Field:**
- Type: Email
- Placeholder: "BUSINESS EMAIL ADDRESS"
- Styling: Same as name fields (20px, 13px padding, #F5F8FA background)

**Button:**
- Text: "CONTINUE"
- Background: **Yellow (#FFFC8C)** - Color change from purple!
- Text color: Black
- Same dimensions: 408px × 84px
- Border radius: 50px

**Navigation:**
- "Previous" link appears (left-aligned, text-only, transparent background)
- Font size: 18px
- No visible border or background

**UX Notes:**
- Button color changes from purple to yellow when user progresses
- This creates visual feedback and excitement
- Yellow suggests "in progress" or "action needed"
- Previous link allows backwards navigation

---

### STEP 2: Phone Number Collection

**Question:** "What is your **phone number**?"
(Note: "phone number" is bolded)

**Input Field:**
- Type: Tel (telephone)
- Country flag selector (Canada flag shown - 🇨🇦)
- Prefix: "+1" pre-filled
- Background: #F5F8FA
- Extra left padding: 70px (to accommodate flag/prefix)

**Button:**
- Text: "CONTINUE"
- Background: **Yellow (#FFFC8C)** - Same as previous step
- Dimensions: 408px × 84px

**Navigation:**
- "Previous" link visible

**UX Notes:**
- International phone number support with country selector
- Smart input with auto-formatting
- Continues yellow button theme for mid-journey steps

---

### STEP 3: Shipping Address Collection

**Question:** "Whats your **shipping address**?"
(Note: Missing apostrophe in "Whats" - potential typo)

**Input Fields (5 total):**
1. Street Address (full width)
2. City (half width, left)
3. State/Region (half width, right)
4. Country/Region (half width, left)
5. Zip Code / Postal (half width, right)

**Layout:**
- Street address spans full width
- Bottom 4 fields in 2×2 grid
- All fields: 20px font, 13px padding, #F5F8FA background, 5px border radius

**Button:**
- Text: "CONTINUE"
- Background: **Purple (#6F00FF)** - Back to brand color!
- Text color: White
- Dimensions: 408px × 84px

**UX Notes:**
- Most complex input step with 5 fields
- Suggests physical product fulfillment (roadmap document)
- Button returns to purple, signaling near completion
- Grid layout optimizes space while maintaining clarity

---

### STEP 4: Business Qualification

**Question:** "Where are you in your **business journey**?"
(Note: "business journey" is bolded)

**Input Fields (3 dropdown selects):**
1. "# of full time employees*" (required)
2. "Annual Business Revenue*" (required)
3. "Are you a solo owner or have a partner(s)?*" (required)

**Field Styling:**
- All dropdown/select inputs
- Dropdown arrow on right side
- Same base styling: 20px font, 13px padding, #F5F8FA background
- Required field indicators (asterisks)

**Button:**
- Text: **"GET MY ROADMAP"**
- Background: Purple (#6F00FF)
- Text color: White
- Dimensions: 408px × 84px
- Final CTA - different text to signal completion

**UX Notes:**
- High-value qualification questions
- Helps segment leads by business size
- Changes from "CONTINUE" to "GET MY ROADMAP" - clear end signal
- Required fields ensure complete data capture

---

### STEP 5: Validation Error State

**What Happens:**
When clicking "GET MY ROADMAP" without completing all 3 dropdowns, validation errors appear:

**Error Messages:**
- "Please complete this required field." (appears under each empty dropdown)
- "Please complete all required fields." (general message)

**Button State Change:**
- Text: "GET MY ROADMAP"
- Background: **Light yellow/beige (#F9E57F)** - Disabled/error state color
- Text color: Black
- Still clickable but visually indicates incomplete state

**UX Notes:**
- Inline validation feedback
- Button color change signals problem
- Clear error messaging
- Form doesn't submit until all required fields complete

---

## 3. Design System Specifications

### Color Palette

**Primary Colors:**
- **Brand Purple:** #6F00FF (rgb(111, 0, 255))
  - Used for: Primary CTA, header, footer, brand elements
  - Conveys: Premium, authority, exclusivity

- **Yellow/Highlight:** #FFFC8C (rgb(255, 252, 140))
  - Used for: Mid-journey CONTINUE buttons
  - Conveys: Progress, energy, action

- **Disabled Yellow:** #F9E57F (rgb(249, 229, 127))
  - Used for: Validation error states
  - Conveys: Warning, incomplete

**Neutral Colors:**
- **Input Background:** #F5F8FA (rgb(245, 248, 250))
  - Light blue-gray
  - Soft, non-intrusive

- **Active Input:** #ECF0F3 (rgb(236, 240, 243))
  - Slightly darker when focused

- **Text:** Black (#000000) for primary text
- **Background:** White (#FFFFFF)
- **Navy Header:** ~#1A1A2E (dark navy)

### Typography

**Sizes:**
- Headline: ~48-52px (estimated)
- Question text: ~32-36px (estimated)
- Input text: 20px
- Button text: 23.86px (essentially 24px)
- Previous link: 18px
- Body text: 15-16px (estimated)

**Fonts:**
- Likely custom font (appears to be a modern sans-serif)
- All text appears to use same font family
- Bold weight for headlines and emphasized words

### Spacing & Layout

**Button Specifications:**
- Width: 408px (fixed width)
- Height: 84px
- Border radius: 50px (fully rounded pill)
- Padding: 27px vertical, 10px horizontal
- Large clickable area for mobile

**Input Field Specifications:**
- Font size: 20px
- Padding: 13px (single fields)
- Padding left: 70px (phone number field for flag/prefix)
- Border radius: 5px (subtle rounding)
- Background: #F5F8FA

**Container:**
- Centered single column
- Maximum width: ~650px (estimated)
- Generous white space
- Clean, uncluttered layout

**Grid System:**
- Full width for single inputs
- 2-column grid for related fields (City/State, Country/Zip)
- Responsive breakpoints for mobile

---

## 4. UX Patterns & Micro-interactions

### Button Color Psychology

The form uses a sophisticated color progression:

1. **Landing → Purple (#6F00FF)**
   - "LET'S START"
   - Signals: Authority, premium experience, brand trust

2. **Steps 1-2 → Yellow (#FFFC8C)**
   - "CONTINUE"
   - Signals: In progress, action required, energy
   - Different from brand color creates novelty/engagement

3. **Step 3 → Back to Purple (#6F00FF)**
   - "CONTINUE"
   - Signals: Nearing completion, return to brand

4. **Step 4 → Purple (#6F00FF)**
   - "GET MY ROADMAP"
   - Signals: Completion, reward, brand promise

5. **Error State → Disabled Yellow (#F9E57F)**
   - "GET MY ROADMAP"
   - Signals: Warning, incomplete, needs attention

**Strategic Insight:**
This color pattern creates a psychological journey - starting strong (purple), moving through action (yellow), then returning home to brand (purple) for completion.

### Form Flow Patterns

**Progressive Disclosure:**
- One question per screen
- Reduces cognitive load
- Feels faster than 5-step progress bar
- Each step feels accomplishable

**Question Framing:**
- Conversational tone ("What's your name?" vs "Name:")
- Bold emphasis on key words ("email", "phone number", "business journey")
- Personal pronouns ("your") create ownership

**Navigation:**
- "Previous" link always visible after first step
- Transparent background - doesn't compete with CONTINUE
- Allows error correction without pressure

**Field Validation:**
- Real-time input styling changes
- Required field indicators (*)
- Inline error messages
- Button color feedback

---

## 5. Conversion Optimization Techniques

### Commitment Escalation
1. **Low barrier entry** - Just name (2 fields)
2. **Single email** - One field, familiar
3. **Phone number** - Moderate commitment
4. **Address** - Higher commitment (5 fields, suggests physical product value)
5. **Business qualification** - Highest value data, but user is invested

### Social Proof Strategy

**Placement:**
- Visible on every step below the form
- Doesn't move/distract during interaction
- Consistent positioning builds trust

**Types:**
1. **Volume proof** - "250,000 Business Owners"
2. **Speed proof** - "Less than 30 Seconds"
3. **Authority proof** - Alex Hormozi testimonial
4. **Quality proof** - "3 billionaires" + strong quote

### Friction Reduction

**Minimal:**
- One question per screen
- Clear, large buttons (408px wide)
- Mobile-optimized touch targets (84px height)
- Pre-filled phone prefix
- Country selector for international users

**Maximum Clarity:**
- No jargon
- Simple language
- Clear progress through color changes
- Always visible Previous option

### Value Reinforcement

**Repeated throughout:**
- Headline visible on every step
- "$100M Scaling Roadmap" branding
- "Free" and "Personalized" emphasized
- "30 seconds" speed promise
- Visual product mockup always present

---

## 6. Technical Implementation

### Form Technology
- Appears to be HubSpot Forms (class names: `hsfc-Button`, `hsfc-TextInput`)
- Single-page application behavior
- Smooth transitions between steps
- Client-side validation

### Progressive Enhancement
- All form steps load at once (hidden)
- JavaScript handles show/hide
- Degrades gracefully if JS disabled
- Fast perceived performance

### Mobile Considerations
- Large touch targets (84px button height)
- Full-width buttons (408px on desktop, 100% on mobile likely)
- Readable 20px input text
- Generous padding (13px minimum)
- No hover dependencies

---

## 7. Data Collection Strategy

### Information Gathered

**Contact Information:**
- First name
- Last name
- Business email
- Phone number (with country code)
- Full mailing address

**Qualification Data:**
- Number of employees
- Annual revenue
- Solo owner vs partnership

**Marketing Attribution:**
- UTM parameters (likely)
- Referral source
- Consent for marketing communications

### Lead Scoring Potential

The form enables sophisticated lead scoring:
- **Revenue > $1M** = Hot lead
- **10+ employees** = Scaled operation
- **Partnership** = Decision complexity
- **Complete address** = High intent (physical product)

---

## 8. Conversion Funnel Analysis

### Estimated Drop-off Points

**Step 0 → 1** (Name → Email)
- Low friction increase
- Expected completion: 85-90%

**Step 1 → 2** (Email → Phone)
- Moderate friction (phone more sensitive)
- Expected completion: 70-80%

**Step 2 → 3** (Phone → Address)
- Higher friction (5 fields vs 1)
- But: Sunk cost fallacy kicks in
- Physical product promise increases value
- Expected completion: 65-75%

**Step 3 → 4** (Address → Business Info)
- Business qualification may filter
- But: Nearly complete, high commitment
- Expected completion: 75-85%

**Overall Estimated Conversion:**
Landing to Complete: 40-50% (strong for 5-step form)

### Optimization Opportunities

1. **A/B Test Ideas:**
   - Button copy variations
   - Color sequence changes
   - Question order (business info earlier?)
   - Adding step progress indicator

2. **Friction Reduction:**
   - Auto-complete for address
   - Smart defaults for country
   - Optional fields for address line 2

3. **Value Amplification:**
   - Preview of roadmap content
   - Example personalization
   - Timer showing "19 seconds left"

---

## 9. Competitive Advantages

### What Makes This Form Effective

1. **Brand Consistency**
   - Purple theme throughout
   - Professional, premium feel
   - Matches Alex Hormozi brand

2. **Psychological Progression**
   - Color changes create journey
   - Escalating commitment
   - Clear ending

3. **Value Proposition**
   - Free + Personalized + Fast (30 seconds)
   - Physical product (shipping address)
   - High-value outcome ($100M framework)

4. **Social Proof Integration**
   - Visible on every step
   - Multiple proof types
   - Credible authority (Hormozi, billionaires)

5. **Mobile Optimization**
   - Large buttons
   - Single column
   - Touch-friendly
   - Fast loading

---

## 10. Recommended Implementation Approach

### Frontend Stack
- **Framework:** React or Vue.js for state management
- **Form Library:** React Hook Form or Formik
- **Validation:** Yup or Zod
- **Animations:** Framer Motion or CSS transitions
- **Styling:** Tailwind CSS or Styled Components

### Component Structure
```
<LandingPage>
  <Header />
  <Hero />
  <MultiStepForm>
    <ProgressIndicator /> (optional)
    <Step1 - Name />
    <Step2 - Email />
    <Step3 - Phone />
    <Step4 - Address />
    <Step5 - Business />
    <Navigation />
  </MultiStepForm>
  <SocialProof />
  <Footer />
</LandingPage>
```

### Key Features to Implement
1. **State Management:** Track current step, form data, validation
2. **URL Params:** Allow deep linking to specific steps
3. **Analytics:** Track drop-off at each step
4. **Auto-save:** Local storage for form recovery
5. **Validation:** Real-time + on-submit
6. **Accessibility:** ARIA labels, keyboard navigation
7. **Loading States:** Smooth transitions between steps

---

## 11. Post-Submission Experience (CRITICAL)

**This is a KEY differentiator that creates urgency and maximizes scheduling conversions.**

### The Flow After Form Submission

**Step 1: Video Engagement**
- Immediately after submission, a video autoplays
- "Your Personalized Roadmap is Ready" heading
- Video features Alex Hormozi explaining the value
- Keeps user engaged while backend processes

**Step 2: Countdown Timer (60 seconds)**
- Large countdown timer displayed: "Your Roadmap Will Be Revealed In: 00:XX"
- Creates anticipation and urgency
- Prevents users from leaving immediately
- Video continues playing during countdown

**Step 3: Reveal (Timer Complete)**
- Download button appears: "Get Your Free Roadmap Now"
- Calendar scheduling widget becomes visible
- Purple CTA button to download
- Scheduling integration (appears to be embedded calendar)

**Step 4: Calendar Scheduling**
- Embedded scheduling widget (Calendly-style)
- Multiple time slot options
- Seamlessly integrated into the page

### Design Elements - Post-Submission

**Timer Display:**
- Large, prominent countdown
- Likely same purple (#6F00FF) styling
- Center-aligned, impossible to miss

**Video Player:**
- Autoplay enabled
- Full-width or prominent placement
- Professional production quality

**Reveal Animation:**
- Smooth transition when timer completes
- Download button fades/slides in
- Calendar section reveals

### Why This Pattern Works

1. **Commitment Escalation** - User has invested time, now they wait
2. **Anticipation Psychology** - Timer creates excitement, not frustration
3. **Video Value Delivery** - Explains what they're getting while waiting
4. **Immediate Next Action** - Scheduling appears right when download is ready
5. **Reduced Bounce** - 60-second engagement prevents quick exit

### Implementation Considerations

- Timer must be client-side (JavaScript countdown)
- Video should be optimized for fast loading
- Download link revealed via state change, not page reload
- Calendar widget lazy-loaded or revealed at timer completion
- Mobile: Stack video above timer above CTA

---

## 12. Screenshots Reference

All screenshots available in: `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/`

**Form Flow:**
- `step-00-landing-page.png` - Initial hero + name fields
- `step-01-name-fields-filled.png` - Filled name state
- `step-02-form-step-1.png` - Email collection
- `step-03-form-step-2.png` - Phone number with country selector
- `step-04-form-step-3.png` - Shipping address (5 fields)
- `step-05-form-step-4.png` - Business qualification dropdowns
- `step-06-after-submit.png` - Validation error state

**Post-Submission Flow (NEW):**
- `step-07-pre-submission.png` - Final form state before submit
- `step-08-after-submission-video.png` - Video playing after submission
- `step-09-timer-countdown.png` - 60-second countdown timer
- `step-10-timer-complete-revealed.png` - Download + calendar revealed
- `step-11-calendar-scheduling.png` - Embedded calendar widget
- `step-12-bottom-completion.png` - Bottom of completion page

Complete JSON data: `complete-report.json`

---

## 12. Summary & Key Takeaways

### What to Replicate

1. **Progressive Disclosure** - One question at a time
2. **Color Psychology** - Strategic button color changes
3. **Commitment Escalation** - Start easy, build to qualification
4. **Consistent Branding** - Purple theme reinforces premium
5. **Social Proof Anchoring** - Same position on every step
6. **Clear Navigation** - Always allow going back
7. **Value Reinforcement** - Headline + mockup always visible
8. **Mobile-First Design** - Large buttons, clean layout

### Success Metrics to Track

- Step-by-step completion rates
- Time per step
- Overall conversion rate
- Mobile vs desktop performance
- Error rate on validation
- Drop-off points
- Lead quality scores

### Estimated Performance

Based on design quality and UX patterns:
- **Landing to Form Start:** 60-70%
- **Form Start to Complete:** 50-65%
- **Overall Landing to Complete:** 35-45%
- **Lead Quality:** High (full qualification data)

---

**End of Analysis**

*This lead magnet represents a best-in-class example of progressive form design, strategic psychology, and conversion-optimized UX. The combination of low initial friction, strategic commitment escalation, consistent value messaging, and premium brand positioning creates a highly effective lead capture system.*
