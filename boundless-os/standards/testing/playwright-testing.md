# Playwright Testing Standards

## Philosophy: Testing for Non-Technical Founders

Testing should be **visual and understandable**. If Ryan can see it working on screen, it's tested correctly.

---

## What is Playwright?

Playwright is a tool that acts like a robot user:
- Opens a real browser
- Clicks buttons
- Fills in forms
- Takes screenshots
- Checks if things work correctly

**Why it's perfect for non-technical founders:** You can literally SEE the tests running in a browser.

---

## When to Write Tests

### Always Test:
1. ✅ **User login/signup flows** - Critical that users can access the app
2. ✅ **Payment/checkout processes** - Money is involved
3. ✅ **Core user workflows** - The main things users do in your app
4. ✅ **Forms with validation** - Make sure error messages work

### Test if Time Allows:
- Secondary features
- Admin-only features
- Edge cases and unusual scenarios

### Don't Test Yet:
- Features still being designed/changed frequently
- Experimental features
- Very simple static pages

---

## Test Structure (Simple Format)

Every test should answer three questions:

1. **What are we testing?** (Clear name)
2. **What should happen?** (Expected behavior)
3. **How do we know it worked?** (Verification)

### Example Test Format

```javascript
test('User can sign up with email and password', async ({ page }) => {
  // 1. Go to the signup page
  await page.goto('/signup')

  // 2. Fill in the form
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'SecurePass123')

  // 3. Click signup button
  await page.click('button:has-text("Sign Up")')

  // 4. Check it worked (we should see the dashboard)
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Welcome')
})
```

---

## Test Organization

### File Structure

```
/tests
  /e2e                    - End-to-end user flows
    auth.spec.ts          - Login, signup, password reset
    dashboard.spec.ts     - Dashboard functionality
    checkout.spec.ts      - Purchase flows

  /visual                 - Visual regression tests
    homepage.spec.ts      - Screenshot comparisons

  playwright.config.ts    - Test configuration
```

### Naming Convention

**Test files:** `feature-name.spec.ts`

**Test names:** Use plain English describing what the user does
- ✅ "User can create a new project"
- ✅ "Form shows error when email is invalid"
- ❌ "testProjectCreation()"
- ❌ "validates email regex pattern"

---

## Types of Tests

### 1. User Flow Tests (Most Important)

Test complete user journeys from start to finish.

**Example user flows:**
- Sign up → Verify email → Set up profile → Access dashboard
- Browse products → Add to cart → Checkout → See confirmation
- Create post → Upload image → Publish → View live post

### 2. Visual Tests

Take screenshots and compare them to make sure nothing looks broken.

**Good for:**
- Ensuring design doesn't break
- Catching layout issues
- Verifying responsive design

**Example:**
```javascript
test('Homepage looks correct', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage.png')
})
```

### 3. Form Validation Tests

Make sure forms work correctly and show proper error messages.

**Test:**
- Empty form submission (should show errors)
- Invalid email format (should show error)
- Password too short (should show error)
- Valid submission (should succeed)

---

## Writing Good Tests

### Do's ✅

**Use descriptive selectors:**
```javascript
// Good - clear what we're clicking
await page.click('button:has-text("Sign Up")')
await page.fill('[placeholder="Email address"]', 'test@email.com')

// Bad - unclear and fragile
await page.click('#btn-1')
await page.fill('.input-class-xyz', 'test@email.com')
```

**Wait for things to load:**
```javascript
// Wait for navigation to complete
await page.waitForURL('/dashboard')

// Wait for element to appear
await page.waitForSelector('h1:has-text("Welcome")')
```

**Take screenshots on failure:**
```javascript
test('Important flow', async ({ page }) => {
  try {
    // ... test steps ...
  } catch (error) {
    await page.screenshot({ path: 'failure.png', fullPage: true })
    throw error
  }
})
```

### Don'ts ❌

