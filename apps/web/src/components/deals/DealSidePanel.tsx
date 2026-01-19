/**
 * DealSidePanel - Notion-style side panel for viewing/editing deal details
 *
 * Opens from Table/Kanban view when clicking a deal.
 * Uses the same field rendering pattern as DatabaseViewBlock's EntryFormSheet.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Building2,
  Calendar,
  DollarSign,
  User,
  Tag,
  Percent,
  FileText,
  ChevronDown,
} from "lucide-react";
import { api } from "@/trpc/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@trato-hive/ui";
import { FormField } from "./fields/FormField";

// =============================================================================
// Types
// =============================================================================

interface DealSidePanelProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DealFormData = {
  name: string;
  stage: string;
  type: string;
  value: number | null;
  probability: number | null;
  expectedCloseDate: Date | null;
  description: string | null;
  priority: string;
  source: string | null;
  leadPartnerId: string | null;
  customFields: Record<string, unknown> | null;
};

// =============================================================================
// Stage and Type Options
// =============================================================================

const DEAL_STAGES = [
  { value: "SOURCING", label: "Sourcing", color: "bg-blue-100 text-blue-800" },
  { value: "INITIAL_REVIEW", label: "Initial Review", color: "bg-violet-100 text-violet-800" },
  { value: "PRELIMINARY_DUE_DILIGENCE", label: "Preliminary DD", color: "bg-pink-100 text-pink-800" },
  { value: "DEEP_DUE_DILIGENCE", label: "Deep DD", color: "bg-orange-100 text-orange-800" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-amber-100 text-amber-800" },
  { value: "CLOSING", label: "Closing", color: "bg-emerald-100 text-emerald-800" },
  { value: "CLOSED_WON", label: "Closed Won", color: "bg-green-100 text-green-800" },
  { value: "CLOSED_LOST", label: "Closed Lost", color: "bg-red-100 text-red-800" },
];

const DEAL_TYPES = [
  { value: "ACQUISITION", label: "Acquisition" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "OTHER", label: "Other" },
];

const DEAL_PRIORITIES = [
  { value: "NONE", label: "None", color: "bg-gray-100 text-gray-600" },
  { value: "LOW", label: "Low", color: "bg-slate-100 text-slate-700" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-100 text-amber-800" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-800" },
];

const DEAL_SOURCES = [
  { value: "REFERRAL", label: "Referral" },
  { value: "OUTBOUND", label: "Outbound" },
  { value: "INBOUND", label: "Inbound" },
  { value: "AUCTION", label: "Auction" },
  { value: "NETWORK", label: "Network" },
  { value: "OTHER", label: "Other" },
];

// =============================================================================
// Main Component
// =============================================================================

export function DealSidePanel({ dealId, open, onOpenChange }: DealSidePanelProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<DealFormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch deal data
  const { data: deal, isLoading } = api.deal.get.useQuery(
    { id: dealId! },
    { enabled: !!dealId && open }
  );

  // Fetch custom field schemas
  const { data: customFieldSchemas } = api.dealField.list.useQuery(undefined, {
    enabled: open,
  });

  // Update mutation
  const utils = api.useUtils();
  const updateMutation = api.deal.update.useMutation({
    onSuccess: () => {
      utils.deal.get.invalidate({ id: dealId! });
      utils.deal.list.invalidate();
      setIsDirty(false);
    },
  });

  // Initialize form data when deal loads
  useEffect(() => {
    if (deal) {
      setFormData({
        name: deal.name,
        stage: deal.stage,
        type: deal.type,
        value: deal.value ? Number(deal.value) : null,
        probability: deal.probability,
        expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null,
        description: deal.description,
        priority: deal.priority || "NONE",
        source: deal.source,
        leadPartnerId: deal.leadPartnerId,
        customFields: deal.customFields as Record<string, unknown> | null,
      });
      setIsDirty(false);
    }
  }, [deal]);

  // Handle field change with auto-save on blur
  const handleFieldChange = useCallback((field: keyof DealFormData, value: unknown) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
    setIsDirty(true);
  }, []);

  // Handle custom field change
  const handleCustomFieldChange = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => {
      if (!prev) return null;
      const customFields = { ...(prev.customFields || {}), [fieldId]: value };
      return { ...prev, customFields };
    });
    setIsDirty(true);
  }, []);

  // Save changes
  const handleSave = useCallback(() => {
    if (!dealId || !formData || !isDirty) return;

    updateMutation.mutate({
      id: dealId,
      name: formData.name,
      stage: formData.stage,
      type: formData.type,
      value: formData.value,
      probability: formData.probability,
      expectedCloseDate: formData.expectedCloseDate,
      description: formData.description,
      priority: formData.priority,
      source: formData.source,
      leadPartnerId: formData.leadPartnerId,
      customFields: formData.customFields,
    });
  }, [dealId, formData, isDirty, updateMutation]);

  // Auto-save on blur
  const handleBlur = useCallback(() => {
    if (isDirty) {
      handleSave();
    }
  }, [isDirty, handleSave]);

  // Navigate to deal page
  const handleOpenDealPage = useCallback(() => {
    if (dealId) {
      router.push(`/deals/${dealId}`);
      onOpenChange(false);
    }
  }, [dealId, router, onOpenChange]);

  // Get stage badge color
  const getStageBadge = (stage: string) => {
    const stageConfig = DEAL_STAGES.find((s) => s.value === stage);
    return stageConfig || { label: stage, color: "bg-gray-100 text-gray-800" };
  };

  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = DEAL_PRIORITIES.find((p) => p.value === priority);
    return priorityConfig || { label: priority, color: "bg-gray-100 text-gray-600" };
  };

  if (!dealId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[calc(100%-24px)] sm:max-w-lg m-3 h-[calc(100%-24px)] overflow-y-auto bg-white/25 backdrop-blur-md border border-white/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-white/30 dark:bg-charcoal/25 dark:border-white/15 dark:ring-white/10"
      >
        {/* Close button */}
        <SheetClose className="absolute right-4 top-4 z-10" />

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : formData ? (
          <>
            {/* Header */}
            <SheetHeader className="pb-4 border-b border-white/20 dark:border-white/10">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  {/* Deal name - editable */}
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={handleBlur}
                    className="text-lg font-semibold text-charcoal dark:text-cultured-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                  />
                  {/* Stage badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStageBadge(formData.stage).color
                      }`}
                    >
                      {getStageBadge(formData.stage).label}
                    </span>
                    {formData.priority !== "NONE" && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getPriorityBadge(formData.priority).color
                        }`}
                      >
                        {getPriorityBadge(formData.priority).label}
                      </span>
                    )}
                  </div>
                </div>
                {/* Open full page button */}
                <button
                  onClick={handleOpenDealPage}
                  className="p-2 rounded-lg text-charcoal/60 hover:text-charcoal hover:bg-white/30 transition-colors dark:text-cultured-white/60 dark:hover:text-cultured-white dark:hover:bg-white/10"
                  title="Open deal page"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </SheetHeader>

            {/* Fields */}
            <div className="mt-6 space-y-4">
              {/* Core Fields Section */}
              <FieldSection title="Core Information">
                {/* Stage */}
                <FieldRow icon={Tag} label="Stage">
                  <select
                    value={formData.stage}
                    onChange={(e) => handleFieldChange("stage", e.target.value)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white"
                  >
                    {DEAL_STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                {/* Type */}
                <FieldRow icon={FileText} label="Type">
                  <select
                    value={formData.type}
                    onChange={(e) => handleFieldChange("type", e.target.value)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white"
                  >
                    {DEAL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                {/* Value */}
                <FieldRow icon={DollarSign} label="Value">
                  <input
                    type="number"
                    value={formData.value ?? ""}
                    onChange={(e) =>
                      handleFieldChange("value", e.target.value ? Number(e.target.value) : null)
                    }
                    onBlur={handleBlur}
                    placeholder="Enter value..."
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 tabular-nums"
                  />
                </FieldRow>

                {/* Probability */}
                <FieldRow icon={Percent} label="Probability">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.probability ?? ""}
                    onChange={(e) =>
                      handleFieldChange(
                        "probability",
                        e.target.value ? Math.min(100, Math.max(0, Number(e.target.value))) : null
                      )
                    }
                    onBlur={handleBlur}
                    placeholder="0-100%"
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 tabular-nums"
                  />
                </FieldRow>

                {/* Expected Close Date */}
                <FieldRow icon={Calendar} label="Expected Close">
                  <input
                    type="date"
                    value={
                      formData.expectedCloseDate
                        ? formData.expectedCloseDate.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleFieldChange(
                        "expectedCloseDate",
                        e.target.value ? new Date(e.target.value) : null
                      )
                    }
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white"
                  />
                </FieldRow>
              </FieldSection>

              {/* Additional Fields Section */}
              <FieldSection title="Additional Details">
                {/* Priority */}
                <FieldRow icon={Tag} label="Priority">
                  <select
                    value={formData.priority}
                    onChange={(e) => handleFieldChange("priority", e.target.value)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white"
                  >
                    {DEAL_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                {/* Source */}
                <FieldRow icon={Building2} label="Source">
                  <select
                    value={formData.source ?? ""}
                    onChange={(e) => handleFieldChange("source", e.target.value || null)}
                    onBlur={handleBlur}
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white"
                  >
                    <option value="">Select source...</option>
                    {DEAL_SOURCES.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                {/* Lead Partner */}
                <FieldRow icon={User} label="Lead Partner">
                  <FormField
                    column={{ id: "leadPartnerId", name: "Lead Partner", type: "PERSON" }}
                    value={formData.leadPartnerId}
                    onChange={(v) => {
                      handleFieldChange("leadPartnerId", v);
                      handleBlur();
                    }}
                  />
                </FieldRow>

                {/* Description */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-charcoal/70 dark:text-cultured-white/70">
                    <FileText className="w-4 h-4" />
                    Description
                  </label>
                  <textarea
                    value={formData.description ?? ""}
                    onChange={(e) => handleFieldChange("description", e.target.value || null)}
                    onBlur={handleBlur}
                    rows={3}
                    placeholder="Add a description..."
                    className="w-full px-3 py-2 rounded-lg border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal text-sm placeholder:text-charcoal/40 focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 resize-none"
                  />
                </div>
              </FieldSection>

              {/* Custom Fields Section */}
              {customFieldSchemas && customFieldSchemas.length > 0 && (
                <FieldSection title="Custom Fields">
                  {customFieldSchemas.map((schema: { id: string; name: string; type: string; options: unknown }) => (
                    <div key={schema.id} className="space-y-2">
                      <label className="block text-sm font-medium text-charcoal/70 dark:text-cultured-white/70">
                        {schema.name}
                      </label>
                      <FormField
                        column={{
                          id: schema.id,
                          name: schema.name,
                          type: schema.type,
                          options: schema.options as string[] | undefined,
                        }}
                        value={formData.customFields?.[schema.id]}
                        onChange={(v) => {
                          handleCustomFieldChange(schema.id, v);
                          handleBlur();
                        }}
                      />
                    </div>
                  ))}
                </FieldSection>
              )}
            </div>

            {/* Saving indicator */}
            {updateMutation.isPending && (
              <div className="fixed bottom-6 right-6 px-4 py-2 bg-charcoal/90 text-white rounded-full text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            )}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

interface FieldSectionProps {
  title: string;
  children: React.ReactNode;
}

function FieldSection({ title, children }: FieldSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-charcoal/80 dark:text-cultured-white/80 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
        />
        {title}
      </button>
      {isExpanded && <div className="space-y-3 pl-6">{children}</div>}
    </div>
  );
}

interface FieldRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}

function FieldRow({ icon: Icon, label, children }: FieldRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-28 flex-shrink-0">
        <Icon className="w-4 h-4 text-charcoal/50 dark:text-cultured-white/50" />
        <span className="text-sm text-charcoal/70 dark:text-cultured-white/70">{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
