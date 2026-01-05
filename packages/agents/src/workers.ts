/**
 * BullMQ Worker Utilities
 *
 * Background job processing for document and diligence workflows.
 * These workers integrate with the Document and Diligence agents.
 */
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import type { PrismaClient } from '@trato-hive/db';
import type {
  StorageClient,
  ReductoClient,
} from '@trato-hive/data-plane';
import type {
  VectorStore,
  EmbeddingService,
  FactExtractor,
} from '@trato-hive/semantic-layer';
import type { LLMClient } from '@trato-hive/ai-core';
import { DocumentAgent, type ProcessDocumentResult } from './document-agent';
import { DiligenceAgent, type DiligenceResponse } from './diligence-agent';

// =============================================================================
// Worker Configuration
// =============================================================================

export interface WorkerConfig {
  redisUrl: string;
  concurrency?: number;
}

export interface WorkerDependencies {
  db: PrismaClient;
  storage: StorageClient;
  reducto: ReductoClient;
  vectorStore: VectorStore;
  embeddings: EmbeddingService;
  factExtractor: FactExtractor;
  llmClient: LLMClient;
}

// =============================================================================
// Job Types
// =============================================================================

export interface DocumentProcessingJob {
  documentId: string;
  fileUrl: string;
  organizationId: string;
  skipEmbeddings?: boolean;
  skipFacts?: boolean;
}

export interface DiligenceQueryJob {
  queryId: string;
  question: string;
  organizationId: string;
  companyId?: string;
  dealId?: string;
  documentIds?: string[];
}

export interface ReportGenerationJob {
  reportId: string;
  dealId: string;
  organizationId: string;
}

// =============================================================================
// Document Processing Worker
// =============================================================================

export class DocumentProcessingWorker {
  private worker: Worker<DocumentProcessingJob, ProcessDocumentResult>;
  private connection: IORedis;
  private documentAgent: DocumentAgent;

  constructor(config: WorkerConfig, deps: WorkerDependencies) {
    this.connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.documentAgent = new DocumentAgent({
      db: deps.db,
      storage: deps.storage,
      reducto: deps.reducto,
      vectorStore: deps.vectorStore,
      embeddings: deps.embeddings,
      factExtractor: deps.factExtractor,
    });

    this.worker = new Worker<DocumentProcessingJob, ProcessDocumentResult>(
      'document-processing',
      async (job: Job<DocumentProcessingJob>) => {
        return this.processDocument(job);
      },
      {
        connection: this.connection,
        concurrency: config.concurrency || 5,
      }
    );

    // Set up event handlers
    this.worker.on('completed', (job, result) => {
      console.log(`Document ${job.data.documentId} processed successfully`, result);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`Document ${job?.data.documentId} processing failed:`, error);
    });
  }

  private async processDocument(
    job: Job<DocumentProcessingJob>
  ): Promise<ProcessDocumentResult> {
    const { documentId, skipEmbeddings, skipFacts } = job.data;

    // Update job progress
    await job.updateProgress(10);

    const result = await this.documentAgent.processDocument(documentId, {
      skipEmbeddings,
      skipFacts,
    });

    await job.updateProgress(100);

    return result;
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.connection.quit();
  }
}

// =============================================================================
// Diligence Query Worker
// =============================================================================

export class DiligenceQueryWorker {
  private worker: Worker<DiligenceQueryJob, DiligenceResponse>;
  private connection: IORedis;
  private diligenceAgent: DiligenceAgent;

  constructor(config: WorkerConfig, deps: WorkerDependencies) {
    this.connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.diligenceAgent = new DiligenceAgent({
      vectorStore: deps.vectorStore,
      embeddings: deps.embeddings,
      llmClient: deps.llmClient,
      db: deps.db,
    });

    this.worker = new Worker<DiligenceQueryJob, DiligenceResponse>(
      'diligence-query',
      async (job: Job<DiligenceQueryJob>) => {
        return this.processQuery(job);
      },
      {
        connection: this.connection,
        concurrency: config.concurrency || 10,
      }
    );

    this.worker.on('completed', (job, result) => {
      console.log(`Query ${job.data.queryId} completed`, {
        chunksRetrieved: result.metadata.chunksRetrieved,
        citationsFound: result.citations.length,
      });
    });

    this.worker.on('failed', (job, error) => {
      console.error(`Query ${job?.data.queryId} failed:`, error);
    });
  }

