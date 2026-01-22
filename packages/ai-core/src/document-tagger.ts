/**
 * Document Tagger Service
 *
 * AI-powered document classification and tagging for the Document Vault.
 * Uses LLM to analyze document content and apply relevant tags.
 */
import { z } from 'zod';
import { LLMClient, createClaudeClient } from './llm';
import type { LLMGenerateOptions } from './types';

// =============================================================================
// Tag Categories
// =============================================================================

/**
 * Document Type Categories (mutually exclusive)
 */
export const DOCUMENT_TYPES = [
  'financial_statement',
  'merger_agreement',
  'due_diligence_report',
  'letter_of_intent',
  'nda_confidentiality',
  'board_resolution',
  'legal_contract',
  'technical_document',
  'presentation_deck',
  'corporate_filing',
  'valuation_report',
  'other',
] as const;

export type DocumentTypeTag = (typeof DOCUMENT_TYPES)[number];

/**
 * Industry Categories
 */
export const INDUSTRIES = [
  'technology',
  'healthcare',
  'energy',
  'financial_services',
  'consumer',
  'industrial',
  'real_estate',
  'media_entertainment',
  'telecommunications',
  'transportation',
  'other',
] as const;

export type IndustryTag = (typeof INDUSTRIES)[number];

/**
 * Content Tags (can have multiple)
 */
export const CONTENT_TAGS = [
  'confidential',
  'draft',
  'final',
  'needs_review',
  'executive_summary',
  'appendix',
  'audited',
  'unaudited',
  'sensitive',
  'historical',
  'projected',
] as const;

export type ContentTag = (typeof CONTENT_TAGS)[number];

// =============================================================================
// Output Schemas
// =============================================================================

/**
 * Complete document tags output
 */
export const documentTagsSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES),
  documentTypeConfidence: z.number().min(0).max(1),
  industry: z.enum(INDUSTRIES),
  industryConfidence: z.number().min(0).max(1),
  contentTags: z.array(z.enum(CONTENT_TAGS)),
  contentTagsConfidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

export type DocumentTags = z.infer<typeof documentTagsSchema>;

/**
 * Tagging result with metadata
 */
export interface TaggingResult {
  tags: DocumentTags;
  overallConfidence: number;
  model: string;
  latencyMs: number;
  cost: number;
}

// =============================================================================
// Document Tagger Service
// =============================================================================

export class DocumentTaggerService {
  private client: LLMClient;

  constructor(client?: LLMClient) {
    // Use provided client or create default Claude client
    this.client =
      client ||
      createClaudeClient(
        process.env.ANTHROPIC_API_KEY || '',
        'claude-3-haiku-20240307' // Use Haiku for cost-effective tagging
      );
  }

  /**
   * Tag a document based on its content
   *
   * @param content - Document text content (typically first few pages)
   * @param filename - Original filename for additional context
   * @param dealIndustry - Optional industry context from the deal
   * @returns Tagging result with all applied tags and confidence scores
   */
  async tagDocument(
    content: string,
    filename: string,
    dealIndustry?: string
  ): Promise<TaggingResult> {
    // Truncate content to first ~8000 chars (roughly 2000 tokens) for efficiency
    const truncatedContent = content.slice(0, 8000);

    const systemPrompt = `You are a document classification expert for M&A (mergers and acquisitions) transactions.
Your task is to analyze documents and apply accurate tags for organization in a document vault.

You must classify documents into exactly one document type, one industry, and zero or more content tags.
Provide confidence scores (0-1) for each classification based on how certain you are.

Document Types:
- financial_statement: Income statements, balance sheets, cash flow statements
- merger_agreement: Merger/acquisition agreements, definitive agreements
- due_diligence_report: DD reports, investigation findings
- letter_of_intent: LOIs, term sheets, preliminary agreements
- nda_confidentiality: NDAs, confidentiality agreements
- board_resolution: Board resolutions, meeting minutes with formal approvals
- legal_contract: General contracts, employment agreements, vendor agreements
- technical_document: Technical specifications, system documentation, IP documents
- presentation_deck: Pitch decks, investor presentations, management presentations
- corporate_filing: SEC filings, annual reports, regulatory documents
- valuation_report: Valuation analyses, fairness opinions
- other: Documents that don't fit other categories

Industries:
- technology: Software, hardware, IT services, semiconductors
- healthcare: Pharma, biotech, medical devices, healthcare services
- energy: Oil & gas, utilities, renewable energy
- financial_services: Banks, insurance, asset management
- consumer: Retail, consumer goods, food & beverage
- industrial: Manufacturing, aerospace, chemicals
- real_estate: REITs, property development
- media_entertainment: Media, gaming, entertainment
- telecommunications: Telecom, network services
- transportation: Airlines, logistics, shipping
- other: Industries not listed above

Content Tags (apply all that apply):
- confidential: Document marked or appears to be confidential
- draft: Document is marked as draft or appears preliminary
- final: Document is marked as final or executed
- needs_review: Document appears incomplete or has issues
- executive_summary: Contains executive summary or overview
- appendix: Is an appendix or supplementary material
- audited: Financial statements that have been audited
- unaudited: Financial statements that are unaudited
- sensitive: Contains sensitive information (PII, trade secrets)
- historical: Contains historical/past data
- projected: Contains projections/forecasts

Respond with a JSON object matching this structure:
{
  "documentType": "one of the document types",
  "documentTypeConfidence": 0.0-1.0,
  "industry": "one of the industries",
  "industryConfidence": 0.0-1.0,
  "contentTags": ["array", "of", "applicable", "tags"],
  "contentTagsConfidence": 0.0-1.0,
  "reasoning": "brief explanation of your classification"
}`;

    const userPrompt = `Classify this document:

Filename: ${filename}
${dealIndustry ? `Deal Industry Context: ${dealIndustry}` : ''}

Document Content:
---
${truncatedContent}
---

Analyze the document and provide classification tags as JSON.`;

    const options: LLMGenerateOptions = {
      systemPrompt,
      maxTokens: 500,
      temperature: 0.1, // Low temperature for consistent classification
    };

    const { data, response } = await this.client.generateJSON(
      userPrompt,
      documentTagsSchema,
      options
    );

    // Calculate overall confidence as weighted average
    const overallConfidence =
      data.documentTypeConfidence * 0.4 +
      data.industryConfidence * 0.3 +
      data.contentTagsConfidence * 0.3;

    return {
      tags: data,
      overallConfidence,
      model: response.model,
      latencyMs: response.latencyMs,
      cost: response.cost,
    };
  }

