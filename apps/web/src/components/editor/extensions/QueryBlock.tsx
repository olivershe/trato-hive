// @ts-nocheck - Citation type mismatch
/**
 * QueryBlock - Tiptap extension for AI-powered diligence Q&A
 *
 * Provides an input for asking questions about deals/companies.
 * Uses the DiligenceAgent via tRPC for RAG-based answers with citations.
 *
 * Phase 1 Enhancement: Inline citations [1][2] that reveal source on click.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback, useRef, useMemo, KeyboardEvent } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Sparkles,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useCitation } from "@/components/citation";

// =============================================================================
// Types
// =============================================================================

export interface QueryAttributes {
  query: string;
  dealId: string | null;
  companyId: string | null;
  status: "idle" | "loading" | "complete" | "error";
  answer: string | null;
  errorMessage: string | null;
}

interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  chunkId: string;
  content: string;
  pageNumber?: number;
  relevanceScore: number;
}

// =============================================================================
// Citation Parsing Utilities
// =============================================================================

interface ParsedSegment {
  type: "text" | "citation";
  content: string;
  citationIndex?: number;
}

/**
 * Parses an answer string for [[cite:N]] markers and returns segments.
 * Example: "Revenue is $50M [[cite:1]] with growth [[cite:2]]"
 * Returns: [{type: "text", content: "Revenue is $50M "}, {type: "citation", citationIndex: 1}, ...]
 */
function parseAnswerWithCitations(answer: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const citationRegex = /\[\[cite:(\d+)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(answer)) !== null) {
    // Add text before this citation
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: answer.slice(lastIndex, match.index),
      });
    }
    // Add the citation marker
    segments.push({
      type: "citation",
      content: `[${match[1]}]`,
      citationIndex: parseInt(match[1], 10),
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < answer.length) {
    segments.push({
      type: "text",
      content: answer.slice(lastIndex),
    });
  }

  return segments;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    queryBlock: {
      setQueryBlock: (attrs?: Partial<QueryAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Node Extension
// =============================================================================

export const QueryBlock = Node.create({
  name: "queryBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      query: { default: "" },
      dealId: { default: null },
      companyId: { default: null },
      status: { default: "idle" },
      answer: { default: null },
      errorMessage: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "query-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["query-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QueryCard);
  },

  addCommands() {
    return {
      setQueryBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "queryBlock",
            attrs: {
              query: "",
              dealId: null,
              companyId: null,
              status: "idle",
              answer: null,
              errorMessage: null,
              ...attrs,
            },
          });
        },
    };
  },
});

// =============================================================================
// Answer With Inline Citations Component
// =============================================================================

interface AnswerWithCitationsProps {
  answer: string;
  citations: Citation[];
}

/**
 * Renders the AI answer with inline clickable citation markers.
 * Citations like [[cite:1]] are rendered as teal [1] markers that
 * open the CitationSidebar when clicked.
 */
function AnswerWithCitations({ answer, citations }: AnswerWithCitationsProps) {
  const { openCitation } = useCitation();
  const segments = useMemo(() => parseAnswerWithCitations(answer), [answer]);

  const handleCitationClick = useCallback(
    (citationIndex: number) => {
      // Citations are 1-indexed in the text, array is 0-indexed
      const citation = citations[citationIndex - 1];
      if (citation) {
        openCitation({
          citationIndex,
          factId: citation.id,
          documentId: citation.documentId,
          chunkId: citation.chunkId,
          sourceText: citation.content,
          pageNumber: citation.pageNumber,
        });
      }
    },
    [citations, openCitation]
  );

  return (
    <p className="text-sm text-charcoal dark:text-cultured-white whitespace-pre-wrap leading-relaxed">
      {segments.map((segment, index) => {
        if (segment.type === "citation" && segment.citationIndex !== undefined) {
          return (
            <button
              key={index}
              onClick={() => handleCitationClick(segment.citationIndex!)}
              className="inline-citation"
              title={`View source ${segment.citationIndex}`}
            >
              {segment.citationIndex}
            </button>
          );
        }
        return <span key={index}>{segment.content}</span>;
      })}
    </p>
  );
}

// =============================================================================
// Citation Card Component (for collapsible list)
// =============================================================================

