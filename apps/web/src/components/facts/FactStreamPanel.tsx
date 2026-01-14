"use client";

/**
 * FactStreamPanel - Real-time fact extraction display
 *
 * Shows facts being extracted from documents in real-time via SSE.
 * Part of Phase 2: Real-Time Fact Streaming.
 *
 * Features:
 * - Live connection status indicator
 * - Processing documents with spinner
 * - Facts grouped by type with animations
 * - Click-to-cite integration with CitationSidebar
 */
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  User,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText,
  RefreshCw,
} from "lucide-react";
import {
  useDocumentProcessingStream,
  type DocumentStatus,
  type ExtractedFact,
} from "@/hooks/useDocumentProcessingStream";
import { useCitation } from "@/components/citation";

// =============================================================================
// Configuration
// =============================================================================

const FACT_TYPE_CONFIG = {
  FINANCIAL_METRIC: {
    icon: DollarSign,
    label: "Financial Metrics",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    barColor: "bg-emerald-500",
  },
  KEY_PERSON: {
    icon: User,
    label: "Key People",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    barColor: "bg-blue-500",
  },
  RISK: {
    icon: AlertTriangle,
    label: "Identified Risks",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    barColor: "bg-red-500",
  },
  OPPORTUNITY: {
    icon: TrendingUp,
    label: "Opportunities",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    barColor: "bg-purple-500",
  },
  DATE: {
    icon: Calendar,
    label: "Key Dates",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    barColor: "bg-amber-500",
  },
  OTHER: {
    icon: FileText,
    label: "Other Facts",
    color: "text-gray-600",
    bg: "bg-gray-50 dark:bg-gray-900/20",
    barColor: "bg-gray-500",
  },
} as const;

type FactType = keyof typeof FACT_TYPE_CONFIG;

// =============================================================================
// Component
// =============================================================================

interface FactStreamPanelProps {
  /** Deal ID to stream facts for */
  dealId: string;
  /** Maximum facts to show per type (default: 5) */
  maxFactsPerType?: number;
  /** Whether to show processing documents section */
  showProcessingDocs?: boolean;
}

