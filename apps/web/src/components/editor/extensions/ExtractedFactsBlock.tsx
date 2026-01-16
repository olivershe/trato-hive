/**
 * ExtractedFactsBlock - Tiptap extension for displaying extracted facts
 *
 * Shows facts extracted from a document, grouped by type.
 * Clicking a fact opens the citation sidebar with source location.
 *
 * [TASK-112] Document Page Template
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useMemo } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  User,
  Package,
  Users,
  AlertTriangle,
  Lightbulb,
  FileText,
  Tag,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useCitation } from "@/components/citation";

// =============================================================================
// Types
// =============================================================================

export interface ExtractedFactsBlockAttributes {
  documentId: string;
  title: string;
  maxItems: number;
  groupByType: boolean;
}

interface Fact {
  id: string;
  type: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sourceChunkId: string | null;
  sourceText: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    extractedFactsBlock: {
      setExtractedFactsBlock: (
        attrs: Partial<ExtractedFactsBlockAttributes>
      ) => ReturnType;
    };
  }
}

// =============================================================================
// Node Extension
// =============================================================================

export const ExtractedFactsBlock = Node.create({
  name: "extractedFactsBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      documentId: { default: "" },
      title: { default: "Extracted Facts" },
      maxItems: { default: 50 },
      groupByType: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: "extracted-facts-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["extracted-facts-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExtractedFactsCard);
  },

  addCommands() {
    return {
      setExtractedFactsBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "extractedFactsBlock",
            attrs: {
              documentId: "",
              title: "Extracted Facts",
              maxItems: 50,
              groupByType: true,
              ...attrs,
            },
          });
        },
    };
  },
});

// =============================================================================
// Fact Type Icons and Styles
// =============================================================================

const FACT_TYPE_CONFIG: Record<
  string,
  { icon: typeof DollarSign; bg: string; text: string; label: string }
> = {
  FINANCIAL_METRIC: {
    icon: DollarSign,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Financial",
  },
  KEY_PERSON: {
    icon: User,
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    label: "Key People",
  },
  PRODUCT: {
    icon: Package,
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
    label: "Products",
  },
  CUSTOMER: {
    icon: Users,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    label: "Customers",
  },
  RISK: {
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    label: "Risks",
  },
  OPPORTUNITY: {
    icon: Lightbulb,
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-600 dark:text-yellow-400",
    label: "Opportunities",
  },
  OTHER: {
    icon: Tag,
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-600 dark:text-gray-400",
    label: "Other",
  },
};

function getFactTypeConfig(type: string) {
  return FACT_TYPE_CONFIG[type] || FACT_TYPE_CONFIG.OTHER;
}

// =============================================================================
// Fact Card Component
// =============================================================================

interface FactCardProps {
  fact: Fact;
  index: number;
  documentId: string;
}

function FactCard({ fact, index, documentId }: FactCardProps) {
  const { openCitation } = useCitation();
  const config = getFactTypeConfig(fact.type);
  const Icon = config.icon;

  const handleClick = () => {
    openCitation({
      citationIndex: index,
      factId: fact.id,
      documentId,
      chunkId: fact.sourceChunkId || "",
      sourceText: fact.sourceText || fact.object,
    });
  };

  // Format confidence as percentage
  const confidencePercent = Math.round(fact.confidence * 100);
  const confidenceColor =
    confidencePercent >= 80
      ? "text-emerald-600"
      : confidencePercent >= 60
      ? "text-amber-600"
      : "text-red-600";

  return (
    <button
      onClick={handleClick}
      className="w-full text-left p-3 bg-white dark:bg-charcoal/20 hover:bg-alabaster dark:hover:bg-charcoal/30 border border-bone dark:border-charcoal/30 rounded-lg transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`p-1.5 rounded ${config.bg}`}>
          <Icon className={`w-4 h-4 ${config.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-charcoal dark:text-cultured-white">
              {fact.subject}
            </span>
            <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
              {fact.predicate}
            </span>
          </div>
          <p className="text-sm text-charcoal/80 dark:text-cultured-white/80 line-clamp-2">
            {fact.object}
          </p>
        </div>

        {/* Confidence & Citation Link */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-medium ${confidenceColor}`}>
            {confidencePercent}%
          </span>
          <span className="inline-citation opacity-0 group-hover:opacity-100 transition-opacity">
            {index}
          </span>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// Fact Group Component
// =============================================================================

interface FactGroupProps {
  type: string;
  facts: Fact[];
  documentId: string;
  startIndex: number;
}

function FactGroup({ type, facts, documentId, startIndex }: FactGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = getFactTypeConfig(type);
  const Icon = config.icon;

  return (
    <div className="border border-bone dark:border-charcoal/30 rounded-lg overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-alabaster dark:bg-surface-dark hover:bg-bone dark:hover:bg-charcoal/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${config.bg}`}>
            <Icon className={`w-4 h-4 ${config.text}`} />
          </div>
          <span className="text-sm font-semibold text-charcoal dark:text-cultured-white">
            {config.label}
          </span>
          <span className="text-xs text-charcoal/50 dark:text-cultured-white/50 bg-bone dark:bg-charcoal/30 px-1.5 py-0.5 rounded-full">
            {facts.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-charcoal/50 dark:text-cultured-white/50" />
        ) : (
          <ChevronRight className="w-4 h-4 text-charcoal/50 dark:text-cultured-white/50" />
        )}
      </button>

      {/* Group Content */}
      {isExpanded && (
        <div className="p-3 space-y-2 bg-white dark:bg-deep-grey">
          {facts.map((fact, idx) => (
            <FactCard
              key={fact.id}
              fact={fact}
              index={startIndex + idx + 1}
              documentId={documentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// React Component
// =============================================================================

function ExtractedFactsCard({ node }: { node: any }) {
  const attrs = node.attrs as ExtractedFactsBlockAttributes;
  const { documentId, title, maxItems, groupByType } = attrs;

  // Fetch facts for this document
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: facts, isLoading } = (api as any).document?.getFacts?.useQuery?.(
    { documentId, limit: maxItems },
    { enabled: !!documentId }
  ) ?? { data: undefined, isLoading: true };

  // Group facts by type
  const groupedFacts = useMemo(() => {
    if (!facts || !groupByType) return null;

    const groups: Record<string, Fact[]> = {};
    for (const fact of facts) {
      const type = fact.type || "OTHER";
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(fact);
    }
    return groups;
  }, [facts, groupByType]);

  // Calculate starting indices for each group (for citation numbering)
  const groupStartIndices = useMemo(() => {
    if (!groupedFacts) return {};

    const indices: Record<string, number> = {};
    const typeOrder = Object.keys(FACT_TYPE_CONFIG);
    let currentIndex = 0;

    for (const type of typeOrder) {
      if (groupedFacts[type]) {
        indices[type] = currentIndex;
        currentIndex += groupedFacts[type].length;
      }
    }

    // Handle any types not in the config
    for (const type of Object.keys(groupedFacts)) {
      if (!(type in indices)) {
        indices[type] = currentIndex;
        currentIndex += groupedFacts[type].length;
      }
    }

    return indices;
  }, [groupedFacts]);

  // Loading state
  if (isLoading) {
    return (
      <NodeViewWrapper className="my-6 font-sans">
        <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-orange" />
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Empty state
  if (!facts || facts.length === 0) {
    return (
      <NodeViewWrapper className="my-6 font-sans">
        <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
            <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange" />
              {title}
            </h3>
          </div>
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-charcoal/20 dark:text-cultured-white/20" />
            <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
              No facts extracted yet
            </p>
            <p className="text-xs text-charcoal/40 dark:text-cultured-white/40 mt-1">
              Facts will appear after document processing completes
            </p>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark flex items-center justify-between">
          <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange" />
            {title}
          </h3>
          <span className="text-xs text-charcoal/50 dark:text-cultured-white/50 bg-bone dark:bg-charcoal/30 px-2 py-0.5 rounded-full">
            {facts.length} facts
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          {groupByType && groupedFacts ? (
            <div className="space-y-3">
              {Object.keys(FACT_TYPE_CONFIG).map((type) => {
                const typeFacts = groupedFacts[type];
                if (!typeFacts || typeFacts.length === 0) return null;
                return (
                  <FactGroup
                    key={type}
                    type={type}
                    facts={typeFacts}
                    documentId={documentId}
                    startIndex={groupStartIndices[type]}
                  />
                );
              })}
              {/* Render any remaining types not in config */}
              {Object.keys(groupedFacts)
                .filter((type) => !(type in FACT_TYPE_CONFIG))
                .map((type) => (
                  <FactGroup
                    key={type}
                    type={type}
                    facts={groupedFacts[type]}
                    documentId={documentId}
                    startIndex={groupStartIndices[type]}
                  />
                ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(facts as Fact[]).map((fact: Fact, idx: number) => (
                <FactCard
                  key={fact.id}
                  fact={fact}
                  index={idx + 1}
                  documentId={documentId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export default ExtractedFactsBlock;
