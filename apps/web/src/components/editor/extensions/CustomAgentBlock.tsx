/**
 * CustomAgentBlock - Tiptap extension for user-defined AI agents
 *
 * Provides a block for running custom agents with file attachments.
 * Supports multimodal input via Vercel AI SDK.
 * Files are persisted to S3/vault for long-term storage.
 *
 * [TASK-128] Custom Agents Database + File Attachments
 * [TASK-131] Fix Agent Document Upload Persistence to Vault
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback, useRef } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  FileText,
  Upload,
  X,
  Play,
  FolderOpen,
  CheckCircle,
  Search,
} from "lucide-react";
import { api } from "@/trpc/react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";

// =============================================================================
// Types
// =============================================================================

export interface FileAttachment {
  url: string;
  name: string;
  contentType: string;
  size?: number;
  /** If set, indicates this attachment is persisted in the vault */
  documentId?: string;
}

/** Tracks upload progress for files being uploaded to vault */
export interface UploadingFile {
  id: string;
  file: File;
  status: "uploading" | "complete" | "error";
  progress: number;
  error?: string;
  documentId?: string;
}

export interface CustomAgentBlockAttributes {
  agentId: string | null;
  agentName: string | null;
  agentIcon: string | null;
  status: "idle" | "selecting" | "running" | "complete" | "error";
  attachments: FileAttachment[];
  selectedDocumentIds: string[];
  result: string | null;
  errorMessage: string | null;
  userPrompt: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customAgentBlock: {
      setCustomAgentBlock: (attrs?: Partial<CustomAgentBlockAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Node Extension
// =============================================================================

export const CustomAgentBlock = Node.create({
  name: "customAgentBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      agentId: { default: null },
      agentName: { default: null },
      agentIcon: { default: null },
      status: { default: "idle" },
      attachments: { default: [] },
      selectedDocumentIds: { default: [] },
      result: { default: null },
      errorMessage: { default: null },
      userPrompt: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="custom-agent-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "custom-agent-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomAgentCard);
  },

  addCommands() {
    return {
      setCustomAgentBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "customAgentBlock",
            attrs: {
              agentId: null,
              agentName: null,
              agentIcon: null,
              status: "idle",
              attachments: [],
              selectedDocumentIds: [],
              result: null,
              errorMessage: null,
              userPrompt: null,
              ...attrs,
            },
          });
        },
    };
  },
});

// =============================================================================
// Deal Picker Modal Component
// =============================================================================

interface DealPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (dealId: string) => void;
}

