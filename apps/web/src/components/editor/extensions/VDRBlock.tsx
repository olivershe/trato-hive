/**
 * VDRBlock - Virtual Data Room file explorer
 *
 * Provides a file tree explorer with folder navigation and document management.
 * Uses tRPC for document listing and presigned URL generation.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback, useMemo } from "react";
import {
  FolderOpen,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  ChevronRight,
  ChevronDown,
  Upload,
  Download,
  FolderPlus,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  FolderInput,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface VDRBlockAttributes {
  dealId: string | null;
  companyId: string | null;
  expandedFolders: string[];
  viewMode: "tree" | "list";
  selectedFolderPath: string | null;
}

interface FolderNode {
  name: string;
  path: string;
  documentCount: number;
  children: FolderNode[];
}

interface DocumentListItem {
  id: string;
  name: string;
  type: string;
  status: string;
  fileSize: number;
  mimeType: string;
  folderPath: string | null;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    vdrBlock: {
      setVDRBlock: (attrs?: Partial<VDRBlockAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Node Extension
// =============================================================================

export const VDRBlock = Node.create({
  name: "vdrBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      dealId: { default: null },
      companyId: { default: null },
      expandedFolders: { default: [] },
      viewMode: { default: "tree" },
      selectedFolderPath: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "vdr-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["vdr-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VDRCard);
  },

  addCommands() {
    return {
      setVDRBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "vdrBlock",
            attrs: {
              dealId: null,
              companyId: null,
              expandedFolders: [],
              viewMode: "tree",
              selectedFolderPath: null,
              ...attrs,
            },
          });
        },
    };
  },
});

// =============================================================================
// Helper Functions
// =============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) {
    return <FileText className="w-4 h-4 text-red-500" />;
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return <FileText className="w-4 h-4 text-blue-500" />;
  }
  if (mimeType.includes("sheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  }
  if (mimeType.includes("image")) {
    return <FileImage className="w-4 h-4 text-purple-500" />;
  }
  return <File className="w-4 h-4 text-charcoal/50" />;
}

// =============================================================================
// Sub-Components
// =============================================================================

interface FolderTreeItemProps {
  folder: FolderNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}

function FolderTreeItem({
  folder,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
}: FolderTreeItemProps) {
  const hasChildren = folder.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(folder.path);
          if (hasChildren) onToggle(folder.path);
        }}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-bone dark:hover:bg-charcoal/30 transition-colors ${
          isSelected ? "bg-gold/10 text-gold" : "text-charcoal dark:text-cultured-white"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <FolderOpen className="w-4 h-4 shrink-0 text-gold" />
        <span className="truncate flex-1 text-left">{folder.name}</span>
        {folder.documentCount > 0 && (
          <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
            {folder.documentCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {folder.children.map((child) => (
              <FolderTreeItem
                key={child.path}
                folder={child}
                depth={depth + 1}
                isExpanded={false}
                isSelected={false}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FileRowProps {
  document: DocumentListItem;
  onDownload: (documentId: string) => void;
  onDelete: (documentId: string) => void;
}

function FileRow({ document, onDownload, onDelete }: FileRowProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 hover:bg-alabaster dark:hover:bg-charcoal/20 border-b border-bone dark:border-charcoal/20 last:border-b-0"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {getFileIcon(document.mimeType)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal dark:text-cultured-white truncate">
          {document.name}
        </p>
        <p className="text-xs text-charcoal/50 dark:text-cultured-white/50">
          {formatFileSize(document.fileSize)} &middot; {formatDate(document.createdAt)}
        </p>
      </div>
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={() => onDownload(document.id)}
              className="p-1.5 text-charcoal/50 hover:text-gold dark:text-cultured-white/50 dark:hover:text-gold transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(document.id)}
              className="p-1.5 text-charcoal/50 hover:text-red-500 dark:text-cultured-white/50 dark:hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function VDRCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as VDRBlockAttributes;
  const { dealId, companyId, expandedFolders, selectedFolderPath } = attrs;

  const [isUploading, setIsUploading] = useState(false);

  // API queries
  const { data: folderTree, isLoading: foldersLoading } = api.vdr.getFolderTree.useQuery(
    { dealId: dealId || undefined, companyId: companyId || undefined },
    { enabled: !!dealId || !!companyId }
  );

  const { data: documentsData, isLoading: docsLoading, refetch: refetchDocs } = api.vdr.listDocuments.useQuery(
    {
      dealId: dealId || undefined,
      companyId: companyId || undefined,
      folderPath: selectedFolderPath || undefined,
      pageSize: 50,
    },
    { enabled: !!dealId || !!companyId }
  );

  // Mutations
  const utils = api.useUtils();
  const getDownloadUrlMutation = api.vdr.getDownloadUrl.useMutation();
  const deleteDocumentMutation = api.vdr.deleteDocument.useMutation({
    onSuccess: () => {
      utils.vdr.listDocuments.invalidate();
      utils.vdr.getFolderTree.invalidate();
    },
  });
  const getUploadUrlMutation = api.vdr.getUploadUrl.useMutation();
  const createDocumentMutation = api.vdr.createDocument.useMutation({
    onSuccess: () => {
      utils.vdr.listDocuments.invalidate();
      utils.vdr.getFolderTree.invalidate();
    },
  });

  // Handlers
  const handleToggleFolder = useCallback(
    (path: string) => {
      const newExpanded = expandedFolders.includes(path)
        ? expandedFolders.filter((p) => p !== path)
        : [...expandedFolders, path];
      updateAttributes({ expandedFolders: newExpanded });
    },
    [expandedFolders, updateAttributes]
  );

  const handleSelectFolder = useCallback(
    (path: string) => {
      updateAttributes({ selectedFolderPath: path });
    },
    [updateAttributes]
  );

  const handleDownload = useCallback(
    async (documentId: string) => {
      try {
        const { url } = await getDownloadUrlMutation.mutateAsync({ documentId });
        window.open(url, "_blank");
      } catch (error) {
        console.error("Failed to get download URL:", error);
      }
    },
    [getDownloadUrlMutation]
  );

  const handleDelete = useCallback(
    async (documentId: string) => {
      if (!confirm("Are you sure you want to delete this document?")) return;
      try {
        await deleteDocumentMutation.mutateAsync({ documentId, deleteFromStorage: true });
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    },
    [deleteDocumentMutation]
  );

  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (!files.length) return;

      setIsUploading(true);
      try {
        for (const file of Array.from(files)) {
          // 1. Get presigned upload URL
          const { url, key } = await getUploadUrlMutation.mutateAsync({
            filename: file.name,
            folderPath: selectedFolderPath || undefined,
            dealId: dealId || undefined,
            companyId: companyId || undefined,
            mimeType: file.type,
            fileSize: file.size,
          });

          // 2. Upload to S3
          await fetch(url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          // 3. Create document record
          await createDocumentMutation.mutateAsync({
            name: file.name,
            folderPath: selectedFolderPath || undefined,
            dealId: dealId || undefined,
            companyId: companyId || undefined,
            fileUrl: key,
            fileSize: file.size,
            mimeType: file.type,
          });
        }
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [
      selectedFolderPath,
      dealId,
      companyId,
      getUploadUrlMutation,
      createDocumentMutation,
    ]
  );

  // Empty state - no deal/company selected
  if (!dealId && !companyId) {
    return (
      <NodeViewWrapper className="my-6 font-sans">
        <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg p-8 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-charcoal/30 dark:text-cultured-white/30 mb-4" />
          <h3 className="text-lg font-semibold text-charcoal dark:text-cultured-white mb-2">
            Virtual Data Room
          </h3>
          <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
            This block needs to be linked to a deal or company to display documents.
          </p>
        </div>
      </NodeViewWrapper>
    );
  }

  const isLoading = foldersLoading || docsLoading;
  const documents = documentsData?.items || [];

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gold/10 rounded">
              <FolderOpen className="w-4 h-4 text-gold" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
              Data Room
            </h3>
            {selectedFolderPath && (
              <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                {selectedFolderPath}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gold bg-gold/10 hover:bg-gold/20 rounded cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {isUploading ? "Uploading..." : "Upload"}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <div className="flex min-h-[300px]">
            {/* Folder Tree */}
            <div className="w-56 border-r border-bone dark:border-charcoal/30 overflow-y-auto">
              <div className="p-2">
                {/* Root folder */}
                <button
                  onClick={() => handleSelectFolder("")}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-bone dark:hover:bg-charcoal/30 transition-colors ${
                    !selectedFolderPath
                      ? "bg-gold/10 text-gold"
                      : "text-charcoal dark:text-cultured-white"
                  }`}
                >
                  <FolderOpen className="w-4 h-4 shrink-0 text-gold" />
                  <span className="truncate flex-1 text-left">All Documents</span>
                </button>

                {/* Folder tree */}
                {folderTree?.map((folder) => (
                  <FolderTreeItem
                    key={folder.path}
                    folder={folder}
                    depth={0}
                    isExpanded={expandedFolders.includes(folder.path)}
                    isSelected={selectedFolderPath === folder.path}
                    onToggle={handleToggleFolder}
                    onSelect={handleSelectFolder}
                  />
                ))}
              </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <File className="w-10 h-10 text-charcoal/20 dark:text-cultured-white/20 mb-3" />
                  <p className="text-sm text-charcoal/50 dark:text-cultured-white/50">
                    No documents in this folder
                  </p>
                  <p className="text-xs text-charcoal/40 dark:text-cultured-white/40 mt-1">
                    Upload files to get started
                  </p>
                </div>
              ) : (
                <div>
                  {documents.map((doc) => (
                    <FileRow
                      key={doc.id}
                      document={doc}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <p className="text-xs text-charcoal/50 dark:text-cultured-white/50">
            {documentsData?.pagination.total || 0} document
            {(documentsData?.pagination.total || 0) !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export default VDRBlock;
