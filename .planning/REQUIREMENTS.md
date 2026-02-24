# Requirements: TimeFreedom PDF Report Redesign

**Defined:** 2026-02-24
**Core Value:** The PDF must make the reader think "I clearly need an assistant and I clearly can't do this alone"

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Cleanup & Foundation

- [ ] **CLEAN-01**: Delete dead V1 PDF generator files (generator.ts, layout.ts) to eliminate confusion
- [ ] **CLEAN-02**: Replace all hex-parsing setColor calls with pre-computed RGB tuple color system
- [ ] **CLEAN-03**: Define PDF color palette as module-level RGB constants (cover, framework, each Core Four area accent, CTA)
- [ ] **CLEAN-04**: Add checkPageBreak utility that detects when content would overflow and adds a new page automatically

### Cover & ROI Page

- [ ] **COVER-01**: PDF page 1 displays personalized cover with founder's name and company
- [ ] **COVER-02**: PDF page 1 shows ROI breakdown: annual hours lost to $15/hr work, dollar cost based on revenue tier
- [ ] **COVER-03**: Cover page uses refreshed visual design consistent with new color system

### Framework Page

- [ ] **FRAME-01**: PDF page 2 displays Three Pillars section: Right Person, Right Process/Systems, Right Support — each with a heading and 2-3 sentence description
- [ ] **FRAME-02**: PDF page 2 displays Core Four ownership areas in visual boxes: Email Ownership, Calendar Ownership, Personal Life Ownership, Recurring Business Processes — each with heading and brief description
- [ ] **FRAME-03**: Three Pillars and Core Four are combined on a single page
- [ ] **FRAME-04**: Framework content is static (same for every lead, not AI-generated)

### Core Four Task Pages

- [ ] **TASK-01**: PDF pages 3-4 display personalized tasks organized by Core Four ownership areas (not daily/weekly/monthly)
- [ ] **TASK-02**: Each Core Four section has its own distinct accent color for visual scanning
- [ ] **TASK-03**: Tasks include rich descriptions (not just titles) with gerund-style action language
- [ ] **TASK-04**: Task volume is deliberately large to create "overwhelm" effect showing everything an EA could own
- [ ] **TASK-05**: Fallback content provides universal EA task examples per Core Four area when form data is thin or AI personalization is sparse
- [ ] **TASK-06**: Page breaks are handled safely — no task content silently clips or overflows

### CTA Page

- [ ] **CTA-01**: Final PDF page displays strong call-to-action to book Time Audit call
- [ ] **CTA-02**: CTA includes a clickable link to the scheduling page
- [ ] **CTA-03**: CTA page reinforces the value proposition (you need the right person + process + support)

### AI Prompt

- [ ] **PROMPT-01**: AI prompt updated to request coreTaskType field on every task (emailManagement, calendarManagement, personalLifeManagement, businessProcessManagement)
- [ ] **PROMPT-02**: AI prompt requests richer task descriptions (2-3 sentences per task, not just titles)
- [ ] **PROMPT-03**: AI output continues to include daily/weekly/monthly frequency structure (validator/fixer pipeline compatibility)
- [ ] **PROMPT-04**: Report validator and fixer updated to handle coreTaskType field without breaking existing checks

### PDF Design

- [ ] **DESIGN-01**: PDF visual design determined through adversarial multi-perspective design process (marketing, simplicity, complexity perspectives argue to find best outcome)
- [ ] **DESIGN-02**: Each Core Four area has a distinct accent color in the task pages
- [ ] **DESIGN-03**: Visual design creates distinct emotional treatments per section (pain/ROI → education/framework → overwhelm/tasks → solution/CTA)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Personalization

- **PERS-01**: AI-generated personalized section intros per Core Four area based on lead's business type
- **PERS-02**: Website scraping results displayed in the PDF (company-specific context)
- **PERS-03**: Badge labels on tasks (e.g., "Quick Win", "High Impact") based on AI assessment

### Web Report Alignment

- **WEB-01**: Web report page updated to reflect Three Pillars + Core Four framework
- **WEB-02**: Web report shows task preview organized by Core Four areas

## Out of Scope

| Feature | Reason |
|---------|--------|
| Landing page changes | Working funnel — zero risk policy |
| Web report page changes | PDF only for v1 — web stays as-is |
| Form flow changes | Same 4 screens, same data collection |
| New form fields | Work with existing data inputs |
| HTML-to-PDF conversion (Puppeteer) | jsPDF constraint — stay with current tech |
| Email template changes | Report delivery stays the same |
| Close CRM integration changes | Not related to PDF content |
| New external integrations | No new services or APIs |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLEAN-01 | Phase 1 | Pending |
| CLEAN-02 | Phase 1 | Pending |
| CLEAN-03 | Phase 1 | Pending |
| CLEAN-04 | Phase 1 | Pending |
| COVER-01 | Phase 2 | Pending |
| COVER-02 | Phase 2 | Pending |
| COVER-03 | Phase 2 | Pending |
| FRAME-01 | Phase 2 | Pending |
| FRAME-02 | Phase 2 | Pending |
| FRAME-03 | Phase 2 | Pending |
| FRAME-04 | Phase 2 | Pending |
| TASK-01 | Phase 3 | Pending |
| TASK-02 | Phase 3 | Pending |
| TASK-03 | Phase 3 | Pending |
| TASK-04 | Phase 3 | Pending |
| TASK-05 | Phase 3 | Pending |
| TASK-06 | Phase 3 | Pending |
| CTA-01 | Phase 3 | Pending |
| CTA-02 | Phase 3 | Pending |
| CTA-03 | Phase 3 | Pending |
| PROMPT-01 | Phase 4 | Pending |
| PROMPT-02 | Phase 4 | Pending |
| PROMPT-03 | Phase 4 | Pending |
| PROMPT-04 | Phase 4 | Pending |
| DESIGN-01 | Phase 5 | Pending |
| DESIGN-02 | Phase 5 | Pending |
| DESIGN-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after initial definition*
