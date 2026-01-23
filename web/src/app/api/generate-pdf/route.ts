/**
 * API Route: POST /api/generate-pdf
 *
 * Generates an EA Time Freedom Report PDF from task data and lead information.
 * Uploads to Vercel Blob for permanent public URL access.
 *
 * Request Body:
 * {
 *   tasks: { daily: Task[], weekly: Task[], monthly: Task[] },
 *   eaPercentage: number,
 *   userData: {
 *     firstName: string,
 *     lastName: string,
 *     email: string,
 *     title?: string,
 *     businessType?: string,
 *     ...
 *   }
 * }
 *
 * Response:
 * Success: { success: true, pdf: string (base64), blobUrl: string | null, generatedAt: string }
 * Error: { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generatePDFV2 } from '@/lib/pdf/generator-v2';
import { generateSafeFilename } from '@/lib/pdf/s3Service';
import type { TaskGenerationResult, UnifiedLeadData, TasksByFrequency } from '@/types';

/**
 * Task hours structure from ROI calculator
 */
interface TaskHours {
  email: number;
  personalLife: number;
  calendar: number;
  businessProcesses: number;
}

/**
 * Request body structure for PDF generation
 */
interface GeneratePDFRequestBody {
  tasks: TasksByFrequency;
  eaPercentage: number;
  userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    title?: string;
    businessType?: string;
    website?: string;
    company?: string;
    stage?: number;
    stageName?: string;
    [key: string]: unknown;
  };
  /** Task hours from ROI calculator for enhanced PDF */
  taskHours?: TaskHours;
  /** Revenue range for ROI calculations */
  revenueRange?: string;
}

/**
 * POST handler for PDF generation
 *
 * Accepts task data and user information, generates a PDF report,
 * optionally uploads to S3, and returns the result.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body: GeneratePDFRequestBody = await request.json();
    const { tasks, eaPercentage, userData, taskHours, revenueRange } = body;

    // Construct TaskGenerationResult from request data
    const allTasks = [
      ...(tasks.daily || []),
      ...(tasks.weekly || []),
      ...(tasks.monthly || []),
    ];
    const eaTaskCount = allTasks.filter((task) => task.isEA).length;

    const report: TaskGenerationResult = {
      tasks: {
        daily: tasks.daily || [],
        weekly: tasks.weekly || [],
        monthly: tasks.monthly || [],
      },
      ea_task_percent: eaPercentage,
      ea_task_count: eaTaskCount,
      total_task_count: allTasks.length,
      summary: `Based on our analysis, approximately ${eaPercentage}% of your daily, weekly, and monthly tasks could be delegated to an Executive Assistant.`,
    };

    // Construct UnifiedLeadData from userData
    const leadData: UnifiedLeadData = {
      leadType: 'main',
      timestamp: new Date().toISOString(),
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      title: userData.title || '',
      businessType: userData.businessType || userData.company || '',
      website: userData.website || '',
    };

    // PDF options with ROI data for V2 generator
    const pdfOptions = {
      includeMetadata: true,
      taskHours: taskHours,
      revenueRange: revenueRange,
    };

    // Generate PDF with V2 clean design
    const pdfResult = await generatePDFV2(report, leadData, pdfOptions);

    // Check for PDF generation failure
    if (!pdfResult.success || !pdfResult.base64) {
      console.error('Error generating PDF:', pdfResult.error);
      return NextResponse.json(
        { success: false, error: pdfResult.error || 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Generate filename for the PDF
    const filename = generateSafeFilename(
      userData.firstName || 'Report',
      userData.lastName || ''
    );

    // Upload to Vercel Blob for public URL access
    let blobUrl: string | null = null;

    try {
      // Convert base64 to Buffer for Blob upload
      const pdfBuffer = Buffer.from(pdfResult.base64, 'base64');

      // Upload to Vercel Blob
      const blob = await put(`reports/${filename}`, pdfBuffer, {
        access: 'public',
        contentType: 'application/pdf',
      });

      blobUrl = blob.url;
      console.log('PDF uploaded to Vercel Blob:', blobUrl);
    } catch (blobError: unknown) {
      // Graceful degradation: log error but continue
      const errorMessage = blobError instanceof Error ? blobError.message : 'Unknown Blob error';
      console.error('Vercel Blob upload failed (non-critical):', errorMessage);
      // blobUrl remains null - PDF will still be sent via email
    }

    // Return success response with filename and blob URL for Close CRM
    return NextResponse.json({
      success: true,
      pdf: pdfResult.base64,
      filename: filename,
      blobUrl: blobUrl,
      // Keep s3Url for backward compatibility
      s3Url: blobUrl,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    // Handle unexpected errors
    // Reference: source route.ts lines 178-184
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
