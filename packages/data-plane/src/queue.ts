/**
 * BullMQ Job Queue
 *
 * Manages asynchronous document processing jobs with retry logic.
 * Supports multiple job types for the document processing pipeline:
 * - Document parsing (Reducto)
 * - Embedding generation
 * - Fact extraction
 */
import { Queue, Worker, Job, type ConnectionOptions, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { z } from 'zod';

// =============================================================================
// Types & Configuration
// =============================================================================

export const queueConfigSchema = z.object({
  redisUrl: z.string().url().or(z.string().min(1)),
  queueName: z.string().optional().default('document-processing'),
  defaultJobOptions: z.object({
    attempts: z.number().optional().default(3),
    backoffType: z.enum(['fixed', 'exponential']).optional().default('exponential'),
    backoffDelay: z.number().optional().default(2000),
  }).optional(),
});

// Input type allows optional fields
export type QueueConfigInput = z.input<typeof queueConfigSchema>;
// Output type has all defaults applied
export type QueueConfig = z.output<typeof queueConfigSchema>;

// =============================================================================
// Job Types
// =============================================================================

/**
 * Job to process a newly uploaded document
 */
export interface DocumentProcessingJob {
  type: 'process-document';
  documentId: string;
  fileUrl: string;
  organizationId: string;
  mimeType?: string;
  priority?: number;
}

/**
 * Job to generate embeddings for document chunks
 */
export interface EmbeddingJob {
  type: 'generate-embeddings';
  documentId: string;
  chunkIds: string[];
  organizationId: string;
}

/**
 * Job to extract facts from document chunks
 */
export interface FactExtractionJob {
  type: 'extract-facts';
  documentId: string;
  chunkIds: string[];
  companyId?: string;
  organizationId: string;
}

/**
 * Job to reindex a document (re-run full pipeline)
 */
export interface ReindexJob {
  type: 'reindex-document';
  documentId: string;
  organizationId: string;
}

/**
 * Job to delete a document and its related data
 */
export interface DeleteDocumentJob {
  type: 'delete-document';
  documentId: string;
  organizationId: string;
  deleteFromStorage?: boolean;
}

/**
 * Union of all job types
 */
export type DataPlaneJob =
  | DocumentProcessingJob
  | EmbeddingJob
  | FactExtractionJob
  | ReindexJob
  | DeleteDocumentJob;

/**
 * Job result types
 */
export interface JobResult {
  success: boolean;
  documentId: string;
  message?: string;
  processingTimeMs?: number;
  chunksProcessed?: number;
  factsExtracted?: number;
  error?: string;
}

// =============================================================================
// Queue Client Class
// =============================================================================

export class DocumentQueue {
  private readonly queue: Queue<DataPlaneJob, JobResult>;
  private readonly connection: IORedis;
  private readonly config: QueueConfig;

  constructor(config: QueueConfigInput) {
    this.config = queueConfigSchema.parse(config);

    // Create Redis connection
    this.connection = new IORedis(this.config.redisUrl, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    // Create queue
    this.queue = new Queue<DataPlaneJob, JobResult>(this.config.queueName, {
      connection: this.connection as ConnectionOptions,
      defaultJobOptions: this.getDefaultJobOptions(),
    });
  }

  private getDefaultJobOptions(): JobsOptions {
    const opts = this.config.defaultJobOptions;
    return {
      attempts: opts?.attempts ?? 3,
      backoff: {
        type: opts?.backoffType ?? 'exponential',
        delay: opts?.backoffDelay ?? 2000,
      },
      removeOnComplete: {
        count: 1000, // Keep last 1000 completed jobs
        age: 24 * 3600, // Or jobs older than 24 hours
      },
      removeOnFail: {
        count: 5000, // Keep last 5000 failed jobs
        age: 7 * 24 * 3600, // Or jobs older than 7 days
      },
    };
  }

  /**
   * Add a document processing job
   */
  async addDocumentProcessingJob(
    job: Omit<DocumentProcessingJob, 'type'>
  ): Promise<Job<DataPlaneJob, JobResult>> {
    return this.queue.add(
      'process-document',
      { type: 'process-document', ...job },
      {
        priority: job.priority ?? 5,
        jobId: `doc-process-${job.documentId}`,
      }
    );
  }

  /**
   * Add an embedding generation job
   */
  async addEmbeddingJob(
    job: Omit<EmbeddingJob, 'type'>
  ): Promise<Job<DataPlaneJob, JobResult>> {
    return this.queue.add(
      'generate-embeddings',
      { type: 'generate-embeddings', ...job },
      {
        priority: 3, // Higher priority than document processing
        jobId: `embed-${job.documentId}-${Date.now()}`,
      }
    );
  }

  /**
   * Add a fact extraction job
   */
  async addFactExtractionJob(
    job: Omit<FactExtractionJob, 'type'>
  ): Promise<Job<DataPlaneJob, JobResult>> {
    return this.queue.add(
      'extract-facts',
      { type: 'extract-facts', ...job },
      {
        priority: 4,
        jobId: `facts-${job.documentId}-${Date.now()}`,
      }
    );
  }

  /**
   * Add a reindex job
   */
  async addReindexJob(
    job: Omit<ReindexJob, 'type'>
  ): Promise<Job<DataPlaneJob, JobResult>> {
    return this.queue.add(
      'reindex-document',
      { type: 'reindex-document', ...job },
      {
        priority: 6, // Lower priority
        jobId: `reindex-${job.documentId}`,
      }
    );
  }

  /**
   * Add a delete document job
   */
  async addDeleteDocumentJob(
    job: Omit<DeleteDocumentJob, 'type'>
  ): Promise<Job<DataPlaneJob, JobResult>> {
    return this.queue.add(
      'delete-document',
      { type: 'delete-document', ...job },
      {
        priority: 2, // High priority for deletions
        jobId: `delete-${job.documentId}`,
      }
    );
  }

  /**
   * Add multiple jobs in batch
   */
  async addBulk(jobs: Array<{ name: string; data: DataPlaneJob; opts?: JobsOptions }>): Promise<Job<DataPlaneJob, JobResult>[]> {
    return this.queue.addBulk(jobs);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job<DataPlaneJob, JobResult> | undefined> {
    return this.queue.getJob(jobId);
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(start = 0, end = 100): Promise<Job<DataPlaneJob, JobResult>[]> {
    return this.queue.getFailed(start, end);
  }

  /**
   * Retry all failed jobs
   */
  async retryFailedJobs(): Promise<void> {
    const failedJobs = await this.getFailedJobs(0, 1000);
    await Promise.all(failedJobs.map(job => job.retry()));
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.queue.resume();
  }

  /**
   * Clean old jobs
   */
  async clean(grace: number, limit: number, type: 'completed' | 'failed' | 'delayed' | 'wait' | 'active'): Promise<string[]> {
    return this.queue.clean(grace, limit, type);
  }

  /**
   * Drain the queue (remove all jobs)
   */
  async drain(): Promise<void> {
    await this.queue.drain();
  }

  /**
   * Close the queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
    await this.connection.quit();
  }

  /**
   * Get the underlying BullMQ queue (for advanced usage)
   */
  getQueue(): Queue<DataPlaneJob, JobResult> {
    return this.queue;
  }

  /**
   * Get the Redis connection (for health checks)
   */
  getConnection(): IORedis {
    return this.connection;
  }
}

// =============================================================================
// Worker Class
// =============================================================================

export type JobHandler = (job: Job<DataPlaneJob, JobResult>) => Promise<JobResult>;

export interface WorkerConfig extends QueueConfigInput {
  concurrency?: number;
}

export class DocumentQueueWorker {
  private readonly worker: Worker<DataPlaneJob, JobResult>;
  private readonly connection: IORedis;

  constructor(config: WorkerConfig, handler: JobHandler) {
    const validatedConfig = queueConfigSchema.parse(config);

    // Create a separate Redis connection for the worker
    this.connection = new IORedis(validatedConfig.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    this.worker = new Worker<DataPlaneJob, JobResult>(
      validatedConfig.queueName,
      handler,
      {
        connection: this.connection as ConnectionOptions,
        concurrency: config.concurrency ?? 3,
        limiter: {
          max: 10,
          duration: 1000, // 10 jobs per second max
        },
      }
    );

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result) => {
      console.log(`Job ${job.id} completed:`, result);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`Job ${job?.id} failed:`, error.message);
    });

    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`Job ${jobId} has stalled`);
    });
  }

  /**
   * Register event handler
   */
  on<T extends keyof WorkerEvents>(event: T, handler: WorkerEvents[T]): void {
    this.worker.on(event, handler as never);
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    await this.worker.pause();
  }

  /**
   * Resume the worker
   */
  resume(): void {
    this.worker.resume();
  }

  /**
   * Close the worker
   */
  async close(): Promise<void> {
    await this.worker.close();
    await this.connection.quit();
  }

  /**
   * Check if worker is running
   */
  isRunning(): boolean {
    return this.worker.isRunning();
  }
}

interface WorkerEvents {
  completed: (job: Job<DataPlaneJob, JobResult>, result: JobResult) => void;
  failed: (job: Job<DataPlaneJob, JobResult> | undefined, error: Error) => void;
  error: (error: Error) => void;
  stalled: (jobId: string) => void;
  active: (job: Job<DataPlaneJob, JobResult>) => void;
  progress: (job: Job<DataPlaneJob, JobResult>, progress: number | object) => void;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a document queue instance
 */
export function createDocumentQueue(config: QueueConfigInput): DocumentQueue {
  return new DocumentQueue(config);
}

/**
 * Create a document queue from environment variables
 */
export function createDocumentQueueFromEnv(): DocumentQueue {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  return new DocumentQueue({
    redisUrl,
    queueName: process.env.QUEUE_NAME || 'document-processing',
  });
}

/**
 * Create a queue worker
 */
export function createDocumentQueueWorker(
  config: WorkerConfig,
  handler: JobHandler
): DocumentQueueWorker {
  return new DocumentQueueWorker(config, handler);
}
