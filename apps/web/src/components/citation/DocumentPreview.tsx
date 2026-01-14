"use client";

/**
 * DocumentPreview - PDF/Document Viewer with Highlighting
 *
 * Displays the source document with the cited excerpt highlighted.
 * Uses an iframe for PDF viewing - can be enhanced with react-pdf
 * for bounding box highlighting in the future.
 *
 * Part of Phase 1: Citation Core
 */
import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

interface DocumentPreviewProps {
  documentUrl: string;
  pageNumber?: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export function DocumentPreview({
  documentUrl,
  pageNumber = 1,
  boundingBox,
}: DocumentPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Determine file type from URL
  const isPdf = documentUrl.toLowerCase().includes(".pdf");

  // For PDFs, append page parameter if the viewer supports it
  const viewerUrl = isPdf
    ? `${documentUrl}#page=${pageNumber}`
    : documentUrl;

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="w-12 h-12 text-deep-grey/30 dark:text-white/30 mb-4" />
        <p className="text-sm text-deep-grey/60 dark:text-white/60 mb-2">
          Unable to preview document
        </p>
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange hover:underline"
        >
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-white dark:bg-deep-grey">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-alabaster dark:bg-panel-dark z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-orange animate-spin" />
            <p className="text-sm text-deep-grey/60 dark:text-white/60">
              Loading document...
            </p>
          </div>
        </div>
      )}

      {/* Document iframe */}
      <iframe
        src={viewerUrl}
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        title="Document Preview"
      />

      {/* Bounding box overlay - positioned absolutely over the iframe */}
      {boundingBox && !isLoading && (
        <div
          className="absolute pointer-events-none border-2 border-[#2F7E8A] bg-[#2F7E8A]/20 rounded"
          style={{
            left: `${boundingBox.x}%`,
            top: `${boundingBox.y}%`,
            width: `${boundingBox.width}%`,
            height: `${boundingBox.height}%`,
          }}
        />
      )}
    </div>
  );
}
