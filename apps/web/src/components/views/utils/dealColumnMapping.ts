/**
 * Deal Column Mapping - Maps Deal fields to CellColumn format
 *
 * This module provides utilities to convert Deal fields (both core and custom)
 * into CellColumn definitions for use with the shared CellRenderer component.
 */

import type { CellColumn, StatusOption, CellColumnType } from '@/components/shared/cells';

// =============================================================================
// Deal Stage Configuration
// =============================================================================

/**
 * Deal stage options with Notion-style colors
 * Colors match the design spec in CLAUDE.md
 */
export const DEAL_STAGE_OPTIONS: StatusOption[] = [
  { id: 'SOURCING', name: 'Sourcing', color: 'blue' },
  { id: 'INITIAL_REVIEW', name: 'Initial Review', color: 'violet' },
  { id: 'PRELIMINARY_DUE_DILIGENCE', name: 'Preliminary DD', color: 'pink' },
  { id: 'DEEP_DUE_DILIGENCE', name: 'Deep DD', color: 'orange' },
  { id: 'NEGOTIATION', name: 'Negotiation', color: 'amber' },
  { id: 'CLOSING', name: 'Closing', color: 'emerald' },
  { id: 'CLOSED_WON', name: 'Closed Won', color: 'green' },
  { id: 'CLOSED_LOST', name: 'Closed Lost', color: 'red' },
];

// =============================================================================
// Deal Priority Configuration
// =============================================================================

/**
 * Deal priority options with colors
 */
export const DEAL_PRIORITY_OPTIONS: StatusOption[] = [
  { id: 'NONE', name: 'None', color: 'gray' },
  { id: 'LOW', name: 'Low', color: 'blue' },
  { id: 'MEDIUM', name: 'Medium', color: 'yellow' },
  { id: 'HIGH', name: 'High', color: 'orange' },
  { id: 'URGENT', name: 'Urgent', color: 'red' },
];

// =============================================================================
// Deal Source Configuration
// =============================================================================

/**
 * Deal source options (SELECT type)
 */
export const DEAL_SOURCE_OPTIONS: string[] = [
  'REFERRAL',
  'OUTBOUND',
  'INBOUND',
  'AUCTION',
  'NETWORK',
  'OTHER',
];

// =============================================================================
// Core Deal Columns
// =============================================================================

/**
 * Core deal columns that map to Deal model fields
 * These are the standard columns available for all deals
 */
export const DEAL_CORE_COLUMNS: CellColumn[] = [
  {
    id: 'title',
    name: 'Deal Name',
    type: 'TEXT',
    editable: true,
    width: 200,
  },
  {
    id: 'stage',
    name: 'Stage',
    type: 'STATUS',
    statusOptions: DEAL_STAGE_OPTIONS,
    editable: true,
    width: 130,
  },
  {
    id: 'priority',
    name: 'Priority',
    type: 'STATUS',
    statusOptions: DEAL_PRIORITY_OPTIONS,
    editable: true,
    width: 100,
  },
  {
    id: 'value',
    name: 'Value',
    type: 'NUMBER',
    editable: true,
    width: 100,
  },
  {
    id: 'probability',
    name: 'Prob.',
    type: 'NUMBER',
    editable: true,
    width: 80,
  },
  {
    id: 'source',
    name: 'Source',
    type: 'SELECT',
    options: DEAL_SOURCE_OPTIONS,
    editable: true,
    width: 100,
  },
  {
    id: 'expectedCloseDate',
    name: 'Close Date',
    type: 'DATE',
    editable: true,
    width: 120,
  },
  {
    id: 'leadPartner',
    name: 'Lead Partner',
    type: 'PERSON',
    editable: true,
    width: 130,
  },
];

// =============================================================================
// Column Mapping Utilities
// =============================================================================

/**
 * Custom field schema from the database
 */
export interface DealFieldSchema {
  id: string;
  name: string;
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'DATE' | 'PERSON' | 'CHECKBOX' | 'URL' | 'STATUS' | 'RELATION' | 'ROLLUP' | 'FORMULA';
  options?: string[] | StatusOption[];
  required?: boolean;
  order?: number;
}

/**
 * Converts a DealFieldSchema to a CellColumn
 */
