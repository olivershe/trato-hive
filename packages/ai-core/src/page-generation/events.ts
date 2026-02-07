/**
 * Page Generation Streaming Events
 *
 * Event protocol for streaming page generation progress
 * from the API to the frontend via polling.
 */
import type { GeneratedBlock, GeneratedBlockType } from './types';

// =============================================================================
// Event Types
// =============================================================================

/** Outline generated — frontend can show skeleton UI. */
export interface OutlineEvent {
  type: 'outline';
  sections: { title: string; blockTypes: GeneratedBlockType[] }[];
}

/** A new section has started expanding. */
export interface SectionStartEvent {
  type: 'section_start';
  index: number;
  title: string;
}

/** A single block has been generated within a section. */
export interface BlockEvent {
  type: 'block';
  block: GeneratedBlock;
  sectionIndex: number;
}

/** A database has been created from a database block. */
export interface DatabaseCreatedEvent {
  type: 'database_created';
  databaseId: string;
  name: string;
  blockIndex: number;
}

/** A section has finished expanding. */
export interface SectionCompleteEvent {
  type: 'section_complete';
  index: number;
}

/** Generation is complete. */
export interface CompleteEvent {
  type: 'complete';
  metadata: {
    tokensUsed: number;
    sectionsGenerated: number;
    databasesCreated: number;
  };
}

/** An error occurred during generation. */
export interface ErrorEvent {
  type: 'error';
  message: string;
}

// =============================================================================
// Token-Level Streaming Events (TASK-136)
// =============================================================================

/** A new text block has started streaming. Insert an empty node. */
export interface BlockStartEvent {
  type: 'block_start';
  blockType: GeneratedBlockType;
  blockIndex: number;
  sectionIndex: number;
  attrs?: { level?: number };
}

/** A chunk of plain text for the current streaming block. */
export interface ContentDeltaEvent {
  type: 'content_delta';
  text: string;
  blockIndex: number;
}

/** A text block has finished streaming. Full block available for formatting. */
export interface BlockEndEvent {
  type: 'block_end';
  block: GeneratedBlock;
  blockIndex: number;
  sectionIndex: number;
}

/**
 * Union of all page generation events.
 * Used for the polling-based streaming protocol.
 */
export type PageGenerationEvent =
  | OutlineEvent
  | SectionStartEvent
  | BlockEvent
  | BlockStartEvent
  | ContentDeltaEvent
  | BlockEndEvent
  | DatabaseCreatedEvent
  | SectionCompleteEvent
  | CompleteEvent
  | ErrorEvent;
