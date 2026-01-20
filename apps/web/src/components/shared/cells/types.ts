/**
 * Shared type definitions for cell rendering across DatabaseViewBlock and Deals TableView
 * These types enable Notion-style inline cell editing for any data source.
 */

// =============================================================================
// Column Type Definitions
// =============================================================================

export type CellColumnType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'URL'
  | 'CHECKBOX'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'STATUS'
  | 'PERSON'
  | 'RELATION'
  | 'ROLLUP'
  | 'FORMULA';

// Status option type for STATUS columns
export type StatusColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'violet' | 'pink' | 'orange' | 'amber' | 'emerald';

export interface StatusOption {
  id: string;
  name: string;
  color: StatusColor;
}

// Relation config for RELATION columns
export interface RelationConfig {
  targetDatabaseId: string;
  relationType: 'one' | 'many';
}

// Rollup config for ROLLUP columns
export interface RollupConfig {
  sourceRelationColumnId: string;
  targetColumnId: string;
  aggregation: 'count' | 'count_values' | 'sum' | 'avg' | 'min' | 'max' | 'concat' | 'percent_empty' | 'percent_not_empty';
}

// Formula config for FORMULA columns
export interface FormulaConfig {
  formula: string;
  resultType: 'text' | 'number' | 'date' | 'boolean';
}

// =============================================================================
// Cell Column Interface
// =============================================================================

export interface CellColumn {
  id: string;
  name: string;
  type: CellColumnType;
  options?: string[];
  width?: number;
  editable?: boolean;
  // Type-specific configurations
  statusOptions?: StatusOption[];
  relationConfig?: RelationConfig;
  rollupConfig?: RollupConfig;
  formulaConfig?: FormulaConfig;
}

// =============================================================================
// Cell Rendering Props
// =============================================================================

export interface CellRendererProps {
  column: CellColumn;
  value: unknown;
  onSave?: (value: unknown) => void;
  disabled?: boolean;
  className?: string;
}

// =============================================================================
// Form Field Props
// =============================================================================

export interface FormFieldProps {
  column: CellColumn;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

// =============================================================================
// Entry Form Sheet Props
// =============================================================================

export interface EntryFormSheetProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: CellColumn[];
  entry?: T | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
  title?: string;
}

// =============================================================================
// Status Color Mapping
// =============================================================================

export const STATUS_COLOR_CLASSES: Record<StatusColor, string> = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-200',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
};

// =============================================================================
// Default Status Options
// =============================================================================

export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { id: 'not_started', name: 'Not Started', color: 'gray' },
  { id: 'in_progress', name: 'In Progress', color: 'blue' },
  { id: 'done', name: 'Done', color: 'green' },
];