export function FactStreamPanel({
  dealId,
  maxFactsPerType = 5,
  showProcessingDocs = true,
}: FactStreamPanelProps) {
  const {
    isConnected,
    documentStatuses,
    extractedFacts,
    error,
    reconnect,
    clearFacts,
  } = useDocumentProcessingStream(dealId);
  const { openCitation } = useCitation();

  // Group facts by type
  const factsByType = useMemo(() => {
    const grouped: Record<string, ExtractedFact[]> = {};
    for (const fact of extractedFacts) {
      const type = fact.type as FactType;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(fact);
    }
    return grouped;
  }, [extractedFacts]);

  // Get processing documents (not yet indexed)
  const processingDocs = useMemo(() => {
    return Array.from(documentStatuses.values()).filter(
      (doc) => doc.status !== "indexed"
    );
  }, [documentStatuses]);

  // Handle fact click - open citation sidebar
  const handleFactClick = (fact: ExtractedFact) => {
    openCitation({
      citationIndex: 0,
      factId: fact.id,
      documentId: fact.documentId,
      chunkId: "",
      sourceText: fact.sourceText,
    });
  };

  return (
    <div className="bg-alabaster dark:bg-panel-dark rounded-xl border border-bone dark:border-deep-grey overflow-hidden">
      {/* Header with connection status */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-deep-grey">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-[#2F7E8A] rounded-full" />
          <h3 className="font-semibold text-deep-grey dark:text-white">
            Extracted Facts
          </h3>
          <span className="text-xs bg-[#2F7E8A]/10 text-[#2F7E8A] px-2 py-0.5 rounded-full">
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
            <span className="text-xs text-deep-grey/60 dark:text-white/60">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* Reconnect button if disconnected */}
          {!isConnected && (
            <button
              onClick={reconnect}
              className="p-1.5 hover:bg-bone dark:hover:bg-deep-grey rounded-lg transition-colors"
              title="Reconnect"
            >
              <RefreshCw className="w-4 h-4 text-deep-grey/60" />
            </button>
          )}

          {/* Clear facts button */}
          {extractedFacts.length > 0 && (
            <button
              onClick={clearFacts}
              className="text-xs text-deep-grey/40 hover:text-deep-grey/60 dark:text-white/40 dark:hover:text-white/60"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error.message}
        </div>
      )}

      {/* Processing documents */}
      {showProcessingDocs && processingDocs.length > 0 && (
        <div className="px-4 py-3 border-b border-bone dark:border-deep-grey">
          <p className="text-xs font-medium text-deep-grey/60 dark:text-white/60 mb-2">
            Processing Documents
          </p>
          <div className="space-y-2">
            {processingDocs.map((doc) => (
              <ProcessingDocumentRow key={doc.documentId} document={doc} />
            ))}
          </div>
        </div>
      )}

      {/* Facts by type */}
      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {Object.entries(factsByType).map(([type, facts]) => {
          const config = FACT_TYPE_CONFIG[type as FactType];
          if (!config) return null;

          return (
            <FactTypeSection
              key={type}
              type={type as FactType}
              facts={facts}
              config={config}
              maxFacts={maxFactsPerType}
              onFactClick={handleFactClick}
            />
          );
        })}

        {/* Empty state */}
        {extractedFacts.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-deep-grey/20 dark:text-white/20 mx-auto mb-2" />
            <p className="text-sm text-deep-grey/40 dark:text-white/40">
              {isConnected
                ? "Waiting for documents to process..."
                : "Connect to see extracted facts"}
            </p>
          </div>
        )}
      </div>

      {/* Footer with fact count */}
      {extractedFacts.length > 0 && (
        <div className="px-4 py-2 border-t border-bone dark:border-deep-grey text-xs text-deep-grey/40 dark:text-white/40">
          {extractedFacts.length} facts extracted
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ProcessingDocumentRowProps {
  document: DocumentStatus;
}

function ProcessingDocumentRow({ document }: ProcessingDocumentRowProps) {
  const statusText = {
    uploading: "Uploading...",
    parsing: "Parsing document...",
    extracting: "Extracting facts...",
    indexed: "Complete",
    error: "Error",
  };

  return (
    <div className="flex items-center gap-2 text-sm text-deep-grey/80 dark:text-white/80">
      {document.status === "error" ? (
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin flex-shrink-0" />
      )}
      <span className="truncate flex-1">{document.documentName}</span>
      <span className="text-xs text-deep-grey/40 dark:text-white/40 flex-shrink-0">
        {statusText[document.status]}
      </span>
    </div>
  );
}

interface FactTypeSectionProps {
  type: FactType;
  facts: ExtractedFact[];
  config: (typeof FACT_TYPE_CONFIG)[FactType];
  maxFacts: number;
  onFactClick: (fact: ExtractedFact) => void;
}

function FactTypeSection({
  type: _type, // Used as key in parent
  facts,
  config,
  maxFacts,
  onFactClick,
}: FactTypeSectionProps) {
  const Icon = config.icon;
  const visibleFacts = facts.slice(-maxFacts);
  const hiddenCount = facts.length - maxFacts;

  return (
    <div>
      {/* Type header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1 rounded ${config.bg}`}>
          <Icon className={`w-3 h-3 ${config.color}`} />
        </div>
        <span className="text-xs font-medium text-deep-grey/60 dark:text-white/60 uppercase">
          {config.label} ({facts.length})
        </span>
      </div>

      {/* Facts list */}
      <AnimatePresence mode="popLayout">
        {visibleFacts.map((fact) => (
          <motion.div
            key={fact.id}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => onFactClick(fact)}
            className="ml-6 mb-2 p-2 bg-white dark:bg-deep-grey rounded-lg
                       border border-bone dark:border-deep-grey/50
                       cursor-pointer hover:border-[#2F7E8A] transition-colors"
          >
            <p className="text-sm text-deep-grey dark:text-white">
              <span className="font-medium">{fact.subject}</span> {fact.predicate}{" "}
              <span className="font-medium">{fact.object}</span>
            </p>

            {/* Confidence bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${config.barColor} rounded-full`}
                  style={{ width: `${fact.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-deep-grey/40 dark:text-white/40">
                {Math.round(fact.confidence * 100)}%
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Hidden count */}
      {hiddenCount > 0 && (
        <p className="ml-6 text-xs text-deep-grey/40 dark:text-white/40">
          +{hiddenCount} more
        </p>
      )}
    </div>
  );
}

// Export for index
export default FactStreamPanel;
