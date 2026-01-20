"use client";

/**
 * FormField - Shared form field component for glass morphism form sheets
 *
 * Renders appropriate input controls for each column type.
 */

import { FormFieldProps, StatusOption, DEFAULT_STATUS_OPTIONS } from "./types";
import { cn } from "@/lib/utils";

export function FormField({ column, value, onChange, disabled = false }: FormFieldProps) {
  const baseInputClasses = cn(
    "w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm",
    "text-charcoal placeholder:text-charcoal/40 shadow-sm",
    "focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-white/50 transition-colors",
    "dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 dark:focus:bg-white/15",
    disabled && "opacity-50 cursor-not-allowed"
  );

  switch (column.type) {
    case "CHECKBOX":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 rounded border-bone text-gold focus:ring-gold disabled:opacity-50 disabled:cursor-not-allowed"
        />
      );

    case "SELECT":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="">Select…</option>
          {column.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "STATUS": {
      const statusOptions: StatusOption[] = column.statusOptions || DEFAULT_STATUS_OPTIONS;
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="">Select…</option>
          {statusOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
      );
    }

    case "MULTI_SELECT": {
      const selectedValues = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {column.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-charcoal dark:text-cultured-white">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, opt]);
                  } else {
                    onChange(selectedValues.filter((v: string) => v !== opt));
                  }
                }}
                disabled={disabled}
                className="w-4 h-4 rounded border-bone text-gold focus:ring-gold disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    case "NUMBER":
      return (
        <input
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) =>
            onChange(e.target.value ? parseFloat(e.target.value) : null)
          }
          disabled={disabled}
          className={cn(baseInputClasses, "tabular-nums")}
        />
      );

    case "DATE":
      return (
        <input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case "URL":
      return (
        <input
          type="url"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://…"
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case "PERSON":
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Enter name or ID..."
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    // ROLLUP and FORMULA are read-only
    case "ROLLUP":
    case "FORMULA":
      return (
        <div className={cn(baseInputClasses, "bg-gray-100 dark:bg-gray-800 cursor-not-allowed")}>
          {value != null && value !== "" ? String(value) : "-"}
        </div>
      );

    default: // TEXT
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClasses}
        />
      );
  }
}

export default FormField;
