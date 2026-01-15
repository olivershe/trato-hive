/**
 * DealHistoryBlock - Tiptap extension for company deal history
 *
 * [TASK-104] Deal History DatabaseView
 *
 * Displays all deals involving a company via the DealCompany junction table.
 * Shows: Deal Name, Stage, Value, Role, Created At
 * Supports navigation to deal pages.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import Link from "next/link";
import {
  Briefcase,
  Loader2,
  ArrowUpRight,
  Building2,
  DollarSign,
  Calendar,
} from "lucide-react";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface DealHistoryBlockAttributes {
  companyId: string;
  title: string;
  showEmpty: boolean;
  maxItems: number;
}

interface DealHistoryEntry {
  id: string;
  dealId: string;
  name: string;
  stage: string;
  value: number | null;
  currency: string;
  role: string;
  createdAt: Date;
}

// =============================================================================
// Tiptap Type Augmentation
// =============================================================================

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    dealHistoryBlock: {
      setDealHistoryBlock: (attrs: Partial<DealHistoryBlockAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Constants
// =============================================================================

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

function formatValue(value: number | null, currency: string): string {
  if (!value) return "—";
  const formatted = value >= 1000000000
    ? `${(value / 1000000000).toFixed(1)}B`
    : value >= 1000000
    ? `${(value / 1000000).toFixed(0)}M`
    : value >= 1000
    ? `${(value / 1000).toFixed(0)}K`
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

// =============================================================================
// Tiptap Extension
// =============================================================================

export const DealHistoryBlock = Node.create({
  name: "dealHistoryBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      companyId: { default: "" },
      title: { default: "Deal History" },
      showEmpty: { default: true },
      maxItems: { default: 10 },
    };
  },

  parseHTML() {
    return [{ tag: "deal-history-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["deal-history-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DealHistoryCard);
  },

  addCommands() {
    return {
      setDealHistoryBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "dealHistoryBlock",
            attrs,
          });
        },
    };
  },
});

// =============================================================================
// React Component
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DealHistoryCard({ node }: { node: any }) {
  const { companyId, title, showEmpty, maxItems } = node.attrs as DealHistoryBlockAttributes;

  // Fetch deal history
  const { data, isLoading, error } = api.company.getWithDeals.useQuery(
    { id: companyId },
    { enabled: !!companyId }
  );

  // Extract deal history from response
  const dealHistory: DealHistoryEntry[] = (data as { dealHistory?: DealHistoryEntry[] })?.dealHistory || [];
  const displayDeals = dealHistory.slice(0, maxItems);
  const hasMore = dealHistory.length > maxItems;

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-alabaster dark:bg-deep-grey border border-gold/10 dark:border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange" />
            <h3 className="font-semibold text-charcoal dark:text-cultured-white">
              {title}
            </h3>
            {dealHistory.length > 0 && (
              <span className="text-xs text-charcoal/50 dark:text-cultured-white/50 bg-bone dark:bg-panel-dark px-2 py-0.5 rounded-full">
                {dealHistory.length}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-charcoal/50 dark:text-cultured-white/50">
            <Building2 className="w-8 h-8 mb-2" />
            <p className="text-sm">Failed to load deal history</p>
          </div>
        ) : dealHistory.length === 0 ? (
          showEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-charcoal/50 dark:text-cultured-white/50">
              <Briefcase className="w-8 h-8 mb-2" />
              <p className="text-sm">No deals yet</p>
              <p className="text-xs mt-1">
                This company is not associated with any deals
              </p>
            </div>
          ) : null
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-bone/50 dark:bg-panel-dark/50 text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wider">
              <div className="col-span-4">Deal Name</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2">Value</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Created</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gold/5 dark:divide-white/5">
              {displayDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.dealId}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 hover:bg-bone/50 dark:hover:bg-panel-dark/50 transition-colors group"
                >
                  {/* Deal Name */}
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="font-medium text-charcoal dark:text-cultured-white group-hover:text-orange transition-colors">
                      {deal.name}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-charcoal/30 dark:text-cultured-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Stage */}
                  <div className="col-span-2 flex items-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        STAGE_COLORS[deal.stage] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatStageName(deal.stage)}
                    </span>
                  </div>

                  {/* Value */}
                  <div className="col-span-2 flex items-center text-sm text-charcoal dark:text-cultured-white">
                    <DollarSign className="w-3.5 h-3.5 mr-1 text-charcoal/40 dark:text-cultured-white/40 md:hidden" />
                    {formatValue(deal.value, deal.currency)}
                  </div>

                  {/* Role */}
                  <div className="col-span-2 flex items-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        ROLE_COLORS[deal.role] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {formatRoleName(deal.role)}
                    </span>
                  </div>

                  {/* Created Date */}
                  <div className="col-span-2 flex items-center text-sm text-charcoal/60 dark:text-cultured-white/60">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-charcoal/40 dark:text-cultured-white/40 md:hidden" />
                    {formatDate(deal.createdAt)}
                  </div>
                </Link>
              ))}
            </div>

            {/* Show More */}
            {hasMore && (
              <div className="px-5 py-3 bg-bone/30 dark:bg-panel-dark/30 text-center">
                <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                  +{dealHistory.length - maxItems} more deals
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export default DealHistoryBlock;
