/**
 * Revenue-Tier Segmented Fallback Tasks
 *
 * When AI generation fails or tasks are too thin in a Core Four area,
 * these contextually appropriate fallbacks fill the gap.
 *
 * 3 tiers:
 * - "getting organized" (Under $500k - $1M): Setting up first systems
 * - "scaling" ($1M - $5M): Team coordination, process documentation
 * - "optimizing" ($5M+): Executive-grade delegation
 */

import type { CoreFourArea, PDFTask } from '../pdf/layout-v2';
import type { RevenueTierLabel } from './lead-brief';

export type FallbackTier = 'early' | 'mid' | 'late';

/**
 * Map revenue tier label to fallback tier
 */
export function getFallbackTier(revenueTier: RevenueTierLabel): FallbackTier {
  switch (revenueTier) {
    case 'getting organized':
    case 'growing':
      return 'early';
    case 'scaling':
    case 'systemizing':
      return 'mid';
    case 'optimizing':
      return 'late';
    default:
      return 'mid';
  }
}

/**
 * Early-stage fallback tasks (Under $500k - $1M)
 * "Getting organized" - setting up first systems
 */
const EARLY_STAGE_TASKS: Record<CoreFourArea, PDFTask[]> = {
  business: [
    {
      name: 'Setting up your first CRM so leads stop slipping through the cracks',
      description: 'Your EA researches CRM options that fit your budget and workflow, sets it up, imports your existing contacts, and creates a simple follow-up system you can actually stick with.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Creating simple SOPs for tasks you repeat every week',
      description: 'Record yourself doing it once on Loom, your EA turns it into a step-by-step playbook. Start with your top 3 most repeated tasks and build from there.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Tracking your invoices and chasing late payments',
      description: 'Your EA sends invoices on time, follows up on overdue payments with polite but persistent reminders, and keeps your accounts receivable spreadsheet current.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Keeping your basic bookkeeping organized every week',
      description: 'Categorizing receipts, matching transactions to the right accounts, and making sure nothing piles up before tax time. No more shoebox of receipts.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Responding to new leads and inquiries within 2 hours',
      description: 'Your EA monitors your inquiry channels and sends a warm, personalized response while the lead is still hot, then schedules them for a call with you.',
      time_saved: '1.5 hrs/day',
    },
    {
      name: 'Posting consistently on your social media channels',
      description: 'Your EA batches content creation, schedules posts across your platforms, and engages with comments so your online presence stays active even when you are heads-down delivering.',
      time_saved: '3 hrs/week',
    },
  ],
  personal: [
    {
      name: 'Booking your flights, hotels, and rental cars',
      description: 'Your EA researches options that match your preferences and budget, books everything, and sends you a clean itinerary. No more spending 45 minutes comparing flights.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Scheduling your doctor, dentist, and personal appointments',
      description: 'Your EA calls, books, confirms, and adds everything to your calendar with reminders. You just show up.',
      time_saved: '1 hr/week',
    },
    {
      name: 'Handling your Amazon orders, returns, and subscriptions',
      description: 'Managing shopping lists, tracking deliveries, processing returns, and reordering household items before you run out.',
      time_saved: '1.5 hrs/week',
    },
    {
      name: 'Dealing with insurance, utilities, and service providers',
      description: 'Those 45-minute phone holds and back-and-forth emails with service companies - all handled. Your EA negotiates, resolves issues, and keeps records.',
      time_saved: '2 hrs/month',
    },
    {
      name: 'Never missing a birthday, anniversary, or important date again',
      description: 'Your EA tracks every important date, picks thoughtful gifts within your budget, and makes sure they arrive on time.',
      time_saved: '1 hr/month',
    },
  ],
  calendar: [
    {
      name: 'Booking your meetings without the back-and-forth',
      description: 'Your EA coordinates across time zones, finds open slots, sends invites, and handles all reschedules. You never send another "does 3pm work?" email.',
      time_saved: '1 hr/day',
    },
    {
      name: 'Protecting your focus time so you can actually get work done',
      description: 'Your EA blocks deep work periods on your calendar and politely declines or reschedules low-priority requests that try to intrude.',
      time_saved: '45 min/day',
    },
    {
      name: 'Prepping you for every meeting so you walk in ready',
      description: 'Quick briefing doc with who you are meeting, what they need, relevant history, and your talking points. No more scrambling 5 minutes before.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Making sure your recurring meetings actually happen on schedule',
      description: 'Weekly team check-ins, monthly reviews, quarterly planning - all scheduled, reminded, and organized so they just run.',
      time_saved: '1 hr/week',
    },
  ],
  email: [
    {
      name: 'Getting your inbox to zero every single day',
      description: 'Your EA processes every incoming message, sorts by priority, flags what needs you, drafts responses where possible, and archives the rest. You only touch what matters.',
      time_saved: '2+ hrs/day',
    },
    {
      name: 'Drafting replies to client and vendor emails in your voice',
      description: 'Standard questions, scheduling confirmations, vendor inquiries - all handled in your tone so nobody knows the difference. You just approve or send.',
      time_saved: '1 hr/day',
    },
    {
      name: 'Following up on emails that went cold so nothing slips',
      description: 'Tracking every open thread that needs a response, sending follow-up nudges at the right intervals, and escalating to you only when it is truly stuck.',
      time_saved: '45 min/day',
    },
  ],
};

