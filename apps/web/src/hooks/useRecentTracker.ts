'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { SidebarItemType, type SidebarItem } from '@trato-hive/shared'
import { useSidebarStore } from '@/stores/sidebar'

/**
 * Route patterns for entity tracking
 */
const ROUTE_PATTERNS = {
  deal: /^\/deals\/([^/]+)$/,
  company: /^\/companies\/([^/]+)$/,
  document: /^\/documents\/([^/]+)$/,
  page: /^\/deals\/[^/]+\/pages\/([^/]+)$/,
} as const

/**
 * Extract entity info from pathname
 */
function parseRoute(pathname: string): {
  type: (typeof SidebarItemType)[keyof typeof SidebarItemType]
  id: string
} | null {
  // Check deal pattern
  const dealMatch = pathname.match(ROUTE_PATTERNS.deal)
  if (dealMatch) {
    return { type: SidebarItemType.DEAL, id: dealMatch[1] }
  }

  // Check company pattern
  const companyMatch = pathname.match(ROUTE_PATTERNS.company)
  if (companyMatch) {
    return { type: SidebarItemType.COMPANY, id: companyMatch[1] }
  }

  // Check document pattern
  const documentMatch = pathname.match(ROUTE_PATTERNS.document)
  if (documentMatch) {
    return { type: SidebarItemType.DOCUMENT, id: documentMatch[1] }
  }

  // Check page pattern (nested under deals)
  const pageMatch = pathname.match(ROUTE_PATTERNS.page)
  if (pageMatch) {
    return { type: SidebarItemType.PAGE, id: pageMatch[1] }
  }

  return null
}

/**
 * Get default icon for entity type
 */
function getDefaultIcon(type: string): string {
  switch (type) {
    case 'deal':
      return '💼'
    case 'company':
      return '🏢'
    case 'document':
      return '📄'
    case 'page':
      return '📝'
    default:
      return '📋'
  }
}

export interface RecentTrackerOptions {
  /**
   * Entity title resolver - call this to get the title for an entity
   * If not provided, uses a generic title
   */
  getTitle?: (type: string, id: string) => string | undefined

  /**
   * Entity icon resolver
   */
  getIcon?: (type: string, id: string) => string | undefined

  /**
   * Whether tracking is enabled
   * @default true
   */
  enabled?: boolean
}

/**
 * Hook to automatically track route visits and add them to recent items
 *
 * This hook monitors pathname changes and automatically adds visited
 * entities (deals, companies, documents, pages) to the recent list.
 *
 * @example
 * ```tsx
 * // Basic usage - auto-tracks routes
 * useRecentTracker()
 *
 * // With title resolver
 * const { data: deal } = api.deal.get.useQuery({ id: dealId })
 * useRecentTracker({
 *   getTitle: (type, id) => {
 *     if (type === 'deal' && id === dealId) return deal?.name
 *     return undefined
 *   }
 * })
 * ```
 */
export function useRecentTracker(options: RecentTrackerOptions = {}) {
  const { getTitle, getIcon, enabled = true } = options
  const pathname = usePathname()
  const addRecent = useSidebarStore((state) => state.addRecent)
  const previousPath = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Skip if same path (prevents double-tracking on re-renders)
    if (previousPath.current === pathname) return
    previousPath.current = pathname

    // Parse the current route
    const routeInfo = parseRoute(pathname)
    if (!routeInfo) return

    // Build the recent item
    const title =
      getTitle?.(routeInfo.type, routeInfo.id) ||
      `${routeInfo.type.charAt(0).toUpperCase() + routeInfo.type.slice(1)} ${routeInfo.id.slice(0, 8)}`

    const icon = getIcon?.(routeInfo.type, routeInfo.id) || getDefaultIcon(routeInfo.type)

    const recentItem: SidebarItem = {
      id: `${routeInfo.type}-${routeInfo.id}`,
      type: routeInfo.type,
      title,
      icon,
      href: pathname,
    }

    // Add to recent
    addRecent(recentItem)
  }, [pathname, enabled, getTitle, getIcon, addRecent])
}

/**
 * Hook variant that accepts entity data directly
 * Use this when you have the entity data available
 */
export function useTrackRecentVisit(
  entity: {
    id: string
    type: (typeof SidebarItemType)[keyof typeof SidebarItemType]
    title: string
    icon?: string
    href: string
  } | null
) {
  const addRecent = useSidebarStore((state) => state.addRecent)
  const trackedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!entity) return

    // Skip if already tracked this entity
    const entityKey = `${entity.type}-${entity.id}`
    if (trackedRef.current === entityKey) return
    trackedRef.current = entityKey

    const recentItem: SidebarItem = {
      id: entityKey,
      type: entity.type,
      title: entity.title,
      icon: entity.icon || getDefaultIcon(entity.type),
      href: entity.href,
    }

    addRecent(recentItem)
  }, [entity, addRecent])
}
