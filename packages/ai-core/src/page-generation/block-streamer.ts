/**
 * IncrementalBlockStreamer — Streaming JSON Array Parser
 *
 * [TASK-136] Parses a streaming JSON array of GeneratedBlock objects
 * and emits typed streaming events as data arrives.
 *
 * Text blocks (heading, paragraph, callout, blockquote):
 *   block_start → content_delta (×N, char-by-char) → block_end
 *
 * List blocks (bulletList, orderedList, taskList):
 *   block_start → content_delta (synthetic text) → block_end
 *   Synthesized after JSON parse; frontend rAF drip handles char-by-char display.
 *
 * Database/table/complex blocks:
 *   block (complete, same as non-streaming)
 *
 * The parser uses bracket-depth tracking with string-state awareness
 * to detect object boundaries and extract the "content" field for
 * progressive text streaming.
 */
import type { GeneratedBlock, GeneratedBlockType } from './types';
import type {
  BlockStartEvent,
  ContentDeltaEvent,
  BlockEndEvent,
  BlockEvent,
} from './events';

// Block types that support content streaming (have a simple "content" string)
const STREAMABLE_TYPES = new Set<GeneratedBlockType>([
  'heading',
  'paragraph',
  'callout',
  'blockquote',
]);

// List block types — streamed via synthetic events after JSON parse completes
const LIST_TYPES = new Set<GeneratedBlockType>(['bulletList', 'orderedList', 'taskList']);

function synthesizeListText(block: GeneratedBlock): string {
  switch (block.type) {
    case 'bulletList':
      return (block.items || []).map((item) => `- ${item}`).join('\n');
    case 'orderedList':
      return (block.items || []).map((item, i) => `${i + 1}. ${item}`).join('\n');
    case 'taskList':
      return (block.tasks || []).map((t) => `${t.checked ? '[x]' : '[ ]'} ${t.text}`).join('\n');
    default:
      return '';
  }
}

type StreamEvent = BlockStartEvent | ContentDeltaEvent | BlockEndEvent | BlockEvent;

export class IncrementalBlockStreamer {
  private buffer = '';
  private pendingEvents: StreamEvent[] = [];

  // Parser state
  private inArray = false;
  private depth = 0;         // Brace depth (0 = outside object)
  private inString = false;
  private escaped = false;
  private objectBuffer = '';  // Current top-level object being built

  // Block streaming state
  private blockIndex: number;
  private sectionIndex: number;
  private currentBlockType: GeneratedBlockType | null = null;
  // (contentStringOpen tracks active content streaming)
  private contentKeyDetected = false; // Saw `"content"` key
  private awaitingContentValue = false; // Saw `:` after "content" key
  private contentStringOpen = false;  // Inside the content string value
  private blockStartEmitted = false;
  private lastKey = '';       // Track the most recently parsed key name
  private keyBuffer = '';     // Buffer for building key names
  private inKey = false;      // Are we reading a key string?
  private afterKey = false;   // Saw closing quote of a key, expecting ':'
  private headingLevel: number | undefined;

  constructor(sectionIndex: number, startBlockIndex: number) {
    this.sectionIndex = sectionIndex;
    this.blockIndex = startBlockIndex;
  }

  /**
   * Feed a chunk of streaming text from the LLM.
   */
  feed(chunk: string): void {
    this.buffer += chunk;
    this.parse();
  }

  /**
   * Yield all accumulated events and clear the buffer.
   */
  *flush(): Generator<StreamEvent> {
    for (const event of this.pendingEvents) {
      yield event;
    }
    this.pendingEvents = [];
  }

  // ===========================================================================
  // Parser
  // ===========================================================================

  private parse(): void {
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i];

      // Handle escape sequences inside strings
      if (this.escaped) {
        this.escaped = false;
        if (this.contentStringOpen) {
          // Emit the unescaped character
          const unescaped = ch === 'n' ? '\n' : ch === 't' ? '\t' : ch === '"' ? '"' : ch === '\\' ? '\\' : ch;
          this.emitContentDelta(unescaped);
        }
        if (this.inKey) {
          this.keyBuffer += ch;
        }
        this.objectBuffer += ch;
        continue;
      }

      if (this.inString && ch === '\\') {
        this.escaped = true;
        this.objectBuffer += ch;
        continue;
      }

      // Inside a string
      if (this.inString) {
        if (ch === '"') {
          // String ends
          this.inString = false;
          this.objectBuffer += ch;

          if (this.contentStringOpen) {
            // Content string finished
            this.contentStringOpen = false;

          }

          if (this.inKey) {
            this.inKey = false;
            this.lastKey = this.keyBuffer;
            this.keyBuffer = '';
            this.afterKey = true;

            // Check if this key is "type" or "content" or "level"
            if (this.lastKey === 'content' && this.depth === 1) {
              this.contentKeyDetected = true;
            }
          }
        } else {
          this.objectBuffer += ch;
          if (this.contentStringOpen) {
            this.emitContentDelta(ch);
          }
          if (this.inKey) {
            this.keyBuffer += ch;
          }
        }
        continue;
      }

