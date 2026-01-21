/**
 * AddFieldDialog - Dialog for creating new custom fields
 *
 * Opens from the "+" button in table header.
 * Allows users to create custom fields with name, type, and options.
 */
"use client";

import { useState, useCallback } from "react";
import { X, Plus } from "lucide-react";
import { api } from "@/trpc/react";
import { RelationConfigDialog, type RelationConfig } from "@/components/shared/cells/RelationConfigDialog";

// =============================================================================
// Types
// =============================================================================

interface AddFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const FIELD_TYPES = [
  { value: "TEXT", label: "Text", description: "Single line of text" },
  { value: "NUMBER", label: "Number", description: "Numeric value" },
  { value: "SELECT", label: "Select", description: "Single choice from options" },
  { value: "MULTI_SELECT", label: "Multi-select", description: "Multiple choices from options" },
  { value: "STATUS", label: "Status", description: "Colored status badges" },
  { value: "DATE", label: "Date", description: "Date picker" },
  { value: "PERSON", label: "Person", description: "Team member" },
  { value: "CHECKBOX", label: "Checkbox", description: "Yes/No toggle" },
  { value: "URL", label: "URL", description: "Web link" },
  { value: "RELATION", label: "Relation", description: "Link to other records" },
  { value: "ROLLUP", label: "Rollup", description: "Summary from related records" },
  { value: "FORMULA", label: "Formula", description: "Computed value" },
] as const;

type FieldType = (typeof FIELD_TYPES)[number]["value"];

// Status color options for STATUS type
const STATUS_COLORS = [
  { id: "gray", name: "Gray", className: "bg-gray-200" },
  { id: "blue", name: "Blue", className: "bg-blue-400" },
  { id: "green", name: "Green", className: "bg-green-400" },
  { id: "yellow", name: "Yellow", className: "bg-yellow-400" },
  { id: "red", name: "Red", className: "bg-red-400" },
  { id: "purple", name: "Purple", className: "bg-purple-400" },
  { id: "orange", name: "Orange", className: "bg-orange-400" },
] as const;

type StatusColor = (typeof STATUS_COLORS)[number]["id"];

interface StatusOptionInput {
  name: string;
  color: StatusColor;
}

// =============================================================================
// Main Component
// =============================================================================

