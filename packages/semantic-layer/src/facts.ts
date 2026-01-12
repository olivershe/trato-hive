/**
 * Fact Extraction Service
 *
 * Extracts structured facts from document text using LLM.
 * Stores facts in database with source citations.
 */
import type { PrismaClient, FactType as PrismaFactType } from '@trato-hive/db';
import type {
  ExtractedFact,
  StoredFact,
  ExtractionContext,
  ExtractionResult,
  FactType,
  FactExtractionOutput,
} from './types';
import { FactExtractionOutputSchema } from './types';
import type { KnowledgeGraphService } from './knowledge-graph';

// =============================================================================
// Constants
// =============================================================================

const MIN_CONFIDENCE_THRESHOLD = 0.7;
const MAX_FACTS_PER_CHUNK = 10;

// =============================================================================
// Fact Extraction Prompt
// =============================================================================

const FACT_EXTRACTION_PROMPT = `You are an expert fact extractor for M&A due diligence documents.

Extract structured facts from the following document text. Each fact should be:
- Verifiable and specific (not opinions or vague statements)
- Important for M&A analysis
- Properly categorized by type

Fact Types:
- FINANCIAL_METRIC: Revenue, EBITDA, margins, growth rates, valuations
- KEY_PERSON: Executives, founders, board members with their roles
- PRODUCT: Products, services, technology platforms
- CUSTOMER: Customer names, segments, contract values
- RISK: Legal issues, regulatory concerns, dependencies, threats
- OPPORTUNITY: Growth potential, expansion plans, synergies
- OTHER: Other important facts that don't fit above categories

For each fact, extract:
- type: One of the above types
- subject: The entity the fact is about (company name, person, product)
- predicate: The relationship or attribute (e.g., "has revenue of", "is CEO of", "launched")
- object: The value or target (e.g., "$10M", "John Smith", "2024")
- confidence: 0.0 to 1.0 based on clarity and reliability
- sourceText: The exact quote from the document (max 200 chars)

DOCUMENT TEXT:
{text}

Extract up to 10 most important facts. Return ONLY valid JSON matching this schema:
{
  "facts": [
    {
      "type": "FINANCIAL_METRIC",
      "subject": "Company Name",
      "predicate": "has annual revenue of",
      "object": "$10 million",
      "confidence": 0.95,
      "sourceText": "The company reported annual revenue of $10 million..."
    }
  ]
}`;

// =============================================================================
// Fact Extractor Interface
// =============================================================================

/**
 * Interface for LLM client (from ai-core)
 */
export interface LLMClient {
  generateJSON<T>(
    prompt: string,
    schema: import('zod').ZodSchema<T>,
    options?: { temperature?: number }
  ): Promise<{ data: T; response: { model: string } }>;
}

// =============================================================================
// Fact Extractor Class
// =============================================================================

export class FactExtractor {
  private llmClient: LLMClient | null;
  private db: PrismaClient | null;
  private knowledgeGraph: KnowledgeGraphService | null;

  constructor(options: {
    llmClient?: LLMClient;
    db?: PrismaClient;
    knowledgeGraph?: KnowledgeGraphService;
  } = {}) {
    this.llmClient = options.llmClient || null;
    this.db = options.db || null;
    this.knowledgeGraph = options.knowledgeGraph || null;
  }

  /**
   * Extract facts from text using LLM
   */
  async extractFacts(
    text: string,
    context?: Partial<ExtractionContext>
  ): Promise<ExtractedFact[]> {
    if (!this.llmClient) {
      throw new Error('LLM client not configured. Provide llmClient in constructor.');
    }

    if (!text || text.trim().length === 0) {
      return [];
    }

    const prompt = FACT_EXTRACTION_PROMPT.replace('{text}', text);

    try {
      const { data } = await this.llmClient.generateJSON<FactExtractionOutput>(
        prompt,
        FactExtractionOutputSchema,
        { temperature: 0.1 }
      );

      // Filter by confidence and limit
      return data.facts
        .filter((fact) => fact.confidence >= MIN_CONFIDENCE_THRESHOLD)
        .slice(0, MAX_FACTS_PER_CHUNK)
        .map((fact) => ({
          ...fact,
          pageNumber: context?.pageNumber,
        }));
    } catch (error) {
      console.error('Fact extraction failed:', error);
      return [];
    }
  }

