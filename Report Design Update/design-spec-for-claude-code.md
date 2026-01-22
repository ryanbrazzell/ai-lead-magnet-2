# Lead Magnet Report Page - Design Specification

## Instructions for Claude Code

Apply these exact design specifications to the existing report page. Keep all existing functionality (testimonials, calendar booking, videos) but update the styling and layout to match this spec.

---

## Color Palette

```css
/* Primary Colors */
--navy: #0f172a;           /* Dark backgrounds, text */
--navy-light: #1e293b;     /* Card backgrounds on dark */
--gold: #f59e0b;           /* Primary accent, CTAs */
--gold-light: #fbbf24;     /* Hover states */

/* Semantic Colors */
--red: #ef4444;            /* Negative numbers, costs */
--red-light: #fca5a5;      /* Red accents on dark bg */
--green: #10b981;          /* Positive numbers, savings */

/* Neutrals */
--white: #ffffff;
--gray-100: #f1f5f9;       /* Page background */
--gray-200: #e2e8f0;       /* Borders, dividers */
--gray-400: #94a3b8;       /* Muted text */
--gray-600: #475569;       /* Secondary text */
```

**Tailwind equivalents:**
- navy = slate-900
- navy-light = slate-800
- gold = amber-500
- red = red-500
- green = emerald-500
- gray-100 = slate-100
- gray-400 = slate-400
- gray-600 = slate-600

---

## Typography

