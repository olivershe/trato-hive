"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import {
  ArrowLeft,
  Folder,
  FileText,
  Upload,
  Loader2,
  MessageSquare,
  File,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";

// Folder node type
interface FolderNodeType {
  name: string;
  path: string;
  children?: FolderNodeType[];
}

// Folder tree node component
function FolderTreeNode({
  node,
  level = 0,
  selectedPath,
  onSelect,
}: {
  node: FolderNodeType;
  level?: number;
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const isSelected = selectedPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(node.path);
          if (hasChildren) setExpanded(!expanded);
        }}
        className={`
          w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors
          ${isSelected ? "bg-orange/10 text-orange" : "text-charcoal/70 hover:bg-charcoal/5"}
        `}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )
        ) : (
          <span className="w-4" />
        )}
        <Folder className="w-4 h-4" />
        <span className="truncate">{node.name}</span>
      </button>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FolderTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Document list item component
function DocumentItem({
  document,
}: {
  document: {
    id: string;
    name: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
  };
}) {
  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} bytes`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-bone rounded-lg hover:bg-bone/80 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
        <File className="w-5 h-5 text-orange" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-charcoal text-sm truncate">{document.name}</p>
        <p className="text-xs text-charcoal/50">
          {formatFileSize(document.fileSize)} · {new Date(document.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default function DiligencePage() {
  const params = useParams();
  const dealId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFolder, setSelectedFolder] = useState("/");
  const [isUploading, setIsUploading] = useState(false);
  const [question, setQuestion] = useState("");

  // Fetch deal info
  const { data: dealData } = api.deal.get.useQuery({ id: dealId });

  // Fetch folder tree
  const { data: folderTree } = api.vdr.getFolderTree.useQuery({ dealId });

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocs } =
    api.vdr.listDocuments.useQuery({
      dealId,
      folderPath: selectedFolder === "/" ? undefined : selectedFolder,
      page: 1,
      pageSize: 50,
    });

  // Upload mutation
  const uploadUrlMutation = api.vdr.getUploadUrl.useMutation();
  const createDocMutation = api.vdr.createDocument.useMutation({
    onSuccess: () => {
      refetchDocs();
    },
  });

  // Diligence Q&A mutation
  const askMutation = api.diligence.askQuestion.useMutation();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get presigned upload URL
      const { url, key } = await uploadUrlMutation.mutateAsync({
        filename: file.name,
        folderPath: selectedFolder === "/" ? undefined : selectedFolder,
        dealId,
        mimeType: file.type,
        fileSize: file.size,
      });

      // 2. Upload file to S3
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // 3. Create document record
      await createDocMutation.mutateAsync({
        name: file.name,
        folderPath: selectedFolder === "/" ? undefined : selectedFolder,
        dealId,
        fileUrl: key,
        fileSize: file.size,
        mimeType: file.type,
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [dealId, selectedFolder, uploadUrlMutation, createDocMutation]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    await askMutation.mutateAsync({
      dealId,
      question: question.trim(),
    });
    setQuestion("");
  };

  // Build folder tree with root
  const rootFolder: FolderNodeType = {
    name: "All Documents",
    path: "/",
    children: (folderTree as FolderNodeType[] | undefined) || [],
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/deals/${dealId}`}
          className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deal
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Data Room</h1>
            <p className="text-charcoal/60 mt-1">
              {dealData?.name || "Loading..."} - Documents & AI Q&A
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Folder Tree & Documents */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Documents</h2>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`
                  flex items-center gap-2 px-4 py-2
                  bg-orange text-white rounded-lg cursor-pointer
                  hover:bg-orange/90 transition-colors
                  ${isUploading ? "opacity-50 pointer-events-none" : ""}
                `}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? "Uploading..." : "Upload File"}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Folder Tree */}
            <div className="col-span-1 bg-alabaster rounded-xl p-3 border border-gold/10">
              <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wider mb-2 px-3">
                Folders
              </p>
              <FolderTreeNode
                node={rootFolder}
                selectedPath={selectedFolder}
                onSelect={setSelectedFolder}
              />
            </div>

            {/* Document List */}
            <div className="col-span-3 bg-alabaster rounded-xl p-4 border border-gold/10">
              {documentsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-orange" />
                </div>
              ) : !documentsData?.items.length ? (
                <div className="flex flex-col items-center justify-center h-48 text-charcoal/50">
                  <FileText className="w-10 h-10 mb-2" />
                  <p>No documents in this folder</p>
                  <p className="text-sm mt-1">Upload files to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documentsData.items.map((doc) => (
                    <DocumentItem key={doc.id} document={doc} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Q&A */}
        <div className="bg-alabaster rounded-xl p-5 border border-gold/10 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-orange" />
            <h2 className="text-lg font-semibold text-charcoal">Ask AI</h2>
          </div>

          <p className="text-sm text-charcoal/60 mb-4">
            Ask questions about the documents in this data room. AI will search through all uploaded files to find answers.
          </p>

          <div className="space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are the key financial metrics?"
              className="
                w-full p-3 rounded-lg border border-gold/20
                bg-bone text-charcoal placeholder:text-charcoal/40
                focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange
                resize-none h-24
              "
            />
            <button
              onClick={handleAskQuestion}
              disabled={!question.trim() || askMutation.isPending}
              className="
                w-full flex items-center justify-center gap-2
                px-4 py-2 bg-orange text-white rounded-lg
                hover:bg-orange/90 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {askMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              {askMutation.isPending ? "Thinking..." : "Ask Question"}
            </button>
          </div>

          {/* Answer Display */}
          {askMutation.data && (
            <div className="mt-4 p-4 bg-bone rounded-lg">
              <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wider mb-2">
                Answer
              </p>
              <p className="text-sm text-charcoal whitespace-pre-wrap">
                {askMutation.data.answer}
              </p>
              {askMutation.data.citations && askMutation.data.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gold/10">
                  <p className="text-xs font-medium text-citation mb-1">Sources:</p>
                  <div className="space-y-1">
                    {(askMutation.data.citations as unknown as Array<{ documentId: string; documentName: string }>).map((citation, i) => (
                      <p key={i} className="text-xs text-charcoal/60">
                        {citation.documentName}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