  /**
   * Extract facts from multiple text chunks
   */
  async extractFactsFromChunks(
    chunks: Array<{ content: string; pageNumber?: number }>,
    context: ExtractionContext
  ): Promise<ExtractionResult> {
    const startTime = Date.now();
    const allFacts: ExtractedFact[] = [];

    for (const chunk of chunks) {
      const facts = await this.extractFacts(chunk.content, {
        ...context,
        pageNumber: chunk.pageNumber,
      });
      allFacts.push(...facts);
    }

    // Deduplicate similar facts
    const uniqueFacts = this.deduplicateFacts(allFacts);

    return {
      facts: uniqueFacts,
      documentId: context.documentId,
      totalChunks: chunks.length,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Store extracted facts in database
   * Optionally syncs to knowledge graph if configured
   */
  async storeFacts(
    facts: ExtractedFact[],
    context: ExtractionContext,
    extractedBy: string
  ): Promise<StoredFact[]> {
    if (!this.db) {
      throw new Error('Database client not configured. Provide db in constructor.');
    }

    const storedFacts: StoredFact[] = [];

    for (const fact of facts) {
      const created = await this.db.fact.create({
        data: {
          type: fact.type as PrismaFactType,
          subject: fact.subject,
          predicate: fact.predicate,
          object: fact.object,
          confidence: fact.confidence,
          sourceText: fact.sourceText,
          documentId: context.documentId,
          companyId: context.companyId || null,
          extractedBy,
        },
      });

      const storedFact: StoredFact = {
        ...fact,
        id: created.id,
        documentId: created.documentId,
        companyId: created.companyId,
        extractedBy: created.extractedBy,
        createdAt: created.createdAt,
      };

      storedFacts.push(storedFact);

      // Sync to knowledge graph if configured
      if (this.knowledgeGraph) {
        try {
          await this.knowledgeGraph.upsertFact(
            {
              factId: storedFact.id,
              type: storedFact.type,
              subject: storedFact.subject,
              predicate: storedFact.predicate,
              object: storedFact.object,
              confidence: storedFact.confidence,
              sourceText: storedFact.sourceText,
              organizationId: context.organizationId,
            },
            storedFact.documentId ?? undefined,
            storedFact.companyId ?? undefined
          );
        } catch (error) {
          // Log but don't fail the operation - graph sync is best-effort
          console.error('Failed to sync fact to knowledge graph:', error);
        }
      }
    }

    return storedFacts;
  }

  /**
   * Get facts for a document
   */
  async getFactsByDocument(documentId: string): Promise<StoredFact[]> {
    if (!this.db) {
      throw new Error('Database client not configured. Provide db in constructor.');
    }

    const facts = await this.db.fact.findMany({
      where: { documentId },
      orderBy: { confidence: 'desc' },
    });

    return facts.map((fact: any) => ({
      id: fact.id,
      type: fact.type as FactType,
      subject: fact.subject,
      predicate: fact.predicate,
      object: fact.object,
      confidence: fact.confidence,
      sourceText: fact.sourceText || '',
      pageNumber: undefined,
      documentId: fact.documentId,
      companyId: fact.companyId,
      extractedBy: fact.extractedBy,
      createdAt: fact.createdAt,
    }));
  }

  /**
   * Get facts for a company
   */
  async getFactsByCompany(companyId: string): Promise<StoredFact[]> {
    if (!this.db) {
      throw new Error('Database client not configured. Provide db in constructor.');
    }

    const facts = await this.db.fact.findMany({
      where: { companyId },
      orderBy: { confidence: 'desc' },
    });

    return facts.map((fact: any) => ({
      id: fact.id,
      type: fact.type as FactType,
      subject: fact.subject,
      predicate: fact.predicate,
      object: fact.object,
      confidence: fact.confidence,
      sourceText: fact.sourceText || '',
      pageNumber: undefined,
      documentId: fact.documentId,
      companyId: fact.companyId,
      extractedBy: fact.extractedBy,
      createdAt: fact.createdAt,
    }));
  }

  /**
   * Validate fact meets quality threshold
   */
  validateFact(fact: ExtractedFact): boolean {
    return (
      fact.confidence >= MIN_CONFIDENCE_THRESHOLD &&
      fact.subject.length > 0 &&
      fact.predicate.length > 0 &&
      fact.object.length > 0
    );
  }

  /**
   * Deduplicate facts based on similarity
   */
  private deduplicateFacts(facts: ExtractedFact[]): ExtractedFact[] {
    const seen = new Set<string>();
    const unique: ExtractedFact[] = [];

    for (const fact of facts) {
      // Create a normalized key for comparison
      const key = `${fact.type}:${fact.subject.toLowerCase()}:${fact.predicate.toLowerCase()}:${fact.object.toLowerCase()}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(fact);
      }
    }

    return unique;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a fact extractor instance
 */
export function createFactExtractor(options: {
  llmClient?: LLMClient;
  db?: PrismaClient;
  knowledgeGraph?: KnowledgeGraphService;
} = {}): FactExtractor {
  return new FactExtractor(options);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format fact as human-readable string
 */
export function formatFact(fact: ExtractedFact): string {
  return `${fact.subject} ${fact.predicate} ${fact.object}`;
}

/**
 * Group facts by type
 */
export function groupFactsByType(
  facts: ExtractedFact[]
): Record<FactType, ExtractedFact[]> {
  const groups: Record<FactType, ExtractedFact[]> = {
    FINANCIAL_METRIC: [],
    KEY_PERSON: [],
    PRODUCT: [],
    CUSTOMER: [],
    RISK: [],
    OPPORTUNITY: [],
    OTHER: [],
  };

  for (const fact of facts) {
    groups[fact.type].push(fact);
  }

  return groups;
}

/**
 * Sort facts by confidence (highest first)
 */
export function sortFactsByConfidence(facts: ExtractedFact[]): ExtractedFact[] {
  return [...facts].sort((a, b) => b.confidence - a.confidence);
}
