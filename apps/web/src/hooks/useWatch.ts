'use client';

import { api } from '@/trpc/react';
import { useCallback } from 'react';

/**
 * Watch state for a company
 */
export interface WatchState {
  isWatched: boolean;
  isLoading: boolean;
  notes: string | null;
  tags: string[];
  priority: number;
}

/**
 * Hook for managing company watch state with optimistic updates
 *
 * [TASK-107] Watch Button Component - Custom hook
 *
 * @example
 * ```tsx
 * const { isWatched, isLoading, toggleWatch } = useWatch(companyId);
 *
 * return (
 *   <button onClick={toggleWatch} disabled={isLoading}>
 *     {isWatched ? 'Watching' : 'Watch'}
 *   </button>
 * );
 * ```
 */
export function useWatch(companyId: string) {
  const utils = api.useUtils();

  // Query watch status
  const { data, isLoading: isQueryLoading } = api.watch.isWatched.useQuery(
    { companyId },
    { enabled: !!companyId }
  );

  // Add mutation with optimistic update
  const addMutation = api.watch.add.useMutation({
    onMutate: async ({ companyId }) => {
      // Cancel outgoing refetches
      await utils.watch.isWatched.cancel({ companyId });

      // Snapshot previous value
      const previousData = utils.watch.isWatched.getData({ companyId });

      // Optimistically update
      utils.watch.isWatched.setData({ companyId }, {
        isWatched: true,
        watch: {
          id: 'optimistic',
          companyId,
          userId: 'optimistic',
          notes: null,
          tags: [],
          priority: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return { previousData };
    },
    onError: (_error, { companyId }, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        utils.watch.isWatched.setData({ companyId }, context.previousData);
      }
    },
    onSettled: (_data, _error, { companyId }) => {
      // Refetch to sync with server
      utils.watch.isWatched.invalidate({ companyId });
      utils.watch.list.invalidate();
    },
  });

  // Remove mutation with optimistic update
  const removeMutation = api.watch.remove.useMutation({
    onMutate: async ({ companyId }) => {
      // Cancel outgoing refetches
      await utils.watch.isWatched.cancel({ companyId });

      // Snapshot previous value
      const previousData = utils.watch.isWatched.getData({ companyId });

      // Optimistically update
      utils.watch.isWatched.setData({ companyId }, {
        isWatched: false,
        watch: null,
      });

      return { previousData };
    },
    onError: (_error, { companyId }, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        utils.watch.isWatched.setData({ companyId }, context.previousData);
      }
    },
    onSettled: (_data, _error, { companyId }) => {
      // Refetch to sync with server
      utils.watch.isWatched.invalidate({ companyId });
      utils.watch.list.invalidate();
    },
  });

  // Update mutation
  const updateMutation = api.watch.update.useMutation({
    onSettled: () => {
      utils.watch.isWatched.invalidate({ companyId });
      utils.watch.list.invalidate();
    },
  });

  // Toggle watch state
  const toggleWatch = useCallback(() => {
    if (data?.isWatched) {
      removeMutation.mutate({ companyId });
    } else {
      addMutation.mutate({ companyId });
    }
  }, [data?.isWatched, companyId, addMutation, removeMutation]);

  // Add to watch list with options
  const addToWatch = useCallback(
    (options?: { notes?: string; tags?: string[]; priority?: number }) => {
      addMutation.mutate({
        companyId,
        notes: options?.notes,
        tags: options?.tags,
        priority: options?.priority,
      });
    },
    [companyId, addMutation]
  );

  // Remove from watch list
  const removeFromWatch = useCallback(() => {
    removeMutation.mutate({ companyId });
  }, [companyId, removeMutation]);

  // Update watch entry
  const updateWatch = useCallback(
    (options: { notes?: string | null; tags?: string[]; priority?: number }) => {
      updateMutation.mutate({
        companyId,
        ...options,
      });
    },
    [companyId, updateMutation]
  );

  const isWatched = data?.isWatched ?? false;
  const isMutating = addMutation.isPending || removeMutation.isPending || updateMutation.isPending;
  const isLoading = isQueryLoading || isMutating;

  return {
    isWatched,
    isLoading,
    isMutating,
    watch: data?.watch ?? null,
    notes: data?.watch?.notes ?? null,
    tags: data?.watch?.tags ?? [],
    priority: data?.watch?.priority ?? 0,
    toggleWatch,
    addToWatch,
    removeFromWatch,
    updateWatch,
  };
}

