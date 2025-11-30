/**
 * Job queue utilities using BullMQ
 */
import { Queue, type Job } from 'bullmq';
import IORedis from 'ioredis';

export interface QueueConfig {
  redisUrl: string;
}

export interface DocumentProcessingJob {
  documentId: string;
  fileUrl: string;
  organizationId: string;
}

export class DocumentQueue {
  private queue: Queue<DocumentProcessingJob>;
  private connection: IORedis;

  constructor(config: QueueConfig) {
    this.connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue<DocumentProcessingJob>('document-processing', {
      connection: this.connection,
    });
  }

  async addDocumentProcessingJob(job: DocumentProcessingJob): Promise<Job<DocumentProcessingJob>> {
    return this.queue.add('process-document', job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  async close(): Promise<void> {
    await this.queue.close();
    await this.connection.quit();
  }
}

export const createDocumentQueue = (config: QueueConfig): DocumentQueue => {
  return new DocumentQueue(config);
};
