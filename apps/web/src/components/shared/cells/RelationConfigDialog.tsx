/**
 * RelationConfigDialog - Configuration UI for RELATION column type
 *
 * Allows users to select a target database and relation type (one/many)
 * when creating a RELATION column.
 */
"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, Database, Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface RelationConfig {
  targetDatabaseId: string;
  relationType: "one" | "many";
}

interface RelationConfigDialogProps {
  onConfigChange: (config: RelationConfig | null) => void;
  excludeDatabaseId?: string;
  dealId?: string;
  initialConfig?: RelationConfig | null;
  className?: string;
}

interface DatabaseItem {
  id: string;
  name: string;
  entryCount: number;
}

// =============================================================================
// Component
// =============================================================================

export function RelationConfigDialog({
  onConfigChange,
  excludeDatabaseId,
  dealId,
  initialConfig,
  className,
}: RelationConfigDialogProps) {
  const [targetDatabaseId, setTargetDatabaseId] = useState<string>(
    initialConfig?.targetDatabaseId ?? ""
  );
  const [relationType, setRelationType] = useState<"one" | "many">(
    initialConfig?.relationType ?? "many"
  );

  // Fetch available databases (scoped to deal tree if dealId provided)
  const { data: databasesData, isLoading } =
    api.database.listDatabasesForRelation.useQuery(
      { excludeDatabaseId, dealId },
      { staleTime: 30000 }
    );

  const databases: DatabaseItem[] | undefined = databasesData;

  // Update config when values change
  useEffect(() => {
    if (targetDatabaseId) {
      onConfigChange({
        targetDatabaseId,
        relationType,
      });
    } else {
      onConfigChange(null);
    }
  }, [targetDatabaseId, relationType, onConfigChange]);

  // Selected database info
  const selectedDatabase = databases?.find((db) => db.id === targetDatabaseId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Target Database Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-charcoal/70 dark:text-cultured-white/70">
          Link to Database
        </label>

        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-charcoal/50 dark:text-cultured-white/50">
            <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            Loading databases...
          </div>
        ) : databases && databases.length > 0 ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-gold/20 bg-alabaster dark:bg-charcoal p-1">
            {databases.map((db) => (
              <button
                key={db.id}
                type="button"
                onClick={() => setTargetDatabaseId(db.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                  targetDatabaseId === db.id
                    ? "bg-gold/10 text-charcoal dark:text-cultured-white"
                    : "text-charcoal/70 dark:text-cultured-white/70 hover:bg-charcoal/5 dark:hover:bg-cultured-white/5"
                )}
              >
                <Database className="w-4 h-4 text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{db.name}</div>
                  <div className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                    {db.entryCount} {db.entryCount === 1 ? "entry" : "entries"}
                  </div>
                </div>
                {targetDatabaseId === db.id && (
                  <Check className="w-4 h-4 text-gold shrink-0" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 py-4 text-sm text-charcoal/50 dark:text-cultured-white/50 text-center rounded-lg border border-gold/20 bg-alabaster dark:bg-charcoal">
            <Database className="w-8 h-8 mx-auto mb-2 text-charcoal/20 dark:text-cultured-white/20" />
            No other databases found.
            <br />
            Create another database first.
          </div>
        )}
      </div>

      {/* Relation Type Selection */}
      {targetDatabaseId && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-charcoal/70 dark:text-cultured-white/70">
            Relation Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* One (Single) */}
            <button
              type="button"
              onClick={() => setRelationType("one")}
              className={cn(
                "flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all",
                relationType === "one"
                  ? "border-gold bg-gold/10 text-charcoal dark:text-cultured-white"
                  : "border-gold/20 bg-alabaster dark:bg-charcoal text-charcoal/70 dark:text-cultured-white/70 hover:border-gold/40"
              )}
            >
              <div className="flex items-center gap-1">
                <Link2 className="w-4 h-4" />
                <ArrowUpRight className="w-3 h-3" />
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Single</div>
                <div className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                  Link to one entry
                </div>
              </div>
            </button>

            {/* Many (Multiple) */}
            <button
              type="button"
              onClick={() => setRelationType("many")}
              className={cn(
                "flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all",
                relationType === "many"
                  ? "border-gold bg-gold/10 text-charcoal dark:text-cultured-white"
                  : "border-gold/20 bg-alabaster dark:bg-charcoal text-charcoal/70 dark:text-cultured-white/70 hover:border-gold/40"
              )}
            >
              <div className="flex items-center gap-1">
                <Link2 className="w-4 h-4" />
                <div className="flex -space-x-1">
                  <ArrowUpRight className="w-3 h-3" />
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Multiple</div>
                <div className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                  Link to many entries
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {selectedDatabase && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-sm text-emerald-800 dark:text-emerald-200">
              <strong>Linking to:</strong> {selectedDatabase.name}
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">
                {relationType === "one"
                  ? "Each row can link to one entry"
                  : "Each row can link to multiple entries"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RelationConfigDialog;
