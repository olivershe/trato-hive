/**
 * RelatedCompaniesBlock - Tiptap extension for related companies
 *
 * [TASK-105] Related Companies Section
 *
 * Displays companies related by:
 * - Same industry/sector
 * - Same location
 * - Similar size
 * - Shared facts (via Neo4j when available)
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import Link from "next/link";
import {
  Building2,
  Loader2,
  Users,
  MapPin,
  Factory,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface RelatedCompaniesBlockAttributes {
  companyId: string;
  title: string;
  maxItems: number;
  showEmpty: boolean;
}

interface RelatedCompanyResult {
  id: string;
  name: string;
  industry: string | null;
  sector: string | null;
  location: string | null;
  employees: number | null;
  revenue: number | null;
  similarityScore: number;
  relationshipTypes: string[];
}

// =============================================================================
// Tiptap Type Augmentation
// =============================================================================

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    relatedCompaniesBlock: {
      setRelatedCompaniesBlock: (attrs: Partial<RelatedCompaniesBlockAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatEmployees(employees: number | null): string {
  if (!employees) return "—";
  if (employees >= 10000) return `${(employees / 1000).toFixed(0)}K+`;
  if (employees >= 1000) return `${(employees / 1000).toFixed(1)}K`;
  return employees.toLocaleString();
}

function formatRevenue(revenue: number | null): string {
  if (!revenue) return "—";
  if (revenue >= 1000000000) return `$${(revenue / 1000000000).toFixed(1)}B`;
  if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(0)}M`;
  if (revenue >= 1000) return `$${(revenue / 1000).toFixed(0)}K`;
  return `$${revenue.toFixed(0)}`;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (score >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
}

// =============================================================================
// Tiptap Extension
// =============================================================================

export const RelatedCompaniesBlock = Node.create({
  name: "relatedCompaniesBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      companyId: { default: "" },
      title: { default: "Related Companies" },
      maxItems: { default: 6 },
      showEmpty: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: "related-companies-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["related-companies-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RelatedCompaniesCard);
  },

  addCommands() {
    return {
      setRelatedCompaniesBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "relatedCompaniesBlock",
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
function RelatedCompaniesCard({ node }: { node: any }) {
  const { companyId, title, maxItems, showEmpty } = node.attrs as RelatedCompaniesBlockAttributes;

  // Fetch related companies
  const { data, isLoading, error } = api.company.getRelated.useQuery(
    { id: companyId, limit: maxItems },
    { enabled: !!companyId }
  );

  const relatedCompanies: RelatedCompanyResult[] = data || [];

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-alabaster dark:bg-deep-grey border border-gold/10 dark:border-white/10 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange" />
            <h3 className="font-semibold text-charcoal dark:text-cultured-white">
              {title}
            </h3>
            {relatedCompanies.length > 0 && (
              <span className="text-xs text-charcoal/50 dark:text-cultured-white/50 bg-bone dark:bg-panel-dark px-2 py-0.5 rounded-full">
                {relatedCompanies.length}
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
            <p className="text-sm">Failed to load related companies</p>
          </div>
        ) : relatedCompanies.length === 0 ? (
          showEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-charcoal/50 dark:text-cultured-white/50">
              <Building2 className="w-8 h-8 mb-2" />
              <p className="text-sm">No related companies found</p>
              <p className="text-xs mt-1">
                Companies with similar industry or location will appear here
              </p>
            </div>
          ) : null
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {relatedCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="group bg-bone dark:bg-panel-dark rounded-lg p-4 border border-gold/5 dark:border-white/5 hover:border-orange/30 hover:shadow-md transition-all"
              >
                {/* Company Name & Score */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-charcoal dark:text-cultured-white group-hover:text-orange transition-colors truncate">
                      {company.name}
                    </h4>
                    {company.industry && (
                      <p className="text-xs text-charcoal/60 dark:text-cultured-white/60 truncate mt-0.5">
                        {company.industry}
                        {company.sector && ` · ${company.sector}`}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${getScoreColor(
                      company.similarityScore
                    )}`}
                  >
                    {company.similarityScore}%
                  </span>
                </div>

                {/* Relationship Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {company.relationshipTypes.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-charcoal/5 dark:bg-white/5 rounded text-[10px] text-charcoal/70 dark:text-cultured-white/70"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {/* Company Stats */}
                <div className="flex items-center gap-4 text-xs text-charcoal/50 dark:text-cultured-white/50">
                  {company.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">
                        {company.location.split(",")[0]}
                      </span>
                    </div>
                  )}
                  {company.employees && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{formatEmployees(company.employees)}</span>
                    </div>
                  )}
                  {company.revenue && (
                    <div className="flex items-center gap-1">
                      <Factory className="w-3 h-3" />
                      <span>{formatRevenue(company.revenue)}</span>
                    </div>
                  )}
                </div>

                {/* View Link */}
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-gold/5 dark:border-white/5">
                  <span className="flex items-center gap-1 text-xs text-orange opacity-0 group-hover:opacity-100 transition-opacity">
                    View Company
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export default RelatedCompaniesBlock;
