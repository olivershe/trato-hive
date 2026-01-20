"use client";

/**
 * DealCellRenderer - Deal-specific wrapper for shared CellRenderer
 *
 * This component handles:
 * 1. Extracting values from Deal objects
 * 2. Special rendering for companies (via CompaniesCell)
 * 3. Formatting display values (currency, percentages)
 * 4. Delegating to shared CellRenderer for inline editing
 */

import { useCallback } from "react";
import { CellRenderer, CellColumn } from "@/components/shared/cells";
import { CompaniesCell } from "./CompaniesCell";
import {
  getDealCellValue,
  mapCellUpdateToDealUpdate,
  DealData,
} from "./utils/dealColumnMapping";
import type { Deal } from "./mock-data";

interface DealCellRendererProps {
  column: CellColumn;
  deal: Deal | DealData;
  onSave?: (dealId: string, updates: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function DealCellRenderer({
  column,
  deal,
  onSave,
  disabled = false,
}: DealCellRendererProps) {
  // Handle companies column specially - use CompaniesCell
  if (column.id === "companies") {
    return (
      <CompaniesCell
        companies={(deal as Deal).companies || []}
        variant="table"
      />
    );
  }

  // Get the raw value from the deal
  const rawValue = getDealCellValue(deal as DealData, column);

  // Handle save callback
  const handleSave = useCallback(
    (newValue: unknown) => {
      if (!onSave) return;

      // Map the cell value to deal update format
      const updates = mapCellUpdateToDealUpdate(column.id, newValue);
      onSave(deal.id, updates);
    },
    [column.id, deal.id, onSave]
  );

  // Special display formatting for certain columns
  // For value column, we need to show formatted currency but edit raw number
  if (column.id === "value" && column.type === "NUMBER") {
    return (
      <CellRenderer
        column={column}
        value={rawValue}
        onSave={onSave ? handleSave : undefined}
        disabled={disabled}
        className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400"
      />
    );
  }

  // For probability, show with percentage indicator
  if (column.id === "probability" && column.type === "NUMBER") {
    const probValue = rawValue as number | null;
    if (disabled) {
      // Read-only display with progress bar
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${probValue ?? 0}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-gray-500 dark:text-cultured-white/60">
            {probValue ?? 0}%
          </span>
        </div>
      );
    }

    return (
      <CellRenderer
        column={column}
        value={rawValue}
        onSave={onSave ? handleSave : undefined}
        disabled={disabled}
        className="font-mono tabular-nums"
      />
    );
  }

  // Default: use the shared CellRenderer
  return (
    <CellRenderer
      column={column}
      value={rawValue}
      onSave={onSave ? handleSave : undefined}
      disabled={disabled}
    />
  );
}

export default DealCellRenderer;