  /**
   * Classify just the document type
   */
  async classifyDocumentType(
    content: string,
    filename: string
  ): Promise<{ type: DocumentTypeTag; confidence: number }> {
    const result = await this.tagDocument(content, filename);
    return {
      type: result.tags.documentType,
      confidence: result.tags.documentTypeConfidence,
    };
  }

  /**
   * Detect just the industry
   */
  async detectIndustry(
    content: string,
    dealIndustry?: string
  ): Promise<{ industry: IndustryTag; confidence: number }> {
    const result = await this.tagDocument(content, 'document', dealIndustry);
    return {
      industry: result.tags.industry,
      confidence: result.tags.industryConfidence,
    };
  }

  /**
   * Extract just content tags
   */
  async extractContentTags(
    content: string,
    filename: string
  ): Promise<{ tags: ContentTag[]; confidence: number }> {
    const result = await this.tagDocument(content, filename);
    return {
      tags: result.tags.contentTags,
      confidence: result.tags.contentTagsConfidence,
    };
  }

  /**
   * Quick tag based on filename only (for fast initial tagging)
   * Uses pattern matching without LLM for instant results
   */
  quickTagFromFilename(filename: string): Partial<DocumentTags> {
    const lower = filename.toLowerCase();
    const tags: Partial<DocumentTags> = {};

    // Document type detection from filename patterns
    if (/nda|confidential.*agreement|non.*disclosure/i.test(lower)) {
      tags.documentType = 'nda_confidentiality';
    } else if (/loi|letter.*of.*intent|term.*sheet/i.test(lower)) {
      tags.documentType = 'letter_of_intent';
    } else if (/merger.*agreement|acquisition.*agreement|definitive/i.test(lower)) {
      tags.documentType = 'merger_agreement';
    } else if (/financial|income|balance.*sheet|cash.*flow|p&l/i.test(lower)) {
      tags.documentType = 'financial_statement';
    } else if (/due.*diligence|dd.*report/i.test(lower)) {
      tags.documentType = 'due_diligence_report';
    } else if (/board.*resolution|minutes/i.test(lower)) {
      tags.documentType = 'board_resolution';
    } else if (/valuation|fairness.*opinion/i.test(lower)) {
      tags.documentType = 'valuation_report';
    } else if (/presentation|deck|pitch/i.test(lower)) {
      tags.documentType = 'presentation_deck';
    } else if (/10-k|10-q|sec.*filing|annual.*report/i.test(lower)) {
      tags.documentType = 'corporate_filing';
    } else if (/contract|agreement/i.test(lower)) {
      tags.documentType = 'legal_contract';
    } else if (/technical|specification|architecture/i.test(lower)) {
      tags.documentType = 'technical_document';
    }

    // Content tags from filename
    const contentTags: ContentTag[] = [];
    if (/confidential/i.test(lower)) contentTags.push('confidential');
    if (/draft/i.test(lower)) contentTags.push('draft');
    if (/final|executed|signed/i.test(lower)) contentTags.push('final');
    if (/exec.*summary|overview/i.test(lower)) contentTags.push('executive_summary');
    if (/appendix|exhibit|attachment/i.test(lower)) contentTags.push('appendix');
    if (/audited/i.test(lower)) contentTags.push('audited');
    if (/unaudited/i.test(lower)) contentTags.push('unaudited');
    if (/projection|forecast|pro.*forma/i.test(lower)) contentTags.push('projected');
    if (/historical|ytd|year.*to.*date/i.test(lower)) contentTags.push('historical');

    if (contentTags.length > 0) {
      tags.contentTags = contentTags;
    }

    return tags;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a document tagger with default configuration
 */
export function createDocumentTagger(apiKey?: string): DocumentTaggerService {
  const key = apiKey || process.env.ANTHROPIC_API_KEY || '';
  const client = createClaudeClient(key, 'claude-3-haiku-20240307');
  return new DocumentTaggerService(client);
}
