# Codebase Concerns

**Analysis Date:** 2026-02-23

## Tech Debt

### Non-Blocking Error Handling Masks Failures

**Issue:** API endpoints intentionally return `success: true` even when operations fail. Errors are logged but the client always proceeds, creating data consistency issues.

**Files:**
- `web/src/app/api/close/create-lead/route.ts` - Lines 47-50, 71-77
- `web/src/app/api/close/update-lead/route.ts` - Lines 47-50, 55-58, 119-129
- `web/src/app/api/close/mark-call-booked/route.ts` - Lines 42-45, 53-56
- `web/src/app/api/zapier/simplified/route.ts` - Lines 30-31, 52-54, 60-61

**Example:**
```typescript
if (!leadId) {
  console.error('Lead ID is required for update');
  // Non-blocking: return success anyway
  return NextResponse.json({ success: true });
}
```

**Impact:**
- Lead data may not be created in Close CRM but UI shows success
- Form appears to complete but data is lost
- User expects confirmation email/call that never arrives
- Creates support burden when customers claim they submitted but data is missing

**Fix approach:**
- Distinguish between blocking (required) and non-blocking (nice-to-have) operations
- Return detailed error status: `{ success: true, leadCreated: false, errors: [...] }`
- Client should inform user if critical steps failed
- Only use non-blocking for secondary operations (email notifications, analytics)

### Duplicate API Authorization Code

**Issue:** Three Close CRM endpoints repeat identical authentication logic without shared utilities.

**Files:**
- `web/src/app/api/close/create-lead/route.ts` - Lines 30-32
- `web/src/app/api/close/update-lead/route.ts` - Lines 64-65
- `web/src/app/api/close/mark-call-booked/route.ts` - Lines 43-44

**Example:**
```typescript
// Repeated in 3 files
const apiKey = process.env.CLOSE_API_KEY;
if (!apiKey) {
  console.error('CLOSE_API_KEY environment variable not set');
  return NextResponse.json({ success: true });
}
const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
```

**Impact:**
- Security fix requires updating 3 locations
- Inconsistent error handling between endpoints
- If auth format changes (e.g., API version upgrade), all 3 must be updated

**Fix approach:**
- Create `web/src/lib/close/client.ts` with shared authentication
- Extract `getCloseAuthHeader()` function
- Use for all Close API calls

### Two Competing PDF Layout Systems

**Issue:** Both `layout.ts` (993 lines) and `layout-v2.ts` (828 lines) exist with identical functionality but different color schemes and design approaches.

**Files:**
- `web/src/lib/pdf/layout.ts` - Navy/Gold design system (ENHANCED_COLORS)
- `web/src/lib/pdf/layout-v2.ts` - Teal/Ink design system (COLORS)

**Impact:**
- Doubles maintenance burden for PDF changes
- Unclear which layout is used in production
- Bug fixes in one may not apply to the other
- Color scheme inconsistency with web UI

**Confirmed:** Production uses V2. The `generate-pdf/route.ts` imports `generatePDFV2` from `generator-v2.ts`.

**Fix approach:**
- Remove `layout.ts` and `generator.ts` (V1 is unused)
- Rename `generator-v2.ts` → `generator.ts` and `layout-v2.ts` → `layout.ts`
- Update all imports

### Dead Code: Legacy Gemini, Mailgun, and S3 Integrations

**Issue:** Multiple legacy integration files remain in the codebase but are never imported by active routes. They inflate dependency count and create confusion about what's actually used in production.

**Files:**
- `web/src/lib/ai/gemini-client.ts` - Google Gemini API (never imported by task-generator.ts)
- `web/src/lib/email/mailgun.ts` - Mailgun email client (never imported by any API route)
- `web/src/lib/pdf/s3Service.ts` - S3 upload logic (only `generateSafeFilename` utility is used; actual S3 PutObject is dead)

**Active integrations (for clarity):**
- AI: Claude only (`claude-client.ts` → `generateWithClaude()`)
- Email: Resend only (`send-email/route.ts` → Resend SDK)
- Storage: Vercel Blob only (`generate-pdf/route.ts` → `@vercel/blob` `put()`)

**Impact:**
- `package.json` includes unused dependencies: `@aws-sdk/client-s3`, `mailgun.js`, related `form-data`
- New developers may assume Gemini/Mailgun/S3 are active
- Legacy env vars in documentation create confusion

**Fix approach:**
- Remove dead files: `gemini-client.ts`, `mailgun.ts`
- Remove S3 upload logic from `s3Service.ts` (keep `generateSafeFilename` only, or inline it)
- Remove unused dependencies from `package.json`
- Clean up env var documentation

---