function DealPickerModal({ open, onClose, onSelect }: DealPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: deals, isLoading } = api.deal.list.useQuery(
    { page: 1, pageSize: 20 },
    { enabled: open }
  );

  const filteredDeals = deals?.items.filter((deal: { name: string }) =>
    deal.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-deep-grey rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30">
          <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
            Select Deal for Vault
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-charcoal/50 hover:text-charcoal dark:text-cultured-white/50 dark:hover:text-cultured-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-bone dark:border-charcoal/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 dark:text-cultured-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange"
            />
          </div>
        </div>

        {/* Deal List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-orange" />
            </div>
          ) : filteredDeals.length === 0 ? (
            <p className="text-sm text-charcoal/50 dark:text-cultured-white/50 text-center py-8">
              {searchQuery ? "No deals match your search" : "No deals found"}
            </p>
          ) : (
            <div className="space-y-1">
              {filteredDeals.map((deal: { id: string; name: string; stage: string }) => (
                <button
                  key={deal.id}
                  onClick={() => {
                    onSelect(deal.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-alabaster dark:hover:bg-surface-dark rounded-lg transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-orange shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal dark:text-cultured-white truncate">
                      {deal.name}
                    </p>
                    <p className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                      {deal.stage.replace(/_/g, " ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <p className="text-xs text-charcoal/50 dark:text-cultured-white/50">
            Files will be saved to the selected deal&apos;s vault
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// File Dropzone Component
// =============================================================================

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  isUploading?: boolean;
}

function DropZone({ onFilesSelected, disabled, isUploading }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files.slice(0, 10));
  }, [disabled, isUploading, onFilesSelected]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onFilesSelected(files.slice(0, 10));
    if (inputRef.current) inputRef.current.value = "";
  }, [onFilesSelected]);

  const isDisabled = disabled || isUploading;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
        ${isDragging
          ? "border-orange bg-orange/5"
          : "border-bone dark:border-charcoal/30 hover:border-orange/50 hover:bg-orange/5"
        }
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onClick={() => !isDisabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.json"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isDisabled}
      />
      {isUploading ? (
        <>
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-orange" />
          <p className="text-sm text-orange">Uploading to vault...</p>
        </>
      ) : (
        <>
          <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-orange" : "text-charcoal/30 dark:text-cultured-white/30"}`} />
          <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
            {isDragging ? "Drop files here" : "Drop files or click to attach"}
          </p>
          <p className="text-xs text-charcoal/40 dark:text-cultured-white/40 mt-1">
            PDF, Images, Text files (max 10) • Saved to vault
          </p>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Attachment List Component
// =============================================================================

interface AttachmentListProps {
  attachments: FileAttachment[];
  uploadingFiles: UploadingFile[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function AttachmentList({ attachments, uploadingFiles, onRemove, disabled }: AttachmentListProps) {
  const hasItems = attachments.length > 0 || uploadingFiles.length > 0;
  if (!hasItems) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-charcoal/60 dark:text-cultured-white/60">
        Attached Files ({attachments.length + uploadingFiles.length})
      </p>
      <div className="space-y-1">
        {/* Show uploading files first */}
        {uploadingFiles.map((uploadFile) => (
          <div
            key={uploadFile.id}
            className="flex items-center gap-2 px-3 py-2 bg-alabaster dark:bg-surface-dark rounded-lg"
          >
            {uploadFile.status === "uploading" ? (
              <Loader2 className="w-4 h-4 text-orange animate-spin" />
            ) : uploadFile.status === "complete" ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="flex-1 text-sm text-charcoal dark:text-cultured-white truncate">
              {uploadFile.file.name}
            </span>
            <span className="text-xs text-charcoal/40 dark:text-cultured-white/40">
              {uploadFile.status === "uploading"
                ? "Uploading..."
                : uploadFile.status === "complete"
                ? "Saved to Vault"
                : uploadFile.error || "Failed"}
            </span>
          </div>
        ))}
        {/* Show already attached files */}
        {attachments.map((file, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-2 bg-alabaster dark:bg-surface-dark rounded-lg"
          >
            {file.documentId ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <FileText className="w-4 h-4 text-orange" />
            )}
            <span className="flex-1 text-sm text-charcoal dark:text-cultured-white truncate">
              {file.name}
            </span>
            {file.documentId ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                Saved to Vault
              </span>
            ) : file.size ? (
              <span className="text-xs text-charcoal/40 dark:text-cultured-white/40">
                {formatFileSize(file.size)}
              </span>
            ) : null}
            {!disabled && (
              <button
                onClick={() => onRemove(index)}
                className="p-1 hover:bg-charcoal/10 dark:hover:bg-cultured-white/10 rounded transition-colors"
              >
                <X className="w-3 h-3 text-charcoal/60 dark:text-cultured-white/60" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// Vault Document Picker Component
// =============================================================================

interface VaultPickerProps {
  dealId: string | null;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  disabled?: boolean;
}

function VaultPicker({ dealId, selectedIds, onSelect, disabled }: VaultPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: documents } = api.vdr.listDocuments.useQuery(
    { dealId: dealId || undefined, pageSize: 50 },
    { enabled: isOpen && !!dealId }
  );

  const toggleDocument = useCallback((docId: string) => {
    if (selectedIds.includes(docId)) {
      onSelect(selectedIds.filter(id => id !== docId));
    } else if (selectedIds.length < 10) {
      onSelect([...selectedIds, docId]);
    }
  }, [selectedIds, onSelect]);

  if (!dealId) return null;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-sm text-charcoal/70 dark:text-cultured-white/70 hover:text-charcoal dark:hover:text-cultured-white border border-bone dark:border-charcoal/30 rounded-lg hover:bg-alabaster dark:hover:bg-surface-dark transition-colors disabled:opacity-50"
      >
        <FolderOpen className="w-4 h-4" />
        Select from Vault
        {selectedIds.length > 0 && (
          <span className="px-1.5 py-0.5 bg-orange/10 text-orange text-xs rounded-full">
            {selectedIds.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 p-3 bg-alabaster dark:bg-surface-dark rounded-lg border border-bone dark:border-charcoal/30 max-h-48 overflow-y-auto">
          {!documents?.items.length ? (
            <p className="text-sm text-charcoal/50 dark:text-cultured-white/50 text-center py-4">
              No documents in this deal&apos;s vault
            </p>
          ) : (
            <div className="space-y-1">
              {documents.items.map((doc: { id: string; name: string }) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-white dark:hover:bg-charcoal/30 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(doc.id)}
                    onChange={() => toggleDocument(doc.id)}
                    disabled={disabled || (!selectedIds.includes(doc.id) && selectedIds.length >= 10)}
                    className="rounded border-bone dark:border-charcoal/30"
                  />
                  <FileText className="w-4 h-4 text-charcoal/40 dark:text-cultured-white/40" />
                  <span className="text-sm text-charcoal dark:text-cultured-white truncate">
                    {doc.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Card Component
// =============================================================================

function CustomAgentCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as CustomAgentBlockAttributes;
  const {
    agentId,
    agentName,
    agentIcon,
    status,
    attachments,
    selectedDocumentIds,
    result,
    errorMessage,
    userPrompt,
  } = attrs;

  const params = useParams();
  const dealId = (params?.id as string) || null;
  const [promptInput, setPromptInput] = useState(userPrompt || "");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showDealPicker, setShowDealPicker] = useState(false);

  // Track document IDs currently being uploaded to prevent duplicates
  const uploadingDocIdsRef = useRef<Set<string>>(new Set());

  // tRPC utilities for cache invalidation
  const utils = api.useUtils();

  // Vault upload mutations
  const getUploadUrl = api.vdr.getUploadUrl.useMutation();
  const createDocument = api.vdr.createDocument.useMutation({
    onSuccess: () => {
      // Refresh VaultPicker document list
      utils.vdr.listDocuments.invalidate();
    },
  });

  // Execute agent mutation
  const executeMutation = api.agent.execute.useMutation({
    onSuccess: async (data) => {
      // The execution returns the AI-generated content directly
      updateAttributes({
        status: "complete",
        result: data.content,
        errorMessage: null,
      });
    },
    onError: (error) => {
      updateAttributes({
        status: "error",
        errorMessage: error.message,
      });
    },
  });

  // Upload a single file to vault and return document ID
  const uploadFileToVault = useCallback(async (file: File, targetDealId: string): Promise<{ documentId: string; url: string }> => {
    // 1. Get presigned URL
    const { url, key } = await getUploadUrl.mutateAsync({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      dealId: targetDealId,
    });

    // 2. Upload to S3
    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to storage");
    }

    // 3. Create document record
    const doc = await createDocument.mutateAsync({
      name: file.name,
      fileUrl: key,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      dealId: targetDealId,
    });

    return { documentId: doc.id, url: key };
  }, [getUploadUrl, createDocument]);

  // Upload files to vault
  const uploadFilesToVault = useCallback(async (files: File[], targetDealId: string) => {
    for (const file of files) {
      const tempId = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Check if this file is already being uploaded (by tempId pattern)
      if (uploadingDocIdsRef.current.has(tempId)) {
        console.log('[CustomAgentBlock] Skipping duplicate upload:', file.name);
        continue;
      }

      try {
        // Mark as uploading
        uploadingDocIdsRef.current.add(tempId);

        // Add to uploading state
        setUploadingFiles(prev => [...prev, {
          id: tempId,
          file,
          status: "uploading",
          progress: 0,
        }]);

        // Upload to vault
        const { documentId, url } = await uploadFileToVault(file, targetDealId);

        // Check if documentId already exists in attachments (prevents duplicates from race conditions)
        // Read latest attrs from node to avoid stale closure
        const currentAttachments = node.attrs.attachments as FileAttachment[];
        const currentDocIds = node.attrs.selectedDocumentIds as string[];

        if (currentAttachments.some(a => a.documentId === documentId)) {
          console.log('[CustomAgentBlock] Skipping duplicate attachment:', documentId);
          // Still mark upload as complete for UI feedback
          setUploadingFiles(prev => prev.map(f =>
            f.id === tempId ? { ...f, status: "complete", documentId } : f
          ));
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
            uploadingDocIdsRef.current.delete(tempId);
          }, 1500);
          continue;
        }

        // Update uploading state to complete
        setUploadingFiles(prev => prev.map(f =>
          f.id === tempId ? { ...f, status: "complete", documentId } : f
        ));

        // Add to attachments with documentId for display
        // NOTE: We don't add to selectedDocumentIds - that's only for VaultPicker selections
        // The attachment already has the documentId for display purposes
        const newAttachment: FileAttachment = {
          url,
          name: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          documentId,
        };

        // Update attributes: add attachment only (not selectedDocumentIds)
        const updatedAttachments = [...currentAttachments, newAttachment].slice(0, 10);

        updateAttributes({
          attachments: updatedAttachments,
        });

        // Remove from uploading state after a delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
          uploadingDocIdsRef.current.delete(tempId);
        }, 1500);

      } catch (error) {
        // Update uploading state to error
        setUploadingFiles(prev => prev.map(f =>
          f.id === tempId ? { ...f, status: "error", error: (error as Error).message } : f
        ));

        // Remove error state after delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== tempId));
          uploadingDocIdsRef.current.delete(tempId);
        }, 3000);
      }
    }
  }, [node.attrs, uploadFileToVault, updateAttributes]);

  // Handle files selected from dropzone
  const handleFilesSelected = useCallback((files: File[]) => {
    if (!dealId) {
      // No deal context - show deal picker modal
      setPendingFiles(files);
      setShowDealPicker(true);
      return;
    }

    // Upload files to current deal's vault
    uploadFilesToVault(files, dealId);
  }, [dealId, uploadFilesToVault]);

  // Handle deal selection from modal
  const handleDealSelect = useCallback((selectedDealId: string) => {
    if (pendingFiles.length > 0) {
      uploadFilesToVault(pendingFiles, selectedDealId);
      setPendingFiles([]);
    }
  }, [pendingFiles, uploadFilesToVault]);

  const handleRemoveAttachment = useCallback((index: number) => {
    const currentAttachments = attrs.attachments as FileAttachment[];
    const removedAttachment = currentAttachments[index];
    const newAttachments = currentAttachments.filter((_, i) => i !== index);

    // Also remove from selectedDocumentIds if it has a documentId
    let newDocIds = attrs.selectedDocumentIds as string[];
    if (removedAttachment?.documentId) {
      newDocIds = newDocIds.filter(id => id !== removedAttachment.documentId);
    }

    updateAttributes({
      attachments: newAttachments,
      selectedDocumentIds: newDocIds,
    });
  }, [attrs.attachments, attrs.selectedDocumentIds, updateAttributes]);

  const handleDocumentSelect = useCallback((ids: string[]) => {
    updateAttributes({ selectedDocumentIds: ids });
  }, [updateAttributes]);

  const handleRun = useCallback(() => {
    if (!agentId) return;

    updateAttributes({
      status: "running",
      result: null,
      errorMessage: null,
      userPrompt: promptInput || null,
    });

    // Filter out documentIds that are already in attachments to avoid double-processing
    const attachmentDocIds = new Set(
      (attachments as FileAttachment[]).filter(a => a.documentId).map(a => a.documentId)
    );
    const filteredDocumentIds = selectedDocumentIds.filter(id => !attachmentDocIds.has(id));

    executeMutation.mutate({
      agentId,
      context: dealId ? { dealId } : undefined,
      userPrompt: promptInput || undefined,
      attachments: (attachments as FileAttachment[]).map(a => ({
        url: a.url,
        contentType: a.contentType,
        name: a.name,
      })),
      documentIds: filteredDocumentIds.length > 0 ? filteredDocumentIds : undefined,
    });
  }, [agentId, dealId, promptInput, attachments, selectedDocumentIds, executeMutation, updateAttributes]);

  const handleRetry = useCallback(() => {
    handleRun();
  }, [handleRun]);

  const handleClear = useCallback(() => {
    updateAttributes({
      status: "idle",
      result: null,
      errorMessage: null,
      attachments: [],
      selectedDocumentIds: [],
      userPrompt: null,
    });
    setPromptInput("");
    setUploadingFiles([]);
  }, [updateAttributes]);

  // Calculate total unique documents (avoid double-counting if same doc is in both arrays)
  const attachmentDocIds = new Set((attachments as FileAttachment[]).filter(a => a.documentId).map(a => a.documentId));
  const uniqueVaultSelections = selectedDocumentIds.filter(id => !attachmentDocIds.has(id));
  const totalAttachments = (attachments as FileAttachment[]).length + uniqueVaultSelections.length;
  const isUploading = uploadingFiles.some(f => f.status === "uploading");
  const isRunnable = agentId && (totalAttachments > 0 || promptInput.trim()) && !isUploading;

  return (
    <NodeViewWrapper className="my-6 font-sans">
      {/* Deal Picker Modal - shown when uploading without deal context */}
      <DealPickerModal
        open={showDealPicker}
        onClose={() => {
          setShowDealPicker(false);
          setPendingFiles([]);
        }}
        onSelect={handleDealSelect}
      />

      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange/10 rounded">
              <span className="text-lg">{agentIcon || "🤖"}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
                {agentName || "Custom Agent"}
              </h3>
              {totalAttachments > 0 && status !== "complete" && (
                <p className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                  {totalAttachments} document{totalAttachments !== 1 ? "s" : ""} attached
                  {isUploading && " • Uploading..."}
                </p>
              )}
            </div>
          </div>
          {status === "complete" && (
            <button
              onClick={handleClear}
              className="text-xs text-charcoal/50 dark:text-cultured-white/50 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-4">
          {/* Idle State - Show attachment options */}
          {(status === "idle" || status === "selecting") && (
            <>
              {/* File Dropzone */}
              <DropZone
                onFilesSelected={handleFilesSelected}
                disabled={totalAttachments >= 10}
                isUploading={isUploading}
              />

              {/* Vault Picker */}
              <VaultPicker
                dealId={dealId}
                selectedIds={selectedDocumentIds}
                onSelect={handleDocumentSelect}
                disabled={totalAttachments >= 10 || isUploading}
              />

              {/* Attachment List */}
              <AttachmentList
                attachments={attachments as FileAttachment[]}
                uploadingFiles={uploadingFiles}
                onRemove={handleRemoveAttachment}
                disabled={isUploading}
              />

              {/* Optional Prompt */}
              <div>
                <label className="block text-xs font-medium text-charcoal/60 dark:text-cultured-white/60 mb-1">
                  Additional instructions (optional)
                </label>
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Any specific focus areas or questions?"
                  className="w-full px-3 py-2 rounded-lg border border-bone dark:border-charcoal/30 bg-white dark:bg-charcoal/20 text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none focus:ring-2 focus:ring-orange/30 focus:border-orange text-sm"
                  disabled={isUploading}
                />
              </div>

              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={!isRunnable}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange hover:bg-orange/90 disabled:bg-orange/40 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Analysis
                  </>
                )}
              </button>
            </>
          )}

          {/* Running State */}
          {status === "running" && (
            <div className="flex items-center gap-3 p-4 bg-orange/5 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-orange" />
              <div>
                <p className="text-sm font-medium text-orange">
                  Analyzing documents...
                </p>
                <p className="text-xs text-orange/70">
                  Processing {totalAttachments} document{totalAttachments !== 1 ? "s" : ""} with {agentName}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Analysis failed
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
                  {errorMessage || "An unexpected error occurred"}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Result State */}
          {status === "complete" && result && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="p-4 bg-alabaster dark:bg-surface-dark rounded-lg">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export default CustomAgentBlock;
