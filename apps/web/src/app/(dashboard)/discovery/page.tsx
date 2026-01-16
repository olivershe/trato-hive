"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layouts/PageHeader";
import { api } from "@/trpc/react";
import {
  Search,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Loader2,
  AlertCircle,
  Filter,
  Eye,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWatch } from "@/hooks/useWatch";

function formatRevenue(value: number | null): string {
  if (!value) return "N/A";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const PRIORITY_CONFIG = {
  0: { label: "Low", className: "bg-charcoal/10 text-charcoal/70" },
  1: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  2: { label: "High", className: "bg-red-100 text-red-700" },
} as const;

const STATUS_STYLES = {
  PIPELINE: "bg-emerald-100 text-emerald-700",
  ENGAGED: "bg-orange/20 text-orange",
  DEFAULT: "bg-charcoal/10 text-charcoal/70",
} as const;

function getStatusStyle(status: string): string {
  if (status === "PIPELINE") return STATUS_STYLES.PIPELINE;
  if (status === "ENGAGED") return STATUS_STYLES.ENGAGED;
  return STATUS_STYLES.DEFAULT;
}

interface WatchedCompany {
  id: string;
  companyId: string;
  notes: string | null;
  tags: string[];
  priority: number;
  company: {
    id: string;
    name: string;
    industry: string | null;
    sector: string | null;
    location: string | null;
    employees: number | null;
    revenue: number | null;
    status: string;
  };
}

function WatchedCompanyCard({ watch }: { watch: WatchedCompany }) {
  const { removeFromWatch, isLoading } = useWatch(watch.companyId);
  const priority = PRIORITY_CONFIG[watch.priority as 0 | 1 | 2] ?? PRIORITY_CONFIG[0];

  return (
    <div className="bg-alabaster rounded-xl p-4 border border-gold/10 hover:border-orange/30 transition-colors min-w-[280px] max-w-[320px] flex-shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-charcoal truncate">{watch.company.name}</h4>
          {watch.company.industry && (
            <p className="text-xs text-charcoal/60 truncate">
              {watch.company.industry}
              {watch.company.sector && ` · ${watch.company.sector}`}
            </p>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ml-2 ${priority.className}`}>
          {priority.label}
        </span>
      </div>

      {/* Tags */}
      {watch.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {watch.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-bone text-charcoal/70 rounded text-[10px]"
            >
              {tag}
            </span>
          ))}
          {watch.tags.length > 3 && (
            <span className="px-2 py-0.5 text-charcoal/50 text-[10px]">
              +{watch.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Notes preview */}
      {watch.notes && (
        <p className="text-xs text-charcoal/60 line-clamp-2 mb-3">{watch.notes}</p>
      )}

      {/* Quick info */}
      <div className="flex items-center gap-3 text-xs text-charcoal/50 mb-3">
        {watch.company.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {watch.company.location.split(",")[0]}
          </span>
        )}
        {watch.company.revenue && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {formatRevenue(Number(watch.company.revenue))}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/companies/${watch.company.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-bone text-charcoal/80 rounded-lg text-xs font-medium hover:bg-gold/20 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View
        </Link>
        <button
          onClick={() => removeFromWatch()}
          disabled={isLoading}
          className="p-1.5 text-charcoal/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Remove from watch list"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * [TASK-108] Watch List Section
 */
function WatchedCompaniesSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState<number | undefined>(undefined);

  const { data: watchData, isLoading } = api.watch.list.useQuery({
    page: 1,
    pageSize: 20,
    filter: priorityFilter !== undefined ? { priority: priorityFilter } : undefined,
    sort: { field: "priority", order: "desc" },
  });

  // Don't render section if no watched companies (after loading)
  if (!isLoading && (!watchData?.items || watchData.items.length === 0) && priorityFilter === undefined) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-charcoal font-semibold hover:text-orange transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
          <Eye className="w-5 h-5 text-orange" />
          Watched Companies
          {watchData?.pagination?.total !== undefined && (
            <span className="text-xs text-charcoal/50 bg-bone px-2 py-0.5 rounded-full font-normal">
              {watchData.pagination.total}
            </span>
          )}
        </button>

        {/* Priority Filter */}
        {isExpanded && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal/50">Filter:</span>
            <select
              value={priorityFilter ?? ""}
              onChange={(e) =>
                setPriorityFilter(e.target.value ? Number(e.target.value) : undefined)
              }
              className="text-xs px-2 py-1 bg-alabaster border border-gold/20 rounded-lg text-charcoal focus:outline-none focus:border-orange"
            >
              <option value="">All</option>
              <option value="2">High Priority</option>
              <option value="1">Medium Priority</option>
              <option value="0">Low Priority</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 bg-alabaster rounded-xl border border-gold/10">
              <Loader2 className="w-6 h-6 animate-spin text-orange" />
            </div>
          ) : !watchData?.items || watchData.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 bg-alabaster rounded-xl border border-gold/10">
              <Eye className="w-8 h-8 text-charcoal/20 mb-2" />
              <p className="text-sm text-charcoal/50">
                {priorityFilter !== undefined
                  ? "No companies match this filter"
                  : "No companies in your watch list"}
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2">
              {watchData.items.map((watch) => (
                <WatchedCompanyCard
                  key={watch.id}
                  watch={watch}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DiscoveryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("");

  // Use list endpoint for browsing (search is optional)
  const { data: companiesData, isLoading: companiesLoading } =
    api.sourcing.list.useQuery({
      page: 1,
      pageSize: 50,
      filter: industryFilter ? { industry: industryFilter } : undefined,
    });

  // Fetch industries for filter dropdown (returns string[])
  const { data: industriesData } = api.sourcing.industries.useQuery();

  // Create deal mutation
  const createDealMutation = api.deal.create.useMutation({
    onSuccess: (data) => {
      router.push(`/deals/${data.id}`);
    },
  });

  const handleCreateDeal = (company: { id: string; name: string }) => {
    createDealMutation.mutate({
      name: `${company.name} Opportunity`,
      type: "ACQUISITION",
      stage: "SOURCING",
      companyId: company.id,
    });
  };

  // Filter companies locally by search query
  const filteredCompanies = companiesData?.items.filter((company) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      company.industry?.toLowerCase().includes(query) ||
      company.location?.toLowerCase().includes(query) ||
      company.description?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <PageHeader
        title="Discovery"
        subtitle="Find and evaluate potential M&A opportunities"
      />

      {/* Watched Companies Section [TASK-108] */}
      <WatchedCompaniesSection />

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search companies by name, industry, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5
              bg-alabaster border border-gold/20 rounded-lg
              text-charcoal placeholder:text-charcoal/40
              focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange
            "
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="
              pl-9 pr-8 py-2.5 appearance-none
              bg-alabaster border border-gold/20 rounded-lg
              text-charcoal
              focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange
            "
          >
            <option value="">All Industries</option>
            {industriesData?.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {companiesLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange" />
        </div>
      ) : !filteredCompanies?.length ? (
        <div className="flex flex-col items-center justify-center h-64 bg-alabaster rounded-xl border border-gold/10">
          <AlertCircle className="w-12 h-12 text-charcoal/30 mb-3" />
          <p className="text-charcoal/60 font-medium">No companies found</p>
          <p className="text-sm text-charcoal/40 mt-1">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Add companies to start discovering opportunities"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-alabaster rounded-xl p-5 border border-gold/10 hover:border-orange/30 transition-colors"
            >
              {/* Company Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-charcoal">{company.name}</h3>
                  {company.industry && (
                    <p className="text-xs text-charcoal/60 mt-0.5">
                      {company.industry}
                      {company.sector && ` · ${company.sector}`}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(company.status)}`}
                >
                  {company.status.toLowerCase()}
                </span>
              </div>

              {/* Company Details */}
              <div className="space-y-2 mb-4">
                {company.location && (
                  <div className="flex items-center gap-2 text-sm text-charcoal/70">
                    <MapPin className="w-4 h-4" />
                    {company.location}
                  </div>
                )}
                {company.employees && (
                  <div className="flex items-center gap-2 text-sm text-charcoal/70">
                    <Users className="w-4 h-4" />
                    {company.employees.toLocaleString()} employees
                  </div>
                )}
                {company.revenue && (
                  <div className="flex items-center gap-2 text-sm text-charcoal/70">
                    <DollarSign className="w-4 h-4" />
                    {formatRevenue(Number(company.revenue))} revenue
                  </div>
                )}
              </div>

              {/* Description */}
              {company.description && (
                <p className="text-sm text-charcoal/60 mb-4 line-clamp-2">
                  {company.description}
                </p>
              )}

              {/* Actions */}
              <button
                onClick={() => handleCreateDeal(company)}
                disabled={createDealMutation.isPending}
                className="
                  w-full flex items-center justify-center gap-2
                  px-4 py-2 bg-orange text-white rounded-lg
                  hover:bg-orange/90 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Plus className="w-4 h-4" />
                {createDealMutation.isPending ? "Creating..." : "Create Deal"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredCompanies?.length ? (
        <p className="text-sm text-charcoal/50 mt-4 text-center">
          Showing {filteredCompanies.length} of {companiesData?.pagination.total ?? 0} companies
        </p>
      ) : null}
    </>
  );
}
