"use client";

/**
 * EntryFormSheet - Shared glass morphism form sheet component
 *
 * This component provides a slide-out form for creating/editing entries.
 * Used by both DatabaseViewBlock and Deals TableView.
 */

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@trato-hive/ui";
import { EntryFormSheetProps } from "./types";
import { FormField } from "./FormField";

export function EntryFormSheet<T extends Record<string, unknown>>({
  columns,
  entry,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  title,
}: EntryFormSheetProps<T>) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (entry) {
      return { ...entry };
    }
    const initial: Record<string, unknown> = {};
    columns.forEach((col) => {
      initial[col.id] = col.type === "CHECKBOX" ? false : "";
    });
    return initial;
  });

  // Reset form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({ ...entry });
    } else {
      const initial: Record<string, unknown> = {};
      columns.forEach((col) => {
        initial[col.id] = col.type === "CHECKBOX" ? false : "";
      });
      setFormData(initial);
    }
  }, [entry, columns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFieldChange = (columnId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [columnId]: value }));
  };

  const sheetTitle = title || (entry ? "Edit Entry" : "New Entry");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[calc(100%-24px)] sm:max-w-lg m-3 h-[calc(100%-24px)] overflow-y-auto bg-white/25 backdrop-blur-md border border-white/40 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-white/30 dark:bg-charcoal/25 dark:border-white/15 dark:ring-white/10"
      >
        <SheetClose className="absolute right-4 top-4" />
        <SheetHeader>
          <SheetTitle>{sheetTitle}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {columns
            .filter((col) => col.editable !== false)
            .map((col) => (
              <div key={col.id} className="space-y-2">
                <label className="block text-sm font-medium text-charcoal dark:text-cultured-white">
                  {col.name}
                </label>
                <FormField
                  column={col}
                  value={formData[col.id]}
                  onChange={(value) => handleFieldChange(col.id, value)}
                />
              </div>
            ))}

          <SheetFooter className="pt-6 border-t border-white/20 dark:border-white/10">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 text-sm font-medium text-charcoal bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/30 rounded-full transition-[color,background-color] dark:text-cultured-white dark:bg-white/10 dark:hover:bg-white/20 dark:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gold/90 hover:bg-gold backdrop-blur-sm rounded-full shadow-lg shadow-gold/20 transition-[color,background-color] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              {isLoading ? "Saving..." : entry ? "Update" : "Create"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default EntryFormSheet;
