/**
 * DatabaseViewBlock - Tiptap extension for inline databases
 *
 * Embeds a real Database entity in any page with Table, Kanban, and Gallery views.
 * Supports filters, sorting, and grouping persisted in block properties.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback } from "react";
import { Database, Table2, LayoutGrid, Plus, Link2, Loader2, MoreHorizontal, Trash2, Copy, Edit, Settings, X } from "lucide-react";
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
      <div className="rounded-lg border border-bone bg-alabaster p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-gold" />
          <span className="font-medium text-charcoal">Add a Database</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onModeChange("create")}
            className="flex items-center gap-3 p-4 rounded-lg border border-bone bg-white hover:border-gold hover:bg-alabaster/50 transition-colors text-left"
          >
            <Plus className="w-5 h-5 text-gold" />
            <div>
              <div className="font-medium text-charcoal">Create New</div>
              <div className="text-sm text-charcoal/60">Start with a template</div>
            </div>
          </button>

          <button
            onClick={() => onModeChange("link")}
            className="flex items-center gap-3 p-4 rounded-lg border border-bone bg-white hover:border-gold hover:bg-alabaster/50 transition-colors text-left"
          >
            <Link2 className="w-5 h-5 text-gold" />
            <div>
              <div className="font-medium text-charcoal">Link Existing</div>
              <div className="text-sm text-charcoal/60">Use an existing database</div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Create new database view
  if (mode === "create") {
    return (
      <div className="rounded-lg border border-bone bg-alabaster p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Plus className="w-5 h-5 text-gold" />
            <span className="font-medium text-charcoal">Create New Database</span>
          </div>
          <button
            onClick={() => onModeChange("select")}
            className="text-sm text-charcoal/60 hover:text-charcoal"
          >
            Back
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">
              Database Name
            </label>
            <input
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="e.g., Due Diligence Checklist"
              className="w-full px-3 py-2 rounded-md border border-bone bg-white text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Choose a Template
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    selectedTemplate === template.id
                      ? "border-gold bg-gold/10"
                      : "border-bone bg-white hover:border-gold/50"
                  }`}
                >
                  <div className="font-medium text-sm text-charcoal">{template.name}</div>
                  <div className="text-xs text-charcoal/60">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!newDbName.trim() || createMutation.isPending}
            className="w-full px-4 py-2 rounded-md bg-gold text-white font-medium hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Database
          </button>
        </div>
      </div>
    );
  }

  // Link existing database view
  return (
    <div className="rounded-lg border border-bone bg-alabaster p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link2 className="w-5 h-5 text-gold" />
          <span className="font-medium text-charcoal">Link Existing Database</span>
        </div>
        <button
          onClick={() => onModeChange("select")}
          className="text-sm text-charcoal/60 hover:text-charcoal"
        >
          Back
        </button>
      </div>

      {isLoadingDatabases ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      ) : databases?.items.length === 0 ? (
        <div className="text-center py-8 text-charcoal/60">
          <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No databases found</p>
          <button
            onClick={() => onModeChange("create")}
            className="mt-2 text-gold hover:underline"
          >
            Create your first database
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {databases?.items.map((db) => (
            <button
              key={db.id}
              onClick={() => onSelect(db.id)}
              className="w-full p-3 rounded-md border border-bone bg-white hover:border-gold hover:bg-alabaster/50 transition-colors text-left"
            >
              <div className="font-medium text-charcoal">{db.name}</div>
              {db.description && (
                <div className="text-sm text-charcoal/60">{db.description}</div>
              )}
              <div className="text-xs text-charcoal/40 mt-1">
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
      <div className="rounded-lg border border-bone bg-alabaster p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      </div>
    );
  }

  if (error || !database) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="text-red-600 font-medium">Failed to load database</div>
        <div className="text-red-500 text-sm mt-1">{error?.message || "Database not found"}</div>
        <button
          onClick={onUnlink}
          className="mt-3 text-sm text-red-600 hover:underline"
        >
          Unlink and try again
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-bone bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bone bg-alabaster">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gold" />
          <span className="font-medium text-charcoal">{database.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Import button */}
          <button
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-charcoal/60 hover:text-charcoal hover:bg-bone rounded transition-colors"
            title="Import from CSV"
          >
            <Plus className="w-3.5 h-3.5" />
            Import
          </button>

          <div className="w-px h-4 bg-bone" />

          {/* View switcher */}
          <button
            onClick={() => onViewTypeChange("table")}
            className={`p-1.5 rounded ${
              viewType === "table" ? "bg-gold/20 text-gold" : "text-charcoal/60 hover:bg-bone"
            }`}
            title="Table view"
          >
            <Table2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewTypeChange("kanban")}
            className={`p-1.5 rounded ${
              viewType === "kanban" ? "bg-gold/20 text-gold" : "text-charcoal/60 hover:bg-bone"
            }`}
            title="Kanban view"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="5" height="18" rx="1" />
              <rect x="10" y="3" width="5" height="12" rx="1" />
              <rect x="17" y="3" width="5" height="15" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => onViewTypeChange("gallery")}
            className={`p-1.5 rounded ${
              viewType === "gallery" ? "bg-gold/20 text-gold" : "text-charcoal/60 hover:bg-bone"
            }`}
            title="Gallery view"
          >
            <LayoutGrid className="w-4 h-4" />
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-bone bg-alabaster/50">
            {/* Row actions column */}
            <th className="w-10 px-1" />
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-3 py-2 text-left text-sm font-medium text-charcoal/80 cursor-pointer hover:bg-bone/50 group"
                style={{ width: col.width || 150 }}
                onClick={(e) => handleColumnHeaderClick(e, col)}
                onContextMenu={(e) => handleColumnHeaderClick(e, col)}
              >
                <div className="flex items-center gap-1">
                  <span className="flex-1">{col.name}</span>
                  {sortBy?.columnId === col.id && (
                    <span className="text-gold">
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
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-bone rounded transition-opacity"
                  >
                    <Settings className="w-3 h-3 text-charcoal/50" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-8 text-center text-charcoal/50">
                No entries yet
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} className="border-b border-bone/50 hover:bg-alabaster/30 group relative">
                {/* Row actions */}
                <td className="px-1 relative">
                  <RowActionsMenu
                    entry={entry}
                    database={database}
                    onEdit={() => handleEditEntry(entry)}
                  />
                </td>
                {columns.map((col) => (
                  <td key={col.id} className="px-3 py-2">
                    <CellRenderer
                      column={col}
                      value={entry.properties[col.id]}
                      entryId={entry.id}
                      databaseId={database.id}
                    />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add row button */}
      <button
        onClick={handleOpenNewForm}
        className="w-full px-3 py-2 text-left text-sm text-charcoal/50 hover:bg-alabaster/50 hover:text-charcoal flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New
      </button>

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

  // Checkbox type
  if (column.type === "CHECKBOX") {
    return (
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
        className="w-4 h-4 rounded border-bone text-gold focus:ring-gold"
      />
    );
  }

  // Select type
  if (column.type === "SELECT" && column.options) {
    return (
      <select
        value={String(value ?? "")}
        onChange={(e) => {
          updateCellMutation.mutate({
            entryId,
            columnId: column.id,
            value: e.target.value || null,
          });
        }}
        className="w-full px-2 py-1 text-sm rounded border-0 bg-transparent text-charcoal focus:ring-1 focus:ring-gold"
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

  // URL type
  if (column.type === "URL" && value) {
    return (
      <a
        href={String(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold hover:underline text-sm"
      >
        {String(value)}
      </a>
    );
  }

  // Editable text/number/date
  if (isEditing) {
    return (
      <input
        type={column.type === "NUMBER" ? "number" : column.type === "DATE" ? "date" : "text"}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full px-2 py-1 text-sm rounded border border-gold bg-white text-charcoal focus:outline-none"
      />
    );
  }

  return (
    <div
      onClick={() => {
        setIsEditing(true);
        setEditValue(String(value ?? ""));
      }}
      className="min-h-[24px] px-2 py-1 text-sm text-charcoal cursor-text hover:bg-alabaster/50 rounded"
    >
      {value != null ? String(value) : <span className="text-charcoal/30">-</span>}
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
      <div className="p-8 text-center text-charcoal/50">
        <p>Kanban view requires a SELECT column.</p>
        <p className="text-sm mt-1">Add a SELECT column to enable this view.</p>
      </div>
    );
  }

  // Get title column (first TEXT column)
  const titleColumn = database.schema.columns.find((col) => col.type === "TEXT");

  return (
    <div className="p-4">
      {/* Group selector */}
      {selectColumns.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-charcoal/60">Group by:</span>
          <select
            value={activeGroupBy || ""}
            onChange={(e) => onGroupByChange(e.target.value || null)}
            className="text-sm px-2 py-1 rounded border border-bone bg-white text-charcoal"
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
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...groups, "Uncategorized"].map((group) => {
          const entries = groupedEntries[group] || [];
          if (group === "Uncategorized" && entries.length === 0) return null;

          return (
            <div
              key={group}
              className="flex-shrink-0 w-64 bg-alabaster rounded-lg"
            >
              <div className="px-3 py-2 font-medium text-sm text-charcoal border-b border-bone">
                {group}
                <span className="ml-2 text-charcoal/50">{entries.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[100px]">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-white rounded-md border border-bone shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="font-medium text-sm text-charcoal">
                      {titleColumn
                        ? String(entry.properties[titleColumn.id] || "Untitled")
                        : "Entry"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
      <div className="p-8 text-center text-charcoal/50">
        No entries yet
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="p-4 bg-alabaster rounded-lg border border-bone hover:border-gold/50 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="font-medium text-charcoal mb-2">
            {titleColumn
              ? String(entry.properties[titleColumn.id] || "Untitled")
              : "Entry"}
          </div>
          <div className="space-y-1">
            {database.schema.columns.slice(1, 4).map((col) => {
              const val = entry.properties[col.id];
              if (val == null) return null;
              return (
                <div key={col.id} className="text-xs text-charcoal/60">
                  <span className="font-medium">{col.name}:</span> {String(val)}
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
      <div className="p-4 w-64 bg-white rounded-lg border border-bone shadow-lg">
        <p className="text-sm text-charcoal mb-4">
          Delete column "{column.name}"? This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-3 py-1.5 text-sm text-charcoal hover:bg-bone rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteColumnMutation.isPending}
            className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded disabled:opacity-50"
          >
            {deleteColumnMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-72 bg-white rounded-lg border border-bone shadow-lg">
      {/* Column Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-charcoal/70 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-2 py-1.5 text-sm rounded border border-bone focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>

      {/* Column Type */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-charcoal/70 mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-2 py-1.5 text-sm rounded border border-bone focus:border-gold focus:ring-1 focus:ring-gold"
        >
          {columnTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Options (for SELECT types) */}
      {(type === "SELECT" || type === "MULTI_SELECT") && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-charcoal/70 mb-1">Options</label>
          <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
            {options.map((opt) => (
              <div key={opt} className="flex items-center justify-between px-2 py-1 bg-alabaster rounded text-sm">
                <span>{opt}</span>
                <button onClick={() => handleRemoveOption(opt)} className="text-charcoal/50 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
              placeholder="Add option..."
              className="flex-1 px-2 py-1 text-sm rounded border border-bone focus:border-gold"
            />
            <button
              onClick={handleAddOption}
              className="px-2 py-1 text-sm text-gold hover:bg-gold/10 rounded"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-bone">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Delete column
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-charcoal hover:bg-bone rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateColumnMutation.isPending}
            className="px-3 py-1.5 text-sm text-white bg-gold hover:bg-gold/90 rounded disabled:opacity-50"
          >
            {updateColumnMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
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
      <div className="absolute left-0 top-full mt-1 z-50 p-3 bg-white rounded-lg border border-bone shadow-lg">
        <p className="text-sm text-charcoal mb-3">Delete this entry?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-2 py-1 text-xs text-charcoal hover:bg-bone rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-2 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded disabled:opacity-50"
          >
            {deleteMutation.isPending ? "..." : "Delete"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded hover:bg-bone opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal className="w-4 h-4 text-charcoal/50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate} disabled={duplicateMutation.isPending}>
          <Copy className="w-4 h-4 mr-2" />
          {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} destructive>
          <Trash2 className="w-4 h-4 mr-2" />
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

  const utils = api.useUtils();
  const bulkCreateMutation = api.database.bulkCreateEntries.useMutation({
    onSuccess: (result) => {
      utils.database.getById.invalidate({ id: database.id });
      onOpenChange(false);
      setCsvData([]);
      setHeaders([]);
      setColumnMapping({});
    },
    onError: (err) => {
      setError(err.message);
    },
  });

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

  const handleImport = () => {
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

    bulkCreateMutation.mutate({
      databaseId: database.id,
      entries,
    });
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
              disabled={bulkCreateMutation.isPending || mappedColumnCount === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-gold hover:bg-gold/90 rounded-md transition-colors disabled:opacity-50"
            >
              {bulkCreateMutation.isPending ? "Importing..." : `Import ${csvData.length} rows`}
            </button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
