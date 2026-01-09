"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layouts/PageHeader";
import { api } from "@/trpc/react";
import {
  ArrowLeft,
  FileText,
  Presentation,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileType,
} from "lucide-react";

type ExportFormat = "pptx" | "docx";

function downloadBase64File(base64: string, filename: string, mimeType: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export default function ExportPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pptx");
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    message: string;
    filename?: string;
    blockCount?: number;
    citationCount?: number;
  } | null>(null);

  // Fetch deal with page data
  const { data: dealData, isLoading: dealLoading } = api.deal.getWithPage.useQuery({ id: dealId });

  // Export mutation
  const exportMutation = api.generator.exportPage.useMutation({
    onSuccess: (result) => {
      // Download the file
      downloadBase64File(result.data, result.filename, result.mimeType);

      setExportResult({
        success: true,
        message: `Successfully exported ${result.pageTitle}`,
        filename: result.filename,
        blockCount: result.blockCount,
        citationCount: result.citationCount,
      });
    },
    onError: (error) => {
      setExportResult({
        success: false,
        message: error.message || "Export failed",
      });
    },
  });

  const handleExport = () => {
    if (!dealData?.page?.id) return;

    setExportResult(null);
    exportMutation.mutate({
      pageId: dealData.page.id,
      format: selectedFormat,
    });
  };

  if (dealLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (!dealData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-charcoal mb-2">Deal not found</h2>
        <Link href="/deals" className="text-orange hover:underline">
          Back to deals
        </Link>
      </div>
    );
  }

  const formatOptions = [
    {
      id: "pptx" as ExportFormat,
      name: "PowerPoint",
      description: "Export as presentation slides (.pptx)",
      icon: Presentation,
      color: "bg-orange/10 text-orange",
    },
    {
      id: "docx" as ExportFormat,
      name: "Word Document",
      description: "Export as formatted document (.docx)",
      icon: FileText,
      color: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/deals/${dealId}`}
          className="inline-flex items-center gap-1 text-sm text-charcoal/60 hover:text-charcoal mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {dealData.name}
        </Link>
        <PageHeader
          title="Export Report"
          subtitle={`Generate reports for ${dealData.name}`}
        />
      </div>

      <div className="max-w-2xl">
        {/* Format Selection */}
        <div className="bg-alabaster rounded-xl border border-gold/10 p-6 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">Select Format</h3>
          <div className="grid grid-cols-2 gap-4">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              const isSelected = selectedFormat === format.id;
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`
                    p-4 rounded-xl border-2 text-left transition-all
                    ${
                      isSelected
                        ? "border-orange bg-orange/5"
                        : "border-gold/10 hover:border-gold/30 bg-bone"
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${format.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-medium text-charcoal">{format.name}</p>
                  <p className="text-sm text-charcoal/60 mt-1">{format.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-alabaster rounded-xl border border-gold/10 p-6 mb-6">
          <h3 className="font-semibold text-charcoal mb-4">Export Contents</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bone rounded-lg">
              <FileType className="w-5 h-5 text-charcoal/50" />
              <div>
                <p className="font-medium text-charcoal text-sm">Deal Overview</p>
                <p className="text-xs text-charcoal/50">
                  {dealData.name} · {dealData.stage?.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            {dealData.page && (
              <div className="flex items-center gap-3 p-3 bg-bone rounded-lg">
                <FileText className="w-5 h-5 text-charcoal/50" />
                <div>
                  <p className="font-medium text-charcoal text-sm">
                    {dealData.page.title || "Deal Page"}
                  </p>
                  <p className="text-xs text-charcoal/50">
                    {dealData.page.blocks?.length || 0} content blocks
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={exportMutation.isPending || !dealData.page}
          className="
            w-full flex items-center justify-center gap-2
            px-6 py-3 bg-orange text-white rounded-xl
            font-medium text-lg
            hover:bg-orange/90 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export as {selectedFormat.toUpperCase()}
            </>
          )}
        </button>

        {!dealData.page && (
          <p className="text-sm text-charcoal/50 text-center mt-3">
            No page content available to export
          </p>
        )}

        {/* Result Message */}
        {exportResult && (
          <div
            className={`
              mt-6 p-4 rounded-xl flex items-start gap-3
              ${exportResult.success ? "bg-emerald-50" : "bg-red-50"}
            `}
          >
            {exportResult.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div>
              <p
                className={`font-medium ${
                  exportResult.success ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {exportResult.message}
              </p>
              {exportResult.success && exportResult.filename && (
                <p className="text-sm text-emerald-600 mt-1">
                  Downloaded: {exportResult.filename}
                  {exportResult.blockCount !== undefined && (
                    <> · {exportResult.blockCount} blocks</>
                  )}
                  {exportResult.citationCount !== undefined && exportResult.citationCount > 0 && (
                    <> · {exportResult.citationCount} citations</>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
