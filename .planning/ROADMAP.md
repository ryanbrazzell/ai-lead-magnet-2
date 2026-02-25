# Roadmap: TimeFreedom PDF Report Redesign

## Overview

Transform the EA Time Freedom Report PDF from a flat ROI + task list into a structured sales tool that educates prospects on the Three Pillars framework, organizes tasks by Core Four ownership areas to create deliberate overwhelm, and drives Time Audit call bookings. The redesign is surgical — only `layout-v2.ts` and `generator-v2.ts` receive core changes, with an isolated AI prompt update in Phase 4 and an adversarial design process in Phase 5. Five phases take the PDF from dead-code cleanup through foundation, static content, dynamic task pages, prompt upgrade, and visual design refinement.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Cleanup & Foundation** - Delete dead V1 code, build RGB color system and checkPageBreak utility, extend PDFReportData for Core Four grouping
- [ ] **Phase 2: Cover & ROI + Framework Page** - Redesign page 1 cover/ROI, build page 2 Three Pillars + Core Four static educational content
- [ ] **Phase 3: Core Four Task Pages + CTA** - Build pages 3-4 with tasks organized by Core Four ownership areas, build final CTA page, wire orchestrator to new page sequence
- [ ] **Phase 4: AI Prompt Upgrade** - Update prompt for coreTaskType + richer descriptions, update validator/fixer pipeline
- [ ] **Phase 5: PDF Visual Design** - Adversarial multi-perspective design process to finalize visual treatment across all pages

## Phase Details

### Phase 1: Cleanup & Foundation
**Goal**: The PDF codebase is clean, safe, and ready for new page builders — dead code eliminated, color system modernized, overflow protection in place, data layer extended for Core Four grouping
**Depends on**: Nothing (first phase)
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04
**Success Criteria** (what must be TRUE):
  1. V1 generator files (generator.ts, layout.ts) no longer exist in the codebase — accidental activation is impossible
  2. All PDF color usage goes through pre-computed RGB tuple constants — no hex-parsing setColor calls remain in layout-v2.ts
  3. A checkPageBreak utility exists and correctly adds a new page when content would overflow the current page
  4. The PDF color palette constants cover all planned sections: cover, framework, each Core Four area accent, and CTA
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Delete V1 dead code (5 files), clean V1 references (4 files), replace hex color system with RGB tuple constants, extend palette for all planned sections
- [x] 01-02-PLAN.md — Add checkPageBreak utility and integrate into all task rendering loops for overflow protection

### Phase 2: Cover & ROI + Framework Page
**Goal**: Pages 1 and 2 of the PDF deliver the first two emotional beats — financial pain (ROI) and framework education (Three Pillars + Core Four) — as complete, visually polished pages
**Depends on**: Phase 1 (color system, checkPageBreak utility)
**Requirements**: COVER-01, COVER-02, COVER-03, FRAME-01, FRAME-02, FRAME-03, FRAME-04
**Success Criteria** (what must be TRUE):
  1. PDF page 1 displays the founder's name, company context, and personalized ROI breakdown (hours lost, dollar cost) using the refreshed color system
  2. PDF page 2 shows Three Pillars (Right Person, Right Process, Right Support) with heading and 2-3 sentence description each
  3. PDF page 2 shows Core Four ownership areas (Email, Calendar, Personal Life, Recurring Processes) in distinct visual boxes with heading and brief description each
  4. Three Pillars and Core Four content fit on a single page without overflow
  5. All framework content is static (hardcoded copy, not AI-generated) and identical for every lead
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Extend PDFReportData with company context fields, thread data from generator, redesign buildSummaryPage with company name and ROI pain messaging
- [ ] 02-02-PLAN.md — Create buildFrameworkPage with hardcoded Three Pillars + Core Four content, wire into orchestrator as page 2

