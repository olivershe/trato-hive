/**
 * DatabaseViewBlock - Tiptap extension for inline databases
 *
 * Embeds a real Database entity in any page with Table, Kanban, and Gallery views.
 * Supports filters, sorting, and grouping persisted in block properties.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback } from "react";
import { Database, Table2, LayoutGrid, Plus, Link2, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";

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

        <div className="flex items-center gap-1">
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

  // Create entry mutation
  const utils = api.useUtils();
  const createEntryMutation = api.database.createEntry.useMutation({
    onSuccess: () => {
      utils.database.getById.invalidate({ id: database.id });
    },
  });

  const handleAddRow = () => {
    const emptyProperties: Record<string, unknown> = {};
    columns.forEach((col) => {
      emptyProperties[col.id] = col.type === "CHECKBOX" ? false : null;
    });
    createEntryMutation.mutate({
      databaseId: database.id,
      properties: emptyProperties,
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-bone bg-alabaster/50">
            {columns.map((col) => (
              <th
                key={col.id}
                className="px-3 py-2 text-left text-sm font-medium text-charcoal/80 cursor-pointer hover:bg-bone/50"
                style={{ width: col.width || 150 }}
                onClick={() => {
                  if (sortBy?.columnId === col.id) {
                    onSortChange(
                      sortBy.direction === "asc"
                        ? { columnId: col.id, direction: "desc" }
                        : null
                    );
                  } else {
                    onSortChange({ columnId: col.id, direction: "asc" });
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {col.name}
                  {sortBy?.columnId === col.id && (
                    <span className="text-gold">
                      {sortBy.direction === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-charcoal/50">
                No entries yet
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} className="border-b border-bone/50 hover:bg-alabaster/30">
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
        onClick={handleAddRow}
        disabled={createEntryMutation.isPending}
        className="w-full px-3 py-2 text-left text-sm text-charcoal/50 hover:bg-alabaster/50 hover:text-charcoal flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New
      </button>
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
