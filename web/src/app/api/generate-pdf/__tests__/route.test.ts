/**
 * API Route Tests for /api/generate-pdf
 *
 * Tests the POST endpoint for PDF generation.
 * Reference: Task Group 5.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the PDF generator and S3 service
vi.mock('@/lib/pdf/generator', () => ({
  generatePDF: vi.fn(),
}));

vi.mock('@/lib/pdf/s3Service', () => ({
  uploadToS3: vi.fn(),
  generateSafeFilename: vi.fn(),
}));

// Import mocked modules
import { generatePDF } from '@/lib/pdf/generator';
import { uploadToS3, generateSafeFilename } from '@/lib/pdf/s3Service';
import { POST } from '../route';

// Type the mocks
const mockGeneratePDF = vi.mocked(generatePDF);
const mockUploadToS3 = vi.mocked(uploadToS3);
const mockGenerateSafeFilename = vi.mocked(generateSafeFilename);

/**
 * Helper to create a mock NextRequest with JSON body
 */
function createMockRequest(body: unknown): NextRequest {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

/**
 * Sample valid request body
 */
const validRequestBody = {
  tasks: {
    daily: [
      {
        title: 'Email Management',
        description: 'Handle inbox',
        owner: 'EA',
        isEA: true,
        category: 'Communication',
      },
    ],
    weekly: [
      {
        title: 'Report Prep',
        description: 'Prepare reports',
        owner: 'You',
        isEA: false,
        category: 'Reporting',
      },
    ],
    monthly: [
      {
        title: 'Planning',
        description: 'Monthly planning',
        owner: 'EA',
        isEA: true,
        category: 'Strategy',
      },
    ],
  },
  eaPercentage: 50,
  userData: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    title: 'CEO',
    businessType: 'Tech Startup',
  },
};

describe('POST /api/generate-pdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.S3_BUCKET_NAME;
    delete process.env.AWS_S3_BUCKET_NAME;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  /**
   * Test 1: POST /api/generate-pdf returns success response
   */
  it('returns success response with PDF data on successful generation', async () => {
    // Setup mock
    mockGeneratePDF.mockResolvedValue({
      success: true,
      buffer: Buffer.from('mock-pdf-content'),
      base64: 'bW9jay1wZGYtY29udGVudA==',
      filename: 'EA_Time_Freedom_Report_John_Doe_2024.pdf',
      size: 12345,
    });

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pdf).toBe('bW9jay1wZGYtY29udGVudA==');
    expect(data.s3Url).toBeNull(); // No S3 credentials
    expect(data.generatedAt).toBeDefined();
    expect(typeof data.generatedAt).toBe('string');
  });

  /**
   * Test 2: API returns 500 on generation failure
   */
  it('returns 500 status on PDF generation failure', async () => {
    // Setup mock to return failure
    mockGeneratePDF.mockResolvedValue({
      success: false,
      filename: 'error.pdf',
      error: 'PDF generation failed',
    });

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('PDF generation failed');
  });

  /**
   * Test 3: API returns PDF base64 when S3 fails (graceful fallback)
   */
  it('returns PDF base64 when S3 upload fails (graceful degradation)', async () => {
    // Setup successful PDF generation
    mockGeneratePDF.mockResolvedValue({
      success: true,
      buffer: Buffer.from('mock-pdf-content'),
      base64: 'bW9jay1wZGYtY29udGVudA==',
      filename: 'EA_Time_Freedom_Report_John_Doe_2024.pdf',
      size: 12345,
    });

    // Setup S3 to fail
    mockGenerateSafeFilename.mockReturnValue('EA_Time_Freedom_Report_John_Doe_12345.pdf');
    mockUploadToS3.mockRejectedValue(new Error('S3 upload failed'));

    // Set S3 environment variables
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.S3_BUCKET_NAME = 'test-bucket';

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    // Should still succeed with PDF
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pdf).toBe('bW9jay1wZGYtY29udGVudA==');
    expect(data.s3Url).toBeNull(); // S3 failed, so null
    expect(data.generatedAt).toBeDefined();
  });

  /**
   * Test 4: API returns both pdf and s3Url on full success
   */
  it('returns both pdf and s3Url when S3 upload succeeds', async () => {
    // Setup successful PDF generation
    mockGeneratePDF.mockResolvedValue({
      success: true,
      buffer: Buffer.from('mock-pdf-content'),
      base64: 'bW9jay1wZGYtY29udGVudA==',
      filename: 'EA_Time_Freedom_Report_John_Doe_2024.pdf',
      size: 12345,
    });

    // Setup S3 to succeed
    const s3Url = 'https://test-bucket.s3.us-east-1.amazonaws.com/reports/test.pdf';
    mockGenerateSafeFilename.mockReturnValue('EA_Time_Freedom_Report_John_Doe_12345.pdf');
    mockUploadToS3.mockResolvedValue(s3Url);

    // Set S3 environment variables
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.S3_BUCKET_NAME = 'test-bucket';

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.pdf).toBe('bW9jay1wZGYtY29udGVudA==');
    expect(data.s3Url).toBe(s3Url);
    expect(data.generatedAt).toBeDefined();
  });

  /**
   * Test 5: API validates required input fields
   */
  it('returns 500 on invalid request body (missing tasks)', async () => {
    // Setup mock to throw on bad input
    mockGeneratePDF.mockRejectedValue(new Error('Invalid input'));

    const invalidBody = {
      eaPercentage: 50,
      userData: { firstName: 'John' },
      // missing tasks
    };

    const request = createMockRequest(invalidBody);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  /**
   * Test 6: Response includes generatedAt timestamp
   */
  it('includes generatedAt timestamp in ISO format', async () => {
    mockGeneratePDF.mockResolvedValue({
      success: true,
      buffer: Buffer.from('mock-pdf-content'),
      base64: 'bW9jay1wZGYtY29udGVudA==',
      filename: 'EA_Time_Freedom_Report_John_Doe_2024.pdf',
      size: 12345,
    });

    const request = createMockRequest(validRequestBody);
    const response = await POST(request);
    const data = await response.json();

    expect(data.generatedAt).toBeDefined();
    // Validate ISO timestamp format
    const timestamp = new Date(data.generatedAt);
    expect(timestamp.toISOString()).toBe(data.generatedAt);
  });
});
