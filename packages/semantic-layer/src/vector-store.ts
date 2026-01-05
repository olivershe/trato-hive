/**
 * Vector Store Service
 *
 * Pinecone-based vector storage with multi-tenancy support.
 * Handles document chunk storage, similarity search, and retrieval.
 */
import { Pinecone, type RecordMetadata } from '@pinecone-database/pinecone';
import type {
  VectorStoreConfig,
  VectorDocument,
  VectorMetadata,
  VectorSearchResult,
  SearchOptions,
  SearchFilter,
} from './types';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_DIMENSION = 3072; // text-embedding-3-large
const DEFAULT_TOP_K = 10;
const DEFAULT_MIN_SCORE = 0.5;

// =============================================================================
// Vector Store Class
// =============================================================================

export class VectorStore {
  private pinecone: Pinecone;
  private indexName: string;
  private dimension: number;

  constructor(config: VectorStoreConfig) {
    this.pinecone = new Pinecone({
      apiKey: config.apiKey,
    });
    this.indexName = config.indexName;
    this.dimension = config.dimension || DEFAULT_DIMENSION;
  }

  /**
   * Get Pinecone index
   */
  private getIndex() {
    return this.pinecone.index(this.indexName);
  }

  /**
   * Get namespace for organization (multi-tenancy)
   */
  private getNamespace(organizationId: string) {
    return this.getIndex().namespace(organizationId);
  }

  /**
   * Upsert documents with embeddings
   */
  async upsert(
    documents: VectorDocument[],
    organizationId: string
  ): Promise<{ upsertedCount: number }> {
    if (documents.length === 0) {
      return { upsertedCount: 0 };
    }

    const namespace = this.getNamespace(organizationId);

    const vectors = documents.map((doc) => ({
      id: doc.id,
      values: doc.embedding || [],
      metadata: this.toRecordMetadata(doc.metadata),
    }));

    // Batch upsert in chunks of 100
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await namespace.upsert(batch);
      totalUpserted += batch.length;
    }

