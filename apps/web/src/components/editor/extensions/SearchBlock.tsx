/**
 * SearchBlock - Tiptap extension for company discovery
 *
 * Provides a search interface for finding companies within the organization.
 * Results display as cards with "Add to Pipeline" action.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewProps,
} from "@tiptap/react";
import { useState, useCallback, useRef, KeyboardEvent } from "react";
import {
  Search,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Loader2,
  AlertCircle,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface SearchBlockAttributes {
  query: string;
  industryFilter: string | null;
  statusFilter: string | null;
}

interface CompanyResult {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  location: string | null;
  employees: number | null;
  // Revenue is Decimal from Prisma, needs conversion
  revenue: { toNumber(): number } | number | null;
  status: string;
  aiScore: number | null;
  _count: { deals: number };
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchBlock: {
      setSearchBlock: (attrs?: Partial<SearchBlockAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Node Extension
// =============================================================================

export const SearchBlock = Node.create({
  name: "searchBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      query: { default: "" },
      industryFilter: { default: null },
      statusFilter: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "search-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["search-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SearchCard);
  },

  addCommands() {
    return {
      setSearchBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "searchBlock",
            attrs: {
              query: "",
              industryFilter: null,
              statusFilter: null,
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

function SearchCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as SearchBlockAttributes;
  const { query, industryFilter } = attrs;
  const [inputValue, setInputValue] = useState(query);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(
    industryFilter
  );
  const [showDealModal, setShowDealModal] = useState<CompanyResult | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch industries for filter dropdown
  const { data: industries } = api.sourcing.industries.useQuery();

  // Search query - only runs when query is non-empty
  const {
    data: searchResults,
    isLoading,
    error,
  } = api.sourcing.search.useQuery(
    {
      query: inputValue.trim(),
      filters: selectedIndustry ? { industry: selectedIndustry } : undefined,
      pageSize: 12,
    },
    { enabled: inputValue.trim().length > 0 }
  );

  // Deal creation mutation
  const utils = api.useUtils();
  const createDealMutation = api.deal.create.useMutation({
    onSuccess: () => {
      utils.sourcing.search.invalidate();
      setShowDealModal(null);
    },
  });

  const handleSearch = useCallback(() => {
    if (!inputValue.trim()) return;
    updateAttributes({ query: inputValue.trim() });
  }, [inputValue, updateAttributes]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setSelectedIndustry(null);
    updateAttributes({ query: "", industryFilter: null });
    inputRef.current?.focus();
  }, [updateAttributes]);

  const handleAddToPipeline = useCallback((company: CompanyResult) => {
    setShowDealModal(company);
  }, []);

  const handleCreateDeal = useCallback(
    (
      company: CompanyResult,
      dealData: { name: string; type: string; stage: string }
    ) => {
      createDealMutation.mutate({
        name: dealData.name,
        type: dealData.type as
          | "ACQUISITION"
          | "DIVESTITURE"
          | "MERGER"
          | "JOINT_VENTURE"
          | "STRATEGIC_PARTNERSHIP",
        stage: dealData.stage as
          | "SOURCING"
          | "INITIAL_REVIEW"
          | "DUE_DILIGENCE"
          | "NEGOTIATION"
          | "CLOSING"
          | "CLOSED_WON"
          | "CLOSED_LOST",
        companyId: company.id,
      });
    },
    [createDealMutation]
  );

  const formatRevenue = (revenue: { toNumber(): number } | number | null): string => {
    if (!revenue) return "-";
    // Handle Prisma Decimal type
    const value = typeof revenue === 'number' ? revenue : revenue.toNumber();
    if (value >= 1_000_000_000)
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gold/10 rounded">
              <Search className="w-4 h-4 text-gold" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
              Company Search
            </h3>
          </div>
          {inputValue && (
            <button
              onClick={handleClear}
              className="text-xs text-charcoal/50 dark:text-cultured-white/50 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search companies by name, industry, or location..."
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30 dark:text-cultured-white/30" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 border rounded-lg transition-colors flex items-center gap-1.5 text-sm ${
                showFilters || selectedIndustry
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-bone dark:border-charcoal/30 text-charcoal/60 dark:text-cultured-white/60 hover:border-gold hover:text-gold"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={handleSearch}
              disabled={!inputValue.trim()}
              className="px-4 py-2.5 bg-gold hover:bg-gold/90 disabled:bg-gold/40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              Search
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="p-3 bg-alabaster dark:bg-surface-dark rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 w-16">
                  Industry:
                </label>
                <select
                  value={selectedIndustry || ""}
                  onChange={(e) => {
                    setSelectedIndustry(e.target.value || null);
                    updateAttributes({ industryFilter: e.target.value || null });
                  }}
                  className="flex-1 px-3 py-1.5 rounded border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-sm text-charcoal dark:text-cultured-white"
                >
                  <option value="">All Industries</option>
                  {industries?.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                {selectedIndustry && (
                  <button
                    onClick={() => {
                      setSelectedIndustry(null);
                      updateAttributes({ industryFilter: null });
                    }}
                    className="p-1 text-charcoal/40 hover:text-charcoal dark:hover:text-cultured-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
              <span className="ml-2 text-sm text-charcoal/60 dark:text-cultured-white/60">
                Searching companies...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Failed to search companies</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults && searchResults.items.length === 0 && inputValue && (
          <div className="px-4 pb-4">
            <div className="flex flex-col items-center justify-center py-8 text-charcoal/50 dark:text-cultured-white/50">
              <Building2 className="w-10 h-10 mb-2 opacity-30" />
              <span className="text-sm">No companies found</span>
              <span className="text-xs mt-1">
                Try adjusting your search terms
              </span>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {searchResults && searchResults.items.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                {searchResults.pagination.total} companies found
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.items.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onAddToPipeline={handleAddToPipeline}
                  formatRevenue={formatRevenue}
                />
              ))}
            </div>
          </div>
        )}

        {/* Deal Creation Modal */}
        {showDealModal && (
          <DealCreationModal
            company={showDealModal}
            onClose={() => setShowDealModal(null)}
            onSubmit={handleCreateDeal}
            isLoading={createDealMutation.isPending}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

// =============================================================================
// Company Card Component
// =============================================================================

function CompanyCard({
  company,
  onAddToPipeline,
  formatRevenue,
}: {
  company: CompanyResult;
  onAddToPipeline: (company: CompanyResult) => void;
  formatRevenue: (revenue: number | null) => string;
}) {
  const hasDeals = company._count.deals > 0;

  return (
    <div className="p-4 border border-bone dark:border-charcoal/30 rounded-lg bg-white dark:bg-charcoal/10 hover:border-gold/50 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-charcoal dark:text-cultured-white truncate">
            {company.name}
          </h4>
          {company.industry && (
            <span className="text-xs text-gold">{company.industry}</span>
          )}
        </div>
        {company.aiScore && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 rounded text-xs">
            <Sparkles className="w-3 h-3 text-violet-600" />
            <span className="text-violet-700 dark:text-violet-400 font-medium">
              {Math.round(company.aiScore * 100)}
            </span>
          </div>
        )}
      </div>

      {company.description && (
        <p className="text-xs text-charcoal/60 dark:text-cultured-white/60 line-clamp-2 mb-3">
          {company.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3 text-xs text-charcoal/50 dark:text-cultured-white/50">
        {company.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {company.location}
          </span>
        )}
        {company.employees && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {company.employees.toLocaleString()}
          </span>
        )}
        {company.revenue && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatRevenue(company.revenue)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
            hasDeals
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400"
          }`}
        >
          {hasDeals ? `${company._count.deals} deal(s)` : company.status}
        </span>
        <button
          onClick={() => onAddToPipeline(company)}
          disabled={hasDeals}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            hasDeals
              ? "text-charcoal/30 dark:text-cultured-white/30 cursor-not-allowed"
              : "text-gold hover:bg-gold/10 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Plus className="w-3 h-3" />
          Add to Pipeline
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Deal Creation Modal
// =============================================================================

function DealCreationModal({
  company,
  onClose,
  onSubmit,
  isLoading,
}: {
  company: CompanyResult;
  onClose: () => void;
  onSubmit: (
    company: CompanyResult,
    data: { name: string; type: string; stage: string }
  ) => void;
  isLoading: boolean;
}) {
  const [dealName, setDealName] = useState(`${company.name} Acquisition`);
  const [dealType, setDealType] = useState("ACQUISITION");
  const [dealStage, setDealStage] = useState("SOURCING");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(company, { name: dealName, type: dealType, stage: dealStage });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-deep-grey rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b border-bone dark:border-charcoal/30">
          <h3 className="text-lg font-semibold text-charcoal dark:text-cultured-white">
            Add to Pipeline
          </h3>
          <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
            Create a new deal linked to {company.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-cultured-white mb-1">
              Deal Name
            </label>
            <input
              type="text"
              value={dealName}
              onChange={(e) => setDealName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-cultured-white mb-1">
                Deal Type
              </label>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white"
              >
                <option value="ACQUISITION">Acquisition</option>
                <option value="DIVESTITURE">Divestiture</option>
                <option value="MERGER">Merger</option>
                <option value="JOINT_VENTURE">Joint Venture</option>
                <option value="STRATEGIC_PARTNERSHIP">
                  Strategic Partnership
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-cultured-white mb-1">
                Stage
              </label>
              <select
                value={dealStage}
                onChange={(e) => setDealStage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white"
              >
                <option value="SOURCING">Sourcing</option>
                <option value="INITIAL_REVIEW">Initial Review</option>
                <option value="DUE_DILIGENCE">Due Diligence</option>
                <option value="NEGOTIATION">Negotiation</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-charcoal/60 dark:text-cultured-white/60 hover:text-charcoal dark:hover:text-cultured-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !dealName.trim()}
              className="px-4 py-2 bg-gold hover:bg-gold/90 disabled:bg-gold/40 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SearchBlock;
