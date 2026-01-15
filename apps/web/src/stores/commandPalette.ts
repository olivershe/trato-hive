'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Scope mode for AI queries in Command Palette
 */
export type ScopeMode = 'context' | 'global'

/**
 * Command Palette state shape
 */
interface CommandPaletteState {
  /** Current scope mode preference */
  scopeMode: ScopeMode
}

/**
 * Command Palette actions
 */
interface CommandPaletteActions {
  /** Set scope mode */
  setScopeMode: (mode: ScopeMode) => void
  /** Toggle between context and global scope */
  toggleScope: () => void
}

export type CommandPaletteStore = CommandPaletteState & CommandPaletteActions

/**
 * Zustand store for Command Palette preferences
 *
 * Part of Phase 11.3 Navigation System (TASK-100).
 *
 * Features:
 * - Persists scope preference to localStorage
 * - Allows toggling between context-aware and global scope
 *
 * @example
 * ```tsx
 * const { scopeMode, toggleScope } = useCommandPaletteStore()
 *
 * // Toggle between scoped and global search
 * <button onClick={toggleScope}>
 *   {scopeMode === 'context' ? 'Search Current' : 'Search All'}
 * </button>
 * ```
 */
export const useCommandPaletteStore = create<CommandPaletteStore>()(
  persist(
    (set) => ({
      // Initial state - default to context-aware
      scopeMode: 'context',

      // Set scope mode
      setScopeMode: (mode) => set({ scopeMode: mode }),

      // Toggle scope
      toggleScope: () =>
        set((state) => ({
          scopeMode: state.scopeMode === 'context' ? 'global' : 'context',
        })),
    }),
    {
      name: 'trato-command-palette-storage',
    }
  )
)

/**
 * Selector hooks for optimized re-renders
 */
export const useScopeMode = () => useCommandPaletteStore((state) => state.scopeMode)
