/**
 * Generator Agent — AI Page Generation
 *
 * Orchestrates the two-phase page generation flow:
 * 1. Gather context (RAG + deal metadata + attachments)
 * 2. Generate outline (single LLM call → structured sections)
 * 3. Expand each section to GeneratedBlock[] (per-section LLM calls)
 * 4. Yield streaming events for progressive frontend rendering
 *
 * For database blocks: yields the spec for server-side creation,
 * the service layer creates real Database entities.
 */
import { z } from 'zod';
import type { PrismaClient } from '@trato-hive/db';
import type {
  VectorStore,
  EmbeddingService,
  VectorSearchResult,
} from '@trato-hive/semantic-layer';
import {
  type LLMClient,
  type LLMStreamOptions,
  RAGService,
  type RetrievedChunk,
  type FactRecord,
  type PageGenerationRequest,
  type GeneratedBlock,
  type PageOutline,
  type OutlineSection,
  type GenerationTemplate,
  IncrementalBlockStreamer,
  PAGE_GENERATION_SYSTEM_PROMPT,
  buildOutlinePrompt,
  buildSectionPrompt,
} from '@trato-hive/ai-core';
import type { PageGenerationEvent } from '@trato-hive/ai-core';

// =============================================================================
// Configuration
// =============================================================================

export const pageGenerationAgentConfigSchema = z.object({
  topK: z.number().default(15),
  minScore: z.number().default(0.4),
  maxTokensOutline: z.number().default(1000),
  maxTokensSection: z.number().default(4000),
  temperature: z.number().default(0.4),
  includeFacts: z.boolean().default(true),
  maxFacts: z.number().default(30),
});

export type PageGenerationAgentConfig = z.infer<typeof pageGenerationAgentConfigSchema>;

export interface PageGenerationAgentDependencies {
  vectorStore: VectorStore;
  embeddings: EmbeddingService;
  llmClient: LLMClient;
  db?: PrismaClient;
  abortSignal?: AbortSignal;
}

// =============================================================================
// Outline Schema
// =============================================================================

const outlineSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      blockTypes: z.array(z.string()),
    })
  ),
});

// =============================================================================
// Generator Agent
// =============================================================================

export class PageGenerationAgent {
  private readonly config: PageGenerationAgentConfig;
  private readonly deps: PageGenerationAgentDependencies;
  private readonly ragService: RAGService;

  constructor(
    deps: PageGenerationAgentDependencies,
    config: Partial<PageGenerationAgentConfig> = {}
  ) {
    this.deps = deps;
    this.config = pageGenerationAgentConfigSchema.parse(config);
    this.ragService = new RAGService();
  }

  /**
   * Generate a structured page as a stream of events.
   * The caller (PageGenerationService) handles database creation.
   */
  async *generatePage(
    request: PageGenerationRequest,
    template?: GenerationTemplate
  ): AsyncGenerator<PageGenerationEvent> {
    let totalTokens = 0;
    let sectionsGenerated = 0;
    let databaseBlockCount = 0;

    try {
      // 1. Gather context
      const { contextText, chunks, facts } = await this.gatherContext(request);

      // 2. Generate outline
      const outlinePrompt = buildOutlinePrompt(
        request.prompt,
        template,
        this.summarizeContext(chunks, facts)
      );

      const { data: outlineRaw, response: outlineResponse } =
        await this.deps.llmClient.generateJSON(
          outlinePrompt,
          outlineSchema,
          {
            systemPrompt: PAGE_GENERATION_SYSTEM_PROMPT,
            maxTokens: this.config.maxTokensOutline,
            temperature: this.config.temperature,
          }
        );
      const outline = outlineRaw as unknown as PageOutline;
      totalTokens += outlineResponse.tokensUsed.total;

      // 3. Yield outline event
      yield {
        type: 'outline',
        sections: outline.sections.map((s: { title: string; blockTypes: string[] }) => ({
          title: s.title,
          blockTypes: s.blockTypes as GeneratedBlock['type'][],
        })),
      };

      // 4. Expand each section with token-level streaming
      let globalBlockIndex = 0;

      for (let i = 0; i < outline.sections.length; i++) {
        const section = outline.sections[i];

        yield { type: 'section_start', index: i, title: section.title };

        try {
          for await (const event of this.expandSectionStreaming(
            section,
            contextText,
            i + 1,
            i,
            globalBlockIndex
          )) {
            yield event;

            // Track tokens from block_end events
            if (event.type === 'block_end' || event.type === 'block') {
              // Count database blocks
              if (event.type === 'block') {
                const blockEvent = event as { block: GeneratedBlock; sectionIndex: number };
                if (blockEvent.block.type === 'database' && blockEvent.block.database) {
                  yield {
                    type: 'database_created',
                    databaseId: '',
                    name: blockEvent.block.database.name,
                    blockIndex: globalBlockIndex,
                  };
                  databaseBlockCount++;
                }
              }
              globalBlockIndex++;
            }
          }
        } catch (error) {
          yield {
            type: 'block',
            block: {
              type: 'callout',
              content: `Unable to generate this section: ${error instanceof Error ? error.message : 'Unknown error'}`,
              emoji: '⚠️',
            },
            sectionIndex: i,
          };
          globalBlockIndex++;
        }

        yield { type: 'section_complete', index: i };
        sectionsGenerated++;
      }

      // 5. Yield completion
      yield {
        type: 'complete',
        metadata: {
          tokensUsed: totalTokens,
          sectionsGenerated,
          databasesCreated: databaseBlockCount,
        },
      };
    } catch (error) {
      yield {
        type: 'error',
        message: error instanceof Error ? error.message : 'Generation failed',
      };
    }
  }

