/**
 * Database Types (Inline Database System)
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

/**
 * DatabaseColumnType - Supported column types for inline databases
 */
export const DatabaseColumnType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  DATE: 'DATE',
  PERSON: 'PERSON',
  CHECKBOX: 'CHECKBOX',
  URL: 'URL',
  STATUS: 'STATUS',
  RELATION: 'RELATION',
  ROLLUP: 'ROLLUP',
  FORMULA: 'FORMULA',
} as const

export type DatabaseColumnTypeValue =
  (typeof DatabaseColumnType)[keyof typeof DatabaseColumnType]

// =============================================================================
// STATUS Column Type Configuration
// =============================================================================

/**
 * StatusOption - A single status option with visual styling
 */
export type StatusColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'

export interface StatusOption {
  id: string
  name: string
  color: StatusColor
}

export const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
  { id: 'not_started', name: 'Not Started', color: 'gray' },
  { id: 'in_progress', name: 'In Progress', color: 'blue' },
  { id: 'done', name: 'Done', color: 'green' },
]

// =============================================================================
// RELATION Column Type Configuration
// =============================================================================

/**
 * RelationConfig - Configuration for linking to another database
 */
export interface RelationConfig {
  targetDatabaseId: string
  relationType: 'one' | 'many'
}

// =============================================================================
// ROLLUP Column Type Configuration
// =============================================================================

/**
 * RollupAggregation - Supported aggregation functions
 */
export type RollupAggregation =
  | 'count'
  | 'count_values'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'concat'
  | 'percent_empty'
  | 'percent_not_empty'

/**
 * RollupConfig - Configuration for aggregating related entries
 */
export interface RollupConfig {
  sourceRelationColumnId: string // RELATION column in this database
  targetColumnId: string // Column in target database to aggregate
  aggregation: RollupAggregation
}

// =============================================================================
// FORMULA Column Type Configuration
// =============================================================================

/**
 * FormulaResultType - Expected result type of a formula
 */
export type FormulaResultType = 'text' | 'number' | 'date' | 'boolean'

/**
 * FormulaConfig - Configuration for computed columns
 */
export interface FormulaConfig {
  formula: string // e.g., 'prop("Price") * prop("Quantity")'
  resultType: FormulaResultType
}

/**
 * DatabaseColumn - Definition for a single column in the database schema
 */
export interface DatabaseColumn {
  id: string
  name: string
  type: DatabaseColumnTypeValue
  options?: string[] // For SELECT/MULTI_SELECT types
  width?: number // Column width in pixels (default: 150)
  // New type-specific configurations
  statusOptions?: StatusOption[] // For STATUS type
  relationConfig?: RelationConfig // For RELATION type
  rollupConfig?: RollupConfig // For ROLLUP type
  formulaConfig?: FormulaConfig // For FORMULA type
}

/**
 * DatabaseSchema - Complete schema definition for a database
 */
export interface DatabaseSchema {
  columns: DatabaseColumn[]
}

/**
 * Database - User-created inline database (Notion-style)
 */
