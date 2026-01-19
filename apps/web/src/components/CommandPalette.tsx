/**
 * CommandPalette
 *
 * Global command palette (⌘K) for navigating, searching, and executing actions.
 * Part of Phase 11.3 Navigation System.
 *
 * Features:
 * - Search across entities (Deals, Companies, Documents)
 * - Quick actions (/new-deal, /upload, etc.)
 * - AI query mode for natural language questions
 * - Keyboard navigation (↑↓ Enter Esc)
 */
'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  X,
  Building2,
  FileText,
  Sparkles,
  Plus,
  Upload,
  Settings,
  ChevronRight,
  Globe,
  Target,
} from 'lucide-react'

/**
 * Result item types for the command palette
 */
export type CommandResultType = 'page' | 'action' | 'ai'

export interface CommandResult {
  id: string
  type: CommandResultType
  title: string
  subtitle?: string
  icon?: React.ReactNode
  href?: string
  action?: () => void
  keywords?: string[]
  /** Keyboard shortcut to display (e.g., "⌘N") */
  shortcut?: string
}

export interface CommandGroup {
  id: string
  title: string
  type: CommandResultType
  results: CommandResult[]
}

/**
 * Scope information for context-aware searching
 */
export interface ScopeInfo {
  /** Current scope label (e.g., "Current Deal", "All Data") */
  label: string
  /** Whether there is a specific context (not global) */
  hasContext: boolean
  /** Current scope mode ('context' or 'global') */
  mode: 'context' | 'global'
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  /** Optional initial query */
  initialQuery?: string
  /** Optional groups of results to display */
  groups?: CommandGroup[]
  /** Callback when a result is selected */
  onSelect?: (result: CommandResult) => void
  /** Callback when query changes (for external search) */
  onQueryChange?: (query: string) => void
  /** Whether to show loading state */
  isLoading?: boolean
  /** Placeholder text for search input */
  placeholder?: string
  /** Optional content to render after results (e.g., AI answer) */
  afterResults?: React.ReactNode
  /** Scope information for context-aware searching (TASK-100) */
  scope?: ScopeInfo
  /** Callback to toggle scope between context and global */
  onToggleScope?: () => void
}

/**
 * Default quick actions available in the command palette
 */
const DEFAULT_ACTIONS: CommandResult[] = [
  {
    id: 'action-new-deal',
    type: 'action',
    title: 'New Deal',
    subtitle: 'Create a new deal workspace',
    icon: <Plus className="w-4 h-4" />,
    keywords: ['create', 'deal', 'new', '/new-deal'],
    href: '/deals/new',
  },
  {
    id: 'action-new-company',
    type: 'action',
    title: 'New Company',
    subtitle: 'Add a company to track',
    icon: <Building2 className="w-4 h-4" />,
    keywords: ['create', 'company', 'new', '/new-company'],
    href: '/companies/new',
  },
  {
    id: 'action-upload',
    type: 'action',
    title: 'Upload Document',
    subtitle: 'Upload files for processing',
    icon: <Upload className="w-4 h-4" />,
    keywords: ['upload', 'file', 'document', '/upload'],
  },
  {
    id: 'action-settings',
    type: 'action',
    title: 'Settings',
    subtitle: 'Open application settings',
    icon: <Settings className="w-4 h-4" />,
    keywords: ['settings', 'preferences', 'config'],
    href: '/settings',
  },
]

/**
 * Icons for different result types
 */
function getTypeIcon(type: CommandResultType): React.ReactNode {
  switch (type) {
    case 'page':
      return <FileText className="w-4 h-4" />
    case 'action':
      return <ChevronRight className="w-4 h-4" />
    case 'ai':
      return <Sparkles className="w-4 h-4" />
  }
}

/**
 * Group titles for display
 */
const GROUP_TITLES: Record<CommandResultType, string> = {
  page: 'Pages',
  action: 'Actions',
  ai: 'AI',
}