**Don't use hard-coded waits:**
```javascript
// Bad - arbitrary wait times
await page.waitForTimeout(3000)

// Good - wait for specific condition
await page.waitForSelector('.success-message')
```

**Don't test implementation details:**
```javascript
// Bad - testing internal state
expect(component.state.isLoading).toBe(false)

// Good - testing user-visible behavior
await expect(page.locator('.spinner')).toBeHidden()
```

**Don't make tests dependent on each other:**
Each test should work independently.

---

## Running Tests

### Local Development

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run in headed mode (see the browser)
npx playwright test --headed

# Debug mode (pauses at each step)
npx playwright test --debug
```

### In CI/CD (Automatic)

Tests should run automatically when you:
- Push code to GitHub
- Create a pull request
- Deploy to staging

**Vercel Integration:**
Tests run before deployment. If tests fail, deployment is blocked.

---

## Visual Testing Tips

### Screenshots for Design Review

Use Playwright to capture screenshots at different sizes:

```javascript
test('Dashboard responsive design', async ({ page }) => {
  await page.goto('/dashboard')

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({ path: 'dashboard-desktop.png' })

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.screenshot({ path: 'dashboard-tablet.png' })

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: 'dashboard-mobile.png' })
})
```

### Compare Before/After

When making design changes:
1. Take screenshots before changes
2. Make your changes
3. Take new screenshots
4. Compare side by side

---

## Test Data Management

### Use Realistic Test Data

```javascript
const testUser = {
  email: 'test.user@example.com',
  password: 'SecurePassword123!',
  firstName: 'Test',
  lastName: 'User'
}
```

### Clean Up After Tests

If tests create data:
- Delete it after the test runs
- Use a separate test database
- Reset state between tests

---

## Debugging Failed Tests

### When a Test Fails:

1. **Look at the screenshot** - Visual evidence of what went wrong
2. **Read the error message** - Often points to the exact issue
3. **Run in headed mode** - Watch the browser to see what happens
4. **Check the trace** - Playwright saves detailed logs

### Common Issues:

**Element not found:**
- Page hasn't finished loading
- Selector is wrong
- Element is hidden or removed

**Test is flaky (sometimes passes, sometimes fails):**
- Race condition (things loading at different speeds)
- Need to wait for specific condition
- External dependency (API) is unreliable

---

## Performance Testing

### Check Page Load Times

```javascript
test('Dashboard loads quickly', async ({ page }) => {
  const startTime = Date.now()

  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  const loadTime = Date.now() - startTime

  // Should load in under 3 seconds
  expect(loadTime).toBeLessThan(3000)
})
```

---

## Accessibility Testing

### Basic Accessibility Checks

```javascript
test('Page is accessible', async ({ page }) => {
  await page.goto('/dashboard')

  // Check for basic accessibility violations
  const violations = await page.evaluate(() => {
    // Run axe-core accessibility checker
    return window.axe.run()
  })

  expect(violations.violations).toHaveLength(0)
})
```

---

## Test Checklist Before Shipping

For each major feature:

- [ ] Happy path works (everything correct)
- [ ] Error cases handled (what if user makes mistake?)
- [ ] Loading states show correctly
- [ ] Works on mobile screen size
- [ ] Works on desktop screen size
- [ ] Forms validate input
- [ ] Error messages are clear
- [ ] Success confirmations appear
- [ ] Screenshots captured for visual review

---

## Integration with Design Review

After writing UI code:

1. Run Playwright tests
2. Generate screenshots at multiple viewport sizes
3. Compare against design principles
4. Verify accessibility
5. Check performance

This gives you confidence everything works before showing it to users.

---

## Summary for Non-Technical Founders

**What you need to know:**
- Tests act like robot users clicking through your app
- Green tests = Everything works
- Red tests = Something broke
- Screenshots show you exactly what the test saw

**When to care:**
- Before deploying to production
- When tests fail (something needs fixing)
- When reviewing new features

**You don't need to write tests yourself** - Claude Code handles that. But you can understand what they're testing and see the visual results.
