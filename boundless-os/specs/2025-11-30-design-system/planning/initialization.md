# Spec Initialization: Design System

## Spec Name
design-system

## Context
This is part of a rebuild project for the EA Time Freedom Report lead magnet. The design system must enable the acquisition.com/roadmap-inspired UI while preserving all existing functionality.

## Status
**Ready for /write-spec** - All questions answered, decisions documented.

## Reference Materials

### Acquisition.com Analysis
- Full analysis: `/Users/ryanbrazzell/boundless-os-template-2/ACQUISITION-ROADMAP-ANALYSIS.md`
- Screenshots: `/Users/ryanbrazzell/boundless-os-template-2/roadmap-final-analysis/` (12 files)
- Mobile report: `/Users/ryanbrazzell/boundless-os-template-2/MOBILE-RESPONSIVENESS-REPORT.md`

### Product Context
- Mission: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/product/mission.md`
- Roadmap: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/product/roadmap.md`
- Tech Stack: `/Users/ryanbrazzell/boundless-os-template-2/boundless-os/product/tech-stack.md`

## Decisions Summary

| Question | Decision |
|----------|----------|
| Brand color strategy | Fully adopt purple (#6F00FF) |
| Component library | shadcn/ui + Tailwind CSS |
| Button hover states | Motion only (lift + shadow) |
| Form validation | Yellow button + red inline text |
| Loading states | Animated progress bar with color psychology |
| Mobile breakpoints | 375px (mobile), 428px (transition), 768px (tablet) |
| Dark mode | Out of scope |

## Design Tokens Confirmed

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| primary | #6F00FF | Purple - brand, CTAs |
| progress | #FFFC8C | Yellow - mid-journey buttons |
| error | #F9E57F | Disabled yellow - validation |
| input-bg | #F5F8FA | Input backgrounds |
| input-focus | #ECF0F3 | Focused inputs |
| navy | #1A1A2E | Dark header |

### Button Specs
- Desktop: 408x84px, border-radius 50px
- Mobile: 100% width, same height
- Font: 24px bold

### Input Specs
- Font: 20px
- Padding: 13px
- Border-radius: 5px
- Background: #F5F8FA → #ECF0F3 on focus

### Typography
- Headlines: 48-52px bold
- Questions: 32-36px, bold keywords
- Inputs: 20px
- Buttons: 24px bold
- Previous link: 18px

## Components to Create

### Form Components
1. PillButton (purple, yellow, disabled variants)
2. FormInput (text, email, tel, select)
3. FormStep (container with question + inputs)
4. StepNavigation (Previous link)
5. SocialProof (persistent below form)

### Post-Submission Components
6. VideoPlayer (autoplay wrapper)
7. CountdownTimer (60-second reveal timer)
8. RevealContainer (fade-in animation)
9. SchedulingWidget (iClosed embed wrapper)

### Layout Components
10. FormContainer (centered, max-width)
11. Header (navy bar with logo)
12. Footer (purple with links)

## Next Step
Run `/write-spec design-system` to generate formal specification.
