# Code Review Standards

## Philosophy: Automatic Quality Checks

After writing code, Claude Code should automatically review its own work to catch issues before you see them.

---

## When to Run Code Review

### Automatically After:
- ✅ Implementing new features
- ✅ Making significant changes to existing code
- ✅ Before marking a task as complete
- ✅ Before creating a pull request

### The Review Should Be Silent

Unless there are **critical issues** that need your decision, the code review should happen in the background and fixes should be applied automatically.

---

## Review Framework

The code review checks these areas (in order of importance):

### 1. Does It Work? (Functionality)
- Does the code solve the problem it's supposed to solve?
- Are edge cases handled (what if users do unexpected things)?
- Does error handling exist?
- Are success cases tested?

### 2. Is It Secure? (Security)
**Critical - Never ship without checking:**
- No API keys or secrets in the code
- User input is validated (forms, URLs, etc.)
- SQL injection prevented
- XSS (cross-site scripting) prevented
- Authentication works correctly
- Users can only access their own data

### 3. Will It Break? (Reliability)
- Error messages are helpful (not just "Error occurred")
- Loading states exist for slow operations
- Null/undefined cases are handled
- The app doesn't crash if API fails

### 4. Is It Fast Enough? (Performance)
- Page loads under 3 seconds
- No unnecessary database queries
- Images are optimized
- No obvious performance issues

### 5. Can Future You Understand It? (Maintainability)
- Code is readable
- Variable names make sense
- Complex logic has comments explaining "why"
- Similar patterns to rest of codebase

### 6. Does It Match Our Standards? (Design Compliance)
- Follows design principles (spacing, colors, typography)
- Accessible (keyboard navigation, screen readers)
- Responsive (works on mobile)
- Uses Tailwind classes (not random inline styles)

---

## Code Review Philosophy

### "Net Positive > Perfection"

The code doesn't need to be perfect. It needs to:
- Work reliably
- Be secure
- Be understandable

**Don't worry about:**
- Perfect formatting (tools handle that)
- Minor style differences
- Theoretical performance optimizations

---

## What Gets Fixed Immediately

### Critical (Fix Before Shipping) 🔴

**Security Issues:**
- Exposed API keys or secrets
- Missing authentication checks
- Unvalidated user input
- SQL injection vulnerabilities

**Functionality Breaks:**
- Core features don't work
- App crashes
- Data loss potential
- Payment/checkout issues

**User Experience Blockers:**
- Forms with no validation
- No loading states on slow operations
- Error messages that don't help users
- Broken responsive design on mobile

### Improvements (Fix If Time Allows) 🟡

- Performance optimizations
- Better error messages
- Additional edge case handling
- Code organization improvements
- More detailed comments

### Nice to Have (Document for Later) 📝

- Refactoring opportunities
- Additional tests
- Future feature ideas
- Design system refinements

---

## Review Output Format

### For Critical Issues (Show to Founder)

```
🔴 Critical Issue Found

**Problem:** [Simple explanation]
**Impact:** [What breaks or security risk]
**Fix:** [What needs to change]
**Your Input Needed:** [If decision required]
```

**Example:**
```
🔴 Critical Issue Found

**Problem:** User passwords are stored in plain text
**Impact:** Major security risk - if database is breached, all passwords are exposed
**Fix:** Hash passwords using bcrypt before storing
**Your Input Needed:** None - implementing fix now
```

### For Improvements (Apply Automatically)

Most improvements should be fixed silently without bothering the founder.

**Example Internal Log:**
```
🟡 Improvement Applied
- Added loading spinner to form submission
- Improved error message clarity
- Optimized image sizes
```

---

## Specific Review Checklists

### Frontend Code Review

- [ ] **Visual:**
  - Follows design system (spacing, colors, typography)
  - Responsive on mobile/tablet/desktop
  - Loading states for async operations
  - Error states for failures

- [ ] **Interaction:**
  - Buttons have hover states
  - Forms validate input
  - Error messages are helpful
  - Success confirmations appear

- [ ] **Accessibility:**
  - Keyboard navigation works
  - Focus states visible
  - Proper ARIA labels
  - Color contrast passes WCAG AA

### Backend Code Review

- [ ] **Security:**
  - Authentication required for protected routes
  - Input validation on all endpoints
  - SQL injection prevention
  - Rate limiting on public endpoints

- [ ] **Reliability:**
  - Error handling exists
  - Logging for debugging
  - Database transactions where needed
  - Graceful degradation

