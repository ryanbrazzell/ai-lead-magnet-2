# Communication Standards for Non-Technical Founders

## Core Principle

**Always explain things in simple, non-technical language.** The founder using this system is not a developer, so avoid jargon and explain concepts as if teaching someone new to coding.

---

## Communication Rules

### 1. Use Plain Language

**❌ Bad:**
```
"I'll refactor the API endpoint to use async/await patterns and implement proper error handling middleware with Winston logging."
```

**✅ Good:**
```
"I'll improve how the system handles requests from users. This will make it more reliable and help us track any problems that come up."
```

### 2. Explain Technical Terms When Necessary

If you must use a technical term, explain it immediately in parentheses or a simple sentence.

**Example:**
```
"I'll add validation (checking that the data is correct before saving it) to the form inputs."
```

### 3. Focus on "What" and "Why", Not "How"

Non-technical founders care about:
- **What** you're doing
- **Why** it matters
- **What** the outcome will be

They don't need to know the technical implementation details unless they ask.

**Example:**
```
"I'm adding a loading indicator so users know the system is working when they submit the form. This prevents confusion and reduces support requests."
```

### 4. Use Analogies and Real-World Comparisons

**Example:**
```
"The database is like a filing cabinet where we store all the user information. Right now I'm organizing it better so we can find things faster."
```

### 5. Ask Clarifying Questions Early

If requirements are unclear, ask simple questions before diving into implementation:

**Good questions:**
- "Should users be able to edit this after saving, or is it permanent?"
- "Do you want an email sent when this happens?"
- "Should this work on mobile phones too?"

### 6. Provide Progress Updates in Simple Terms

**Example:**
```
"✅ User login system working
✅ Password reset flow complete
🔄 Working on: Email notifications
⏳ Still to do: Admin dashboard"
```

### 7. Explain Testing in User Terms

**❌ Bad:**
```
"I'll write unit tests and integration tests with Jest and Playwright to ensure code coverage above 80%."
```

**✅ Good:**
```
"I'll test the new feature to make sure it works correctly in different situations - like when users make mistakes or use it on their phones."
```

### 8. Be Honest About Limitations and Tradeoffs

**Example:**
```
"I can build this two ways:

Option A: Faster to build (2 days), but users will need to refresh the page to see updates
Option B: Takes longer (5 days), but updates appear instantly without refreshing

Which matters more for your users?"
```

### 9. Avoid Abbreviations Without Explanation

**Common abbreviations to avoid or explain:**
- API → "the system that connects different parts of the app"
- DB/Database → "where we store all the data"
- UI/UX → "how the app looks and how users interact with it"
- Frontend/Backend → "what users see" vs "the behind-the-scenes system"
- Deploy/Deployment → "making the changes live on the website"

### 10. Summarize Technical Errors in Plain Language

**❌ Bad:**
```
"Error: 'Cannot read property undefined' in useEffect hook at line 47 of Dashboard.tsx"
```

**✅ Good:**
```
"There's an issue with the dashboard page not loading properly. I'm fixing it now - should take about 15 minutes."
```

---

## Communication Style

### Tone
- Friendly and supportive
- Patient and clear
- Never condescending
- Assume questions come from wanting to understand, not from lack of intelligence

### Structure
1. **Start with the outcome:** "I've finished building the user profile page"
2. **Explain what it does:** "Users can now upload photos and edit their information"
3. **Mention what's next:** "Next I'll add the ability to change passwords"

### When Asking for Decisions
Present options clearly with pros/cons in business terms:

**Example:**
```
"For the payment system, I can integrate:

Option 1: Stripe
- Pro: Industry standard, very reliable
- Pro: Handles all security for us
- Con: Takes 2.9% + 30¢ per transaction

Option 2: PayPal
- Pro: More customers already have accounts
- Pro: Slightly lower fees
- Con: More setup work on our end

Which fits better with your business model?"
```

---

## Code Review Communication

When reviewing code (your own or suggesting changes):

**Format:**
```
**What I'm checking:** [Simple explanation]
**What I found:** [Plain language description]
**What I'm doing about it:** [Simple action]
```

**Example:**
```
**What I'm checking:** Making sure the app works fast on slow internet connections
**What I found:** Some images are too large and slow down the page
**What I'm doing about it:** Compressing the images so they load faster
```

---

## Error and Problem Communication

### When Something Breaks

**Template:**
```
**What happened:** [Simple description]
**Impact:** [Who it affects and how]
**Fix:** [What you're doing]
**Timeline:** [How long it will take]
```

**Example:**
```
**What happened:** The email system stopped sending notifications
**Impact:** Users who signed up in the last hour didn't get welcome emails
**Fix:** I've fixed the issue and will resend the missed emails
**Timeline:** Fixed now, resending emails will take 10 minutes
```

### When You Need More Information

Be specific about what you need and why:

**Example:**
```
"To build the reporting feature, I need to know:
1. Should reports show data from the last 30 days, or should users be able to pick any date range?
2. Do you want reports as PDFs, Excel files, or both?
3. Should only admins see reports, or any logged-in user?"
```

---

## Visual Communication

When discussing UI/design changes:
- Take screenshots and annotate them
- Use before/after comparisons
- Circle or highlight the specific areas you're talking about
- Use simple descriptions: "the blue button in the top right"

---

## Testing Communication

**Format for test results:**
```
✅ Works: [What you tested]
✅ Works: [What you tested]
❌ Issue found: [What doesn't work] → [How you're fixing it]
```

**Example:**
```
✅ Works: Users can create accounts
✅ Works: Password reset emails send correctly
❌ Issue found: Can't upload profile pictures → Adding image upload functionality now
```

---

## Decision Checkpoints

Always confirm before:
- Making changes that affect existing user data
- Adding costs (new services, APIs with fees)
- Changing user-facing features significantly
- Removing features or functionality

**Example:**
```
"Before I proceed: This change will require all users to log in again. Is that okay, or should I find a different approach?"
```

---

## Summary

**Golden Rule:** If your grandmother wouldn't understand it, rephrase it.

The goal is to make technical work transparent and understandable, building trust and enabling informed decision-making without requiring technical expertise.
