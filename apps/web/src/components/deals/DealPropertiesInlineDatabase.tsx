/**
 * DealPropertiesInlineDatabase Component
 *
 * Renders deal properties as an inline database table (single row).
 * Uses the same table rendering as DatabaseViewBlock but filtered to one entry.
 *
 * Phase 12: Deal Properties as Inline Database Block
 */
"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Database, Maximize2 } from "lucide-react";
import { CellRenderer, EntryFormSheet } from "@/components/shared/cells";
import type { CellColumn } from "@/components/shared/cells";

interface DealPropertiesInlineDatabaseProps {
  dealId: string;
  className?: string;
}

export function DealPropertiesInlineDatabase({
  dealId,
  className = "",
}: DealPropertiesInlineDatabaseProps) {
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const utils = api.useUtils();

  // Get deal with its database entry
  const { data: deal, isLoading: dealLoading } = api.deal.get.useQuery({ id: dealId });

  // Get the entry data if deal has a databaseEntryId
  const { data: entry, isLoading: entryLoading } = api.dealsDatabase.getEntry.useQuery(
    { entryId: deal?.databaseEntryId ?? "" },
    { enabled: !!deal?.databaseEntryId }
  );

  // Get the database schema
  const { data: database, isLoading: dbLoading } = api.database.getById.useQuery(
    { id: entry?.databaseId ?? "" },
    { enabled: !!entry?.databaseId }
  );

  // Update mutation
  const updateEntry = api.dealsDatabase.updateEntry.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      utils.dealsDatabase.getEntry.invalidate({ entryId: deal?.databaseEntryId ?? "" });
      utils.deal.get.invalidate({ id: dealId });
      setEntryFormOpen(false);
    },
  });

  const isLoading = dealLoading || entryLoading || dbLoading;

  if (isLoading) {
    return (
      <div className={`px-24 mb-4 ${className}`}>
        <div className="flex items-center justify-center h-16 bg-alabaster/50 rounded-lg border border-gold/10">
          <Loader2 className="w-4 h-4 animate-spin text-orange" />
        </div>
      </div>
    );
  }

  if (!deal?.databaseEntryId || !entry || !database) {
    return null; // No database entry for this deal
  }

  const properties = entry.properties as Record<string, unknown>;
  const schema = database.schema as { columns: CellColumn[] };

  // Filter out 'name' column (shown in page title) and hidden system columns
  const visibleColumns = schema.columns.filter(
    (col) => col.id !== "name" && !col.id.startsWith("_")
  );

  return (
    <div className={`px-24 mb-4 ${className}`}>
      <div className="rounded-lg border border-gray-200 dark:border-charcoal/60 bg-white dark:bg-deep-grey overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-gray-200 dark:border-charcoal/60 bg-gray-50 dark:bg-surface-dark">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-gold" />
            <span className="font-medium text-xs text-charcoal dark:text-cultured-white">
              {database.name}
            </span>
          </div>
          <button
            onClick={() => setEntryFormOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-charcoal/60 dark:text-cultured-white/60 hover:text-charcoal dark:hover:text-cultured-white hover:bg-gray-100 dark:hover:bg-charcoal/40 rounded transition-colors"
            title="Open form"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Open</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs" role="grid">
            <thead>
              <tr className="border-b border-gray-100 dark:border-charcoal/40 bg-gray-50/50 dark:bg-surface-dark/50">
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className="px-2 py-1.5 text-left font-medium text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wider"
                    style={{ width: col.width || 150 }}
                  >
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-charcoal/40 hover:bg-gray-50 dark:hover:bg-surface-dark/40">
                {visibleColumns.map((col) => (
                  <td
                    key={col.id}
                    className="px-2 py-1.5"
                    style={{ width: col.width || 150 }}
                  >
                    <CellRenderer
                      column={col}
                      value={properties[col.id]}
                      entryId={entry.id}
                      databaseId={database.id}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Form Sheet (glassmorphism) */}
      <EntryFormSheet
        columns={visibleColumns}
        entry={properties}
        open={entryFormOpen}
        onOpenChange={setEntryFormOpen}
        onSubmit={(data) => {
          if (!entry?.id) return;
          updateEntry.mutate({
            entryId: entry.id,
            properties: data,
          });
        }}
        isLoading={updateEntry.isPending}
        title={`Edit ${deal?.name || "Deal"} Properties`}
      />
    </div>
  );
}
