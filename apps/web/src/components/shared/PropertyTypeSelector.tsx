"use client";

/**
 * PropertyTypeSelector - Shared inline dropdown for selecting property types
 *
 * Used by both DatabaseViewBlock and Deals TableView for adding new columns.
 * Renders as a portal-based dropdown with 2-column grid of type options.
 */

import { createPortal } from "react-dom";
import {
  Type,
  Hash,
  Circle,
  ListChecks,
  Calendar,
  User,
  CheckSquare,
  Link,
  ArrowUpRight,
  Search,
  Sigma,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export type PropertyType =
  | "TEXT"
  | "NUMBER"
  | "SELECT"
  | "MULTI_SELECT"
  | "STATUS"
  | "DATE"
  | "PERSON"
  | "CHECKBOX"
  | "URL"
  | "RELATION"
  | "ROLLUP"
  | "FORMULA";

interface PropertyTypeOption {
  type: PropertyType;
  label: string;
  icon: LucideIcon;
}

export interface PropertyTypeSelectorProps {
  /** Position for the dropdown (top/left in pixels) */
  position: { top: number; left: number };
  /** Callback when a type is selected */
  onSelect: (type: PropertyType) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

// =============================================================================
// Property Type Options
// =============================================================================

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  { type: "TEXT", label: "Text", icon: Type },
  { type: "NUMBER", label: "Number", icon: Hash },
  { type: "SELECT", label: "Select", icon: Circle },
  { type: "MULTI_SELECT", label: "Multi-select", icon: ListChecks },
  { type: "STATUS", label: "Status", icon: Circle },
  { type: "DATE", label: "Date", icon: Calendar },
  { type: "PERSON", label: "Person", icon: User },
  { type: "CHECKBOX", label: "Checkbox", icon: CheckSquare },
  { type: "URL", label: "URL", icon: Link },
  { type: "RELATION", label: "Relation", icon: ArrowUpRight },
  { type: "ROLLUP", label: "Rollup", icon: Search },
  { type: "FORMULA", label: "Formula", icon: Sigma },
];

// =============================================================================
// Component
// =============================================================================

export function PropertyTypeSelector({
  position,
  onSelect,
  onCancel,
}: PropertyTypeSelectorProps) {
  return createPortal(
    <div
      className="fixed z-[9999] w-72 bg-alabaster dark:bg-deep-grey rounded-lg border border-bone dark:border-charcoal/60 shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-bone/50 dark:border-charcoal/50 flex items-center gap-2">
        <span className="text-[11px] font-medium text-charcoal/60 dark:text-cultured-white/60">
          Select type
        </span>
        <Search className="w-3 h-3 text-charcoal/40 dark:text-cultured-white/40" />
      </div>

      {/* Type grid - 2 columns */}
      <div className="p-1.5 grid grid-cols-2 gap-0.5">
        {PROPERTY_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors hover:bg-bone/50 dark:hover:bg-surface-dark text-charcoal dark:text-cultured-white"
          >
            <Icon className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[11px]">{label}</span>
          </button>
        ))}
      </div>

      {/* Footer with cancel button */}
      <div className="px-3 py-2 border-t border-bone/50 dark:border-charcoal/50 flex justify-end">
        <button
          onClick={onCancel}
          className="px-2 py-1 text-[10px] text-charcoal/60 dark:text-cultured-white/60 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

export default PropertyTypeSelector;
