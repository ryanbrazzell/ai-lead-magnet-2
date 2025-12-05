# Product Roadmap

> **REBUILD PROJECT**: This roadmap is for rebuilding an existing production lead magnet. Each phase preserves existing functionality while improving architecture and design.

## Phase 1: Core Infrastructure

1. [ ] **Environment & Configuration Setup** - Set up all environment variables (GEMINI_API_KEY, MAILGUN_API_KEY, AWS S3 credentials, GHL webhook URL, etc.) and verify connectivity to all external services `S`

2. [x] **Design System Foundation** - Create Tailwind configuration with acquisition.com/roadmap-inspired design tokens: purple (#6F00FF), yellow (#FFFC8C), typography scale, and pill button component (408x84px, 50px radius) `S`

3. [x] **Shared Layout Components** - Build reusable layout with persistent social proof section, progress indicators, and "Previous" navigation link component `S`

4. [x] **AI Task Generation Service** - Port existing unifiedPromptJSON.ts prompt logic to new architecture; verify Gemini 2.0 Flash integration produces identical 30-task output with 40-60% EA task ratio `M`

5. [x] **PDF Generation Service** - Rebuild server-side jsPDF generation matching existing report design; verify AWS S3 upload and URL generation works correctly `M`

6. [x] **Email Service** - Implement Mailgun integration via mg.assistantlaunch.com; verify email delivery with PDF attachment matches existing emails `S`

## Phase 2: Form Rebuilds

7. [x] **Main Form - Step 1 UI** - Build first step of main form (/) with Name, Title, and Phone fields using new progressive disclosure design with large inputs and clear CTAs `S`

8. [ ] **Main Form - Step 2 UI** - Build second step with Website, Revenue selector, and Pain Points textarea; implement smooth step transition animation `S`

9. [ ] **Main Form - Submission & Report Flow** - Connect main form to AI generation, PDF creation, email sending, and GHL webhook; display loading state then redirect to report page `M`

10. [ ] **Standard Form Build** - Rebuild /standard route with single-step form showing all 5 fields; connect to same backend services with appropriate Zapier webhook endpoint `S`

11. [ ] **Preselected Form - Steps 1-2** - Build /preselected route with first two progressive button-selection steps using large pill buttons and bold question formatting `M`

12. [ ] **Preselected Form - Steps 3-4 & Completion** - Complete remaining steps and submission flow; connect to Zapier webhook endpoint specific to preselected variant `M`

13. [ ] **Report Display Page** - Build report results page showing generated tasks organized by frequency (daily/weekly/monthly) with EA task highlighting and embedded iClosed scheduling widget `M`

## Phase 3: Integrations & Tracking

14. [ ] **GoHighLevel Webhook Integration** - Verify GHL webhook receives all form data correctly for all three form variants; test lead appears in GHL with all fields populated `S`

15. [ ] **Meta Pixel Implementation** - Add Meta Pixel tracking with PageView, Lead, and custom events; verify events fire correctly in Meta Events Manager `S`

16. [ ] **UTM Parameter Handling** - Implement UTM parameter capture from URL and persistence through form submission to all downstream services (GHL, Zapier) `S`

17. [ ] **Zapier Webhook Endpoints** - Verify all three Zapier webhook endpoints (simplified, standard, preselected) receive correct payloads and trigger automations `S`

## Phase 4: Polish & Testing

18. [ ] **Mobile Responsive Testing** - Test and fix all three form variants on mobile devices; ensure buttons, inputs, and report display work correctly on small screens `M`

19. [ ] **Loading States & Error Handling** - Add loading spinners during AI generation (can take 10-30 seconds), error messages for failed submissions, and retry logic `S`

20. [ ] **Cross-Browser Testing** - Test on Chrome, Safari, Firefox, and Edge; fix any rendering or functionality issues `S`

21. [ ] **Performance Optimization** - Ensure page load under 3 seconds; optimize images, lazy load non-critical elements, verify Lighthouse score meets targets `S`

22. [ ] **End-to-End Testing Suite** - Create Playwright tests covering happy path for all three form variants: form submission, AI generation, PDF delivery, email receipt `M`

23. [ ] **Production Deployment & Verification** - Deploy to Vercel production; verify all integrations work in production environment; confirm existing URLs continue to function `S`

> **Notes**
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end functional and testable feature
> - Phase 1 establishes foundation that all forms depend on
> - Phase 2 rebuilds user-facing forms with new design
> - Phase 3 ensures all integrations match existing behavior
> - Phase 4 polishes and validates before launch

## Effort Scale Reference

- `XS`: 1 day
- `S`: 2-3 days
- `M`: 1 week
- `L`: 2 weeks
- `XL`: 3+ weeks

## Critical Path

The minimum viable rebuild requires completing items 1-9, 13-14, and 23. This gives a working main form with AI generation, PDF delivery, and CRM integration. Standard and preselected forms can follow incrementally.