/**
 * Mid-stage fallback tasks ($1M - $5M)
 * "Scaling operations" - team coordination, process documentation
 */
const MID_STAGE_TASKS: Record<CoreFourArea, PDFTask[]> = {
  business: [
    {
      name: 'Turning your recurring tasks into permanent hand-offs with documented SOPs',
      description: 'Your EA builds playbooks for every repeated process - from client onboarding to monthly reporting - so tasks get done consistently whether you are involved or not.',
      time_saved: '4 hrs/month',
    },
    {
      name: 'Keeping your CRM and sales pipeline accurate and up to date',
      description: 'New contacts entered, deal stages updated, meeting notes logged, follow-up tasks created. Your sales data stays clean and actionable without you touching it.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Compiling your weekly KPIs and business dashboard',
      description: 'Your EA pulls numbers from your tools, builds a summary you can scan in 2 minutes, and highlights trends or red flags that need your attention.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Managing your client onboarding process end to end',
      description: 'Welcome emails, kickoff scheduling, document collection, system access setup, and first-week check-ins - all handled so new clients feel taken care of from day one.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Staying on top of receipts, expense reports, and reimbursements',
      description: 'Categorizing receipts as they come in, reconciling credit card statements weekly, and preparing expense reports so your bookkeeper has clean data.',
      time_saved: '4 hrs/month',
    },
    {
      name: 'Managing vendor contracts, renewals, and negotiations',
      description: 'Tracking expiration dates, collecting competitive quotes before renewals, and preparing comparison docs so you just make the final call.',
      time_saved: '3 hrs/month',
    },
    {
      name: 'Coordinating team updates and distributing meeting action items',
      description: 'Weekly updates sent to the right people, meeting notes distributed within 24 hours, action items tracked and followed up on so nothing falls through.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Screening and scheduling interviews for your open positions',
      description: 'Reviewing resumes, coordinating interview slots, sending prep materials to candidates, and compiling feedback from your team after each round.',
      time_saved: '3 hrs/week',
    },
  ],
  personal: [
    {
      name: 'Coordinating your travel including flights, hotels, and ground transport',
      description: 'Your EA researches options matching your preferences, books everything, manages loyalty programs, and builds a complete itinerary with confirmations.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Managing your family calendar alongside your work schedule',
      description: 'School pickups, kids activities, family events, doctor appointments - all tracked and synced so nothing gets double-booked or forgotten.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Handling Amazon orders, returns, and household restocking',
      description: 'Managing shopping lists, tracking deliveries, processing returns, and setting up Subscribe & Save for items you always need.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Dealing with home service providers and contractors',
      description: 'Scheduling repairs, getting quotes from multiple contractors, coordinating access, and following up until the job is done right.',
      time_saved: '2 hrs/month',
    },
    {
      name: 'Sending thoughtful gifts for birthdays, holidays, and client milestones',
      description: 'Your EA tracks every important date, selects appropriate gifts, handles ordering and shipping, and includes personal notes.',
      time_saved: '2 hrs/month',
    },
  ],
  calendar: [
    {
      name: 'Owning your entire scheduling workflow across teams and clients',
      description: 'Your EA coordinates multi-party meetings, handles time zone math, manages reschedules, and sends calendar prep - no scheduling email ever touches your inbox.',
      time_saved: '1.5 hrs/day',
    },
    {
      name: 'Structuring your week around high-energy and low-energy periods',
      description: 'Blocking strategic thinking time in your peak hours, clustering meetings together, and keeping Fridays clear for deep work or recovery.',
      time_saved: '1 hr/day',
    },
    {
      name: 'Preparing briefing docs before every external meeting',
      description: 'Company research, LinkedIn profiles, previous conversation history, and your talking points - delivered 30 minutes before every meeting.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Aligning travel days with your meeting schedule seamlessly',
      description: 'When you travel, your EA adjusts meeting times, blocks transit windows, and ensures you are never double-booked or rushed between commitments.',
      time_saved: '2 hrs/week',
    },
  ],
  email: [
    {
      name: 'Processing your entire inbox daily so you only see what matters',
      description: 'Your EA triages every message - responding to routine items, routing requests to the right team member, and surfacing only the 5-10 emails that truly need your input.',
      time_saved: '2+ hrs/day',
    },
    {
      name: 'Drafting client-facing emails and follow-ups in your voice',
      description: 'Proposals, check-ins, thank-you notes, and status updates - all drafted and queued for your quick review. Your clients get timely, professional communication without you writing it.',
      time_saved: '1 hr/day',
    },
    {
      name: 'Tracking email threads that need follow-up and nudging at the right time',
      description: 'Your EA monitors every open conversation, sends follow-ups when responses are overdue, and keeps a running list of pending items so nothing gets lost.',
      time_saved: '45 min/day',
    },
  ],
};

