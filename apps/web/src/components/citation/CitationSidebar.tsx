"use client";

/**
 * CitationSidebar - Source Document Reveal Panel
 *
 * A right-sliding panel that shows the source document with the
 * cited excerpt highlighted. Opens when a citation [1] is clicked.
 *
 * Part of Phase 1: Citation Core
 */
import { X, FileText, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCitation } from "./CitationContext";
import { DocumentPreview } from "./DocumentPreview";
import { api } from "@/trpc/react";

export function CitationSidebar() {
  const { isOpen, citation, closeCitation } = useCitation();

  const { data: document, isLoading: isLoadingDocument } =
    api.vdr.getDocument.useQuery(
      { id: citation?.documentId ?? "" },
      { enabled: !!citation?.documentId }
    );

  const { data: downloadUrl } = api.vdr.getDownloadUrl.useQuery(
    { documentId: citation?.documentId ?? "" },
    { enabled: !!citation?.documentId }
  );

  return (
    <AnimatePresence>
      {isOpen && citation && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={closeCitation}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[500px] bg-alabaster dark:bg-panel-dark
                       shadow-2xl z-50 flex flex-col overscroll-contain"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-bone dark:border-deep-grey">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2F7E8A]/10 flex items-center justify-center">
                  <span className="text-[#2F7E8A] font-bold text-sm">
                    {citation.citationIndex}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-deep-grey dark:text-white">
                    Source Document
                  </h3>
                  <p className="text-sm text-deep-grey/60 dark:text-white/60">
                    {isLoadingDocument
                      ? "Loading..."
                      : document?.name ?? "Unknown Document"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCitation}
                className="p-2 hover:bg-bone dark:hover:bg-deep-grey rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-deep-grey dark:text-white" />
              </button>
            </div>

            {/* Source Excerpt */}
            <div className="p-4 bg-[#2F7E8A]/5 border-b border-[#2F7E8A]/20">
              <p className="text-sm text-deep-grey/80 dark:text-white/80 mb-2">
                Referenced excerpt:
              </p>
              <blockquote className="text-deep-grey dark:text-white italic border-l-2 border-[#2F7E8A] pl-3">
                &quot;{citation.sourceText}&quot;
              </blockquote>
              {citation.pageNumber && (
                <p className="text-xs text-deep-grey/60 dark:text-white/60 mt-2">
                  Page {citation.pageNumber}
                </p>
              )}
            </div>

            {/* Document Preview */}
            <div className="flex-1 overflow-hidden">
              {downloadUrl?.url && (
                <DocumentPreview
                  documentUrl={downloadUrl.url}
                  pageNumber={citation.pageNumber}
                  boundingBox={citation.boundingBox}
                />
              )}
              {!downloadUrl?.url && (
                <div className="flex flex-col items-center justify-center h-full text-deep-grey/40 dark:text-white/40">
                  <FileText className="w-12 h-12 mb-4" />
                  <p className="text-sm">Loading document preview...</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-bone dark:border-deep-grey">
              <button
                onClick={() => {
                  if (downloadUrl?.url) {
                    window.open(downloadUrl.url, "_blank");
                  }
                }}
                disabled={!downloadUrl?.url}
                className="w-full flex items-center justify-center gap-2 py-2 px-4
                           bg-orange text-white rounded-lg hover:bg-orange/90
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in VDR
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
