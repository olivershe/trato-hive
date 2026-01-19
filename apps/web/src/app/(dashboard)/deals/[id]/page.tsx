"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { PinButton } from "@/components/sidebar";

// Dynamic import to avoid SSR issues with Tiptap/Liveblocks
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

// Stage badge colors
const stageBadgeStyles: Record<string, string> = {
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
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatValue(value: number | null): string {
  if (!value) return "$0";
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "Not set";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [activeTab, setActiveTab] = useState<"overview" | "notes">("overview");

  // Fetch deal data with its associated page (for BlockEditor)
  const { data: dealData, isLoading, error } = api.deal.getWithPage.useQuery({ id: dealId });

  // Fetch fact sheet
  const { data: factSheet } = api.deal.getFactSheet.useQuery({ dealId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error || !dealData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-charcoal mb-2">Deal not found</h2>
        <p className="text-charcoal/60 mb-4">
          The deal you're looking for doesn't exist or you don't have access.
        </p>
        <Link href="/deals" className="text-orange hover:underline">
          Back to deals
        </Link>
      </div>
    );
  }

  // Cast to include company relation (included by service but not in Prisma base type)
  const deal = dealData as typeof dealData & {
    company?: { id: string; name: string } | null;
  };

  return (
    <>
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deals
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-charcoal">{deal.name}</h1>
              <PinButton
                item={{
                  type: "deal",
                  title: deal.name,
                  href: `/deals/${dealId}`,
                  icon: "💼",
                }}
              />
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stageBadgeStyles[deal.stage] || "bg-gray-100 text-gray-700"
                }`}
              >
                {formatStageName(deal.stage)}
              </span>
            </div>
            {deal.company && (
              <p className="text-charcoal/60 mt-1 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {deal.company.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/deals/${dealId}/diligence`}
              className="flex items-center gap-2 px-4 py-2 bg-alabaster border border-gold/20 rounded-lg hover:bg-bone transition-colors"
            >
              <FileText className="w-4 h-4" />
              Data Room
            </Link>
            <Link
              href={`/deals/${dealId}/export`}
              className="flex items-center gap-2 px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </Link>
          </div>
        </div>
      </div>

      {/* Deal Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
          <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Deal Value
          </div>
          <p className="text-xl font-bold text-charcoal">
            {formatValue(deal.value ? Number(deal.value) : null)}
          </p>
        </div>

        <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
          <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Probability
          </div>
          <p className="text-xl font-bold text-charcoal">{deal.probability ?? 0}%</p>
        </div>

        <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
          <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            Expected Close
          </div>
          <p className="text-xl font-bold text-charcoal">
            {formatDate(deal.expectedCloseDate)}
          </p>
        </div>

        <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
          <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
            <Edit3 className="w-4 h-4" />
            Deal Type
          </div>
          <p className="text-xl font-bold text-charcoal capitalize">
            {deal.type.toLowerCase()}
          </p>
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
          onClick={() => setActiveTab("notes")}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "notes"
              ? "border-orange text-orange"
              : "border-transparent text-charcoal/60 hover:text-charcoal"
          }`}
        >
          Editor
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fact Sheet */}
          <div className="bg-alabaster rounded-xl p-5 border border-gold/10">
            <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-citation" />
              Verified Facts
            </h3>
            {!factSheet?.facts.length ? (
              <div className="text-center py-8 text-charcoal/50">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No verified facts yet</p>
                <p className="text-xs mt-1">
                  Upload documents to extract facts
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {factSheet.facts.slice(0, 5).map((fact: { id: string; subject: string; predicate: string; object: string; confidence: number }) => (
                  <div
                    key={fact.id}
                    className="p-3 bg-bone rounded-lg border border-gold/5"
                  >
                    <p className="text-sm text-charcoal">
                      <span className="font-medium">{fact.subject}</span>{" "}
                      <span className="text-charcoal/60">{fact.predicate}</span>{" "}
                      <span className="text-citation font-medium">{fact.object}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 bg-charcoal/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-citation rounded-full"
                          style={{ width: `${fact.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-charcoal/50">
                        {Math.round(fact.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
                {factSheet.facts.length > 5 && (
                  <p className="text-sm text-charcoal/50 text-center">
                    +{factSheet.facts.length - 5} more facts
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-alabaster rounded-xl p-5 border border-gold/10">
            <h3 className="font-semibold text-charcoal mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href={`/deals/${dealId}/diligence`}
                className="flex items-center gap-3 p-3 bg-bone rounded-lg hover:bg-bone/80 transition-colors"
              >
                <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">Data Room</p>
                  <p className="text-xs text-charcoal/60">
                    Upload and review documents
                  </p>
                </div>
              </Link>

              <Link
                href={`/deals/${dealId}/export`}
                className="flex items-center gap-3 p-3 bg-bone rounded-lg hover:bg-bone/80 transition-colors"
              >
                <div className="w-10 h-10 bg-orange/10 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <p className="font-medium text-charcoal">Export Report</p>
                  <p className="text-xs text-charcoal/60">
                    Generate PPTX or DOCX
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === "overview" && null}
    </div>

    {/* Editor Tab - Full Width (Outside padding container) */}
    {activeTab === "notes" && (
      <>
        {deal.page?.id ? (
          <BlockEditor
            pageId={deal.page.id}
            className="w-full"
          />
        ) : (
          <div className="p-6">
            <p className="text-charcoal/50 italic">No page associated with this deal</p>
          </div>
        )}
      </>
    )}
  </>
  );
}
