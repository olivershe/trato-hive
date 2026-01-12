"use client";

import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, ChevronRight, Link2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Tiptap/Liveblocks
const BlockEditor = dynamic(
  () => import("@/components/editor/BlockEditor").then((mod) => mod.BlockEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-orange" />
      </div>
    ),
  }
);

// Breadcrumb component - Notion style (subtle, at very top)
function Breadcrumbs({ pageId, dealId }: { pageId: string; dealId: string }) {
  const { data: breadcrumbs } = api.page.getBreadcrumbs.useQuery({ pageId });

  if (!breadcrumbs?.length) return null;

  return (
    <nav className="flex items-center gap-1 text-xs text-charcoal/50 px-24 py-2">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3 h-3" />}
          <Link
            href={`/deals/${dealId}/pages/${crumb.id}`}
            className="hover:text-charcoal transition-colors"
          >
            {crumb.title || "Untitled"}
          </Link>
        </span>
      ))}
    </nav>
  );
}

// Backlinks panel - collapsed by default like Notion
function BacklinksPanel({ pageId }: { pageId: string }) {
  const { data: backlinks } = api.page.getBacklinks.useQuery({ pageId });

  if (!backlinks?.length) return null;

  return (
    <div className="px-24 mb-2">
      <div className="inline-flex items-center gap-1.5 text-xs text-charcoal/40 hover:text-charcoal/60 cursor-pointer transition-colors">
        <Link2 className="w-3 h-3" />
        <span>{backlinks.length} backlink{backlinks.length !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

export default function PageView() {
  const params = useParams();
  const dealId = params.id as string;
  const pageId = params.pageId as string;

  // Fetch page with blocks
  const { data: page, isLoading, error } = api.page.get.useQuery({ id: pageId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-charcoal/60">
        <p className="font-medium">Page not found</p>
        <p className="text-sm mt-1">This page may have been deleted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumbs - subtle at top */}
      <Breadcrumbs pageId={pageId} dealId={dealId} />

      {/* Page Header - Notion style */}
      <div className="px-24 pt-8 pb-4">
        <div className="flex items-center gap-3">
          {page.icon && <span className="text-5xl">{page.icon}</span>}
          <h1 className="text-4xl font-bold text-charcoal">
            {page.title || "Untitled"}
          </h1>
        </div>
      </div>

      {/* Backlinks - subtle indicator */}
      <BacklinksPanel pageId={pageId} />

      {/* Database properties (if this is a database entry page) */}
      {page.databaseEntry && page.databaseEntry.database && (
        <div className="px-24 mb-4">
          <div className="p-4 bg-alabaster/50 rounded-lg">
            <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wider mb-3">
              Properties
            </p>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(page.databaseEntry.properties as Record<string, unknown>).map(
                ([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-charcoal/50">{key}</p>
                    <p className="text-sm text-charcoal">
                      {String(value ?? "-")}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Block Editor - full width, no border */}
      <BlockEditor pageId={pageId} />
    </div>
  );
}
