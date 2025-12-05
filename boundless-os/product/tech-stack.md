# Tech Stack

> **REBUILD PROJECT**: This tech stack is LOCKED for this rebuild. The existing production system uses these technologies, and changing them would break integrations. Only UI/UX and code architecture should change.

## Stack Classification: Simple Stack (Vercel + Next.js)

This project uses the **Simple Stack** variant from Boundless OS standards. This is appropriate because:
- Single-region audience (US-focused)
- Lead magnet with moderate traffic
- Existing production infrastructure on Vercel
- Tight integration requirements with external services

---

## Frontend (LOCKED - Do Not Change)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| **Next.js** | 14.x | Full-stack React framework | App Router, Server Components |
| **React** | 18.x | UI library | Standard React patterns |
| **TypeScript** | 5.x | Type safety | Strict mode enabled |
| **Tailwind CSS** | 3.x | Styling | Custom design tokens for acquisition.com style |

### New UI Components (Can Add)
- **shadcn/ui** - Accessible component primitives (optional, if helpful)
- **Framer Motion** - Animations for step transitions (optional)

---

## AI / LLM (LOCKED - Do Not Change)

| Technology | Purpose | Critical Notes |
|------------|---------|----------------|
| **Gemini 2.0 Flash** | Task generation | PRIMARY MODEL - Must use this exact model |
| **unifiedPromptJSON.ts** | 370+ line prompt | PRESERVE EXACTLY - generates 30 tasks with 40-60% EA ratio |

### Environment Variable
```
GEMINI_API_KEY=<existing key>
```

### Why Gemini 2.0 Flash?
The existing system was optimized for this model. The prompt engineering, output parsing, and task generation logic all depend on Gemini's specific behavior. Changing models would require re-engineering the entire prompt and testing output quality.

---

## PDF Generation (LOCKED - Do Not Change)

| Technology | Purpose | Critical Notes |
|------------|---------|----------------|
| **jsPDF** | Server-side PDF creation | Generates branded report |
| **AWS S3** | PDF storage | Stores generated reports for email links |

### Environment Variables
```
AWS_ACCESS_KEY_ID=<existing key>
AWS_SECRET_ACCESS_KEY=<existing key>
AWS_REGION=<existing region>
AWS_S3_BUCKET=<existing bucket>
```

---

## Email (LOCKED - Do Not Change)

| Technology | Purpose | Critical Notes |
|------------|---------|----------------|
| **Mailgun** | Transactional email | Sends reports with PDF attachment |
| **mg.assistantlaunch.com** | Sending domain | MUST use this domain - already configured |

### Environment Variables
```
MAILGUN_API_KEY=<existing key>
MAILGUN_DOMAIN=mg.assistantlaunch.com
```

---

## CRM / Webhooks (LOCKED - Do Not Change)

| Technology | Purpose | Critical Notes |
|------------|---------|----------------|
| **GoHighLevel** | CRM | Lead capture and follow-up sequences |
| **Zapier** | Automation | Three webhook endpoints for form variants |

### GHL Webhook URL
```
https://services.leadconnectorhq.com/hooks/VTz12X5BhwWY1lipAgyF/webhook-trigger/de42d8ff-c401-4639-b8c4-0309c447fbf6
```

### Zapier Endpoints (Environment Variables)
```
ZAPIER_WEBHOOK_SIMPLIFIED=<existing URL>
ZAPIER_WEBHOOK_STANDARD=<existing URL>
ZAPIER_WEBHOOK_PRESELECTED=<existing URL>
```

---

## Scheduling (LOCKED - Do Not Change)

| Technology | Purpose | Critical Notes |
|------------|---------|----------------|
| **iClosed** | Call booking widget | Embedded in report page |

### Widget URL
```
https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet
```

---

## Tracking & Analytics (LOCKED - Do Not Change)

| Technology | Purpose | Critical Notes |
|------------|---------|----------------|
| **Meta Pixel** | Ad tracking | PageView, Lead, custom events |
| **UTM Parameters** | Source tracking | Must persist through entire flow |

### Environment Variable
```
NEXT_PUBLIC_META_PIXEL_ID=<existing pixel ID>
```

---

## Hosting / Infrastructure (LOCKED - Do Not Change)

| Technology | Purpose | Critical Notes |
|------------|---------|----------------|
| **Vercel** | Hosting & deployment | Existing production deployment |
| **Vercel Edge Functions** | API routes | Serverless backend |

### Domain
- Production URL: (existing domain)
- Preview deployments: Automatic via Vercel

---

## Development Tools (Boundless OS Standards)

| Tool | Purpose | Required |
|------|---------|----------|
| **Context7 MCP** | Documentation lookup | REQUIRED |
| **Playwright MCP** | Visual/e2e testing | REQUIRED |
| **Claude Code** | AI coding assistant | Recommended |

---

## Environment Variables Summary

All environment variables from existing production must be preserved:

```bash
# AI
GEMINI_API_KEY=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Email
MAILGUN_API_KEY=
MAILGUN_DOMAIN=mg.assistantlaunch.com

# Webhooks
GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/VTz12X5BhwWY1lipAgyF/webhook-trigger/de42d8ff-c401-4639-b8c4-0309c447fbf6
ZAPIER_WEBHOOK_SIMPLIFIED=
ZAPIER_WEBHOOK_STANDARD=
ZAPIER_WEBHOOK_PRESELECTED=

# Tracking
NEXT_PUBLIC_META_PIXEL_ID=

# Scheduling
ICLOSED_WIDGET_URL=https://app.iclosed.io/e/assistantlaunch/simple-form-for-lead-magnet
```

---

## What CAN Change (Architecture & Design Only)

### Code Architecture Improvements
- File/folder organization following Boundless OS patterns
- Component structure and reusability
- Type definitions and interfaces
- Error handling patterns
- Code documentation

### UI/UX Improvements
- Visual design (acquisition.com/roadmap style)
- Progressive disclosure patterns
- Animation and transitions
- Mobile responsiveness
- Loading states and feedback

### Testing Additions
- Playwright e2e tests
- Unit tests for critical logic
- Integration tests for API routes

---

## What CANNOT Change

| Category | Reason |
|----------|--------|
| AI Model (Gemini 2.0 Flash) | Prompt engineering depends on model behavior |
| AI Prompt (unifiedPromptJSON.ts) | Produces specific 30-task output format |
| Email Domain (mg.assistantlaunch.com) | DNS/SPF/DKIM already configured |
| GHL Webhook URL | Connected to existing CRM automations |
| Zapier Webhook URLs | Connected to existing automations |
| iClosed Widget URL | Connected to existing calendar |
| S3 Bucket | Contains historical reports |
| Meta Pixel ID | Connected to existing ad account |

---

## Migration Notes

When rebuilding:
1. Start by copying ALL environment variables from existing Vercel project
2. Test each integration individually before combining
3. Use existing production as reference for expected behavior
4. Verify webhook payloads match exactly what GHL/Zapier expect
5. Test PDF generation produces visually identical reports
