'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSidebarStore } from '@/stores/sidebar'
import { api } from '@/trpc/react'
import { useDebouncedCallback } from 'use-debounce'

/**
 * Debounce delay for syncing sidebar preferences to database
 */
const SYNC_DEBOUNCE_MS = 2000

/**
 * Hook to synchronize sidebar state with database
 *
 * Features:
 * - Loads initial preferences from DB on mount
 * - Debounced sync to prevent excessive writes (2 second delay)
 * - Merges DB state with localStorage (DB takes precedence on initial load)
 * - Only syncs when authenticated
 *
 * @example
 * ```tsx
 * // Use in a layout component that wraps the sidebar
 * function AppLayout({ children }) {
 *   useSidebarSync()
 *   return <>{children}</>
 * }
 * ```
 */
export function useSidebarSync() {
  const hasInitialized = useRef(false)
  const isUpdating = useRef(false)

  // Get store state and actions
  const pinnedItems = useSidebarStore((state) => state.pinnedItems)
  const recentItems = useSidebarStore((state) => state.recentItems)
  const store = useSidebarStore.getState()

  // tRPC hooks
  const { data: preferences, isLoading } = api.user.getPreferences.useQuery(
    undefined,
    {
      // Only fetch if we haven't initialized yet
      enabled: !hasInitialized.current,
      staleTime: Infinity, // Don't refetch automatically
      retry: false, // Don't retry on auth failure
    }
  )

  const updatePreferencesMutation = api.user.updateSidebarPreferences.useMutation()

  // Debounced sync function
  const syncToDatabase = useDebouncedCallback(
    useCallback(() => {
      // Skip if we're in the middle of loading initial state
      if (isUpdating.current) return

      const currentState = useSidebarStore.getState()

      updatePreferencesMutation.mutate({
        pinnedItems: currentState.pinnedItems,
        recentItems: currentState.recentItems,
      })
    }, [updatePreferencesMutation]),
    SYNC_DEBOUNCE_MS
  )

  // Load initial state from database
  useEffect(() => {
    if (isLoading || hasInitialized.current || !preferences) return

    hasInitialized.current = true
    isUpdating.current = true

    const dbSidebar = preferences.sidebar
    if (dbSidebar) {
      // Merge DB state with current store
      // DB takes precedence for pinned items
      // Merge recent items (DB first, then local, deduplicated)
      const currentState = useSidebarStore.getState()

      if (dbSidebar.pinnedItems?.length) {
        // Replace pinned items with DB state
        store.reorderPinned(dbSidebar.pinnedItems)
      }

      if (dbSidebar.recentItems?.length) {
        // Merge recent items: DB items first, then local items not in DB
        const dbRecentIds = new Set(dbSidebar.recentItems.map((r) => r.id))
        const localOnly = currentState.recentItems.filter(
          (r) => !dbRecentIds.has(r.id)
        )
        const merged = [...dbSidebar.recentItems, ...localOnly].slice(0, 7)

        // Clear and re-add to set correct order
        store.clearRecent()
        merged.reverse().forEach((item) => store.addRecent(item))
      }
    }

    isUpdating.current = false
  }, [preferences, isLoading, store])

  // Sync changes to database when state changes
  useEffect(() => {
    // Skip initial render and loading state
    if (!hasInitialized.current || isUpdating.current) return

    syncToDatabase()
  }, [pinnedItems, recentItems, syncToDatabase])

  return {
    isLoading,
    isSyncing: updatePreferencesMutation.isPending,
  }
}
