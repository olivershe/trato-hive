"use client";

/**
 * CompaniesCell - Multi-company display for Pipeline views
 *
 * [TASK-119] Deal Companies Column
 *
 * Shows primary company with role badge, "+N" for additional companies,
 * and hover dropdown showing all companies with roles.
 */

import { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealCompany } from "./mock-data";

const ROLE_COLORS: Record<string, string> = {
  PLATFORM: "bg-charcoal text-white dark:bg-cultured-white dark:text-charcoal",
  ADD_ON: "bg-orange/20 text-orange dark:bg-orange/30 dark:text-faded-orange",
  SELLER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  BUYER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ADVISOR: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

function formatRoleName(role: string): string {
  return role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function getRoleColorClass(role: string): string {
  return ROLE_COLORS[role] || "bg-gray-100 text-gray-700";
}

interface CompaniesCellProps {
  companies: DealCompany[];
  variant?: "table" | "card";
}

export function CompaniesCell({ companies, variant = "table" }: CompaniesCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMultipleCompanies = companies.length > 1;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-charcoal/40 dark:text-cultured-white/40">
        <Building2 className="w-3.5 h-3.5" />
        <span className="text-sm italic">No company</span>
      </div>
    );
  }

  const primaryCompany = companies[0];

  function handleToggleDropdown(e: React.MouseEvent): void {
    e.stopPropagation();
    if (hasMultipleCompanies) {
      setIsOpen(!isOpen);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggleDropdown}
        className={cn(
          "flex items-center gap-2 text-left group/companies",
          variant === "card" && "w-full"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium truncate text-gold uppercase text-xs tracking-wider">
            {primaryCompany.name}
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0",
              getRoleColorClass(primaryCompany.role)
            )}
          >
            {formatRoleName(primaryCompany.role)}
          </span>
        </div>

        {hasMultipleCompanies && (
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-xs font-medium text-charcoal/50 dark:text-cultured-white/50 bg-bone dark:bg-panel-dark px-1.5 py-0.5 rounded-full">
              +{companies.length - 1}
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 text-charcoal/40 dark:text-cultured-white/40 transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
        )}
      </button>

      {isOpen && hasMultipleCompanies && (
        <div
          className={cn(
            "absolute z-50 mt-1 py-1 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-lg min-w-[200px]",
            variant === "card" ? "left-0 right-0" : "left-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 border-b border-gold/10 dark:border-white/10">
            All Companies ({companies.length})
          </div>
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-alabaster dark:hover:bg-charcoal/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-charcoal/40 dark:text-cultured-white/40 shrink-0" />
                <span className="text-sm font-medium text-charcoal dark:text-cultured-white truncate">
                  {company.name}
                </span>
              </div>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0",
                  getRoleColorClass(company.role)
                )}
              >
                {formatRoleName(company.role)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CompaniesCell;
