/**
 * PDF Generator V2 — Navy/Orange Premium Theme
 *
 * Generates personalized Time Freedom Report PDFs with
 * DM Serif Display + DM Sans fonts, navy/orange palette.
 *
 * Tasks arrive pre-grouped by Core Four area.
 * Display order: Business Processes (first) -> Personal Life -> Calendar -> Email (last)
 */

import { jsPDF } from 'jspdf';
import type { TaskGenerationResult, Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';
import type { PDFGenerationResult } from '@/types/pdf';
import {
  generateTimeFreedomReport,
  type PDFReportData,
  type PDFTask,
  type CoreFourArea,
  type CoreFourTaskGroup,
  type Testimonial,
  inferCoreTaskType,
  C,
} from './layout-v2';
import { registerFonts } from './fonts/register-fonts';
import { calculateROI, type TaskHours } from '@/lib/roi-calculator';
import { getFallbackTasks, getFallbackTier } from '@/lib/ai/fallback-tasks';
import { mapRevenueTier, type RevenueTierLabel } from '@/lib/ai/lead-brief';

/**
 * Options for PDF generation
 */
export interface GeneratorV2Options {
  taskHours?: TaskHours;
  revenueRange?: string;
  includeMetadata?: boolean;
}

/**
 * Transform a Task to PDFTask format with estimated time saved
 */
function transformTask(task: Task): PDFTask {
  const titleLower = (task.title || '').toLowerCase();

  // Estimate time saved based on task type
  let timeSaved: string;
  if (titleLower.includes('email') || titleLower.includes('inbox')) {
    timeSaved = '2+ hrs/day';
  } else if (titleLower.includes('calendar') || titleLower.includes('scheduling')) {
    timeSaved = '1 hr/day';
  } else if (titleLower.includes('social')) {
    timeSaved = '30 min/day';
  } else if (titleLower.includes('travel') || titleLower.includes('booking')) {
    timeSaved = '3 hrs/week';
  } else if (titleLower.includes('report') || titleLower.includes('financial') || titleLower.includes('kpi')) {
    timeSaved = '3 hrs/week';
  } else if (titleLower.includes('crm') || titleLower.includes('pipeline')) {
    timeSaved = '2 hrs/week';
  } else if (titleLower.includes('process') || titleLower.includes('sop')) {
    timeSaved = '3 hrs/month';
  } else if (titleLower.includes('vendor') || titleLower.includes('contract')) {
    timeSaved = '3 hrs/month';
  } else if (titleLower.includes('expense') || titleLower.includes('receipt')) {
    timeSaved = '4 hrs/month';
  } else if (titleLower.includes('personal') || titleLower.includes('family') || titleLower.includes('amazon')) {
    timeSaved = '2 hrs/week';
  } else if (titleLower.includes('meeting') || titleLower.includes('prep')) {
    timeSaved = '2 hrs/week';
  } else {
    timeSaved = '2 hrs/week';
  }

  return {
    name: task.title,
    description: task.description,
    time_saved: timeSaved,
  };
}

// Per-area minimum tasks before fallback injection
const MIN_TASKS: Record<CoreFourArea, number> = {
  business: 5,
  personal: 3,
  calendar: 3,
  email: 2,
};

/**
 * Build Core Four task groups from pre-grouped tasks.
 * Tasks arrive from the AI already grouped by Core Four area.
 * Applies fallback injection for thin areas.
 */
function buildCoreFourGroups(
  tasks: TaskGenerationResult['tasks'],
  revenueTier: RevenueTierLabel = 'growing'
): CoreFourTaskGroup[] {
  const tier = getFallbackTier(revenueTier);

  // Map from TasksByCoreFour keys to CoreFourArea keys
  const areaMapping: Array<{ taskKey: keyof typeof tasks; areaKey: CoreFourArea }> = [
    { taskKey: 'businessProcesses', areaKey: 'business' },
    { taskKey: 'personalLife', areaKey: 'personal' },
    { taskKey: 'calendar', areaKey: 'calendar' },
    { taskKey: 'email', areaKey: 'email' },
  ];

  const groups: Record<CoreFourArea, PDFTask[]> = {
    business: [],
    personal: [],
    calendar: [],
    email: [],
  };

  // Transform tasks from each area
  for (const { taskKey, areaKey } of areaMapping) {
    const areaTasks = tasks[taskKey] || [];
    groups[areaKey] = areaTasks.map(t => transformTask(t));
  }

  // Fallback any tasks that might not have a coreTaskType set
  // by re-classifying orphans via inferCoreTaskType
  // (This handles edge cases from legacy/fallback prompts)

  // Inject fallbacks for thin areas using revenue-tier-appropriate pools
  for (const area of ['business', 'personal', 'calendar', 'email'] as CoreFourArea[]) {
    if (groups[area].length < MIN_TASKS[area]) {
      const needed = MIN_TASKS[area] - groups[area].length;
      const fallbacks = getFallbackTasks(tier, area, needed);
      groups[area].push(...fallbacks);
    }
  }

  // Build CoreFourTaskGroup objects — display order: business FIRST, email LAST
  const AREA_CONFIG: Record<CoreFourArea, { title: string; subtitle: string; accent: readonly [number, number, number] }> = {
    business: {
      title: 'Recurring Business Processes',
      subtitle: 'Every repetitive task becomes a permanent handoff',
      accent: C.sectionAccent,
    },
    personal: {
      title: 'Personal Life Ownership',
      subtitle: 'Hotels, flights, Amazon, family logistics, all handled',
      accent: C.sectionAccent,
    },
    calendar: {
      title: 'Calendar Ownership',
      subtitle: 'Your EA manages energy, not just time',
      accent: C.sectionAccent,
    },
    email: {
      title: 'Email Ownership',
      subtitle: 'Your EA owns your inbox completely',
      accent: C.sectionAccent,
    },
  };

  // Display order: business -> personal -> calendar -> email
  return (['business', 'personal', 'calendar', 'email'] as CoreFourArea[]).map(area => ({
    area,
    title: AREA_CONFIG[area].title,
    subtitle: AREA_CONFIG[area].subtitle,
    accent: AREA_CONFIG[area].accent,
    tasks: groups[area],
  }));
}

/**
 * Transform TaskGenerationResult to PDFReportData
 */
function transformToPDFData(
  report: TaskGenerationResult,
  leadData: UnifiedLeadData,
  roi: ReturnType<typeof calculateROI> | null
): PDFReportData {
  const clientName = [leadData.firstName, leadData.lastName]
    .filter(Boolean)
    .join(' ') || 'Business Owner';

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // All tasks are EA-delegatable in the new architecture
  const allTasks = [
    ...report.tasks.businessProcesses,
    ...report.tasks.personalLife,
    ...report.tasks.calendar,
    ...report.tasks.email,
  ];
  const totalTasksEA = allTasks.length;

  // ROI defaults
  const annualValue = roi?.annualRevenueUnlocked || 195000;
  const weeklyHours = roi?.weeklyHoursDelegated || 10;
  const eaInvestment = roi?.eaInvestment || 33000;
  const netReturn = roi?.netReturn || (annualValue - eaInvestment);
  const roiMultiplier = Number((roi?.roiMultiplier || (annualValue / eaInvestment)).toFixed(1));

  const analysisText = `Based on your revenue level and the workload you described, you are spending roughly ${weeklyHours} hours per week on tasks that do not require your expertise. That is over ${Math.round(weeklyHours * 52)} hours per year, time that could go toward closing deals, building relationships, or being present with your family.`;

  // Determine revenue tier for fallback selection
  const revenueTier = mapRevenueTier(leadData.revenue);

  // Build Core Four groups with fallback injection
  const coreFourGroups = buildCoreFourGroups(report.tasks, revenueTier);

  // Testimonials
  const testimonials: Testimonial[] = [
    {
      quote: "I haven't touched my inbox in 3 weeks. Anne handles it all - I just get the highlights that actually matter.",
      name: 'Keri F.',
      role: 'Founder',
      revenue: '$1.2M/year',
    },
    {
      quote: "Went from 7 days a week grinding to focused work hours. Aileen runs my entire schedule - I just show up where I'm needed.",
      name: 'David H.',
      role: 'CFO',
      revenue: '$3M/year',
    },
    {
      quote: "Took a 2-week vacation without touching my laptop. Maria kept everything running - clients didn't even notice I was gone.",
      name: 'Jake K.',
      role: 'Founder',
      revenue: '$800K/year',
    },
    {
      quote: "She proactively built SOPs we didn't even ask for. Now my team runs itself - I'm finally working ON the business, not IN it.",
      name: 'Mitch S.',
      role: 'Co-founder',
      revenue: '$2.5M/year',
    },
  ];

  // Generate legacy daily/weekly/monthly arrays for backward compatibility
  // (used by PDFReportData but the actual rendering uses core_four_groups)
  const dailyTasks = report.tasks.email.slice(0, 3).map(t => transformTask(t));
  const weeklyTasks = report.tasks.calendar.slice(0, 3).map(t => transformTask(t));
  const monthlyTasks = report.tasks.businessProcesses.slice(0, 3).map(t => transformTask(t));

  return {
    client_name: clientName,
    date,
    annual_value: annualValue,
    weekly_hours: weeklyHours,
    total_tasks_ea: totalTasksEA > 0 ? totalTasksEA : 20,
    ea_investment: eaInvestment,
    net_return: netReturn,
    roi_multiplier: roiMultiplier,
    analysis_text: analysisText,
    daily_tasks: dailyTasks,
    weekly_tasks: weeklyTasks,
    monthly_tasks: monthlyTasks,

    // Cover page context
    company_name: leadData.businessType || undefined,
    revenue_range: roi?.revenueRange || undefined,
    ceo_hourly_rate: roi?.ceoHourlyRate || undefined,

    // Core Four grouped tasks
    core_four_groups: coreFourGroups,

    // Testimonials
    testimonials,
  };
}

/**
 * Generate PDF using V2 layout
 */
export async function generatePDFV2(
  report: TaskGenerationResult,
  leadData: UnifiedLeadData,
  options: GeneratorV2Options = {}
): Promise<PDFGenerationResult> {
  const startTime = Date.now();

  try {
    console.log('[PDF Generator V2] *** STARTING *** PDF generation', {
      leadType: leadData.leadType,
      totalTasks: report.total_task_count,
      timestamp: new Date().toISOString(),
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    registerFonts(doc);

    const name = [leadData.firstName, leadData.lastName].filter(Boolean).join('_') || 'Report';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Time_Freedom_Report_${name}_${timestamp}.pdf`;

    const roi = options.taskHours && options.revenueRange
      ? calculateROI(options.taskHours, options.revenueRange)
      : null;

    const pdfData = transformToPDFData(report, leadData, roi);

    const userData = {
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
    };

    generateTimeFreedomReport(doc, pdfData, userData);

    if (options.includeMetadata) {
      doc.setProperties({
        title: 'Time Freedom Report',
        subject: 'Executive Assistant Task Delegation Analysis',
        author: 'Assistant Launch',
        keywords: 'executive assistant, delegation, time management, productivity',
        creator: 'Assistant Launch PDF Generator V2',
      });
    }

    const pdfArrayBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(pdfArrayBuffer);
    const base64 = doc.output('datauristring').split(',')[1];

    const duration = Date.now() - startTime;

    console.log('[PDF Generator V2] PDF generated successfully', {
      filename,
      size: buffer.length,
      duration,
      pages: doc.getNumberOfPages(),
    });

    return {
      success: true,
      buffer,
      base64,
      filename,
      size: buffer.length,
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    console.error('[PDF Generator V2] PDF generation failed', {
      error: errorMessage,
      duration,
      leadType: leadData.leadType,
    });

    return {
      success: false,
      filename: `Time_Freedom_Report_Error_${Date.now()}.pdf`,
      error: errorMessage,
    };
  }
}
