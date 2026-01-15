'use client'

import { create } from 'zustand'
import type { Editor } from '@tiptap/core'

/**
 * Editor state shape
 */
interface EditorState {
  /** Current active editor instance */
  editor: Editor | null
  /** Current page ID for context */
  pageId: string | null
}

/**
 * Editor actions
 */
interface EditorActions {
  /** Register an editor instance */
  setEditor: (editor: Editor | null, pageId: string | null) => void
  /** Clear the editor reference */
  clearEditor: () => void
}

export type EditorStore = EditorState & EditorActions

/**
 * Zustand store for sharing the current editor instance
 *
 * Part of Phase 11.3 Navigation System (TASK-099).
 *
 * This store allows the Command Palette to insert blocks into
 * the currently active editor from anywhere in the app.
 *
 * @example
 * ```tsx
 * // In BlockEditor - register editor on create
 * const { setEditor } = useEditorStore()
 * onCreate={({ editor }) => setEditor(editor, pageId)}
 *
 * // In CommandPalette - insert block
 * const { editor } = useEditorStore()
 * if (editor) {
 *   editor.commands.setAIAnswerBlock({ ... })
 * }
 * ```
 */
export const useEditorStore = create<EditorStore>()((set) => ({
  // Initial state
  editor: null,
  pageId: null,

  // Set editor instance
  setEditor: (editor, pageId) => set({ editor, pageId }),

  // Clear editor reference (call on unmount)
  clearEditor: () => set({ editor: null, pageId: null }),
}))

/**
 * Selector hooks for optimized re-renders
 */
export const useActiveEditor = () => useEditorStore((state) => state.editor)
export const useActivePageId = () => useEditorStore((state) => state.pageId)