/**
 * Late-stage fallback tasks ($5M+)
 * "Executive-grade delegation" - board prep, investor relations, strategic ops
 */
const LATE_STAGE_TASKS: Record<CoreFourArea, PDFTask[]> = {
  business: [
    {
      name: 'Preparing your monthly board deck with updated financials and KPIs',
      description: 'Your EA compiles data from your finance team, formats the presentation, adds commentary on trends, and has the deck ready for your review 3 days before the board meeting.',
      time_saved: '6 hrs/month',
    },
    {
      name: 'Coordinating investor communications and quarterly updates',
      description: 'Drafting investor newsletters, scheduling catch-up calls, preparing data rooms for due diligence, and keeping your investor CRM current.',
      time_saved: '4 hrs/month',
    },
    {
      name: 'Managing your executive team meeting cadence and agendas',
      description: 'Weekly leadership syncs, monthly all-hands, quarterly offsites - your EA owns the agenda, pre-reads, action items, and follow-through for every executive meeting.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Owning your entire vendor and partnership ecosystem',
      description: 'Contract renewals, performance reviews, new vendor evaluations, and partnership opportunity screening - all managed proactively so you only step in for final decisions.',
      time_saved: '4 hrs/month',
    },
    {
      name: 'Building and maintaining your company knowledge base and SOPs',
      description: 'Every process, every playbook, every institutional knowledge item - documented, organized, and kept current so your business is not dependent on any single person.',
      time_saved: '4 hrs/month',
    },
    {
      name: 'Screening strategic opportunities and partnership inbounds',
      description: 'Your EA evaluates incoming partnership requests, conference speaking invitations, and business opportunities against your criteria before they reach your desk.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Coordinating cross-functional projects and tracking milestones',
      description: 'Your EA keeps project timelines updated, follows up with department leads on deliverables, and flags risks before they become problems.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Managing your company social media and thought leadership pipeline',
      description: 'Content calendar management, ghostwriting LinkedIn posts from your ideas, coordinating with your marketing team, and tracking engagement metrics.',
      time_saved: '3 hrs/week',
    },
  ],
  personal: [
    {
      name: 'Full travel management including international logistics',
      description: 'Multi-leg itineraries, visa requirements, travel insurance, restaurant reservations, car services, and real-time rebooking when plans change. You just pack and go.',
      time_saved: '4 hrs/week',
    },
    {
      name: 'Managing your household staff and service providers',
      description: 'Coordinating with your housekeeper, landscaper, pool service, nanny, and any other providers. Scheduling, paying, reviewing, and replacing when needed.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Coordinating family logistics across multiple schedules',
      description: 'Your partner, kids, and extended family events - all synced with your work calendar. School events, sports, doctor appointments, social commitments - nothing conflicts.',
      time_saved: '3 hrs/week',
    },
    {
      name: 'Curating gifts for clients, partners, and personal relationships',
      description: 'Maintaining a gift database with preferences, past gifts, and budgets. Selecting, ordering, and shipping for every occasion with personal touches.',
      time_saved: '3 hrs/month',
    },
    {
      name: 'Managing your personal financial admin and insurance renewals',
      description: 'Property insurance, auto renewals, warranty claims, subscription audits, and coordinating with your financial advisor on paperwork.',
      time_saved: '3 hrs/month',
    },
  ],
  calendar: [
    {
      name: 'Owning your executive calendar with energy-based scheduling',
      description: 'Your EA structures your week around your peak performance windows - strategic thinking in the morning, meetings clustered mid-day, and creative work protected.',
      time_saved: '1.5 hrs/day',
    },
    {
      name: 'Coordinating multi-stakeholder meetings across time zones',
      description: 'Board meetings, investor calls, partner syncs, and team offsites - all scheduled considering everyone is availability, time zones, and prep requirements.',
      time_saved: '1 hr/day',
    },
    {
      name: 'Preparing executive briefing packets for every external meeting',
      description: 'Company research, key personnel bios, deal history, talking points, and strategic context - delivered 24 hours before every important meeting.',
      time_saved: '4 hrs/week',
    },
    {
      name: 'Planning quarterly offsites and leadership retreats',
      description: 'Venue research, agenda planning, logistics coordination, travel arrangements for attendees, and post-event follow-up - fully managed.',
      time_saved: '8 hrs/quarter',
    },
  ],
  email: [
    {
      name: 'Executive-level inbox management with strategic priority routing',
      description: 'Your EA manages 200+ daily emails, categorizes by strategic importance, drafts executive-quality responses, and ensures you spend no more than 20 minutes on email daily.',
      time_saved: '3 hrs/day',
    },
    {
      name: 'Drafting board and investor correspondence',
      description: 'Your EA prepares polished, data-informed responses for board members and investors, coordinating with your finance team for accuracy before you review and send.',
      time_saved: '2 hrs/week',
    },
    {
      name: 'Managing your professional network and relationship follow-ups',
      description: 'Tracking who you met, when to follow up, drafting check-in messages, and maintaining your network so relationships stay warm without calendar effort.',
      time_saved: '1 hr/day',
    },
  ],
};

const TIER_MAP: Record<FallbackTier, Record<CoreFourArea, PDFTask[]>> = {
  early: EARLY_STAGE_TASKS,
  mid: MID_STAGE_TASKS,
  late: LATE_STAGE_TASKS,
};

/**
 * Get fallback tasks for a specific tier and Core Four area
 */
export function getFallbackTasks(
  tier: FallbackTier,
  area: CoreFourArea,
  count: number
): PDFTask[] {
  const pool = TIER_MAP[tier][area];
  return pool.slice(0, count);
}

/**
 * Get all fallback tasks for a tier (all areas)
 */
export function getAllFallbackTasks(tier: FallbackTier): Record<CoreFourArea, PDFTask[]> {
  return TIER_MAP[tier];
}
