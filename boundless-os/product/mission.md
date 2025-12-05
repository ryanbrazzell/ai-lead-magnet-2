# Product Mission

> **REBUILD PROJECT**: This is a rebuild of an existing production lead magnet. The goal is to preserve ALL functionality while applying Boundless OS architecture and a new UI design.

## Pitch

**EA Time Freedom Report** is an AI-powered lead magnet that helps founders and business owners discover which of their daily, weekly, and monthly tasks can be delegated to an Executive Assistant by generating personalized reports showing exactly what an EA could handle for them.

## Users

### Primary Customers

- **Overwhelmed Founders**: Business owners spending too much time on operational tasks instead of high-value strategic work
- **Growing Business Owners**: Entrepreneurs at $10k-$1M+/month revenue who need to scale their time but don't know where to start with delegation
- **EA-Curious Leaders**: Professionals who have heard about EAs but aren't sure what tasks an EA could actually do for them

### User Personas

**The Overwhelmed Founder** (35-55)
- **Role:** CEO/Founder of a growing business
- **Context:** Revenue between $50k-$500k/month, wearing too many hats
- **Pain Points:**
  - Spending 60+ hours/week on the business
  - Doing tasks that don't require their expertise
  - No clarity on what to delegate vs. what requires their attention
  - Fear of hiring help without knowing the ROI
- **Goals:**
  - Free up 10-20 hours per week
  - Focus on revenue-generating activities
  - Scale without burning out

**The Scaling Entrepreneur** (30-45)
- **Role:** Business owner ready to build a team
- **Context:** Hit a ceiling where personal bandwidth limits growth
- **Pain Points:**
  - Knows they need help but unsure what kind
  - Previous bad experiences with VAs or contractors
  - Wants someone reliable, not another management burden
- **Goals:**
  - Offload administrative burden
  - Get time back for family and strategic work
  - Find a trusted EA without a lengthy hiring process

## The Problem

### Founders Don't Know What to Delegate

Most founders know they're overwhelmed, but they can't articulate which specific tasks are eating their time or which would be appropriate for an EA. Without this clarity, they either:
1. Never hire help (and burn out)
2. Hire poorly (wrong type of help for wrong tasks)
3. Underutilize hired help (don't know what to assign)

**The Result:** Founders stay stuck doing $15/hour tasks while their $500/hour strategic work suffers.

**Our Solution:** Generate a personalized, AI-powered report that analyzes their specific role, business type, and pain points to produce exactly 30 tasks (10 daily, 10 weekly, 10 monthly) with clear indicators of which ones an EA could handle. This gives founders immediate clarity and a concrete starting point for delegation.

## Differentiators

### Instant Personalization at Scale
Unlike generic "tasks an EA can do" blog posts, we generate a completely personalized report based on their specific business context. A real estate investor gets different tasks than a SaaS founder. The AI prompt (370+ lines) ensures relevance and specificity.

### Progressive Qualification
Unlike landing pages with long forms, our progressive disclosure approach (inspired by acquisition.com/roadmap) qualifies leads while providing value. Users answer one question at a time through large, satisfying buttons. The experience feels like getting value, not filling out a form.

### Immediate Value Delivery
Unlike "schedule a call to learn more" lead magnets, users get their personalized report immediately via email and on-screen. They see value before any sales conversation, building trust and demonstrating our expertise.

## Key Features

### Core Features (All Preserved from Existing Product)

- **AI-Powered Task Generation:** Gemini 2.0 Flash generates exactly 30 personalized tasks based on founder context with 40-60% marked as EA-delegatable
- **PDF Report Generation:** Server-side jsPDF creates professional, branded reports stored in AWS S3
- **Email Delivery:** Mailgun sends personalized emails with report attachment from mg.assistantlaunch.com
- **CRM Integration:** GoHighLevel webhook captures all lead data for follow-up sequences
- **Call Scheduling:** iClosed widget embedded in report for immediate booking

### Form Variants (All Must Be Rebuilt)

- **Main Form (/):** 2-step progressive form (Name/Title/Phone, then Website/Revenue/Pain Points)
- **Standard Form (/standard):** Single-step form with all 5 fields at once
- **Preselected Form (/preselected):** 4-step progressive button-based selection for pre-qualified leads

### Tracking Features

- **Meta Pixel Integration:** Full event tracking for ad optimization
- **UTM Parameter Handling:** Source/medium/campaign tracking throughout funnel
- **Zapier Webhooks:** Three separate endpoints for different form variants

## Success Criteria for Rebuild

### Must Preserve (Non-Negotiable)
- All existing functionality works identically
- Same AI model (Gemini 2.0 Flash) with same prompts
- Same integrations (GHL, Mailgun, S3, iClosed, Zapier)
- Same tracking (Meta Pixel, UTM parameters)
- All three form variants operational

### Must Improve
- Code architecture following Boundless OS standards
- UI/UX matching acquisition.com/roadmap design pattern
- Page load performance under 3 seconds
- Mobile responsiveness
- Code maintainability for future iterations

### Design Direction
- Progressive disclosure (one question per screen where applicable)
- Large pill buttons (408x84px, 50px border radius)
- Color psychology journey: Purple (#6F00FF) to Yellow (#FFFC8C) to Purple
- Persistent social proof on every step
- Bold keywords in questions
- "Previous" link available after step 1
