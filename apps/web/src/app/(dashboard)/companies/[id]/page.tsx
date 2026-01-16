"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building2,
  Factory,
  Users,
  DollarSign,
  MapPin,
  Globe,
  Briefcase,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { WatchButton } from "@/components/companies/WatchButton";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Tiptap
const BlockEditor = dynamic(
  () => import("@/components/editor/BlockEditor").then((mod) => mod.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-alabaster rounded-xl border border-gold/10">
        <Loader2 className="w-6 h-6 animate-spin text-orange" />
      </div>
    ),
  }
);

// Status badge styles
const statusBadgeStyles: Record<string, string> = {
  PROSPECT: "bg-blue-100 text-blue-700",
  RESEARCHING: "bg-violet-100 text-violet-700",
  ENGAGED: "bg-amber-100 text-amber-700",
  PIPELINE: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-gray-100 text-gray-700",
};

function formatStatusName(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatRevenue(revenue: number | string | null): string {
  if (!revenue) return "N/A";
  const value = typeof revenue === "string" ? parseFloat(revenue) : revenue;
  if (isNaN(value)) return "N/A";
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

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "editor">("overview");

  // Fetch company data with its associated page
  const {
    data: companyData,
    isLoading,
    error,
  } = api.company.getWithPage.useQuery({ id: companyId });

  // Fetch deals associated with this company
  const { data: companyWithDeals } = api.company.getWithDeals.useQuery(
    { id: companyId },
    { enabled: !!companyId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error || !companyData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-charcoal mb-2">Company not found</h2>
        <p className="text-charcoal/60 mb-4">
          The company you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/discovery" className="text-orange hover:underline">
          Back to Discovery
        </Link>
      </div>
    );
  }

  const company = companyData;

  // Deal history from DealCompany junction table
  // Uses the properly typed dealHistory array from company.getWithDeals
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
  const dealHistory: DealHistoryEntry[] = (companyWithDeals as { dealHistory?: DealHistoryEntry[] })?.dealHistory || [];

  return (
    <>
      <div className="p-6">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <Link
            href="/discovery"
            className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discovery
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-charcoal">{company.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusBadgeStyles[company.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {formatStatusName(company.status)}
                </span>
              </div>
              {(company.industry || company.sector) && (
                <p className="text-charcoal/60 mt-1 flex items-center gap-1">
                  <Factory className="w-4 h-4" />
                  {company.industry}
                  {company.sector && company.industry && " · "}
                  {company.sector}
                </p>
              )}
            </div>

            <WatchButton companyId={companyId} />
          </div>
        </div>

        {/* Company Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Revenue
            </div>
            <p className="text-xl font-bold text-charcoal">
              {formatRevenue(company.revenue)}
            </p>
          </div>

          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <Users className="w-4 h-4" />
              Employees
            </div>
            <p className="text-xl font-bold text-charcoal">
              {formatEmployees(company.employees)}
            </p>
          </div>

          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <MapPin className="w-4 h-4" />
              Location
            </div>
            <p className="text-xl font-bold text-charcoal truncate">
              {company.location || "N/A"}
            </p>
          </div>

          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <Globe className="w-4 h-4" />
              Website
            </div>
            {company.website ? (
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-bold text-orange hover:underline truncate block"
              >
                {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            ) : (
              <p className="text-xl font-bold text-charcoal">N/A</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-gold/10">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-orange text-orange"
                : "border-transparent text-charcoal/60 hover:text-charcoal"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("editor")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "editor"
                ? "border-orange text-orange"
                : "border-transparent text-charcoal/60 hover:text-charcoal"
            }`}
          >
            Notes
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deal History */}
            <div className="bg-alabaster rounded-xl p-5 border border-gold/10">
              <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange" />
                Deal History
                {dealHistory.length > 0 && (
                  <span className="text-xs text-charcoal/50 bg-bone px-2 py-0.5 rounded-full">
                    {dealHistory.length}
                  </span>
                )}
              </h3>
              {dealHistory.length === 0 ? (
                <div className="text-center py-8 text-charcoal/50">
                  <Briefcase className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No deals yet</p>
                  <p className="text-xs mt-1">
                    This company is not associated with any deals
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dealHistory.slice(0, 5).map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/deals/${deal.dealId}`}
                      className="block p-3 bg-bone rounded-lg border border-gold/5 hover:bg-bone/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-charcoal">
                          {deal.name}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            deal.stage === "CLOSED_WON"
                              ? "bg-green-100 text-green-700"
                              : deal.stage === "CLOSED_LOST"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {deal.stage.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            deal.role === "PLATFORM"
                              ? "bg-charcoal text-white"
                              : deal.role === "ADD_ON"
                              ? "bg-orange/20 text-orange"
                              : deal.role === "SELLER"
                              ? "bg-emerald-100 text-emerald-700"
                              : deal.role === "BUYER"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-violet-100 text-violet-700"
                          }`}
                        >
                          {deal.role.replace(/_/g, " ")}
                        </span>
                        {deal.value && (
                          <p className="text-xs text-charcoal/60">
                            {formatRevenue(deal.value)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                  {dealHistory.length > 5 && (
                    <p className="text-sm text-charcoal/50 text-center">
                      +{dealHistory.length - 5} more deals
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="bg-alabaster rounded-xl p-5 border border-gold/10">
              <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-citation" />
                AI Summary
              </h3>
              {company.aiSummary ? (
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  {company.aiSummary}
                </p>
              ) : (
                <div className="text-center py-8 text-charcoal/50">
                  <FileText className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No AI summary yet</p>
                  <p className="text-xs mt-1">
                    Upload documents to generate insights
                  </p>
                </div>
              )}
            </div>

            {/* Company Description */}
            {company.description && (
              <div className="bg-alabaster rounded-xl p-5 border border-gold/10 lg:col-span-2">
                <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange" />
                  About
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  {company.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Tab - Full Width */}
      {activeTab === "editor" && (
        <>
          {company.page?.id ? (
            <BlockEditor pageId={company.page.id} className="w-full" />
          ) : (
            <div className="p-6">
              <p className="text-charcoal/50 italic">
                No page associated with this company
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
}
