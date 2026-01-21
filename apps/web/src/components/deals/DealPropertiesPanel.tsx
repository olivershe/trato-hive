/**
 * DealPropertiesPanel Component
 *
 * Notion-style properties panel for deal pages.
 * Displays deal properties from DatabaseEntry with inline editing support.
 *
 * Phase 12: Deals Database Architecture Migration
 */
"use client";

import { api } from "@/trpc/react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Tag,
  User,
  Target,
  Layers,
  Loader2,
} from "lucide-react";
import { PropertyRow } from "./PropertyRow";

// Status badge styles for stage and priority
const stageBadgeStyles: Record<string, string> = {
  SOURCING: "bg-slate-100 text-slate-700",
  INITIAL_REVIEW: "bg-blue-100 text-blue-700",
  PRELIMINARY_DUE_DILIGENCE: "bg-blue-100 text-blue-700",
  DEEP_DUE_DILIGENCE: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-yellow-100 text-yellow-700",
  CLOSING: "bg-yellow-100 text-yellow-700",
  CLOSED_WON: "bg-green-100 text-green-700",
  CLOSED_LOST: "bg-red-100 text-red-700",
};

const priorityBadgeStyles: Record<string, string> = {
  NONE: "bg-slate-100 text-slate-500",
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-yellow-100 text-yellow-700",
  URGENT: "bg-red-100 text-red-700",
};

function formatStageName(stage: string): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatValue(value: number | null | undefined): string {
  if (!value) return "-";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface DealPropertiesPanelProps {
  entryId: string;
  className?: string;
}

export function DealPropertiesPanel({ entryId, className = "" }: DealPropertiesPanelProps) {
  // Fetch entry with schema
  const { data: entry, isLoading } = api.dealsDatabase.getEntry.useQuery(
    { entryId },
    { enabled: !!entryId }
  );

  if (isLoading) {
    return (
      <div className={`bg-alabaster rounded-xl border border-gold/10 p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-orange" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return null;
  }

  const props = entry.properties as Record<string, unknown>;
  const stage = (props.stage as string) || "SOURCING";
  const priority = (props.priority as string) || "NONE";
  const type = (props.type as string) || "ACQUISITION";
  const value = props.value as number | null | undefined;
  const probability = props.probability as number | null | undefined;
  const expectedCloseDate = props.expectedCloseDate as string | null | undefined;
  const source = props.source as string | null | undefined;

  return (
    <div className={`bg-alabaster rounded-xl border border-gold/10 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-charcoal/60 mb-3">Properties</h3>

      <div className="space-y-1">
        {/* Stage */}
        <PropertyRow icon={Layers} label="Stage">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              stageBadgeStyles[stage] || "bg-slate-100 text-slate-600"
            }`}
          >
            {formatStageName(stage)}
          </span>
        </PropertyRow>

        {/* Priority */}
        <PropertyRow icon={Target} label="Priority">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              priorityBadgeStyles[priority] || "bg-slate-100 text-slate-500"
            }`}
          >
            {priority === "NONE" ? "None" : priority.charAt(0) + priority.slice(1).toLowerCase()}
          </span>
        </PropertyRow>

        {/* Type */}
        <PropertyRow icon={Tag} label="Type">
          <span className="text-sm text-charcoal">
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </span>
        </PropertyRow>

        {/* Value */}
        <PropertyRow icon={DollarSign} label="Value">
          <span className="text-sm font-medium text-charcoal">
            {formatValue(value)}
          </span>
        </PropertyRow>

        {/* Probability */}
        <PropertyRow icon={TrendingUp} label="Probability">
          <span className="text-sm text-charcoal">
            {probability != null ? `${probability}%` : "-"}
          </span>
        </PropertyRow>

        {/* Expected Close */}
        <PropertyRow icon={Calendar} label="Expected Close">
          <span className="text-sm text-charcoal">
            {formatDate(expectedCloseDate)}
          </span>
        </PropertyRow>

        {/* Source */}
        {source && (
          <PropertyRow icon={User} label="Source">
            <span className="text-sm text-charcoal">
              {source.charAt(0) + source.slice(1).toLowerCase()}
            </span>
          </PropertyRow>
        )}
      </div>
    </div>
  );
}
