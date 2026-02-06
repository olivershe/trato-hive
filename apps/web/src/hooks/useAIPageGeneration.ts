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

  // Sync refs from state
  useEffect(() => { generationIdRef.current = generationId; }, [generationId]);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);

  const startMutation = api.pageGeneration.startGeneration.useMutation();
  const cancelMutation = api.pageGeneration.cancelGeneration.useMutation();
  const cleanupMutation = api.pageGeneration.cleanupDatabases.useMutation();

  // Poll for progress using tRPC useQuery with refetchInterval.
  // The server tracks lastPolledIndex, so each response contains
  // only events we haven't seen yet.
  const pollQuery = api.pageGeneration.pollProgress.useQuery(
    { generationId: generationId ?? '' },
    {
      enabled: !!generationId && isGenerating,
      refetchInterval: 500,
      refetchIntervalInBackground: false,
      // Don't cache — we always want fresh poll results
      gcTime: 0,
      staleTime: 0,
    }
  );

  // Process new events whenever poll data arrives
  useEffect(() => {
    const data = pollQuery.data;
    if (!data || !editor) return;

    const { events, databaseIdMap, isComplete: done } = data;

    // Merge database ID map
    Object.assign(databaseIdMapRef.current, databaseIdMap);

    // Pass 1: Process database_created events first to populate databaseIdMapRef (#4)
    for (const event of events) {
      if (event.type === 'database_created') {
        const dbEvent = event as { type: 'database_created'; databaseId: string; blockIndex: number };
        databaseIdMapRef.current[dbEvent.blockIndex] = dbEvent.databaseId;
        createdDatabaseIdsRef.current.push(dbEvent.databaseId);
        setProgress((prev) =>
          prev ? { ...prev, databasesCreated: prev.databasesCreated + 1 } : prev
        );
      }
    }

    // Pass 2: Process all other events (blocks now have access to DB IDs)
    for (const event of events) {
      if (event.type === 'database_created') continue; // already handled
      processedEventsRef.current++;

      switch (event.type) {
        case 'outline':
          setProgress({
            sections: (event as { type: 'outline'; sections: { title: string; blockTypes: GeneratedBlockType[] }[] }).sections,
            currentSection: 0,
            totalSections: (event as { type: 'outline'; sections: { title: string; blockTypes: GeneratedBlockType[] }[] }).sections.length,
            blocksInserted: 0,
            databasesCreated: 0,
          });
          break;

        case 'section_start':
          setProgress((prev) =>
            prev ? { ...prev, currentSection: (event as { type: 'section_start'; index: number }).index } : prev
          );
          break;

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

          setProgress((prev) =>
            prev ? { ...prev, blocksInserted: prev.blocksInserted + 1 } : prev
          );
          break;
        }

        case 'section_complete':
          break;

        case 'complete':
          setIsGenerating(false);
          setIsComplete(true);
          setGenerationId(null);
          break;

        case 'error':
          setError((event as { type: 'error'; message: string }).message);
          setIsGenerating(false);
          setIsComplete(true);
          setGenerationId(null);
          break;
      }
    }

    // Also stop polling if the server says generation is complete
    if (done && isGenerating) {
      setIsGenerating(false);
      setIsComplete(true);
      setGenerationId(null);
    }
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
        allBlocksRef.current = [];
        databaseIdMapRef.current = {};
        processedEventsRef.current = 0;
        insertCountRef.current = 0;
        createdDatabaseIdsRef.current = [];
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
    createdDatabaseIdsRef.current = [];
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

    // Undo all changes using actual insert count (#6)
    const undoCount = insertCountRef.current;
    for (let i = 0; i < undoCount; i++) {
      editor.commands.undo();
    }
    insertCountRef.current = 0;

    // Reset state
    setIsGenerating(false);
    setIsComplete(false);
    setProgress(null);
    setError(null);
    setGenerationId(null);
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
  };
}
