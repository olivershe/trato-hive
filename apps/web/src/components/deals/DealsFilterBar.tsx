/**
 * DealsFilterBar - Filter controls for deals pipeline
 *
 * Provides filters by stage, priority, source, and custom fields.
 * Persists filter state to URL query params.
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface FilterState {
  stages: string[];
  priorities: string[];
  sources: string[];
}

interface DealsFilterBarProps {
  onFilterChange: (filters: FilterState) => void;
}

const STAGES = [
  { id: "SOURCING", label: "Sourcing" },
  { id: "INITIAL_REVIEW", label: "Initial Review" },
  { id: "PRELIMINARY_DUE_DILIGENCE", label: "Preliminary DD" },
  { id: "DEEP_DUE_DILIGENCE", label: "Deep DD" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "CLOSING", label: "Closing" },
  { id: "CLOSED_WON", label: "Won" },
  { id: "CLOSED_LOST", label: "Lost" },
] as const;

const PRIORITIES = [
  { id: "URGENT", label: "Urgent" },
  { id: "HIGH", label: "High" },
  { id: "MEDIUM", label: "Medium" },
  { id: "LOW", label: "Low" },
  { id: "NONE", label: "None" },
] as const;

const SOURCES = [
  { id: "REFERRAL", label: "Referral" },
  { id: "OUTBOUND", label: "Outbound" },
  { id: "INBOUND", label: "Inbound" },
  { id: "AUCTION", label: "Auction" },
  { id: "NETWORK", label: "Network" },
  { id: "OTHER", label: "Other" },
] as const;

// =============================================================================
// Filter Dropdown Component
// =============================================================================

interface FilterDropdownProps {
  label: string;
  options: readonly { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}

function FilterDropdown({ label, options, selected, onToggle }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasSelection = selected.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
          hasSelection
            ? "bg-orange/10 border-orange/30 text-orange"
            : "bg-white dark:bg-deep-grey border-gold/20 text-charcoal/70 dark:text-cultured-white/70 hover:border-gold/40"
        )}
      >
        {label}
        {hasSelection && (
          <span className="flex items-center justify-center w-5 h-5 text-xs bg-orange text-white rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-deep-grey border border-gold/20 rounded-lg shadow-lg py-1 min-w-[160px]">
            {options.map((option) => {
              const isSelected = selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => onToggle(option.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-alabaster dark:hover:bg-charcoal/50 transition-colors",
                    isSelected && "bg-orange/5"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-4 h-4 rounded border-gold/30 text-orange focus:ring-orange/30"
                  />
                  <span className={cn(
                    isSelected ? "text-orange font-medium" : "text-charcoal dark:text-cultured-white"
                  )}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function DealsFilterBar({ onFilterChange }: DealsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const parseFiltersFromUrl = useCallback((): FilterState => {
    const stages = searchParams.get("stages")?.split(",").filter(Boolean) ?? [];
    const priorities = searchParams.get("priorities")?.split(",").filter(Boolean) ?? [];
    const sources = searchParams.get("sources")?.split(",").filter(Boolean) ?? [];
    return { stages, priorities, sources };
  }, [searchParams]);

  const [filters, setFilters] = useState<FilterState>(parseFiltersFromUrl);

  // Sync filters from URL on mount and URL changes
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl();
    setFilters(urlFilters);
    onFilterChange(urlFilters);
  }, [parseFiltersFromUrl, onFilterChange]);

  // Update URL when filters change
  const updateUrl = useCallback((newFilters: FilterState) => {
    const params = new URLSearchParams();

    if (newFilters.stages.length > 0) {
      params.set("stages", newFilters.stages.join(","));
    }
    if (newFilters.priorities.length > 0) {
      params.set("priorities", newFilters.priorities.join(","));
    }
    if (newFilters.sources.length > 0) {
      params.set("sources", newFilters.sources.join(","));
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [router, pathname]);

  const handleToggle = useCallback((filterType: keyof FilterState) => (id: string) => {
    setFilters((prev) => {
      const current = prev[filterType];
      const newValue = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];

      const newFilters = { ...prev, [filterType]: newValue };
      updateUrl(newFilters);
      onFilterChange(newFilters);
      return newFilters;
    });
  }, [updateUrl, onFilterChange]);

  const handleClearAll = useCallback(() => {
    const emptyFilters: FilterState = { stages: [], priorities: [], sources: [] };
    setFilters(emptyFilters);
    updateUrl(emptyFilters);
    onFilterChange(emptyFilters);
  }, [updateUrl, onFilterChange]);

  const totalFilters = filters.stages.length + filters.priorities.length + filters.sources.length;

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-2 text-charcoal/50 dark:text-cultured-white/50">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <FilterDropdown
        label="Stage"
        options={STAGES}
        selected={filters.stages}
        onToggle={handleToggle("stages")}
      />

      <FilterDropdown
        label="Priority"
        options={PRIORITIES}
        selected={filters.priorities}
        onToggle={handleToggle("priorities")}
      />

      <FilterDropdown
        label="Source"
        options={SOURCES}
        selected={filters.sources}
        onToggle={handleToggle("sources")}
      />

      {totalFilters > 0 && (
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1 px-2 py-1 text-sm text-charcoal/50 hover:text-charcoal dark:text-cultured-white/50 dark:hover:text-cultured-white transition-colors"
        >
          <X className="w-3 h-3" />
          Clear all
        </button>
      )}
    </div>
  );
}