      // Outside strings
      if (ch === '"') {
        this.inString = true;
        this.objectBuffer += ch;

        if (this.awaitingContentValue && this.depth === 1) {
          // This is the opening quote of the content value string
          this.contentStringOpen = true;

          this.awaitingContentValue = false;
          this.contentKeyDetected = false;
        } else if (this.depth === 1 && !this.afterKey && !this.awaitingContentValue) {
          // Start of a key at object-level 1
          this.inKey = true;
          this.keyBuffer = '';
        }
        continue;
      }

      if (ch === ':' && this.afterKey && this.depth === 1) {
        this.afterKey = false;
        this.objectBuffer += ch;

        if (this.contentKeyDetected) {
          this.awaitingContentValue = true;
        }

        // Check for type value (simple string after "type":)
        if (this.lastKey === 'type') {
          // Next string value will be the type — we need to capture it
          // We'll extract it when the object completes, but also try to detect it early
          // by looking ahead for a simple string value
          const rest = this.buffer.slice(i + 1).trimStart();
          const typeMatch = rest.match(/^"(\w+)"/);
          if (typeMatch) {
            this.currentBlockType = typeMatch[1] as GeneratedBlockType;
            this.maybeEmitBlockStart();
          }
        }

        if (this.lastKey === 'level') {
          const rest = this.buffer.slice(i + 1).trimStart();
          const levelMatch = rest.match(/^(\d)/);
          if (levelMatch) {
            this.headingLevel = parseInt(levelMatch[1], 10);
          }
        }

        continue;
      }

      this.afterKey = false;

      if (ch === '[' && !this.inArray && this.depth === 0) {
        this.inArray = true;
        continue;
      }

      if (ch === '{') {
        this.depth++;
        this.objectBuffer += ch;
        if (this.depth === 1) {
          // New top-level object
          this.objectBuffer = '{';
          this.currentBlockType = null;
          this.contentKeyDetected = false;
          this.awaitingContentValue = false;
          this.contentStringOpen = false;
          this.blockStartEmitted = false;
          this.lastKey = '';
          this.headingLevel = undefined;
        }
        continue;
      }

      if (ch === '}') {
        this.objectBuffer += ch;
        this.depth--;

        if (this.depth === 0 && this.inArray) {
          // Completed a top-level object
          this.handleCompleteObject();
        }
        continue;
      }

      if (ch === ']' && this.inArray && this.depth === 0) {
        this.inArray = false;
        continue;
      }

      this.objectBuffer += ch;
    }

    this.buffer = '';
  }

  private maybeEmitBlockStart(): void {
    if (this.blockStartEmitted || !this.currentBlockType) return;
    if (!STREAMABLE_TYPES.has(this.currentBlockType)) return;

    this.blockStartEmitted = true;
    this.pendingEvents.push({
      type: 'block_start',
      blockType: this.currentBlockType,
      blockIndex: this.blockIndex,
      sectionIndex: this.sectionIndex,
      attrs: this.headingLevel ? { level: this.headingLevel } : undefined,
    });
  }

  private emitContentDelta(text: string): void {
    // Only emit if we've started this block as streamable
    if (!this.blockStartEmitted) {
      this.maybeEmitBlockStart();
    }
    if (!this.blockStartEmitted) return;

    this.pendingEvents.push({
      type: 'content_delta',
      text,
      blockIndex: this.blockIndex,
    });
  }

  private handleCompleteObject(): void {
    try {
      const block = JSON.parse(this.objectBuffer) as GeneratedBlock;

      if (this.blockStartEmitted) {
        // We were streaming this block — emit block_end
        this.pendingEvents.push({
          type: 'block_end',
          block,
          blockIndex: this.blockIndex,
          sectionIndex: this.sectionIndex,
        });
      } else if (LIST_TYPES.has(block.type)) {
        // List block — emit synthetic streaming events for rAF drip
        this.pendingEvents.push({
          type: 'block_start',
          blockType: block.type,
          blockIndex: this.blockIndex,
          sectionIndex: this.sectionIndex,
        });

        const text = synthesizeListText(block);
        if (text) {
          this.pendingEvents.push({
            type: 'content_delta',
            text,
            blockIndex: this.blockIndex,
          });
        }

        this.pendingEvents.push({
          type: 'block_end',
          block,
          blockIndex: this.blockIndex,
          sectionIndex: this.sectionIndex,
        });
      } else {
        // Non-streamed block — emit as complete block event
        this.pendingEvents.push({
          type: 'block',
          block,
          sectionIndex: this.sectionIndex,
        });
      }
    } catch {
      // If JSON parse fails, emit as a plain paragraph fallback
      this.pendingEvents.push({
        type: 'block',
        block: {
          type: 'paragraph',
          content: this.objectBuffer.slice(0, 200),
        },
        sectionIndex: this.sectionIndex,
      });
    }

    this.blockIndex++;
    this.objectBuffer = '';
    this.currentBlockType = null;
    this.blockStartEmitted = false;
    this.contentKeyDetected = false;
    this.awaitingContentValue = false;
    this.contentStringOpen = false;
  }
}