interface CitationCardProps {
  citation: Citation;
  index: number;
}

/**
 * Individual citation card in the collapsible sources list.
 * Also clickable to open the CitationSidebar.
 */
function CitationCard({ citation, index }: CitationCardProps) {
  const { openCitation } = useCitation();

  const handleClick = () => {
    openCitation({
      citationIndex: index,
      factId: citation.id,
      documentId: citation.documentId,
      chunkId: citation.chunkId,
      sourceText: citation.content,
      pageNumber: citation.pageNumber,
    });
  };

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
            {citation.documentName}
          </span>
          {citation.pageNumber && (
            <span className="text-xs text-[#2F7E8A]/70">
              p.{citation.pageNumber}
            </span>
          )}
        </div>
        <p className="text-xs text-charcoal/70 dark:text-cultured-white/70 mt-1 line-clamp-2">
          {citation.content}
        </p>
      </div>
      <FileText className="w-4 h-4 text-[#2F7E8A]/50 shrink-0" />
    </button>
  );
}

// =============================================================================
// React Component
// =============================================================================

function QueryCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as QueryAttributes;
  const { query, dealId, companyId, status, answer, errorMessage } = attrs;
  const [inputValue, setInputValue] = useState(query);
  const [citations, setCitations] = useState<Citation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mutation for asking questions
  const askMutation = api.diligence.askQuestion.useMutation({
    onSuccess: (data) => {
      updateAttributes({
        status: "complete",
        answer: data.answer,
        errorMessage: null,
      });
      // Store citations in local state (not persisted to block)
      if (data.citations) {
        setCitations(data.citations);
      }
    },
    onError: (error) => {
      updateAttributes({
        status: "error",
        answer: null,
        errorMessage: error.message,
      });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || status === "loading") return;

    updateAttributes({
      query: inputValue.trim(),
      status: "loading",
      answer: null,
      errorMessage: null,
    });
    setCitations([]);

    askMutation.mutate({
      question: inputValue.trim(),
      dealId: dealId || undefined,
      companyId: companyId || undefined,
    });
  }, [inputValue, status, dealId, companyId, askMutation, updateAttributes]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleRetry = useCallback(() => {
    if (query) {
      updateAttributes({
        status: "loading",
        answer: null,
        errorMessage: null,
      });
      setCitations([]);

      askMutation.mutate({
        question: query,
        dealId: dealId || undefined,
        companyId: companyId || undefined,
      });
    }
  }, [query, dealId, companyId, askMutation, updateAttributes]);

  const handleClear = useCallback(() => {
    setInputValue("");
    setCitations([]);
    updateAttributes({
      query: "",
      status: "idle",
      answer: null,
      errorMessage: null,
    });
    inputRef.current?.focus();
  }, [updateAttributes]);

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
              Ask AI
            </h3>
          </div>
          {status === "complete" && (
            <button
              onClick={handleClear}
              className="text-xs text-charcoal/50 dark:text-cultured-white/50 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this deal..."
                disabled={status === "loading"}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30 dark:text-cultured-white/30" />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim() || status === "loading"}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Ask
            </button>
          </div>
        </div>

        {/* Loading State */}
        {status === "loading" && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
              <div>
                <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
                  Analyzing documents...
                </p>
                <p className="text-xs text-violet-600/70 dark:text-violet-400/70">
                  Searching through relevant data to answer your question
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="px-4 pb-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Failed to get answer
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  {errorMessage || "An unexpected error occurred"}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Answer */}
        {status === "complete" && answer && (
          <div className="px-4 pb-4 space-y-4">
            {/* Answer Text with Inline Citations */}
            <div className="p-4 bg-alabaster dark:bg-surface-dark rounded-lg border-l-2 border-[#2F7E8A]">
              <AnswerWithCitations answer={answer} citations={citations} />
            </div>

            {/* Citations Summary - Collapsible reference list */}
            {citations.length > 0 && (
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wide hover:text-charcoal dark:hover:text-cultured-white transition-colors">
                  <span>Sources ({citations.length})</span>
                  <span className="text-[10px] normal-case font-normal">Click citation numbers above to view</span>
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
        )}
      </div>
    </NodeViewWrapper>
  );
}

export default QueryBlock;
