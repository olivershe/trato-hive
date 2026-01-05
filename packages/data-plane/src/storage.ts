/**
 * S3 Storage Client
 *
 * Handles file uploads and presigned URL generation for VDR documents.
 * Multi-tenant isolation: All S3 keys are prefixed with organizationId.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

// =============================================================================
// Types & Configuration
// =============================================================================

export const storageConfigSchema = z.object({
  bucket: z.string().min(1, 'S3 bucket name is required'),
  region: z.string().default('us-east-1'),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  endpoint: z.string().optional(), // For local testing with MinIO/LocalStack
});

export type StorageConfig = z.infer<typeof storageConfigSchema>;

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
  bucket: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // Seconds, default 3600 (1 hour)
  contentType?: string; // For upload URLs
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  metadata: Record<string, string>;
}

// Supported file types for VDR documents
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// =============================================================================
// Storage Client Class
// =============================================================================

export class StorageClient {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(config: StorageConfig) {
    const validated = storageConfigSchema.parse(config);
    this.bucket = validated.bucket;

    // Configure S3 client
    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: validated.region,
    };

    // Use credentials if provided (for testing or explicit config)
    if (validated.accessKeyId && validated.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: validated.accessKeyId,
        secretAccessKey: validated.secretAccessKey,
      };
    }

    // Custom endpoint for LocalStack/MinIO
    if (validated.endpoint) {
      clientConfig.endpoint = validated.endpoint;
      clientConfig.forcePathStyle = true; // Required for MinIO/LocalStack
    }

    this.s3 = new S3Client(clientConfig);
  }

  /**
   * Generate S3 key with organization prefix for multi-tenancy
   */
  private buildKey(organizationId: string, filename: string): string {
    // Sanitize filename - remove path traversal attempts
    const sanitized = filename.replace(/\.\./g, '').replace(/^\/+/, '');
    return `${organizationId}/${sanitized}`;
  }

  /**
   * Upload a file to S3
   * @param file - Buffer or stream of file data
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param filename - Original filename
   * @param options - Upload options (contentType, metadata)
   */
  async upload(
    file: Buffer,
    organizationId: string,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Validate file size
    if (file.length > MAX_FILE_SIZE) {
      throw new StorageError(
        `File size ${file.length} exceeds maximum allowed size of ${MAX_FILE_SIZE}`,
        'FILE_TOO_LARGE'
      );
    }

    // Validate content type if provided
    if (options.contentType && !SUPPORTED_MIME_TYPES.includes(options.contentType as typeof SUPPORTED_MIME_TYPES[number])) {
      throw new StorageError(
        `Unsupported content type: ${options.contentType}`,
        'UNSUPPORTED_FILE_TYPE'
      );
    }

    const key = this.buildKey(organizationId, filename);
    const contentType = options.contentType || 'application/octet-stream';

    const command: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: options.metadata,
      ACL: options.acl || 'private',
    };

    try {
      await this.s3.send(new PutObjectCommand(command));

      return {
        key,
        url: `s3://${this.bucket}/${key}`,
        size: file.length,
        contentType,
        bucket: this.bucket,
      };
    } catch (error) {
      throw this.classifyError(error as Error, 'upload');
    }
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  async getDownloadUrl(
    organizationId: string,
    filename: string,
    options: PresignedUrlOptions = {}
  ): Promise<string> {
    const key = this.buildKey(organizationId, filename);
    const expiresIn = options.expiresIn || 3600; // 1 hour default

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn });
    } catch (error) {
      throw this.classifyError(error as Error, 'getDownloadUrl');
    }
  }

  /**
   * Generate a presigned URL for uploading a file
   * (For client-side direct uploads)
   */
  async getUploadUrl(
    organizationId: string,
    filename: string,
    options: PresignedUrlOptions = {}
  ): Promise<{ url: string; key: string }> {
    const key = this.buildKey(organizationId, filename);
    const expiresIn = options.expiresIn || 3600; // 1 hour default

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: options.contentType,
      });

      const url = await getSignedUrl(this.s3, command, { expiresIn });
      return { url, key };
    } catch (error) {
      throw this.classifyError(error as Error, 'getUploadUrl');
    }
  }

  /**
   * Generate a presigned URL for an S3 key
   * (When you already have the full key)
   */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3, command, { expiresIn });
    } catch (error) {
      throw this.classifyError(error as Error, 'getPresignedUrl');
    }
  }

  /**
   * Download a file from S3
   */
  async download(organizationId: string, filename: string): Promise<Buffer> {
    const key = this.buildKey(organizationId, filename);

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3.send(command);

      if (!response.Body) {
        throw new StorageError('Empty response body', 'DOWNLOAD_FAILED');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      throw this.classifyError(error as Error, 'download');
    }
  }

  /**
   * Delete a file from S3
   */
  async delete(organizationId: string, filename: string): Promise<void> {
    const key = this.buildKey(organizationId, filename);

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3.send(command);
    } catch (error) {
      throw this.classifyError(error as Error, 'delete');
    }
  }

  /**
   * Check if a file exists and get its metadata
   */
  async getMetadata(organizationId: string, filename: string): Promise<FileMetadata> {
    const key = this.buildKey(organizationId, filename);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata || {},
      };
    } catch (error) {
      throw this.classifyError(error as Error, 'getMetadata');
    }
  }

  /**
   * Check if a file exists
   */
  async exists(organizationId: string, filename: string): Promise<boolean> {
    try {
      await this.getMetadata(organizationId, filename);
      return true;
    } catch (error) {
      if (error instanceof StorageError && error.code === 'NOT_FOUND') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Classify S3 errors into StorageError
   */
  private classifyError(error: Error, operation: string): StorageError {
    const message = error.message.toLowerCase();
    const errorName = error.name;

    if (errorName === 'NoSuchKey' || message.includes('not found') || message.includes('nosuchkey')) {
      return new StorageError(`File not found during ${operation}`, 'NOT_FOUND', error);
    }

    if (errorName === 'AccessDenied' || message.includes('access denied') || message.includes('forbidden')) {
      return new StorageError(`Access denied during ${operation}`, 'ACCESS_DENIED', error);
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return new StorageError(`Timeout during ${operation}`, 'TIMEOUT', error);
    }

    if (message.includes('network') || message.includes('connection')) {
      return new StorageError(`Network error during ${operation}`, 'NETWORK_ERROR', error);
    }

    return new StorageError(`Storage error during ${operation}: ${error.message}`, 'UNKNOWN', error);
  }
}

// =============================================================================
// Error Class
// =============================================================================

export type StorageErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'DOWNLOAD_FAILED'
  | 'UNKNOWN';

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: StorageErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a storage client with the specified configuration
 */
export function createStorageClient(config: StorageConfig): StorageClient {
  return new StorageClient(config);
}

/**
 * Create a storage client from environment variables
 */
export function createStorageClientFromEnv(): StorageClient {
  const config: StorageConfig = {
    bucket: process.env.S3_BUCKET_NAME || '',
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT, // For LocalStack/MinIO
  };

  if (!config.bucket) {
    throw new StorageError(
      'S3_BUCKET_NAME environment variable is required',
      'UNKNOWN'
    );
  }

  return new StorageClient(config);
}
