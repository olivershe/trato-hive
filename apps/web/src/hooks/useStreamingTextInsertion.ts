'use client';

/**
 * useStreamingTextInsertion — Progressive Tiptap Text Insertion
 *
 * [TASK-136] Handles the insertion and streaming of text content
 * into the Tiptap editor for AI page generation.
 *
 * For each text block:
 *   1. startBlock() — inserts an empty node of the correct type
 *   2. appendText() — pushes text to a queue; a rAF loop drips chars
 *   3. finalizeBlock() — defers finalization until queue drains at accelerated speed
 *
 * The rAF drip (CHARS_PER_FRAME=3 at 60fps ≈ 180 chars/sec) creates
 * smooth character-by-character appearance regardless of how poll
 * batches deliver events. Backpressure auto-adjusts when queue grows.
 *
 * When finalizeBlock() is called while the queue still has text, it sets
 * pendingFinalize and switches to FINALIZE_CHARS_PER_FRAME (15 chars/frame
 * ≈ 900 chars/sec). Once the queue empties, the rAF loop executes the
 * undo + replace. This prevents the synchronous event loop from flushing
 * the entire queue at once when block_end arrives in the same poll batch.
 */
import { useRef, useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/core';
import { mapSingleBlock, type GeneratedBlock, type GeneratedBlockType } from '@trato-hive/ai-core';

interface StreamingState {
  /** Position of the end of the current streaming node */
  nodeEndPos: number;
  /** The node type being streamed */
  nodeType: string;
  /** Queue of text chunks waiting to be dripped into the editor */
  queue: string[];
  /** rAF handle for the drip loop */
  rafId: number | null;
  /** Deferred finalization — drip continues at accelerated speed then finalizes */
  pendingFinalize: { block: GeneratedBlock; databaseId?: string } | null;
}

const CHARS_PER_FRAME = 3;
const FINALIZE_CHARS_PER_FRAME = 15; // ~900 chars/sec at 60fps — accelerated drip during finalization
const BACKPRESSURE_THRESHOLD = 50;
const BACKPRESSURE_CHARS = 10;

export function useStreamingTextInsertion(editor: Editor | null) {
  const stateRef = useRef<StreamingState | null>(null);
  const insertCountRef = useRef(0);

  /**
   * Flush all remaining queued text into the editor in one go.
   */
  const flushQueue = useCallback(() => {
    if (!editor || !stateRef.current) return;

    const state = stateRef.current;
    if (state.queue.length === 0) return;

    const allText = state.queue.join('');
    state.queue = [];

    try {
      const textNode = editor.state.schema.text(allText);
      const tr = editor.state.tr.insert(state.nodeEndPos, textNode);
      editor.view.dispatch(tr);
      state.nodeEndPos += allText.length;
    } catch {
      stateRef.current = null;
    }
  }, [editor]);

  /**
   * Execute the pending finalization: undo the plain-text node and
   * insert the fully formatted version via mapSingleBlock.
   */
  const executePendingFinalize = useCallback((state: StreamingState) => {
    if (!editor || !state.pendingFinalize) return;

    const { block, databaseId } = state.pendingFinalize;
    state.pendingFinalize = null;

    editor.commands.undo();

    const nodes = mapSingleBlock(block, databaseId);
    for (const node of nodes) {
      editor.commands.insertContent(node);
    }

    insertCountRef.current++;
    stateRef.current = null;
  }, [editor]);

  /**
   * Drip characters from the queue into the editor, one rAF at a time.
   * When pendingFinalize is set, uses accelerated chunk size and
   * finalizes once the queue is empty.
   */
  const drainQueue = useCallback(() => {
    if (!editor || !stateRef.current) return;

    const state = stateRef.current;

    // Queue empty — check if we need to finalize
    if (state.queue.length === 0) {
      if (state.pendingFinalize) {
        executePendingFinalize(state);
      }
      state.rafId = null;
      return;
    }

    // Join all queued chunks into a single string for easier char slicing
    const allText = state.queue.join('');
    state.queue = [];

    // Determine chunk size — accelerate during finalization, increase under backpressure
    let chunkSize: number;
    if (state.pendingFinalize) {
      chunkSize = FINALIZE_CHARS_PER_FRAME;
    } else if (allText.length > BACKPRESSURE_THRESHOLD) {
      chunkSize = BACKPRESSURE_CHARS;
    } else {
      chunkSize = CHARS_PER_FRAME;
    }

    const toInsert = allText.slice(0, chunkSize);
    const remaining = allText.slice(chunkSize);

    if (remaining) {
      state.queue.push(remaining);
    }

    try {
      const textNode = editor.state.schema.text(toInsert);
      const tr = editor.state.tr.insert(state.nodeEndPos, textNode);
      editor.view.dispatch(tr);
      state.nodeEndPos += toInsert.length;
    } catch {
      stateRef.current = null;
      return;
    }

    // Schedule next frame if there's more to drain or finalization pending
    if (state.queue.length > 0 || state.pendingFinalize) {
      state.rafId = requestAnimationFrame(drainQueue);
    } else {
      state.rafId = null;
    }
  }, [editor, executePendingFinalize]);

  /**
   * Insert an empty node of the correct type at the end of the document.
   * If a previous block has a pending finalization, force-finalize it first.
   */
  const startBlock = useCallback(
    (blockType: GeneratedBlockType, attrs?: { level?: number }) => {
      if (!editor) return;

      // Force-finalize previous block if it's still dripping
      if (stateRef.current?.pendingFinalize) {
        if (stateRef.current.rafId !== null) {
          cancelAnimationFrame(stateRef.current.rafId);
          stateRef.current.rafId = null;
        }
        flushQueue();
        executePendingFinalize(stateRef.current);
      }

      const tiptapType =
        blockType === 'callout' ? 'blockquote' :
        blockType === 'bulletList' || blockType === 'orderedList' || blockType === 'taskList' ? 'paragraph' :
        blockType;

      const nodeContent: Record<string, unknown> = { type: tiptapType };

      if (blockType === 'heading' && attrs?.level) {
        nodeContent.attrs = { level: attrs.level };
      }

      if (tiptapType === 'blockquote') {
        nodeContent.content = [{ type: 'paragraph', content: [] }];
      }

      editor.commands.insertContent(nodeContent);

      const endPos = editor.state.selection.$head.pos;

      stateRef.current = {
        nodeEndPos: endPos,
        nodeType: tiptapType,
        queue: [],
        rafId: null,
        pendingFinalize: null,
      };
    },
    [editor, flushQueue, executePendingFinalize]
  );

  /**
   * Append a text chunk to the current streaming node.
   * Pushes to a queue; a rAF loop drips characters into the editor.
   */
  const appendText = useCallback(
    (text: string) => {
      if (!editor || !stateRef.current) return;

      stateRef.current.queue.push(text);

      // Start the rAF drip loop if not already running
      if (stateRef.current.rafId === null) {
        stateRef.current.rafId = requestAnimationFrame(drainQueue);
      }
    },
    [editor, drainQueue]
  );

  /**
   * Finalize the current streaming block.
   * If the queue still has text, defers finalization — the rAF drip
   * continues at accelerated speed, then finalizes once the queue empties.
   * If the queue is empty, finalizes immediately.
   */
  const finalizeBlock = useCallback(
    (block: GeneratedBlock, databaseId?: string) => {
      if (!editor || !stateRef.current) return;

      const state = stateRef.current;

      // If queue is empty, finalize immediately (no deferred drip needed)
      if (state.queue.length === 0) {
        if (state.rafId !== null) {
          cancelAnimationFrame(state.rafId);
          state.rafId = null;
        }

        editor.commands.undo();
        const nodes = mapSingleBlock(block, databaseId);
        for (const node of nodes) {
          editor.commands.insertContent(node);
        }

        insertCountRef.current++;
        stateRef.current = null;
        return;
      }

      // Queue has items — defer finalization and let rAF drip at accelerated speed
      state.pendingFinalize = { block, databaseId };

      // Ensure the rAF loop is running
      if (state.rafId === null) {
        state.rafId = requestAnimationFrame(drainQueue);
      }
    },
    [editor, drainQueue]
  );

  /**
   * Reset streaming state (for discard/cancel).
   * Returns the number of finalized inserts. If a block is mid-stream
   * (pendingFinalize set), adds +1 for the startBlock insertion that
   * hasn't been undo'd by finalizeBlock yet.
   */
  const reset = useCallback(() => {
    const hasPendingFinalize = !!stateRef.current?.pendingFinalize;
    if (stateRef.current?.rafId !== null && stateRef.current?.rafId !== undefined) {
      cancelAnimationFrame(stateRef.current.rafId);
    }
    stateRef.current = null;
    const count = insertCountRef.current + (hasPendingFinalize ? 1 : 0);
    insertCountRef.current = 0;
    return count;
  }, []);

  return useMemo(
    () => ({ startBlock, appendText, finalizeBlock, reset, insertCountRef }),
    [startBlock, appendText, finalizeBlock, reset]
  );
}