## Known Bugs

### Stale State in localStorage Cross-Tab Communication

**Issue:** Form data stored in localStorage persists across multiple form submissions, leading to stale data being submitted if user doesn't clear storage.

**Files:**
- `web/src/components/thank-you/cta-section.tsx` - Lines 85-100
- `web/src/components/booking-confirmed/booking-confirmed-content.tsx` - Lines 22-58

**Trigger:**
1. User fills form, completes report, starts booking call
2. User closes browser without completing calendar booking
3. User returns, localStorage still contains old leadId/phone
4. User books call - old phone number is used instead of new one

**Workaround:**
- Users must manually clear browser storage
- No client-side warning about stale data

**Fix approach:**
- Use session storage with TTL instead of localStorage
- Store timestamp with data: `{ value, storedAt: Date.now() }`
- Validate data is < 1 hour old before use
- Clear explicitly on successful booking, not on redirect

### Widget Scroll Prevention Patch Is Fragile

**Issue:** Monkeypatching `Element.prototype.scrollIntoView`, `window.scrollTo`, and `HTMLElement.prototype.focus` for 10 seconds is a temporary workaround that breaks on timing edge cases.

**Files:**
- `web/src/components/thank-you/cta-section.tsx` - Lines 41-83

**Symptoms:**
- If iClosed widget initializes after 10 seconds, scroll prevention fails
- If user has slow network, widget loads after patches revert
- Mobile Safari may have different timing for widget initialization

**Trigger:**
- Slow 3G connection when loading iClosed iframe
- Widget loading blocked by other JS
- Clock skew on server

**Current approach:**
```typescript
const timeoutId = setTimeout(() => {
  // Restore all prototypes after 10 seconds (fragile)
  Element.prototype.scrollIntoView = origScrollIntoView;
  window.scrollTo = origScrollTo;
  window.scroll = origScroll;
  HTMLElement.prototype.focus = origFocus;
}, 10000);
```

**Fix approach:**
- Replace timeout with `MutationObserver` detecting widget load completion
- Patch only elements within `#calendar-section` div, not globally
- Use event listener instead of timing: wait for iFrame `onload`
- Add exponential backoff detection for failed scroll blocks

### Undefined Behavior When Form Submission Happens During API Call

**Issue:** If user clicks "Continue" button while `leadId` promise is pending, the form advances without a leadId, causing subsequent API calls to fail silently.

**Files:**
- `web/src/components/form/multi-step-form.tsx` - Lines 47, 103-125

**Current logic:**
```typescript
const pendingLeadIdRef = React.useRef<Promise<string | null> | null>(null);

// ... later, when email is submitted:
const leadPromise = (async () => { /* create lead */ })();
pendingLeadIdRef.current = leadPromise;
goToNextScreen(); // Advances immediately without waiting
```

**Trigger:**
- User enters email
- Clicks "Continue" button
- Network is slow (2+ second delay)
- leadId promise is still pending when next screen renders
- Phone screen makes API call with undefined leadId

**Impact:**
- Phone number not stored in Close CRM
- No error message to user
- Form appears successful but data is missing

**Fix approach:**
- Block navigation until leadId resolves
- Show loading spinner during creation
- Implement retry logic with exponential backoff
- Handle rejection: show error, prevent advance

---

## Performance Bottlenecks

### PDF Layout Calculations Lack Memoization

**Issue:** PDF dimensions, text wrapping, and color conversions are recalculated for every page even when identical.

**Files:**
- `web/src/lib/pdf/layout.ts` - `setHexColor()` called per color usage
- `web/src/lib/pdf/layout-v2.ts` - `setColor()` and `wrapText()` called per section

**Example:**
```typescript
function setHexColor(doc: jsPDF, hex: string, type: 'fill' | 'text' | 'draw') {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); // Regex every call
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    if (type === 'fill') doc.setFillColor(r, g, b);
    // ... more calls per color
  }
}
```

**Impact:**
- PDF generation for 30-task report ~5-10 seconds instead of 1-2 seconds
- Regex parsing colors on every header, section, and task
- Each `wrapText()` call recalculates line breaks

**Improvement path:**
- Pre-compute color RGB values in constants
- Cache `wrapText()` results for common content
- Use object-based color system instead of hex strings
- Profile PDF generation to identify actual bottleneck

### AI Task Generation Has No Prompt Caching

**Issue:** Each task generation request sends full 240+ line prompt to API, even for identical lead types.

**Files:**
- `web/src/lib/ai/task-generator.ts` - Lines 64-86 rebuild prompt on every call
- `web/src/lib/ai/prompts/serialize-lead.ts` - Generates identical prompts for identical inputs

