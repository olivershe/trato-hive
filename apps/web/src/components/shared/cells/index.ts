/**
 * Shared Cell Components
 *
 * This module provides Notion-style inline cell editing components that can be used
 * by both DatabaseViewBlock and the Deals TableView.
 *
 * Usage:
 * ```typescript
 * import { CellRenderer, CellColumn, EntryFormSheet } from '@/components/shared/cells';
 *
 * const column: CellColumn = {
 *   id: 'status',
 *   name: 'Status',
 *   type: 'STATUS',
 *   statusOptions: [
 *     { id: 'active', name: 'Active', color: 'green' },
 *     { id: 'inactive', name: 'Inactive', color: 'gray' },
 *   ],
 * };
 *
 * <CellRenderer
 *   column={column}
 *   value={value}
 *   onSave={(newValue) => handleSave(newValue)}
 * />
 * ```
 */

// Types
export * from './types';

// Components
export { CellRenderer } from './CellRenderer';
export { FormField } from './FormField';
export { EntryFormSheet } from './EntryFormSheet';
