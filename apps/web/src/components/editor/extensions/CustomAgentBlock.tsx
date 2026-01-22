/**
 * CustomAgentBlock - Tiptap extension for user-defined AI agents
 *
 * Provides a block for running custom agents with file attachments.
 * Supports multimodal input via Vercel AI SDK.
 *
 * [TASK-128] Custom Agents Database + File Attachments
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
// File Dropzone Component
// =============================================================================

interface DropZoneProps {
  onFiles: (files: FileAttachment[]) => void;
  disabled?: boolean;
}

function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files, onFiles);
  }, [disabled, onFiles]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files, onFiles);
    if (inputRef.current) inputRef.current.value = "";
  }, [onFiles]);

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
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.json"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-orange" : "text-charcoal/30 dark:text-cultured-white/30"}`} />
      <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
        {isDragging ? "Drop files here" : "Drop files or click to attach"}
      </p>
      <p className="text-xs text-charcoal/40 dark:text-cultured-white/40 mt-1">
        PDF, Images, Text files (max 10)
      </p>
    </div>
  );
}

async function processFiles(files: File[], onFiles: (files: FileAttachment[]) => void) {
  const attachments: FileAttachment[] = [];

  for (const file of files.slice(0, 10)) {
    // For now, create a data URL for the file
    // In production, this would upload to S3 and return the URL
    const url = await fileToDataUrl(file);
    attachments.push({
      url,
      name: file.name,
      contentType: file.type,
      size: file.size,
    });
  }

  onFiles(attachments);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =============================================================================
// Attachment List Component
// =============================================================================

interface AttachmentListProps {
  attachments: FileAttachment[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function AttachmentList({ attachments, onRemove, disabled }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-charcoal/60 dark:text-cultured-white/60">
        Attached Files ({attachments.length})
      </p>
      <div className="space-y-1">
        {attachments.map((file, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-2 bg-alabaster dark:bg-surface-dark rounded-lg"
          >
            <FileText className="w-4 h-4 text-orange" />
            <span className="flex-1 text-sm text-charcoal dark:text-cultured-white truncate">
              {file.name}
            </span>
            {file.size && (
              <span className="text-xs text-charcoal/40 dark:text-cultured-white/40">
                {formatFileSize(file.size)}
              </span>
            )}
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

  const handleFileAttach = useCallback((files: FileAttachment[]) => {
    const currentAttachments = attrs.attachments as FileAttachment[];
    const newAttachments = [...currentAttachments, ...files].slice(0, 10);
    updateAttributes({ attachments: newAttachments });
  }, [attrs.attachments, updateAttributes]);

  const handleRemoveAttachment = useCallback((index: number) => {
    const currentAttachments = attrs.attachments as FileAttachment[];
    const newAttachments = currentAttachments.filter((_, i) => i !== index);
    updateAttributes({ attachments: newAttachments });
  }, [attrs.attachments, updateAttributes]);

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

    executeMutation.mutate({
      agentId,
      context: dealId ? { dealId } : undefined,
      userPrompt: promptInput || undefined,
      attachments: (attachments as FileAttachment[]).map(a => ({
        url: a.url,
        contentType: a.contentType,
        name: a.name,
      })),
      documentIds: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
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
  }, [updateAttributes]);

  const totalAttachments = (attachments as FileAttachment[]).length + selectedDocumentIds.length;
  const isRunnable = agentId && (totalAttachments > 0 || promptInput.trim());

  return (
    <NodeViewWrapper className="my-6 font-sans">
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
              <DropZone onFiles={handleFileAttach} disabled={totalAttachments >= 10} />

              {/* Vault Picker */}
              <VaultPicker
                dealId={dealId}
                selectedIds={selectedDocumentIds}
                onSelect={handleDocumentSelect}
                disabled={totalAttachments >= 10}
              />

              {/* Attachment List */}
              <AttachmentList
                attachments={attachments as FileAttachment[]}
                onRemove={handleRemoveAttachment}
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
                />
              </div>

              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={!isRunnable}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange hover:bg-orange/90 disabled:bg-orange/40 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Run Analysis
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
