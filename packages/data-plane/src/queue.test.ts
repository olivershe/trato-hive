/**
 * Queue Client Unit Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DocumentQueue,
  createDocumentQueue,
  queueConfigSchema,
  type DataPlaneJob,
  type JobResult,
} from './queue';

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'job-123' }),
    addBulk: vi.fn().mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }]),
    getJob: vi.fn().mockResolvedValue({ id: 'job-123', data: {} }),
    getWaitingCount: vi.fn().mockResolvedValue(5),
    getActiveCount: vi.fn().mockResolvedValue(2),
    getCompletedCount: vi.fn().mockResolvedValue(100),
    getFailedCount: vi.fn().mockResolvedValue(3),
    getDelayedCount: vi.fn().mockResolvedValue(1),
    getFailed: vi.fn().mockResolvedValue([]),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    clean: vi.fn().mockResolvedValue(['job-1', 'job-2']),
    drain: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    isRunning: vi.fn().mockReturnValue(true),
  })),
  Job: vi.fn(),
}));

// Mock IORedis
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    quit: vi.fn().mockResolvedValue('OK'),
    connect: vi.fn().mockResolvedValue(undefined),
    status: 'ready',
  })),
}));

describe('QueueConfig', () => {
  describe('schema validation', () => {
    it('should accept valid config with URL', () => {
      const result = queueConfigSchema.safeParse({
        redisUrl: 'redis://localhost:6379',
      });

      expect(result.success).toBe(true);
    });

    it('should accept config with custom queue name', () => {
      const result = queueConfigSchema.parse({
        redisUrl: 'redis://localhost:6379',
        queueName: 'custom-queue',
      });

      expect(result.queueName).toBe('custom-queue');
    });

    it('should use default queue name', () => {
      const result = queueConfigSchema.parse({
        redisUrl: 'redis://localhost:6379',
      });

      expect(result.queueName).toBe('document-processing');
    });

    it('should accept default job options', () => {
      const result = queueConfigSchema.parse({
        redisUrl: 'redis://localhost:6379',
        defaultJobOptions: {
          attempts: 5,
          backoffType: 'fixed',
          backoffDelay: 5000,
        },
      });

      expect(result.defaultJobOptions?.attempts).toBe(5);
      expect(result.defaultJobOptions?.backoffType).toBe('fixed');
    });

    it('should reject empty redisUrl', () => {
      const result = queueConfigSchema.safeParse({
        redisUrl: '',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('DocumentQueue', () => {
  let queue: DocumentQueue;

  beforeEach(() => {
    queue = new DocumentQueue({
      redisUrl: 'redis://localhost:6379',
    });
  });

  describe('constructor', () => {
    it('should create queue with valid config', () => {
      expect(queue).toBeInstanceOf(DocumentQueue);
    });

    it('should throw on invalid config', () => {
      expect(() => {
        new DocumentQueue({
          redisUrl: '',
        });
      }).toThrow();
    });
  });

  describe('addDocumentProcessingJob', () => {
    it('should add job with correct data', async () => {
      const job = await queue.addDocumentProcessingJob({
        documentId: 'doc-123',
        fileUrl: 'https://example.com/file.pdf',
        organizationId: 'org-456',
      });

      expect(job.id).toBe('job-123');
    });
  });

  describe('addEmbeddingJob', () => {
    it('should add embedding job', async () => {
      const job = await queue.addEmbeddingJob({
        documentId: 'doc-123',
        chunkIds: ['chunk-1', 'chunk-2'],
        organizationId: 'org-456',
      });

      expect(job.id).toBe('job-123');
    });
  });

  describe('addFactExtractionJob', () => {
    it('should add fact extraction job', async () => {
      const job = await queue.addFactExtractionJob({
        documentId: 'doc-123',
        chunkIds: ['chunk-1'],
        organizationId: 'org-456',
        companyId: 'company-789',
      });

      expect(job.id).toBe('job-123');
    });
  });

  describe('addReindexJob', () => {
    it('should add reindex job', async () => {
      const job = await queue.addReindexJob({
        documentId: 'doc-123',
        organizationId: 'org-456',
      });

      expect(job.id).toBe('job-123');
    });
  });

  describe('addDeleteDocumentJob', () => {
    it('should add delete job', async () => {
      const job = await queue.addDeleteDocumentJob({
        documentId: 'doc-123',
        organizationId: 'org-456',
        deleteFromStorage: true,
      });

      expect(job.id).toBe('job-123');
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue counts', async () => {
      const status = await queue.getQueueStatus();

      expect(status.waiting).toBe(5);
      expect(status.active).toBe(2);
      expect(status.completed).toBe(100);
      expect(status.failed).toBe(3);
      expect(status.delayed).toBe(1);
    });
  });

  describe('queue operations', () => {
    it('should pause the queue', async () => {
      await expect(queue.pause()).resolves.toBeUndefined();
    });

    it('should resume the queue', async () => {
      await expect(queue.resume()).resolves.toBeUndefined();
    });

    it('should clean old jobs', async () => {
      const cleaned = await queue.clean(3600000, 100, 'completed');

      expect(cleaned).toEqual(['job-1', 'job-2']);
    });

    it('should drain the queue', async () => {
      await expect(queue.drain()).resolves.toBeUndefined();
    });

    it('should close the queue', async () => {
      await expect(queue.close()).resolves.toBeUndefined();
    });
  });

  describe('factory functions', () => {
    it('createDocumentQueue should create queue', () => {
      const q = createDocumentQueue({
        redisUrl: 'redis://localhost:6379',
      });

      expect(q).toBeInstanceOf(DocumentQueue);
    });
  });
});

describe('Job types', () => {
  it('DocumentProcessingJob should have correct structure', () => {
    const job: DataPlaneJob = {
      type: 'process-document',
      documentId: 'doc-123',
      fileUrl: 'https://example.com/file.pdf',
      organizationId: 'org-456',
    };

    expect(job.type).toBe('process-document');
    expect(job.documentId).toBe('doc-123');
  });

  it('EmbeddingJob should have correct structure', () => {
    const job: DataPlaneJob = {
      type: 'generate-embeddings',
      documentId: 'doc-123',
      chunkIds: ['chunk-1', 'chunk-2'],
      organizationId: 'org-456',
    };

    expect(job.type).toBe('generate-embeddings');
  });

  it('FactExtractionJob should have correct structure', () => {
    const job: DataPlaneJob = {
      type: 'extract-facts',
      documentId: 'doc-123',
      chunkIds: ['chunk-1'],
      organizationId: 'org-456',
      companyId: 'company-789',
    };

    expect(job.type).toBe('extract-facts');
    expect(job.companyId).toBe('company-789');
  });

  it('ReindexJob should have correct structure', () => {
    const job: DataPlaneJob = {
      type: 'reindex-document',
      documentId: 'doc-123',
      organizationId: 'org-456',
    };

    expect(job.type).toBe('reindex-document');
  });

  it('DeleteDocumentJob should have correct structure', () => {
    const job: DataPlaneJob = {
      type: 'delete-document',
      documentId: 'doc-123',
      organizationId: 'org-456',
      deleteFromStorage: true,
    };

    expect(job.type).toBe('delete-document');
    expect(job.deleteFromStorage).toBe(true);
  });
});

describe('JobResult', () => {
  it('should have correct structure for success', () => {
    const result: JobResult = {
      success: true,
      documentId: 'doc-123',
      message: 'Processing completed',
      processingTimeMs: 5000,
      chunksProcessed: 10,
      factsExtracted: 25,
    };

    expect(result.success).toBe(true);
    expect(result.chunksProcessed).toBe(10);
    expect(result.factsExtracted).toBe(25);
  });

  it('should have correct structure for failure', () => {
    const result: JobResult = {
      success: false,
      documentId: 'doc-123',
      error: 'Failed to process document',
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to process document');
  });
});
