/**
 * DatabaseViewBlock - Tiptap extension for inline databases
 *
 * Embeds a real Database entity in any page with Table, Kanban, and Gallery views.
 * Supports filters, sorting, and grouping persisted in block properties.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback, useRef } from "react";
import { Database, Table2, LayoutGrid, Plus, Link2, Loader2, Trash2, Copy, Edit, Settings, X, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/trpc/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@trato-hive/ui";

// =============================================================================
// Local Type Definitions (to avoid shared package export issues)
// =============================================================================

type DatabaseViewTypeValue = 'table' | 'kanban' | 'gallery';

type DatabaseFilterOperatorValue =
  | 'equals' | 'notEquals' | 'contains' | 'notContains'
  | 'isEmpty' | 'isNotEmpty' | 'gt' | 'lt' | 'gte' | 'lte';

interface DatabaseFilter {
  id: string;
  columnId: string;
  operator: DatabaseFilterOperatorValue;
  value?: unknown;
}

interface DatabaseSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

interface DatabaseViewBlockAttributes {
  databaseId: string | null;
  viewType: DatabaseViewTypeValue;
  filters: DatabaseFilter[];
  sortBy: DatabaseSort | null;
  groupBy: string | null;
  hiddenColumns: string[];
}

interface DatabaseColumn {
  id: string;
  name: string;
  type: string;
  options?: string[];
  width?: number;
}

interface DatabaseSchema {
  columns: DatabaseColumn[];
}

interface DatabaseEntry {
  id: string;
  databaseId: string;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseWithEntries {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  schema: DatabaseSchema;
  entries: DatabaseEntry[];
}

// =============================================================================
// Tiptap Type Augmentation
// =============================================================================

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    databaseViewBlock: {
      setDatabaseViewBlock: (attrs?: Partial<DatabaseViewBlockAttributes>) => ReturnType;
      updateDatabaseViewBlock: (attrs: Partial<DatabaseViewBlockAttributes>) => ReturnType;
    };
  }
}

// =============================================================================
// Default Attributes
// =============================================================================

const DEFAULT_ATTRIBUTES: DatabaseViewBlockAttributes = {
  databaseId: null,
  viewType: "table",
  filters: [],
  sortBy: null,
  groupBy: null,
  hiddenColumns: [],
};

// =============================================================================
// Tiptap Extension
// =============================================================================

export const DatabaseViewBlock = Node.create({
  name: "databaseViewBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      databaseId: { default: DEFAULT_ATTRIBUTES.databaseId },
      viewType: { default: DEFAULT_ATTRIBUTES.viewType },
      filters: { default: DEFAULT_ATTRIBUTES.filters },
      sortBy: { default: DEFAULT_ATTRIBUTES.sortBy },
      groupBy: { default: DEFAULT_ATTRIBUTES.groupBy },
      hiddenColumns: { default: DEFAULT_ATTRIBUTES.hiddenColumns },
    };
  },

  parseHTML() {
    return [{ tag: "database-view-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["database-view-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseViewCard);
  },

  addCommands() {
    return {
      setDatabaseViewBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "databaseViewBlock",
            attrs: { ...DEFAULT_ATTRIBUTES, ...attrs },
          });
        },
      updateDatabaseViewBlock:
        (attrs) =>
        ({ commands, state }) => {
          const { selection } = state;
          const node = selection.$anchor.parent;
          if (node.type.name !== "databaseViewBlock") return false;
          return commands.updateAttributes("databaseViewBlock", attrs);
        },
    };
  },
});

// =============================================================================
// React Component
// =============================================================================

function DatabaseViewCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as DatabaseViewBlockAttributes;
  const { databaseId, viewType, filters, sortBy, groupBy, hiddenColumns } = attrs;

  // State for database picker mode
  const [pickerMode, setPickerMode] = useState<"select" | "create" | "link">("select");

  // Update block attributes helper
  const updateBlockAttrs = useCallback(
    (updates: Partial<DatabaseViewBlockAttributes>) => {
      updateAttributes(updates);
    },
    [updateAttributes]
  );

  // Render based on state
  if (!databaseId) {
    return (
      <NodeViewWrapper className="my-4">
        <DatabasePicker
          mode={pickerMode}
          onModeChange={setPickerMode}
          onSelect={(id) => updateBlockAttrs({ databaseId: id })}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-4 !w-full max-w-full">
      <DatabaseView
        databaseId={databaseId}
        viewType={viewType}
        filters={filters}
        sortBy={sortBy}
        groupBy={groupBy}
        hiddenColumns={hiddenColumns}
        onViewTypeChange={(vt) => updateBlockAttrs({ viewType: vt })}
        onFiltersChange={(f) => updateBlockAttrs({ filters: f })}
        onSortChange={(s) => updateBlockAttrs({ sortBy: s })}
        onGroupByChange={(g) => updateBlockAttrs({ groupBy: g })}
        onHiddenColumnsChange={(h) => updateBlockAttrs({ hiddenColumns: h })}
        onUnlink={() => updateBlockAttrs({ databaseId: null })}
      />
    </NodeViewWrapper>
  );
}

// =============================================================================
// Database Picker Component
// =============================================================================

interface DatabasePickerProps {
  mode: "select" | "create" | "link";
  onModeChange: (mode: "select" | "create" | "link") => void;
  onSelect: (databaseId: string) => void;
}

function DatabasePicker({ mode, onModeChange, onSelect }: DatabasePickerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [newDbName, setNewDbName] = useState("");

  // Fetch existing databases for linking
  const { data: databases, isLoading: isLoadingDatabases } = api.database.list.useQuery(
    { pageSize: 20 },
    { enabled: mode === "link" }
  );

  // Create database mutation
  const createMutation = api.database.create.useMutation({
    onSuccess: (data) => {
      onSelect(data.id);
    },
  });

  // Templates from shared package (imported statically for now)
  const templates = [
    { id: "dd-tracker", name: "Due Diligence Tracker", description: "Track due diligence tasks" },
    { id: "contact-list", name: "Contact List", description: "Manage deal contacts" },
    { id: "document-log", name: "Document Log", description: "Track document requests" },
    { id: "risk-register", name: "Risk Register", description: "Assess deal risks" },
    { id: "blank", name: "Blank Database", description: "Start from scratch" },
  ];

  const handleCreate = () => {
    if (!newDbName.trim()) return;

    // Get template schema or empty schema
    const schema =
      selectedTemplate === "blank" || !selectedTemplate
        ? { columns: [{ id: "col_title", name: "Title", type: "TEXT" as const }] }
        : getTemplateSchema(selectedTemplate);

    createMutation.mutate({
      name: newDbName,
      schema,
    });
  };

  // Initial selection view
  if (mode === "select") {
    return (
      <div className="rounded-lg border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark p-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <Database className="w-4 h-4 text-gold" />
          <span className="font-medium text-sm text-charcoal dark:text-cultured-white">Add a Database</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onModeChange("create")}
            className="flex items-center gap-2 p-2.5 rounded-md border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-deep-grey hover:border-gold/60 hover:bg-bone/50 dark:hover:bg-surface-dark hover:shadow-md transition-all duration-150 text-left group"
          >
            <Plus className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-medium text-xs text-charcoal dark:text-cultured-white">Create New</div>
              <div className="text-[11px] text-charcoal/50 dark:text-cultured-white/50">Start with a template</div>
            </div>
          </button>

          <button
            onClick={() => onModeChange("link")}
            className="flex items-center gap-2 p-2.5 rounded-md border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-deep-grey hover:border-gold/60 hover:bg-bone/50 dark:hover:bg-surface-dark hover:shadow-md transition-all duration-150 text-left group"
          >
            <Link2 className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            <div>
              <div className="font-medium text-xs text-charcoal dark:text-cultured-white">Link Existing</div>
              <div className="text-[11px] text-charcoal/50 dark:text-cultured-white/50">Use an existing database</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Create new database view
  if (mode === "create") {
    return (
      <div className="rounded-lg border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-gold" />
            <span className="font-medium text-sm text-charcoal dark:text-cultured-white">Create New Database</span>
          </div>
          <button
            onClick={() => onModeChange("select")}
            className="text-[11px] text-charcoal/50 dark:text-cultured-white/50 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
          >
            Back
          </button>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-medium text-charcoal/70 dark:text-cultured-white/70 mb-1">
              Database Name
            </label>
            <input
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="e.g., Due Diligence Checklist"
              className="w-full px-2 py-1 text-xs rounded-md border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-deep-grey text-charcoal dark:text-cultured-white placeholder:text-charcoal/30 dark:placeholder:text-cultured-white/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-charcoal/70 dark:text-cultured-white/70 mb-1">
              Choose a Template
            </label>
            <div className="grid grid-cols-2 gap-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-1.5 rounded-md border text-left transition-all duration-150 ${
                    selectedTemplate === template.id
                      ? "border-gold bg-gold/10 dark:bg-gold/20 shadow-sm"
                      : "border-bone dark:border-charcoal/60 bg-alabaster dark:bg-deep-grey hover:border-gold/40 hover:shadow-sm"
                  }`}
                >
                  <div className="font-medium text-[11px] text-charcoal dark:text-cultured-white">{template.name}</div>
                  <div className="text-[10px] text-charcoal/50 dark:text-cultured-white/50 truncate">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!newDbName.trim() || createMutation.isPending}
            className="w-full px-2.5 py-1.5 text-xs rounded-md bg-gold text-white font-medium hover:bg-gold/90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all duration-150"
          >
            {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
            Create Database
          </button>
        </div>
      </div>
    );
  }

  // Link existing database view
  return (
    <div className="rounded-lg border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gold" />
          <span className="font-medium text-sm text-charcoal dark:text-cultured-white">Link Existing Database</span>
        </div>
        <button
          onClick={() => onModeChange("select")}
          className="text-[11px] text-charcoal/50 dark:text-cultured-white/50 hover:text-charcoal dark:hover:text-cultured-white transition-colors"
        >
          Back
        </button>
      </div>

      {isLoadingDatabases ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-gold" />
        </div>
      ) : databases?.items.length === 0 ? (
        <div className="text-center py-4 text-charcoal/50 dark:text-cultured-white/50">
          <Database className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
          <p className="text-xs">No databases found</p>
          <button
            onClick={() => onModeChange("create")}
            className="mt-1.5 text-xs text-gold hover:underline"
          >
            Create your first database
          </button>
        </div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {databases?.items.map((db) => (
            <button
              key={db.id}
              onClick={() => onSelect(db.id)}
              className="w-full p-1.5 rounded-md border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-deep-grey hover:border-gold/60 hover:bg-bone/50 dark:hover:bg-surface-dark hover:shadow-md transition-all duration-150 text-left group"
            >
              <div className="font-medium text-xs text-charcoal dark:text-cultured-white group-hover:text-gold transition-colors">{db.name}</div>
              {db.description && (
                <div className="text-[10px] text-charcoal/50 dark:text-cultured-white/50 truncate">{db.description}</div>
              )}
              <div className="text-[10px] text-charcoal/30 dark:text-cultured-white/30 mt-0.5">
                {db._count?.entries ?? 0} entries
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Database View Component
// =============================================================================

interface DatabaseViewProps {
  databaseId: string;
  viewType: DatabaseViewTypeValue;
  filters: DatabaseFilter[];
  sortBy: DatabaseSort | null;
  groupBy: string | null;
  hiddenColumns: string[];
  onViewTypeChange: (viewType: DatabaseViewTypeValue) => void;
  onFiltersChange: (filters: DatabaseFilter[]) => void;
  onSortChange: (sort: DatabaseSort | null) => void;
  onGroupByChange: (groupBy: string | null) => void;
  onHiddenColumnsChange: (hiddenColumns: string[]) => void;
  onUnlink: () => void;
}

function DatabaseView({
  databaseId,
  viewType,
  filters: _filters, // Reserved for future filter UI
  sortBy,
  groupBy,
  hiddenColumns,
  onViewTypeChange,
  onFiltersChange: _onFiltersChange, // Reserved for future filter UI
  onSortChange,
  onGroupByChange,
  onHiddenColumnsChange: _onHiddenColumnsChange, // Reserved for future column visibility UI
  onUnlink,
}: DatabaseViewProps) {
  // Suppress unused variable warnings - these are reserved for future features
  void _filters;
  void _onFiltersChange;
  void _onHiddenColumnsChange;

  // Bulk import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Fetch database with entries
  const { data: database, isLoading, error } = api.database.getById.useQuery(
    { id: databaseId },
    { enabled: !!databaseId }
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark p-4 shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-gold" />
          <span className="text-[11px] text-charcoal/50 dark:text-cultured-white/50">Loading database...</span>
        </div>
      </div>
    );
  }

  if (error || !database) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-900/10 p-3 shadow-sm">
        <div className="text-red-600 dark:text-red-400 font-medium text-xs">Failed to load database</div>
        <div className="text-red-500/80 dark:text-red-400/60 text-[11px] mt-0.5">{error?.message || "Database not found"}</div>
        <button
          onClick={onUnlink}
          className="mt-1.5 text-[11px] text-red-600 dark:text-red-400 hover:underline transition-colors"
        >
          Unlink and try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-deep-grey overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header with gold accent and subtle hexagon pattern */}
      <div className="relative flex items-center justify-between px-2.5 py-1.5 border-b border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark border-t-2 border-t-gold overflow-hidden">
        {/* Subtle hexagon background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '14px 24px'
          }}
        />
        <div className="relative flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-gold" />
          <span className="font-medium text-xs text-charcoal dark:text-cultured-white">{database.name}</span>
        </div>

        <div className="relative flex items-center gap-1">
          {/* Import button */}
          <button
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-charcoal/50 dark:text-cultured-white/50 hover:text-charcoal dark:hover:text-cultured-white hover:bg-bone/60 dark:hover:bg-surface-dark rounded transition-all duration-150"
            title="Import from CSV"
          >
            <Plus className="w-3 h-3" />
            Import
          </button>

          <div className="w-px h-3 bg-bone dark:bg-charcoal/60" />

          {/* View switcher */}
          <button
            onClick={() => onViewTypeChange("table")}
            className={`p-1 rounded transition-all duration-150 ${
              viewType === "table" ? "bg-gold/20 text-gold shadow-sm" : "text-charcoal/40 dark:text-cultured-white/40 hover:bg-bone/60 dark:hover:bg-surface-dark hover:text-charcoal dark:hover:text-cultured-white"
            }`}
            title="Table view"
          >
            <Table2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onViewTypeChange("kanban")}
            className={`p-1 rounded transition-all duration-150 ${
              viewType === "kanban" ? "bg-gold/20 text-gold shadow-sm" : "text-charcoal/40 dark:text-cultured-white/40 hover:bg-bone/60 dark:hover:bg-surface-dark hover:text-charcoal dark:hover:text-cultured-white"
            }`}
            title="Kanban view"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="12" rx="1" />
              <rect x="17" y="3" width="5" height="15" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => onViewTypeChange("gallery")}
            className={`p-1 rounded transition-all duration-150 ${
              viewType === "gallery" ? "bg-gold/20 text-gold shadow-sm" : "text-charcoal/40 dark:text-cultured-white/40 hover:bg-bone/60 dark:hover:bg-surface-dark hover:text-charcoal dark:hover:text-cultured-white"
            }`}
            title="Gallery view"
          >
            <LayoutGrid className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* View content */}
      <div className="min-h-[200px]">
        {viewType === "table" && (
          <DatabaseTableView
            database={database}
            sortBy={sortBy}
            hiddenColumns={hiddenColumns}
            onSortChange={onSortChange}
          />
        )}
        {viewType === "kanban" && (
          <DatabaseKanbanView
            database={database}
            groupBy={groupBy}
            onGroupByChange={onGroupByChange}
          />
        )}
        {viewType === "gallery" && (
          <DatabaseGalleryView database={database} />
        )}
      </div>

      {/* Bulk import dialog */}
      <BulkImportDialog
        database={database}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}

