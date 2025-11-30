/**
 * BullMQ worker utilities for background job processing
 */
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';

export interface WorkerConfig {
  redisUrl: string;
}

export interface DocumentProcessingJob {
  documentId: string;
  fileUrl: string;
  organizationId: string;
}

export class DocumentProcessingWorker {
  private worker: Worker<DocumentProcessingJob>;
  private connection: IORedis;

  constructor(config: WorkerConfig) {
    this.connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.worker = new Worker<DocumentProcessingJob>(
      'document-processing',
      async (job: Job<DocumentProcessingJob>) => {
        return this.processDocument(job.data);
      },
      {
        connection: this.connection,
      }
    );
  }

  private async processDocument(data: DocumentProcessingJob): Promise<void> {
    // TODO: Implement actual document processing
    console.log('Processing document:', data.documentId);
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.connection.quit();
  }
}

export const createDocumentProcessingWorker = (config: WorkerConfig): DocumentProcessingWorker => {
  return new DocumentProcessingWorker(config);
};
