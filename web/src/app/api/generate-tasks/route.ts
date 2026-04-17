/**
 * API Route: POST /api/generate-tasks
 *
 * Generates personalized task reports using AI based on lead data.
 * Uses two-prompt chain: Business Analysis -> Core Four Task Generation
 *
 * Request Body: UnifiedLeadData
 * Response:
 *   - Success: { success: true, data: TaskGenerationResult }
 *   - Error: { success: false, error: string, correlationId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { UnifiedLeadData, TaskGenerationResult } from '@/types';
import { generateTasks } from '@/lib/ai/task-generator';
import { validateReport } from '@/lib/ai/report-validator';
import { fixReportIssues, ensureCoreEATasks, padThinAreas } from '@/lib/ai/report-fixer';
import { mapRevenueTier } from '@/lib/ai/lead-brief';
import { sendCriticalAlert } from '@/lib/alerts/critical-alert';

// Pipeline = grounded research (web_fetch + analysis) + two-prompt chain
// (analysis + generation) + sanity check. Real-world total: 90-150s.
// Hard cap 300s is the Vercel Pro ceiling — gives us buffer and still
// lets the route fail clearly rather than hanging indefinitely.
export const maxDuration = 300;

function generateCorrelationId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const log = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[API:generate-tasks:INFO] ${message}`, context || '');
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[API:generate-tasks:WARN] ${message}`, context || '');
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[API:generate-tasks:ERROR] ${message}`, context || '');
  },
};

interface RequestValidationResult {
  isValid: boolean;
  errors: string[];
  leadData?: UnifiedLeadData;
}

const VALID_LEAD_TYPES = ['main', 'standard', 'simple'] as const;

function validateRequestBody(body: unknown): RequestValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Request body must be a valid JSON object'],
    };
  }

  const data = body as Record<string, unknown>;

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Required field "email" is missing or empty');
  }

  if (!data.leadType) {
    errors.push('Required field "leadType" is missing');
  } else if (!VALID_LEAD_TYPES.includes(data.leadType as typeof VALID_LEAD_TYPES[number])) {
    errors.push(
      `Invalid "leadType": must be one of ${VALID_LEAD_TYPES.join(', ')}`
    );
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const leadData: UnifiedLeadData = {
    ...data,
    timestamp: (data.timestamp as string) || new Date().toISOString(),
  } as UnifiedLeadData;

  return { isValid: true, errors: [], leadData };
}

function getErrorStatusCode(error: Error): number {
  const message = error.message.toLowerCase();
  if (message.includes('api key') || message.includes('missing api key')) {
    return 401;
  }
  return 500;
}

/**
 * POST /api/generate-tasks
 *
 * Flow:
 * 1. Validate request body
 * 2. Generate tasks using two-prompt chain
 * 3. Validate by Core Four area counts + quality
 * 4. Auto-fix if validation fails (pad thin areas, inject core tasks)
 * 5. Return result
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();

  log.info('Received task generation request', { correlationId });

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      log.warn('Invalid JSON in request body', { correlationId });
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', correlationId },
        { status: 400 }
      );
    }

    const validation = validateRequestBody(body);
    if (!validation.isValid || !validation.leadData) {
      log.warn('Request validation failed', {
        correlationId,
        errors: validation.errors,
      });
      return NextResponse.json(
        { success: false, error: validation.errors.join('; '), correlationId },
        { status: 400 }
      );
    }

    const leadData = validation.leadData;
    const revenueTier = mapRevenueTier(leadData.revenue);

    log.info('Starting task generation', {
      correlationId,
      leadType: leadData.leadType,
      email: leadData.email,
      revenueTier,
    });

    // Generate tasks using AI (two-prompt chain with fallback)
    let result: TaskGenerationResult;
    try {
      result = await generateTasks(leadData);
    } catch (error) {
      const err = error as Error;
      const statusCode = getErrorStatusCode(err);

      log.error('Task generation failed', {
        correlationId,
        error: err.message,
        statusCode,
      });

      void sendCriticalAlert('AI Report Generation Failed', {
        error: err.message,
        endpoint: '/api/generate-tasks',
        userEmail: leadData.email,
      });

      return NextResponse.json(
        { success: false, error: err.message, correlationId },
        { status: statusCode }
      );
    }

    // Validate the generated report
    let validationResult = validateReport(result);

    log.info('Initial validation result', {
      correlationId,
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warningCount: validationResult.warnings.length,
    });

    // Auto-fix if validation fails
    if (!validationResult.isValid && validationResult.errors.length > 0) {
      log.info('Attempting auto-fix for validation errors', {
        correlationId,
        errors: validationResult.errors,
      });

      result = fixReportIssues(result, validationResult.errors, revenueTier);

      validationResult = validateReport(result);

      log.info('Post-fix validation result', {
        correlationId,
        isValid: validationResult.isValid,
        errors: validationResult.errors,
      });
    }

    // Ensure core EA tasks are present
    result = ensureCoreEATasks(result);

    // Pad thin areas with revenue-tier appropriate fallbacks
    result = padThinAreas(result, revenueTier);

    log.info('Task generation completed successfully', {
      correlationId,
      totalTasks: result.total_task_count,
      businessProcesses: result.tasks.businessProcesses.length,
      personalLife: result.tasks.personalLife.length,
      calendar: result.tasks.calendar.length,
      email: result.tasks.email.length,
    });

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error;

    log.error('Unexpected error in task generation', {
      correlationId,
      error: err.message,
      stack: err.stack,
    });

    void sendCriticalAlert('Unexpected Error in Task Generation', {
      error: err.message,
      endpoint: '/api/generate-tasks',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during task generation',
        correlationId,
      },
      { status: 500 }
    );
  }
}
