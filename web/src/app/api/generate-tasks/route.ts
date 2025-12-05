/**
 * API Route: POST /api/generate-tasks
 *
 * Generates personalized task reports using AI based on lead data.
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
import { fixReportIssues, ensureCoreEATasks } from '@/lib/ai/report-fixer';
import { sendAsyncNotifications } from '@/lib/email/asyncNotifications';

/**
 * Generate a correlation ID for request tracking
 */
function generateCorrelationId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Structured logger for API route operations
 */
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

/**
 * Validation result type
 */
interface RequestValidationResult {
  isValid: boolean;
  errors: string[];
  leadData?: UnifiedLeadData;
}

/**
 * Valid lead types
 */
const VALID_LEAD_TYPES = ['main', 'standard', 'simple'] as const;

/**
 * Validate the incoming request body
 *
 * Required fields:
 * - email: string
 * - leadType: 'main' | 'standard' | 'simple'
 */
function validateRequestBody(body: unknown): RequestValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Request body must be a valid JSON object'],
    };
  }

  const data = body as Record<string, unknown>;

  // Validate required field: email
  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Required field "email" is missing or empty');
  }

  // Validate required field: leadType
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

  // Ensure timestamp is set
  const leadData: UnifiedLeadData = {
    ...data,
    timestamp: (data.timestamp as string) || new Date().toISOString(),
  } as UnifiedLeadData;

  return { isValid: true, errors: [], leadData };
}

/**
 * Determine HTTP status code based on error type
 */
function getErrorStatusCode(error: Error): number {
  const message = error.message.toLowerCase();

  if (message.includes('api key') || message.includes('missing api key')) {
    return 401;
  }

  // Default to 500 for other errors (timeouts, AI failures, etc.)
  return 500;
}

/**
 * POST /api/generate-tasks
 *
 * Generates personalized tasks based on lead data using AI.
 *
 * Flow:
 * 1. Validate request body
 * 2. Generate tasks using AI
 * 3. Validate generated report
 * 4. Auto-fix if validation fails
 * 5. Ensure core EA tasks are present
 * 6. Return result
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();

  log.info('Received task generation request', { correlationId });

  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      log.warn('Invalid JSON in request body', { correlationId });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          correlationId,
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateRequestBody(body);
    if (!validation.isValid || !validation.leadData) {
      log.warn('Request validation failed', {
        correlationId,
        errors: validation.errors,
      });
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join('; '),
          correlationId,
        },
        { status: 400 }
      );
    }

    const leadData = validation.leadData;

    log.info('Starting task generation', {
      correlationId,
      leadType: leadData.leadType,
      email: leadData.email,
    });

    // Generate tasks using AI
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

      return NextResponse.json(
        {
          success: false,
          error: err.message,
          correlationId,
        },
        { status: statusCode }
      );
    }

    // Validate the generated report
    let validationResult = validateReport(result);

    log.info('Initial validation result', {
      correlationId,
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
    });

    // Auto-fix if validation fails
    if (!validationResult.isValid && validationResult.errors.length > 0) {
      log.info('Attempting auto-fix for validation errors', {
        correlationId,
        errors: validationResult.errors,
      });

      result = fixReportIssues(result, validationResult.errors);

      // Re-validate after fixes
      validationResult = validateReport(result);

      log.info('Post-fix validation result', {
        correlationId,
        isValid: validationResult.isValid,
        errors: validationResult.errors,
      });
    }

    // Ensure core EA tasks are present
    result = ensureCoreEATasks(result);

    log.info('Task generation completed successfully', {
      correlationId,
      totalTasks: result.total_task_count,
      eaPercent: result.ea_task_percent,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error;

    log.error('Unexpected error in task generation', {
      correlationId,
      error: err.message,
      stack: err.stack,
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
