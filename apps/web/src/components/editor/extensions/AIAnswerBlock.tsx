// @ts-nocheck - Tiptap extension type portability issue
/**
 * AIAnswerBlock - Tiptap extension for AI-generated answers
 *
 * Part of Phase 11.3 Navigation System (TASK-099).
 * Displays AI answers inserted from the Command Palette with preserved citations.
 *
 * Features:
 * - Displays AI answer with inline citation markers
 * - Collapsible sources list
 * - Clickable citations that open CitationSidebar
 * - Visual styling consistent with QueryBlock
 */
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useMemo, useCallback } from 'react'
import { Sparkles, FileText, ChevronDown } from 'lucide-react'
import { useCitation } from '@/components/citation'

// =============================================================================
// Types
// =============================================================================

export interface AIAnswerCitation {
  id: string
  documentId: string
  documentTitle: string
  text: string
  pageNumber?: number
}

export interface AIAnswerAttributes {
  question: string
  answer: string
  citations: string // JSON stringified AIAnswerCitation[]
  createdAt: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    aiAnswerBlock: {
      setAIAnswerBlock: (attrs: {
        question: string
        answer: string
        citations: AIAnswerCitation[]
      }) => ReturnType
    }
  }
}

// =============================================================================
// Citation Parsing Utilities
// =============================================================================

interface ParsedSegment {
  type: 'text' | 'citation'
  content: string
  citationIndex?: number
}

/**
 * Parses an answer string for [[cite:N]] markers and returns segments.
 */
function parseAnswerWithCitations(answer: string): ParsedSegment[] {
  const segments: ParsedSegment[] = []
  const citationRegex = /\[\[cite:(\d+)\]\]/g
  let lastIndex = 0
  let match

  while ((match = citationRegex.exec(answer)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: answer.slice(lastIndex, match.index),
      })
    }
    segments.push({
      type: 'citation',
      content: `[${match[1]}]`,
      citationIndex: parseInt(match[1], 10),
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < answer.length) {
    segments.push({
      type: 'text',
      content: answer.slice(lastIndex),
    })
  }

  return segments
}

// =============================================================================
// Node Extension
// =============================================================================

export const AIAnswerBlock = Node.create({
  name: 'aiAnswerBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      question: { default: '' },
      answer: { default: '' },
      citations: { default: '[]' },
      createdAt: { default: new Date().toISOString() },
    }
  },

  parseHTML() {
    return [{ tag: 'ai-answer-block' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['ai-answer-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(AIAnswerCard)
  },

  addCommands() {
    return {
      setAIAnswerBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'aiAnswerBlock',
            attrs: {
              question: attrs.question,
              answer: attrs.answer,
              citations: JSON.stringify(attrs.citations),
              createdAt: new Date().toISOString(),
            },
          })
        },
    }
  },
})

// =============================================================================
// Answer With Inline Citations Component
// =============================================================================

interface AnswerWithCitationsProps {
  answer: string
  citations: AIAnswerCitation[]
}

function AnswerWithCitations({ answer, citations }: AnswerWithCitationsProps) {
  const { openCitation } = useCitation()
  const segments = useMemo(() => parseAnswerWithCitations(answer), [answer])

  const handleCitationClick = useCallback(
    (citationIndex: number) => {
      const citation = citations[citationIndex - 1]
      if (citation) {
        openCitation({
          citationIndex,
          factId: citation.id,
          documentId: citation.documentId,
          chunkId: citation.id,
          sourceText: citation.text,
          pageNumber: citation.pageNumber,
        })
      }
    },
    [citations, openCitation]
  )

  return (
    <p className="text-sm text-charcoal dark:text-cultured-white whitespace-pre-wrap leading-relaxed">
      {segments.map((segment, index) => {
        if (segment.type === 'citation' && segment.citationIndex !== undefined) {
          return (
            <button
              key={index}
              onClick={() => handleCitationClick(segment.citationIndex!)}
              className="inline-citation"
              title={`View source ${segment.citationIndex}`}
            >
              {segment.citationIndex}
            </button>
          )
        }
        return <span key={index}>{segment.content}</span>
      })}
    </p>
  )
}

// =============================================================================
// Citation Card Component
// =============================================================================

interface CitationCardProps {
  citation: AIAnswerCitation
  index: number
}

function CitationCard({ citation, index }: CitationCardProps) {
  const { openCitation } = useCitation()

  const handleClick = () => {
    openCitation({
      citationIndex: index,
      factId: citation.id,
      documentId: citation.documentId,
      chunkId: citation.id,
      sourceText: citation.text,
      pageNumber: citation.pageNumber,
    })
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-3 p-3 bg-[#2F7E8A]/5 hover:bg-[#2F7E8A]/10 border border-[#2F7E8A]/20 rounded-lg transition-colors text-left"
    >
      <div className="w-6 h-6 rounded-full bg-[#2F7E8A]/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-[#2F7E8A]">{index}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#2F7E8A] truncate">
            {citation.documentTitle}
          </span>
          {citation.pageNumber && (
            <span className="text-xs text-[#2F7E8A]/70">p.{citation.pageNumber}</span>
          )}
        </div>
        <p className="text-xs text-charcoal/70 dark:text-cultured-white/70 mt-1 line-clamp-2">
          {citation.text}
        </p>
      </div>
      <FileText className="w-4 h-4 text-[#2F7E8A]/50 shrink-0" />
    </button>
  )
}

// =============================================================================
// React Component
// =============================================================================

function AIAnswerCard({ node }: NodeViewProps) {
  const { question, answer, citations: citationsJson, createdAt } = node.attrs as AIAnswerAttributes

  const citations: AIAnswerCitation[] = useMemo(() => {
    try {
      return JSON.parse(citationsJson)
    } catch {
      return []
    }
  }, [citationsJson])

  const formattedDate = useMemo(() => {
    try {
      return new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }, [createdAt])

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange/10 rounded">
              <Sparkles className="w-4 h-4 text-orange" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
              AI Answer
            </h3>
          </div>
          {formattedDate && (
            <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
              {formattedDate}
            </span>
          )}
        </div>

        {/* Question */}
        <div className="px-4 pt-4">
          <p className="text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wide mb-1">
            Question
          </p>
          <p className="text-sm text-charcoal dark:text-cultured-white font-medium">
            {question}
          </p>
        </div>

        {/* Answer */}
        <div className="px-4 py-4 space-y-4">
          <div className="p-4 bg-alabaster dark:bg-surface-dark rounded-lg border-l-2 border-[#2F7E8A]">
            <AnswerWithCitations answer={answer} citations={citations} />
          </div>

          {/* Citations Summary */}
          {citations.length > 0 && (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wide hover:text-charcoal dark:hover:text-cultured-white transition-colors">
                <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                <span>Sources ({citations.length})</span>
              </summary>
              <div className="mt-2 space-y-2">
                {citations.map((citation, index) => (
                  <CitationCard
                    key={citation.id || index}
                    citation={citation}
                    index={index + 1}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default AIAnswerBlock
