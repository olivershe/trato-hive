/**
 * Block Mapper — GeneratedBlock[] → Tiptap JSONContent
 *
 * Pure function that converts the LLM's simplified block format
 * into valid Tiptap JSONContent. This is deterministic and testable.
 *
 * Inline formatting:
 *   **bold** → bold mark
 *   *italic* → italic mark
 *   [N] citation markers → inlineCitation mark
 *   `code` → code mark
 */
import type { GeneratedBlock } from './types';

// =============================================================================
// Tiptap JSON Types (subset we produce)
// =============================================================================

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Convert an array of GeneratedBlocks to Tiptap JSONContent.
 * databaseIdMap is keyed by block index for database blocks that have
 * already been created — the mapper injects the real databaseId.
 */
export function mapBlocksToTiptapJSON(
  blocks: GeneratedBlock[],
  databaseIdMap: Record<number, string> = {}
): TiptapNode {
  const content: TiptapNode[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const nodes = mapSingleBlock(block, databaseIdMap[i]);
    content.push(...nodes);
  }

  return {
    type: 'doc',
    content,
  };
}

/**
 * Map a single GeneratedBlock to one or more Tiptap nodes.
 * Exported for incremental insertion during streaming.
 */
export function mapSingleBlock(
  block: GeneratedBlock,
  databaseId?: string
): TiptapNode[] {
  switch (block.type) {
    case 'heading':
      return [mapHeading(block)];
    case 'paragraph':
      return [mapParagraph(block)];
    case 'bulletList':
      return [mapBulletList(block)];
    case 'orderedList':
      return [mapOrderedList(block)];
    case 'taskList':
      return [mapTaskList(block)];
    case 'blockquote':
      return [mapBlockquote(block)];
    case 'callout':
      return mapCallout(block);
    case 'divider':
      return [{ type: 'horizontalRule' }];
    case 'codeBlock':
      return [mapCodeBlock(block)];
    case 'table':
      return [mapTable(block)];
    case 'database':
      return [mapDatabase(databaseId)];
    default:
      return [mapParagraph(block)];
  }
}

// =============================================================================
// Block Mappers
// =============================================================================

function mapHeading(block: GeneratedBlock): TiptapNode {
  return {
    type: 'heading',
    attrs: { level: block.level || 2 },
    content: parseInlineContent(block.content || ''),
  };
}

function mapParagraph(block: GeneratedBlock): TiptapNode {
  const inlineContent = parseInlineContent(block.content || '');
  return {
    type: 'paragraph',
    content: inlineContent.length > 0 ? inlineContent : undefined,
  };
}

function mapBulletList(block: GeneratedBlock): TiptapNode {
  const items = block.items || [];
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: parseInlineContent(item),
        },
      ],
    })),
  };
}

function mapOrderedList(block: GeneratedBlock): TiptapNode {
  const items = block.items || [];
  return {
    type: 'orderedList',
    attrs: { start: 1 },
    content: items.map((item) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: parseInlineContent(item),
        },
      ],
    })),
  };
}

function mapTaskList(block: GeneratedBlock): TiptapNode {
  const tasks = block.tasks || [];
  return {
    type: 'taskList',
    content: tasks.map((task) => ({
      type: 'taskItem',
      attrs: { checked: task.checked },
      content: [
        {
          type: 'paragraph',
          content: parseInlineContent(task.text),
        },
      ],
    })),
  };
}

function mapBlockquote(block: GeneratedBlock): TiptapNode {
  return {
    type: 'blockquote',
    content: [
      {
        type: 'paragraph',
        content: parseInlineContent(block.content || ''),
      },
    ],
  };
}

/**
 * Callout maps to a blockquote with an emoji prefix.
 * Since Tiptap StarterKit doesn't have a native callout node,
 * we represent it as a blockquote with the emoji inline.
 */
function mapCallout(block: GeneratedBlock): TiptapNode[] {
  const emoji = block.emoji || 'ℹ️';
  const text = block.content || '';
  return [
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: `${emoji} ` },
            ...parseInlineContent(text),
          ],
        },
      ],
    },
  ];
}

function mapCodeBlock(block: GeneratedBlock): TiptapNode {
  return {
    type: 'codeBlock',
    attrs: { language: block.language || null },
    content: block.content ? [{ type: 'text', text: block.content }] : undefined,
  };
}

function mapTable(block: GeneratedBlock): TiptapNode {
  const tableData = block.table;
  if (!tableData) {
    return { type: 'paragraph' };
  }

  const headerRow: TiptapNode = {
    type: 'tableRow',
    content: tableData.headers.map((header) => ({
      type: 'tableHeader',
      attrs: { colspan: 1, rowspan: 1 },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: header }],
        },
      ],
    })),
  };

  const bodyRows: TiptapNode[] = tableData.rows.map((row) => ({
    type: 'tableRow',
    content: row.map((cell) => ({
      type: 'tableCell',
      attrs: { colspan: 1, rowspan: 1 },
      content: [
        {
          type: 'paragraph',
          content: cell ? parseInlineContent(cell) : undefined,
        },
      ],
    })),
  }));

  return {
    type: 'table',
    content: [headerRow, ...bodyRows],
  };
}

function mapDatabase(databaseId?: string): TiptapNode {
  return {
    type: 'databaseViewBlock',
    attrs: {
      databaseId: databaseId || null,
      viewType: 'table',
      filters: [],
      sortBy: null,
      groupBy: null,
      hiddenColumns: [],
    },
  };
}

// =============================================================================
// Inline Content Parser
// =============================================================================

/**
 * Segment types produced by the inline parser.
 */
interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  citation?: number;
}

/**
 * Parse a string with inline formatting into Tiptap text nodes.
 *
 * Supported syntax:
 *   **bold text**
 *   *italic text*
 *   `code`
 *   [N] citation marker (N = number)
 */
export function parseInlineContent(text: string): TiptapNode[] {
  if (!text) return [];

  const segments = tokenize(text);
  return segments.map(segmentToNode);
}

/**
 * Tokenize inline markdown into segments.
 *
 * This uses a simple regex-based approach that handles:
 * - **bold**
 * - *italic* (but not ** which is bold)
 * - `code`
 * - [N] citations
 * - plain text
 */
function tokenize(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match inline patterns in order of specificity
  const regex = /(\*\*(.+?)\*\*)|(\*([^*]+?)\*)|(`([^`]+?)`)|(\[(\d+)\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push plain text before this match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      // **bold**
      segments.push({ text: match[2], bold: true });
    } else if (match[3]) {
      // *italic*
      segments.push({ text: match[4], italic: true });
    } else if (match[5]) {
      // `code`
      segments.push({ text: match[6], code: true });
    } else if (match[7]) {
      // [N] citation
      const citationIndex = parseInt(match[8], 10);
      segments.push({ text: match[7], citation: citationIndex });
    }

    lastIndex = match.index + match[0].length;
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments;
}

function segmentToNode(segment: TextSegment): TiptapNode {
  const marks: TiptapMark[] = [];

  if (segment.bold) {
    marks.push({ type: 'bold' });
  }
  if (segment.italic) {
    marks.push({ type: 'italic' });
  }
  if (segment.code) {
    marks.push({ type: 'code' });
  }
  if (segment.citation !== undefined) {
    marks.push({
      type: 'inlineCitation',
      attrs: {
        citationIndex: segment.citation,
        factId: null,
        documentId: null,
        chunkId: null,
        sourceText: '',
      },
    });
  }

  const node: TiptapNode = { type: 'text', text: segment.text };
  if (marks.length > 0) {
    node.marks = marks;
  }
  return node;
}