    return { upsertedCount: totalUpserted };
  }

  /**
   * Search for similar documents by embedding
   */
  async search(
    embedding: number[],
    organizationId: string,
    options: SearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const namespace = this.getNamespace(organizationId);

    const topK = options.topK || DEFAULT_TOP_K;
    const minScore = options.minScore || DEFAULT_MIN_SCORE;

    const filter = options.filter ? this.buildFilter(options.filter) : undefined;

    const results = await namespace.query({
      vector: embedding,
      topK,
      includeMetadata: true,
      includeValues: false,
      filter,
    });

    return (results.matches || [])
      .filter((match) => (match.score || 0) >= minScore)
      .map((match) => ({
        id: match.id,
        content: (match.metadata?.content as string) || '',
        score: match.score || 0,
        metadata: this.fromRecordMetadata(match.metadata),
      }));
  }

  /**
   * Search by text query (requires embedding generation)
   * Note: Call this with pre-generated embeddings or use EmbeddingService
   */
  async searchByQuery(
    query: string,
    queryEmbedding: number[],
    organizationId: string,
    options: SearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    // Store query for debugging/analytics if needed
    void query;
    return this.search(queryEmbedding, organizationId, options);
  }

  /**
   * Delete documents by IDs
   */
  async delete(ids: string[], organizationId: string): Promise<void> {
    const namespace = this.getNamespace(organizationId);
    await namespace.deleteMany(ids);
  }

  /**
   * Delete all documents for a document ID
   */
  async deleteByDocumentId(
    documentId: string,
    organizationId: string
  ): Promise<void> {
    const namespace = this.getNamespace(organizationId);

    // Use metadata filter to find and delete
    // Note: Pinecone requires a query to find IDs, then delete
    const dummyVector = new Array(this.dimension).fill(0);

    const results = await namespace.query({
      vector: dummyVector,
      topK: 10000, // Get all matching vectors
      filter: { documentId: { $eq: documentId } },
      includeMetadata: false,
    });

    const idsToDelete = (results.matches || []).map((m) => m.id);

    if (idsToDelete.length > 0) {
      await namespace.deleteMany(idsToDelete);
    }
  }

  /**
   * Delete all vectors in an organization namespace
   */
  async deleteNamespace(organizationId: string): Promise<void> {
    const namespace = this.getNamespace(organizationId);
    await namespace.deleteAll();
  }

  /**
   * Fetch vectors by IDs
   */
  async fetch(
    ids: string[],
    organizationId: string
  ): Promise<VectorSearchResult[]> {
    const namespace = this.getNamespace(organizationId);
    const results = await namespace.fetch(ids);

    return Object.values(results.records || {}).map((record) => ({
      id: record.id,
      content: (record.metadata?.content as string) || '',
      score: 1.0, // Fetch doesn't have a score
      metadata: this.fromRecordMetadata(record.metadata),
    }));
  }

  /**
   * Get namespace statistics
   */
  async getStats(organizationId: string): Promise<{
    vectorCount: number;
    dimension: number;
  }> {
    const index = this.getIndex();
    const stats = await index.describeIndexStats();

    const namespaceStats = stats.namespaces?.[organizationId];

    return {
      vectorCount: namespaceStats?.recordCount || 0,
      dimension: stats.dimension || this.dimension,
    };
  }

  /**
   * Build Pinecone filter from SearchFilter
   */
  private buildFilter(filter: SearchFilter): Record<string, unknown> {
    const conditions: Record<string, unknown> = {};

    if (filter.documentId) {
      conditions.documentId = { $eq: filter.documentId };
    }

    if (filter.organizationId) {
      conditions.organizationId = { $eq: filter.organizationId };
    }

    if (filter.pageNumber !== undefined) {
      conditions.pageNumber = { $eq: filter.pageNumber };
    }

    return conditions;
  }

  /**
   * Convert VectorMetadata to Pinecone RecordMetadata
   */
  private toRecordMetadata(metadata: VectorMetadata): RecordMetadata {
    const record: RecordMetadata = {
      documentId: metadata.documentId,
      documentName: metadata.documentName,
      organizationId: metadata.organizationId,
    };

    if (metadata.pageNumber !== undefined) {
      record.pageNumber = metadata.pageNumber;
    }

    if (metadata.chunkIndex !== undefined) {
      record.chunkIndex = metadata.chunkIndex;
    }

    if (metadata.boundingBox) {
      record.boundingBox = JSON.stringify(metadata.boundingBox);
    }

    return record;
  }

  /**
   * Convert Pinecone RecordMetadata to VectorMetadata
   */
  private fromRecordMetadata(
    metadata: RecordMetadata | undefined
  ): VectorMetadata {
    if (!metadata) {
      return {
        documentId: '',
        documentName: '',
        organizationId: '',
      };
    }

    let boundingBox;
    if (metadata.boundingBox && typeof metadata.boundingBox === 'string') {
      try {
        boundingBox = JSON.parse(metadata.boundingBox);
      } catch {
        // Ignore parse errors
      }
    }

    return {
      documentId: (metadata.documentId as string) || '',
      documentName: (metadata.documentName as string) || '',
      organizationId: (metadata.organizationId as string) || '',
      pageNumber: metadata.pageNumber as number | undefined,
      chunkIndex: metadata.chunkIndex as number | undefined,
      boundingBox,
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a vector store instance
 */
export function createVectorStore(config: VectorStoreConfig): VectorStore {
  return new VectorStore(config);
}

/**
 * Create vector store from environment variables
 */
export function createVectorStoreFromEnv(): VectorStore {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }

  if (!indexName) {
    throw new Error('PINECONE_INDEX_NAME environment variable is required');
  }

  return new VectorStore({
    apiKey,
    indexName,
  });
}
