/**
 * Diligence Agent
 *
 * RAG-based Q&A agent for due diligence workflows.
 * Retrieves relevant document chunks, generates answers with LLM,
 * and returns properly cited responses compatible with CitationBlock.
 */
import { z } from 'zod';
import type { PrismaClient } from '@trato-hive/db';
import {
  type VectorStore,
  type EmbeddingService,
  type VectorSearchResult,
} from '@trato-hive/semantic-layer';
import {
  type LLMClient,
  RAGService,
  type RAGContext,
  type CitationAttributes,
  type RetrievedChunk,
  type FactRecord,
} from '@trato-hive/ai-core';

// =============================================================================
// Types & Configuration
// =============================================================================

export const diligenceAgentConfigSchema = z.object({
  /** Maximum chunks to retrieve for context */
  topK: z.number().default(10),
  /** Minimum relevance score for retrieved chunks */
  minScore: z.number().default(0.5),
  /** Maximum tokens for LLM response */
  maxTokens: z.number().default(2000),
  /** LLM temperature (lower = more factual) */
  temperature: z.number().default(0.2),
  /** Whether to include facts in context */
  includeFacts: z.boolean().default(true),
  /** Maximum facts to include if available */
  maxFacts: z.number().default(20),
});

export type DiligenceAgentConfig = z.infer<typeof diligenceAgentConfigSchema>;

export interface DiligenceAgentDependencies {
  vectorStore: VectorStore;
  embeddings: EmbeddingService;
  llmClient: LLMClient;
  db?: PrismaClient;
}

// =============================================================================
// Query & Response Types
// =============================================================================

export interface DiligenceQuery {
  /** The question to answer */
  question: string;
  /** Organization ID for multi-tenancy */
  organizationId: string;
  /** Optional company ID to filter context */
  companyId?: string;
  /** Optional deal ID to filter context */
  dealId?: string;
  /** Optional document IDs to restrict search */
  documentIds?: string[];
}

export interface DiligenceResponse {
  /** The generated answer text */
  answer: string;
  /** Citations for the answer (compatible with CitationBlock) */
  citations: CitationAttributes[];
  /** Indices of citations used in the answer */
  citationIndices: number[];
  /** Metadata about the query processing */
  metadata: DiligenceMetadata;
}

export interface DiligenceMetadata {
  /** Total chunks retrieved from vector store */
  chunksRetrieved: number;
  /** Facts retrieved from database */
  factsRetrieved: number;
  /** LLM response metadata */
  llmResponse: {
    model: string;
    tokensUsed: number;
    cost: number;
    latencyMs: number;
  };
  /** Total processing time */
  processingTimeMs: number;
}

// =============================================================================
// Report Types
// =============================================================================

export interface DiligenceReportSection {
  title: string;
  content: string;
  citations: CitationAttributes[];
}

export interface DiligenceReport {
  dealId: string;
  dealName: string;
  generatedAt: Date;
  sections: DiligenceReportSection[];
  metadata: {
    totalCitations: number;
    processingTimeMs: number;
  };
}

// =============================================================================
// Diligence Agent Class
// =============================================================================

export class DiligenceAgent {
  private readonly config: DiligenceAgentConfig;
  private readonly deps: DiligenceAgentDependencies;
  private readonly ragService: RAGService;

  constructor(
    deps: DiligenceAgentDependencies,
    config: Partial<DiligenceAgentConfig> = {}
  ) {
    this.deps = deps;
    this.config = diligenceAgentConfigSchema.parse(config);
    this.ragService = new RAGService();
  }

