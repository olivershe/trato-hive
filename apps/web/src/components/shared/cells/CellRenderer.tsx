"use client";

/**
 * CellRenderer - Shared cell rendering component for Notion-style inline editing
 *
 * This component handles all cell types (TEXT, NUMBER, DATE, SELECT, STATUS, etc.)
 * with inline editing capabilities. Used by both DatabaseViewBlock and Deals TableView.
 */

import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CellRendererProps,
  StatusOption,
  STATUS_COLOR_CLASSES,
  DEFAULT_STATUS_OPTIONS,
} from "./types";
import { RelationCellEditor } from "./RelationCellEditor";

export function CellRenderer({
  column,
  value,
  onSave,
  disabled = false,
  className,
  entryId,
  databaseId,
}: CellRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(String(value ?? ""));

  const handleSave = useCallback(() => {
    if (!onSave) return;

    let parsedValue: unknown = editValue;

    // Parse value based on column type
    if (column.type === "NUMBER") {
      parsedValue = editValue ? parseFloat(editValue) : null;
    } else if (column.type === "CHECKBOX") {
      parsedValue = editValue === "true";
    } else if (column.type === "DATE") {
      parsedValue = editValue || null;
    }

    onSave(parsedValue);
    setIsEditing(false);
  }, [column.type, editValue, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditValue(String(value ?? ""));
      }
    },
    [handleSave, value]
  );

  const handleDirectSave = useCallback(
    (newValue: unknown) => {
      if (onSave) {
        onSave(newValue);
      }
    },
    [onSave]
  );

  // Checkbox type - Notion-style compact checkbox
  if (column.type === "CHECKBOX") {
    return (
      <div className={cn("flex items-center justify-center h-5", className)}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => handleDirectSave(e.target.checked)}
          disabled={disabled}
          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-charcoal/60 text-orange focus:ring-orange/30 focus:ring-1 focus:ring-offset-0 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={column.name}
        />
      </div>
    );
  }

  // Select type - Notion-style pill/tag
  if (column.type === "SELECT" && column.options) {
    const currentValue = String(value ?? "");
    return (
      <select
        value={currentValue}
        onChange={(e) => handleDirectSave(e.target.value || null)}
        disabled={disabled}
        className={cn(
          "w-full px-1.5 py-0.5 text-[11px] rounded-sm border-0 bg-transparent text-charcoal dark:text-cultured-white focus:ring-1 focus:ring-orange/30 cursor-pointer hover:bg-gray-50 dark:hover:bg-surface-dark/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          currentValue
            ? "font-medium"
            : "text-charcoal/30 dark:text-cultured-white/30",
          className
        )}
        aria-label={column.name}
      >
        <option value="">-</option>
        {column.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // Multi-select type - Notion-style multi-tag
  if (column.type === "MULTI_SELECT" && column.options) {
    const selectedValues = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className={cn("flex flex-wrap gap-0.5 min-h-[22px] px-0.5 py-0.5 items-center", className)}>
        {selectedValues.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200 rounded-md border border-blue-100 dark:border-blue-800"
          >
            <span className="truncate max-w-[80px]">{v}</span>
            {!disabled && (
              <button
                onClick={() => {
                  const newValues = selectedValues.filter((sv) => sv !== v);
                  handleDirectSave(newValues);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}
        {selectedValues.length === 0 && (
          <span className="text-charcoal/20 dark:text-cultured-white/20 text-[11px]">-</span>
        )}
      </div>
    );
  }

  // Status type - Colored badge dropdown (Notion-style)
  if (column.type === "STATUS") {
    const statusOptions: StatusOption[] = column.statusOptions || DEFAULT_STATUS_OPTIONS;
    const currentValue = String(value ?? "");
    const selectedOption = statusOptions.find(
      (opt: StatusOption) => opt.id === currentValue
    );

    return (
      <div className={cn("relative inline-flex", className)}>
        {/* Badge display (underneath) */}
        <div
          className={cn(
            "px-2 py-0.5 text-[10px] font-medium rounded-md inline-flex items-center pointer-events-none",
            selectedOption
              ? STATUS_COLOR_CLASSES[selectedOption.color] || STATUS_COLOR_CLASSES.gray
              : "text-charcoal/30 dark:text-cultured-white/30"
          )}
        >
          {selectedOption ? selectedOption.name : "-"}
        </div>
        {/* Hidden select overlay (on top) - captures clicks */}
        <select
          value={currentValue}
          onChange={(e) => handleDirectSave(e.target.value || null)}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          aria-label={column.name}
        >
          <option value="">-</option>
          {statusOptions.map((opt: StatusOption) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // ROLLUP and FORMULA types - Read-only computed values
  if (column.type === "ROLLUP" || column.type === "FORMULA") {
    return (
      <div
        className={cn(
          "min-h-[22px] px-0.5 py-0.5 text-[11px] text-charcoal/60 dark:text-cultured-white/60 italic flex items-center",
          className
        )}
      >
        {value != null && value !== "" ? (
          <span className="truncate">{String(value)}</span>
        ) : (
          <span className="text-charcoal/20 dark:text-cultured-white/20">-</span>
        )}
      </div>
    );
  }

  // URL type - Notion-style link
  if (column.type === "URL" && value) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-[11px] text-orange hover:text-orange/80 hover:underline truncate block px-0.5 py-0.5 transition-colors",
          className
        )}
      >
        {String(value)}
      </a>
    );
  }

  // PERSON type - Show user avatar/name
  if (column.type === "PERSON") {
    const personValue = value as string | null;
    return (
      <div
        className={cn(
          "min-h-[22px] px-0.5 py-0.5 text-[11px] text-charcoal dark:text-cultured-white flex items-center gap-1",
          className
        )}
      >
        {personValue ? (
          <>
            <div className="w-4 h-4 rounded-full bg-gold/20 flex items-center justify-center text-[8px] font-bold text-gold">
              {personValue.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{personValue}</span>
          </>
        ) : (
          <span className="text-charcoal/20 dark:text-cultured-white/20">-</span>
        )}
      </div>
    );
  }

  // RELATION type - Linked entries via junction table
  if (column.type === "RELATION" && column.relationConfig && entryId && databaseId) {
    return (
      <RelationCellEditor
        column={column}
        entryId={entryId}
        databaseId={databaseId}
        disabled={disabled}
        className={className}
      />
    );
  }

  // RELATION type without required props - show placeholder
  if (column.type === "RELATION") {
    return (
      <div
        className={cn(
          "min-h-[22px] px-0.5 py-0.5 text-[11px] text-charcoal/30 dark:text-cultured-white/30 italic flex items-center",
          className
        )}
      >
        {column.relationConfig ? "Configure cell" : "Configure relation"}
      </div>
    );
  }

  // DATE type - with date picker
  if (column.type === "DATE") {
    if (isEditing && !disabled) {
      return (
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className={cn(
            "w-full px-1 py-0.5 text-[11px] rounded-sm border border-orange/60 bg-white dark:bg-deep-grey text-charcoal dark:text-cultured-white focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange transition-colors",
            className
          )}
          aria-label={`Edit ${column.name}`}
        />
      );
    }

    // Format date for display
    const dateDisplay = value
      ? new Date(String(value)).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return (
      <div
        onClick={() => {
          if (!disabled) {
            setIsEditing(true);
            setEditValue(value ? String(value).slice(0, 10) : "");
          }
        }}
        className={cn(
          "min-h-[22px] px-0.5 py-0.5 text-[11px] text-charcoal dark:text-cultured-white cursor-text hover:bg-gray-50 dark:hover:bg-surface-dark/50 rounded-sm transition-colors flex items-center",
          disabled && "cursor-default hover:bg-transparent",
          className
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            setIsEditing(true);
            setEditValue(value ? String(value).slice(0, 10) : "");
          }
        }}
        aria-label={`${column.name}: ${dateDisplay ?? "empty"}`}
      >
        {dateDisplay ? (
          <span className="truncate">{dateDisplay}</span>
        ) : (
          <span className="text-charcoal/20 dark:text-cultured-white/20">-</span>
        )}
      </div>
    );
  }

  // Editable text/number - Notion-style inline edit
  if (isEditing && !disabled) {
    return (
      <input
        type={column.type === "NUMBER" ? "number" : "text"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn(
          "w-full px-1 py-0.5 text-[11px] rounded-sm border border-orange/60 bg-white dark:bg-deep-grey text-charcoal dark:text-cultured-white focus:outline-none focus:ring-1 focus:ring-orange/30 focus:border-orange transition-colors",
          column.type === "NUMBER" && "tabular-nums font-mono",
          className
        )}
        aria-label={`Edit ${column.name}`}
      />
    );
  }

  // Display mode - Notion-style cell
  return (
    <div
      onClick={() => {
        if (!disabled) {
          setIsEditing(true);
          setEditValue(String(value ?? ""));
        }
      }}
      className={cn(
        "min-h-[22px] px-0.5 py-0.5 text-[11px] text-charcoal dark:text-cultured-white cursor-text hover:bg-gray-50 dark:hover:bg-surface-dark/50 rounded-sm transition-colors flex items-center",
        disabled && "cursor-default hover:bg-transparent",
        column.type === "NUMBER" && "tabular-nums font-mono",
        className
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          setIsEditing(true);
          setEditValue(String(value ?? ""));
        }
      }}
      aria-label={`${column.name}: ${value ?? "empty"}`}
    >
      {value != null && value !== "" ? (
        <span className="truncate">{String(value)}</span>
      ) : (
        <span className="text-charcoal/20 dark:text-cultured-white/20">-</span>
      )}
    </div>
  );
}

export default CellRenderer;