export interface Database {
  id: string
  organizationId: string
  name: string
  description: string | null
  schema: DatabaseSchema
  createdById: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DatabaseEntry - A single row in a database
 */
export interface DatabaseEntry {
  id: string
  databaseId: string
  properties: Record<string, unknown> // Column values keyed by column ID
  suggestedBy: string | null // AI agent that suggested this entry
  factIds: string[] // Source fact IDs for citation trail
  createdById: string
  createdAt: Date
  updatedAt: Date
}

/**
 * DatabaseWithEntries - Database with all its entries loaded
 * Used for: Inline database view, full database page
 */
export interface DatabaseWithEntries extends Database {
  entries: DatabaseEntry[]
  _count?: {
    entries: number
  }
}

/**
 * DatabaseWithCreator - Database with creator info
 * Used for: Database list views, audit displays
 */
export interface DatabaseWithCreator extends Database {
  creator: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/**
 * DatabaseEntryWithCreator - Entry with creator info
 * Used for: Entry detail views, activity feeds
 */
export interface DatabaseEntryWithCreator extends DatabaseEntry {
  creator: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/**
 * DatabaseEntryWithFacts - Entry with linked facts for citations
 * Used for: AI-suggested entries, citation displays
 */
export interface DatabaseEntryWithFacts extends DatabaseEntry {
  facts?: Array<{
    id: string
    type: string
    subject: string
    predicate: string
    object: string
    confidence: number
    sourceText: string | null
    documentName?: string
  }>
}

/**
 * DatabaseTemplate - Predefined database configurations
 * Used for: Quick database creation from templates
 */
export interface DatabaseTemplate {
  id: string
  name: string
  description: string
  schema: DatabaseSchema
}

/**
 * Default database templates for M&A workflows
 */
export const DATABASE_TEMPLATES: DatabaseTemplate[] = [
  {
    id: 'dd-tracker',
    name: 'Due Diligence Tracker',
    description: 'Track due diligence tasks and status',
    schema: {
      columns: [
        { id: 'task', name: 'Task', type: 'TEXT' },
        { id: 'category', name: 'Category', type: 'SELECT', options: ['Legal', 'Financial', 'Technical', 'Commercial', 'HR'] },
        { id: 'status', name: 'Status', type: 'SELECT', options: ['To Do', 'In Progress', 'Review', 'Done'] },
        { id: 'assignee', name: 'Assignee', type: 'PERSON' },
        { id: 'dueDate', name: 'Due Date', type: 'DATE' },
        { id: 'priority', name: 'Priority', type: 'SELECT', options: ['Low', 'Medium', 'High', 'Critical'] },
      ],
    },
  },
  {
    id: 'contact-list',
    name: 'Contact List',
    description: 'Manage key contacts for the deal',
    schema: {
      columns: [
        { id: 'name', name: 'Name', type: 'TEXT' },
        { id: 'role', name: 'Role', type: 'TEXT' },
        { id: 'company', name: 'Company', type: 'TEXT' },
        { id: 'email', name: 'Email', type: 'URL' },
        { id: 'phone', name: 'Phone', type: 'TEXT' },
        { id: 'notes', name: 'Notes', type: 'TEXT' },
      ],
    },
  },
  {
    id: 'document-log',
    name: 'Document Log',
    description: 'Track document requests and status',
    schema: {
      columns: [
        { id: 'document', name: 'Document', type: 'TEXT' },
        { id: 'category', name: 'Category', type: 'SELECT', options: ['Financial', 'Legal', 'Corporate', 'Technical', 'Other'] },
        { id: 'status', name: 'Status', type: 'SELECT', options: ['Requested', 'Received', 'Under Review', 'Approved'] },
        { id: 'requestDate', name: 'Requested', type: 'DATE' },
        { id: 'receivedDate', name: 'Received', type: 'DATE' },
        { id: 'notes', name: 'Notes', type: 'TEXT' },
      ],
    },
  },
  {
    id: 'risk-register',
    name: 'Risk Register',
    description: 'Track and assess deal risks',
    schema: {
      columns: [
        { id: 'risk', name: 'Risk', type: 'TEXT' },
        { id: 'category', name: 'Category', type: 'SELECT', options: ['Financial', 'Legal', 'Operational', 'Market', 'Regulatory'] },
        { id: 'likelihood', name: 'Likelihood', type: 'SELECT', options: ['Low', 'Medium', 'High'] },
        { id: 'impact', name: 'Impact', type: 'SELECT', options: ['Low', 'Medium', 'High'] },
        { id: 'mitigation', name: 'Mitigation', type: 'TEXT' },
        { id: 'owner', name: 'Owner', type: 'PERSON' },
      ],
    },
  },
  {
    id: 'document-review',
    name: 'Document Review',
    description: 'Track document review status with AI-extracted insights',
    schema: {
      columns: [
        { id: 'document', name: 'Document', type: 'TEXT' },
        { id: 'reviewer', name: 'Reviewer', type: 'PERSON' },
        { id: 'status', name: 'Status', type: 'SELECT', options: ['Pending', 'In Review', 'Approved', 'Flagged', 'Rejected'] },
        { id: 'reviewDate', name: 'Review Date', type: 'DATE' },
        { id: 'findings', name: 'Findings', type: 'TEXT' },
        { id: 'priority', name: 'Priority', type: 'SELECT', options: ['Low', 'Medium', 'High', 'Critical'] },
        { id: 'category', name: 'Category', type: 'SELECT', options: ['Legal', 'Financial', 'Technical', 'Commercial', 'HR', 'Other'] },
        // AI Fields - populated by EntityFactMapper
        { id: 'linkedFacts', name: 'Linked Facts', type: 'TEXT' },
        { id: 'confidenceScore', name: 'AI Confidence', type: 'NUMBER' },
        { id: 'aiSummary', name: 'AI Summary', type: 'TEXT' },
      ],
    },
  },
]

// =============================================================================
// View Configuration Types (for DatabaseViewBlock)
// =============================================================================

/**
 * DatabaseViewType - Available view modes for inline databases
 */
export const DatabaseViewType = {
  TABLE: 'table',
  KANBAN: 'kanban',
  GALLERY: 'gallery',
} as const

export type DatabaseViewTypeValue =
  (typeof DatabaseViewType)[keyof typeof DatabaseViewType]

/**
 * DatabaseFilterOperator - Supported filter operations
 */
export const DatabaseFilterOperator = {
  EQUALS: 'equals',
  NOT_EQUALS: 'notEquals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  IS_EMPTY: 'isEmpty',
  IS_NOT_EMPTY: 'isNotEmpty',
  GREATER_THAN: 'gt',
  LESS_THAN: 'lt',
  GREATER_OR_EQUAL: 'gte',
  LESS_OR_EQUAL: 'lte',
} as const

export type DatabaseFilterOperatorValue =
  (typeof DatabaseFilterOperator)[keyof typeof DatabaseFilterOperator]

/**
 * DatabaseFilter - A single filter condition for database queries
 */
export interface DatabaseFilter {
  id: string // Unique ID for this filter
  columnId: string
  operator: DatabaseFilterOperatorValue
  value?: unknown // Value to compare (not needed for isEmpty/isNotEmpty)
}

/**
 * DatabaseSort - Sort configuration for database entries
 */
export interface DatabaseSort {
  columnId: string
  direction: 'asc' | 'desc'
}

/**
 * DatabaseViewConfig - Complete view state for a database block
 * Persisted in block properties for state restoration
 */
export interface DatabaseViewConfig {
  viewType: DatabaseViewTypeValue
  filters: DatabaseFilter[]
  sortBy: DatabaseSort | null
  groupBy: string | null // Column ID for grouping (used in Kanban view)
  hiddenColumns: string[] // Column IDs to hide
}

/**
 * DatabaseViewBlockAttributes - Attributes for the DatabaseViewBlock Tiptap extension
 */
export interface DatabaseViewBlockAttributes extends DatabaseViewConfig {
  databaseId: string | null // null = "Create New" or "Link" mode
}

// =============================================================================
// Phase 12: Deals Database Schema (Org-Level)
// =============================================================================

/**
 * Deal Stage Options for STATUS column type
 */
export const DEAL_STAGE_OPTIONS: StatusOption[] = [
  { id: 'SOURCING', name: 'Sourcing', color: 'gray' },
  { id: 'INITIAL_REVIEW', name: 'Initial Review', color: 'blue' },
  { id: 'PRELIMINARY_DUE_DILIGENCE', name: 'Prelim DD', color: 'blue' },
  { id: 'DEEP_DUE_DILIGENCE', name: 'Deep DD', color: 'purple' },
  { id: 'NEGOTIATION', name: 'Negotiation', color: 'yellow' },
  { id: 'CLOSING', name: 'Closing', color: 'yellow' },
  { id: 'CLOSED_WON', name: 'Closed Won', color: 'green' },
  { id: 'CLOSED_LOST', name: 'Closed Lost', color: 'red' },
]

/**
 * Deal Priority Options for STATUS column type
 */
export const DEAL_PRIORITY_OPTIONS: StatusOption[] = [
  { id: 'NONE', name: 'None', color: 'gray' },
  { id: 'LOW', name: 'Low', color: 'gray' },
  { id: 'MEDIUM', name: 'Medium', color: 'blue' },
  { id: 'HIGH', name: 'High', color: 'yellow' },
  { id: 'URGENT', name: 'Urgent', color: 'red' },
]

/**
 * Deal Source Options for SELECT column type
 */
export const DEAL_SOURCE_OPTIONS: string[] = [
  'Referral',
  'Outbound',
  'Inbound',
  'Auction',
  'Network',
  'Other',
]

/**
 * Deal Type Options for SELECT column type
 */
export const DEAL_TYPE_OPTIONS: string[] = [
  'Acquisition',
  'Investment',
  'Partnership',
  'Other',
]

/**
 * DEALS_DATABASE_SCHEMA - Schema for the org-level Deals Database
 * This is the standard schema used when creating the Deals Database for an organization.
 * Columns match the Deal model fields for seamless data mapping.
 */
export const DEALS_DATABASE_SCHEMA: DatabaseSchema = {
  columns: [
    {
      id: 'name',
      name: 'Name',
      type: 'TEXT',
      width: 200,
    },
    {
      id: 'stage',
      name: 'Stage',
      type: 'STATUS',
      statusOptions: DEAL_STAGE_OPTIONS,
      width: 140,
    },
    {
      id: 'type',
      name: 'Type',
      type: 'SELECT',
      options: DEAL_TYPE_OPTIONS,
      width: 120,
    },
    {
      id: 'priority',
      name: 'Priority',
      type: 'STATUS',
      statusOptions: DEAL_PRIORITY_OPTIONS,
      width: 100,
    },
    {
      id: 'value',
      name: 'Value',
      type: 'NUMBER',
      width: 120,
    },
    {
      id: 'probability',
      name: 'Probability',
      type: 'NUMBER',
      width: 100,
    },
    {
      id: 'source',
      name: 'Source',
      type: 'SELECT',
      options: DEAL_SOURCE_OPTIONS,
      width: 120,
    },
    {
      id: 'expectedCloseDate',
      name: 'Expected Close',
      type: 'DATE',
      width: 140,
    },
    {
      id: 'leadPartner',
      name: 'Lead Partner',
      type: 'PERSON',
      width: 140,
    },
  ],
}

/**
 * DEALS_DATABASE_NAME - Standard name for org-level Deals Database
 */
export const DEALS_DATABASE_NAME = 'Deals'

/**
 * DEALS_DATABASE_DESCRIPTION - Description for org-level Deals Database
 */
export const DEALS_DATABASE_DESCRIPTION = 'Organization deals pipeline powered by Notion-style database'