**Font Family:** DM Sans (body), DM Serif Display (headlines)

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
```

**If using Tailwind, add to tailwind.config.js:**
```js
fontFamily: {
  sans: ['DM Sans', 'sans-serif'],
  serif: ['DM Serif Display', 'serif'],
}
```

---

## Component Specifications

### 1. Success Banner (Top of Page)

```
Background: linear-gradient(135deg, #059669 0%, #10b981 100%)
Text: white, centered
Padding: 16px
Font: 500 weight (medium)
Icon: Checkmark circle, white, 20px
```

Content: "Your personalized Time Freedom Report is on its way to your inbox"

---

### 2. Hero Section (The Pain)

```
Background: navy (#0f172a)
Padding: 60px top, 80px bottom
Text align: center
```

**Pain Label (pill badge):**
```
Background: rgba(239, 68, 68, 0.2)  /* red with 20% opacity */
Border: 1px solid rgba(239, 68, 68, 0.3)
Text color: #fca5a5 (red-light)
Padding: 8px 16px
Border radius: 50px (full rounded)
Font size: 14px, weight 600
Margin bottom: 24px
```
Content: "⚠️ The Hidden Cost of 'Doing It Yourself'"

**Headline:**
```
Font: DM Serif Display
Size: 48px (clamp 32px to 48px based on viewport)
Color: white
Line height: 1.2
Margin bottom: 16px
```
Content: "[Name], right now you're the **highest-paid assistant** at your company"
- The phrase "highest-paid assistant" should be gold (#f59e0b)

**Subtitle:**
```
Font size: 18px
Color: #94a3b8 (gray-400)
Max width: 500px
Margin: 0 auto 40px
```
Content: "Every hour you spend on $10/hr tasks is an hour you're not spending on what actually grows your business."

---

### 3. Cost Card (Main Content Card)

```
Background: white
Border radius: 16px
Padding: 40px
Margin: -40px auto 40px  /* Overlaps hero by 40px */
Max width: 600px
Box shadow: 0 20px 60px rgba(0, 0, 0, 0.15)
Position: relative
Z-index: 10
```

#### 3a. Card Header
```
Text align: center
Margin bottom: 32px
```

Label: "BASED ON YOUR ANSWERS"
```
Font size: 14px
Text transform: uppercase
Letter spacing: 2px
Color: #475569 (gray-600)
Margin bottom: 8px
```

Title: "Here's what this is costing you"
```
Font: DM Serif Display
Font size: 24px
Color: #0f172a (navy)
```

#### 3b. Time Lost Box
```
Background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)  /* amber gradient */
Border: 2px solid #f59e0b (gold)
Border radius: 12px
Padding: 32px
Text align: center
Margin bottom: 24px
```

Label: "Hours you're losing every week to low-value tasks"
```
Font size: 14px
Color: navy with 70% opacity
Margin bottom: 8px
```

Big Number: "10+"
```
Font: DM Serif Display
Font size: 64px
Color: navy
Line height: 1
```

Unit: "hours/week"
```
Font size: 20px
Color: navy with 80% opacity
```

Context: "That's **520+ hours/year** — or 13 full work weeks"
```
Font size: 14px
Color: #475569 (gray-600)
Margin top: 12px
```

#### 3c. ROI Breakdown (IMPORTANT - This is the key change)

**Single container with subtraction layout:**

```
Background: #f1f5f9 (gray-100)
Border radius: 12px
Padding: 24px
Margin bottom: 24px
```

**Layout (use flexbox or grid):**

```
Row 1: "What those hours cost you"     "$45,760" (RED - #ef4444)
Row 2: "– What an EA costs"            "$33,000" (GREEN - #10b981)
        ─────────────────────────────────────────
Row 3: "= Your net return"             "$12,760" (navy)
```

Styling for each row:
```
Display: flex
Justify-content: space-between
Padding: 12px 0
```

Labels (left side):
```
Font size: 15px
Color: #475569 (gray-600)
```

Values (right side):
```
Font: DM Serif Display (or bold DM Sans)
Font size: 24px
```

Divider line between row 2 and 3:
```
Border-top: 1px dashed #e2e8f0
Margin: 8px 0
```

**ROI callout (OUTSIDE the container, below it):**
```
Text align: center
Font size: 16px
Color: #475569 (gray-600)
Margin top: 16px
```
Content: "That's a **1.4x ROI** on your investment"
- Make "1.4x ROI" bold and gold colored (#f59e0b)

#### 3d. The Flip Section (Optional but recommended)
```
Background: #0f172a (navy)
Border radius: 12px
Padding: 32px
Text align: center
Color: white
```

Label: "THE REAL QUESTION"
```
Font size: 16px
Color: #f59e0b (gold)
Text transform: uppercase
Letter spacing: 1px
Margin bottom: 16px
```

Big number: "520 hours"
```
Font: DM Serif Display
Font size: 48px
Color: #10b981 (green)
Margin bottom: 8px
```

Question: "What would you do with 520 extra hours next year? Close more deals? Launch that product? Actually take a vacation?"
```
Color: #94a3b8 (gray-400)
Font size: 14px
```

---

### 4. CTA Section

```
Background: white
Padding: 48px 0
Text align: center
```

Headline: "Want help making sense of your report?"
```
Font: DM Serif Display
Font size: 28px
Margin bottom: 12px
```

Subtitle: "Book a free 15-minute call to walk through your results and get personalized recommendations."
```
Color: #475569 (gray-600)
Max width: 400px
Margin: 0 auto 32px
```

**CTA Button:**
```
Background: #f59e0b (gold)
Color: #0f172a (navy)
Padding: 18px 36px
Border radius: 8px
Font size: 18px
Font weight: 600
Box shadow: 0 4px 20px rgba(245, 158, 11, 0.4)
Display: inline-flex
Align items: center
Gap: 12px

Hover:
  Background: #fbbf24 (gold-light)
  Transform: translateY(-2px)
  Box shadow: 0 6px 30px rgba(245, 158, 11, 0.5)
```

Button text: "Walk Through My Report →"

Note below button:
```
Font size: 13px
Color: #94a3b8 (gray-400)
Margin top: 16px
```
Content: "No pressure. Just a quick chat to see if we can help."

---

### 5. Social Proof Section

```
Background: #0f172a (navy)
Padding: 48px 0
```

**Header:**
Badge: "✓ 1,300+ Founders Helped"
```
Background: rgba(16, 185, 129, 0.2)
Border: 1px solid rgba(16, 185, 129, 0.3)
Color: #10b981 (green)
Padding: 8px 16px
Border radius: 50px
Font size: 14px
Font weight: 600
Margin bottom: 16px
```

Headline: "They got their time back. You can too."
```
Font: DM Serif Display
Font size: 32px
Color: white
```

**Testimonial Cards:**
```
Grid: 2 columns (1 on mobile)
Gap: 20px
```

Each card:
```
Background: #1e293b (navy-light)
Border radius: 12px
Padding: 24px
Border: 1px solid rgba(255, 255, 255, 0.1)
```

Quote text:
```
Color: #e2e8f0 (gray-200)
Font size: 15px
Font style: italic
Margin bottom: 16px
```

Author section:
```
Display: flex
Align items: center
Gap: 12px
```

Avatar circle:
```
Width: 40px
Height: 40px
Border radius: 50%
Background: #f59e0b (gold)
Display: flex
Align items: center
Justify content: center
Font weight: 600
Color: navy
Font size: 14px
```

Name: white, font-weight 600, 14px
Title: #94a3b8 (gray-400), 12px

---

### 6. Video Section

```
Background: white
Padding: 60px 0
Text align: center
```

Keep existing video embed, just ensure:
- Max width: 640px
- Border radius: 12px
- Box shadow: 0 20px 60px rgba(0, 0, 0, 0.15)

---

### 7. Final CTA Section

```
Background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%)
Padding: 80px 0
Text align: center
```

Headline: "Ready to get your 520 hours back?"
```
Font: DM Serif Display
Font size: 36px
Color: white
Margin bottom: 16px
```

Subtitle: "Let's walk through your report together and see if we can help you stop being your own assistant."
```
Color: #94a3b8 (gray-400)
Max width: 450px
Margin: 0 auto 32px
```

CTA Button: Same as above but with white background and navy text

**Email Reminder (below button):**
```
Background: #fffbeb (amber-50)
Border: 1px solid #fde68a (amber-200)
Border radius: 8px
Padding: 16px 24px
Margin top: 40px
Display: inline-flex
Align items: center
Gap: 12px
```

Icon: Email/envelope icon, gold colored
Text (left aligned):
- Bold: "Don't forget to check your inbox"
- Regular: "Your full Time Freedom Report has the complete breakdown"

---

## Mobile Responsiveness

- Hero headline: clamp(32px, 5vw, 48px)
- Cost card padding: 24px on mobile
- Testimonial grid: 1 column on mobile (< 600px)
- Reduce section padding by ~30% on mobile

---

## Implementation Notes

1. Keep all existing data bindings (name, hours, dollar amounts) - just update how they're displayed
2. Keep the existing calendar/booking integration - just update the button text
3. Keep existing video embeds - just update container styling
4. Keep existing testimonial data - just update card styling
5. The page background should be #f1f5f9 (gray-100)
