'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SidebarItem } from '@trato-hive/shared'

/**
 * Maximum number of pinned items allowed in sidebar
 */
const MAX_PINNED = 7

/**
 * Maximum number of recent items tracked (FIFO)
 */
const MAX_RECENT = 3

/**
 * Sidebar state shape
 */
interface SidebarState {
  /** User-pinned items (max 7) */
  pinnedItems: SidebarItem[]
  /** Recently visited items (max 7, FIFO - newest first) */
  recentItems: SidebarItem[]
  /** Currently expanded item ID (shows children) */
  expandedItemId: string | null
}

/**
 * Sidebar actions
 */
interface SidebarActions {
  /** Pin an item to the sidebar (max 7) */
  pin: (item: SidebarItem) => void
  /** Unpin an item by ID */
  unpin: (itemId: string) => void
  /** Check if an item is pinned */
  isPinned: (itemId: string) => boolean
  /** Reorder pinned items (for drag-and-drop) */
  reorderPinned: (items: SidebarItem[]) => void
  /** Add item to recent list (FIFO, removes duplicates) */
  addRecent: (item: SidebarItem) => void
  /** Remove item from recent list */
  removeRecent: (itemId: string) => void
  /** Clear all recent items */
  clearRecent: () => void
  /** Set expanded item (auto-expands in sidebar) */
  setExpanded: (itemId: string | null) => void
  /** Toggle expanded state */
  toggleExpanded: (itemId: string) => void
}

export type SidebarStore = SidebarState & SidebarActions

/**
 * Zustand store for sidebar navigation state
 *
 * Features:
 * - Pinned items (max 7, user-managed)
 * - Recent items (max 7, FIFO auto-tracked)
 * - Expanded item (for showing sub-pages)
 * - LocalStorage persistence for pinned/recent
 *
 * @example
 * ```tsx
 * const { pinnedItems, pin, unpin } = useSidebarStore()
 *
 * // Pin a deal
 * pin({ id: 'deal-1', type: 'deal', title: 'Acme Corp', icon: 'briefcase', href: '/deals/1' })
 *
 * // Track recent visit
 * addRecent({ id: 'doc-1', type: 'document', title: 'LOI.pdf', icon: 'file', href: '/documents/1' })
 * ```
 */
export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      // Initial state
      pinnedItems: [],
      recentItems: [],
      expandedItemId: null,

      // Pin an item (enforces max limit, prevents duplicates)
      pin: (item) =>
        set((state) => {
          // Don't exceed max pinned
          if (state.pinnedItems.length >= MAX_PINNED) {
            return state
          }
          // Don't add duplicates
          if (state.pinnedItems.some((p) => p.id === item.id)) {
            return state
          }
          return {
            pinnedItems: [...state.pinnedItems, item],
          }
        }),

      // Unpin an item by ID
      unpin: (itemId) =>
        set((state) => ({
          pinnedItems: state.pinnedItems.filter((p) => p.id !== itemId),
        })),

      // Check if item is pinned
      isPinned: (itemId) => get().pinnedItems.some((p) => p.id === itemId),

      // Reorder pinned items (used by drag-and-drop)
      reorderPinned: (items) =>
        set({
          pinnedItems: items.slice(0, MAX_PINNED),
        }),

      // Add to recent (FIFO: newest first, removes duplicates, enforces max)
      addRecent: (item) =>
        set((state) => {
          // Remove existing entry if present (will be re-added at front)
          const filtered = state.recentItems.filter((r) => r.id !== item.id)
          // Add to front, trim to max
          return {
            recentItems: [item, ...filtered].slice(0, MAX_RECENT),
          }
        }),

      // Remove from recent
      removeRecent: (itemId) =>
        set((state) => ({
          recentItems: state.recentItems.filter((r) => r.id !== itemId),
        })),

      // Clear all recent items
      clearRecent: () => set({ recentItems: [] }),

      // Set expanded item
      setExpanded: (itemId) => set({ expandedItemId: itemId }),

      // Toggle expanded state
      toggleExpanded: (itemId) =>
        set((state) => ({
          expandedItemId: state.expandedItemId === itemId ? null : itemId,
        })),
    }),
    {
      name: 'trato-sidebar-storage',
      // Only persist pinned and recent items, not expanded state
      partialize: (state) => ({
        pinnedItems: state.pinnedItems,
        recentItems: state.recentItems,
      }),
    }
  )
)

/**
 * Selector hooks for optimized re-renders
 */
export const usePinnedItems = () => useSidebarStore((state) => state.pinnedItems)
export const useRecentItems = () => useSidebarStore((state) => state.recentItems)
export const useExpandedItemId = () =>
  useSidebarStore((state) => state.expandedItemId)