**Impact:**
- API latency 2-3 seconds per request
- Token usage higher than necessary
- No benefit from request deduplication

**Improvement path:**
- Implement prompt fingerprinting: hash lead data + lead type
- Cache generated prompts in Redis for 24 hours
- Reuse for duplicate submissions
- Add cache hit metrics

---

## Security Considerations

### No Input Validation on API Payloads

**Issue:** POST endpoints accept raw request bodies and forward to Close CRM without validation.

**Files:**
- `web/src/app/api/close/create-lead/route.ts` - Lines 25-26
- `web/src/app/api/close/update-lead/route.ts` - Lines 35-37
- `web/src/app/api/zapier/simplified/route.ts` - Lines 14-23

**Example:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json(); // No schema validation
  const { firstName, lastName, email, phone, ... } = body;
  // Directly use values in API calls
  await fetch('https://api.close.com/api/v1/lead/', {
    body: JSON.stringify(leadPayload),
  });
}
```

**Risk:**
- XSS: User can inject scripts in phone/email fields
- Close CRM field size limits bypassed (no truncation)
- Unexpected fields forwarded to API
- No rate limiting: spam lead creation

**Recommendations:**
- Add Zod schema validation for all endpoints:
  ```typescript
  const createLeadSchema = z.object({
    firstName: z.string().min(1).max(50),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[0-9]{10,}$/),
  });
  ```
- Sanitize strings before forwarding
- Implement rate limiting on `/api/close/*` routes
- Log validation failures for abuse detection

### localStorage Used Without Scope Isolation

**Issue:** Data stored with generic keys (`assistantlaunch_leadId`) is accessible to any page on domain.

**Files:**
- `web/src/components/thank-you/cta-section.tsx` - Lines 88-100
- `web/src/components/booking-confirmed/booking-confirmed-content.tsx` - Lines 23-31

**Risk:**
- Malicious script on same domain can read leadId
- No encryption of sensitive data at rest
- Timing attack: can infer if user has booked call by checking localStorage

**Recommendations:**
- Use sessionStorage (cleared on tab close) instead of localStorage
- Encrypt sensitive values: `leadId`, `email`, `phone`
- Add versioning to keys to rotate if compromised
- Consider IndexedDB with encryption library

### Environment Variables Logged in Development

**Issue:** API keys and sensitive config are logged to console in production if logging level is set to debug.

**Files:**
- `web/src/app/api/close/create-lead/route.ts` - Line 26
  ```typescript
  console.log('Close CRM API Key loaded:', apiKey.substring(0, 10) + '...');
  ```

**Risk:**
- If log aggregation captures stdout, partial API key in logs
- Customer support screenshots may leak key prefixes
- Development/production parity broken by log levels

**Recommendations:**
- Never log any part of credentials
- Use feature flag for sensitive logging
- Mask secrets in error messages: `CLOSE_API_KEY: [REDACTED]`
- Scan codebase for secret patterns before deployment

---

## Fragile Areas

### Form State Not Validated After API Failures

**Issue:** `MultiStepForm` component assumes `leadId` is always set after email submission, but API failures leave it undefined. Subsequent screens use undefined leadId without error handling.

**Files:**
- `web/src/components/form/multi-step-form.tsx` - Lines 103-142

**Why fragile:**
- `leadPromise` stored in `pendingLeadIdRef` may reject silently
- No state validation in phone/business screens
- Each API call checks for leadId but returns success even if undefined
- No rollback if mid-form API fails

**Safe modification:**
- Add validation layer: `if (!leadId) throw new Error('Lead not created')`
- Show error modal if lead creation fails, don't advance
- Add retry UI with exponential backoff
- Test: network failure during Screen 2 → Screen 3

**Test coverage:**
- Gap: API error scenarios (connection timeout, 500 error)
- Gap: Race conditions (rapid button clicks)
- Gap: Form abandonment + return scenarios

### PDF Generator Lacks Error Recovery

**Issue:** `generatePDF()` catches errors but provides no fallback or partial output.

**Files:**
- `web/src/lib/pdf/generator.ts` - Lines 73-79

**Current approach:**
```typescript
try {
  // Generate 30-task report with all sections
} catch (error) {
  console.log('[PDF Generator] PDF generation failed', { error });
  return {
    success: false,
    error: 'Failed to generate PDF',
  };
}
```

**Why fragile:**
- If `addEnhancedTaskSection()` crashes on task 15/30, entire PDF lost
- No partial output (could deliver 14 tasks + header)
- AI validation failures stop PDF generation
- Large reports more likely to exceed memory limits

**Safe modification:**
- Implement section-level try-catch
- Fallback: use `layout-v2` if `layout` fails
- Generate min viable PDF if task section fails
- Add memory monitoring: stop adding sections if heap > 80%

### React Hook Dependencies Not Audited

**Issue:** Multiple useEffect hooks with missing or overly broad dependency arrays.

**Files:**
- `web/src/components/thank-you/cta-section.tsx` - Lines 41-83 (empty deps)
- `web/src/components/booking-confirmed/booking-confirmed-content.tsx` - Lines 29-58 (deps: `[email]`)

**Why fragile:**
- Empty deps: cleanup never runs, memory leaks from patched prototypes
- Overly broad: effect runs on every email change, calling API repeatedly

**Safe modification:**
- Add specific deps: `[leadId, email, phone]`
- Verify cleanup properly restores patched code
- Use `useCallback` for event handlers to stabilize deps

---

## Missing Critical Features

### No Offline Fallback for Form Submission

**Issue:** If user loses internet connection during form fill, all data is lost. No autosave or recovery.

**Impact:**
- Users on unreliable connections must restart
- Common on mobile with WiFi dropouts
- No competitive advantage vs native apps with offline support

**Mitigation:**
- Auto-save form state to sessionStorage every keystroke
- Warn user if unsaved changes exist when leaving
- On page reload, restore from sessionStorage if available

### No Duplicate Lead Detection

**Issue:** If user submits form twice (double-click, refresh), two leads created in Close CRM with same email.

**Files:**
- `web/src/app/api/close/create-lead/route.ts` - No uniqueness check

**Impact:**
- Duplicate follow-ups sent to users
- Sales metrics skewed
- Poor user experience: multiple calendar bookings

**Fix:**
- Check if lead with email already exists before creating
- Return existing leadId if found
- Implement idempotency key to prevent retries

---

## Test Coverage Gaps

### API Error Scenarios Not Tested

**Issue:** All unit tests use successful mock responses. Failure paths untested.

**Files:**
- `web/src/app/api/close/__tests__/close-api.test.ts` - Mock always returns `ok: true`
- `web/src/app/api/send-email/__tests__/route.test.ts` - No error test cases
- `web/src/app/api/generate-pdf/__tests__/route.test.ts` - No timeout tests

**Risk:** High
- Failure handling (non-blocking returns) untested
- Error message clarity unknown
- Rollback/retry logic never exercised
- Production surprises guaranteed

**Priority:** High

**Coverage to add:**
- Network timeout (fetch aborts)
- 4xx responses (validation error)
- 5xx responses (service down)
- Malformed JSON response
- Partial failures (create-lead succeeds, add-contact fails)

### Browser Compatibility Not Tested

**Issue:** No E2E tests for Safari, Firefox, mobile browsers. Only Chromium tested.

**Files:**
- `web/playwright.config.ts` - Only chromium browser
- `web/tests/e2e/*.spec.ts` - Chrome-only

**Risk:** Medium
- Scroll prevention patch may not work on Safari
- localStorage API different on Firefox
- Touch events not tested on mobile
- CSS grid layout issues on older iOS

**Priority:** Medium

### Memory Leak Tests Missing

**Issue:** useEffect hooks and component unmounting not tested for memory leaks.

**Files:**
- `web/src/components/thank-you/cta-section.tsx` - Prototype patches not verified cleaned up
- `web/src/components/post-submission/video-player.tsx` - Multiple useEffects with unclear cleanup

**Risk:** Medium
- Repeated visits to thank-you page leak memory
- Browser becomes sluggish after form completions
- Mobile users hit OOM errors

**Priority:** Medium

---

## Scaling Limits

### Lead Creation Bottleneck at Scale

**Issue:** Each form submission triggers synchronous Close CRM API call. Sequential requests create queuing.

**Files:**
- `web/src/app/api/close/create-lead/route.ts` - Blocking fetch

**Current capacity:** ~10-20 requests/sec (Close API limit)

**Limit:** If 100+ people visit site simultaneously, lead creation queues and timeouts increase

**Scaling path:**
- Implement async queue (Bull, RQ) for lead creation
- Return leadId optimistically, create in background
- Notify client via webhook when creation completes
- Batch Close API calls if possible

### PDF Generation Memory Usage

**Issue:** Large PDFs with 30 tasks + all sections generated in memory.

**Current:** ~50MB per PDF for 30-task report

**Limit:** If 10 PDFs generate simultaneously, server needs 500MB free heap

**Scaling path:**
- Stream PDF generation to disk, not memory
- Split large reports into multiple pages/files
- Implement backpressure: queue if heap > 70%
- Monitor and alert if generation time exceeds 30 seconds

---

*Concerns audit: 2026-02-23*
