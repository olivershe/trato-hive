/**
 * Semantic Layer Types
 *
 * Shared types for vector store, fact extraction, and knowledge graph.
 */
import { z } from 'zod';

// =============================================================================
// Vector Store Types
// =============================================================================

/**
 * Document chunk for vector storage
 */
export interface VectorDocument {
  id: string;
  content: string;
  metadata: VectorMetadata;
  embedding?: number[];
}

/**
 * Metadata stored with each vector
 */
export interface VectorMetadata {
  documentId: string;
  documentName: string;
  organizationId: string;
  pageNumber?: number;
  chunkIndex?: number;
  boundingBox?: BoundingBox;
}

/**
 * Bounding box for citation highlighting
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

/**
 * Search result from vector store
 */
export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  metadata: VectorMetadata;
}

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
  apiKey: string;
  indexName: string;
  dimension?: number; // Default: 3072 for text-embedding-3-large
}

/**
 * Search options for similarity queries
 */
export interface SearchOptions {
  topK?: number;
  minScore?: number;
  filter?: SearchFilter;
}

/**
 * Filter for vector search
 */
export interface SearchFilter {
  documentId?: string;
  organizationId?: string;
  pageNumber?: number;
}

// =============================================================================
// Fact Extraction Types
// =============================================================================

/**
 * Fact types matching Prisma FactType enum
 */
export const FactTypeEnum = z.enum([
  'FINANCIAL_METRIC',
  'KEY_PERSON',
  'PRODUCT',
  'CUSTOMER',
  'RISK',
  'OPPORTUNITY',
  'OTHER',
]);

export type FactType = z.infer<typeof FactTypeEnum>;

/**
 * Extracted fact from document
 */
export interface ExtractedFact {
  type: FactType;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sourceText: string;
  pageNumber?: number;
}

/**
 * Fact with database IDs
 */
export interface StoredFact extends ExtractedFact {
  id: string;
  documentId: string | null;
  companyId: string | null;
  extractedBy: string;
  createdAt: Date;
}

/**
 * Fact extraction context
 */
export interface ExtractionContext {
  documentId: string;
  documentName: string;
  organizationId: string;
  companyId?: string;
  pageNumber?: number;
}

/**
 * Fact extraction result
 */
export interface ExtractionResult {
  facts: ExtractedFact[];
  documentId: string;
  totalChunks: number;
  processingTimeMs: number;
}

// =============================================================================
// Zod Schemas for LLM Output Validation
// =============================================================================

/**
 * Schema for LLM fact extraction output
 */
export const ExtractedFactSchema = z.object({
  type: FactTypeEnum,
  subject: z.string().min(1).max(500),
  predicate: z.string().min(1).max(100),
  object: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
  sourceText: z.string().min(1).max(1000),
});

export const FactExtractionOutputSchema = z.object({
  facts: z.array(ExtractedFactSchema),
});

export type FactExtractionOutput = z.infer<typeof FactExtractionOutputSchema>;

// =============================================================================
// Embedding Types
// =============================================================================

/**
 * Embedding model configuration
 */
export interface EmbeddingConfig {
  model: 'text-embedding-3-large' | 'text-embedding-3-small' | 'text-embedding-ada-002';
  dimensions?: number;
  apiKey?: string;
}

/**
 * Batch embedding request
 */
export interface BatchEmbeddingRequest {
  texts: string[];
  model?: EmbeddingConfig['model'];
}

/**
 * Batch embedding response
 */
export interface BatchEmbeddingResponse {
  embeddings: number[][];
  model: string;
  totalTokens: number;
}
