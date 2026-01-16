/**
 * DocumentViewerBlock - Tiptap extension for embedded PDF/document viewing
 *
 * Displays documents with navigation controls, zoom, and status indicators.
 * Supports highlighting chunks for citation linking.
 *
 * [TASK-110] Document Pages Implementation
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback } from "react";
import {
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  AlertCircle,
  File,
} from "lucide-react";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface DocumentViewerBlockAttributes {
  documentId: string;
  currentPage: number;
  totalPages: number;
  zoomLevel: number; // 0.5, 0.75, 1, 1.25, 1.5, 2
  viewMode: "fit-width" | "fit-page" | "custom";
  highlightedChunkId: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    documentViewerBlock: {
      setDocumentViewerBlock: (
        attrs: Partial<DocumentViewerBlockAttributes>
      ) => ReturnType;
    };
  }
}

// =============================================================================
// Node Extension
// =============================================================================

export const DocumentViewerBlock = Node.create({
  name: "documentViewerBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      documentId: { default: "" },
      currentPage: { default: 1 },
      totalPages: { default: 1 },
      zoomLevel: { default: 1 },
      viewMode: { default: "fit-width" },
      highlightedChunkId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "document-viewer-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["document-viewer-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentViewerCard);
  },

  addCommands() {
    return {
      setDocumentViewerBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "documentViewerBlock",
            attrs: {
              documentId: "",
              currentPage: 1,
              totalPages: 1,
              zoomLevel: 1,
              viewMode: "fit-width",
              highlightedChunkId: null,
              ...attrs,
            },
          });
        },
    };
  },
});

// =============================================================================
// Status Badge Component
// =============================================================================

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  UPLOADING: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Uploading",
  },
  PROCESSING: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    label: "Processing",
  },
  PARSED: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-400",
    label: "Parsed",
  },
  INDEXED: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    label: "Ready",
  },
  FAILED: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "Failed",
  },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PROCESSING;
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

// =============================================================================
// Zoom Levels
// =============================================================================

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

// =============================================================================
// Utility Functions
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

// =============================================================================
// React Component
// =============================================================================

function DocumentViewerCard({ node, updateAttributes }: { node: any; updateAttributes: (attrs: Partial<DocumentViewerBlockAttributes>) => void }) {
  const attrs = node.attrs as DocumentViewerBlockAttributes;
  const { documentId, currentPage, zoomLevel, highlightedChunkId } = attrs;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Fetch document data
  const { data: document, isLoading: isDocumentLoading } = api.vdr.getDocument.useQuery(
    { id: documentId },
    { enabled: !!documentId }
  );

  // Fetch download URL for viewing
  const { data: downloadUrlData } = api.vdr.getDownloadUrl.useQuery(
    { documentId },
    { enabled: !!documentId && !!document }
  );

  const downloadUrl = downloadUrlData?.url;

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      updateAttributes({ currentPage: currentPage - 1 });
    }
  }, [currentPage, updateAttributes]);

  // Get page count from reducto data or default to 1
  const pageCount = (document?.reductoData as { pageCount?: number } | null)?.pageCount || 1;

  const handleNextPage = useCallback(() => {
    if (currentPage < pageCount) {
      updateAttributes({ currentPage: currentPage + 1 });
    }
  }, [currentPage, pageCount, updateAttributes]);

  const handlePageInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const page = parseInt(e.target.value, 10);
      if (page >= 1 && page <= pageCount) {
        updateAttributes({ currentPage: page });
      }
    },
    [pageCount, updateAttributes]
  );

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      updateAttributes({ zoomLevel: ZOOM_LEVELS[currentIndex + 1] });
    }
  }, [zoomLevel, updateAttributes]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoomLevel);
    if (currentIndex > 0) {
      updateAttributes({ zoomLevel: ZOOM_LEVELS[currentIndex - 1] });
    }
  }, [zoomLevel, updateAttributes]);

  const handleZoomSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateAttributes({ zoomLevel: parseFloat(e.target.value) });
    },
    [updateAttributes]
  );

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Handle download
  const handleDownload = useCallback(() => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  }, [downloadUrl]);

  // Loading state
  if (isDocumentLoading || !document) {
    return (
      <NodeViewWrapper className="my-6 font-sans">
        <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-orange" />
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  const isPdfFile = isPdf(document.mimeType);
  const viewerUrl = downloadUrl
    ? `${downloadUrl}#page=${currentPage}`
    : "";

  // Non-PDF fallback (metadata card + download)
  if (!isPdfFile) {
    return (
      <NodeViewWrapper className="my-6 font-sans">
        <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange/10 rounded-lg">
                <File className="w-5 h-5 text-orange" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
                  {document.name}
                </h3>
                <p className="text-xs text-charcoal/60 dark:text-cultured-white/60">
                  {document.mimeType} &bull; {formatFileSize(document.fileSize)}
                </p>
              </div>
            </div>
            <StatusBadge status={document.status} />
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <FileText className="w-16 h-16 text-charcoal/20 dark:text-cultured-white/20 mb-4" />
            <p className="text-sm text-charcoal/60 dark:text-cultured-white/60 mb-4">
              Preview not available for this file type
            </p>
            <button
              onClick={handleDownload}
              disabled={!downloadUrl}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange hover:bg-orange/90 disabled:bg-orange/50 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download File
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // PDF Viewer
  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-white dark:bg-deep-grey"
    : "my-6 font-sans";

  return (
    <NodeViewWrapper className={containerClass}>
      <div
        className={`bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden ${
          isFullscreen ? "h-full flex flex-col" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange/10 rounded-lg">
              <FileText className="w-5 h-5 text-orange" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
                {document.name}
              </h3>
              <p className="text-xs text-charcoal/60 dark:text-cultured-white/60">
                PDF &bull; {formatFileSize(document.fileSize)}
              </p>
            </div>
          </div>
          <StatusBadge status={document.status} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-bone dark:border-charcoal/30 bg-bone/50 dark:bg-charcoal/20">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded hover:bg-charcoal/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-charcoal dark:text-cultured-white" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <input
                type="number"
                value={currentPage}
                onChange={handlePageInput}
                min={1}
                max={pageCount}
                className="w-12 px-2 py-1 text-center rounded border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/30 text-charcoal dark:text-cultured-white text-sm"
              />
              <span className="text-charcoal/60 dark:text-cultured-white/60">
                / {pageCount}
              </span>
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= pageCount}
              className="p-1.5 rounded hover:bg-charcoal/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4 text-charcoal dark:text-cultured-white" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= ZOOM_LEVELS[0]}
              className="p-1.5 rounded hover:bg-charcoal/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-charcoal dark:text-cultured-white" />
            </button>
            <select
              value={zoomLevel}
              onChange={handleZoomSelect}
              className="px-2 py-1 rounded border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/30 text-charcoal dark:text-cultured-white text-sm"
            >
              {ZOOM_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {formatZoom(level)}
                </option>
              ))}
            </select>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="p-1.5 rounded hover:bg-charcoal/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-charcoal dark:text-cultured-white" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!downloadUrl}
              className="p-1.5 rounded hover:bg-charcoal/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4 text-charcoal dark:text-cultured-white" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-charcoal/10 dark:hover:bg-white/10 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <Maximize2 className="w-4 h-4 text-charcoal dark:text-cultured-white" />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div
          className={`relative ${isFullscreen ? "flex-1" : "h-[600px]"} bg-charcoal/5 dark:bg-charcoal/30`}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
        >
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-alabaster dark:bg-panel-dark z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-orange animate-spin" />
                <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
                  Loading document...
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-sm text-charcoal/60 dark:text-cultured-white/60 mb-2">
                Unable to preview document
              </p>
              <button
                onClick={handleDownload}
                className="text-sm text-orange hover:underline"
              >
                Download instead
              </button>
            </div>
          )}

          {/* PDF iframe */}
          {viewerUrl && !hasError && (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              title={`Document: ${document.name}`}
            />
          )}

          {/* Highlighted chunk overlay */}
          {highlightedChunkId && !isLoading && (
            <div
              className="absolute pointer-events-none border-2 border-[#2F7E8A] bg-[#2F7E8A]/20 rounded"
              style={{
                // Placeholder for bounding box - would be populated from chunk data
                left: "10%",
                top: "10%",
                width: "80%",
                height: "10%",
              }}
            />
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export default DocumentViewerBlock;
