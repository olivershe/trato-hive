/**
 * RelationCellEditor - Notion-style relation cell editor
 *
 * Displays linked entries as pills and allows adding/removing relations
 * via a search modal. Supports both "one" and "many" relation types.
 */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X, Plus, Search, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import type { CellColumn } from "./types";

// =============================================================================
// Types
// =============================================================================

interface RelationCellEditorProps {
  column: CellColumn;
  entryId: string;
  databaseId: string;
  disabled?: boolean;
  className?: string;
}

interface SearchResultEntry {
  id: string;
  title: string;
}

// =============================================================================
// Component
// =============================================================================

export function RelationCellEditor({
  column,
  entryId,
  databaseId,
  disabled = false,
  className,
}: RelationCellEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();

  // Get relation config
  const relationConfig = column.relationConfig;
  const targetDatabaseId = relationConfig?.targetDatabaseId ?? "";
  const relationType = relationConfig?.relationType ?? "many";

  // Fetch current linked entries
  const { data: linkedEntriesData, isLoading: isLoadingLinked } =
    api.database.getRelatedEntries.useQuery(
      { entryId, columnId: column.id },
      { enabled: !!entryId && !!relationConfig }
    );

  const linkedEntries: SearchResultEntry[] = linkedEntriesData ?? [];

  // Search entries in target database
  const { data: searchResultsData, isLoading: isSearching } =
    api.database.searchEntries.useQuery(
      { databaseId: targetDatabaseId, query: debouncedQuery, limit: 10 },
      { enabled: isModalOpen && !!targetDatabaseId }
    );

  const searchResults: SearchResultEntry[] = searchResultsData ?? [];

  // Link mutation
  const linkMutation = api.database.linkEntries.useMutation({
    onSuccess: () => {
      void utils.database.getRelatedEntries.invalidate({ entryId, columnId: column.id });
      // Close modal for "one" type after linking
      if (relationType === "one") {
        setIsModalOpen(false);
      }
      setSearchQuery("");
    },
  });

  // Unlink mutation
  const unlinkMutation = api.database.unlinkEntries.useMutation({
    onSuccess: () => {
      void utils.database.getRelatedEntries.invalidate({ entryId, columnId: column.id });
    },
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus input when modal opens
  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModalOpen]);

  // Close modal on click outside
  useEffect(() => {
    if (!isModalOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isModalOpen]);

  // Close modal on escape
  useEffect(() => {
    if (!isModalOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  const handleLink = useCallback(
    (targetEntryId: string): void => {
      if (!relationConfig) return;

      linkMutation.mutate({
        sourceEntryId: entryId,
        targetEntryId,
        columnId: column.id,
        sourceDatabaseId: databaseId,
        targetDatabaseId: relationConfig.targetDatabaseId,
      });
    },
    [entryId, column.id, databaseId, relationConfig, linkMutation]
  );

  const handleUnlink = useCallback(
    (targetEntryId: string): void => {
      unlinkMutation.mutate({
        sourceEntryId: entryId,
        targetEntryId,
        columnId: column.id,
      });
    },
    [entryId, column.id, unlinkMutation]
  );

  // Filter out already linked entries from search results
  const linkedIds = new Set(linkedEntries.map((e) => e.id));
  const filteredResults = searchResults.filter((r) => !linkedIds.has(r.id));

  // Check if we can add more links (for "one" type, only one link allowed)
  const canAddMore = relationType === "many" || linkedEntries.length === 0;

  // No config - show error state
  if (!relationConfig) {
    return (
      <div
        className={cn(
          "min-h-[22px] px-1 py-0.5 text-[11px] text-red-500 italic flex items-center",
          className
        )}
      >
        Configure relation
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-[22px]", className)}>
      {/* Display linked entries as pills */}
      <div className="flex flex-wrap gap-1 items-center px-0.5 py-0.5">
        {isLoadingLinked ? (
          <Loader2 className="w-3 h-3 text-charcoal/30 animate-spin" />
        ) : linkedEntries.length > 0 ? (
          <>
            {linkedEntries.map((entry) => (
              <span
                key={entry.id}
                className="group inline-flex items-center gap-0.5 max-w-[120px] px-1.5 py-0.5 text-[10px] bg-gray-100 dark:bg-charcoal/50 text-charcoal dark:text-cultured-white rounded-md border border-gray-200 dark:border-charcoal/70 hover:border-gray-300 dark:hover:border-charcoal transition-colors"
              >
                <span className="truncate">{entry.title}</span>
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnlink(entry.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-0.5 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-all"
                    title="Remove link"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            ))}
          </>
        ) : null}

        {/* Add button */}
        {!disabled && canAddMore && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-charcoal/40 dark:text-cultured-white/40 hover:text-charcoal dark:hover:text-cultured-white hover:bg-gray-100 dark:hover:bg-charcoal/50 rounded-md transition-colors"
            title="Link entry"
          >
            <Plus className="w-3 h-3" />
            <span className="sr-only sm:not-sr-only">
              {linkedEntries.length === 0 ? "Link" : ""}
            </span>
          </button>
        )}

        {/* Empty state */}
        {!disabled && linkedEntries.length === 0 && !isLoadingLinked && (
          <span
            className="text-[11px] text-charcoal/20 dark:text-cultured-white/20 cursor-pointer hover:text-charcoal/40 dark:hover:text-cultured-white/40"
            onClick={() => setIsModalOpen(true)}
          >
            Link a record
          </span>
        )}
      </div>

      {/* Search Modal */}
      {isModalOpen && (
        <div
          ref={modalRef}
          className="absolute z-50 top-full left-0 mt-1 w-64 bg-white dark:bg-deep-grey rounded-lg shadow-lg border border-gray-200 dark:border-charcoal overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-charcoal">
            <Search className="w-4 h-4 text-charcoal/40 dark:text-cultured-white/40 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="flex-1 text-sm bg-transparent text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 outline-none"
            />
            {isSearching && (
              <Loader2 className="w-3 h-3 text-charcoal/40 animate-spin" />
            )}
          </div>

          {/* Results */}
          <div className="max-h-48 overflow-y-auto">
            {filteredResults.length > 0 ? (
              filteredResults.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleLink(entry.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-charcoal dark:text-cultured-white hover:bg-gray-50 dark:hover:bg-charcoal/50 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-charcoal/40 dark:text-cultured-white/40 shrink-0" />
                  <span className="truncate">{entry.title}</span>
                </button>
              ))
            ) : debouncedQuery && !isSearching ? (
              <div className="px-3 py-4 text-sm text-charcoal/40 dark:text-cultured-white/40 text-center">
                No entries found
              </div>
            ) : !isSearching ? (
              <div className="px-3 py-4 text-sm text-charcoal/40 dark:text-cultured-white/40 text-center">
                Type to search entries
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-100 dark:border-charcoal text-[10px] text-charcoal/40 dark:text-cultured-white/40">
            {relationType === "one"
              ? "Select one entry"
              : "Select multiple entries"}
          </div>
        </div>
      )}
    </div>
  );
}

export default RelationCellEditor;
