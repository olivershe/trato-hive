// @ts-nocheck - Tiptap NodeViewProps type flexibility for updateAttributes
/**
 * CompanyEmbedBlock - Tiptap extension for embedding company cards
 *
 * [CompanyEmbedBlock] Embed company profile cards within deal pages
 *
 * Features:
 * - Company picker modal when companyId is null
 * - Compact and full display modes
 * - Deal history table (full mode)
 * - Related companies grid (full mode)
 * - Actions: View, Expand/Collapse, Change, Remove
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Loader2,
  Users,
  MapPin,
  Globe,
  DollarSign,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Search,
  LinkIcon,
  Briefcase,
  ArrowUpRight,
  Calendar,
  Sparkles,
} from "lucide-react";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface CompanyEmbedBlockAttributes {
  companyId: string | null;
  displayMode: "compact" | "full";
}

interface CompanySearchResult {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  employees: number | null;
}

// =============================================================================
// Tiptap Type Augmentation
// =============================================================================

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    companyEmbedBlock: {
      setCompanyEmbedBlock: (attrs?: Partial<CompanyEmbedBlockAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_BADGE_STYLES: Record<string, string> = {
  PROSPECT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RESEARCHING: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  ENGAGED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PIPELINE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ARCHIVED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

const STAGE_COLORS: Record<string, string> = {
  SOURCING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  INITIAL_REVIEW: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  PRELIMINARY_DUE_DILIGENCE: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  DEEP_DUE_DILIGENCE: "bg-orange/20 text-orange dark:bg-orange/30 dark:text-faded-orange",
  NEGOTIATION: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CLOSING: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CLOSED_WON: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED_LOST: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ROLE_COLORS: Record<string, string> = {
  PLATFORM: "bg-charcoal text-white dark:bg-cultured-white dark:text-charcoal",
  ADD_ON: "bg-orange/20 text-orange dark:bg-orange/30 dark:text-faded-orange",
  SELLER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  BUYER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ADVISOR: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

// =============================================================================
// Helper Functions
// =============================================================================

function formatStatusName(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatStageName(stage: string): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatRoleName(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatRevenue(revenue: number | null): string {
  if (!revenue) return "N/A";
  if (revenue >= 1_000_000_000) return `$${(revenue / 1_000_000_000).toFixed(1)}B`;
  if (revenue >= 1_000_000) return `$${(revenue / 1_000_000).toFixed(0)}M`;
  if (revenue >= 1_000) return `$${(revenue / 1_000).toFixed(0)}K`;
  return `$${revenue.toFixed(0)}`;
}

function formatEmployees(employees: number | null): string {
  if (!employees) return "N/A";
  if (employees >= 10_000) return `${(employees / 1_000).toFixed(0)}K+`;
  if (employees >= 1_000) return `${(employees / 1_000).toFixed(1)}K`;
  return employees.toLocaleString();
}

function formatValue(value: number | null, currency: string): string {
  if (!value) return "—";
  const formatted =
    value >= 1_000_000_000
      ? `${(value / 1_000_000_000).toFixed(1)}B`
      : value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(0)}M`
      : value >= 1_000
      ? `${(value / 1_000).toFixed(0)}K`
      : value.toFixed(0);
  return `${currency === "USD" ? "$" : currency + " "}${formatted}`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
}

// =============================================================================
// Tiptap Extension
// =============================================================================

export const CompanyEmbedBlock = Node.create({
  name: "companyEmbedBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      companyId: { default: null },
      displayMode: { default: "compact" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="company-embed-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "company-embed-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CompanyEmbedCard);
  },

  addCommands() {
    return {
      setCompanyEmbedBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "companyEmbedBlock",
            attrs: { companyId: null, displayMode: "compact", ...attrs },
          });
        },
    };
  },
});

// =============================================================================
// Company Picker Modal
// =============================================================================

interface CompanyPickerProps {
  dealId?: string;
  onSelect: (companyId: string) => void;
  onClose: () => void;
}

function CompanyPicker({ dealId, onSelect, onClose }: CompanyPickerProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search companies
  const { data, isLoading } = api.company.searchForEmbed.useQuery(
    { query, dealId, limit: 10 },
    { enabled: true }
  );

  const linkedCompanies = data?.linkedCompanies || [];
  const searchResults = data?.searchResults || [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-deep-grey rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 dark:border-white/10">
          <h3 className="font-semibold text-charcoal dark:text-cultured-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange" />
            Select Company
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-bone dark:hover:bg-panel-dark transition-colors"
          >
            <X className="w-5 h-5 text-charcoal/50 dark:text-cultured-white/50" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-gold/5 dark:border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 dark:text-cultured-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-10 pr-4 py-2 bg-bone dark:bg-panel-dark rounded-lg text-sm text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange" />
            </div>
          ) : (
            <>
              {/* Linked Companies */}
              {linkedCompanies.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-medium text-charcoal/50 dark:text-cultured-white/50 uppercase tracking-wider flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" />
                    Linked to Deal
                  </div>
                  {linkedCompanies.map((company) => (
                    <CompanySearchItem
                      key={company.id}
                      company={company}
                      onSelect={onSelect}
                      isLinked
                    />
                  ))}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="p-2 border-t border-gold/5 dark:border-white/5">
                  <div className="px-2 py-1 text-xs font-medium text-charcoal/50 dark:text-cultured-white/50 uppercase tracking-wider">
                    {query ? "Search Results" : "All Companies"}
                  </div>
                  {searchResults.map((company) => (
                    <CompanySearchItem
                      key={company.id}
                      company={company}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {linkedCompanies.length === 0 && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-charcoal/50 dark:text-cultured-white/50">
                  <Building2 className="w-8 h-8 mb-2" />
                  <p className="text-sm">No companies found</p>
                  {query && (
                    <p className="text-xs mt-1">
                      Try a different search term
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface CompanySearchItemProps {
  company: CompanySearchResult;
  onSelect: (companyId: string) => void;
  isLinked?: boolean;
}

function CompanySearchItem({ company, onSelect, isLinked }: CompanySearchItemProps) {
  return (
    <button
      onClick={() => onSelect(company.id)}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bone dark:hover:bg-panel-dark transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0">
        <Building2 className="w-4 h-4 text-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-charcoal dark:text-cultured-white truncate flex items-center gap-2">
          {company.name}
          {isLinked && (
            <LinkIcon className="w-3 h-3 text-orange" />
          )}
        </div>
        <div className="text-xs text-charcoal/50 dark:text-cultured-white/50 truncate">
          {[company.industry, company.location].filter(Boolean).join(" • ") || "No details"}
        </div>
      </div>
      {company.employees && (
        <div className="flex items-center gap-1 text-xs text-charcoal/40 dark:text-cultured-white/40">
          <Users className="w-3 h-3" />
          {formatEmployees(company.employees)}
        </div>
      )}
    </button>
  );
}

// =============================================================================
// React Component
// =============================================================================

function CompanyEmbedCard({ node, updateAttributes }: NodeViewProps) {
  const { companyId, displayMode } = node.attrs as CompanyEmbedBlockAttributes;
  const [showPicker, setShowPicker] = useState(companyId === null);
  const params = useParams();
  const dealId = params?.id as string | undefined;

  // Determine if we need expanded data
  const needsExpandedData = displayMode === "full";

  // Fetch company data
  const { data, isLoading, error } = api.company.getForEmbed.useQuery(
    {
      id: companyId || "",
      includeDealHistory: needsExpandedData,
      includeRelatedCompanies: needsExpandedData,
    },
    { enabled: !!companyId }
  );

  // Handle company selection from picker
  const handleSelectCompany = useCallback(
    (selectedId: string) => {
      updateAttributes({ companyId: selectedId });
      setShowPicker(false);
    },
    [updateAttributes]
  );

  // Handle change company
  const handleChange = useCallback(() => {
    setShowPicker(true);
  }, []);

  // Handle remove (reset to picker state)
  const handleRemove = useCallback(() => {
    updateAttributes({ companyId: null });
    setShowPicker(true);
  }, [updateAttributes]);

  // Handle toggle display mode
  const handleToggleMode = useCallback(() => {
    updateAttributes({ displayMode: displayMode === "compact" ? "full" : "compact" });
  }, [displayMode, updateAttributes]);

  // Show picker when companyId is null
  if (showPicker) {
    return (
      <NodeViewWrapper className="my-4 font-sans">
        <CompanyPicker
          dealId={dealId}
          onSelect={handleSelectCompany}
          onClose={() => {
            if (companyId) {
              setShowPicker(false);
            }
          }}
        />
        {/* Placeholder while picker is open */}
        <div className="bg-alabaster dark:bg-deep-grey border border-dashed border-gold/20 dark:border-white/20 rounded-xl p-6 flex flex-col items-center justify-center">
          <Building2 className="w-8 h-8 text-orange/50 mb-2" />
          <p className="text-sm text-charcoal/50 dark:text-cultured-white/50">
            Select a company to embed
          </p>
        </div>
      </NodeViewWrapper>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <NodeViewWrapper className="my-4 font-sans">
        <div className="bg-alabaster dark:bg-deep-grey border border-gold/10 dark:border-white/10 rounded-xl p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-orange" />
        </div>
      </NodeViewWrapper>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <NodeViewWrapper className="my-4 font-sans">
        <div className="bg-alabaster dark:bg-deep-grey border border-gold/10 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center">
          <Building2 className="w-8 h-8 text-charcoal/30 dark:text-cultured-white/30 mb-2" />
          <p className="text-sm text-charcoal/50 dark:text-cultured-white/50">
            Failed to load company
          </p>
          <button
            onClick={handleChange}
            className="mt-2 text-xs text-orange hover:underline"
          >
            Select a different company
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-4 font-sans">
      <div className="bg-alabaster dark:bg-deep-grey border border-gold/10 dark:border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gold/10 dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-orange" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-charcoal dark:text-cultured-white">
                  {data.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    STATUS_BADGE_STYLES[data.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {formatStatusName(data.status)}
                </span>
              </div>
              {data.industry && (
                <p className="text-xs text-charcoal/60 dark:text-cultured-white/60">
                  {data.industry}
                  {data.sector && ` • ${data.sector}`}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Link
              href={`/companies/${data.id}`}
              className="p-1.5 rounded hover:bg-bone dark:hover:bg-panel-dark transition-colors text-charcoal/50 dark:text-cultured-white/50 hover:text-orange"
              title="View Company"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={handleToggleMode}
              className="p-1.5 rounded hover:bg-bone dark:hover:bg-panel-dark transition-colors text-charcoal/50 dark:text-cultured-white/50 hover:text-orange"
              title={displayMode === "compact" ? "Expand" : "Collapse"}
            >
              {displayMode === "compact" ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={handleChange}
              className="p-1.5 rounded hover:bg-bone dark:hover:bg-panel-dark transition-colors text-charcoal/50 dark:text-cultured-white/50 hover:text-orange"
              title="Change Company"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRemove}
              className="p-1.5 rounded hover:bg-bone dark:hover:bg-panel-dark transition-colors text-charcoal/50 dark:text-cultured-white/50 hover:text-red-500"
              title="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-b border-gold/5 dark:border-white/5">
          <MetricItem
            icon={<DollarSign className="w-4 h-4" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            label="Revenue"
            value={formatRevenue(data.revenue)}
          />
          <MetricItem
            icon={<Users className="w-4 h-4" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            label="Employees"
            value={formatEmployees(data.employees)}
          />
          <MetricItem
            icon={<MapPin className="w-4 h-4" />}
            iconBg="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
            label="Location"
            value={data.location || "N/A"}
          />
          <MetricItem
            icon={<Globe className="w-4 h-4" />}
            iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            label="Website"
            value={data.website ? data.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : "N/A"}
            href={data.website}
          />
        </div>

        {/* Full Mode: Deal History */}
        {displayMode === "full" && data.dealHistory && data.dealHistory.length > 0 && (
          <div className="border-b border-gold/5 dark:border-white/5">
            <div className="flex items-center gap-2 px-4 py-3 bg-bone/30 dark:bg-panel-dark/30">
              <Briefcase className="w-4 h-4 text-orange" />
              <span className="text-xs font-medium text-charcoal/70 dark:text-cultured-white/70 uppercase tracking-wider">
                Recent Deals ({data.dealHistory.length})
              </span>
            </div>
            <div className="divide-y divide-gold/5 dark:divide-white/5">
              {data.dealHistory.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.dealId}`}
                  className="flex items-center justify-between px-4 py-2 hover:bg-bone/50 dark:hover:bg-panel-dark/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm text-charcoal dark:text-cultured-white group-hover:text-orange transition-colors">
                      {deal.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        STAGE_COLORS[deal.stage] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatStageName(deal.stage)}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        ROLE_COLORS[deal.role] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatRoleName(deal.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-charcoal/50 dark:text-cultured-white/50">
                    <span>{formatValue(deal.value, deal.currency)}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(deal.createdAt)}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Full Mode: Related Companies */}
        {displayMode === "full" && data.relatedCompanies && data.relatedCompanies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-4 py-3 bg-bone/30 dark:bg-panel-dark/30">
              <Sparkles className="w-4 h-4 text-orange" />
              <span className="text-xs font-medium text-charcoal/70 dark:text-cultured-white/70 uppercase tracking-wider">
                Related Companies ({data.relatedCompanies.length})
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
              {data.relatedCompanies.map((related) => (
                <Link
                  key={related.id}
                  href={`/companies/${related.id}`}
                  className="group flex items-center gap-3 p-3 bg-bone dark:bg-panel-dark rounded-lg hover:border-orange/30 hover:shadow-sm transition-all"
                >
                  <div className="w-8 h-8 rounded bg-charcoal/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-charcoal/40 dark:text-cultured-white/40 group-hover:text-orange transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-charcoal dark:text-cultured-white group-hover:text-orange transition-colors truncate">
                        {related.name}
                      </span>
                      <span
                        className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${getScoreColor(
                          related.similarityScore
                        )}`}
                      >
                        {related.similarityScore}%
                      </span>
                    </div>
                    <div className="text-xs text-charcoal/50 dark:text-cultured-white/50 truncate">
                      {related.relationshipTypes.slice(0, 2).join(" • ")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Full Mode: Empty States */}
        {displayMode === "full" && (
          <>
            {(!data.dealHistory || data.dealHistory.length === 0) && (
              <div className="px-4 py-6 border-b border-gold/5 dark:border-white/5 text-center">
                <Briefcase className="w-6 h-6 text-charcoal/20 dark:text-cultured-white/20 mx-auto mb-2" />
                <p className="text-xs text-charcoal/40 dark:text-cultured-white/40">
                  No deals associated with this company
                </p>
              </div>
            )}
            {(!data.relatedCompanies || data.relatedCompanies.length === 0) && (
              <div className="px-4 py-6 text-center">
                <Sparkles className="w-6 h-6 text-charcoal/20 dark:text-cultured-white/20 mx-auto mb-2" />
                <p className="text-xs text-charcoal/40 dark:text-cultured-white/40">
                  No related companies found
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// =============================================================================
// Metric Item Component
// =============================================================================

interface MetricItemProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  href?: string | null;
}

function MetricItem({ icon, iconBg, label, value, href }: MetricItemProps) {
  const content = (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded ${iconBg}`}>{icon}</div>
      <div>
        <div
          className={`text-sm font-medium text-charcoal dark:text-cultured-white truncate max-w-[100px] ${
            href ? "text-orange hover:underline" : ""
          }`}
        >
          {value}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50">
          {label}
        </div>
      </div>
    </div>
  );

  if (href && value !== "N/A") {
    return (
      <a
        href={href.startsWith("http") ? href : `https://${href}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}

export default CompanyEmbedBlock;
