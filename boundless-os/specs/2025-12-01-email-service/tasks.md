# Task Breakdown: Email Service

## Overview
Total Tasks: 6 Task Groups, ~30 Sub-tasks

**Goal:** Implement Mailgun integration via mg.assistantlaunch.com to deliver personalized EA Time Freedom Report emails with PDF attachments using a fire-and-forget async pattern.

**Source Code to Port:**
- `/tmp/ea-time-freedom-report/app/api/send-email/route.ts` (298 lines)
- `/tmp/ea-time-freedom-report/app/utils/asyncNotifications.ts` (302 lines)

**Target Location:** `/Users/ryanbrazzell/boundless-os-template-2/web/src/`

## Task List

### Types Layer

#### Task Group 1: Email Type Definitions
**Dependencies:** None

- [x] 1.0 Complete email types layer
  - [x] 1.1 Write 3-4 focused tests for email type interfaces
    - Test EmailSendOptions interface has required fields (to, firstName, lastName, pdfBuffer)
    - Test EmailSendResult interface has required fields (success, messageId, status, duration)
    - Test EmailErrorResponse interface structure
    - Test optional fields (html, subject, from) are properly typed
  - [x] 1.2 Create `/web/src/types/email.ts` with email interfaces
    - `EmailSendOptions` - Request body for send-email API
      - `to: string` (required)
      - `firstName?: string`
      - `lastName?: string`
      - `pdfBuffer?: string` (base64 encoded)
      - `html?: string`
      - `subject?: string`
      - `from?: string`
    - `EmailSendResult` - Success response
      - `success: boolean`
      - `messageId?: string`
      - `status?: string`
      - `duration?: number`
      - `timestamp: string`
    - `EmailErrorResponse` - Error response
      - `success: false`
      - `error: string`
      - `details?: MailgunErrorDetails`
    - `MailgunErrorDetails` - Detailed error info
      - `status?: number`
      - `statusText?: string`
      - `message?: string`
      - `timestamp?: string`
  - [x] 1.3 Export email types from `/web/src/types/index.ts`
    - Add `export type { EmailSendOptions, EmailSendResult, EmailErrorResponse, MailgunErrorDetails } from './email'`
  - [x] 1.4 Ensure types layer tests pass
    - Run ONLY the 3-4 tests written in 1.1
    - Verify TypeScript compilation succeeds

**Acceptance Criteria:**
- The 3-4 tests written in 1.1 pass
- Types compile without errors
- Types exported from barrel file
- Types match source code structure from `/tmp/ea-time-freedom-report/app/api/send-email/route.ts`

---

### Email Template Layer

#### Task Group 2: HTML and Plain Text Email Templates
**Dependencies:** Task Group 1

