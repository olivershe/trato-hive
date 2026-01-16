"use client";

/**
 * Document Detail Page
 *
 * Displays a document with its PDF viewer, extracted facts, and Q&A interface.
 * Uses the DOCUMENT_PAGE template created by DocumentService.
 *
 * [TASK-111] Document Page Route
 */
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  User,
  HardDrive,
  Download,
} from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";

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

// =============================================================================
// Status Badge Styles
// =============================================================================

const STATUS_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  UPLOADING: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Uploading",
  },
  PROCESSING: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Processing",
  },
  PARSED: {
    bg: "bg-violet-100",
    text: "text-violet-700",
    label: "Parsed",
  },
  INDEXED: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "Ready",
  },
  FAILED: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Failed",
  },
};

// =============================================================================
// Utility Functions
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.includes("word")) return "Word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "Excel";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "PowerPoint";
  return "File";
}

// =============================================================================
// Page Component
// =============================================================================

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params.id as string;
  const [activeTab, setActiveTab] = useState<"document" | "notes">("document");

  // Fetch document data with its associated page
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const documentQuery = (api as any).document?.getWithPage?.useQuery?.({ documentId }) ?? {
    data: undefined,
    isLoading: true,
    error: null,
  };
  const { data: documentData, isLoading, error } = documentQuery;

  // Mutation to ensure page exists (creates if needed)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ensurePageMutation = (api as any).document?.ensurePage?.useMutation?.() ?? {
    mutateAsync: async () => {},
    isPending: false,
  };

  // Fetch download URL
  const { data: downloadUrlData } = api.vdr.getDownloadUrl.useQuery(
    { documentId },
    { enabled: !!documentId }
  );

  // Create page if document is ready but page doesn't exist
  const handleCreatePage = async () => {
    try {
      await ensurePageMutation.mutateAsync({ documentId });
    } catch {
      // Error handling - page creation failed
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-charcoal mb-2">Document not found</h2>
        <p className="text-charcoal/60 mb-4">
          The document you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/vdr" className="text-orange hover:underline">
          Back to Data Room
        </Link>
      </div>
    );
  }

  const document = documentData;
  const statusStyle = STATUS_BADGE_STYLES[document.status] || STATUS_BADGE_STYLES.PROCESSING;

  return (
    <>
      <div className="p-6">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <Link
            href="/vdr"
            className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Data Room
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange/10 rounded-lg">
                  <FileText className="w-6 h-6 text-orange" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-charcoal">{document.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Button */}
            {downloadUrlData?.url && (
              <a
                href={downloadUrlData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange hover:bg-orange/90 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
          </div>
        </div>

        {/* Document Metadata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Type
            </div>
            <p className="text-xl font-bold text-charcoal">
              {getFileTypeLabel(document.mimeType)}
            </p>
          </div>

          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <HardDrive className="w-4 h-4" />
              Size
            </div>
            <p className="text-xl font-bold text-charcoal">
              {formatFileSize(document.fileSize)}
            </p>
          </div>

          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <User className="w-4 h-4" />
              Uploaded by
            </div>
            <p className="text-xl font-bold text-charcoal truncate">
              {document.uploadedBy.name || document.uploadedBy.email}
            </p>
          </div>

          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="flex items-center gap-2 text-charcoal/60 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Uploaded
            </div>
            <p className="text-xl font-bold text-charcoal">
              {formatDate(document.createdAt)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-gold/10">
          <button
            onClick={() => setActiveTab("document")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "document"
                ? "border-orange text-orange"
                : "border-transparent text-charcoal/60 hover:text-charcoal"
            }`}
          >
            Document
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "notes"
                ? "border-orange text-orange"
                : "border-transparent text-charcoal/60 hover:text-charcoal"
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "document" && (
        <>
          {document.page?.id ? (
            <BlockEditor pageId={document.page.id} className="w-full" />
          ) : (
            <div className="p-6">
              <div className="bg-alabaster rounded-xl p-8 border border-gold/10 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-charcoal/20" />
                <h3 className="text-lg font-semibold text-charcoal mb-2">
                  Document Page Not Ready
                </h3>
                {document.status === "INDEXED" ? (
                  <>
                    <p className="text-charcoal/60 mb-4">
                      This document has been processed but doesn&apos;t have a page yet.
                    </p>
                    <button
                      onClick={handleCreatePage}
                      disabled={ensurePageMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange hover:bg-orange/90 disabled:bg-orange/50 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      {ensurePageMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      Create Document Page
                    </button>
                  </>
                ) : (
                  <p className="text-charcoal/60">
                    The document page will be created automatically after processing completes.
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "notes" && (
        <div className="p-6">
          <div className="bg-alabaster rounded-xl p-8 border border-gold/10 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-charcoal/20" />
            <p className="text-charcoal/60">
              Notes feature coming soon
            </p>
          </div>
        </div>
      )}
    </>
  );
}
