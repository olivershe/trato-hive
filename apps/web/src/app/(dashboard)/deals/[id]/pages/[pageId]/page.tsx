"use client";

import { useParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/trpc/react";
import { Loader2, ChevronRight, Link2, Sparkles } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { GenerationTemplate } from "@trato-hive/ai-core";
import { DealPropertiesInlineDatabase } from "@/components/deals/DealPropertiesInlineDatabase";
import { AIGenerateModal } from "@/components/editor/AIGenerateModal";
import { AIGenerationToolbar } from "@/components/editor/AIGenerationToolbar";
import { useAIPageGeneration } from "@/hooks/useAIPageGeneration";
import { useAIGenerateModal } from "@/hooks/useAIGenerateModal";

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

// Editable page title component - Notion style
function EditableTitle({
  pageId,
  initialTitle,
  icon,
}: {
  pageId: string;
  initialTitle: string;
  icon?: string | null;
}) {
  const [title, setTitle] = useState(initialTitle || "Untitled");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const updateMutation = api.page.update.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh sidebar and breadcrumbs
      utils.page.get.invalidate({ id: pageId });
      utils.page.getTree.invalidate();
      utils.page.getBreadcrumbs.invalidate({ pageId });
    },
  });

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const trimmedTitle = title.trim() || "Untitled";
    setTitle(trimmedTitle);

    if (trimmedTitle !== initialTitle) {
      updateMutation.mutate({ id: pageId, title: trimmedTitle });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setTitle(initialTitle || "Untitled");
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {icon && <span className="text-5xl">{icon}</span>}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-4xl font-bold text-charcoal bg-transparent border-none outline-none w-full focus:ring-0"
          placeholder="Untitled"
        />
      ) : (
        <h1
          onClick={() => setIsEditing(true)}
          className="text-4xl font-bold text-charcoal cursor-text hover:bg-charcoal/5 rounded px-1 -mx-1 transition-colors"
        >
          {title}
        </h1>
      )}
    </div>
  );
}

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
  const { isOpen: showGenerateModal, close: closeGenerateModal } = useAIGenerateModal();

  const {
    startGeneration,
    isGenerating,
    isComplete,
    progress,
    error: generationError,
    accept,
    discard,
    regenerate,
  } = useAIPageGeneration();

  const handleGenerate = useCallback(
    (params: { prompt: string; template?: GenerationTemplate; enableWebSearch?: boolean }) => {
      startGeneration({
        ...params,
        dealId,
        context: { dealId },
      });
    },
    [startGeneration, dealId]
  );

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

      {/* Page Header - Notion style with editable title */}
      <div className="px-24 pt-8 pb-4">
        <EditableTitle
          pageId={pageId}
          initialTitle={page.title}
          icon={page.icon}
        />
      </div>

      {/* Backlinks - subtle indicator */}
      <BacklinksPanel pageId={pageId} />

      {/* Deal Properties Inline Database - show on root pages (no parent) */}
      {page.dealId && !page.parentPageId && (
        <DealPropertiesInlineDatabase dealId={page.dealId} />
      )}

      {/* Empty page AI prompt */}
      {!isGenerating && !isComplete && (page.title === "Untitled" || page.title === "New Page") && (
        <div className="px-24 pb-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('ai:generate-page'))}
            className="flex items-center gap-2 text-sm text-charcoal/40 hover:text-orange transition-colors group"
          >
            <Sparkles className="w-4 h-4 group-hover:text-orange" />
            <span>Start writing, or generate with AI...</span>
          </button>
        </div>
      )}

      {/* Block Editor - full width, no border */}
      <BlockEditor pageId={pageId} />

      {/* AI Generation Toolbar */}
      <AIGenerationToolbar
        isGenerating={isGenerating}
        isComplete={isComplete}
        error={generationError}
        progress={progress}
        onAccept={accept}
        onDiscard={discard}
        onRegenerate={regenerate}
      />

      {/* AI Generate Modal */}
      <AIGenerateModal
        isOpen={showGenerateModal}
        onClose={closeGenerateModal}
        onGenerate={handleGenerate}
        dealId={dealId}
      />
    </div>
  );
}
