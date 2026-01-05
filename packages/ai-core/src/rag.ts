/**
 * RAG (Retrieval Augmented Generation) Service
 *
 * Provides context building, citation extraction, and response formatting
 * for the Diligence Agent Q&A flow.
 */

// =============================================================================
// Types - Aligned with CitationBlock attributes
// =============================================================================

/**
 * A retrieved chunk from the vector store
 */
export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
  metadata: {
    documentId: string;
    documentName: string;
    pageNumber?: number;
    organizationId: string;
  };
}

/**
 * A fact from the database (matches Prisma Fact model)
 */
export interface FactRecord {
  id: string;
  type: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sourceText: string | null;
  documentId: string | null;
  documentName?: string;
}

/**
 * Citation attributes compatible with CitationBlock
 */
export interface CitationAttributes {
  factId: string;
  sourceText: string;
  confidence: number;
  documentName: string;
  subject: string;
  predicate: string;
  object: string;
}

/**
 * RAG context for query
 */
export interface RAGContext {
  query: string;
  chunks: RetrievedChunk[];
  facts?: FactRecord[];
}

/**
 * RAG response with citations
 */
export interface RAGResponse {
  answer: string;
  citations: CitationAttributes[];
  citationIndices: number[];
}

/**
 * Extracted citation reference from LLM output
 */
export interface ExtractedCitation {
  index: number;
  startOffset: number;
  endOffset: number;
  text: string;
}

// =============================================================================
// RAG Service Class
// =============================================================================

export class RAGService {
  /**
   * Build context prompt from retrieved chunks
   * Uses numbered citations that the LLM can reference
   */
  buildContextPrompt(context: RAGContext): string {
    const chunkContext = context.chunks
      .map((chunk, idx) => {
        const pageInfo = chunk.metadata.pageNumber ? ` (Page ${chunk.metadata.pageNumber})` : '';
        return `[${idx + 1}] ${chunk.content}
Source: ${chunk.metadata.documentName}${pageInfo}`;
      })
      .join('\n\n---\n\n');

    return `You are a diligence analyst answering questions based on verified documents.
Answer the question using ONLY the information provided in the context below.
For each claim or fact you state, include a citation in the format [1], [2], etc.
If you cannot find the answer in the context, say "I cannot find this information in the provided documents."

CONTEXT:
${chunkContext}

QUESTION: ${context.query}

INSTRUCTIONS:
- Cite sources for every factual claim using [N] format
- Be specific and quote relevant text when helpful
- If uncertain, indicate the level of confidence
- Do not make claims without supporting evidence`;
  }

  /**
   * Build context prompt including facts (for when facts have been extracted)
   */
  buildFactBasedPrompt(context: RAGContext): string {
    if (!context.facts || context.facts.length === 0) {
      return this.buildContextPrompt(context);
    }

    const factContext = context.facts
      .map((fact, idx) => {
        return `[${idx + 1}] ${fact.subject} ${fact.predicate} ${fact.object}
Confidence: ${(fact.confidence * 100).toFixed(0)}%
Source: ${fact.documentName || 'Unknown'}
Original text: "${fact.sourceText || 'N/A'}"`;
      })
      .join('\n\n---\n\n');

    return `You are a diligence analyst answering questions based on verified facts.
Answer the question using ONLY the facts provided below.
For each claim you make, include a citation in the format [1], [2], etc.
If you cannot find the answer, say "I cannot find this information in the available facts."

VERIFIED FACTS:
${factContext}

QUESTION: ${context.query}

INSTRUCTIONS:
- Cite the fact number for every claim using [N] format
- Prioritize high-confidence facts
- Be specific and accurate
- Do not extrapolate beyond the provided facts`;
  }

