import { describe, it, expect } from 'vitest';
import {
  mapBlocksToTiptapJSON,
  mapSingleBlock,
  parseInlineContent,
} from '../block-mapper';
import type { GeneratedBlock } from '../types';

describe('block-mapper', () => {
  describe('mapBlocksToTiptapJSON', () => {
    it('wraps blocks in a doc node', () => {
      const result = mapBlocksToTiptapJSON([]);
      expect(result.type).toBe('doc');
      expect(result.content).toEqual([]);
    });

    it('maps multiple blocks into doc content', () => {
      const blocks: GeneratedBlock[] = [
        { type: 'heading', level: 1, content: 'Title' },
        { type: 'paragraph', content: 'Body text' },
      ];
      const result = mapBlocksToTiptapJSON(blocks);
      expect(result.content).toHaveLength(2);
      expect(result.content![0].type).toBe('heading');
      expect(result.content![1].type).toBe('paragraph');
    });
  });

  describe('heading', () => {
    it('maps heading with level', () => {
      const [node] = mapSingleBlock({ type: 'heading', level: 1, content: 'Hello' });
      expect(node.type).toBe('heading');
      expect(node.attrs?.level).toBe(1);
      expect(node.content).toHaveLength(1);
      expect(node.content![0].text).toBe('Hello');
    });

    it('defaults to level 2', () => {
      const [node] = mapSingleBlock({ type: 'heading', content: 'Sub' });
      expect(node.attrs?.level).toBe(2);
    });

    it('handles level 3', () => {
      const [node] = mapSingleBlock({ type: 'heading', level: 3, content: 'Sub Sub' });
      expect(node.attrs?.level).toBe(3);
    });
  });

  describe('paragraph', () => {
    it('maps plain paragraph', () => {
      const [node] = mapSingleBlock({ type: 'paragraph', content: 'Some text' });
      expect(node.type).toBe('paragraph');
      expect(node.content).toHaveLength(1);
      expect(node.content![0].text).toBe('Some text');
    });

    it('handles empty content', () => {
      const [node] = mapSingleBlock({ type: 'paragraph' });
      expect(node.type).toBe('paragraph');
      expect(node.content).toBeUndefined();
    });

    it('parses bold text', () => {
      const [node] = mapSingleBlock({ type: 'paragraph', content: 'Hello **world**' });
      expect(node.content).toHaveLength(2);
      expect(node.content![0].text).toBe('Hello ');
      expect(node.content![1].text).toBe('world');
      expect(node.content![1].marks).toEqual([{ type: 'bold' }]);
    });

    it('parses italic text', () => {
      const [node] = mapSingleBlock({ type: 'paragraph', content: 'Hello *world*' });
      expect(node.content).toHaveLength(2);
      expect(node.content![1].text).toBe('world');
      expect(node.content![1].marks).toEqual([{ type: 'italic' }]);
    });

    it('parses code text', () => {
      const [node] = mapSingleBlock({ type: 'paragraph', content: 'Use `forEach`' });
      expect(node.content).toHaveLength(2);
      expect(node.content![1].text).toBe('forEach');
      expect(node.content![1].marks).toEqual([{ type: 'code' }]);
    });

    it('parses citation markers', () => {
      const [node] = mapSingleBlock({ type: 'paragraph', content: 'Revenue grew 20% [1]' });
      expect(node.content).toHaveLength(2);
      expect(node.content![1].text).toBe('[1]');
      expect(node.content![1].marks![0].type).toBe('inlineCitation');
      expect(node.content![1].marks![0].attrs?.citationIndex).toBe(1);
    });
  });

  describe('bulletList', () => {
    it('maps bullet list items', () => {
      const [node] = mapSingleBlock({
        type: 'bulletList',
        items: ['Alpha', 'Beta', 'Gamma'],
      });
      expect(node.type).toBe('bulletList');
      expect(node.content).toHaveLength(3);
      expect(node.content![0].type).toBe('listItem');
      expect(node.content![0].content![0].type).toBe('paragraph');
      expect(node.content![0].content![0].content![0].text).toBe('Alpha');
    });

    it('handles empty items array', () => {
      const [node] = mapSingleBlock({ type: 'bulletList', items: [] });
      expect(node.type).toBe('bulletList');
      expect(node.content).toHaveLength(0);
    });

    it('parses inline formatting in items', () => {
      const [node] = mapSingleBlock({
        type: 'bulletList',
        items: ['**Bold item**'],
      });
      const paragraph = node.content![0].content![0];
      expect(paragraph.content![0].marks).toEqual([{ type: 'bold' }]);
    });
  });

  describe('orderedList', () => {
    it('maps ordered list with start attr', () => {
      const [node] = mapSingleBlock({
        type: 'orderedList',
        items: ['First', 'Second'],
      });
      expect(node.type).toBe('orderedList');
      expect(node.attrs?.start).toBe(1);
      expect(node.content).toHaveLength(2);
    });
  });

  describe('taskList', () => {
    it('maps task list with checked state', () => {
      const [node] = mapSingleBlock({
        type: 'taskList',
        tasks: [
          { text: 'Done task', checked: true },
          { text: 'Open task', checked: false },
        ],
      });
      expect(node.type).toBe('taskList');
      expect(node.content).toHaveLength(2);
      expect(node.content![0].type).toBe('taskItem');
      expect(node.content![0].attrs?.checked).toBe(true);
      expect(node.content![1].attrs?.checked).toBe(false);
    });
  });

  describe('blockquote', () => {
    it('maps blockquote with paragraph content', () => {
      const [node] = mapSingleBlock({ type: 'blockquote', content: 'A wise quote' });
      expect(node.type).toBe('blockquote');
      expect(node.content![0].type).toBe('paragraph');
      expect(node.content![0].content![0].text).toBe('A wise quote');
    });
  });

  describe('callout', () => {
    it('maps callout as blockquote with emoji', () => {
      const nodes = mapSingleBlock({
        type: 'callout',
        content: 'Important note',
        emoji: '⚠️',
      });
      expect(nodes).toHaveLength(1);
      const node = nodes[0];
      expect(node.type).toBe('blockquote');
      // First text node is emoji
      expect(node.content![0].content![0].text).toBe('⚠️ ');
      expect(node.content![0].content![1].text).toBe('Important note');
    });

    it('defaults to info emoji', () => {
      const nodes = mapSingleBlock({ type: 'callout', content: 'Note' });
      expect(nodes[0].content![0].content![0].text).toBe('ℹ️ ');
    });
  });

  describe('divider', () => {
    it('maps to horizontalRule', () => {
      const [node] = mapSingleBlock({ type: 'divider' });
      expect(node.type).toBe('horizontalRule');
    });
  });

  describe('codeBlock', () => {
    it('maps code block with language', () => {
      const [node] = mapSingleBlock({
        type: 'codeBlock',
        content: 'const x = 1;',
        language: 'typescript',
      });
      expect(node.type).toBe('codeBlock');
      expect(node.attrs?.language).toBe('typescript');
      expect(node.content![0].text).toBe('const x = 1;');
    });

    it('handles no language', () => {
      const [node] = mapSingleBlock({ type: 'codeBlock', content: 'hello' });
      expect(node.attrs?.language).toBeNull();
    });
  });

  describe('table', () => {
    it('maps table with headers and rows', () => {
      const [node] = mapSingleBlock({
        type: 'table',
        table: {
          headers: ['Name', 'Value'],
          rows: [
            ['Revenue', '$10M'],
            ['EBITDA', '$2M'],
          ],
        },
      });
      expect(node.type).toBe('table');
      expect(node.content).toHaveLength(3); // 1 header row + 2 body rows

      // Header row
      const headerRow = node.content![0];
      expect(headerRow.type).toBe('tableRow');
      expect(headerRow.content![0].type).toBe('tableHeader');
      expect(headerRow.content![0].content![0].content![0].text).toBe('Name');

      // Body row
      const bodyRow = node.content![1];
      expect(bodyRow.type).toBe('tableRow');
      expect(bodyRow.content![0].type).toBe('tableCell');
      expect(bodyRow.content![0].content![0].content![0].text).toBe('Revenue');
    });

    it('returns paragraph for missing table data', () => {
      const [node] = mapSingleBlock({ type: 'table' });
      expect(node.type).toBe('paragraph');
    });
  });

  describe('database', () => {
    it('maps database block with null databaseId', () => {
      const [node] = mapSingleBlock({
        type: 'database',
        database: {
          name: 'Risk Register',
          columns: [{ name: 'Risk', type: 'TEXT' }],
          entries: [{ Risk: 'Market risk' }],
        },
      });
      expect(node.type).toBe('databaseViewBlock');
      expect(node.attrs?.databaseId).toBeNull();
      expect(node.attrs?.viewType).toBe('table');
    });

    it('injects databaseId when provided', () => {
      const [node] = mapSingleBlock(
        {
          type: 'database',
          database: {
            name: 'Test DB',
            columns: [],
            entries: [],
          },
        },
        'db_12345'
      );
      expect(node.attrs?.databaseId).toBe('db_12345');
    });

    it('injects databaseId via mapBlocksToTiptapJSON', () => {
      const result = mapBlocksToTiptapJSON(
        [
          { type: 'heading', level: 1, content: 'Report' },
          {
            type: 'database',
            database: { name: 'DB', columns: [], entries: [] },
          },
        ],
        { 1: 'db_injected' }
      );
      const dbNode = result.content![1];
      expect(dbNode.attrs?.databaseId).toBe('db_injected');
    });
  });

  describe('parseInlineContent', () => {
    it('returns empty array for empty string', () => {
      expect(parseInlineContent('')).toEqual([]);
    });

    it('parses plain text', () => {
      const result = parseInlineContent('Hello world');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Hello world');
      expect(result[0].marks).toBeUndefined();
    });

    it('parses mixed inline formatting', () => {
      const result = parseInlineContent('**Bold** and *italic* with [1]');
      expect(result).toHaveLength(5);
      expect(result[0].text).toBe('Bold');
      expect(result[0].marks).toEqual([{ type: 'bold' }]);
      expect(result[1].text).toBe(' and ');
      expect(result[2].text).toBe('italic');
      expect(result[2].marks).toEqual([{ type: 'italic' }]);
      expect(result[3].text).toBe(' with ');
      expect(result[4].text).toBe('[1]');
      expect(result[4].marks![0].type).toBe('inlineCitation');
    });

    it('handles multiple citations', () => {
      const result = parseInlineContent('Fact [1] and fact [2]');
      expect(result).toHaveLength(4);
      expect(result[1].marks![0].attrs?.citationIndex).toBe(1);
      expect(result[3].marks![0].attrs?.citationIndex).toBe(2);
    });

    it('handles double-digit citations', () => {
      const result = parseInlineContent('See [12]');
      expect(result[1].marks![0].attrs?.citationIndex).toBe(12);
    });
  });

  describe('unknown block type fallback', () => {
    it('falls back to paragraph for unknown types', () => {
      const [node] = mapSingleBlock({
        type: 'unknown_type' as any,
        content: 'Fallback text',
      });
      expect(node.type).toBe('paragraph');
      expect(node.content![0].text).toBe('Fallback text');
    });
  });
});