export function fieldSchemaToCellColumn(field: DealFieldSchema): CellColumn {
  const column: CellColumn = {
    id: field.id,
    name: field.name,
    type: field.type as CellColumnType,
    editable: field.type !== 'ROLLUP' && field.type !== 'FORMULA', // Read-only computed types
    width: getDefaultWidthForType(field.type),
  };

  // Handle type-specific options
  if (field.type === 'SELECT' || field.type === 'MULTI_SELECT') {
    column.options = field.options as string[];
  } else if (field.type === 'STATUS') {
    column.statusOptions = field.options as StatusOption[];
  }

  return column;
}

/**
 * Gets the default column width for a given field type
 */
function getDefaultWidthForType(type: string): number {
  switch (type) {
    case 'TEXT':
      return 150;
    case 'NUMBER':
      return 80;
    case 'SELECT':
    case 'MULTI_SELECT':
      return 120;
    case 'DATE':
      return 100;
    case 'PERSON':
      return 130;
    case 'CHECKBOX':
      return 60;
    case 'URL':
      return 150;
    case 'STATUS':
      return 100;
    case 'RELATION':
      return 150;
    case 'ROLLUP':
    case 'FORMULA':
      return 100;
    default:
      return 100;
  }
}

/**
 * Builds the full column list for the deals table
 * Combines core columns with custom field columns
 */
export function buildDealColumns(customFields: DealFieldSchema[] = []): CellColumn[] {
  const customColumns = customFields
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(fieldSchemaToCellColumn);

  return [...DEAL_CORE_COLUMNS, ...customColumns];
}

// =============================================================================
// Value Extraction Utilities
// =============================================================================

/**
 * Deal data structure from API/ViewContext
 */
export interface DealData {
  id: string;
  title: string;
  stage: string;
  dbStage?: string; // Actual database stage (not mapped to view stage)
  priority?: string;
  value?: string;
  intValue?: number;
  probability?: number;
  source?: string;
  date?: string;
  closingDate?: Date;
  customFields?: Record<string, unknown>;
  leadPartner?: string;
  leadPartnerId?: string;
  // Companies are handled separately via CompaniesCell
  companies?: unknown[];
}

/**
 * Extracts the value for a given column from a deal
 */
export function getDealCellValue(deal: DealData, column: CellColumn): unknown {
  // Core fields
  switch (column.id) {
    case 'title':
      return deal.title;
    case 'stage':
      // Use actual database stage if available, otherwise fall back to view stage
      return deal.dbStage || deal.stage;
    case 'priority':
      return deal.priority || 'NONE';
    case 'value':
      return deal.intValue ?? null;
    case 'probability':
      return deal.probability ?? null;
    case 'source':
      return deal.source || null;
    case 'expectedCloseDate':
      // Format date for the cell
      if (deal.closingDate) {
        return deal.closingDate instanceof Date
          ? deal.closingDate.toISOString().slice(0, 10)
          : new Date(deal.closingDate).toISOString().slice(0, 10);
      }
      return null;
    case 'leadPartner':
      return deal.leadPartner || deal.leadPartnerId || null;
    default:
      // Check custom fields
      if (deal.customFields && column.id in deal.customFields) {
        return deal.customFields[column.id];
      }
      return null;
  }
}

/**
 * Maps a column ID and value to deal update parameters
 */
export function mapCellUpdateToDealUpdate(
  columnId: string,
  value: unknown
): Record<string, unknown> {
  switch (columnId) {
    case 'title':
      return { name: value };
    case 'stage':
      return { stage: value };
    case 'priority':
      return { priority: value };
    case 'value':
      return { value: value };
    case 'probability':
      return { probability: value };
    case 'source':
      return { source: value };
    case 'expectedCloseDate':
      return { expectedCloseDate: value ? new Date(String(value)) : null };
    case 'leadPartner':
      // This might need special handling to find the user ID
      return { leadPartnerId: value };
    default:
      // Custom field - update via customFields JSON
      return {
        customFields: {
          [columnId]: value,
        },
      };
  }
}

/**
 * Checks if a column ID is a core deal field
 */
export function isCoreColumn(columnId: string): boolean {
  return DEAL_CORE_COLUMNS.some((col) => col.id === columnId);
}
