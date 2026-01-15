'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Pin, X, ChevronRight } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SidebarItem } from '@trato-hive/shared'
import { useSidebarStore } from '@/stores/sidebar'

/**
 * Maximum number of pinned items allowed
 */
const MAX_PINNED = 7

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
      return '📌'
  }
}

/**
 * Child item component (non-draggable)
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
 * Individual sortable pinned item with expansion support
 */
function SortablePinnedItem({
  item,
  isActive,
  isExpanded,
  onUnpin,
  onToggleExpand,
  isChildActive,
}: {
  item: SidebarItem
  isActive: boolean
  isExpanded: boolean
  onUnpin: (id: string) => void
  onToggleExpand: (id: string) => void
  isChildActive: (href: string) => boolean
}) {
  const [showUnpin, setShowUnpin] = useState(false)
  const hasChildren = item.children && item.children.length > 0

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onToggleExpand(item.id)
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="relative group"
        onMouseEnter={() => setShowUnpin(true)}
        onMouseLeave={() => setShowUnpin(false)}
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
              transition-colors duration-150 cursor-grab active:cursor-grabbing
              ${!hasChildren ? 'ml-4' : ''}
              ${
                isActive
                  ? 'bg-orange/10 text-charcoal font-medium'
                  : 'text-charcoal/70 hover:bg-bone hover:text-charcoal'
              }
            `}
            {...attributes}
            {...listeners}
          >
            <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-sm">
              {getItemIcon(item.type, item.icon)}
            </span>
            <span className="truncate flex-1">{item.title}</span>
          </Link>
        </div>

        {/* Unpin button - appears on hover */}
        {showUnpin && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onUnpin(item.id)
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1
                       bg-bone hover:bg-orange/10 rounded transition-colors z-10"
            title="Unpin"
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
 * Pinned Section UI Component
 *
 * Displays user's pinned sidebar items with:
 * - Drag-and-drop reordering via @dnd-kit
 * - 7-item limit with visual indicator when full
 * - Expandable children with auto-collapse siblings
 * - Unpin functionality on hover
 * - LocalStorage persistence via Zustand
 *
 * @example
 * ```tsx
 * <PinnedSection />
 * ```
 */
export function PinnedSection() {
  const pathname = usePathname()
  const [activeId, setActiveId] = useState<string | null>(null)

  const { pinnedItems, reorderPinned, unpin, expandedItemId, toggleExpanded } =
    useSidebarStore()

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over || active.id === over.id) return

      const oldIndex = pinnedItems.findIndex((item) => item.id === active.id)
      const newIndex = pinnedItems.findIndex((item) => item.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(pinnedItems, oldIndex, newIndex)
        reorderPinned(newItems)
      }
    },
    [pinnedItems, reorderPinned]
  )

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href
  }

  const isChildActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const activeItem = activeId
    ? pinnedItems.find((item) => item.id === activeId)
    : null

  const isFull = pinnedItems.length >= MAX_PINNED

  // Don't render if no pinned items
  if (pinnedItems.length === 0) {
    return null
  }

  return (
    <div className="px-2 py-2 border-t border-gold/10">
      {/* Section Header */}
      <div className="flex items-center justify-between px-2 pb-1">
        <div className="flex items-center gap-1.5">
          <Pin className="w-3 h-3 text-charcoal/40" />
          <span className="text-xs font-medium text-charcoal/40 uppercase tracking-wider">
            Pinned
          </span>
        </div>

        {/* Full indicator */}
        {isFull && (
          <span className="text-[10px] text-orange/70 font-medium">
            {pinnedItems.length}/{MAX_PINNED}
          </span>
        )}
      </div>

      {/* Pinned Items List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pinnedItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {pinnedItems.map((item) => (
              <SortablePinnedItem
                key={item.id}
                item={item}
                isActive={isItemActive(item.href)}
                isExpanded={expandedItemId === item.id}
                onUnpin={unpin}
                onToggleExpand={toggleExpanded}
                isChildActive={isChildActive}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-md shadow-lg border border-gold/20 text-sm">
              <span className="w-4 h-4 flex items-center justify-center text-sm">
                {getItemIcon(activeItem.type, activeItem.icon)}
              </span>
              <span className="truncate">{activeItem.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
