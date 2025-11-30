/**
 * RAG (Retrieval Augmented Generation) utilities
 */

export interface RAGContext {
  query: string;
  retrievedChunks: Array<{
    content: string;
    source: string;
    score: number;
  }>;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    url: string;
    snippet: string;
  }>;
}

export class RAGService {
  /**
   * Build context prompt from retrieved chunks
   */
  buildContextPrompt(context: RAGContext): string {
    const chunks = context.retrievedChunks
      .map((chunk, idx) => `[${idx + 1}] ${chunk.content}\nSource: ${chunk.source}`)
      .join('\n\n');

    return `Based on the following context, answer the question.

Context:
${chunks}

Question: ${context.query}

Provide a detailed answer with citations in the format [1], [2], etc.`;
  }

  /**
   * Extract citations from response
   */
  extractCitations(response: string): number[] {
    const citationRegex = /\[(\d+)\]/g;
    const matches = response.matchAll(citationRegex);
    return Array.from(matches, (m) => parseInt(m[1]));
  }
}

export const createRAGService = (): RAGService => {
  return new RAGService();
};
