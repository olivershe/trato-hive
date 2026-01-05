/**
 * Storage Client Unit Tests
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  StorageClient,
  StorageError,
  createStorageClient,
  storageConfigSchema,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE,
} from './storage';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed-url.example.com'),
}));

describe('StorageClient', () => {
  describe('configuration', () => {
    it('should validate config with Zod', () => {
      const result = storageConfigSchema.safeParse({
        bucket: 'test-bucket',
        region: 'us-east-1',
      });

      expect(result.success).toBe(true);
    });

    it('should reject empty bucket name', () => {
      const result = storageConfigSchema.safeParse({
        bucket: '',
        region: 'us-east-1',
      });

      expect(result.success).toBe(false);
    });

    it('should use default region', () => {
      const result = storageConfigSchema.parse({
        bucket: 'test-bucket',
      });

      expect(result.region).toBe('us-east-1');
    });

    it('should accept optional credentials', () => {
      const result = storageConfigSchema.parse({
        bucket: 'test-bucket',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      });

      expect(result.accessKeyId).toBe('test-key');
      expect(result.secretAccessKey).toBe('test-secret');
    });

    it('should accept custom endpoint', () => {
      const result = storageConfigSchema.parse({
        bucket: 'test-bucket',
        endpoint: 'http://localhost:4566',
      });

      expect(result.endpoint).toBe('http://localhost:4566');
    });
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      const client = new StorageClient({
        bucket: 'test-bucket',
        region: 'us-west-2',
      });

      expect(client).toBeInstanceOf(StorageClient);
    });

    it('should throw on invalid config', () => {
      expect(() => {
        new StorageClient({
          bucket: '',
          region: 'us-east-1',
        });
      }).toThrow();
    });
  });

  describe('factory functions', () => {
    it('createStorageClient should create client', () => {
      const client = createStorageClient({
        bucket: 'test-bucket',
        region: 'us-east-1',
      });

      expect(client).toBeInstanceOf(StorageClient);
    });
  });
});

describe('StorageError', () => {
  it('should create error with correct properties', () => {
    const error = new StorageError('File not found', 'NOT_FOUND');

    expect(error.message).toBe('File not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.name).toBe('StorageError');
  });

  it('should include cause when provided', () => {
    const cause = new Error('Original error');
    const error = new StorageError('Wrapper error', 'UNKNOWN', cause);

    expect(error.cause).toBe(cause);
  });

  it('should have all error codes', () => {
    const codes = [
      'FILE_TOO_LARGE',
      'UNSUPPORTED_FILE_TYPE',
      'NOT_FOUND',
      'ACCESS_DENIED',
      'TIMEOUT',
      'NETWORK_ERROR',
      'DOWNLOAD_FAILED',
      'UNKNOWN',
    ];

    codes.forEach((code) => {
      const error = new StorageError('Test', code as StorageError['code']);
      expect(error.code).toBe(code);
    });
  });
});

describe('Constants', () => {
  it('should have supported MIME types', () => {
    expect(SUPPORTED_MIME_TYPES).toContain('application/pdf');
    expect(SUPPORTED_MIME_TYPES).toContain('application/msword');
    expect(SUPPORTED_MIME_TYPES).toContain('text/plain');
    expect(SUPPORTED_MIME_TYPES).toContain('text/csv');
    expect(SUPPORTED_MIME_TYPES).toContain('image/png');
    expect(SUPPORTED_MIME_TYPES).toContain('image/jpeg');
  });

  it('should have MAX_FILE_SIZE of 100MB', () => {
    expect(MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
  });
});

describe('Upload validation', () => {
  let client: StorageClient;

  beforeEach(() => {
    client = new StorageClient({
      bucket: 'test-bucket',
      region: 'us-east-1',
    });
  });

  it('should reject files that exceed MAX_FILE_SIZE', async () => {
    const largeFile = Buffer.alloc(MAX_FILE_SIZE + 1);

    await expect(
      client.upload(largeFile, 'org-123', 'large-file.pdf')
    ).rejects.toThrow(StorageError);

    await expect(
      client.upload(largeFile, 'org-123', 'large-file.pdf')
    ).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
    });
  });

  it('should reject unsupported content types', async () => {
    const file = Buffer.from('test content');

    await expect(
      client.upload(file, 'org-123', 'file.exe', {
        contentType: 'application/x-executable',
      })
    ).rejects.toThrow(StorageError);

    await expect(
      client.upload(file, 'org-123', 'file.exe', {
        contentType: 'application/x-executable',
      })
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  });

  it('should accept supported content types', async () => {
    // Skip actual upload since S3 is mocked
    // Just test that validation passes
    const file = Buffer.from('test content');
    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({});
    (S3Client as unknown as Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const newClient = new StorageClient({
      bucket: 'test-bucket',
      region: 'us-east-1',
    });

    const result = await newClient.upload(file, 'org-123', 'file.pdf', {
      contentType: 'application/pdf',
    });

    expect(result.contentType).toBe('application/pdf');
  });
});

describe('Key generation', () => {
  let client: StorageClient;

  beforeEach(async () => {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({});
    (S3Client as unknown as Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    client = new StorageClient({
      bucket: 'test-bucket',
      region: 'us-east-1',
    });
  });

  it('should prefix keys with organizationId', async () => {
    const file = Buffer.from('test');
    const result = await client.upload(file, 'org-123', 'document.pdf');

    expect(result.key).toBe('org-123/document.pdf');
  });

  it('should sanitize filenames with path traversal', async () => {
    const file = Buffer.from('test');
    const result = await client.upload(file, 'org-123', '../../../etc/passwd');

    expect(result.key).not.toContain('..');
    expect(result.key).toBe('org-123/etc/passwd');
  });

  it('should remove leading slashes from filename', async () => {
    const file = Buffer.from('test');
    const result = await client.upload(file, 'org-123', '///file.pdf');

    expect(result.key).toBe('org-123/file.pdf');
  });
});

describe('Presigned URLs', () => {
  let client: StorageClient;

  beforeEach(async () => {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({});
    (S3Client as unknown as Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    client = new StorageClient({
      bucket: 'test-bucket',
      region: 'us-east-1',
    });
  });

  it('should generate download URL', async () => {
    const url = await client.getDownloadUrl('org-123', 'file.pdf');

    expect(url).toBe('https://signed-url.example.com');
  });

  it('should generate upload URL', async () => {
    const result = await client.getUploadUrl('org-123', 'new-file.pdf');

    expect(result.url).toBe('https://signed-url.example.com');
    expect(result.key).toBe('org-123/new-file.pdf');
  });

  it('should generate presigned URL from key', async () => {
    const url = await client.getPresignedUrl('org-123/existing-file.pdf');

    expect(url).toBe('https://signed-url.example.com');
  });
});

describe('File existence check', () => {
  it('should return true when file exists', async () => {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const mockSend = vi.fn().mockResolvedValue({
      ContentLength: 1024,
      ContentType: 'application/pdf',
      LastModified: new Date(),
      Metadata: {},
    });
    (S3Client as unknown as Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const client = new StorageClient({
      bucket: 'test-bucket',
      region: 'us-east-1',
    });

    const exists = await client.exists('org-123', 'file.pdf');
    expect(exists).toBe(true);
  });

  it('should return false when file does not exist', async () => {
    const { S3Client } = await import('@aws-sdk/client-s3');
    const notFoundError = new Error('NoSuchKey');
    notFoundError.name = 'NoSuchKey';
    const mockSend = vi.fn().mockRejectedValue(notFoundError);
    (S3Client as unknown as Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    const client = new StorageClient({
      bucket: 'test-bucket',
      region: 'us-east-1',
    });

    const exists = await client.exists('org-123', 'nonexistent.pdf');
    expect(exists).toBe(false);
  });
});
