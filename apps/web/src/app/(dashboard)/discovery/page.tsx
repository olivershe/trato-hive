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
} from "lucide-react";
import { useRouter } from "next/navigation";

function formatRevenue(value: number | null): string {
  if (!value) return "N/A";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
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
                  className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${
                      company.status === "PIPELINE"
                        ? "bg-emerald-100 text-emerald-700"
                        : company.status === "ENGAGED"
                        ? "bg-orange/20 text-orange"
                        : "bg-charcoal/10 text-charcoal/70"
                    }
                  `}
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
