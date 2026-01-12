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
      <div className="flex items-center justify-center h-[400px] bg-alabaster rounded-xl border border-gold/10">
        <Loader2 className="w-6 h-6 animate-spin text-orange" />
      </div>
    ),
  }
);

// Breadcrumb component
function Breadcrumbs({ pageId, dealId }: { pageId: string; dealId: string }) {
  const { data: breadcrumbs } = api.page.getBreadcrumbs.useQuery({ pageId });

  if (!breadcrumbs?.length) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-charcoal/60 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="w-3.5 h-3.5" />}
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

// Backlinks panel
function BacklinksPanel({ pageId }: { pageId: string }) {
  const params = useParams();
  const dealId = params.id as string;
  const { data: backlinks } = api.page.getBacklinks.useQuery({ pageId });

  if (!backlinks?.length) return null;

  return (
    <div className="bg-alabaster/50 rounded-lg p-3 mb-4 border border-gold/10">
      <div className="flex items-center gap-2 text-xs font-medium text-charcoal/50 uppercase tracking-wider mb-2">
        <Link2 className="w-3.5 h-3.5" />
        {backlinks.length} backlink{backlinks.length !== 1 ? "s" : ""}
      </div>
      <div className="space-y-1">
        {backlinks.map((link) => (
          <Link
            key={`${link.sourcePageId}-${link.blockId}`}
            href={`/deals/${dealId}/pages/${link.sourcePageId}`}
            className="block text-sm text-charcoal/70 hover:text-orange transition-colors"
          >
            {link.sourcePageTitle || "Untitled"}
          </Link>
        ))}
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
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs pageId={pageId} dealId={dealId} />

      {/* Backlinks */}
      <BacklinksPanel pageId={pageId} />

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          {page.icon && <span className="text-4xl">{page.icon}</span>}
          <h1 className="text-3xl font-bold text-charcoal">
            {page.title || "Untitled"}
          </h1>
        </div>
        {page.coverImage && (
          <div
            className="mt-4 h-48 bg-cover bg-center rounded-xl"
            style={{ backgroundImage: `url(${page.coverImage})` }}
          />
        )}
      </div>

      {/* Database properties (if this is a database entry page) */}
      {page.databaseEntry && page.databaseEntry.database && (
        <div className="mb-6 p-4 bg-alabaster rounded-xl border border-gold/10">
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
      )}

      {/* Block Editor */}
      <div className="bg-white rounded-xl border border-gold/10 p-6">
        <BlockEditor pageId={pageId} />
      </div>
    </div>
  );
}
