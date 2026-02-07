/**
 * Page Generation Types
 *
 * Intermediate block format for AI-generated page content.
 * The LLM outputs simplified GeneratedBlock[] JSON, which a
 * deterministic mapper converts to Tiptap JSONContent.
 */

// =============================================================================
// Generated Block Types (LLM Output Format)
// =============================================================================

/**
 * Block types the LLM can produce.
 * Maps 1:1 to Tiptap node types via the block mapper.
 */
export type GeneratedBlockType =
  | 'heading'
  | 'paragraph'
  | 'bulletList'
  | 'orderedList'
  | 'callout'
  | 'divider'
  | 'codeBlock'
  | 'table'
  | 'database'
  | 'taskList'
  | 'blockquote';

/**
 * A single block in the LLM's simplified output format.
 * The block mapper converts these to Tiptap JSONContent.
 */
export interface GeneratedBlock {
  type: GeneratedBlockType;
  /** Heading level (1-3). Only used when type='heading'. */
  level?: 1 | 2 | 3;
  /** Text content with **bold**, *italic*, [N] citations. */
  content?: string;
  /** List items for bulletList/orderedList. */
  items?: string[];
  /** Task items for taskList. */
  tasks?: { text: string; checked: boolean }[];
  /** Table data for type='table'. */
  table?: { headers: string[]; rows: string[][] };
  /** Database spec for type='database'. Creates real Database entity. */
  database?: GeneratedDatabaseSpec;
  /** Callout icon emoji. */
  emoji?: string;
  /** Code block language. */
  language?: string;
  /** RAG citation references used in this block. */
  citations?: number[];
}

/**
 * Specification for a database to be created from LLM output.
 * The database creator helper converts this to real Database + DatabaseEntry records.
 */
export interface GeneratedDatabaseSpec {
  name: string;
  columns: GeneratedColumnSpec[];
  entries: Record<string, unknown>[];
}

/**
 * Column specification for generated databases.
 * Uses the same DatabaseColumnType values as the shared types.
 */
export interface GeneratedColumnSpec {
  name: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'DATE' | 'CHECKBOX' | 'URL' | 'STATUS';
  options?: string[];
}

// =============================================================================
// Page Generation Request / Response
// =============================================================================

/**
 * Request to generate a page with AI.
 */
export interface PageGenerationRequest {
  /** User's prompt describing what to generate. */
  prompt: string;
  /** Optional context to enrich generation with RAG data. */
  context?: {
    dealId?: string;
    companyId?: string;
    documentIds?: string[];
  };
  /** File attachments (PDFs, images) to include as context. */
  attachments?: { url: string; name: string; contentType: string }[];
  /** Organization ID (multi-tenancy). */
  organizationId: string;
  /** User ID of the requester. */
  userId: string;
  /** Target page to insert content into. */
  pageId: string;
  /** Deal ID for database creation context. */
  dealId?: string;
  /** Whether to search the web for additional context. */
  enableWebSearch?: boolean;
}

/**
 * Result of a completed page generation.
 */
export interface PageGenerationResult {
  /** All generated blocks. */
  blocks: GeneratedBlock[];
  /** IDs of databases created during generation. */
  databaseIds: string[];
  /** Generation metadata. */
  metadata: {
    tokensUsed: number;
    sectionsGenerated: number;
    databasesCreated: number;
    processingTimeMs: number;
  };
}

// =============================================================================
// Outline Types (Phase 1 of two-phase LLM strategy)
// =============================================================================

/**
 * Section outline produced by the first LLM call.
 * Used to show skeleton UI while sections are expanded.
 */
export interface OutlineSection {
  title: string;
  description: string;
  blockTypes: GeneratedBlockType[];
}

/**
 * Full outline for a generated page.
 */
export interface PageOutline {
  title: string;
  sections: OutlineSection[];
}

// =============================================================================
// Template Types
// =============================================================================

/**
 * Predefined generation templates for M&A workflows.
 */
export type GenerationTemplate =
  | 'dd-report'
  | 'competitor-analysis'
  | 'market-report'
  | 'company-overview'
  | 'custom';

/**
 * Template metadata for the UI template picker.
 */
export interface GenerationTemplateInfo {
  id: GenerationTemplate;
  name: string;
  description: string;
  icon: string;
  suggestedPrompt: string;
}
