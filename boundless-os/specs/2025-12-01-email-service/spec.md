# Specification: Email Service

## Goal

Implement Mailgun integration via mg.assistantlaunch.com to deliver personalized EA Time Freedom Report emails with PDF attachments using a fire-and-forget async pattern.

## User Stories

- As a lead, I want to receive my personalized PDF report via email so that I can review it at my convenience and have a permanent copy.
- As a business owner, I want email delivery to happen asynchronously so that form submission remains fast and responsive regardless of email service performance.

## Specific Requirements

**Mailgun SDK Integration**
- Use `mailgun.js` with `form-data` dependency (production-proven configuration)
- Configure client with `username: 'api'` and API URL `https://api.mailgun.net`
- Domain: `mg.assistantlaunch.com` (existing verified Mailgun domain)
- Validate all three environment variables on startup: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`
- Return clear error responses if any configuration is missing

**Email Template (HTML)**
- Subject line format: `{firstName}, Your Time Freedom Report is Ready` (fall back to "Hi" if no firstName)
- From address: `Ryan from Assistant Launch <{MAILGUN_FROM_EMAIL}>`
- Header section: Dark background (#141414) with white text, 30px padding, 10px border radius
- Body content: Personalized greeting, report introduction, "What's Next?" section with Calendly CTA button
- CTA button: Green background (#00cc6a), white text, 25px border radius, links to `https://calendly.com/assistantlaunch/discovery-call`
- Footer: Year-dynamic copyright, reply link, company website link

**Plain Text Email Version**
- Mirror HTML content structure without formatting
- Include Calendly URL as plain text link
- Ensure fallback works for email clients that block HTML

**PDF Attachment Handling**
- Filename format: `Time_Freedom_Report_{FirstName}_{LastName}.pdf`
- Convert incoming base64 PDF to Buffer using `Buffer.from(pdfBuffer, 'base64')`
- Attach as Mailgun attachment array: `[{ data: Buffer, filename: string }]`
- Log PDF buffer size for debugging; continue without attachment if processing fails

**API Endpoint Structure**
- Route: `POST /api/send-email`
- Accept JSON body: `{ to, firstName, lastName, pdfBuffer, html?, subject?, from? }`
- Validate email address format with regex before sending
- Return success response with `messageId`, `status`, `duration`, `timestamp`
- Return detailed error response with status code and Mailgun error details on failure

**Fire-and-Forget Async Pattern**
- Create `sendAsyncNotifications()` function that calls email API without await
- Wrap in `Promise.all([...]).catch()` to log errors without blocking
- Get base URL dynamically: `localhost:{PORT}` in dev, `VERCEL_URL` in prod, fallback to app domain
- Main form submission returns immediately while email sends in background

**Error Handling and Logging**
- Log timestamps, request details, and Mailgun response at each step
- Check for specific Mailgun errors: 401 (auth failed), 404 (domain not found)
- Never throw from async notification functions; log and continue
- Single-attempt delivery (no retry logic per requirements)

## Existing Code to Leverage

**PDF Generator Service** (`/web/src/lib/pdf/generator.ts`)
- Returns `PDFGenerationResult` with `base64` property for attachment
- Already handles Buffer conversion internally
- Use `base64` output directly for email attachment encoding

**UnifiedLeadData Interface** (`/web/src/types/lead.ts`)
- Contains `firstName`, `lastName`, `email` fields needed for personalization
- Use existing type for function parameters to maintain consistency
- Interface already supports both `phone` and `phoneNumber` variants

**Existing API Route Pattern** (`/web/src/app/api/generate-pdf/route.ts`)
- Follow same structure: NextRequest/NextResponse, interface for request body
- Use same error handling pattern with try/catch and typed error messages
- Match logging format and response structure for consistency

**Types Barrel Export** (`/web/src/types/index.ts`)
- Add email-related types to existing barrel export
- Follow established naming conventions (e.g., `EmailSendResult`, `EmailOptions`)

## Out of Scope

- SMS/iMessage delivery (separate future spec)
- Admin error notification emails (not needed for v1)
- Email tracking and analytics (opens, clicks, bounces)
- Automatic retry logic on failure
- Email queue system or background job processing
- Multiple email templates beyond the report delivery template
- Unsubscribe handling (managed by Mailgun list features)
- GoHighLevel CRM webhook integration (separate spec)
- Rate limiting on email endpoint
- Email validation beyond basic regex format check
