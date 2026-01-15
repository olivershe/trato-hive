'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { SidebarItem } from '@trato-hive/shared'
import { useSidebarStore } from '@/stores/sidebar'

/**
 * Find a sidebar item that matches the current path
 * Checks both the item's href and its children's hrefs
 */
function findMatchingItem(
  items: SidebarItem[],
  pathname: string
): { item: SidebarItem; isChild: boolean } | null {
  for (const item of items) {
    // Direct match
    if (item.href === pathname || pathname.startsWith(item.href + '/')) {
      return { item, isChild: false }
    }

    // Check children
    if (item.children?.length) {
      for (const child of item.children) {
        if (child.href === pathname || pathname.startsWith(child.href + '/')) {
          return { item, isChild: true }
        }
      }
    }
  }

  return null
}

/**
 * Hook to auto-expand sidebar items when navigating to a page
 *
 * Features:
 * - Auto-expands parent item when navigating to a child page
 * - Collapses siblings when expanding new item (only one expanded at a time)
 * - Works with both pinned and recent items
 *
 * @example
 * ```tsx
 * // Use in the Sidebar component
 * useActivePageExpansion()
 * ```
 */
export function useActivePageExpansion() {
  const pathname = usePathname()
  const previousPath = useRef<string | null>(null)

  const { pinnedItems, recentItems, setExpanded, expandedItemId } = useSidebarStore()

  useEffect(() => {
    // Skip if same path
    if (previousPath.current === pathname) return
    previousPath.current = pathname

    // Check pinned items first
    const pinnedMatch = findMatchingItem(pinnedItems, pathname)
    if (pinnedMatch?.isChild) {
      // Expand the parent item (collapses any previously expanded item)
      setExpanded(pinnedMatch.item.id)
      return
    }

    // Check recent items
    const recentMatch = findMatchingItem(recentItems, pathname)
    if (recentMatch?.isChild) {
      setExpanded(recentMatch.item.id)
      return
    }

    // If navigating to a top-level page (not a child), optionally collapse
    // We keep the current expanded state for better UX
  }, [pathname, pinnedItems, recentItems, setExpanded, expandedItemId])
}

/**
 * Hook to check if an item should show its children
 */
export function useIsExpanded(itemId: string): boolean {
  return useSidebarStore((state) => state.expandedItemId === itemId)
}

/**
 * Hook to get the toggle function for an item
 */
export function useToggleExpanded() {
  return useSidebarStore((state) => state.toggleExpanded)
}