  /**
   * Answer a diligence question with RAG
   */
  async answerQuestion(query: DiligenceQuery): Promise<DiligenceResponse> {
    const startTime = Date.now();

    // 1. Generate embedding for the query
    const queryEmbedding = await this.deps.embeddings.generateEmbedding(
      query.question
    );

    // 2. Retrieve relevant chunks from vector store
    const searchResults = await this.deps.vectorStore.search(
      queryEmbedding,
      query.organizationId,
      {
        topK: this.config.topK,
        minScore: this.config.minScore,
        filter: query.documentIds?.length
          ? { documentId: query.documentIds[0] } // Filter by document if provided
          : undefined,
      }
    );

    // 3. Convert to RetrievedChunk format
    const chunks = this.convertToRetrievedChunks(searchResults);

    // 4. Optionally retrieve facts from database
    let facts: FactRecord[] = [];
    if (this.config.includeFacts && this.deps.db && query.companyId) {
      facts = await this.retrieveFacts(query.companyId, query.organizationId);
    }

    // 5. Build RAG context
    const context: RAGContext = {
      query: query.question,
      chunks,
      facts: facts.length > 0 ? facts : undefined,
    };

    // 6. Generate answer with LLM
    const prompt = facts.length > 0
      ? this.ragService.buildFactBasedPrompt(context)
      : this.ragService.buildContextPrompt(context);

    const llmResponse = await this.deps.llmClient.generate(prompt, {
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });

    // 7. Process response and extract citations
    const ragResponse = this.ragService.processResponse(
      llmResponse.content,
      context
    );

    // 8. Build final response
    return {
      answer: ragResponse.answer,
      citations: ragResponse.citations,
      citationIndices: ragResponse.citationIndices,
      metadata: {
        chunksRetrieved: chunks.length,
        factsRetrieved: facts.length,
        llmResponse: {
          model: llmResponse.model,
          tokensUsed: llmResponse.tokensUsed.total,
          cost: llmResponse.cost,
          latencyMs: llmResponse.latencyMs,
        },
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Generate a comprehensive diligence report for a deal
   */
  async generateReport(
    dealId: string,
    organizationId: string
  ): Promise<DiligenceReport> {
    const startTime = Date.now();

    // Get deal information
    if (!this.deps.db) {
      throw new DiligenceAgentError(
        'Database client required for report generation',
        'CONFIG_ERROR'
      );
    }

    const deal = await this.deps.db.deal.findUnique({
      where: { id: dealId },
      include: {
        company: true,
      },
    });

    if (!deal) {
      throw new DiligenceAgentError(
        `Deal not found: ${dealId}`,
        'DEAL_NOT_FOUND'
      );
    }

    // Define report sections with questions
    const sectionQuestions = [
      {
        title: 'Company Overview',
        question: 'Provide a comprehensive overview of the company including its history, mission, and key milestones.',
      },
      {
        title: 'Financial Performance',
        question: 'What are the key financial metrics and performance indicators? Include revenue, EBITDA, margins, and growth rates.',
      },
      {
        title: 'Products & Services',
        question: 'Describe the main products and services offered. What is the competitive positioning?',
      },
      {
        title: 'Key Personnel',
        question: 'Who are the key executives and board members? What is their background and tenure?',
      },
      {
        title: 'Risks & Concerns',
        question: 'What are the main risks, concerns, and red flags identified in the documents?',
      },
      {
        title: 'Opportunities',
        question: 'What growth opportunities and potential synergies have been identified?',
      },
    ];

    // Generate each section
    const sections: DiligenceReportSection[] = [];
    let totalCitations = 0;

    for (const section of sectionQuestions) {
      try {
        const response = await this.answerQuestion({
          question: section.question,
          organizationId,
          companyId: deal.companyId || undefined,
          dealId,
        });

        sections.push({
          title: section.title,
          content: response.answer,
          citations: response.citations,
        });

        totalCitations += response.citations.length;
      } catch (error) {
        // Include section with error note
        sections.push({
          title: section.title,
          content: `Unable to generate this section: ${error instanceof Error ? error.message : 'Unknown error'}`,
          citations: [],
        });
      }
    }

    return {
      dealId,
      dealName: deal.name,
      generatedAt: new Date(),
      sections,
      metadata: {
        totalCitations,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Ask follow-up questions with conversation context
   */
  async askFollowUp(
    question: string,
    previousAnswer: string,
    _previousCitations: CitationAttributes[],
    query: Omit<DiligenceQuery, 'question'>
  ): Promise<DiligenceResponse> {
    // Build follow-up prompt with previous context
    const followUpQuestion = `Previous answer: "${previousAnswer.slice(0, 500)}..."

Follow-up question: ${question}

Answer the follow-up question using the same document context.`;

    return this.answerQuestion({
      ...query,
      question: followUpQuestion,
    });
  }

  /**
   * Validate if a question can be answered from available context
   */
  async canAnswer(query: DiligenceQuery): Promise<{
    canAnswer: boolean;
    relevantChunks: number;
    confidence: number;
  }> {
    // Generate embedding and search
    const queryEmbedding = await this.deps.embeddings.generateEmbedding(
      query.question
    );

    const searchResults = await this.deps.vectorStore.search(
      queryEmbedding,
      query.organizationId,
      {
        topK: 5,
        minScore: this.config.minScore,
      }
    );

    // Calculate confidence based on search results
    const avgScore =
      searchResults.length > 0
        ? searchResults.reduce((sum: number, r: VectorSearchResult) => sum + r.score, 0) / searchResults.length
        : 0;

    return {
      canAnswer: searchResults.length >= 2 && avgScore >= 0.6,
      relevantChunks: searchResults.length,
      confidence: avgScore,
    };
  }

  /**
   * Convert vector search results to RetrievedChunk format
   */
  private convertToRetrievedChunks(
    results: VectorSearchResult[]
  ): RetrievedChunk[] {
    return results.map((result) => ({
      id: result.id,
      content: result.content,
      score: result.score,
      metadata: {
        documentId: result.metadata.documentId,
        documentName: result.metadata.documentName,
        pageNumber: result.metadata.pageNumber,
        organizationId: result.metadata.organizationId,
      },
    }));
  }

  /**
   * Retrieve facts for a company from database
   */
  private async retrieveFacts(companyId: string, organizationId: string): Promise<FactRecord[]> {
    if (!this.deps.db) {
      return [];
    }

    const facts = await this.deps.db.fact.findMany({
      where: { companyId, company: { organizationId } },
      include: {
        document: {
          select: { name: true },
        },
      },
      orderBy: { confidence: 'desc' },
      take: this.config.maxFacts,
    });

    return facts.map((fact: {
      id: string;
      type: string;
      subject: string;
      predicate: string;
      object: string;
      confidence: number;
      sourceText: string | null;
      documentId: string | null;
      document?: { name: string } | null;
    }) => ({
      id: fact.id,
      type: fact.type,
      subject: fact.subject,
      predicate: fact.predicate,
      object: fact.object,
      confidence: fact.confidence,
      sourceText: fact.sourceText,
      documentId: fact.documentId,
      documentName: fact.document?.name,
    }));
  }
}

// =============================================================================
// Error Class
// =============================================================================

export type DiligenceAgentErrorCode =
  | 'CONFIG_ERROR'
  | 'DEAL_NOT_FOUND'
  | 'QUERY_FAILED'
  | 'LLM_ERROR'
  | 'EMBEDDING_ERROR'
  | 'UNKNOWN';

export class DiligenceAgentError extends Error {
  constructor(
    message: string,
    public readonly code: DiligenceAgentErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'DiligenceAgentError';
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a diligence agent with dependencies
 */
export function createDiligenceAgent(
  deps: DiligenceAgentDependencies,
  config?: Partial<DiligenceAgentConfig>
): DiligenceAgent {
  return new DiligenceAgent(deps, config);
}
