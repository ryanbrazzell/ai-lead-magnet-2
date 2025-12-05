/**
 * S3 Service for Uploading PDF Reports
 *
 * Provides permanent public URLs for PDF access via AWS S3.
 * Ported from: /tmp/ea-time-freedom-report/app/utils/s3Service.ts
 *
 * Features:
 * - Buffer validation (non-empty, size limit)
 * - Environment variable validation
 * - Automatic folder prefixing (reports/)
 * - Descriptive error messages for common S3 errors
 * - Filename sanitization for safe S3 keys
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Options for S3 upload (internal use)
 */
interface S3UploadOptions {
  contentType?: string;
  makePublic?: boolean;
}

/**
 * Upload PDF buffer to S3 and return permanent public URL
 *
 * @param buffer - PDF file as Buffer
 * @param filename - Desired filename (will be stored in 'reports/' folder)
 * @param options - Upload options (contentType, makePublic)
 * @returns Public URL to access the PDF
 * @throws Error if S3 credentials are missing or upload fails
 */
export async function uploadToS3(
  buffer: Buffer,
  filename: string,
  options: S3UploadOptions = {}
): Promise<string> {
  // Validate inputs
  if (!buffer || buffer.length === 0) {
    throw new Error('Invalid buffer: Buffer is empty');
  }

  if (buffer.length > 50 * 1024 * 1024) {
    // 50MB limit
    throw new Error('File too large: Maximum size is 50MB');
  }

  if (!filename || filename.trim().length === 0) {
    throw new Error('Invalid filename: Filename is required');
  }

  // Validate S3 credentials (trim to remove any trailing newlines)
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const bucket = (
    process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME
  )?.trim();
  const region = (
    process.env.S3_REGION ||
    process.env.AWS_S3_REGION ||
    process.env.AWS_REGION ||
    'us-east-1'
  ).trim();

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'S3 credentials not configured. Missing AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, or AWS_S3_BUCKET_NAME'
    );
  }

  // Initialize S3 client
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Ensure filename is in reports folder
  const key = filename.startsWith('reports/') ? filename : `reports/${filename}`;

  // Upload to S3
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: options.contentType || 'application/pdf',
        ContentDisposition: `inline; filename="${filename}"`,
        CacheControl: 'public, max-age=31536000', // Cache for 1 year (files are permanent)
        // Note: ACL removed - bucket has public access configured via bucket policy
      })
    );

    // Return permanent public URL (files don't expire - no lifecycle policy)
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    console.log('[S3] PDF uploaded successfully:', publicUrl);

    return publicUrl;
  } catch (error: unknown) {
    const err = error as Error & {
      code?: string;
      $metadata?: { httpStatusCode?: number };
    };

    console.error('[S3] Upload failed:', {
      bucket,
      key,
      region,
      error: err.message,
      code: err.code,
      statusCode: err.$metadata?.httpStatusCode,
    });

    // Provide specific error messages for common issues
    if (err.code === 'NoSuchBucket') {
      throw new Error(
        `S3 bucket '${bucket}' does not exist in region '${region}'`
      );
    } else if (err.code === 'AccessDenied') {
      throw new Error(
        `Access denied to S3 bucket '${bucket}'. Check IAM permissions.`
      );
    } else {
      throw new Error(
        `S3 upload failed: ${err.message} (Code: ${err.code || 'Unknown'})`
      );
    }
  }
}

/**
 * Generate a safe filename for S3 storage
 *
 * Sanitizes input names to prevent directory traversal and ensures
 * filenames are safe for S3 object keys.
 *
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Safe filename with timestamp in format:
 *          EA_Time_Freedom_Report_{FirstName}_{LastName}_{timestamp}.pdf
 */
export function generateSafeFilename(
  firstName: string,
  lastName: string
): string {
  // Sanitize each input separately to prevent directory traversal
  const sanitizeInput = (str: string) =>
    str
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace non-alphanumeric with underscore
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 50); // Limit length to prevent excessively long filenames

  const safeFirstName = sanitizeInput(firstName);
  const safeLastName = sanitizeInput(lastName);

  // Build the safe name part, handling empty inputs
  const namePart =
    safeFirstName && safeLastName
      ? `${safeFirstName}_${safeLastName}`
      : safeFirstName || safeLastName || 'Report';

  const timestamp = Date.now();

  return `EA_Time_Freedom_Report_${namePart}_${timestamp}.pdf`;
}