export function CommandPalette({
  isOpen,
  onClose,
  initialQuery = '',
  groups: externalGroups,
  onSelect,
  onQueryChange,
  isLoading = false,
  placeholder = 'Search or type a command...',
  afterResults,
  scope,
  onToggleScope,
}: CommandPaletteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(initialQuery)
  const [selectedIndex, setSelectedIndex] = useState(0)

  /**
   * Filter and group results based on query
   */
  const groups = useMemo(() => {
    // If external groups are provided, use those
    if (externalGroups && externalGroups.length > 0) {
      return externalGroups
    }

    // Otherwise, filter default actions based on query
    const normalizedQuery = query.toLowerCase().trim()

    if (!normalizedQuery) {
      // Show all default actions when no query
      return [
        {
          id: 'actions',
          title: GROUP_TITLES.action,
          type: 'action' as CommandResultType,
          results: DEFAULT_ACTIONS,
        },
      ]
    }

    // Filter actions by query
    const filteredActions = DEFAULT_ACTIONS.filter(
      (action) =>
        action.title.toLowerCase().includes(normalizedQuery) ||
        action.subtitle?.toLowerCase().includes(normalizedQuery) ||
        action.keywords?.some((k) => k.toLowerCase().includes(normalizedQuery))
    )

    const result: CommandGroup[] = []

    if (filteredActions.length > 0) {
      result.push({
        id: 'actions',
        title: GROUP_TITLES.action,
        type: 'action',
        results: filteredActions,
      })
    }

    return result
  }, [query, externalGroups])

  /**
   * Flatten all results for keyboard navigation
   */
  const allResults = useMemo(() => {
    return groups.flatMap((group) => group.results)
  }, [groups])

  /**
   * Focus input when opened
   */
  useEffect(() => {
    if (!isOpen) return

    setQuery(initialQuery)
    setSelectedIndex(0)
    // Delay focus to ensure modal is rendered
    const timer = setTimeout(() => inputRef.current?.focus(), 10)
    return () => clearTimeout(timer)
  }, [isOpen, initialQuery])

  /**
   * Reset selection when query changes
   */
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  /**
   * Notify parent of query changes
   */
  useEffect(() => {
    onQueryChange?.(query)
  }, [query, onQueryChange])

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (resultsRef.current && allResults.length > 0) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, allResults.length])

  /**
   * Handle result selection
   */
  const handleSelect = useCallback(
    (result: CommandResult) => {
      if (onSelect) {
        onSelect(result)
      } else if (result.action) {
        result.action()
      } else if (result.href) {
        router.push(result.href)
      }
      onClose()
    },
    [onSelect, router, onClose]
  )

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < allResults.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0))
          break
        case 'Enter':
          e.preventDefault()
          if (allResults[selectedIndex]) {
            handleSelect(allResults[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [allResults, selectedIndex, handleSelect, onClose]
  )

  /**
   * Get the current global index for an item
   */
  const getGlobalIndex = useCallback(
    (groupIndex: number, itemIndex: number): number => {
      let index = 0
      for (let i = 0; i < groupIndex; i++) {
        index += groups[i].results.length
      }
      return index + itemIndex
    },
    [groups]
  )

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - Dark overlay with blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50">
        <div
          className="bg-alabaster dark:bg-panel-dark rounded-xl shadow-2xl border border-dark-vanilla/30 dark:border-panel-darker overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-vanilla/20 dark:border-panel-darker">
            <Search className="w-5 h-5 text-charcoal/40 dark:text-cultured/40 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 text-base bg-transparent outline-none text-charcoal dark:text-cultured placeholder:text-charcoal/40 dark:placeholder:text-cultured/40"
              aria-label="Search commands"
              aria-autocomplete="list"
              aria-controls="command-results"
            />
            {isLoading && (
              <div className="w-4 h-4 border-2 border-orange/30 border-t-orange rounded-full animate-spin" />
            )}
            {/* Scope Indicator (TASK-100) */}
            {scope && scope.hasContext && (
              <button
                onClick={onToggleScope}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  scope.mode === 'context'
                    ? 'bg-orange/10 text-orange hover:bg-orange/20'
                    : 'bg-charcoal/5 dark:bg-cultured/10 text-charcoal/60 dark:text-cultured/60 hover:bg-charcoal/10 dark:hover:bg-cultured/20'
                }`}
                title={scope.mode === 'context' ? 'Click to search all data' : 'Click to search current context'}
              >
                {scope.mode === 'context' ? (
                  <Target className="w-3.5 h-3.5" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {scope.mode === 'context' ? scope.label : 'All Data'}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-charcoal/5 dark:hover:bg-cultured/5 text-charcoal/40 dark:text-cultured/40 hover:text-charcoal dark:hover:text-cultured transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
              aria-label="Close command palette"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            id="command-results"
            className="max-h-80 overflow-y-auto overscroll-contain"
            role="listbox"
          >
            {groups.length === 0 ? (
              <div className="px-4 py-8 text-center text-charcoal/40 dark:text-cultured/40 text-sm">
                {query ? 'No results found' : 'Type to search…'}
              </div>
            ) : (
              groups.map((group, groupIndex) => (
                <div key={group.id} className="py-2">
                  {/* Group Header */}
                  <div className="px-4 py-1.5 text-xs font-medium text-charcoal/50 dark:text-cultured/50 uppercase tracking-wider">
                    {group.title}
                  </div>

                  {/* Group Results */}
                  {group.results.map((result, itemIndex) => {
                    const globalIndex = getGlobalIndex(groupIndex, itemIndex)
                    const isSelected = globalIndex === selectedIndex

                    return (
                      <button
                        key={result.id}
                        data-index={globalIndex}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/40
                          ${
                            isSelected
                              ? 'bg-orange/10 dark:bg-orange/20'
                              : 'hover:bg-charcoal/5 dark:hover:bg-cultured/5'
                          }
                        `}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {/* Icon */}
                        <span
                          className={`
                          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                          ${
                            isSelected
                              ? 'bg-orange/20 text-orange'
                              : 'bg-charcoal/5 dark:bg-cultured/10 text-charcoal/60 dark:text-cultured/60'
                          }
                        `}
                        >
                          {result.icon || getTypeIcon(result.type)}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-charcoal dark:text-cultured truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-charcoal/50 dark:text-cultured/50 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>

                        {/* Keyboard shortcut */}
                        {result.shortcut && (
                          <kbd className="px-1.5 py-0.5 bg-charcoal/5 dark:bg-cultured/10 rounded text-[10px] font-mono text-charcoal/50 dark:text-cultured/50 flex-shrink-0">
                            {result.shortcut}
                          </kbd>
                        )}

                        {/* Type indicator for actions */}
                        {result.type === 'action' && result.href && !result.shortcut && (
                          <ChevronRight className="w-4 h-4 text-charcoal/30 dark:text-cultured/30 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* AI Answer / After Results Content */}
          {afterResults}

          {/* Footer - Keyboard hints */}
          <div className="px-4 py-2.5 border-t border-dark-vanilla/20 dark:border-panel-darker flex items-center gap-4 text-xs text-charcoal/40 dark:text-cultured/40">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-charcoal/5 dark:bg-cultured/10 rounded text-[10px] font-mono">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-charcoal/5 dark:bg-cultured/10 rounded text-[10px] font-mono">
                Enter
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-charcoal/5 dark:bg-cultured/10 rounded text-[10px] font-mono">
                Esc
              </kbd>
              <span>Close</span>
            </span>
            <span className="ml-auto flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-charcoal/5 dark:bg-cultured/10 rounded text-[10px] font-mono">
                ⌘K
              </kbd>
              <span>Open anytime</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default CommandPalette
