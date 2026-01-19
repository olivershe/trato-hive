/**
 * FormField - Reusable field renderer for database-style forms
 *
 * Renders different field types (TEXT, SELECT, DATE, etc.) with consistent styling.
 * Used by both DatabaseViewBlock and DealSidePanel.
 */
"use client";

import { api } from "@/trpc/react";

// =============================================================================
// Field Types
// =============================================================================

export interface FieldColumn {
  id: string;
  name: string;
  type: string;
  options?: string[];
}

export interface FormFieldProps {
  column: FieldColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

// =============================================================================
// Main FormField Component
// =============================================================================

export function FormField({ column, value, onChange, disabled }: FormFieldProps) {
  switch (column.type) {
    case "CHECKBOX":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 rounded border-bone text-gold focus:ring-gold disabled:opacity-50"
        />
      );

    case "SELECT":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className="w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-white/50 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:focus:bg-white/15 disabled:opacity-50"
        >
          <option value="">Select...</option>
          {column.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "MULTI_SELECT":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {column.options?.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt)}
                disabled={disabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, opt]);
                  } else {
                    onChange(selectedValues.filter((v: string) => v !== opt));
                  }
                }}
                className="w-4 h-4 rounded border-bone text-gold focus:ring-gold disabled:opacity-50"
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case "NUMBER":
      return (
        <input
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          disabled={disabled}
          className="w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal placeholder:text-charcoal/40 shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-white/50 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 dark:focus:bg-white/15 tabular-nums disabled:opacity-50"
        />
      );

    case "DATE":
      return (
        <input
          type="date"
          value={value ? formatDateForInput(value) : ""}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
          disabled={disabled}
          className="w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal placeholder:text-charcoal/40 shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-white/50 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 dark:focus:bg-white/15 disabled:opacity-50"
        />
      );

    case "URL":
      return (
        <input
          type="url"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal placeholder:text-charcoal/40 shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-white/50 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 dark:focus:bg-white/15 disabled:opacity-50"
        />
      );

    case "PERSON":
      return <PersonField value={value} onChange={onChange} disabled={disabled} />;

    default: // TEXT
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal placeholder:text-charcoal/40 shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-white/50 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:placeholder:text-cultured-white/40 dark:focus:bg-white/15 disabled:opacity-50"
        />
      );
  }
}

// =============================================================================
// Person Field Component
// =============================================================================

interface PersonFieldProps {
  value: unknown;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

function PersonField({ value, onChange, disabled }: PersonFieldProps) {
  const { data: members, isLoading } = api.deal.getOrganizationMembers.useQuery();

  if (isLoading) {
    return (
      <div className="w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal/50 dark:text-cultured-white/50">
        Loading members...
      </div>
    );
  }

  return (
    <select
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm text-charcoal shadow-sm focus:border-gold focus:ring-2 focus:ring-gold/30 focus:bg-white/50 transition-colors dark:bg-white/10 dark:border-white/20 dark:text-cultured-white dark:focus:bg-white/15 disabled:opacity-50"
    >
      <option value="">Select person...</option>
      {members?.map((member: { id: string; name: string | null; email: string }) => (
        <option key={member.id} value={member.id}>
          {member.name || member.email}
        </option>
      ))}
    </select>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatDateForInput(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}
