/**
 * Document Processing Agent
 *
 * Orchestrates the full document processing pipeline:
 * 1. Fetch document from S3
 * 2. Parse with Reducto AI
 * 3. Store DocumentChunks in database
 * 4. Generate embeddings
 * 5. Index in Pinecone (vector store)
 * 6. Extract facts
 * 7. Update document status → INDEXED
 */
import { z } from 'zod';
import type { PrismaClient } from '@trato-hive/db';
import {
  type StorageClient,
  type ReductoClient,
  type ParsedChunk,
} from '@trato-hive/data-plane';
import {
  type VectorStore,
  type EmbeddingService,
  type FactExtractor,
} from '@trato-hive/semantic-layer';
import { DocumentTaggerService } from '@trato-hive/ai-core';

// =============================================================================
// Types & Configuration
// =============================================================================

export const documentAgentConfigSchema = z.object({
  /** Maximum chunks to process in parallel */
  chunkBatchSize: z.number().default(10),
  /** Maximum facts to extract per chunk */
  maxFactsPerChunk: z.number().default(5),
  /** Minimum confidence for fact extraction */
  minFactConfidence: z.number().default(0.7),
});

export type DocumentAgentConfig = z.infer<typeof documentAgentConfigSchema>;

export interface DocumentAgentDependencies {
  db: PrismaClient;
  storage: StorageClient;
  reducto: ReductoClient;
  vectorStore: VectorStore;
  embeddings: EmbeddingService;
  factExtractor: FactExtractor;
  /** Document tagger for AI auto-tagging (optional) */
  documentTagger?: DocumentTaggerService;
}

export interface ProcessDocumentOptions {
  /** Skip embedding generation (for reprocessing) */
  skipEmbeddings?: boolean;
  /** Skip fact extraction (for reprocessing) */
  skipFacts?: boolean;
  /** Skip AI tagging (for reprocessing) */
  skipTagging?: boolean;
}

export interface ProcessDocumentResult {
  documentId: string;
  status: 'success' | 'failed';
  chunksCreated: number;
  chunksEmbedded: number;
  factsExtracted: number;
  tagsApplied: boolean;
  processingTimeMs: number;
  error?: string;
}

// Document status enum matching Prisma schema
type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'PARSED' | 'INDEXED' | 'FAILED';

// =============================================================================
// Document Agent Class
// =============================================================================

export class DocumentAgent {
  private readonly config: DocumentAgentConfig;
  private readonly deps: DocumentAgentDependencies;

  constructor(
    deps: DocumentAgentDependencies,
    config: Partial<DocumentAgentConfig> = {}
  ) {
    this.deps = deps;
    this.config = documentAgentConfigSchema.parse(config);
  }

