/**
 * CustomFieldsManager - Manage custom field definitions
 *
 * Allows users to view, edit, and delete custom fields for the organization.
 * Accessed via settings or table column menu.
 */
"use client";

import { useState } from "react";
import { Settings, Trash2, GripVertical, Plus } from "lucide-react";
import { api } from "@/trpc/react";
import { AddFieldDialog } from "./AddFieldDialog";

// =============================================================================
// Types
// =============================================================================

interface CustomFieldsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  SELECT: "Select",
  MULTI_SELECT: "Multi-select",
  DATE: "Date",
  PERSON: "Person",
  CHECKBOX: "Checkbox",
  URL: "URL",
};

// =============================================================================
// Main Component
// =============================================================================

export function CustomFieldsManager({ open, onOpenChange }: CustomFieldsManagerProps) {
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const utils = api.useUtils();
  const { data: fields, isLoading } = api.dealField.list.useQuery();

  const updateMutation = api.dealField.update.useMutation({
    onSuccess: () => {
      utils.dealField.list.invalidate();
      setEditingId(null);
    },
  });

  const deleteMutation = api.dealField.delete.useMutation({
    onSuccess: () => {
      utils.dealField.list.invalidate();
    },
  });

  function handleStartEdit(field: { id: string; name: string }) {
    setEditingId(field.id);
    setEditName(field.name);
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate({ id: editingId, name: editName.trim() });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this field? This will remove the field from all deals.")) {
      deleteMutation.mutate({ id });
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />

        {/* Dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-fields-title"
          className="relative z-50 w-full max-w-lg mx-4 bg-white dark:bg-deep-grey rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gold/10 max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gold/10">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold" />
              <h2 id="custom-fields-title" className="text-lg font-semibold text-charcoal dark:text-cultured-white">
                Manage Custom Fields
              </h2>
            </div>
            <button
              onClick={() => setAddFieldOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Field
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="text-center py-8 text-charcoal/50 dark:text-cultured-white/50">
                Loading fields...
              </div>
            ) : fields && fields.length > 0 ? (
              <div className="space-y-2">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-alabaster dark:bg-charcoal/50 border border-gold/10 group"
                  >
                    <GripVertical className="w-4 h-4 text-charcoal/30 dark:text-cultured-white/30 cursor-grab" />

                    <div className="flex-1 min-w-0">
                      {editingId === field.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          autoFocus
                          className="w-full px-2 py-1 rounded border border-gold/30 bg-white dark:bg-deep-grey text-charcoal dark:text-cultured-white focus:border-gold focus:ring-1 focus:ring-gold/30"
                        />
                      ) : (
                        <button
                          onClick={() => handleStartEdit(field)}
                          className="text-left w-full"
                        >
                          <span className="font-medium text-charcoal dark:text-cultured-white">
                            {field.name}
                          </span>
                        </button>
                      )}
                    </div>

                    <span className="px-2 py-0.5 text-xs rounded-full bg-gold/10 text-gold font-medium">
                      {FIELD_TYPE_LABELS[field.type] || field.type}
                    </span>

                    {editingId === field.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                          className="px-2 py-1 text-xs bg-orange text-white rounded hover:bg-orange/90 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-xs text-charcoal/60 hover:text-charcoal dark:text-cultured-white/60 dark:hover:text-cultured-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(field.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded text-charcoal/40 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                        aria-label={`Delete ${field.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-charcoal/50 dark:text-cultured-white/50 mb-4">
                  No custom fields yet. Add fields to track additional deal information.
                </p>
                <button
                  onClick={() => setAddFieldOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Field
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gold/10">
            <button
              onClick={() => onOpenChange(false)}
              className="w-full px-4 py-2 rounded-lg text-charcoal/70 hover:text-charcoal hover:bg-alabaster transition-colors dark:text-cultured-white/70 dark:hover:text-cultured-white dark:hover:bg-charcoal"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <AddFieldDialog
        open={addFieldOpen}
        onOpenChange={setAddFieldOpen}
        onSuccess={() => utils.dealField.list.invalidate()}
      />
    </>
  );
}
