/**
 * Embedding generation utilities
 */
import { OpenAIEmbeddings } from '@langchain/openai';

export class EmbeddingService {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      modelName: 'text-embedding-3-large',
      dimensions: 3072,
    });
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return await this.embeddings.embedQuery(text);
  }

  /**
   * Generate embeddings for multiple texts
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return await this.embeddings.embedDocuments(texts);
  }
}

export const createEmbeddingService = (): EmbeddingService => {
  return new EmbeddingService();
};
