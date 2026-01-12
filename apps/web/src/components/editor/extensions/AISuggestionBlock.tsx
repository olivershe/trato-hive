// @ts-nocheck - Tiptap type mismatch
/**
 * AI Suggestion Block
 *
 * Tiptap extension for displaying AI-suggested field updates.
 * Shows current vs suggested values with Accept/Dismiss actions.
 *
 * Design: Gold accent (#EE8D1D), "AI SUGGESTS" badge, confidence indicator
 * Pattern: Follows CitationBlock architecture
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { Sparkles, Check, X, FileText, Info, ArrowRight } from "lucide-react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

// =============================================================================
// Types
// =============================================================================

export type SuggestionEntityType = "Deal" | "Company" | "Database";
export type SuggestionStatus = "pending" | "accepted" | "dismissed";

export interface AISuggestionAttributes {
  suggestionId: string;
  entityType: SuggestionEntityType;
  entityId: string;
  field?: string;
  columnId?: string;
  entryId?: string;
  currentValue?: unknown;
  suggestedValue: unknown;
  confidence: number;
  factIds: string[];
  sourceText?: string;
  documentName?: string;
  status: SuggestionStatus;
}

// =============================================================================
// Tiptap Command Extension
// =============================================================================

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiSuggestionBlock: {
      setAISuggestionBlock: (attrs: Partial<AISuggestionAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Node Extension
// =============================================================================

export const AISuggestionBlock = Node.create({
  name: "aiSuggestionBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      suggestionId: { default: null },
      entityType: { default: "Deal" },
      entityId: { default: null },
      field: { default: null },
      columnId: { default: null },
      entryId: { default: null },
      currentValue: { default: null },
      suggestedValue: { default: null },
      confidence: { default: 0 },
      factIds: { default: [] },
      sourceText: { default: null },
      documentName: { default: null },
      status: { default: "pending" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "ai-suggestion-block",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["ai-suggestion-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AISuggestionCard);
  },

  addCommands() {
    return {
      setAISuggestionBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "aiSuggestionBlock",
            attrs: {
              suggestionId: attrs.suggestionId || `suggestion_${Date.now()}`,
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

interface AISuggestionCardProps {
  node: {
    attrs: AISuggestionAttributes;
  };
  updateAttributes: (attrs: Partial<AISuggestionAttributes>) => void;
  deleteNode: () => void;
}

function AISuggestionCard({ node, updateAttributes, deleteNode }: AISuggestionCardProps) {
  const {
    suggestionId,
    entityType,
    entityId,
    field,
    columnId,
    currentValue,
    suggestedValue,
    confidence,
    factIds,
    sourceText,
    documentName,
    status,
  } = node.attrs;

  // Confidence color coding
  const confidenceColor =
    confidence > 0.9
      ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-800"
      : confidence > 0.7
        ? "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800"
        : "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800";

  // Format values for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  // Handle accept action
  const handleAccept = async () => {
    // Update status optimistically
    updateAttributes({ status: "accepted" });

    // The actual API call would be made by the parent component
    // listening to status changes, or via a callback prop
    // For now, we just update the visual state

    // Remove block after short delay to show success state
    setTimeout(() => {
      deleteNode();
    }, 1500);
  };

  // Handle dismiss action
  const handleDismiss = async () => {
    updateAttributes({ status: "dismissed" });

    // Remove block after short delay
    setTimeout(() => {
      deleteNode();
    }, 500);
  };

  // Render based on status
  if (status === "accepted") {
    return (
      <NodeViewWrapper className="my-4">
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300">
          <Check className="w-5 h-5" />
          <span className="font-medium">Suggestion accepted</span>
        </div>
      </NodeViewWrapper>
    );
  }

  if (status === "dismissed") {
    return (
      <NodeViewWrapper className="my-4">
        <div className="flex items-center gap-2 p-3 bg-charcoal/5 dark:bg-charcoal/20 border border-charcoal/20 rounded-lg text-charcoal/60 dark:text-cultured-white/60">
          <X className="w-5 h-5" />
          <span>Suggestion dismissed</span>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-6">
      <Tippy
        content={
          sourceText ? (
            <div className="max-w-xs p-2 text-xs">
              <p className="font-semibold text-white/90 mb-1">Source Excerpt:</p>
              <p className="italic text-white/80">&quot;{sourceText}&quot;</p>
              {documentName && (
                <div className="mt-2 flex items-center text-white/60 border-t border-white/20 pt-1">
                  <FileText className="w-3 h-3 mr-1" />
                  {documentName}
                </div>
              )}
              {factIds.length > 0 && (
                <div className="mt-1 text-white/50 text-[10px]">
                  Based on {factIds.length} fact{factIds.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 text-xs text-white/80">
              AI-generated suggestion
            </div>
          )
        }
        theme="dark"
        arrow={true}
        interactive={true}
      >
        <div className="group relative flex flex-col gap-3 p-4 bg-alabaster dark:bg-surface-dark border-2 border-orange/40 dark:border-orange/30 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* AI Icon */}
              <div className="p-1.5 rounded-md bg-orange/10 dark:bg-orange/20">
                <Sparkles className="w-4 h-4 text-orange" />
              </div>
              {/* Badge */}
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange font-semibold">
                AI SUGGESTS
              </span>
              {/* Confidence */}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${confidenceColor}`}
              >
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>

            {/* Info icon */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-orange">
              <Info className="w-4 h-4" />
            </div>
          </div>

          {/* Entity context */}
          <div className="text-[11px] text-charcoal/60 dark:text-cultured-white/60">
            {entityType} • {field || columnId || "field"}
          </div>

          {/* Value comparison */}
          <div className="flex items-center gap-3 p-3 bg-bone/50 dark:bg-panel-dark rounded-md">
            {/* Current value */}
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 mb-1">
                Current
              </div>
              <div className="font-medium text-charcoal/70 dark:text-cultured-white/70">
                {formatValue(currentValue)}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-5 h-5 text-orange flex-shrink-0" />

            {/* Suggested value */}
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-orange/80 mb-1">
                Suggested
              </div>
              <div className="font-semibold text-charcoal dark:text-cultured-white">
                {formatValue(suggestedValue)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange hover:bg-deep-orange text-white font-medium text-sm rounded-md transition-colors"
            >
              <Check className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-charcoal/10 hover:bg-charcoal/20 dark:bg-cultured-white/10 dark:hover:bg-cultured-white/20 text-charcoal dark:text-cultured-white font-medium text-sm rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      </Tippy>
    </NodeViewWrapper>
  );
}