### Phase 3: Core Four Task Pages + CTA
**Goal**: The PDF's central conversion mechanism works — personalized tasks organized by Core Four areas create deliberate overwhelm, and a strong CTA page drives the reader to book a Time Audit call
**Depends on**: Phase 1 (Core Four data grouping, checkPageBreak), Phase 2 (page builder pattern established)
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, CTA-01, CTA-02, CTA-03
**Success Criteria** (what must be TRUE):
  1. PDF pages 3-4 display tasks grouped by Core Four ownership area (Email, Calendar, Personal Life, Recurring Processes) — not by daily/weekly/monthly frequency
  2. Each Core Four section uses a visually distinct accent color so the reader can scan between areas
  3. Tasks include rich descriptions (not just one-line titles) with action-oriented language
  4. Task volume is deliberately large — all generated tasks are shown, creating the "I clearly can't do this alone" overwhelm effect
  5. When AI personalization produces sparse output for a Core Four area, fallback universal EA task examples fill in so every area has substantial content
  6. Page breaks are handled safely — no task content silently clips or disappears at page boundaries
  7. The final PDF page displays a strong CTA with clickable booking link and value proposition reinforcement
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Add CoreFourArea types, inferCoreTaskType keyword classifier, and buildCoreFourTaskPages multi-page renderer with accent headers and continuous task numbering
- [ ] 03-02-PLAN.md — Define 24 fallback PDFTask objects (6 per Core Four area), build groupTasksByCoreFour data transform, wire into transformToPDFData
- [ ] 03-03-PLAN.md — Build buildCTAPageV2 full-page CTA with value proposition, rewire generateTimeFreedomReport to Core Four + CTA page sequence

### Phase 4: AI Prompt Upgrade
**Goal**: The AI generates tasks with explicit Core Four classification and richer descriptions, improving grouping precision and content quality without breaking the existing validator/fixer pipeline
**Depends on**: Phase 3 (task pages working with inference-based grouping; prompt upgrade improves quality)
**Requirements**: PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04
**Success Criteria** (what must be TRUE):
  1. AI-generated tasks include a coreTaskType field with one of four values (emailManagement, calendarManagement, personalLifeManagement, businessProcessManagement)
  2. AI-generated task descriptions are 2-3 sentences each, specific to the lead's business context
  3. AI output retains the daily/weekly/monthly frequency structure so the existing validator/fixer pipeline continues to pass without errors
  4. The report validator and fixer accept and preserve the coreTaskType field — they do not strip it or reject tasks that include it
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Update main prompt with coreTaskType + richer descriptions, increase maxTokens to 8192
- [ ] 04-02-PLAN.md — Update fallback prompts with coreTaskType + aligned task counts, fix stale prompt tests

### Phase 5: PDF Visual Design
**Goal**: The PDF's visual design is finalized through an adversarial multi-perspective process — marketing, simplicity, and complexity perspectives argue to find the best outcome for this specific use case
**Depends on**: Phase 2 (cover + framework pages exist), Phase 3 (task + CTA pages exist)
**Requirements**: DESIGN-01, DESIGN-02, DESIGN-03
**Success Criteria** (what must be TRUE):
  1. The visual design has been determined through an adversarial process where at least three design perspectives (marketing impact, visual simplicity, information density) were evaluated and the best elements selected
  2. Each Core Four area has a distinct accent color that creates clear visual separation in the task pages
  3. The PDF's visual treatment creates distinct emotional tones per section: urgency/pain on the cover, trust/education on the framework page, overwhelm/volume on the task pages, and clarity/action on the CTA page
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Adversarial multi-perspective design process (3 perspectives debate 8 dimensions), produce DESIGN-DECISIONS.md, user checkpoint for approval
- [ ] 05-02-PLAN.md — Apply finalized design decisions to layout-v2.ts (color constants, per-page treatments, emotional differentiation)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Cleanup & Foundation | 2/2 | Complete | 2026-02-24 |
| 2. Cover & ROI + Framework Page | 0/2 | Not started | - |
| 3. Core Four Task Pages + CTA | 0/3 | Not started | - |
| 4. AI Prompt Upgrade | 0/2 | Not started | - |
| 5. PDF Visual Design | 0/2 | Not started | - |
