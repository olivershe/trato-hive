"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "@/trpc/react";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  dealId: string | null;
  onSuccess?: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadModal({ open, onClose, dealId, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadUrl = api.vdr.getUploadUrl.useMutation();
  const createDocument = api.vdr.createDocument.useMutation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFiles = async () => {
    if (!dealId) return;

    for (const uploadFile of files) {
      if (uploadFile.status !== "pending") continue;

      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
          )
        );

        // Get presigned upload URL
        const { url, key } = await getUploadUrl.mutateAsync({
          filename: uploadFile.file.name,
          mimeType: uploadFile.file.type || "application/octet-stream",
          fileSize: uploadFile.file.size,
          dealId,
        });

        // Upload to S3
        const uploadResponse = await fetch(url, {
          method: "PUT",
          body: uploadFile.file,
          headers: {
            "Content-Type": uploadFile.file.type || "application/octet-stream",
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        // Update progress
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, progress: 50, status: "processing" } : f
          )
        );

        // Create document record
        await createDocument.mutateAsync({
          name: uploadFile.file.name,
          fileUrl: key,
          fileSize: uploadFile.file.size,
          mimeType: uploadFile.file.type || "application/octet-stream",
          dealId,
        });

        // Mark as complete
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, progress: 100, status: "complete" } : f
          )
        );
      } catch (error) {
        // Mark as error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "error", error: (error as Error).message }
              : f
          )
        );
      }
    }

    // Call onSuccess if all files completed successfully
    const allComplete = files.every((f) => f.status === "complete");
    if (allComplete && onSuccess) {
      onSuccess();
    }
  };

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => ["uploading", "processing"].includes(f.status)).length;
  const completeCount = files.filter((f) => f.status === "complete").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
          <h2 className="text-lg font-semibold text-charcoal">Upload Documents</h2>
          <button
            onClick={handleClose}
            className="p-1.5 text-charcoal/50 hover:text-charcoal hover:bg-bone rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
              ${
                isDragging
                  ? "border-orange bg-orange/5"
                  : "border-gold/30 hover:border-orange/50 hover:bg-alabaster"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload
              className={`w-10 h-10 mx-auto mb-3 ${
                isDragging ? "text-orange" : "text-charcoal/30"
              }`}
            />
            <p className="text-sm font-medium text-charcoal">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-xs text-charcoal/50 mt-1">
              or click to browse
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-charcoal/60 uppercase tracking-wider mb-3">
                Files ({files.length})
              </p>
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 bg-alabaster rounded-lg"
                >
                  {/* Icon */}
                  <div className="w-8 h-8 bg-bone rounded flex items-center justify-center flex-shrink-0">
                    {uploadFile.status === "complete" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : uploadFile.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : uploadFile.status === "uploading" || uploadFile.status === "processing" ? (
                      <Loader2 className="w-4 h-4 text-orange animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 text-charcoal/50" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-charcoal/50">
                      {uploadFile.status === "error"
                        ? uploadFile.error
                        : uploadFile.status === "processing"
                        ? "Processing..."
                        : uploadFile.status === "uploading"
                        ? "Uploading..."
                        : uploadFile.status === "complete"
                        ? "Complete"
                        : formatFileSize(uploadFile.file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  {uploadFile.status === "pending" && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="p-1 text-charcoal/40 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Status Summary */}
          {files.length > 0 && (completeCount > 0 || errorCount > 0) && (
            <div className="mt-4 p-3 bg-alabaster rounded-lg">
              <p className="text-sm text-charcoal">
                {completeCount > 0 && (
                  <span className="text-emerald-600">{completeCount} uploaded</span>
                )}
                {completeCount > 0 && errorCount > 0 && " · "}
                {errorCount > 0 && (
                  <span className="text-red-500">{errorCount} failed</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gold/10">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors"
          >
            {completeCount === files.length && files.length > 0 ? "Done" : "Cancel"}
          </button>
          {pendingCount > 0 && (
            <button
              onClick={uploadFiles}
              disabled={uploadingCount > 0 || !dealId}
              className="
                flex items-center gap-2 px-4 py-2
                bg-orange text-white rounded-lg
                hover:bg-orange/90 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                text-sm font-medium
              "
            >
              {uploadingCount > 0 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {pendingCount} {pendingCount === 1 ? "file" : "files"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
