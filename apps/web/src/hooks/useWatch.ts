'use client';

import { api } from '@/trpc/react';
import { useCallback } from 'react';

export interface WatchState {
  isWatched: boolean;
  isLoading: boolean;
  notes: string | null;
  tags: string[];
  priority: number;
}

/**
 * Hook for managing company watch state with optimistic updates
 * [TASK-107]
 */
export function useWatch(companyId: string) {
  const utils = api.useUtils();

  const { data, isLoading: isQueryLoading } = api.watch.isWatched.useQuery(
    { companyId },
    { enabled: !!companyId }
  );

  const invalidateQueries = (id: string) => {
    utils.watch.isWatched.invalidate({ companyId: id });
    utils.watch.list.invalidate();
  };

  const createOptimisticConfig = <T extends { companyId: string }>(
    optimisticValue: { isWatched: boolean; watch: any }
  ) => ({
    onMutate: async ({ companyId: id }: T) => {
      await utils.watch.isWatched.cancel({ companyId: id });
      const previousData = utils.watch.isWatched.getData({ companyId: id });
      utils.watch.isWatched.setData({ companyId: id }, optimisticValue);
      return { previousData };
    },
    onError: (_error: unknown, { companyId: id }: T, context: { previousData?: any } | undefined) => {
      if (context?.previousData) {
        utils.watch.isWatched.setData({ companyId: id }, context.previousData);
      }
    },
    onSettled: (_data: unknown, _error: unknown, { companyId: id }: T) => {
      invalidateQueries(id);
    },
  });

  const addMutation = api.watch.add.useMutation(
    createOptimisticConfig({
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
    })
  );

  const removeMutation = api.watch.remove.useMutation(
    createOptimisticConfig({ isWatched: false, watch: null })
  );

  const updateMutation = api.watch.update.useMutation({
    onSettled: () => invalidateQueries(companyId),
  });

  const toggleWatch = useCallback(() => {
    if (data?.isWatched) {
      removeMutation.mutate({ companyId });
    } else {
      addMutation.mutate({ companyId });
    }
  }, [data?.isWatched, companyId, addMutation, removeMutation]);

  const addToWatch = useCallback(
    (options?: { notes?: string; tags?: string[]; priority?: number }) => {
      addMutation.mutate({ companyId, ...options });
    },
    [companyId, addMutation]
  );

  const removeFromWatch = useCallback(() => {
    removeMutation.mutate({ companyId });
  }, [companyId, removeMutation]);

  const updateWatch = useCallback(
    (options: { notes?: string | null; tags?: string[]; priority?: number }) => {
      updateMutation.mutate({ companyId, ...options });
    },
    [companyId, updateMutation]
  );

  const isWatched = data?.isWatched ?? false;
  const isMutating = addMutation.isPending || removeMutation.isPending || updateMutation.isPending;

  return {
    isWatched,
    isLoading: isQueryLoading || isMutating,
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

