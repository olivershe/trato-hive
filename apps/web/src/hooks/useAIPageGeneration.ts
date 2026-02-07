'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/trpc/react';
import { useEditorStore } from '@/stores/editor';
import {
  mapSingleBlock,
  type GeneratedBlock,
  type GeneratedBlockType,
  type GenerationTemplate,
} from '@trato-hive/ai-core';
import { useStreamingTextInsertion } from './useStreamingTextInsertion';

// =============================================================================
// Types
// =============================================================================

interface GenerationProgress {
  sections: { title: string; blockTypes: GeneratedBlockType[] }[];
  currentSection: number;
  totalSections: number;
  blocksInserted: number;
  databasesCreated: number;
}

interface UseAIPageGenerationReturn {
  startGeneration: (params: {
    prompt: string;
    template?: GenerationTemplate;
    dealId?: string;
    context?: {
      dealId?: string;
      companyId?: string;
      documentIds?: string[];
    };
    enableWebSearch?: boolean;
  }) => void;
  isGenerating: boolean;
  progress: GenerationProgress | null;
  accept: () => void;
  discard: () => void;
  regenerate: () => void;
  error: string | null;
  isComplete: boolean;
  databaseActivity: string | null;
}

// =============================================================================
// Hook
// =============================================================================

export function useAIPageGeneration(): UseAIPageGenerationReturn {
  const { editor, pageId } = useEditorStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);

  const [databaseActivity, setDatabaseActivity] = useState<string | null>(null);
  const databaseActivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastParamsRef = useRef<Parameters<UseAIPageGenerationReturn['startGeneration']>[0] | null>(null);
  const databaseIdMapRef = useRef<Record<number, string>>({});
  const allBlocksRef = useRef<GeneratedBlock[]>([]);
  const processedEventsRef = useRef(0);
  // Track actual editor insertContent calls for accurate undo (#6)
  const insertCountRef = useRef(0);
  // Track created database IDs for cleanup on discard (#5)
  const createdDatabaseIdsRef = useRef<string[]>([]);
  // Refs synced from state for unmount cleanup (#12)
  const generationIdRef = useRef<string | null>(null);
  const isGeneratingRef = useRef(false);

  // Streaming text insertion hook — use ref to avoid triggering useEffect re-runs
  const streamInsertion = useStreamingTextInsertion(editor);
  const streamInsertionRef = useRef(streamInsertion);
  streamInsertionRef.current = streamInsertion;

  // Sync refs from state
  useEffect(() => { generationIdRef.current = generationId; }, [generationId]);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);

  const startMutation = api.pageGeneration.startGeneration.useMutation();
  const cancelMutation = api.pageGeneration.cancelGeneration.useMutation();
  const cleanupMutation = api.pageGeneration.cleanupDatabases.useMutation();

  // Poll for progress using tRPC useQuery with refetchInterval.
  // The server tracks lastPolledIndex, so each response contains
  // only events we haven't seen yet.
  // Reduced to 150ms for smooth streaming (TASK-136).
  const pollQuery = api.pageGeneration.pollProgress.useQuery(
    { generationId: generationId ?? '' },
    {
      enabled: !!generationId && isGenerating,
      refetchInterval: 150,
      refetchIntervalInBackground: false,
      // Don't cache — we always want fresh poll results
      gcTime: 0,
      staleTime: 0,
    }
  );

  // Process new events whenever poll data arrives.
  // Progress deltas are accumulated locally and flushed in a single
  // setProgress() call to avoid the React max-update-depth error.
  useEffect(() => {
    const data = pollQuery.data;
    if (!data || !editor) return;

    const { events, databaseIdMap, isComplete: done } = data;

    // Merge database ID map
    Object.assign(databaseIdMapRef.current, databaseIdMap);

    // Accumulators — one setProgress() call after both loops
    let newBlocksInserted = 0;
    let newDbsCreated = 0;
    let outlineEvent: { sections: { title: string; blockTypes: GeneratedBlockType[] }[] } | null = null;
    let latestSectionIndex: number | null = null;

    // Pass 1: Process database_created events first to populate databaseIdMapRef (#4)
    let latestDbName: string | null = null;
    for (const event of events) {
      if (event.type === 'database_created') {
        const dbEvent = event as { type: 'database_created'; databaseId: string; name: string; blockIndex: number };
        databaseIdMapRef.current[dbEvent.blockIndex] = dbEvent.databaseId;
        createdDatabaseIdsRef.current.push(dbEvent.databaseId);
        latestDbName = dbEvent.name;
        newDbsCreated++;
      }
    }

    // Pass 2: Process all other events (blocks now have access to DB IDs)
    for (const event of events) {
      if (event.type === 'database_created') continue; // already handled
      processedEventsRef.current++;

      switch (event.type) {
        case 'outline':
          outlineEvent = event as { type: 'outline'; sections: { title: string; blockTypes: GeneratedBlockType[] }[] };
          break;

        case 'section_start':
          latestSectionIndex = (event as { type: 'section_start'; index: number }).index;
          break;

        // --- Token-level streaming events (TASK-136) ---
        case 'block_start': {
          const bsEvent = event as { type: 'block_start'; blockType: GeneratedBlockType; attrs?: { level?: number } };
          streamInsertionRef.current.startBlock(bsEvent.blockType, bsEvent.attrs);
          break;
        }

        case 'content_delta': {
          const cdEvent = event as { type: 'content_delta'; text: string };
          streamInsertionRef.current.appendText(cdEvent.text);
          break;
        }

        case 'block_end': {
          const beEvent = event as { type: 'block_end'; block: GeneratedBlock; blockIndex: number };
          const dbId = databaseIdMapRef.current[beEvent.blockIndex];
          streamInsertionRef.current.finalizeBlock(beEvent.block, dbId);
          allBlocksRef.current.push(beEvent.block);
          newBlocksInserted++;
          break;
        }

        // --- Complete block events (database blocks, non-streamable) ---
        case 'block': {
          const blockEvent = event as { type: 'block'; block: GeneratedBlock; sectionIndex: number };
          allBlocksRef.current.push(blockEvent.block);

          const blockIndex = allBlocksRef.current.length - 1;
          const dbId = databaseIdMapRef.current[blockIndex];

          const nodes = mapSingleBlock(blockEvent.block, dbId);
          for (const node of nodes) {
            editor.commands.insertContent(node);
            insertCountRef.current++;
          }

          newBlocksInserted++;
          break;
        }

        case 'section_complete':
          break;

        case 'complete':
          setIsGenerating(false);
          setIsComplete(true);
          setGenerationId(null);
          setDatabaseActivity(null);
          break;

        case 'error':
          setError((event as { type: 'error'; message: string }).message);
          setIsGenerating(false);
          setIsComplete(true);
          setGenerationId(null);
          setDatabaseActivity(null);
          break;
      }
    }

    // Single batched progress update for the entire poll response
    if (outlineEvent || latestSectionIndex !== null || newBlocksInserted > 0 || newDbsCreated > 0) {
      setProgress((prev) => {
        // If we got an outline event, initialize progress from scratch
        if (outlineEvent) {
          const base: GenerationProgress = {
            sections: outlineEvent.sections,
            currentSection: 0,
            totalSections: outlineEvent.sections.length,
            blocksInserted: newBlocksInserted,
            databasesCreated: newDbsCreated,
          };
          if (latestSectionIndex !== null) {
            base.currentSection = latestSectionIndex;
          }
          return base;
        }

        // Otherwise merge deltas into existing progress
        if (!prev) return prev;
        return {
          ...prev,
          blocksInserted: prev.blocksInserted + newBlocksInserted,
          databasesCreated: prev.databasesCreated + newDbsCreated,
          ...(latestSectionIndex !== null ? { currentSection: latestSectionIndex } : {}),
        };
      });
    }

    // Show database activity indicator with auto-clear
    if (latestDbName) {
      if (databaseActivityTimerRef.current) {
        clearTimeout(databaseActivityTimerRef.current);
      }
      setDatabaseActivity(latestDbName);
      databaseActivityTimerRef.current = setTimeout(() => {
        setDatabaseActivity(null);
        databaseActivityTimerRef.current = null;
      }, 2500);
    }

    // Also stop polling if the server says generation is complete
    if (done && isGenerating) {
      setIsGenerating(false);
      setIsComplete(true);
      setGenerationId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollQuery.data, editor, isGenerating]);

  const startGeneration: UseAIPageGenerationReturn['startGeneration'] =
    useCallback(
      (params) => {
        if (!editor || !pageId) return;

        // Reset state
        setIsGenerating(true);
        setIsComplete(false);
        setError(null);
        setProgress(null);
        setDatabaseActivity(null);
        if (databaseActivityTimerRef.current) {
          clearTimeout(databaseActivityTimerRef.current);
          databaseActivityTimerRef.current = null;
        }
        allBlocksRef.current = [];
        databaseIdMapRef.current = {};
        processedEventsRef.current = 0;
        insertCountRef.current = 0;
        createdDatabaseIdsRef.current = [];
        streamInsertionRef.current.reset();
        lastParamsRef.current = params;

        startMutation.mutate(
          {
            prompt: params.prompt,
            template: params.template,
            pageId,
            dealId: params.dealId,
            context: params.context,
            enableWebSearch: params.enableWebSearch,
          },
          {
            onSuccess: (data: { generationId: string }) => {
              setGenerationId(data.generationId);
            },
            onError: (err: { message: string }) => {
              setError(err.message);
              setIsGenerating(false);
              setIsComplete(true);
            },
          }
        );
      },
      [editor, pageId, startMutation]
    );

  const accept = useCallback(() => {
    setIsGenerating(false);
    setIsComplete(false);
    setProgress(null);
    setError(null);
    setGenerationId(null);
    setDatabaseActivity(null);
    if (databaseActivityTimerRef.current) {
      clearTimeout(databaseActivityTimerRef.current);
      databaseActivityTimerRef.current = null;
    }
    createdDatabaseIdsRef.current = [];
    streamInsertionRef.current.reset();
  }, []);

  const discard = useCallback(() => {
    if (!editor) return;

    // Cancel if still running
    if (generationId && isGenerating) {
      cancelMutation.mutate({ generationId });
    }

    // Clean up orphaned databases (#5)
    if (createdDatabaseIdsRef.current.length > 0) {
      cleanupMutation.mutate({ databaseIds: createdDatabaseIdsRef.current });
      createdDatabaseIdsRef.current = [];
    }

    // Undo all changes: streaming inserts + direct inserts
    const streamingCount = streamInsertionRef.current.reset();
    const totalUndoCount = insertCountRef.current + streamingCount;
    for (let i = 0; i < totalUndoCount; i++) {
      editor.commands.undo();
    }
    insertCountRef.current = 0;

    // Reset state
    setIsGenerating(false);
    setIsComplete(false);
    setProgress(null);
    setError(null);
    setGenerationId(null);
    setDatabaseActivity(null);
    if (databaseActivityTimerRef.current) {
      clearTimeout(databaseActivityTimerRef.current);
      databaseActivityTimerRef.current = null;
    }
    allBlocksRef.current = [];
  }, [editor, generationId, isGenerating, cancelMutation, cleanupMutation]);

  const regenerate = useCallback(() => {
    discard();
    if (lastParamsRef.current) {
      setTimeout(() => {
        if (lastParamsRef.current) {
          startGeneration(lastParamsRef.current);
        }
      }, 100);
    }
  }, [discard, startGeneration]);

  // Cleanup on unmount — cancel generation and delete orphaned databases (#12)
  useEffect(() => {
    return () => {
      if (generationIdRef.current && isGeneratingRef.current) {
        cancelMutation.mutate({ generationId: generationIdRef.current });
      }
      if (createdDatabaseIdsRef.current.length > 0) {
        cleanupMutation.mutate({ databaseIds: createdDatabaseIdsRef.current });
      }
      if (databaseActivityTimerRef.current) {
        clearTimeout(databaseActivityTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    startGeneration,
    isGenerating,
    progress,
    accept,
    discard,
    regenerate,
    error,
    isComplete,
    databaseActivity,
  };
}