- [x] 2.0 Complete email template layer
  - [x] 2.1 Write 4-5 focused tests for email template generation
    - Test HTML template includes personalized firstName greeting
    - Test HTML template falls back to "there" when no firstName provided
    - Test plain text template mirrors HTML content structure
    - Test CTA button links to correct Calendly URL
    - Test footer includes dynamic year
  - [x] 2.2 Create `/web/src/lib/email/template.ts` with template functions
    - Port HTML template from source (`route.ts` lines 64-146)
    - `generateEmailHtml(firstName?: string): string`
      - Header: Dark background (#141414), white text, 30px padding, 10px border radius
      - Body: Personalized greeting, report intro, "What's Next?" section
      - CTA button: Green (#00cc6a), white text, 25px border radius
      - CTA URL: `https://calendly.com/assistantlaunch/discovery-call`
      - Footer: Dynamic year copyright, reply link, assistantlaunch.com link
    - `generateEmailText(firstName?: string): string`
      - Mirror HTML content without formatting
      - Include Calendly URL as plain text link
  - [x] 2.3 Create `/web/src/lib/email/index.ts` barrel export
    - Export `generateEmailHtml` and `generateEmailText`
  - [x] 2.4 Ensure email template tests pass
    - Run ONLY the 4-5 tests written in 2.1
    - Verify template output matches source exactly

**Acceptance Criteria:**
- The 4-5 tests written in 2.1 pass
- HTML template matches source design exactly (colors, structure, CTA)
- Plain text template is readable fallback
- Templates use firstName personalization with "there" fallback

---

### Mailgun Client Layer

#### Task Group 3: Mailgun SDK Integration
**Dependencies:** Task Group 1, Task Group 2

- [x] 3.0 Complete Mailgun client layer
  - [x] 3.1 Write 4-5 focused tests for Mailgun client
    - Test client initialization with correct config (username: 'api', url: 'https://api.mailgun.net')
    - Test environment variable validation (MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL)
    - Test email sending with attachment array format
    - Test PDF buffer conversion from base64
    - Test error handling for missing configuration
  - [x] 3.2 Install required dependencies
    - `npm install mailgun.js form-data`
    - Add to package.json devDependencies if needed for types
  - [x] 3.3 Create `/web/src/lib/email/mailgun.ts` with Mailgun client
    - Port configuration from source (`route.ts` lines 1-41)
    - `validateMailgunConfig(): { valid: boolean; error?: string }`
      - Check MAILGUN_API_KEY exists
      - Check MAILGUN_DOMAIN exists
      - Check MAILGUN_FROM_EMAIL exists
    - `createMailgunClient(): Mailgun.Client`
      - Initialize with `username: 'api'`
      - Use `url: 'https://api.mailgun.net'`
    - `sendEmailWithMailgun(options: EmailSendOptions): Promise<EmailSendResult>`
      - Convert pdfBuffer from base64 to Buffer
      - Format attachment array: `[{ data: Buffer, filename: string }]`
      - Filename format: `Time_Freedom_Report_{FirstName}_{LastName}.pdf`
      - Use domain: `mg.assistantlaunch.com`
      - Return messageId, status, duration
  - [x] 3.4 Add email validation utility
    - Port regex validation from source (`route.ts` lines 184-191)
    - `validateEmailAddress(email: string): boolean`
    - Use regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - [x] 3.5 Update `/web/src/lib/email/index.ts` barrel export
    - Export Mailgun functions
  - [x] 3.6 Ensure Mailgun client tests pass
    - Run ONLY the 4-5 tests written in 3.1
    - Verify configuration validation works
    - Note: Actual email sending tested via integration tests

**Acceptance Criteria:**
- The 4-5 tests written in 3.1 pass
- Dependencies installed correctly
- Client initializes with correct Mailgun configuration
- PDF attachment format matches Mailgun requirements
- Environment variable validation catches missing config

---

### API Route Layer

#### Task Group 4: Send Email API Endpoint
**Dependencies:** Task Groups 1-3

- [x] 4.0 Complete API route layer
  - [x] 4.1 Write 5-6 focused tests for API endpoint
    - Test POST /api/send-email accepts correct request body
    - Test returns 500 if Mailgun config missing
    - Test returns 400 if email address invalid
    - Test returns success response with messageId on success
    - Test returns detailed error response on Mailgun failure
    - Test handles missing pdfBuffer gracefully (sends without attachment)
  - [x] 4.2 Create `/web/src/app/api/send-email/route.ts`
    - Port from source (`route.ts` lines 1-298)
    - Follow existing pattern from `/web/src/app/api/generate-pdf/route.ts`
    - **Request handling:**
      - Accept POST request with JSON body
      - Parse EmailSendOptions from body
      - Log request details (timestamp, keys, recipient info)
    - **Configuration validation:**
      - Check MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM_EMAIL
      - Return 500 with specific error if missing
    - **Email validation:**
      - Validate email format with regex
      - Return 400 if invalid
    - **Email construction:**
      - Use provided HTML or generate default template
      - Generate plain text version
      - Set subject: `${firstName || 'Hi'}, Your Time Freedom Report is Ready`
      - Set from: `Ryan from Assistant Launch <${MAILGUN_FROM_EMAIL}>`
    - **PDF attachment:**
      - Convert base64 pdfBuffer to Buffer
      - Set filename: `Time_Freedom_Report_{FirstName}_{LastName}.pdf`
      - Log buffer size for debugging
      - Continue without attachment if processing fails
    - **Send and response:**
      - Track duration with startTime/endTime
      - Return success: `{ success: true, messageId, status, duration, timestamp }`
      - Return error: `{ success: false, error, details: { status, statusText, message } }`
    - **Error handling:**
      - Check for 401 (auth failed) and 404 (domain not found)
      - Log detailed error info without exposing to client
  - [x] 4.3 Ensure API route tests pass
    - Run ONLY the 5-6 tests written in 4.1
    - Verify endpoint responds correctly to all request types

**Acceptance Criteria:**
- The 5-6 tests written in 4.1 pass
- API endpoint follows existing route patterns
- Configuration validation returns clear error messages
- Email validation rejects invalid addresses
- Success/error responses match spec format
- PDF attachment handling is robust

---

### Async Notifications Layer

#### Task Group 5: Fire-and-Forget Email Pattern
**Dependencies:** Task Group 4

- [x] 5.0 Complete async notifications layer
  - [x] 5.1 Write 4-5 focused tests for async notification pattern
    - Test sendAsyncNotifications does not block/await
    - Test getBaseUrl returns localhost in development
    - Test getBaseUrl returns VERCEL_URL in production
    - Test errors are logged but not thrown
    - Test email is skipped if recipient email missing
  - [x] 5.2 Create `/web/src/lib/email/asyncNotifications.ts`
    - Port from source (`asyncNotifications.ts` lines 1-302, email portions only)
    - **Logging utilities:**
      - Simple logging without complex dependencies
      - `log.info(message, context?)`, `log.warn(message, context?)`, `log.error(message, error?, context?)`
      - Format: `[LEVEL] ISO_TIMESTAMP: message context`
    - **Base URL function:**
      - `getBaseUrl(): string`
      - Development: `http://localhost:${PORT || '3009'}`
      - Production: `https://${VERCEL_URL}`
      - Fallback: `https://report.assistantlaunch.com`
    - **Async email function:**
      - `sendEmailAsync(leadData: UnifiedLeadData, reportData: ReportData): Promise<void>`
      - Skip if no email on leadData
      - Skip if Mailgun not configured
      - Call internal `/api/send-email` endpoint
      - Log success/failure without throwing
    - **Main notification function:**
      - `sendAsyncNotifications(leadData: UnifiedLeadData, reportData: ReportData): void`
      - Fire-and-forget pattern: `Promise.all([...]).catch()`
      - Do not await - return immediately
      - Log errors but never throw
  - [x] 5.3 Define ReportData interface (if not already in types)
    - `html_content?: string`
    - `ea_task_percent?: number`
    - `tasks?: any`
    - `timestamp?: string`
    - Add to `/web/src/types/email.ts`
  - [x] 5.4 Update `/web/src/lib/email/index.ts` barrel export
    - Export `sendAsyncNotifications`, `sendEmailAsync`, `getBaseUrl`
  - [x] 5.5 Ensure async notifications tests pass
    - Run ONLY the 4-5 tests written in 5.1
    - Verify fire-and-forget behavior

**Acceptance Criteria:**
- The 4-5 tests written in 5.1 pass
- sendAsyncNotifications returns immediately without blocking
- Errors are logged but never thrown
- Base URL correctly determined for dev/prod environments
- Email skipped gracefully when config missing

---

### Integration Testing

#### Task Group 6: Test Review and Integration Testing
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and fill critical gaps
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 3-4 tests from types layer (Task 1.1)
    - Review the 4-5 tests from template layer (Task 2.1)
    - Review the 4-5 tests from Mailgun client layer (Task 3.1)
    - Review the 5-6 tests from API route layer (Task 4.1)
    - Review the 4-5 tests from async notifications layer (Task 5.1)
    - Total existing tests: approximately 20-25 tests
  - [x] 6.2 Analyze test coverage gaps for email service feature
    - Identify critical end-to-end workflows lacking coverage
    - Focus ONLY on email service spec requirements
    - Do NOT assess entire application test coverage
  - [x] 6.3 Write up to 8 additional integration tests maximum
    - **End-to-end happy path:**
      - Test complete flow: API receives request -> validates -> sends email -> returns success
    - **Error scenarios:**
      - Test behavior when Mailgun returns 401 (auth failed)
      - Test behavior when Mailgun returns 404 (domain not found)
    - **Edge cases:**
      - Test sending email without PDF attachment
      - Test sending email with missing firstName (uses fallback)
    - **Integration points:**
      - Test async notifications correctly call send-email API
      - Test email template uses correct personalization data
    - **Environment configuration:**
      - Test correct base URL selection based on environment
  - [x] 6.4 Create Playwright e2e test for email service (if applicable)
    - Test from UI perspective if email trigger exists
    - Verify form submission triggers async email
    - Screenshot verification of success state
  - [x] 6.5 Run feature-specific tests only
    - Run ONLY tests related to email service feature
    - Expected total: approximately 28-33 tests maximum
    - Do NOT run entire application test suite
    - Verify all critical email workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 28-33 tests total)
- Critical email delivery workflows covered
- No more than 8 additional tests added when filling gaps
- Testing focused exclusively on email service requirements

---

## Execution Order

Recommended implementation sequence:

1. **Types Layer** (Task Group 1) - Foundation types for all other layers
2. **Email Template Layer** (Task Group 2) - HTML/text generation
3. **Mailgun Client Layer** (Task Group 3) - SDK integration
4. **API Route Layer** (Task Group 4) - HTTP endpoint
5. **Async Notifications Layer** (Task Group 5) - Fire-and-forget pattern
6. **Integration Testing** (Task Group 6) - End-to-end verification

---

## Environment Variables Required

```bash
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.assistantlaunch.com
MAILGUN_FROM_EMAIL=ryan@assistantlaunch.com
```

---

## File Structure Summary

```
/web/src/
  types/
    email.ts              # EmailSendOptions, EmailSendResult, etc.
    index.ts              # Updated with email type exports
  lib/
    email/
      index.ts            # Barrel export for all email utilities
      template.ts         # generateEmailHtml, generateEmailText
      mailgun.ts          # Mailgun client, validateMailgunConfig
      asyncNotifications.ts  # sendAsyncNotifications, getBaseUrl
  app/
    api/
      send-email/
        route.ts          # POST /api/send-email endpoint
```

---

## Dependencies to Install

```bash
npm install mailgun.js form-data
```

---

## Notes

- **No retry logic:** Single-attempt delivery per spec requirements
- **No GHL integration:** GoHighLevel webhook is out of scope for this spec
- **No SMS/iMessage:** Separate future spec
- **No email tracking:** Opens, clicks, bounces out of scope
- **No rate limiting:** Not required for v1
