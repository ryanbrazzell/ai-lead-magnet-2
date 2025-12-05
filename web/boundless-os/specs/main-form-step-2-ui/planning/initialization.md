# Spec Initialization: Main Form - Step 2 UI

## Initial Description
Main Form - Step 2 UI - Build second step of main form with Company Website, Monthly Revenue Range, and Pain Points fields using progressive disclosure design.

## Context
- This is the second step of the main form flow (/)
- Step 1 is already complete with: First Name, Last Name, Title, Phone fields
- Step 1 navigates to Step 2 after Zapier webhook fires
- Step 2 should continue the progressive disclosure pattern
- After Step 2 completion, the form should trigger AI task generation → PDF generation → email delivery

## Roadmap Reference
Item #8 - Phase 2: Form Rebuilds

## Source Code Reference
- Original implementation: `/tmp/ea-time-freedom-report/app/components/LeadForm.tsx` (Step 2 section)
- Step 1 fields: lines 176-283
- Step 2 fields: lines 285-390 (approximately)

## Spec Path
`/Users/ryanbrazzell/boundless-os-template-2/web/boundless-os/specs/main-form-step-2-ui`