export function AddFieldDialog({ open, onOpenChange, onSuccess }: AddFieldDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("TEXT");
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [required, setRequired] = useState(false);
  // Status type specific state
  const [statusOptions, setStatusOptions] = useState<StatusOptionInput[]>([]);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState<StatusColor>("gray");
  // Relation type specific state
  const [relationConfig, setRelationConfig] = useState<RelationConfig | null>(null);

  const utils = api.useUtils();
  const createMutation = api.dealField.create.useMutation({
    onSuccess: () => {
      utils.dealField.list.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
  });

  const resetForm = useCallback(() => {
    setName("");
    setType("TEXT");
    setOptions([]);
    setNewOption("");
    setRequired(false);
    setStatusOptions([]);
    setNewStatusName("");
    setNewStatusColor("gray");
    setRelationConfig(null);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    resetForm();
  }, [onOpenChange, resetForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Build options based on type
    let fieldOptions: string[] | { id: string; name: string; color: string }[] | null = null;
    if (type === "SELECT" || type === "MULTI_SELECT") {
      fieldOptions = options;
    } else if (type === "STATUS") {
      // Status options are stored as { id, name, color }[] structure
      fieldOptions = statusOptions.map((opt, idx) => ({
        id: `status_${idx}`,
        name: opt.name,
        color: opt.color,
      }));
    }

    createMutation.mutate({
      name: name.trim(),
      type,
      options: fieldOptions,
      required,
      // Include relation config for RELATION type
      ...(type === "RELATION" && relationConfig ? { relationConfig } : {}),
    });
  };

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOption();
    }
  };

  // Status option handlers
  const handleAddStatusOption = () => {
    if (newStatusName.trim() && !statusOptions.some((opt) => opt.name === newStatusName.trim())) {
      setStatusOptions([...statusOptions, { name: newStatusName.trim(), color: newStatusColor }]);
      setNewStatusName("");
      setNewStatusColor("gray");
    }
  };

  const handleRemoveStatusOption = (index: number) => {
    setStatusOptions(statusOptions.filter((_, i) => i !== index));
  };

  const handleStatusKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddStatusOption();
    }
  };

  const showOptionsInput = type === "SELECT" || type === "MULTI_SELECT";
  const showStatusInput = type === "STATUS";
  const showRelationInput = type === "RELATION";
  const showAdvancedNotice = type === "ROLLUP" || type === "FORMULA";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-field-title"
        className="relative z-50 w-full max-w-md mx-4 bg-white dark:bg-deep-grey rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gold/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/10">
          <h2 id="add-field-title" className="text-lg font-semibold text-charcoal dark:text-cultured-white">
            Add Custom Field
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-charcoal/50 hover:text-charcoal hover:bg-alabaster transition-colors dark:text-cultured-white/50 dark:hover:text-cultured-white dark:hover:bg-charcoal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Field Name */}
          <div className="space-y-2">
            <label
              htmlFor="field-name"
              className="block text-sm font-medium text-charcoal/70 dark:text-cultured-white/70"
            >
              Field Name
            </label>
            <input
              id="field-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Industry, Region, Deal Source"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-gold/20 bg-alabaster dark:bg-charcoal text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
            />
          </div>

          {/* Field Type */}
          <div className="space-y-2">
            <label
              htmlFor="field-type"
              className="block text-sm font-medium text-charcoal/70 dark:text-cultured-white/70"
            >
              Field Type
            </label>
            <select
              id="field-type"
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
              className="w-full px-3 py-2 rounded-lg border border-gold/20 bg-alabaster dark:bg-charcoal text-charcoal dark:text-cultured-white focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label} - {ft.description}
                </option>
              ))}
            </select>
          </div>

          {/* Options (for SELECT/MULTI_SELECT) */}
          {showOptionsInput && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/70 dark:text-cultured-white/70">
                Options
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add an option..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gold/20 bg-alabaster dark:bg-charcoal text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                  className="px-3 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {options.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {options.map((opt, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/10 text-gold text-sm"
                    >
                      {opt}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-0.5 rounded-full hover:bg-gold/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {options.length === 0 && (
                <p className="text-sm text-charcoal/40 dark:text-cultured-white/40 italic">
                  Add at least one option for this field type
                </p>
              )}
            </div>
          )}

          {/* Status Options (for STATUS type) */}
          {showStatusInput && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-charcoal/70 dark:text-cultured-white/70">
                Status Options
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyDown={handleStatusKeyDown}
                  placeholder="Status name..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gold/20 bg-alabaster dark:bg-charcoal text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                />
                <select
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value as StatusColor)}
                  className="px-2 py-2 rounded-lg border border-gold/20 bg-alabaster dark:bg-charcoal text-charcoal dark:text-cultured-white focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                >
                  {STATUS_COLORS.map((color) => (
                    <option key={color.id} value={color.id}>
                      {color.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddStatusOption}
                  disabled={!newStatusName.trim()}
                  className="px-3 py-2 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {statusOptions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {statusOptions.map((opt, index) => {
                    const colorClass = STATUS_COLORS.find((c) => c.id === opt.color)?.className || "bg-gray-200";
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                        <span className="text-charcoal dark:text-cultured-white">{opt.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStatusOption(index)}
                          className="p-0.5 rounded-full hover:bg-charcoal/10 dark:hover:bg-cultured-white/10 transition-colors"
                        >
                          <X className="w-3 h-3 text-charcoal/50 dark:text-cultured-white/50" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {statusOptions.length === 0 && (
                <p className="text-sm text-charcoal/40 dark:text-cultured-white/40 italic">
                  Add at least one status option
                </p>
              )}
            </div>
          )}

          {/* Relation Configuration (for RELATION type) */}
          {showRelationInput && (
            <RelationConfigDialog
              onConfigChange={setRelationConfig}
              initialConfig={relationConfig}
            />
          )}

          {/* Advanced Type Notice */}
          {showAdvancedNotice && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {type === "ROLLUP" && "Rollup fields compute values from related records (sum, count, etc.). Configuration options coming soon."}
                {type === "FORMULA" && "Formula fields calculate values using expressions. Configuration options coming soon."}
              </p>
            </div>
          )}

          {/* Required Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 rounded border-gold/30 text-gold focus:ring-gold/30"
            />
            <span className="text-sm text-charcoal/70 dark:text-cultured-white/70">
              Required field
            </span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-charcoal/70 hover:text-charcoal hover:bg-alabaster transition-colors dark:text-cultured-white/70 dark:hover:text-cultured-white dark:hover:bg-charcoal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || createMutation.isPending || (showOptionsInput && options.length === 0) || (showStatusInput && statusOptions.length === 0) || (showRelationInput && !relationConfig)}
              className="px-4 py-2 rounded-lg bg-orange text-white hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createMutation.isPending ? "Creating..." : "Create Field"}
            </button>
          </div>

          {/* Error */}
          {createMutation.error && (
            <p className="text-sm text-red-500 mt-2">
              {createMutation.error.message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
