import { describe, it, expect } from 'vitest';
import { IncrementalBlockStreamer } from './block-streamer';

function collectEvents(streamer: IncrementalBlockStreamer) {
  return [...streamer.flush()];
}

describe('IncrementalBlockStreamer', () => {
  // =========================================================================
  // Simple paragraph streaming
  // =========================================================================

  it('streams a simple paragraph block', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    // Feed the complete JSON array with a paragraph
    streamer.feed('[{"type": "paragraph", "content": "Hello world"}]');
    const events = collectEvents(streamer);

    expect(events.length).toBeGreaterThanOrEqual(3);

    // First event: block_start
    expect(events[0]).toEqual({
      type: 'block_start',
      blockType: 'paragraph',
      blockIndex: 0,
      sectionIndex: 0,
      attrs: undefined,
    });

    // Middle events: content_delta(s)
    const deltas = events.filter((e) => e.type === 'content_delta');
    const fullText = deltas.map((e) => (e as { text: string }).text).join('');
    expect(fullText).toBe('Hello world');

    // Last event: block_end
    const lastEvent = events[events.length - 1];
    expect(lastEvent.type).toBe('block_end');
    expect((lastEvent as { block: { type: string; content: string } }).block).toEqual({
      type: 'paragraph',
      content: 'Hello world',
    });
  });

  // =========================================================================
  // Heading with level
  // =========================================================================

  it('streams a heading block with level attribute', () => {
    const streamer = new IncrementalBlockStreamer(1, 5);

    streamer.feed('[{"type": "heading", "level": 2, "content": "Section Title"}]');
    const events = collectEvents(streamer);

    const blockStart = events.find((e) => e.type === 'block_start');
    expect(blockStart).toBeDefined();
    expect((blockStart as { blockType: string }).blockType).toBe('heading');
    expect((blockStart as { blockIndex: number }).blockIndex).toBe(5);
    expect((blockStart as { sectionIndex: number }).sectionIndex).toBe(1);

    const blockEnd = events.find((e) => e.type === 'block_end');
    expect(blockEnd).toBeDefined();
    expect((blockEnd as { block: { level: number } }).block.level).toBe(2);
  });

  // =========================================================================
  // Database block → complete block event (no streaming)
  // =========================================================================

  it('emits database blocks as complete block events', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    const dbBlock = {
      type: 'database',
      database: {
        name: 'Competitors',
        columns: [{ name: 'Company', type: 'TEXT' }],
        entries: [{ Company: 'Acme' }],
      },
    };

    streamer.feed(`[${JSON.stringify(dbBlock)}]`);
    const events = collectEvents(streamer);

    // Should be a single complete 'block' event (no streaming)
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('block');
    expect((events[0] as { block: { type: string } }).block.type).toBe('database');
  });

  // =========================================================================
  // Table block → complete block event
  // =========================================================================

  it('emits table blocks as complete block events', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    const tableBlock = {
      type: 'table',
      table: {
        headers: ['Name', 'Value'],
        rows: [['Revenue', '$1M']],
      },
    };

    streamer.feed(`[${JSON.stringify(tableBlock)}]`);
    const events = collectEvents(streamer);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('block');
  });

  // =========================================================================
  // Escaped quotes in content
  // =========================================================================

  it('handles escaped quotes in content', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    // JSON with escaped quote: content is: He said "hello"
    streamer.feed('[{"type": "paragraph", "content": "He said \\"hello\\""}]');
    const events = collectEvents(streamer);

    const deltas = events.filter((e) => e.type === 'content_delta');
    const fullText = deltas.map((e) => (e as { text: string }).text).join('');
    expect(fullText).toBe('He said "hello"');

    const blockEnd = events.find((e) => e.type === 'block_end');
    expect((blockEnd as { block: { content: string } }).block.content).toBe('He said "hello"');
  });

  // =========================================================================
  // Partial JSON across multiple feed() calls
  // =========================================================================

  it('handles partial JSON across multiple feed() calls', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    // Feed in small chunks simulating token-by-token streaming
    streamer.feed('[{"type');
    expect(collectEvents(streamer)).toEqual([]);

    streamer.feed('": "paragraph"');
    // block_start may be emitted now
    const events1 = collectEvents(streamer);
    const hasStart = events1.some((e) => e.type === 'block_start');
    expect(hasStart).toBe(true);

    streamer.feed(', "content": "Hel');
    const events2 = collectEvents(streamer);
    const deltas2 = events2.filter((e) => e.type === 'content_delta');
    expect(deltas2.length).toBeGreaterThan(0);

    streamer.feed('lo"}]');
    const events3 = collectEvents(streamer);
    const hasEnd = events3.some((e) => e.type === 'block_end');
    expect(hasEnd).toBe(true);
  });

  // =========================================================================
  // Mixed text + database blocks
  // =========================================================================

  it('handles mixed text and database blocks in one section', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    const json = JSON.stringify([
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: 'Some text here.' },
      {
        type: 'database',
        database: {
          name: 'KPIs',
          columns: [{ name: 'Metric', type: 'TEXT' }],
          entries: [],
        },
      },
    ]);

    streamer.feed(json);
    const events = collectEvents(streamer);

    // Heading: block_start + deltas + block_end
    const headingStart = events.find(
      (e) => e.type === 'block_start' && (e as { blockType: string }).blockType === 'heading'
    );
    expect(headingStart).toBeDefined();

    // Paragraph: block_start + deltas + block_end
    const paraStart = events.find(
      (e) => e.type === 'block_start' && (e as { blockType: string }).blockType === 'paragraph'
    );
    expect(paraStart).toBeDefined();

    // Database: single complete block event
    const dbBlock = events.find(
      (e) => e.type === 'block' && (e as { block: { type: string } }).block.type === 'database'
    );
    expect(dbBlock).toBeDefined();
  });

  // =========================================================================
  // Block index tracking
  // =========================================================================

  it('correctly increments block indices', () => {
    const streamer = new IncrementalBlockStreamer(2, 10);

    const json = JSON.stringify([
      { type: 'paragraph', content: 'First' },
      { type: 'paragraph', content: 'Second' },
    ]);

    streamer.feed(json);
    const events = collectEvents(streamer);

    const starts = events.filter((e) => e.type === 'block_start');
    expect((starts[0] as { blockIndex: number }).blockIndex).toBe(10);
    expect((starts[1] as { blockIndex: number }).blockIndex).toBe(11);

    const ends = events.filter((e) => e.type === 'block_end');
    expect((ends[0] as { blockIndex: number }).blockIndex).toBe(10);
    expect((ends[1] as { blockIndex: number }).blockIndex).toBe(11);
  });

  // =========================================================================
  // Callout block streaming
  // =========================================================================

  it('streams callout blocks (streamable type)', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    streamer.feed('[{"type": "callout", "content": "Important note", "emoji": "⚠️"}]');
    const events = collectEvents(streamer);

    const blockStart = events.find((e) => e.type === 'block_start');
    expect(blockStart).toBeDefined();
    expect((blockStart as { blockType: string }).blockType).toBe('callout');

    const blockEnd = events.find((e) => e.type === 'block_end');
    expect(blockEnd).toBeDefined();
    expect((blockEnd as { block: { emoji: string } }).block.emoji).toBe('⚠️');
  });

  // =========================================================================
  // List blocks → synthetic streaming (block_start + content_delta + block_end)
  // =========================================================================

  it('emits bulletList with synthetic streaming events', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    const listBlock = {
      type: 'bulletList',
      items: ['Item 1', 'Item 2', 'Item 3'],
    };

    streamer.feed(`[${JSON.stringify(listBlock)}]`);
    const events = collectEvents(streamer);

    expect(events.length).toBe(3);

    expect(events[0]).toEqual({
      type: 'block_start',
      blockType: 'bulletList',
      blockIndex: 0,
      sectionIndex: 0,
    });

    expect(events[1]).toEqual({
      type: 'content_delta',
      text: '- Item 1\n- Item 2\n- Item 3',
      blockIndex: 0,
    });

    expect(events[2].type).toBe('block_end');
    expect((events[2] as { block: { items: string[] } }).block.items).toEqual([
      'Item 1',
      'Item 2',
      'Item 3',
    ]);
  });

  it('emits orderedList with synthetic streaming events', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    const listBlock = {
      type: 'orderedList',
      items: ['First', 'Second', 'Third'],
    };

    streamer.feed(`[${JSON.stringify(listBlock)}]`);
    const events = collectEvents(streamer);

    expect(events.length).toBe(3);
    expect(events[0]).toEqual({
      type: 'block_start',
      blockType: 'orderedList',
      blockIndex: 0,
      sectionIndex: 0,
    });
    expect(events[1]).toEqual({
      type: 'content_delta',
      text: '1. First\n2. Second\n3. Third',
      blockIndex: 0,
    });
    expect(events[2].type).toBe('block_end');
  });

  it('emits taskList with synthetic streaming events', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    const listBlock = {
      type: 'taskList',
      tasks: [
        { text: 'Unchecked', checked: false },
        { text: 'Checked', checked: true },
      ],
    };

    streamer.feed(`[${JSON.stringify(listBlock)}]`);
    const events = collectEvents(streamer);

    expect(events.length).toBe(3);
    expect(events[0]).toEqual({
      type: 'block_start',
      blockType: 'taskList',
      blockIndex: 0,
      sectionIndex: 0,
    });
    expect(events[1]).toEqual({
      type: 'content_delta',
      text: '[ ] Unchecked\n[x] Checked',
      blockIndex: 0,
    });
    expect(events[2].type).toBe('block_end');
  });

  it('emits empty list with block_start and block_end only (no delta)', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    const listBlock = { type: 'bulletList', items: [] };

    streamer.feed(`[${JSON.stringify(listBlock)}]`);
    const events = collectEvents(streamer);

    expect(events.length).toBe(2);
    expect(events[0].type).toBe('block_start');
    expect(events[1].type).toBe('block_end');
  });

  it('tracks block indices correctly across text and list blocks', () => {
    const streamer = new IncrementalBlockStreamer(0, 5);

    const json = JSON.stringify([
      { type: 'paragraph', content: 'Intro text' },
      { type: 'bulletList', items: ['A', 'B'] },
      { type: 'paragraph', content: 'Conclusion' },
    ]);

    streamer.feed(json);
    const events = collectEvents(streamer);

    // Paragraph at index 5: block_start(5) + deltas + block_end(5)
    const starts = events.filter((e) => e.type === 'block_start');
    expect(starts.length).toBe(3);
    expect((starts[0] as { blockIndex: number }).blockIndex).toBe(5);
    expect((starts[0] as { blockType: string }).blockType).toBe('paragraph');
    // bulletList at index 6
    expect((starts[1] as { blockIndex: number }).blockIndex).toBe(6);
    expect((starts[1] as { blockType: string }).blockType).toBe('bulletList');
    // Second paragraph at index 7
    expect((starts[2] as { blockIndex: number }).blockIndex).toBe(7);
    expect((starts[2] as { blockType: string }).blockType).toBe('paragraph');

    const ends = events.filter((e) => e.type === 'block_end');
    expect((ends[0] as { blockIndex: number }).blockIndex).toBe(5);
    expect((ends[1] as { blockIndex: number }).blockIndex).toBe(6);
    expect((ends[2] as { blockIndex: number }).blockIndex).toBe(7);
  });

  // =========================================================================
  // Newlines in content
  // =========================================================================

  it('handles escaped newlines in content', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    streamer.feed('[{"type": "paragraph", "content": "Line 1\\nLine 2"}]');
    const events = collectEvents(streamer);

    const deltas = events.filter((e) => e.type === 'content_delta');
    const fullText = deltas.map((e) => (e as { text: string }).text).join('');
    expect(fullText).toBe('Line 1\nLine 2');
  });

  // =========================================================================
  // Empty content
  // =========================================================================

  it('handles block with empty content', () => {
    const streamer = new IncrementalBlockStreamer(0, 0);

    streamer.feed('[{"type": "paragraph", "content": ""}]');
    const events = collectEvents(streamer);

    const blockEnd = events.find((e) => e.type === 'block_end');
    expect(blockEnd).toBeDefined();
    expect((blockEnd as { block: { content: string } }).block.content).toBe('');
  });
});
