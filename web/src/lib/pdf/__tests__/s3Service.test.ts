/**
 * S3 Upload Service Tests
 *
 * Tests for S3 upload functionality including validation,
 * filename sanitization, and URL generation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a module-level mock for send
const mockSend = vi.fn();

// Mock the AWS SDK before importing s3Service
vi.mock('@aws-sdk/client-s3', () => {
  // Create a proper class mock for PutObjectCommand
  class MockPutObjectCommand {
    params: object;
    constructor(params: object) {
      this.params = params;
    }
  }

  // Create a proper class mock for S3Client
  class MockS3Client {
    config: object;
    constructor(config: object) {
      this.config = config;
    }
    send = mockSend;
  }

  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
  };
});

import { uploadToS3, generateSafeFilename } from '../s3Service';

describe('S3 Upload Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockReset();
    // Set up default environment variables
    process.env = {
      ...originalEnv,
      AWS_ACCESS_KEY_ID: 'test-access-key-id',
      AWS_SECRET_ACCESS_KEY: 'test-secret-access-key',
      S3_BUCKET_NAME: 'test-bucket',
      AWS_REGION: 'us-east-1',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('uploadToS3', () => {
    it('validates empty buffer', async () => {
      const emptyBuffer = Buffer.from('');

      await expect(uploadToS3(emptyBuffer, 'test.pdf')).rejects.toThrow(
        'Invalid buffer: Buffer is empty'
      );
    });

    it('validates 50MB size limit', async () => {
      // Create a buffer larger than 50MB
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB

      await expect(uploadToS3(largeBuffer, 'test.pdf')).rejects.toThrow(
        'File too large: Maximum size is 50MB'
      );
    });

    it('validates required env vars', async () => {
      // Remove required env vars
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.S3_BUCKET_NAME;
      delete process.env.AWS_S3_BUCKET_NAME;

      const buffer = Buffer.from('test pdf content');

      await expect(uploadToS3(buffer, 'test.pdf')).rejects.toThrow(
        'S3 credentials not configured'
      );
    });

    it('generates correct S3 URL format', async () => {
      mockSend.mockResolvedValueOnce({});

      const buffer = Buffer.from('test pdf content');
      const filename = 'test-report.pdf';

      const url = await uploadToS3(buffer, filename);

      // Verify URL format
      expect(url).toBe(
        'https://test-bucket.s3.us-east-1.amazonaws.com/reports/test-report.pdf'
      );
    });

    it('uses AWS_S3_BUCKET_NAME as fallback', async () => {
      delete process.env.S3_BUCKET_NAME;
      process.env.AWS_S3_BUCKET_NAME = 'fallback-bucket';

      mockSend.mockResolvedValueOnce({});

      const buffer = Buffer.from('test pdf content');
      const url = await uploadToS3(buffer, 'test.pdf');

      expect(url).toContain('fallback-bucket');
    });

    it('handles NoSuchBucket error', async () => {
      const error = new Error('Bucket not found');
      (error as any).code = 'NoSuchBucket';
      mockSend.mockRejectedValueOnce(error);

      const buffer = Buffer.from('test pdf content');

      await expect(uploadToS3(buffer, 'test.pdf')).rejects.toThrow(
        "S3 bucket 'test-bucket' does not exist"
      );
    });

    it('handles AccessDenied error', async () => {
      const error = new Error('Access denied');
      (error as any).code = 'AccessDenied';
      mockSend.mockRejectedValueOnce(error);

      const buffer = Buffer.from('test pdf content');

      await expect(uploadToS3(buffer, 'test.pdf')).rejects.toThrow(
        'Access denied to S3 bucket'
      );
    });
  });

  describe('generateSafeFilename', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('sanitizes names correctly', () => {
      const filename = generateSafeFilename('John!@#', "O'Connor");

      // Should remove special characters
      expect(filename).not.toContain('!');
      expect(filename).not.toContain('@');
      expect(filename).not.toContain('#');
      expect(filename).not.toContain("'");
      // Should contain sanitized names
      expect(filename).toContain('John');
      expect(filename).toContain('Connor');
      // Should have correct prefix and suffix
      expect(filename).toMatch(/^EA_Time_Freedom_Report_/);
      expect(filename).toMatch(/\.pdf$/);
    });

    it('limits each name to 50 characters', () => {
      const longFirstName = 'A'.repeat(100);
      const longLastName = 'B'.repeat(100);

      const filename = generateSafeFilename(longFirstName, longLastName);

      // The overall filename should not be excessively long
      // Each name part should be limited to 50 chars max
      // Pattern: EA_Time_Freedom_Report_{firstName}_{lastName}_{timestamp}.pdf
      // The prefix is 24 chars, timestamp is ~13 chars, extension is 4 chars, underscores 2 chars
      // So name portion should be around 100 chars max (50 + 50)
      const parts = filename.split('_');
      // After EA_Time_Freedom_Report_, the next parts are firstName and lastName
      const firstNamePart = parts[4]; // Should be truncated
      const lastNamePart = parts[5]; // Should be truncated

      expect(firstNamePart.length).toBeLessThanOrEqual(50);
      expect(lastNamePart.length).toBeLessThanOrEqual(50);
    });

    it('generates consistent pattern', () => {
      const filename = generateSafeFilename('Ryan', 'Brazzell');

      // Verify pattern: EA_Time_Freedom_Report_{FirstName}_{LastName}_{timestamp}.pdf
      expect(filename).toBe(
        `EA_Time_Freedom_Report_Ryan_Brazzell_${Date.now()}.pdf`
      );
    });

    it('handles empty names gracefully', () => {
      const filename = generateSafeFilename('', '');

      // Should still generate a valid filename with 'Report' as fallback
      expect(filename).toMatch(/^EA_Time_Freedom_Report_Report_\d+\.pdf$/);
    });

    it('removes leading/trailing underscores from sanitized names', () => {
      const filename = generateSafeFilename('_John_', '__Doe__');

      // Should not have more than one consecutive underscore
      expect(filename).not.toMatch(/_{2,}/);
    });
  });
});
