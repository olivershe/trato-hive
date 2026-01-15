/**
 * useCommandPalette
 *
 * Hook for managing the global command palette state and keyboard shortcuts.
 * Part of Phase 11.3 Navigation System (TASK-095).
 *
 * Features:
 * - Global ⌘K / Ctrl+K listener
 * - Prevents conflicts with editor shortcuts (checks for contenteditable)
 * - Provides open/close state management
 */
'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseCommandPaletteOptions {
  /** Keyboard shortcut key (default: 'k') */
  shortcutKey?: string
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean
  /** Callback when palette opens */
  onOpen?: () => void
  /** Callback when palette closes */
  onClose?: () => void
}

interface UseCommandPaletteReturn {
  /** Whether the command palette is open */
  isOpen: boolean
  /** Open the command palette */
  open: () => void
  /** Close the command palette */
  close: () => void
  /** Toggle the command palette */
  toggle: () => void
}

/**
 * Check if the event target is inside the Tiptap editor
 */
function isInsideEditor(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false

  // Check for Tiptap editor container
  const editor = element.closest('.tiptap, .ProseMirror, [data-editor]')
  return editor !== null
}

export function useCommandPalette(
  options: UseCommandPaletteOptions = {}
): UseCommandPaletteReturn {
  const { shortcutKey = 'k', enabled = true, onOpen, onClose } = options

  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => {
    setIsOpen(true)
    onOpen?.()
  }, [onOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev
      if (next) {
        onOpen?.()
      } else {
        onClose?.()
      }
      return next
    })
  }, [onOpen, onClose])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      const isShortcut = isMod && e.key.toLowerCase() === shortcutKey.toLowerCase()

      if (!isShortcut) return

      // Check if we're in an editable context that might conflict
      const target = e.target

      // If inside editor, only allow if pressing Shift as well (⌘⇧K)
      // This prevents conflicts with editor formatting shortcuts
      if (isInsideEditor(target)) {
        // Allow ⌘⇧K to still open palette from within editor
        if (!e.shiftKey) return
      }

      // For simple inputs, always allow ⌘K to open palette
      // This is common UX (VS Code, Slack, etc. all allow this)

      e.preventDefault()
      toggle()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, shortcutKey, toggle])

  return { isOpen, open, close, toggle }
}

export default useCommandPalette