  // ===========================================================================
  // Context Gathering
  // ===========================================================================

  private async gatherContext(request: PageGenerationRequest): Promise<{
    contextText: string;
    chunks: RetrievedChunk[];
    facts: FactRecord[];
  }> {
    // Generate embedding for the prompt
    const queryEmbedding = await this.deps.embeddings.generateEmbedding(
      request.prompt
    );

    // Retrieve relevant chunks
    const searchResults = await this.deps.vectorStore.search(
      queryEmbedding,
      request.organizationId,
      {
        topK: this.config.topK,
        minScore: this.config.minScore,
        filter: request.context?.documentIds?.length
          ? { documentId: request.context.documentIds[0] }
          : undefined,
      }
    );

    const chunks = this.convertToRetrievedChunks(searchResults);

    // Retrieve facts if available
    let facts: FactRecord[] = [];
    if (
      this.config.includeFacts &&
      this.deps.db &&
      request.context?.companyId
    ) {
      facts = await this.retrieveFacts(request.context.companyId, request.organizationId);
    }

    // Build context text
    const contextText = this.ragService.buildContextPrompt({
      query: request.prompt,
      chunks,
      facts: facts.length > 0 ? facts : undefined,
    });

    return { contextText, chunks, facts };
  }

  // ===========================================================================
  // Streaming Section Expansion (TASK-136)
  // ===========================================================================

  private async *expandSectionStreaming(
    section: OutlineSection,
    contextText: string,
    citationStartIndex: number,
    sectionIndex: number,
    startBlockIndex: number
  ): AsyncGenerator<PageGenerationEvent> {
    const prompt = buildSectionPrompt(
      section.title,
      section.description,
      section.blockTypes as GeneratedBlock['type'][],
      contextText,
      citationStartIndex
    );

    const streamOptions: LLMStreamOptions = {
      systemPrompt: PAGE_GENERATION_SYSTEM_PROMPT,
      maxTokens: this.config.maxTokensSection,
      temperature: this.config.temperature,
      abortSignal: this.deps.abortSignal,
    };

    const streamer = new IncrementalBlockStreamer(sectionIndex, startBlockIndex);
    let hasYieldedAny = false;

    const stream = this.deps.llmClient.streamGenerate(prompt, streamOptions);

    for await (const chunk of stream) {
      streamer.feed(chunk.text);
      for (const event of streamer.flush()) {
        hasYieldedAny = true;
        yield event;
      }
    }

    // Flush any remaining events
    for (const event of streamer.flush()) {
      hasYieldedAny = true;
      yield event;
    }

    // Fallback: if the streamer produced nothing, emit heading + raw paragraph
    if (!hasYieldedAny) {
      yield {
        type: 'block',
        block: { type: 'heading', level: 2, content: section.title },
        sectionIndex,
      };
      yield {
        type: 'block',
        block: { type: 'paragraph', content: 'Content could not be parsed from the response.' },
        sectionIndex,
      };
    }
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

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

  private async retrieveFacts(companyId: string, organizationId: string): Promise<FactRecord[]> {
    if (!this.deps.db) return [];

    const facts = await this.deps.db.fact.findMany({
      where: { companyId, company: { organizationId } },
      include: { document: { select: { name: true } } },
      orderBy: { confidence: 'desc' },
      take: this.config.maxFacts,
    });

    return facts.map(
      (fact: {
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
      })
    );
  }

  private summarizeContext(
    chunks: RetrievedChunk[],
    facts: FactRecord[]
  ): string {
    const parts: string[] = [];

    if (chunks.length > 0) {
      const docNames = [
        ...new Set(chunks.map((c) => c.metadata.documentName)),
      ];
      parts.push(
        `${chunks.length} document chunks from: ${docNames.join(', ')}`
      );
    }

    if (facts.length > 0) {
      parts.push(`${facts.length} verified facts`);
    }

    return parts.length > 0
      ? parts.join('\n')
      : 'No specific context available — generate based on general knowledge.';
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createPageGenerationAgent(
  deps: PageGenerationAgentDependencies,
  config?: Partial<PageGenerationAgentConfig>
): PageGenerationAgent {
  return new PageGenerationAgent(deps, config);
}

// =============================================================================
// Backward-Compat Re-exports
// =============================================================================

/** @deprecated Use PageGenerationAgent */
export const GeneratorAgent = PageGenerationAgent;
/** @deprecated Use createPageGenerationAgent */
export const createGeneratorAgent = createPageGenerationAgent;
/** @deprecated Use PageGenerationAgentDependencies */
export type GeneratorAgentDependencies = PageGenerationAgentDependencies;
/** @deprecated Use PageGenerationAgentConfig */
export type GeneratorAgentConfig = PageGenerationAgentConfig;
