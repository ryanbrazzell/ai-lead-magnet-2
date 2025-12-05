# Spec Requirements: Main Form - Multi-Step Progressive Disclosure

## Initial Description

CRITICAL SCOPE CHANGE: This spec is no longer "Step 1 UI only" - it is a complete rebuild of the entire main form (/) as a multi-step progressive disclosure experience with 6 screens, replacing the existing 2-step form entirely.

**Original Idea:** Build first step of main form (/) with Name, Title, and Phone fields using new progressive disclosure design.

**Final Scope:** Rebuild entire main form (/) as a 6-screen progressive disclosure flow with client-side transitions, Close CRM integration, and removal of fields that don't qualify leads effectively.

**Roadmap Reference:** Item #7 - Phase 2: Form Rebuilds (Note: Items #11 and #12 "Preselected Form" should be deleted from roadmap)

## Requirements Discussion

### Critical Clarification Session

**OPTION A SELECTED:** Rebuild entire main form as multi-step progressive disclosure (one question per screen, client-side transitions)

**Two Forms Strategy:**
1. **Main Form (/)** - Multi-step progressive disclosure with 6 screens (THIS SPEC)
2. **Standard Form (/standard)** - All questions on ONE screen (SEPARATE SPEC, future work)

**Preselected Form:** REMOVED from project entirely (Items #11 and #12 can be deleted from roadmap)

### Visual Reference Analysis

**Source:** `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/`

**Screenshots Analyzed:**
- `step-00-landing-page.png` - Shows initial name collection with purple "LET'S START" button
- `step-02-form-step-1.png` - Shows email collection with yellow "CONTINUE" button and "Previous" link
- `step-03-form-step-2.png` - Shows phone number with country selector, yellow continue button
- `step-04-form-step-3.png` - Shows shipping address (NOT using this pattern)
- `step-05-form-step-4.png` - Shows business journey questions with purple "GET MY ROADMAP" final button

**Design Patterns Identified:**
- One question per screen (progressive disclosure)
- Large, prominent headline with bold keywords
- Centered single-column layout (approximately 400-500px wide input fields)
- Client-side transitions (no page reloads) - shows/hides content dynamically
- Yellow buttons (#FFFC8C-like) for "Continue" actions (progress state)
- Purple buttons for initial start and final submission
- "Previous" link appears from Screen 2 onward
- Social proof persistent below form ("Get Your Roadmap in Less than 30 Seconds", "Requested by over 250,000 Business Owners")
- Testimonial section with Alex Hormozi quote

**Button Color Journey:**
- Screen 1: Purple "LET'S START" (primary variant) - initial engagement
- Screens 2-5: Yellow "CONTINUE" (progress variant) - building momentum
- Screen 6: Purple "GET MY EA ROADMAP" (primary variant) - completion/conversion

## Multi-Step Form Flow (6 Screens)

### Screen 1: Name Collection
**Question:** "What's your name?"

**Fields:**
- First Name (text input, placeholder: "FIRST NAME")
- Last Name (text input, placeholder: "LAST NAME")

**Layout:** 2-column grid on desktop (First Name | Last Name), stack vertically on mobile

**Button:** "Let's Start" (purple, primary variant)

**Validation:**
- First name required
- Last name required
- Error messages: "First name is required", "Last name is required"

**Close CRM Integration:**
- After successful validation: CREATE lead in Close
- API: POST /api/v1/lead/
- Payload: `{ name: "FirstName LastName" }`
- Store lead_id in component state for subsequent updates

### Screen 2: Email Collection
**Question:** "Where should I email it to?"

**Fields:**
- Email (text input, placeholder: "BUSINESS EMAIL ADDRESS")

**Button:** "Continue" (yellow, progress variant)

**Navigation:** Show "Previous" link (returns to Screen 1)

**Validation:**
- Email required
- Valid email format
- Error message: "Please enter a valid email address"

**Close CRM Integration:**
- After successful validation: UPDATE lead in Close
- API: PUT /api/v1/lead/{lead_id}/
- Payload: `{ contacts: [{ emails: [{ email: "user@example.com" }] }] }`

### Screen 3: Phone Collection
**Question:** "What is your phone number?"

**Fields:**
- Phone Number (text input, placeholder: "+1" pre-filled or visible)

**Button:** "Continue" (yellow, progress variant)

**Navigation:** Show "Previous" link (returns to Screen 2)

**Validation:**
- Phone required
- Minimum 10 digits
- Accepts formats: (123) 456-7890, 123-456-7890, 1234567890
- Error message: "Please enter a valid phone number (at least 10 digits)"

**Close CRM Integration:**
- After successful validation: UPDATE lead in Close
- API: PUT /api/v1/lead/{lead_id}/
- Payload: `{ contacts: [{ phones: [{ phone: "+1234567890" }] }] }`

**Note:** NO country code selector dropdown (keep simple text field with +1 visible/pre-filled)

### Screen 4: Employee Count
**Question:** "How many full-time employees do you have?"

**Fields:**
- Number of Employees (number input or text input with numeric validation)

**Button:** "Continue" (yellow, progress variant)

**Navigation:** Show "Previous" link (returns to Screen 3)

**Validation:**
- Required field
- Must be a positive number
- Error message: "Please enter number of employees"

**Close CRM Integration:**
- After successful validation: UPDATE lead in Close
- API: PUT /api/v1/lead/{lead_id}/
- Store in custom field: `custom.cf_employees` or similar

### Screen 5: Annual Revenue
**Question:** "What is your annual business revenue?"

**Fields:**
- Annual Revenue (dropdown select)

**Options:**
- Under $100k
- $100k - $250k
- $250k - $500k
- $500k - $1M
- $1M - $3M
- $3M - $10M
- $10M - $30M
- $30M+

**Button:** "Continue" (yellow, progress variant)

**Navigation:** Show "Previous" link (returns to Screen 4)

**Validation:**
- Required selection
- Error message: "Please select your revenue range"

**Close CRM Integration:**
- After successful validation: UPDATE lead in Close
- API: PUT /api/v1/lead/{lead_id}/
- Store in custom field: `custom.cf_revenue` or similar

### Screen 6: Pain Points
**Question:** "Where are you and your team stuck in the weeds the most?"

**Fields:**
- Pain Points (textarea, multi-line)

**Button:** "Get My EA Roadmap" (purple, primary variant)

**Button Loading State:** "Generating Your Report..."

**Navigation:** Show "Previous" link (returns to Screen 5)

**Validation:**
- Optional field (or required, to be confirmed during spec-writing)
- If required, error message: "Please describe your pain points"

**Close CRM Integration:**
- After successful validation: UPDATE lead in Close
- API: PUT /api/v1/lead/{lead_id}/
- Store in custom field: `custom.cf_pain_points` or note field

**Final Action:**
- After Close API update completes successfully
- Navigate to report generation/thank you page
- OR trigger existing Zapier webhook as backup/supplement
- Loading state shows "Generating Your Report..." during API calls

## Fields NOT Collected (Removed from Scope)

The following fields from the original 2-step form are REMOVED:

- **Title (CEO, Founder, etc.)** - Not effective for lead qualification
- **Company Website** - May be moved to Standard Form (/standard) only
- **Shipping Address** - Not needed for digital report delivery

## Technical Implementation Requirements

### Client-Side Transitions
- NO page reloads between screens
- Use React state management to track current screen (1-6)
- Show/hide screen components dynamically (similar to Hormozi's webapp)
- Smooth transitions between screens (300ms fade or similar)
- Preserve all form data in component state as user progresses

### State Management
- Track current screen number (1-6)
- Store all field values in form state
- Store Close CRM lead_id after Screen 1
- Handle "Previous" navigation (go back one screen, preserve data)
- Handle validation errors per screen

### Close CRM Integration

**Environment Variable:**
- `CLOSE_API_KEY` - User will provide their Close API key

**Progressive Lead Capture Flow:**
1. Screen 1 complete → CREATE lead (name only)
2. Screen 2 complete → UPDATE lead (add email)
3. Screen 3 complete → UPDATE lead (add phone)
4. Screen 4 complete → UPDATE lead (add employee count)
5. Screen 5 complete → UPDATE lead (add revenue)
6. Screen 6 complete → UPDATE lead (add pain points) → Navigate to next page

**API Documentation:**
- Close API Docs: https://developer.close.com/
- Lead creation: POST /api/v1/lead/
- Lead update: PUT /api/v1/lead/{lead_id}/

**Error Handling:**
- If Close API fails on Screen 1: Show error, allow retry
- If Close API fails on subsequent screens: Log error but allow progression (don't block user)
- Consider storing data locally as backup if API fails

### Zapier Webhook Integration

**Strategy:** Replace or supplement with Close API

**Recommendation:** Keep Zapier webhook as backup/supplement
- Fire on final screen (Screen 6) after Close API completes
- Payload: All collected data
- Non-blocking (log errors but don't prevent navigation)

### Design System Components

**Components to Use:**
- `PillButton` - 408x84px buttons
  - "primary" variant (purple #6F00FF) for Screen 1 and Screen 6
  - "progress" variant (yellow #FFFC8C) for Screens 2-5
- `FormInput` - Text, email, number inputs
- `FormSelect` - Dropdown for revenue range
- `FormTextarea` - Multi-line for pain points
- `FormLayout` - 650px centered container
- `PageLayout` - Header + content + Footer wrapper
- `HeroSection` - Persistent headline above form
- `SocialProof` - Persistent proof below form (from FormLayout)

**Layout Structure:**
```
PageLayout
  ├── Header (persistent)
  ├── HeroSection (persistent)
  │   └── "Get Your Free Personalized EA Roadmap...in under 30 seconds."
  ├── FormLayout (650px centered)
  │   ├── Screen 1-6 (conditionally rendered based on state)
  │   └── SocialProof (persistent)
  └── Footer (persistent)
```

### Responsive Breakpoints
- Mobile: 375px (single column, full width inputs)
- Transition: 428px
- Tablet: 768px (2-column name grid on Screen 1)
- Desktop: 1024px+ (maintain 650px form container)

### Validation Requirements
- Validate on field blur (show errors immediately)
- Validate on button click before screen transition
- Display inline errors below fields with red text
- Prevent screen progression until current screen validates
- Clear errors when user corrects input

## Existing Code to Reference

### Similar Features to Model
**Source Code:** `/tmp/ea-time-freedom-report/`

**Files to Reference (DO NOT directly port):**
- `app/components/LeadForm.tsx` - Reference validation patterns and state management
- `app/utils/zapier.ts` - Reference webhook integration pattern
- `app/api/submit-lead/route.ts` - Reference API route structure

**Design System:** `/Users/ryanbrazzell/boundless-os-template-2/web/src/components/`
- PillButton, FormInput, FormSelect, FormTextarea
- FormLayout, PageLayout, HeroSection
- SocialProof component

### Code Reusability Notes
- DO NOT directly copy existing LeadForm.tsx (it uses old 2-step pattern)
- DO reference validation logic and error handling patterns
- DO reuse Design System components entirely
- DO reference Zapier integration pattern for backup webhook

## Requirements Summary

### Functional Requirements

**Page Structure:**
- Route: `/` (root path)
- Layout: PageLayout wrapper with Header and Footer
- HeroSection: Persistent headline ("Get Your Free Personalized EA Roadmap...in under 30 seconds.")
- FormLayout: 650px centered container with persistent SocialProof
- 6 dynamically shown/hidden screen components
- Client-side state management (no page reloads)

**Multi-Step Form Screens:**
1. Name (First + Last) → Create Close lead → Purple "Let's Start" button
2. Email → Update Close lead → Yellow "Continue" button + Previous link
3. Phone → Update Close lead → Yellow "Continue" button + Previous link
4. Employee Count → Update Close lead → Yellow "Continue" button + Previous link
5. Annual Revenue (dropdown) → Update Close lead → Yellow "Continue" button + Previous link
6. Pain Points (textarea) → Update Close lead → Purple "Get My EA Roadmap" button + Previous link

**Navigation:**
- "Previous" link appears on Screens 2-6
- Goes back one screen without losing data
- All data preserved in state during navigation

**Validation:**
- Per-screen validation before progression
- Inline error messages below fields
- Error messages clear when user corrects input
- Prevent screen transition until current screen is valid

**Loading States:**
- Show loading on buttons during Close API calls
- Screen 6 final button: "Generating Your Report..." during submission
- Non-blocking for API updates on Screens 2-5 (log errors, allow progression)

### Close CRM Integration Requirements

**API Configuration:**
- Environment variable: `CLOSE_API_KEY`
- Base URL: https://api.close.com
- Authentication: Bearer token (API key)

**Progressive Lead Capture:**
- Screen 1: POST /api/v1/lead/ (create with name)
- Screens 2-6: PUT /api/v1/lead/{lead_id}/ (update with new fields)

**Data Mapping:**
- Name: `name` field (combined first + last)
- Email: `contacts[0].emails[0].email`
- Phone: `contacts[0].phones[0].phone`
- Employees: Custom field `custom.cf_employees`
- Revenue: Custom field `custom.cf_revenue`
- Pain Points: Custom field `custom.cf_pain_points` or note

**Error Handling:**
- Screen 1 API failure: Block progression, show error, allow retry
- Screens 2-6 API failure: Log error, allow progression (don't block user)
- Store lead_id in state after Screen 1 success

### Technical Considerations

**Dependencies:**
- React (with hooks for state management)
- Design System components (PillButton, FormInput, FormSelect, FormTextarea)
- Layout components (PageLayout, FormLayout, HeroSection)
- Form validation library (React Hook Form or similar)
- Validation schema library (Zod or Yup)
- HTTP client for Close API (fetch or axios)

**State Management:**
- Current screen number (1-6)
- All form field values
- Close CRM lead_id (from Screen 1 response)
- Validation errors per field
- Loading states per screen

**API Layer:**
- Create Next.js API route: `/api/close/create-lead`
- Create Next.js API route: `/api/close/update-lead`
- These routes handle Close API communication server-side (protect API key)
- Frontend calls these Next.js routes, which proxy to Close API

**Backup Strategy:**
- Keep Zapier webhook integration as backup
- Fire on Screen 6 completion after Close API succeeds
- Send all collected data in single payload
- Non-blocking (log errors, don't prevent navigation)

### Scope Boundaries

**In Scope:**
- Complete 6-screen progressive disclosure form
- Client-side screen transitions (no page reloads)
- Close CRM progressive lead capture integration
- Per-screen validation and error handling
- Navigation with "Previous" links
- Responsive layout (mobile to desktop)
- FormLayout with persistent SocialProof
- Button color psychology journey (purple → yellow → purple)
- Zapier webhook as backup (optional)

**Out of Scope:**
- Standard Form (/standard) - separate spec, future work
- Preselected Form - REMOVED from project (delete roadmap items #11 and #12)
- Report generation and delivery (Item #9)
- Thank you page / post-submission flow (separate spec)
- Meta Pixel tracking (Phase 3)
- UTM parameter handling (Phase 3)
- A/B testing variants (future optimization)

**Removed from Original Scope:**
- Title field (CEO, Founder, etc.) - not included in new flow
- Company Website field - not included in new flow (may be in Standard Form)
- Shipping Address - not needed for digital delivery

### Dependencies

**Required Before:**
- Design System Foundation (Item #2) - Complete
- Shared Layout Components (Item #3) - Complete
- Close CRM account setup with API key - User responsibility

**Required By:**
- Main Form - Submission & Report Flow (Item #9)

**Impacts:**
- Items #11 and #12 (Preselected Form) should be DELETED from roadmap

### Branding Consistency

**All copy should reference "EA Roadmap" consistently:**
- Button: "Get My EA Roadmap" (NOT "Get My Roadmap")
- Headline: "Get Your Free Personalized EA Roadmap...in under 30 seconds."
- Social proof can use "roadmap" generically

### Color Psychology Rationale

**Purple (#6F00FF):**
- Screen 1: Initial engagement, brand introduction
- Screen 6: Completion, conversion, premium value

**Yellow (#FFFC8C):**
- Screens 2-5: Progress, momentum, moving forward
- Creates psychological flow toward completion

### Visual Fidelity Notes

The Hormozi screenshots (`roadmap-final-analysis/`) are HIGH-FIDELITY production examples. They should be treated as accurate design references for:
- Layout structure (centered, single-column)
- Button styling and positioning
- Typography hierarchy (large bold headlines)
- Spacing and whitespace
- Social proof placement
- "Previous" link styling

DO NOT deviate significantly from these visual patterns - they are proven conversion-optimized designs.

## Success Criteria

**User Experience:**
- Form feels fast and responsive (no page reloads)
- Each screen focuses on ONE question (minimal cognitive load)
- Clear progress indication through button color journey
- Easy to go back and correct mistakes ("Previous" links)
- Mobile-friendly (works perfectly on phones)

**Technical Success:**
- Leads created in Close CRM progressively as users fill out form
- Lead data updated at each screen without user awareness
- Graceful error handling (API failures don't break user experience)
- All form data preserved during navigation
- Validation prevents bad data from being submitted

**Business Success:**
- Captures partial leads early (name, email, phone in first 3 screens)
- Maximizes completion rate with progressive disclosure
- Qualifies leads with revenue and employee data
- Captures detailed pain points for sales follow-up
- Integrates directly with Close CRM for sales team access
