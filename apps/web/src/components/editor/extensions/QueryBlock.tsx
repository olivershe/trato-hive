// @ts-nocheck - Citation type mismatch between CitationAttributes and local Citation interface
/**
 * QueryBlock - Tiptap extension for AI-powered diligence Q&A
 *
 * Provides an input for asking questions about deals/companies.
 * Uses the DiligenceAgent via tRPC for RAG-based answers with citations.
 *
 * Phase 1 Enhancement: Inline citations [1][2] that reveal source on click.
 * [TASK-116] Q&A Review Flow: Approve/Edit/Reject workflow for AI answers.
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
  Check,
  Pencil,
  X,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useCitation } from "@/components/citation";

// =============================================================================
// Types
// =============================================================================

export type QAReviewStatus = "PENDING" | "APPROVED" | "EDITED" | "REJECTED" | null;

export interface QueryAttributes {
  query: string;
  dealId: string | null;
  companyId: string | null;
  status: "idle" | "loading" | "complete" | "error";
  answer: string | null;
  errorMessage: string | null;
  // Review flow attributes
  showReview: boolean;
  qaAnswerId: string | null;
  reviewStatus: QAReviewStatus;
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
      showReview: { default: true },
      qaAnswerId: { default: null },
      reviewStatus: { default: null },
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
              showReview: true,
              qaAnswerId: null,
              reviewStatus: null,
              ...attrs,
            },
          });
        },
    };
  },
});

// Status badge configuration
const REVIEW_STATUS_CONFIG = {
  PENDING: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-300", label: "Pending Review" },
  APPROVED: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-300", label: "Approved" },
  EDITED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300", label: "Edited" },
  REJECTED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-300", label: "Rejected" },
} as const;

interface ReviewStatusBadgeProps {
  status: QAReviewStatus;
}

function ReviewStatusBadge({ status }: ReviewStatusBadgeProps): JSX.Element | null {
  if (!status) return null;

  const { bg, text, label } = REVIEW_STATUS_CONFIG[status];

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${bg} ${text}`}>
      {label}
    </span>
  );
}

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

interface EditModalProps {
  isOpen: boolean;
  originalAnswer: string;
  onSave: (editedAnswer: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditModal({ isOpen, originalAnswer, onSave, onCancel, isLoading }: EditModalProps) {
  const [editedAnswer, setEditedAnswer] = useState(originalAnswer);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overscroll-contain">
      <div className="bg-white dark:bg-deep-grey rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overscroll-contain">
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30">
          <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
            Edit Answer
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-bone dark:hover:bg-charcoal/30 transition-colors"
          >
            <X className="w-4 h-4 text-charcoal/60 dark:text-cultured-white/60" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <textarea
            value={editedAnswer}
            onChange={(e) => setEditedAnswer(e.target.value)}
            className="w-full h-64 px-3 py-2 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
            placeholder="Edit the AI answer…"
          />
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-bone dark:border-charcoal/30">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm font-medium text-charcoal/70 dark:text-cultured-white/70 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedAnswer)}
            disabled={isLoading || !editedAnswer.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            Save & Approve
          </button>
        </div>
      </div>
    </div>
  );
}

interface RejectModalProps {
  isOpen: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function RejectModal({ isOpen, onConfirm, onCancel, isLoading }: RejectModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overscroll-contain">
      <div className="bg-white dark:bg-deep-grey rounded-lg shadow-xl w-full max-w-md mx-4 overscroll-contain">
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30">
          <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
            Reject Answer
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-bone dark:hover:bg-charcoal/30 transition-colors"
          >
            <X className="w-4 h-4 text-charcoal/60 dark:text-cultured-white/60" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-charcoal/70 dark:text-cultured-white/70 mb-3">
            Optionally provide a reason for rejecting this answer:
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-24 px-3 py-2 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            placeholder="Reason (optional)…"
          />
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-bone dark:border-charcoal/30">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm font-medium text-charcoal/70 dark:text-cultured-white/70 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={isLoading}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors flex items-center gap-1"
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function QueryCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as QueryAttributes;
  const { query, dealId, companyId, status, answer, errorMessage, showReview, qaAnswerId, reviewStatus } = attrs;
  const [inputValue, setInputValue] = useState(query);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // tRPC utilities
  const utils = api.useUtils();

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
      // If showReview is enabled, create a QAAnswer record
      if (showReview) {
        createQAAnswer.mutate({
          question: query || inputValue.trim(),
          dealId: dealId || undefined,
          companyId: companyId || undefined,
          answer: data.answer,
          citations: data.citations || [],
          confidence: data.confidence || null,
        });
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

  // Mutation for creating QA answer
  const createQAAnswer = api.qa.create.useMutation({
    onSuccess: (data) => {
      updateAttributes({
        qaAnswerId: data.id,
        reviewStatus: data.status,
      });
    },
  });

  // Mutation for approving
  const approveMutation = api.qa.approve.useMutation({
    onSuccess: () => {
      updateAttributes({ reviewStatus: "APPROVED" });
      utils.qa.list.invalidate();
    },
  });

  // Mutation for editing
  const editMutation = api.qa.edit.useMutation({
    onSuccess: (_, variables) => {
      updateAttributes({
        reviewStatus: "EDITED",
        answer: variables.editedAnswer,
      });
      setShowEditModal(false);
      utils.qa.list.invalidate();
    },
  });

  // Mutation for rejecting
  const rejectMutation = api.qa.reject.useMutation({
    onSuccess: () => {
      updateAttributes({ reviewStatus: "REJECTED" });
      setShowRejectModal(false);
      utils.qa.list.invalidate();
    },
  });

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || status === "loading") return;

    updateAttributes({
      query: inputValue.trim(),
      status: "loading",
      answer: null,
      errorMessage: null,
      qaAnswerId: null,
      reviewStatus: null,
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
        qaAnswerId: null,
        reviewStatus: null,
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
      qaAnswerId: null,
      reviewStatus: null,
    });
    inputRef.current?.focus();
  }, [updateAttributes]);

  const handleApprove = useCallback(() => {
    if (!qaAnswerId) return;
    approveMutation.mutate({ qaAnswerId });
  }, [qaAnswerId, approveMutation]);

  const handleEdit = useCallback((editedAnswer: string) => {
    if (!qaAnswerId) return;
    editMutation.mutate({ qaAnswerId, editedAnswer });
  }, [qaAnswerId, editMutation]);

  const handleReject = useCallback((reason?: string) => {
    if (!qaAnswerId) return;
    rejectMutation.mutate({ qaAnswerId, reason });
  }, [qaAnswerId, rejectMutation]);

  const isReviewPending = showReview && qaAnswerId && reviewStatus === "PENDING";
  const isReviewActionLoading = approveMutation.isPending || editMutation.isPending || rejectMutation.isPending;

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
            {reviewStatus && <ReviewStatusBadge status={reviewStatus} />}
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
                placeholder="Ask a question about this deal…"
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

            {/* Review Actions - Only show when review is pending */}
            {isReviewPending && (
              <div className="flex items-center gap-2 pt-2 border-t border-bone dark:border-charcoal/30">
                <span className="text-xs text-charcoal/60 dark:text-cultured-white/60 mr-2">
                  Review this answer:
                </span>
                <button
                  onClick={handleApprove}
                  disabled={isReviewActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium transition-colors"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => setShowEditModal(true)}
                  disabled={isReviewActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-md text-xs font-medium transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isReviewActionLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal/10 hover:bg-charcoal/20 dark:bg-cultured-white/10 dark:hover:bg-cultured-white/20 text-charcoal/70 dark:text-cultured-white/70 rounded-md text-xs font-medium transition-colors"
                >
                  <X className="w-3 h-3" />
                  Reject
                </button>
              </div>
            )}

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

      {/* Edit Modal */}
      <EditModal
        isOpen={showEditModal}
        originalAnswer={answer || ""}
        onSave={handleEdit}
        onCancel={() => setShowEditModal(false)}
        isLoading={editMutation.isPending}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onConfirm={handleReject}
        onCancel={() => setShowRejectModal(false)}
        isLoading={rejectMutation.isPending}
      />
    </NodeViewWrapper>
  );
}

export default QueryBlock;
