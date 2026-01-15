/**
 * CommandPaletteAIAnswer
 *
 * Inline AI answer display for the command palette.
 * Part of Phase 11.3 Navigation System (TASK-097, TASK-099).
 *
 * Features:
 * - Displays AI-generated answers with citations
 * - "Thinking..." animation during loading
 * - Citation links styled with Teal Blue per design tokens
 * - "Insert as Block" button to add answer to current page
 */
'use client'

import { useCallback } from 'react'
import { Sparkles, ExternalLink, AlertCircle, Plus } from 'lucide-react'
import { useEditorStore } from '@/stores/editor'

interface Citation {
  id: string
  documentId: string
  documentTitle: string
  text: string
  pageNumber?: number
}

interface AIAnswerProps {
  /** The original question asked */
  question?: string
  /** The AI-generated answer */
  answer?: string
  /** Citation sources for the answer */
  citations?: Citation[]
  /** Loading state */
  isLoading: boolean
  /** Error message if query failed */
  error?: string
  /** Callback when block is inserted */
  onInsertBlock?: () => void
}

/**
 * Animated thinking dots
 */
function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5">
      <span className="animate-bounce delay-0">.</span>
      <span className="animate-bounce delay-100">.</span>
      <span className="animate-bounce delay-200">.</span>
    </span>
  )
}

export function CommandPaletteAIAnswer({
  question,
  answer,
  citations,
  isLoading,
  error,
  onInsertBlock,
}: AIAnswerProps) {
  const { editor } = useEditorStore()

  /**
   * Handle inserting the AI answer as a block in the current editor
   */
  const handleInsertBlock = useCallback(() => {
    if (!editor || !answer || !question) return

    // Check if the aiAnswerBlock command exists
    if (!editor.commands.setAIAnswerBlock) {
      console.warn('AIAnswerBlock extension not registered')
      return
    }

    // Insert the AI answer block at current cursor position
    editor.commands.setAIAnswerBlock({
      question,
      answer,
      citations: citations?.map((c) => ({
        id: c.id,
        documentId: c.documentId,
        documentTitle: c.documentTitle,
        text: c.text,
        pageNumber: c.pageNumber,
      })) || [],
    })

    // Notify parent (usually to close the palette)
    onInsertBlock?.()
  }, [editor, question, answer, citations, onInsertBlock])
  if (error) {
    return (
      <div className="px-4 py-4 border-t border-dark-vanilla/20 dark:border-panel-darker">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-red-600 dark:text-red-400">
              Unable to answer
            </div>
            <div className="text-xs text-charcoal/60 dark:text-cultured/60 mt-0.5">
              {error}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 py-4 border-t border-dark-vanilla/20 dark:border-panel-darker">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange/10 dark:bg-orange/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-orange animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-charcoal dark:text-cultured">
              Thinking<ThinkingDots />
            </div>
            <div className="text-xs text-charcoal/50 dark:text-cultured/50 mt-0.5">
              Searching documents and generating answer
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!answer) return null

  return (
    <div className="px-4 py-4 border-t border-dark-vanilla/20 dark:border-panel-darker">
      <div className="flex items-start gap-3">
        {/* AI Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange/10 dark:bg-orange/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-orange" />
        </div>

        {/* Answer Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-charcoal dark:text-cultured mb-1">
            AI Answer
          </div>
          <div className="text-sm text-charcoal/80 dark:text-cultured/80 leading-relaxed">
            {answer}
          </div>

          {/* Citations */}
          {citations && citations.length > 0 && (
            <div className="mt-3 pt-2 border-t border-dark-vanilla/10 dark:border-panel-darker">
              <div className="text-xs font-medium text-charcoal/50 dark:text-cultured/50 mb-1.5">
                Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {citations.map((citation, index) => (
                  <a
                    key={citation.id}
                    href={`/documents/${citation.documentId}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md
                             bg-teal/5 text-teal hover:bg-teal/10 transition-colors
                             border border-teal/20"
                    title={citation.text}
                  >
                    <span className="font-medium">[{index + 1}]</span>
                    <span className="truncate max-w-[150px]">
                      {citation.documentTitle}
                    </span>
                    {citation.pageNumber && (
                      <span className="text-teal/70">p.{citation.pageNumber}</span>
                    )}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Insert as Block Button */}
          {editor && (
            <div className="mt-3 pt-2 border-t border-dark-vanilla/10 dark:border-panel-darker">
              <button
                onClick={handleInsertBlock}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                         bg-orange/10 text-orange hover:bg-orange/20 transition-colors
                         border border-orange/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Insert as Block
              </button>
              <span className="ml-2 text-xs text-charcoal/40 dark:text-cultured/40">
                Add this answer to your current page
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandPaletteAIAnswer
