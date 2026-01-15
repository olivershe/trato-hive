'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, X, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { SidebarItem } from '@trato-hive/shared'
import { useSidebarStore } from '@/stores/sidebar'

/**
 * Icon mapping for sidebar item types
 */
function getItemIcon(type: string, icon?: string): string {
  if (icon) return icon
  switch (type) {
    case 'deal':
      return '💼'
    case 'company':
      return '🏢'
    case 'document':
      return '📄'
    case 'page':
      return '📝'
    case 'module':
      return '📦'
    default:
      return '📋'
  }
}

/**
 * Child item component
 */
function ChildItem({
  item,
  isActive,
}: {
  item: SidebarItem
  isActive: boolean
}) {
  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-2 px-2 py-1 pl-8 rounded-md text-sm
        transition-colors duration-150
        ${
          isActive
            ? 'bg-orange/10 text-charcoal font-medium'
            : 'text-charcoal/60 hover:bg-bone hover:text-charcoal'
        }
      `}
    >
      <span className="w-3 h-3 flex items-center justify-center flex-shrink-0 text-xs">
        {getItemIcon(item.type, item.icon)}
      </span>
      <span className="truncate flex-1 text-xs">{item.title}</span>
    </Link>
  )
}

/**
 * Individual recent item row with expansion support
 */
function RecentItem({
  item,
  isActive,
  isExpanded,
  onRemove,
  onToggleExpand,
  isChildActive,
}: {
  item: SidebarItem
  isActive: boolean
  isExpanded: boolean
  onRemove: (id: string) => void
  onToggleExpand: (id: string) => void
  isChildActive: (href: string) => boolean
}) {
  const [showRemove, setShowRemove] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleExpand(item.id)
  }

  return (
    <div>
      <div
        className="relative group"
        onMouseEnter={() => setShowRemove(true)}
        onMouseLeave={() => setShowRemove(false)}
      >
        <div className="flex items-center">
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={handleExpandClick}
              className="p-1 hover:bg-bone rounded transition-colors flex-shrink-0"
            >
              <ChevronRight
                className={`w-3 h-3 text-charcoal/40 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          )}

          <Link
            href={item.href}
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded-md text-sm flex-1
              transition-colors duration-150
              ${!hasChildren ? 'ml-4' : ''}
              ${
                isActive
                  ? 'bg-orange/10 text-charcoal font-medium'
                  : 'text-charcoal/70 hover:bg-bone hover:text-charcoal'
              }
            `}
          >
            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-sm">
              {getItemIcon(item.type, item.icon)}
            </span>
            <span className="truncate flex-1">{item.title}</span>
          </Link>
        </div>

        {/* Remove button - appears on hover */}
        {showRemove && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove(item.id)
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1
                       bg-bone hover:bg-orange/10 rounded transition-colors z-10"
            title="Remove from recent"
          >
            <X className="w-3 h-3 text-charcoal/50 hover:text-charcoal" />
          </button>
        )}
      </div>

      {/* Children (shown when expanded) */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <ChildItem
              key={child.id}
              item={child}
              isActive={isChildActive(child.href)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Recent Section UI Component
 *
 * Displays recently visited items with:
 * - FIFO ordering (newest at top)
 * - Max 7 items
 * - Expandable children with auto-collapse siblings
 * - Remove functionality on hover
 * - Clear all option
 * - LocalStorage persistence via Zustand
 *
 * @example
 * ```tsx
 * <RecentSection />
 * ```
 */
export function RecentSection() {
  const pathname = usePathname()
  const { recentItems, removeRecent, clearRecent, expandedItemId, toggleExpanded } =
    useSidebarStore()

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href
  }

  const isChildActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Don't render if no recent items
  if (recentItems.length === 0) {
    return null
  }

  return (
    <div className="px-2 py-2 border-t border-gold/10">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2 pb-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-charcoal/40" />
          <span className="text-xs font-medium text-charcoal/40 uppercase tracking-wider">
            Recent
          </span>
        </div>

        {/* Clear all button */}
        {recentItems.length > 0 && (
          <button
            onClick={clearRecent}
            className="text-[10px] text-charcoal/40 hover:text-charcoal
                       transition-colors px-1 py-0.5 rounded hover:bg-bone"
            title="Clear recent items"
          >
            Clear
          </button>
        )}
      </div>

      {/* Recent Items List */}
      <div className="space-y-0.5">
        {recentItems.map((item) => (
          <RecentItem
            key={item.id}
            item={item}
            isActive={isItemActive(item.href)}
            isExpanded={expandedItemId === item.id}
            onRemove={removeRecent}
            onToggleExpand={toggleExpanded}
            isChildActive={isChildActive}
          />
        ))}
      </div>
    </div>
  )
}
