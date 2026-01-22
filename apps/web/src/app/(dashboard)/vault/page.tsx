"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layouts/PageHeader";
import { api } from "@/trpc/react";
import {
  Search,
  Loader2,
  AlertCircle,
  FolderArchive,
  FileText,
  Building2,
} from "lucide-react";
import Link from "next/link";

type StageFilter = "ALL" | "ACTIVE" | "CLOSED";

const STAGE_FILTER_OPTIONS: { value: StageFilter; label: string }[] = [
  { value: "ALL", label: "All Deals" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
];

const STAGE_COLORS: Record<string, string> = {
  SOURCING: "bg-blue-100 text-blue-700",
  INITIAL_REVIEW: "bg-violet-100 text-violet-700",
  PRELIMINARY_DUE_DILIGENCE: "bg-pink-100 text-pink-700",
  DEEP_DUE_DILIGENCE: "bg-orange/20 text-orange",
  NEGOTIATION: "bg-amber-100 text-amber-700",
  CLOSING: "bg-emerald-100 text-emerald-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-red-100 text-red-700",
};

function formatStageName(stage: string): string {
  return stage
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface DealCardProps {
  deal: {
    id: string;
    name: string;
    stage: string;
    documentCount: number;
    company: { id: string; name: string } | null;
  };
}

function DealCard({ deal }: DealCardProps) {
  const stageColor = STAGE_COLORS[deal.stage] || "bg-charcoal/10 text-charcoal/70";

  return (
    <Link
      href={`/vault/${deal.id}`}
      className="
        block bg-alabaster rounded-xl p-5 border border-gold/10
        hover:border-orange/30 hover:shadow-md transition-all duration-200
        group
      "
    >
      {/* Icon and Count */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-bone rounded-lg flex items-center justify-center group-hover:bg-orange/10 transition-colors">
          <FolderArchive className="w-5 h-5 text-charcoal/50 group-hover:text-orange transition-colors" />
        </div>
        <div className="flex items-center gap-1 text-charcoal/60">
          <FileText className="w-4 h-4" />
          <span className="text-sm font-medium">{deal.documentCount}</span>
        </div>
      </div>

      {/* Deal Name */}
      <h3 className="font-semibold text-charcoal mb-1 truncate group-hover:text-orange transition-colors">
        {deal.name}
      </h3>

      {/* Company */}
      {deal.company && (
        <div className="flex items-center gap-1.5 text-xs text-charcoal/60 mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span className="truncate">{deal.company.name}</span>
        </div>
      )}

      {/* Stage Badge */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${stageColor}`}>
          {formatStageName(deal.stage)}
        </span>
        <span className="text-xs text-charcoal/40">
          {deal.documentCount === 1 ? "1 document" : `${deal.documentCount} documents`}
        </span>
      </div>
    </Link>
  );
}

export default function VaultPage() {
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: deals, isLoading, error } = api.vdr.listDealsWithDocCounts.useQuery({
    stage: stageFilter,
    search: searchQuery || undefined,
  });

  return (
    <div className="px-12 py-8">
      <PageHeader
        title="Vault"
        subtitle="Centralized document management for all your deals"
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Stage Filter Tabs */}
        <div className="flex bg-alabaster rounded-lg p-1 border border-gold/10">
          {STAGE_FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setStageFilter(option.value)}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                ${
                  stageFilter === option.value
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-charcoal/60 hover:text-charcoal"
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search deals..."
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
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 bg-alabaster rounded-xl border border-gold/10">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-charcoal/60 font-medium">Failed to load deals</p>
          <p className="text-sm text-charcoal/40 mt-1">{error.message}</p>
        </div>
      ) : !deals?.length ? (
        <div className="flex flex-col items-center justify-center h-64 bg-alabaster rounded-xl border border-gold/10">
          <FolderArchive className="w-12 h-12 text-charcoal/30 mb-3" />
          <p className="text-charcoal/60 font-medium">No deals found</p>
          <p className="text-sm text-charcoal/40 mt-1">
            {searchQuery
              ? "Try adjusting your search criteria"
              : "Create deals to start managing documents"}
          </p>
        </div>
      ) : (
        <>
          {/* Deal Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {/* Results count */}
          <p className="text-sm text-charcoal/50 mt-6 text-center">
            {deals.length} {deals.length === 1 ? "deal" : "deals"} with documents
          </p>
        </>
      )}
    </div>
  );
}
