// @ts-nocheck - Citation type mismatch
/**
 * QueryBlock - Tiptap extension for AI-powered diligence Q&A
 *
 * Provides an input for asking questions about deals/companies.
 * Uses the DiligenceAgent via tRPC for RAG-based answers with citations.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback, useRef, KeyboardEvent } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { api } from "@/trpc/react";

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
            {/* Answer Text */}
            <div className="p-4 bg-alabaster dark:bg-surface-dark rounded-lg">
              <p className="text-sm text-charcoal dark:text-cultured-white whitespace-pre-wrap leading-relaxed">
                {answer}
              </p>
            </div>

            {/* Citations */}
            {citations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wide">
                  Sources ({citations.length})
                </h4>
                <div className="space-y-2">
                  {citations.map((citation, index) => (
                    <div
                      key={citation.id || index}
                      className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 rounded-lg"
                    >
                      <div className="p-1.5 bg-teal-100 dark:bg-teal-900/50 rounded shrink-0">
                        <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-teal-700 dark:text-teal-400 truncate">
                            {citation.documentName}
                          </span>
                          {citation.pageNumber && (
                            <span className="text-xs text-teal-600/70 dark:text-teal-400/70">
                              Page {citation.pageNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal/70 dark:text-cultured-white/70 mt-1 line-clamp-2">
                          {citation.content}
                        </p>
                      </div>
                      <a
                        href={`/documents/${citation.documentId}`}
                        className="p-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors shrink-0"
                        title="View document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export default QueryBlock;
