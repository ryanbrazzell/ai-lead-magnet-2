/**
 * API Route: POST /api/generate-pdf
 *
 * Generates an EA Time Freedom Report PDF from task data and lead information.
 * Optionally uploads to S3 for permanent public URL access.
 *
 * Ported from: /tmp/ea-time-freedom-report/app/api/generate-pdf/route.ts
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
 * Success: { success: true, pdf: string (base64), s3Url: string | null, generatedAt: string }
 * Error: { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf/generator';
import { uploadToS3, generateSafeFilename } from '@/lib/pdf/s3Service';
import type { TaskGenerationResult, UnifiedLeadData, TasksByFrequency } from '@/types';

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
    title?: string;
    businessType?: string;
    website?: string;
    company?: string;
    [key: string]: unknown;
  };
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
    const { tasks, eaPercentage, userData } = body;

    // Construct TaskGenerationResult from request data
    // Reference: source route.ts lines 5-146
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
      title: userData.title || '',
      businessType: userData.businessType || userData.company || '',
      website: userData.website || '',
    };

    // Generate PDF
    // Reference: source route.ts lines 5-146 (PDF generation section)
    const pdfResult = await generatePDF(report, leadData);

    // Check for PDF generation failure
    if (!pdfResult.success || !pdfResult.base64) {
      console.error('Error generating PDF:', pdfResult.error);
      return NextResponse.json(
        { success: false, error: pdfResult.error || 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Attempt S3 upload (non-blocking, optional)
    // Reference: source route.ts lines 150-169
    let s3Url: string | null = null;
    const s3BucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;

    if (
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      s3BucketName
    ) {
      try {
        // Convert base64 to Buffer for S3 upload
        const pdfBuffer = Buffer.from(pdfResult.base64, 'base64');

        // Generate safe filename for S3
        const filename = generateSafeFilename(
          userData.firstName || 'Report',
          userData.lastName || ''
        );

        // Upload to S3
        s3Url = await uploadToS3(pdfBuffer, filename, {
          contentType: 'application/pdf',
          makePublic: true,
        });

        console.log('PDF uploaded to S3:', s3Url);
      } catch (s3Error: unknown) {
        // Graceful degradation: log error but continue
        // Reference: source route.ts lines 165-168
        const errorMessage = s3Error instanceof Error ? s3Error.message : 'Unknown S3 error';
        console.error('S3 upload failed (non-critical):', errorMessage);
        // s3Url remains null - this is acceptable
      }
    }

    // Return success response
    // Reference: source route.ts lines 171-176
    return NextResponse.json({
      success: true,
      pdf: pdfResult.base64,
      s3Url: s3Url,
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