// =============================================================================
// Table View Component
// =============================================================================

interface DatabaseTableViewProps {
  database: DatabaseWithEntries;
  sortBy: DatabaseSort | null;
  hiddenColumns: string[];
  onSortChange: (sort: DatabaseSort | null) => void;
}

function DatabaseTableView({ database, sortBy, hiddenColumns, onSortChange }: DatabaseTableViewProps) {
  const columns = database.schema.columns.filter((col) => !hiddenColumns.includes(col.id));
  const entries = database.entries || [];

  // Entry form state
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DatabaseEntry | null>(null);

  // Column config state
  const [configColumn, setConfigColumn] = useState<DatabaseColumn | null>(null);
  const [configPosition, setConfigPosition] = useState<{ x: number; y: number } | null>(null);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    columns.forEach((col) => {
      widths[col.id] = col.width || 150;
    });
    return widths;
  });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const handleOpenNewForm = () => {
    setEditingEntry(null);
    setEntryFormOpen(true);
  };

  const handleEditEntry = (entry: DatabaseEntry) => {
    setEditingEntry(entry);
    setEntryFormOpen(true);
  };

  const handleColumnHeaderClick = (e: React.MouseEvent, col: DatabaseColumn) => {
    // Right-click or ctrl+click opens config
    if (e.ctrlKey || e.metaKey || e.button === 2) {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setConfigColumn(col);
      setConfigPosition({ x: rect.left, y: rect.bottom + 4 });
    } else {
      // Normal click toggles sort
      if (sortBy?.columnId === col.id) {
        onSortChange(
          sortBy.direction === "asc"
            ? { columnId: col.id, direction: "desc" }
            : null
        );
      } else {
        onSortChange({ columnId: col.id, direction: "asc" });
      }
    }
  };

  // Column resize handlers
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnId);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[columnId] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - resizeStartX.current;
      const newWidth = Math.max(60, resizeStartWidth.current + delta);
      setColumnWidths((prev) => ({ ...prev, [columnId]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Row animation variants
  const rowVariants = {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" role="grid">
        <thead>
          <tr className="border-b border-bone dark:border-charcoal/60 bg-bone/30 dark:bg-surface-dark/30">
            {/* Row actions column */}
            <th className="w-7 px-0.5" role="columnheader" />
            {columns.map((col, index) => (
              <th
                key={col.id}
                role="columnheader"
                aria-sort={sortBy?.columnId === col.id ? (sortBy.direction === "asc" ? "ascending" : "descending") : undefined}
                className="relative px-1.5 py-1 text-left text-[11px] font-medium text-charcoal/60 dark:text-cultured-white/60 cursor-pointer hover:bg-bone/40 dark:hover:bg-surface-dark/50 select-none group"
                style={{ width: columnWidths[col.id] || 150, minWidth: 60 }}
                onClick={(e) => handleColumnHeaderClick(e, col)}
                onContextMenu={(e) => handleColumnHeaderClick(e, col)}
              >
                <div className="flex items-center gap-0.5">
                  <span className="flex-1 truncate uppercase tracking-wide">{col.name}</span>
                  {sortBy?.columnId === col.id && (
                    <span className="text-gold text-[10px] font-bold">
                      {sortBy.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setConfigColumn(col);
                      setConfigPosition({ x: rect.left, y: rect.bottom + 4 });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-bone dark:hover:bg-surface-dark rounded transition-opacity"
                    aria-label={`Configure ${col.name} column`}
                  >
                    <Settings className="w-2.5 h-2.5 text-charcoal/40 dark:text-cultured-white/40" />
                  </button>
                </div>
                {/* Column resize handle */}
                {index < columns.length && (
                  <div
                    className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-gold/40 transition-colors ${
                      resizingColumn === col.id ? 'bg-gold/60' : ''
                    }`}
                    onMouseDown={(e) => handleResizeStart(e, col.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {entries.length === 0 ? (
              <motion.tr
                key="empty"
                role="row"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <td colSpan={columns.length + 1} className="px-2 py-4 text-center text-xs text-charcoal/40 dark:text-cultured-white/40">
                  No entries yet
                </td>
              </motion.tr>
            ) : (
              entries.map((entry) => (
                <motion.tr
                  key={entry.id}
                  role="row"
                  layout
                  variants={rowVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="border-b border-bone/40 dark:border-charcoal/40 hover:bg-bone/20 dark:hover:bg-surface-dark/40 group relative transition-colors duration-100"
                >
                  {/* Row actions */}
                  <td className="px-0.5 relative" role="gridcell">
                    <RowActionsMenu
                      entry={entry}
                      database={database}
                      onEdit={() => handleEditEntry(entry)}
                    />
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className="px-1.5 py-0.5"
                      role="gridcell"
                      style={{ width: columnWidths[col.id] || 150 }}
                    >
                      <CellRenderer
                        column={col}
                        value={entry.properties[col.id]}
                        entryId={entry.id}
                        databaseId={database.id}
                      />
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </tbody>
      </table>

      {/* Add row button */}
      <motion.button
        onClick={handleOpenNewForm}
        whileHover={{ backgroundColor: 'rgba(226, 217, 203, 0.3)' }}
        whileTap={{ scale: 0.99 }}
        className="w-full px-2 py-1 text-left text-[11px] text-charcoal/40 dark:text-cultured-white/40 hover:text-charcoal dark:hover:text-cultured-white flex items-center gap-1 transition-colors"
        aria-label="Add new entry"
      >
        <Plus className="w-3 h-3" />
        New
      </motion.button>

      {/* Entry form sheet */}
      <EntryFormSheet
        database={database}
        entry={editingEntry}
        open={entryFormOpen}
        onOpenChange={setEntryFormOpen}
      />

      {/* Column config popover */}
      {configColumn && configPosition && (
        <div
          className="fixed z-50"
          style={{ left: configPosition.x, top: configPosition.y }}
        >
          <ColumnConfigPopover
            column={configColumn}
            databaseId={database.id}
            onClose={() => {
              setConfigColumn(null);
              setConfigPosition(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Cell Renderer Component
// =============================================================================

interface CellRendererProps {
  column: { id: string; name: string; type: string; options?: string[] };
  value: unknown;
  entryId: string;
  databaseId: string;
}

function CellRenderer({ column, value, entryId, databaseId }: CellRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(String(value ?? ""));

  const utils = api.useUtils();
  const updateCellMutation = api.database.updateCell.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: databaseId });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    let parsedValue: unknown = editValue;

    // Parse value based on column type
    if (column.type === "NUMBER") {
      parsedValue = editValue ? parseFloat(editValue) : null;
    } else if (column.type === "CHECKBOX") {
      parsedValue = editValue === "true";
    } else if (column.type === "DATE") {
      parsedValue = editValue || null;
    }

    updateCellMutation.mutate({
      entryId,
      columnId: column.id,
      value: parsedValue,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(String(value ?? ""));
    }
  };

  // Checkbox type - Notion-style compact checkbox
  if (column.type === "CHECKBOX") {
    return (
      <div className="flex items-center justify-center h-5">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => {
            updateCellMutation.mutate({
              entryId,
              columnId: column.id,
              value: e.target.checked,
            });
          }}
          className="w-3.5 h-3.5 rounded border-bone dark:border-charcoal/60 text-gold focus:ring-gold/30 focus:ring-1 focus:ring-offset-0 cursor-pointer transition-colors"
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
        onChange={(e) => {
          updateCellMutation.mutate({
            entryId,
            columnId: column.id,
            value: e.target.value || null,
          });
        }}
        className={`w-full px-1.5 py-0.5 text-[11px] rounded-sm border-0 bg-transparent text-charcoal dark:text-cultured-white focus:ring-1 focus:ring-gold/30 cursor-pointer hover:bg-bone/30 dark:hover:bg-surface-dark/50 transition-colors ${
          currentValue ? 'font-medium' : 'text-charcoal/30 dark:text-cultured-white/30'
        }`}
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

  // URL type - Notion-style link
  if (column.type === "URL" && value) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-gold hover:text-gold/80 hover:underline truncate block px-0.5 py-0.5 transition-colors"
      >
        {String(value)}
      </a>
    );
  }

  // Editable text/number/date - Notion-style inline edit
  if (isEditing) {
    return (
      <input
        type={column.type === "NUMBER" ? "number" : column.type === "DATE" ? "date" : "text"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full px-1 py-0.5 text-[11px] rounded-sm border border-gold/60 bg-alabaster dark:bg-deep-grey text-charcoal dark:text-cultured-white focus:outline-none focus:ring-1 focus:ring-gold/30 focus:border-gold transition-all"
        aria-label={`Edit ${column.name}`}
      />
    );
  }

  // Display mode - Notion-style cell
  return (
    <div
      onClick={() => {
        setIsEditing(true);
        setEditValue(String(value ?? ""));
      }}
      className="min-h-[22px] px-0.5 py-0.5 text-[11px] text-charcoal dark:text-cultured-white cursor-text hover:bg-bone/30 dark:hover:bg-surface-dark/50 rounded-sm transition-colors flex items-center"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
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

// =============================================================================
// Kanban View Component
// =============================================================================

interface DatabaseKanbanViewProps {
  database: DatabaseWithEntries;
  groupBy: string | null;
  onGroupByChange: (groupBy: string | null) => void;
}

function DatabaseKanbanView({ database, groupBy, onGroupByChange }: DatabaseKanbanViewProps) {
  // Find SELECT columns for grouping
  const selectColumns = database.schema.columns.filter(
    (col) => col.type === "SELECT" && col.options?.length
  );

  // Auto-select first SELECT column if no groupBy
  const activeGroupBy = groupBy || selectColumns[0]?.id || null;
  const groupColumn = database.schema.columns.find((col) => col.id === activeGroupBy);
  const groups = groupColumn?.options || [];

  // Group entries
  const groupedEntries: Record<string, typeof database.entries> = {};
  groups.forEach((g) => (groupedEntries[g] = []));
  groupedEntries["Uncategorized"] = [];

  (database.entries || []).forEach((entry) => {
    const groupValue = String(entry.properties[activeGroupBy!] ?? "");
    if (groups.includes(groupValue)) {
      groupedEntries[groupValue].push(entry);
    } else {
      groupedEntries["Uncategorized"].push(entry);
    }
  });

  if (selectColumns.length === 0) {
    return (
      <div className="p-4 text-center text-charcoal/40 dark:text-cultured-white/40">
        <p className="text-xs">Kanban view requires a SELECT column.</p>
        <p className="text-[10px] mt-0.5 text-charcoal/30 dark:text-cultured-white/30">Add a SELECT column to enable this view.</p>
      </div>
    );
  }

  // Get title column (first TEXT column)
  const titleColumn = database.schema.columns.find((col) => col.type === "TEXT");

  return (
    <div className="p-2">
      {/* Group selector */}
      {selectColumns.length > 1 && (
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-[10px] text-charcoal/50 dark:text-cultured-white/50 uppercase tracking-wide">Group by:</span>
          <select
            value={activeGroupBy || ""}
            onChange={(e) => onGroupByChange(e.target.value || null)}
            className="text-[11px] px-1.5 py-0.5 rounded-sm border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-deep-grey text-charcoal dark:text-cultured-white focus:border-gold focus:ring-1 focus:ring-gold/20"
          >
            {selectColumns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <AnimatePresence>
          {[...groups, "Uncategorized"].map((group) => {
            const entries = groupedEntries[group] || [];
            if (group === "Uncategorized" && entries.length === 0) return null;

            return (
              <motion.div
                key={group}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-shrink-0 w-48 bg-bone/30 dark:bg-surface-dark/50 rounded-md"
              >
                <div className="px-2 py-1 font-medium text-[10px] text-charcoal/60 dark:text-cultured-white/60 border-b border-bone/60 dark:border-charcoal/40 uppercase tracking-wide flex items-center justify-between">
                  <span>{group}</span>
                  <span className="text-charcoal/30 dark:text-cultured-white/30 font-normal">{entries.length}</span>
                </div>
                <div className="p-1 space-y-1 min-h-[60px]">
                  <AnimatePresence>
                    {entries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="p-1.5 bg-alabaster dark:bg-deep-grey rounded-sm border border-bone/60 dark:border-charcoal/40 shadow-sm hover:shadow-md hover:border-gold/30 transition-all duration-150 cursor-pointer group"
                      >
                        <div className="font-medium text-[11px] text-charcoal dark:text-cultured-white group-hover:text-gold transition-colors">
                          {titleColumn
                            ? String(entry.properties[titleColumn.id] || "Untitled")
                            : "Entry"}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// Gallery View Component
// =============================================================================

interface DatabaseGalleryViewProps {
  database: DatabaseWithEntries;
}

function DatabaseGalleryView({ database }: DatabaseGalleryViewProps) {
  const entries = database.entries || [];
  const titleColumn = database.schema.columns.find((col) => col.type === "TEXT");

  if (entries.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-charcoal/40 dark:text-cultured-white/40">
        No entries yet
      </div>
    );
  }

  return (
    <div className="p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
      <AnimatePresence>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="p-2 bg-bone/30 dark:bg-surface-dark/50 rounded-md border border-bone/60 dark:border-charcoal/40 hover:border-gold/40 hover:shadow-md hover:bg-bone/50 dark:hover:bg-surface-dark transition-all duration-150 cursor-pointer group"
          >
            <div className="font-medium text-[11px] text-charcoal dark:text-cultured-white mb-1 group-hover:text-gold transition-colors truncate">
              {titleColumn
                ? String(entry.properties[titleColumn.id] || "Untitled")
                : "Entry"}
            </div>
            <div className="space-y-0.5">
              {database.schema.columns.slice(1, 4).map((col) => {
                const val = entry.properties[col.id];
                if (val == null) return null;
                return (
                  <div key={col.id} className="text-[10px] text-charcoal/50 dark:text-cultured-white/50 truncate">
                    <span className="font-medium text-charcoal/60 dark:text-cultured-white/60">{col.name}:</span> {String(val)}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function getTemplateSchema(templateId: string): { columns: Array<{ id: string; name: string; type: string; options?: string[] }> } {
  const templates: Record<string, { columns: Array<{ id: string; name: string; type: string; options?: string[] }> }> = {
    "dd-tracker": {
      columns: [
        { id: "task", name: "Task", type: "TEXT" },
        { id: "category", name: "Category", type: "SELECT", options: ["Legal", "Financial", "Technical", "Commercial", "HR"] },
        { id: "status", name: "Status", type: "SELECT", options: ["To Do", "In Progress", "Review", "Done"] },
        { id: "dueDate", name: "Due Date", type: "DATE" },
        { id: "priority", name: "Priority", type: "SELECT", options: ["Low", "Medium", "High", "Critical"] },
      ],
    },
    "contact-list": {
      columns: [
        { id: "name", name: "Name", type: "TEXT" },
        { id: "role", name: "Role", type: "TEXT" },
        { id: "company", name: "Company", type: "TEXT" },
        { id: "email", name: "Email", type: "URL" },
        { id: "phone", name: "Phone", type: "TEXT" },
      ],
    },
    "document-log": {
      columns: [
        { id: "document", name: "Document", type: "TEXT" },
        { id: "category", name: "Category", type: "SELECT", options: ["Financial", "Legal", "Corporate", "Technical", "Other"] },
        { id: "status", name: "Status", type: "SELECT", options: ["Requested", "Received", "Under Review", "Approved"] },
        { id: "requestDate", name: "Requested", type: "DATE" },
        { id: "receivedDate", name: "Received", type: "DATE" },
      ],
    },
    "risk-register": {
      columns: [
        { id: "risk", name: "Risk", type: "TEXT" },
        { id: "category", name: "Category", type: "SELECT", options: ["Financial", "Legal", "Operational", "Market", "Regulatory"] },
        { id: "likelihood", name: "Likelihood", type: "SELECT", options: ["Low", "Medium", "High"] },
        { id: "impact", name: "Impact", type: "SELECT", options: ["Low", "Medium", "High"] },
        { id: "mitigation", name: "Mitigation", type: "TEXT" },
      ],
    },
  };

  return templates[templateId] || { columns: [{ id: "col_title", name: "Title", type: "TEXT" }] };
}

// =============================================================================
// Entry Form Sheet Component
// =============================================================================

interface EntryFormSheetProps {
  database: DatabaseWithEntries;
  entry?: DatabaseEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EntryFormSheet({ database, entry, open, onOpenChange }: EntryFormSheetProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (entry) {
      return { ...entry.properties };
    }
    const initial: Record<string, unknown> = {};
    database.schema.columns.forEach((col) => {
      initial[col.id] = col.type === "CHECKBOX" ? false : "";
    });
    return initial;
  });

  const utils = api.useUtils();
  const createEntryMutation = api.database.createEntry.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: database.id });
      onOpenChange(false);
    },
  });
  const updateEntryMutation = api.database.updateEntry.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: database.id });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entry) {
      updateEntryMutation.mutate({
        id: entry.id,
        properties: formData,
      });
    } else {
      createEntryMutation.mutate({
        databaseId: database.id,
        properties: formData,
      });
    }
  };

  const handleFieldChange = (columnId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [columnId]: value }));
  };

  const isLoading = createEntryMutation.isPending || updateEntryMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetClose className="absolute right-4 top-4" />
        <SheetHeader>
          <SheetTitle>{entry ? "Edit Entry" : "New Entry"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {database.schema.columns.map((col) => (
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

          <SheetFooter className="pt-6">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-charcoal hover:bg-bone rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gold hover:bg-gold/90 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : entry ? "Update" : "Create"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// Form Field Component (for Entry Form)
// =============================================================================

interface FormFieldProps {
  column: DatabaseColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FormField({ column, value, onChange }: FormFieldProps) {
  switch (column.type) {
    case "CHECKBOX":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 rounded border-bone text-gold focus:ring-gold"
        />
      );

    case "SELECT":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 rounded-md border border-bone bg-white text-charcoal focus:border-gold focus:ring-1 focus:ring-gold"
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
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, opt]);
                  } else {
                    onChange(selectedValues.filter((v: string) => v !== opt));
                  }
                }}
                className="w-4 h-4 rounded border-bone text-gold focus:ring-gold"
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
          className="w-full px-3 py-2 rounded-md border border-bone bg-white text-charcoal focus:border-gold focus:ring-1 focus:ring-gold"
        />
      );

    case "DATE":
      return (
        <input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 rounded-md border border-bone bg-white text-charcoal focus:border-gold focus:ring-1 focus:ring-gold"
        />
      );

    case "URL":
      return (
        <input
          type="url"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-md border border-bone bg-white text-charcoal focus:border-gold focus:ring-1 focus:ring-gold"
        />
      );

    default: // TEXT
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-bone bg-white text-charcoal focus:border-gold focus:ring-1 focus:ring-gold"
        />
      );
  }
}

// =============================================================================
// Column Config Popover Component
// =============================================================================

interface ColumnConfigPopoverProps {
  column: DatabaseColumn;
  databaseId: string;
  onClose: () => void;
}

function ColumnConfigPopover({ column, databaseId, onClose }: ColumnConfigPopoverProps) {
  const [name, setName] = useState(column.name);
  const [type, setType] = useState(column.type);
  const [options, setOptions] = useState<string[]>(column.options || []);
  const [newOption, setNewOption] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const utils = api.useUtils();

  const updateColumnMutation = api.database.updateColumn.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: databaseId });
      onClose();
    },
  });

  const deleteColumnMutation = api.database.deleteColumn.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: databaseId });
      onClose();
    },
  });

  const handleSave = () => {
    updateColumnMutation.mutate({
      databaseId,
      columnId: column.id,
      updates: {
        name,
        type,
        options: type === "SELECT" || type === "MULTI_SELECT" ? options : undefined,
      },
    });
  };

  const handleDelete = () => {
    deleteColumnMutation.mutate({
      databaseId,
      columnId: column.id,
    });
  };

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const handleRemoveOption = (opt: string) => {
    setOptions(options.filter((o) => o !== opt));
  };

  const columnTypes = [
    { value: "TEXT", label: "Text" },
    { value: "NUMBER", label: "Number" },
    { value: "SELECT", label: "Select" },
    { value: "MULTI_SELECT", label: "Multi-select" },
    { value: "DATE", label: "Date" },
    { value: "CHECKBOX", label: "Checkbox" },
    { value: "URL", label: "URL" },
  ];

  if (showDeleteConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-2.5 w-52 bg-alabaster dark:bg-deep-grey rounded-md border border-bone dark:border-charcoal/60 shadow-lg"
      >
        <p className="text-[11px] text-charcoal dark:text-cultured-white mb-2">
          Delete column "{column.name}"? This cannot be undone.
        </p>
        <div className="flex gap-1 justify-end">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-1.5 py-0.5 text-[10px] text-charcoal dark:text-cultured-white hover:bg-bone dark:hover:bg-surface-dark rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteColumnMutation.isPending}
            className="px-1.5 py-0.5 text-[10px] text-white bg-red-500 hover:bg-red-600 rounded disabled:opacity-50 transition-colors"
          >
            {deleteColumnMutation.isPending ? "..." : "Delete"}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-2.5 w-56 bg-alabaster dark:bg-deep-grey rounded-md border border-bone dark:border-charcoal/60 shadow-lg"
    >
      {/* Column Name */}
      <div className="mb-2">
        <label className="block text-[10px] font-medium text-charcoal/60 dark:text-cultured-white/60 mb-0.5 uppercase tracking-wide">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-1.5 py-0.5 text-[11px] rounded-sm border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark text-charcoal dark:text-cultured-white focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all"
        />
      </div>

      {/* Column Type */}
      <div className="mb-2">
        <label className="block text-[10px] font-medium text-charcoal/60 dark:text-cultured-white/60 mb-0.5 uppercase tracking-wide">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-1.5 py-0.5 text-[11px] rounded-sm border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark text-charcoal dark:text-cultured-white focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all"
        >
          {columnTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Options (for SELECT types) */}
      {(type === "SELECT" || type === "MULTI_SELECT") && (
        <div className="mb-2">
          <label className="block text-[10px] font-medium text-charcoal/60 dark:text-cultured-white/60 mb-0.5 uppercase tracking-wide">Options</label>
          <div className="space-y-0.5 mb-1 max-h-20 overflow-y-auto">
            {options.map((opt) => (
              <div key={opt} className="flex items-center justify-between px-1 py-0.5 bg-bone/40 dark:bg-surface-dark/60 rounded-sm text-[10px] text-charcoal dark:text-cultured-white">
                <span className="truncate">{opt}</span>
                <button onClick={() => handleRemoveOption(opt)} className="text-charcoal/40 dark:text-cultured-white/40 hover:text-red-500 transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
              placeholder="Add option..."
              className="flex-1 px-1 py-0.5 text-[10px] rounded-sm border border-bone dark:border-charcoal/60 bg-alabaster dark:bg-surface-dark text-charcoal dark:text-cultured-white placeholder:text-charcoal/30 dark:placeholder:text-cultured-white/30 focus:border-gold transition-all"
            />
            <button
              onClick={handleAddOption}
              className="px-1.5 py-0.5 text-[10px] text-gold hover:bg-gold/10 rounded-sm transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1.5 border-t border-bone/60 dark:border-charcoal/40">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[10px] text-red-500 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
        <div className="flex gap-1">
          <button
            onClick={onClose}
            className="px-1.5 py-0.5 text-[10px] text-charcoal dark:text-cultured-white hover:bg-bone dark:hover:bg-surface-dark rounded-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateColumnMutation.isPending}
            className="px-1.5 py-0.5 text-[10px] text-white bg-gold hover:bg-gold/90 rounded-sm disabled:opacity-50 transition-colors"
          >
            {updateColumnMutation.isPending ? "..." : "Save"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Row Actions Menu Component
// =============================================================================

interface RowActionsMenuProps {
  entry: DatabaseEntry;
  database: DatabaseWithEntries;
  onEdit: () => void;
}

function RowActionsMenu({ entry, database, onEdit }: RowActionsMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const utils = api.useUtils();

  const duplicateMutation = api.database.duplicateEntry.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: database.id });
    },
  });

  const deleteMutation = api.database.deleteEntry.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: database.id });
    },
  });

  const handleDuplicate = () => {
    duplicateMutation.mutate({ id: entry.id });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: entry.id });
    setShowDeleteConfirm(false);
  };

  if (showDeleteConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="absolute left-0 top-full mt-0.5 z-50 p-2 bg-alabaster dark:bg-deep-grey rounded-md border border-bone dark:border-charcoal/60 shadow-lg"
      >
        <p className="text-[11px] text-charcoal dark:text-cultured-white mb-2">Delete this entry?</p>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-1.5 py-0.5 text-[10px] text-charcoal dark:text-cultured-white hover:bg-bone dark:hover:bg-surface-dark rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-1.5 py-0.5 text-[10px] text-white bg-red-500 hover:bg-red-600 rounded disabled:opacity-50 transition-colors"
          >
            {deleteMutation.isPending ? "..." : "Delete"}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-0.5 rounded hover:bg-bone/60 dark:hover:bg-surface-dark/60 opacity-0 group-hover:opacity-100 transition-all duration-150 focus:opacity-100">
        <GripVertical className="w-3 h-3 text-charcoal/30 dark:text-cultured-white/30" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[120px]">
        <DropdownMenuItem onClick={onEdit} className="text-[11px] py-1">
          <Edit className="w-3 h-3 mr-1.5" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate} disabled={duplicateMutation.isPending} className="text-[11px] py-1">
          <Copy className="w-3 h-3 mr-1.5" />
          {duplicateMutation.isPending ? "..." : "Duplicate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} destructive className="text-[11px] py-1">
          <Trash2 className="w-3 h-3 mr-1.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// Bulk Import Dialog Component
// =============================================================================

interface BulkImportDialogProps {
  database: DatabaseWithEntries;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function BulkImportDialog({ database, open, onOpenChange }: BulkImportDialogProps) {
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const utils = api.useUtils();
  const createEntryMutation = api.database.createEntry.useMutation();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        setError("CSV must have at least a header row and one data row");
        return;
      }

      // Parse CSV (simple parser - handles basic CSV)
      const parseRow = (row: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headerRow = parseRow(lines[0]);
      setHeaders(headerRow);

      // Auto-map columns by name match
      const autoMapping: Record<string, string> = {};
      headerRow.forEach((header) => {
        const match = database.schema.columns.find(
          (col) => col.name.toLowerCase() === header.toLowerCase()
        );
        if (match) {
          autoMapping[header] = match.id;
        }
      });
      setColumnMapping(autoMapping);

      // Parse data rows
      const data = lines.slice(1).map((line) => {
        const values = parseRow(line);
        const row: Record<string, string> = {};
        headerRow.forEach((header, i) => {
          row[header] = values[i] || "";
        });
        return row;
      });

      setCsvData(data);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    setImportProgress(0);

    // Convert CSV data to database entry format
    const entries = csvData.map((row) => {
      const properties: Record<string, unknown> = {};
      Object.entries(columnMapping).forEach(([csvHeader, columnId]) => {
        if (columnId && row[csvHeader] !== undefined) {
          const column = database.schema.columns.find((c) => c.id === columnId);
          let value: unknown = row[csvHeader];

          // Type conversion based on column type
          if (column) {
            if (column.type === "NUMBER") {
              value = value ? parseFloat(value as string) : null;
            } else if (column.type === "CHECKBOX") {
              value = ["true", "yes", "1"].includes(String(value).toLowerCase());
            } else if (column.type === "DATE") {
              value = value || null;
            }
          }

          properties[columnId] = value;
        }
      });
      return { properties };
    });

    // Create entries one by one with progress tracking
    try {
      for (let i = 0; i < entries.length; i++) {
        await createEntryMutation.mutateAsync({
          databaseId: database.id,
          properties: entries[i].properties,
        });
        setImportProgress(Math.round(((i + 1) / entries.length) * 100));
      }

      // Success - refresh and close
      utils.database.getById.invalidate({ id: database.id });
      onOpenChange(false);
      setCsvData([]);
      setHeaders([]);
      setColumnMapping({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import entries");
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const mappedColumnCount = Object.values(columnMapping).filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetClose className="absolute right-4 top-4" />
        <SheetHeader>
          <SheetTitle>Import from CSV</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* File upload */}
          {csvData.length === 0 ? (
            <div className="border-2 border-dashed border-bone rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-alabaster flex items-center justify-center">
                  <Database className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-charcoal font-medium">Upload CSV file</p>
                  <p className="text-sm text-charcoal/60">Click to select a file</p>
                </div>
              </label>
            </div>
          ) : (
            <>
              {/* Column mapping */}
              <div>
                <h3 className="text-sm font-medium text-charcoal mb-3">
                  Map columns ({mappedColumnCount}/{headers.length} mapped)
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {headers.map((header) => (
                    <div key={header} className="flex items-center gap-3">
                      <span className="text-sm text-charcoal/70 w-32 truncate">{header}</span>
                      <span className="text-charcoal/40">→</span>
                      <select
                        value={columnMapping[header] || ""}
                        onChange={(e) => {
                          setColumnMapping((prev) => ({
                            ...prev,
                            [header]: e.target.value,
                          }));
                        }}
                        className="flex-1 px-2 py-1 text-sm rounded border border-bone focus:border-gold"
                      >
                        <option value="">Skip this column</option>
                        {database.schema.columns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.name} ({col.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-sm font-medium text-charcoal mb-3">
                  Preview ({csvData.length} rows)
                </h3>
                <div className="border border-bone rounded-md overflow-x-auto max-h-48">
                  <table className="w-full text-sm">
                    <thead className="bg-alabaster/50 sticky top-0">
                      <tr>
                        {headers.map((header) => (
                          <th key={header} className="px-2 py-1 text-left text-charcoal/70 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t border-bone/50">
                          {headers.map((header) => (
                            <td key={header} className="px-2 py-1 text-charcoal whitespace-nowrap">
                              {row[header] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <div className="px-2 py-1 text-center text-xs text-charcoal/50 bg-alabaster/30">
                      ... and {csvData.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <SheetFooter className="pt-6">
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              setCsvData([]);
              setHeaders([]);
              setColumnMapping({});
            }}
            className="px-4 py-2 text-sm font-medium text-charcoal hover:bg-bone rounded-md transition-colors"
          >
            Cancel
          </button>
          {csvData.length > 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting || mappedColumnCount === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-gold hover:bg-gold/90 rounded-md transition-colors disabled:opacity-50"
            >
              {isImporting ? `Importing... ${importProgress}%` : `Import ${csvData.length} rows`}
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