  /**
   * Process a document through the full pipeline
   */
  async processDocument(
    documentId: string,
    options: ProcessDocumentOptions = {}
  ): Promise<ProcessDocumentResult> {
    const startTime = Date.now();
    let chunksCreated = 0;
    let chunksEmbedded = 0;
    let factsExtracted = 0;
    let tagsApplied = false;

    try {
      // 1. Get document and update status to PROCESSING
      const document = await this.getDocument(documentId);
      await this.updateDocumentStatus(documentId, 'PROCESSING');

      // 2. Get presigned URL for the document
      const fileUrl = await this.deps.storage.getPresignedUrl(document.fileUrl);

      // 3. Parse document with Reducto
      const parseResult = await this.deps.reducto.parseDocument(fileUrl, {
        chunkMode: 'block',
        extractTables: true,
      });
      await this.updateDocumentStatus(documentId, 'PARSED');

      // 4. Store chunks in database
      const chunks = await this.storeChunks(documentId, parseResult.chunks);
      chunksCreated = chunks.length;

      // 5. Apply AI tags (Document Vault feature)
      if (!options.skipTagging && this.deps.documentTagger) {
        tagsApplied = await this.applyAITags(
          documentId,
          document.name,
          chunks,
          document.organizationId
        );
      }

      // 6. Generate embeddings and index in vector store
      if (!options.skipEmbeddings) {
        chunksEmbedded = await this.embedAndIndexChunks(
          chunks,
          document.organizationId,
          documentId,
          document.name
        );
      }

      // 7. Extract facts from chunks
      if (!options.skipFacts) {
        factsExtracted = await this.extractFacts(
          chunks,
          documentId,
          document.companyId
        );
      }

      // 8. Update status to INDEXED
      await this.updateDocumentStatus(documentId, 'INDEXED');

      return {
        documentId,
        status: 'success',
        chunksCreated,
        chunksEmbedded,
        factsExtracted,
        tagsApplied,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      // Update status to FAILED
      await this.updateDocumentStatus(documentId, 'FAILED').catch(() => {
        // Ignore error updating status
      });

      return {
        documentId,
        status: 'failed',
        chunksCreated,
        chunksEmbedded,
        factsExtracted,
        tagsApplied,
        processingTimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reprocess a document (useful for re-extracting facts with new model)
   */
  async reprocessDocument(
    documentId: string,
    options: { reextractFacts?: boolean; reembed?: boolean; retag?: boolean } = {}
  ): Promise<ProcessDocumentResult> {
    // Delete existing chunks, embeddings, and facts if reprocessing
    if (options.reembed) {
      await this.deleteExistingChunks(documentId);
    }

    if (options.reextractFacts) {
      await this.deleteExistingFacts(documentId);
    }

    // Reset tags if re-tagging
    if (options.retag) {
      await this.deps.db.document.update({
        where: { id: documentId },
        data: {
          aiDocumentType: null,
          aiIndustry: null,
          contentTags: [],
          tagsAppliedAt: null,
          tagsConfidence: null,
          tagsOverridden: false,
        },
      });
    }

    return this.processDocument(documentId, {
      skipEmbeddings: !options.reembed,
      skipFacts: !options.reextractFacts,
      skipTagging: !options.retag,
    });
  }

  /**
   * Get document from database
   */
  private async getDocument(documentId: string) {
    const document = await this.deps.db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new DocumentAgentError(
        `Document not found: ${documentId}`,
        'DOCUMENT_NOT_FOUND'
      );
    }

    return document;
  }

  /**
   * Update document status
   */
  private async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus
  ): Promise<void> {
    await this.deps.db.document.update({
      where: { id: documentId },
      data: { status },
    });
  }

  /**
   * Store parsed chunks in database
   */
  private async storeChunks(
    documentId: string,
    parsedChunks: ParsedChunk[]
  ): Promise<StoredChunk[]> {
    const chunks: StoredChunk[] = [];

    for (const parsed of parsedChunks) {
      const chunk = await this.deps.db.documentChunk.create({
        data: {
          documentId,
          content: parsed.content,
          pageNumber: parsed.pageNumber,
          chunkIndex: parsed.index,
          ...(parsed.boundingBox && {
            boundingBox: JSON.stringify(parsed.boundingBox),
          }),
        },
      });

      chunks.push({
        id: chunk.id,
        content: chunk.content,
        pageNumber: chunk.pageNumber ?? undefined,
        chunkIndex: chunk.chunkIndex ?? parsed.index,
      });
    }

    return chunks;
  }

  /**
   * Generate embeddings and index chunks in vector store
   */
  private async embedAndIndexChunks(
    chunks: StoredChunk[],
    organizationId: string,
    documentId: string,
    documentName: string
  ): Promise<number> {
    let indexed = 0;

    // Process in batches
    for (let i = 0; i < chunks.length; i += this.config.chunkBatchSize) {
      const batch = chunks.slice(i, i + this.config.chunkBatchSize);

      // Generate embeddings for batch
      const embeddings = await this.deps.embeddings.generateEmbeddings(
        batch.map((c) => c.content)
      );

      // Build vector documents
      const vectorDocuments = batch.map((chunk, j) => ({
        id: chunk.id,
        content: chunk.content,
        embedding: embeddings[j],
        metadata: {
          documentId,
          documentName,
          organizationId,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex,
        },
      }));

      // Upsert to vector store
      const result = await this.deps.vectorStore.upsert(
        vectorDocuments,
        organizationId
      );

      // Update chunks with vector IDs (using chunk.id as vectorId)
      for (const chunk of batch) {
        await this.deps.db.documentChunk.update({
          where: { id: chunk.id },
          data: { vectorId: chunk.id },
        });
      }

      indexed += result.upsertedCount;
    }

    return indexed;
  }

  /**
   * Extract facts from chunks
   */
  private async extractFacts(
    chunks: StoredChunk[],
    documentId: string,
    companyId: string | null
  ): Promise<number> {
    let totalFacts = 0;

    for (const chunk of chunks) {
      try {
        const facts = await this.deps.factExtractor.extractFacts(chunk.content, {
          documentId,
          documentName: '', // Not used for extraction, only for context
          organizationId: '', // Not used for extraction, only for context
          pageNumber: chunk.pageNumber,
        });

        for (const fact of facts) {
          await this.deps.db.fact.create({
            data: {
              documentId,
              companyId,
              type: fact.type,
              subject: fact.subject,
              predicate: fact.predicate,
              object: fact.object,
              confidence: fact.confidence,
              sourceText: fact.sourceText,
              sourceChunkId: chunk.id,
              extractedBy: 'document-agent',
            },
          });
          totalFacts++;
        }
      } catch (error) {
        // Log but continue with other chunks
        console.error(`Failed to extract facts from chunk ${chunk.id}:`, error);
      }
    }

    return totalFacts;
  }

  /**
   * Delete existing chunks for reprocessing
   */
  private async deleteExistingChunks(documentId: string): Promise<void> {
    // Get document to find organizationId
    const document = await this.getDocument(documentId);

    const chunks = await this.deps.db.documentChunk.findMany({
      where: { documentId },
      select: { id: true, vectorId: true },
    });

    // Delete from vector store
    const vectorIds = chunks.map((c: { id: string; vectorId: string | null }) => c.vectorId).filter(Boolean) as string[];
    if (vectorIds.length > 0) {
      await this.deps.vectorStore.delete(vectorIds, document.organizationId);
    }

    // Delete from database
    await this.deps.db.documentChunk.deleteMany({
      where: { documentId },
    });
  }

  /**
   * Delete existing facts for reprocessing
   */
  private async deleteExistingFacts(documentId: string): Promise<void> {
    await this.deps.db.fact.deleteMany({
      where: { documentId },
    });
  }

  /**
   * Apply AI tags to a document (Document Vault feature)
   */
  private async applyAITags(
    documentId: string,
    documentName: string,
    chunks: StoredChunk[],
    _organizationId: string
  ): Promise<boolean> {
    if (!this.deps.documentTagger) {
      return false;
    }

    try {
      // Check if tags have been manually overridden
      const document = await this.deps.db.document.findUnique({
        where: { id: documentId },
        select: { tagsOverridden: true },
      });

      if (document?.tagsOverridden) {
        // Don't overwrite manually set tags
        return false;
      }

      // Get first few chunks for content analysis (approximately 3 pages worth)
      const contentForTagging = chunks
        .slice(0, 10)
        .map((c) => c.content)
        .join('\n\n');

      // Run AI tagging
      const result = await this.deps.documentTagger.tagDocument(
        contentForTagging,
        documentName
      );

      // Update document with tags
      await this.deps.db.document.update({
        where: { id: documentId },
        data: {
          aiDocumentType: result.tags.documentType,
          aiIndustry: result.tags.industry,
          contentTags: result.tags.contentTags,
          tagsAppliedAt: new Date(),
          tagsConfidence: result.overallConfidence,
          tagsOverridden: false,
        },
      });

      return true;
    } catch (error) {
      // Log but don't fail the pipeline - tagging is non-critical
      console.error(`Failed to apply AI tags to document ${documentId}:`, error);
      return false;
    }
  }
}

// =============================================================================
// Helper Types
// =============================================================================

interface StoredChunk {
  id: string;
  content: string;
  pageNumber?: number;
  chunkIndex: number;
}

// =============================================================================
// Error Class
// =============================================================================

export type DocumentAgentErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'PARSE_FAILED'
  | 'EMBEDDING_FAILED'
  | 'INDEXING_FAILED'
  | 'FACT_EXTRACTION_FAILED'
  | 'UNKNOWN';

export class DocumentAgentError extends Error {
  constructor(
    message: string,
    public readonly code: DocumentAgentErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DocumentAgentError';
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a document agent with dependencies
 */
export function createDocumentAgent(
  deps: DocumentAgentDependencies,
  config?: Partial<DocumentAgentConfig>
): DocumentAgent {
  return new DocumentAgent(deps, config);
}
