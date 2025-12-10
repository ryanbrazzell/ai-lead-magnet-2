/**
 * PDF Generator V2 - Clean, Minimal Design
 *
 * New PDF generator using the cleaner layout-v2 design.
 * Transforms existing task data structure to the new format.
 */

import { jsPDF } from 'jspdf';
import type { TaskGenerationResult, Task } from '@/types/task';
import type { UnifiedLeadData } from '@/types/lead';
import type { PDFGenerationResult } from '@/types/pdf';
import {
  generateTimeFreedomReport,
  type PDFReportData,
  type PDFTask,
} from './layout-v2';
import { calculateROI, type TaskHours } from '@/lib/roi-calculator';

/**
 * Options for PDF generation
 */
export interface GeneratorV2Options {
  /** Task hours from ROI calculator */
  taskHours?: TaskHours;
  /** Revenue range for ROI calculations */
  revenueRange?: string;
  /** Include document metadata */
  includeMetadata?: boolean;
}

/**
 * Transform a Task to PDFTask format
 */
function transformTask(task: Task, frequency: 'daily' | 'weekly' | 'monthly'): PDFTask {
  // Generate realistic time saved based on frequency and task type
  const titleLower = (task.title || '').toLowerCase();

  let timeSaved: string;
  if (frequency === 'daily') {
    if (titleLower.includes('email') || titleLower.includes('inbox')) {
      timeSaved = '2+ hrs/day';
    } else if (titleLower.includes('calendar') || titleLower.includes('scheduling')) {
      timeSaved = '1 hr/day';
    } else if (titleLower.includes('social')) {
      timeSaved = '30 min/day';
    } else {
      timeSaved = '45 min/day';
    }
  } else if (frequency === 'weekly') {
    if (titleLower.includes('report') || titleLower.includes('financial')) {
      timeSaved = '3 hrs/week';
    } else if (titleLower.includes('interview') || titleLower.includes('hiring')) {
      timeSaved = '2 hrs/week';
    } else {
      timeSaved = '1.5 hrs/week';
    }
  } else {
    if (titleLower.includes('reconciliation') || titleLower.includes('expense')) {
      timeSaved = '4 hrs/month';
    } else if (titleLower.includes('documentation') || titleLower.includes('process')) {
      timeSaved = '3 hrs/month';
    } else {
      timeSaved = '2 hrs/month';
    }
  }

  return {
    name: task.title,
    description: task.description,
    time_saved: timeSaved,
  };
}

/**
 * Transform TaskGenerationResult to PDFReportData
 */
