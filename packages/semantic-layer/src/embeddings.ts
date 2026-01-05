/**
 * Embedding Service
 *
 * Generates text embeddings using OpenAI's embedding models.
 * Supports batch processing and caching.
 */
import { OpenAIEmbeddings } from '@langchain/openai';
import type {
  EmbeddingConfig,
  BatchEmbeddingRequest,
  BatchEmbeddingResponse,
} from './types';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MODEL = 'text-embedding-3-large';
const DEFAULT_DIMENSIONS = 3072;
const MAX_BATCH_SIZE = 100;

// Model dimension mappings
const MODEL_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-large': 3072,
  'text-embedding-3-small': 1536,
  'text-embedding-ada-002': 1536,
};

// =============================================================================
// Embedding Service Class
// =============================================================================

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;
  private model: string;
  private dimensions: number;

  constructor(config: EmbeddingConfig = { model: DEFAULT_MODEL }) {
    this.model = config.model || DEFAULT_MODEL;
    this.dimensions = config.dimensions || MODEL_DIMENSIONS[this.model] || DEFAULT_DIMENSIONS;

    this.embeddings = new OpenAIEmbeddings({
      modelName: this.model,
      dimensions: this.dimensions,
      openAIApiKey: config.apiKey,
    });
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    return await this.embeddings.embedQuery(text);
  }

  /**
   * Generate embeddings for multiple texts
   * Automatically batches for efficiency
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // Filter empty texts
    const validTexts = texts.filter((t) => t && t.trim().length > 0);

    if (validTexts.length === 0) {
      throw new Error('All texts are empty');
    }

    // Process in batches
    const results: number[][] = [];

    for (let i = 0; i < validTexts.length; i += MAX_BATCH_SIZE) {
      const batch = validTexts.slice(i, i + MAX_BATCH_SIZE);
      const batchEmbeddings = await this.embeddings.embedDocuments(batch);
      results.push(...batchEmbeddings);
    }

    return results;
  }

  /**
   * Generate embeddings with metadata response
   */
  async generateBatch(request: BatchEmbeddingRequest): Promise<BatchEmbeddingResponse> {
    const embeddings = await this.generateEmbeddings(request.texts);

    // Estimate tokens (rough approximation: ~4 chars per token)
    const totalChars = request.texts.reduce((sum, t) => sum + t.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);

    return {
      embeddings,
      model: this.model,
      totalTokens: estimatedTokens,
    };
  }

  /**
   * Get the dimension of embeddings for this model
   */
  getDimension(): number {
    return this.dimensions;
  }

  /**
   * Get the model name
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);

    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an embedding service with default settings
 */
export function createEmbeddingService(config?: EmbeddingConfig): EmbeddingService {
  return new EmbeddingService(config);
}

/**
 * Create embedding service from environment variables
 */
export function createEmbeddingServiceFromEnv(): EmbeddingService {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new EmbeddingService({
    model: 'text-embedding-3-large',
    apiKey,
  });
}