  private async processQuery(
    job: Job<DiligenceQueryJob>
  ): Promise<DiligenceResponse> {
    const { question, organizationId, companyId, dealId, documentIds } = job.data;

    await job.updateProgress(10);

    const response = await this.diligenceAgent.answerQuestion({
      question,
      organizationId,
      companyId,
      dealId,
      documentIds,
    });

    await job.updateProgress(100);

    return response;
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.connection.quit();
  }
}

// =============================================================================
// Report Generation Worker
// =============================================================================

export class ReportGenerationWorker {
  private worker: Worker<ReportGenerationJob>;
  private connection: IORedis;
  private diligenceAgent: DiligenceAgent;
  private db: PrismaClient;

  constructor(config: WorkerConfig, deps: WorkerDependencies) {
    this.connection = new IORedis(config.redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.db = deps.db;
    this.diligenceAgent = new DiligenceAgent({
      vectorStore: deps.vectorStore,
      embeddings: deps.embeddings,
      llmClient: deps.llmClient,
      db: deps.db,
    });

    this.worker = new Worker<ReportGenerationJob>(
      'report-generation',
      async (job: Job<ReportGenerationJob>) => {
        return this.generateReport(job);
      },
      {
        connection: this.connection,
        concurrency: config.concurrency || 2, // Lower concurrency for heavy operations
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`Report ${job.data.reportId} generated for deal ${job.data.dealId}`);
    });

    this.worker.on('failed', (job, error) => {
      console.error(`Report ${job?.data.reportId} generation failed:`, error);
    });
  }

  private async generateReport(job: Job<ReportGenerationJob>): Promise<void> {
    const { reportId, dealId, organizationId } = job.data;

    await job.updateProgress(5);

    // Generate report
    const report = await this.diligenceAgent.generateReport(dealId, organizationId);

    await job.updateProgress(90);

    // Store report in database (using raw JSON for now)
    // In production, this would go to a dedicated reports table
    await this.db.$executeRaw`
      UPDATE "Report"
      SET
        "content" = ${JSON.stringify(report)},
        "status" = 'COMPLETED',
        "generatedAt" = ${report.generatedAt}
      WHERE "id" = ${reportId}
    `;

    await job.updateProgress(100);
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.connection.quit();
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a document processing worker
 */
export function createDocumentProcessingWorker(
  config: WorkerConfig,
  deps: WorkerDependencies
): DocumentProcessingWorker {
  return new DocumentProcessingWorker(config, deps);
}

/**
 * Create a diligence query worker
 */
export function createDiligenceQueryWorker(
  config: WorkerConfig,
  deps: WorkerDependencies
): DiligenceQueryWorker {
  return new DiligenceQueryWorker(config, deps);
}

/**
 * Create a report generation worker
 */
export function createReportGenerationWorker(
  config: WorkerConfig,
  deps: WorkerDependencies
): ReportGenerationWorker {
  return new ReportGenerationWorker(config, deps);
}

// =============================================================================
// Worker Manager (for running all workers)
// =============================================================================

export class WorkerManager {
  private workers: Array<
    DocumentProcessingWorker | DiligenceQueryWorker | ReportGenerationWorker
  > = [];

  constructor(
    private config: WorkerConfig,
    private deps: WorkerDependencies
  ) {}

  /**
   * Start all workers
   */
  startAll(): void {
    this.workers = [
      createDocumentProcessingWorker(this.config, this.deps),
      createDiligenceQueryWorker(this.config, this.deps),
      createReportGenerationWorker(this.config, this.deps),
    ];

    console.log('All workers started');
  }

  /**
   * Stop all workers gracefully
   */
  async stopAll(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    this.workers = [];
    console.log('All workers stopped');
  }
}

/**
 * Create a worker manager
 */
export function createWorkerManager(
  config: WorkerConfig,
  deps: WorkerDependencies
): WorkerManager {
  return new WorkerManager(config, deps);
}