  /**
   * Extract citation markers from LLM response
   * Returns unique citation indices found in the text
   */
  extractCitationIndices(response: string): number[] {
    const citationRegex = /\[(\d+)\]/g;
    const indices = new Set<number>();
    let match;

    while ((match = citationRegex.exec(response)) !== null) {
      indices.add(parseInt(match[1], 10));
    }

    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * Extract citation markers with their positions in the text
   */
  extractCitationsWithPositions(response: string): ExtractedCitation[] {
    const citationRegex = /\[(\d+)\]/g;
    const citations: ExtractedCitation[] = [];
    let match;

    while ((match = citationRegex.exec(response)) !== null) {
      citations.push({
        index: parseInt(match[1], 10),
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        text: match[0],
      });
    }

    return citations;
  }

  /**
   * Map citation indices to CitationAttributes from chunks
   */
  mapChunksToCitations(
    citationIndices: number[],
    chunks: RetrievedChunk[]
  ): CitationAttributes[] {
    return citationIndices
      .filter((idx) => idx > 0 && idx <= chunks.length)
      .map((idx) => {
        const chunk = chunks[idx - 1];
        return {
          factId: chunk.id,
          sourceText: chunk.content.slice(0, 500), // Truncate for display
          confidence: chunk.score,
          documentName: chunk.metadata.documentName,
          subject: 'Reference',
          predicate: 'from',
          object: chunk.metadata.documentName,
        };
      });
  }

  /**
   * Map citation indices to CitationAttributes from facts
   * This is the primary method for integrating with CitationBlock
   */
  mapFactsToCitations(
    citationIndices: number[],
    facts: FactRecord[]
  ): CitationAttributes[] {
    return citationIndices
      .filter((idx) => idx > 0 && idx <= facts.length)
      .map((idx) => {
        const fact = facts[idx - 1];
        return {
          factId: fact.id,
          sourceText: fact.sourceText || `${fact.subject} ${fact.predicate} ${fact.object}`,
          confidence: fact.confidence,
          documentName: fact.documentName || 'Unknown Document',
          subject: fact.subject,
          predicate: fact.predicate,
          object: fact.object,
        };
      });
  }

  /**
   * Process a complete RAG query
   * Returns answer with properly linked citations
   */
  processResponse(
    answer: string,
    context: RAGContext
  ): RAGResponse {
    const citationIndices = this.extractCitationIndices(answer);

    // Prefer facts if available, otherwise use chunks
    const citations = context.facts && context.facts.length > 0
      ? this.mapFactsToCitations(citationIndices, context.facts)
      : this.mapChunksToCitations(citationIndices, context.chunks);

    return {
      answer,
      citations,
      citationIndices,
    };
  }

  /**
   * Validate that all citations in the answer reference valid sources
   */
  validateCitations(
    answer: string,
    maxIndex: number
  ): { valid: boolean; invalidIndices: number[] } {
    const indices = this.extractCitationIndices(answer);
    const invalidIndices = indices.filter((idx) => idx < 1 || idx > maxIndex);

    return {
      valid: invalidIndices.length === 0,
      invalidIndices,
    };
  }

  /**
   * Remove invalid citation markers from answer
   */
  cleanInvalidCitations(answer: string, maxIndex: number): string {
    return answer.replace(/\[(\d+)\]/g, (match, num) => {
      const idx = parseInt(num, 10);
      return idx >= 1 && idx <= maxIndex ? match : '';
    });
  }

  /**
   * Format answer with inline citation links (for display)
   */
  formatAnswerWithLinks(
    answer: string,
    citations: CitationAttributes[],
    citationIndices: number[]
  ): string {
    let formatted = answer;

    // Replace [N] with linked citations
    citationIndices.forEach((idx, i) => {
      if (citations[i]) {
        const citation = citations[i];
        formatted = formatted.replace(
          new RegExp(`\\[${idx}\\]`, 'g'),
          `[${citation.subject}: ${citation.object}]`
        );
      }
    });

    return formatted;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a RAG service instance
 */
export function createRAGService(): RAGService {
  return new RAGService();
}

// =============================================================================
// Prompt Templates
// =============================================================================

export const PROMPT_TEMPLATES = {
  /**
   * Standard Q&A prompt for diligence
   */
  DILIGENCE_QA: `You are a diligence analyst answering questions based on verified documents.
Answer using ONLY the provided context. Cite sources as [1], [2], etc.
If unsure, indicate uncertainty. Never make unsupported claims.`,

  /**
   * Financial analysis prompt
   */
  FINANCIAL_ANALYSIS: `You are a financial analyst reviewing deal documents.
Extract and cite specific financial metrics. Use [N] format for citations.
Focus on: Revenue, EBITDA, margins, growth rates, and key ratios.`,

  /**
   * Legal review prompt
   */
  LEGAL_REVIEW: `You are a legal analyst reviewing contract documents.
Identify and cite key terms, obligations, and risks. Use [N] format.
Flag any unusual clauses or potential issues.`,

  /**
   * Summary generation prompt
   */
  SUMMARIZATION: `Summarize the key points from the following context.
Include citations [N] for each major point.
Focus on the most important information first.`,
};
