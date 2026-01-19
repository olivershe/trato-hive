'use client'

import { Pin, PinOff } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar'
import type { SidebarItem } from '@trato-hive/shared'

interface PinButtonProps {
  /**
   * The item to pin/unpin
   */
  item: Omit<SidebarItem, 'id'> & { id?: string }
  /**
   * Size variant
   */
  size?: 'sm' | 'md'
  /**
   * Additional class names
   */
  className?: string
}

/**
 * Pin/Unpin button for sidebar items
 *
 * @example
 * ```tsx
 * <PinButton
 *   item={{
 *     type: 'deal',
 *     title: deal.name,
 *     href: `/deals/${deal.id}`,
 *   }}
 * />
 * ```
 */
export function PinButton({ item, size = 'md', className = '' }: PinButtonProps) {
  const { pin, unpin, isPinned, pinnedItems } = useSidebarStore()

  // Generate a consistent ID if not provided
  const itemId = item.id || `${item.type}-${item.href.split('/').pop()}`
  const fullItem: SidebarItem = { ...item, id: itemId }

  const pinned = isPinned(itemId)
  const isFull = pinnedItems.length >= 7

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (pinned) {
      unpin(itemId)
    } else if (!isFull) {
      pin(fullItem)
    }
  }

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5'

  return (
    <button
      onClick={handleClick}
      disabled={!pinned && isFull}
      className={`
        ${buttonSize} rounded transition-colors
        ${pinned
          ? 'bg-orange/10 text-orange hover:bg-orange/20'
          : isFull
            ? 'text-charcoal/30 cursor-not-allowed'
            : 'text-charcoal/40 hover:text-charcoal hover:bg-bone'
        }
        ${className}
      `}
      title={pinned ? 'Unpin from sidebar' : isFull ? 'Pinned items full (max 7)' : 'Pin to sidebar'}
    >
      {pinned ? (
        <PinOff className={iconSize} />
      ) : (
        <Pin className={iconSize} />
      )}
    </button>
  )
}
