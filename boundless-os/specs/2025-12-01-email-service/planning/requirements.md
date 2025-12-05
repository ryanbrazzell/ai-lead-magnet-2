# Spec Requirements: Email Service

## Initial Description

Email Service - Implement Mailgun integration via mg.assistantlaunch.com; verify email delivery with PDF attachment matches existing emails.

**Roadmap Reference:** Item #6 - Phase 1: Core Infrastructure

## Requirements Discussion

### Research Findings

**Primary Source Code:** `/tmp/ea-time-freedom-report/`

**Key Files Identified:**
- `app/api/send-email/route.ts` (298 lines) - Primary Mailgun integration endpoint
- `app/utils/asyncNotifications.ts` (302 lines) - Background email + GHL notifications
- `app/utils/notificationService.ts` (197 lines) - Admin error notification emails
- `app/types/services.ts` (278 lines) - Type definitions for services

### Mailgun Configuration

**Service Details:**
- Library: `mailgun.js` with `form-data`
- API URL: `https://api.mailgun.net`
- Domain: `mg.assistantlaunch.com`
- From Email: Configured via `MAILGUN_FROM_EMAIL` env var
- Default sender name: "Ryan from Assistant Launch"

**Environment Variables Required:**
```
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=mg.assistantlaunch.com
MAILGUN_FROM_EMAIL=ryan@assistantlaunch.com
```

### Email Template Specifications

**Subject Line:**
- Format: `{firstName}, Your Time Freedom Report is Ready`
- Example: `Ryan, Your Time Freedom Report is Ready`

**HTML Email Structure:**
1. Header with branding/logo
2. Personalized greeting: "Hi {firstName},"
3. Introduction paragraph about the report
4. Key highlights from the analysis
5. CTA button: "Schedule Your Free Strategy Call" (Calendly link)
6. Footer with company info and unsubscribe

**Plain Text Version:**
- Fallback for email clients that don't render HTML
- Same content structure without formatting

**PDF Attachment:**
- Filename format: `Time_Freedom_Report_{FirstName}_{LastName}.pdf`
- Content-Type: `application/pdf`
- Attached as base64-encoded buffer

### Email Flow

**Current Pattern (Fire-and-Forget):**
1. Report generation completes
2. `sendAsyncNotifications()` called (non-blocking)
3. Email sent via internal `/api/send-email` endpoint
4. Main response returns immediately without waiting
5. Email delivery failures logged but don't block response

### Clarifying Questions & Answers

**Q1:** Preserve exact email template design?
**Answer:** Yes - keep identical HTML structure, copy, and CTA button.

**Q2:** Keep fire-and-forget async pattern?
**Answer:** Yes - non-blocking approach preserves existing behavior.

**Q3:** Use mailgun.js SDK?
**Answer:** Yes - it's already working in production.

**Q4:** Consolidate email templates?
**Answer:** Use send-email route template as canonical source (more detailed).

**Q5:** PDF attachment method?
**Answer:** Keep attachment only (existing behavior). Include S3 URL as fallback link if attachment fails.

**Q6:** Implement retry logic?
**Answer:** Keep single-attempt (existing behavior). Log failures for manual follow-up.

**Q7:** Subject line format?
**Answer:** Keep exactly as-is: `{firstName}, Your Time Freedom Report is Ready`

**Q8:** Exclusions?
**Answer:** SMS/iMessage, admin error notifications, email tracking/analytics are out of scope.

### Existing Code to Leverage

| Resource | Path | Usage |
|----------|------|-------|
| Send Email API | `/tmp/ea-time-freedom-report/app/api/send-email/route.ts` | Port email template and Mailgun logic |
| Async Notifications | `/tmp/ea-time-freedom-report/app/utils/asyncNotifications.ts` | Port fire-and-forget pattern |
| PDF Service | `/web/src/lib/pdf/generator.ts` | Get PDF buffer for attachment |
| Lead Types | `/web/src/types/lead.ts` | UnifiedLeadData interface |

### Visual Assets

No visual assets provided. Email template will be ported from source code.

## Requirements Summary

### Functional Requirements

**Email Sending:**
- Send personalized email with PDF report attached
- Use Mailgun via mg.assistantlaunch.com domain
- Fire-and-forget async pattern (non-blocking)
- HTML + plain text email versions
- PDF attached as base64 buffer

**Email Template:**
- Subject: `{firstName}, Your Time Freedom Report is Ready`
- From: Configured sender (Ryan from Assistant Launch)
- Personalized greeting with first name
- Report highlights/summary
- CTA button to Calendly scheduling
- Professional footer with branding

**PDF Attachment:**
- Filename: `Time_Freedom_Report_{FirstName}_{LastName}.pdf`
- Content-Type: application/pdf
- Fallback: Include S3 download link if attachment fails

**Error Handling:**
- Log failures for debugging
- Don't retry automatically (single attempt)
- Don't block main response on email failure

### Technical Considerations

**Dependencies:**
- `mailgun.js` - Mailgun SDK
- `form-data` - Required by mailgun.js
- Types from `/web/src/types/` (UnifiedLeadData)

**API Endpoint:**
- POST `/api/send-email`
- Accept: recipient info, PDF buffer/base64, report data
- Return: success/failure status

**Integration Points:**
- Called after PDF generation completes
- Receives PDF buffer from generator
- Uses lead data for personalization

### Scope Boundaries

**In Scope:**
- Port send-email route from source
- Port email template (HTML + plain text)
- Mailgun integration with mg.assistantlaunch.com
- PDF attachment handling
- Fire-and-forget async pattern
- Basic error logging
- API endpoint for sending emails

**Out of Scope:**
- SMS/iMessage delivery
- Admin error notification emails
- Email tracking/analytics (opens, clicks)
- Automatic retry logic
- Email queue system
- Multiple email templates
- Unsubscribe handling (handled by Mailgun)

### Dependencies

**Required Before:**
- PDF Generation Service (Item #5) ✅ Complete

**Required By:**
- Main Form Submission (Item #9)
- Standard Form Build (Item #10)
- Preselected Form Completion (Item #12)
