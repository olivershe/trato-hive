import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import {
  Building2,
  Factory,
  Users,
  DollarSign,
  MapPin,
  Globe,
} from "lucide-react";
import { WatchButton } from "@/components/companies/WatchButton";

export interface CompanyHeaderAttributes {
  companyId: string;
  name: string;
  industry: string | null;
  sector: string | null;
  revenue: string | null;
  employees: number | null;
  location: string | null;
  website: string | null;
  status: string;
  isWatched: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    companyHeaderBlock: {
      setCompanyHeaderBlock: (attrs: CompanyHeaderAttributes) => ReturnType;
    };
  }
}

export const CompanyHeaderBlock = Node.create({
  name: "companyHeaderBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      companyId: { default: "" },
      name: { default: "New Company" },
      industry: { default: null },
      sector: { default: null },
      revenue: { default: null },
      employees: { default: null },
      location: { default: null },
      website: { default: null },
      status: { default: "PROSPECT" },
      isWatched: { default: false },
    };
  },

  parseHTML() {
    return [
      {
        tag: "company-header-block",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["company-header-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CompanyHeaderCard);
  },

  addCommands() {
    return {
      setCompanyHeaderBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "companyHeaderBlock",
            attrs,
          });
        },
    };
  },
});

// Status badge styles
const statusBadgeStyles: Record<string, string> = {
  PROSPECT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RESEARCHING: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  ENGAGED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PIPELINE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ARCHIVED: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

function formatStatusName(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatRevenue(revenue: string | null): string {
  if (!revenue) return "N/A";
  const value = parseFloat(revenue);
  if (isNaN(value)) return revenue;
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatEmployees(employees: number | null): string {
  if (!employees) return "N/A";
  if (employees >= 10000) return `${(employees / 1000).toFixed(0)}K+`;
  if (employees >= 1000) return `${(employees / 1000).toFixed(1)}K`;
  return employees.toLocaleString();
}

function CompanyHeaderCard({ node }: { node: any }) {
  const {
    companyId,
    name,
    industry,
    sector,
    revenue,
    employees,
    location,
    website,
    status,
  } = node.attrs as CompanyHeaderAttributes;

  return (
    <NodeViewWrapper className="my-8 font-sans">
      <div className="bg-white dark:bg-deep-grey border-t-4 border-orange shadow-lg rounded-b-lg p-6 relative overflow-hidden group">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-8 opacity-5 text-orange pointer-events-none">
          <Building2 className="w-32 h-32" />
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-charcoal text-white dark:bg-white dark:text-charcoal">
                COMPANY
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  statusBadgeStyles[status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {formatStatusName(status)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal dark:text-cultured-white">
              {name}
            </h1>
            {(industry || sector) && (
              <p className="text-sm text-charcoal/60 dark:text-cultured-white/60 mt-1 flex items-center gap-1">
                <Factory className="w-4 h-4" />
                {industry}
                {sector && industry && " · "}
                {sector}
              </p>
            )}
          </div>

          {/* Watch Button */}
          {companyId && <WatchButton companyId={companyId} />}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-charcoal/10 dark:border-white/10 relative z-10">
          {/* Revenue */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal dark:text-cultured-white">
                {formatRevenue(revenue)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 font-semibold">
                Revenue
              </div>
            </div>
          </div>

          {/* Employees */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal dark:text-cultured-white">
                {formatEmployees(employees)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 font-semibold">
                Employees
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-charcoal dark:text-cultured-white truncate max-w-[120px]">
                {location || "N/A"}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 font-semibold">
                Location
              </div>
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              {website ? (
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-orange hover:underline truncate block max-w-[120px]"
                >
                  {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              ) : (
                <div className="text-lg font-bold text-charcoal dark:text-cultured-white">
                  N/A
                </div>
              )}
              <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 font-semibold">
                Website
              </div>
            </div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