- [ ] **Performance:**
  - Efficient database queries
  - Proper indexing
  - No N+1 query problems
  - Caching where appropriate

### Database Changes Review

- [ ] **Safety:**
  - Migration is reversible
  - No data loss risk
  - Backwards compatible
  - Tested on copy of production data

- [ ] **Performance:**
  - Indexes on frequently queried columns
  - No blocking operations on large tables
  - Schema design is normalized

---

## Testing During Review

### What Should Be Tested

**Before marking code review complete:**
1. **Manual Testing:** Actually use the feature
2. **Playwright Tests:** Run automated tests
3. **Edge Cases:** Try to break it
4. **Mobile:** Test on phone screen size
5. **Error Cases:** Test with invalid inputs

### Test Scenarios

For every feature:
- ✅ **Happy path:** Everything works correctly
- ✅ **Error path:** What if something goes wrong?
- ✅ **Empty state:** What if there's no data yet?
- ✅ **Loading state:** What shows while waiting?
- ✅ **Edge cases:** Weird but possible scenarios

---

## Code Review Communication

### When to Alert the Founder

**Always alert for:**
- Security vulnerabilities found
- Breaking changes to existing features
- Need for additional services/costs
- Significant performance issues
- Changes that affect user data

**Don't alert for:**
- Minor code improvements
- Formatting fixes
- Internal refactoring
- Adding comments
- Performance micro-optimizations

### Communication Format

```
**Code Review Complete** ✅

**Changes Made:**
- Added form validation
- Improved error messages
- Fixed mobile responsive issue
- Added loading states

**Tests Passing:** ✅ All tests pass
**Ready to Deploy:** ✅ Yes

[If any issues] **Issues Found:** None
```

---

## Integration with Development Workflow

### Standard Flow:

1. **Write Code** → Implement feature
2. **Self Review** → Claude Code reviews own work
3. **Apply Fixes** → Automatically fix issues found
4. **Run Tests** → Execute Playwright tests
5. **Manual Verify** → Quick manual check
6. **Mark Complete** → Task done

### When Review Finds Issues:

```
Writing feature... ✅
Running code review... 🔍
Found 3 issues 🟡
Applying fixes... 🔧
Re-testing... ✅
All good! Ready to deploy 🚀
```

---

## Review Checklist Template

Use this before marking any code task complete:

```
Code Review Checklist

Functionality:
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error cases handled

Security:
- [ ] No exposed secrets
- [ ] Input validated
- [ ] Authentication works
- [ ] Authorization works

User Experience:
- [ ] Loading states present
- [ ] Error messages helpful
- [ ] Success confirmations shown
- [ ] Works on mobile

Design Compliance:
- [ ] Follows design system
- [ ] Accessible (WCAG AA)
- [ ] Responsive design
- [ ] Proper spacing/typography

Testing:
- [ ] Manual testing done
- [ ] Playwright tests pass
- [ ] Screenshots captured (for UI)
- [ ] Console has no errors

Ready to Ship: [ ]
```

---

## Common Issues to Watch For

### Security Red Flags 🚨

```javascript
// ❌ BAD - API key in code
const apiKey = "sk-1234567890abcdef"

// ✅ GOOD - API key in environment variable
const apiKey = process.env.API_KEY
```

```javascript
// ❌ BAD - No input validation
const email = req.body.email
await db.query(`SELECT * FROM users WHERE email = '${email}'`)

// ✅ GOOD - Validated and parameterized
const email = validateEmail(req.body.email)
await db.query('SELECT * FROM users WHERE email = $1', [email])
```

### Performance Red Flags 🐌

```javascript
// ❌ BAD - Loading all records
const users = await db.users.findMany()

// ✅ GOOD - Paginated
const users = await db.users.findMany({
  take: 20,
  skip: page * 20
})
```

### UX Red Flags 😞

```javascript
// ❌ BAD - No loading state
<button onClick={handleSubmit}>Submit</button>

// ✅ GOOD - Shows loading state
<button onClick={handleSubmit} disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Submit'}
</button>
```

---

## Summary

**For Founders:**
- Code review happens automatically after writing code
- Critical issues will be flagged for your attention
- Minor improvements happen silently
- Green checkmark = Ready to ship

**For Claude Code:**
- Review your own code before marking tasks complete
- Fix critical issues immediately
- Document improvements made
- Run tests to verify fixes
- Only alert founder for critical issues or decisions needed

**Goal:** Ship secure, working, maintainable code consistently.