function transformToPDFData(
  report: TaskGenerationResult,
  leadData: UnifiedLeadData,
  roi: ReturnType<typeof calculateROI> | null
): PDFReportData {
  // Get client name
  const clientName = [leadData.firstName, leadData.lastName]
    .filter(Boolean)
    .join(' ') || 'Business Owner';

  // Format date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate totals
  const allTasks = [
    ...report.tasks.daily,
    ...report.tasks.weekly,
    ...report.tasks.monthly,
  ];
  const totalTasksEA = allTasks.filter(t => t.isEA).length;

  // Use ROI values if available, otherwise use defaults matching the report page
  // Default taskHours on report page: email:3, personalLife:2, calendar:2, businessProcesses:3 = 10 hrs/week
  // Default revenue: $500k to $1M = $375/hr CEO rate
  // Default annual value: 10 hrs/week * 52 weeks * $375/hr = $195,000
  const annualValue = roi?.annualRevenueUnlocked || 195000;
  const weeklyHours = roi?.weeklyHoursDelegated || 10;
  const eaInvestment = roi?.eaInvestment || 33000;
  const netReturn = roi?.netReturn || (annualValue - eaInvestment);
  const roiMultiplier = Number((roi?.roiMultiplier || (annualValue / eaInvestment)).toFixed(1));

  // Generate analysis text
  const analysisText = `Based on your revenue level and the workload you described, you are spending roughly ${weeklyHours} hours per week on tasks that do not require your expertise. That is over ${Math.round(weeklyHours * 52)} hours per year — time that could go toward closing deals, building relationships, or being present with your family.`;

  // Separate EA tasks (isEA=true or owner="EA") vs Founder tasks (isEA=false or owner="You")
  const separateTasks = (tasks: Task[]) => {
    const eaTasks = tasks.filter(t => t.isEA || t.owner?.toLowerCase() === 'ea');
    const founderTasks = tasks.filter(t => !t.isEA && t.owner?.toLowerCase() !== 'ea');
    return { eaTasks, founderTasks };
  };

  const dailySeparated = separateTasks(report.tasks.daily);
  const weeklySeparated = separateTasks(report.tasks.weekly);
  const monthlySeparated = separateTasks(report.tasks.monthly);

  // Transform EA tasks (limit to 5 per category)
  const dailyTasks = dailySeparated.eaTasks
    .slice(0, 5)
    .map(t => transformTask(t, 'daily'));

  const weeklyTasks = weeklySeparated.eaTasks
    .slice(0, 5)
    .map(t => transformTask(t, 'weekly'));

  const monthlyTasks = monthlySeparated.eaTasks
    .slice(0, 5)
    .map(t => transformTask(t, 'monthly'));

  // Transform Founder tasks (limit to 3 per category)
  const dailyFounderTasks = dailySeparated.founderTasks
    .slice(0, 3)
    .map(t => transformTask(t, 'daily'));

  const weeklyFounderTasks = weeklySeparated.founderTasks
    .slice(0, 3)
    .map(t => transformTask(t, 'weekly'));

  const monthlyFounderTasks = monthlySeparated.founderTasks
    .slice(0, 3)
    .map(t => transformTask(t, 'monthly'));

  return {
    client_name: clientName,
    date,
    annual_value: annualValue,
    weekly_hours: weeklyHours,
    total_tasks_ea: totalTasksEA > 0 ? totalTasksEA : 15, // Default if not calculated
    ea_investment: eaInvestment,
    net_return: netReturn,
    roi_multiplier: roiMultiplier,
    analysis_text: analysisText,
    daily_tasks: dailyTasks,
    weekly_tasks: weeklyTasks,
    monthly_tasks: monthlyTasks,
    daily_founder_tasks: dailyFounderTasks,
    weekly_founder_tasks: weeklyFounderTasks,
    monthly_founder_tasks: monthlyFounderTasks,
  };
}

/**
 * Generate PDF using V2 layout (clean, minimal design)
 *
 * @param report - TaskGenerationResult with tasks
 * @param leadData - UnifiedLeadData for personalization
 * @param options - Generator options
 * @returns PDFGenerationResult
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
      totalTasks: Object.values(report.tasks).flat().length,
      eaPercentage: report.ea_task_percent,
      timestamp: new Date().toISOString(),
    });

    // Create new PDF document (Letter size to match Python version)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // Use A4 for consistency
    });

    // Generate filename
    const name = [leadData.firstName, leadData.lastName].filter(Boolean).join('_') || 'Report';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Time_Freedom_Report_${name}_${timestamp}.pdf`;

    // Calculate ROI if we have task hours
    const roi = options.taskHours && options.revenueRange
      ? calculateROI(options.taskHours, options.revenueRange)
      : null;

    // Transform data to new format
    const pdfData = transformToPDFData(report, leadData, roi);

    // Generate the report using new layout
    generateTimeFreedomReport(doc, pdfData);

    // Add metadata if requested
    if (options.includeMetadata) {
      doc.setProperties({
        title: 'Time Freedom Report',
        subject: 'Executive Assistant Task Delegation Analysis',
        author: 'Assistant Launch',
        keywords: 'executive assistant, delegation, time management, productivity',
        creator: 'Assistant Launch PDF Generator V2',
      });
    }

    // Generate outputs
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
