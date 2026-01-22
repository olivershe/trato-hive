"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/layouts/PageHeader";
import { api } from "@/trpc/react";
import {
  Search,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  Upload,
  ArrowLeft,
  Filter,
  X,
  File,
  FileImage,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Document type badge colors (not using teal - that's for citations only)
const DOC_TYPE_COLORS: Record<string, string> = {
  financial_statement: "bg-emerald-100 text-emerald-700",
  merger_agreement: "bg-violet-100 text-violet-700",
  due_diligence_report: "bg-blue-100 text-blue-700",
  letter_of_intent: "bg-amber-100 text-amber-700",
  nda_confidentiality: "bg-red-100 text-red-700",
  board_resolution: "bg-pink-100 text-pink-700",
  legal_contract: "bg-indigo-100 text-indigo-700",
  technical_document: "bg-slate-100 text-slate-700",
  presentation_deck: "bg-orange/20 text-orange",
  corporate_filing: "bg-cyan-100 text-cyan-700",
  valuation_report: "bg-fuchsia-100 text-fuchsia-700",
  other: "bg-charcoal/10 text-charcoal/70",
};

const INDUSTRY_COLORS: Record<string, string> = {
  technology: "bg-blue-50 text-blue-600",
  healthcare: "bg-green-50 text-green-600",
  energy: "bg-amber-50 text-amber-600",
  financial_services: "bg-emerald-50 text-emerald-600",
  consumer: "bg-pink-50 text-pink-600",
  industrial: "bg-slate-50 text-slate-600",
  real_estate: "bg-violet-50 text-violet-600",
  media_entertainment: "bg-purple-50 text-purple-600",
  telecommunications: "bg-cyan-50 text-cyan-600",
  transportation: "bg-orange/10 text-orange",
  other: "bg-charcoal/5 text-charcoal/60",
};

const CONTENT_TAG_COLORS: Record<string, string> = {
  confidential: "bg-red-50 text-red-600",
  draft: "bg-amber-50 text-amber-600",
  final: "bg-emerald-50 text-emerald-600",
  needs_review: "bg-orange/10 text-orange",
  executive_summary: "bg-blue-50 text-blue-600",
  appendix: "bg-slate-50 text-slate-600",
  audited: "bg-green-50 text-green-600",
  unaudited: "bg-amber-50 text-amber-600",
  sensitive: "bg-red-50 text-red-600",
  historical: "bg-slate-50 text-slate-600",
  projected: "bg-violet-50 text-violet-600",
};

function formatTagLabel(tag: string): string {
  return tag
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("image")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return Presentation;
  if (mimeType.includes("pdf")) return File;
  return FileText;
}

interface TagBadgeProps {
  tag: string;
  type: "documentType" | "industry" | "content";
  onRemove?: () => void;
}

function TagBadge({ tag, type, onRemove }: TagBadgeProps) {
  let colorClass = "";
  if (type === "documentType") {
    colorClass = DOC_TYPE_COLORS[tag] || DOC_TYPE_COLORS.other;
  } else if (type === "industry") {
    colorClass = INDUSTRY_COLORS[tag] || INDUSTRY_COLORS.other;
  } else {
    colorClass = CONTENT_TAG_COLORS[tag] || "bg-charcoal/5 text-charcoal/60";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {formatTagLabel(tag)}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

interface DocumentRowProps {
  document: {
    id: string;
    name: string;
    mimeType: string;
    fileSize: number;
    aiDocumentType: string | null;
    aiIndustry: string | null;
    contentTags: string[];
    createdAt: Date;
    uploadedBy: { name: string | null; email: string };
  };
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

function DocumentRow({ document, onDownload, onDelete }: DocumentRowProps) {
  const FileIcon = getFileIcon(document.mimeType);
  const uploadedByName = document.uploadedBy.name || document.uploadedBy.email;

  return (
    <tr className="border-b border-gold/10 hover:bg-alabaster/50 transition-colors">
      {/* File */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-bone rounded flex items-center justify-center flex-shrink-0">
            <FileIcon className="w-4 h-4 text-charcoal/50" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-charcoal truncate">{document.name}</p>
            <p className="text-xs text-charcoal/50">
              {formatFileSize(document.fileSize)} · {uploadedByName}
            </p>
          </div>
        </div>
      </td>

      {/* Document Type */}
      <td className="px-4 py-3">
        {document.aiDocumentType ? (
          <TagBadge tag={document.aiDocumentType} type="documentType" />
        ) : (
          <span className="text-xs text-charcoal/40">—</span>
        )}
      </td>

      {/* Industry */}
      <td className="px-4 py-3">
        {document.aiIndustry ? (
          <TagBadge tag={document.aiIndustry} type="industry" />
        ) : (
          <span className="text-xs text-charcoal/40">—</span>
        )}
      </td>

      {/* Tags */}
      <td className="px-4 py-3">
        {document.contentTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {document.contentTags.slice(0, 3).map((tag) => (
              <TagBadge key={tag} tag={tag} type="content" />
            ))}
            {document.contentTags.length > 3 && (
              <span className="text-xs text-charcoal/50">+{document.contentTags.length - 3}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-charcoal/40">—</span>
        )}
      </td>

      {/* Uploaded */}
      <td className="px-4 py-3 text-sm text-charcoal/60">
        {new Date(document.createdAt).toLocaleDateString()}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDownload(document.id)}
            className="p-1.5 text-charcoal/50 hover:text-orange hover:bg-orange/10 rounded transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(document.id)}
            className="p-1.5 text-charcoal/50 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function DealVaultPage() {
  const params = useParams();
  const dealId = params.dealId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedContentTags, setSelectedContentTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch deal info
  const { data: deal } = api.deal.get.useQuery(
    { id: dealId },
    { enabled: !!dealId }
  );

  // Fetch documents
  const {
    data: documentsData,
    isLoading,
    error,
    refetch,
  } = api.vdr.listDocuments.useQuery({
    dealId,
    search: searchQuery || undefined,
    documentTypes: selectedDocTypes.length > 0 ? selectedDocTypes : undefined,
    industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
    contentTags: selectedContentTags.length > 0 ? selectedContentTags : undefined,
    page: 1,
    pageSize: 100,
  });

  // Fetch available tags for filters
  const { data: availableTags } = api.vdr.getAvailableTags.useQuery({ dealId });


  // Delete mutation
  const deleteMutation = api.vdr.deleteDocument.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDownload = useCallback(async (documentId: string) => {
    // In a real app, we'd fetch the download URL and open it
    // For now, we'll just log
    console.log("Download document:", documentId);
  }, []);

  const handleDelete = useCallback(
    (documentId: string) => {
      if (confirm("Are you sure you want to delete this document?")) {
        deleteMutation.mutate({ documentId, deleteFromStorage: true });
      }
    },
    [deleteMutation]
  );

  const clearFilters = () => {
    setSelectedDocTypes([]);
    setSelectedIndustries([]);
    setSelectedContentTags([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedDocTypes.length > 0 ||
    selectedIndustries.length > 0 ||
    selectedContentTags.length > 0;

  return (
    <div className="px-12 py-8">
      {/* Back link and header */}
      <div className="mb-6">
        <Link
          href="/vault"
          className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-orange transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vault
        </Link>

        <PageHeader
          title={deal?.name || "Deal Documents"}
          subtitle="Manage and organize documents for this deal"
          actions={
            <button
              className="
                flex items-center gap-2 px-4 py-2
                bg-orange text-white rounded-lg
                hover:bg-orange/90 transition-colors
              "
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          }
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-10 pr-4 py-2.5
                bg-alabaster border border-gold/20 rounded-lg
                text-charcoal placeholder:text-charcoal/40
                focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange
              "
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors
              ${
                showFilters || hasActiveFilters
                  ? "bg-orange/10 border-orange/30 text-orange"
                  : "bg-alabaster border-gold/20 text-charcoal/70 hover:border-orange/30"
              }
            `}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedDocTypes.length + selectedIndustries.length + selectedContentTags.length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-charcoal/60 hover:text-orange transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-alabaster rounded-xl p-4 border border-gold/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Document Type Filter */}
              <div>
                <label className="text-xs font-medium text-charcoal/60 uppercase tracking-wider mb-2 block">
                  Document Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags?.documentTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setSelectedDocTypes((prev) =>
                          prev.includes(type)
                            ? prev.filter((t) => t !== type)
                            : [...prev, type]
                        )
                      }
                      className={`
                        px-2.5 py-1 rounded text-xs font-medium transition-colors
                        ${
                          selectedDocTypes.includes(type)
                            ? DOC_TYPE_COLORS[type] || DOC_TYPE_COLORS.other
                            : "bg-bone text-charcoal/60 hover:bg-gold/20"
                        }
                      `}
                    >
                      {formatTagLabel(type)}
                    </button>
                  ))}
                  {!availableTags?.documentTypes.length && (
                    <span className="text-xs text-charcoal/40">No types available</span>
                  )}
                </div>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="text-xs font-medium text-charcoal/60 uppercase tracking-wider mb-2 block">
                  Industry
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags?.industries.map((industry) => (
                    <button
                      key={industry}
                      onClick={() =>
                        setSelectedIndustries((prev) =>
                          prev.includes(industry)
                            ? prev.filter((i) => i !== industry)
                            : [...prev, industry]
                        )
                      }
                      className={`
                        px-2.5 py-1 rounded text-xs font-medium transition-colors
                        ${
                          selectedIndustries.includes(industry)
                            ? INDUSTRY_COLORS[industry] || INDUSTRY_COLORS.other
                            : "bg-bone text-charcoal/60 hover:bg-gold/20"
                        }
                      `}
                    >
                      {formatTagLabel(industry)}
                    </button>
                  ))}
                  {!availableTags?.industries.length && (
                    <span className="text-xs text-charcoal/40">No industries available</span>
                  )}
                </div>
              </div>

              {/* Content Tags Filter */}
              <div>
                <label className="text-xs font-medium text-charcoal/60 uppercase tracking-wider mb-2 block">
                  Content Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags?.contentTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setSelectedContentTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={`
                        px-2.5 py-1 rounded text-xs font-medium transition-colors
                        ${
                          selectedContentTags.includes(tag)
                            ? CONTENT_TAG_COLORS[tag] || "bg-charcoal/10 text-charcoal/70"
                            : "bg-bone text-charcoal/60 hover:bg-gold/20"
                        }
                      `}
                    >
                      {formatTagLabel(tag)}
                    </button>
                  ))}
                  {!availableTags?.contentTags.length && (
                    <span className="text-xs text-charcoal/40">No tags available</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 bg-alabaster rounded-xl border border-gold/10">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-charcoal/60 font-medium">Failed to load documents</p>
          <p className="text-sm text-charcoal/40 mt-1">{error.message}</p>
        </div>
      ) : !documentsData?.items.length ? (
        <div className="flex flex-col items-center justify-center h-64 bg-alabaster rounded-xl border border-gold/10">
          <FileText className="w-12 h-12 text-charcoal/30 mb-3" />
          <p className="text-charcoal/60 font-medium">No documents found</p>
          <p className="text-sm text-charcoal/40 mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters"
              : "Upload documents to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gold/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-alabaster border-b border-gold/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documentsData.items.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    document={doc}
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          <div className="px-4 py-3 border-t border-gold/10 bg-alabaster/50">
            <p className="text-sm text-charcoal/50">
              Showing {documentsData.items.length} of {documentsData.pagination.total} documents
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
