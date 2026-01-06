/**
 * Database Validators (Inline Database System)
 */
import { z } from 'zod'
import { DatabaseColumnType } from '../types/database'

const columnTypeValues = Object.values(DatabaseColumnType) as [string, ...string[]]

// =============================================================================
// Column Schema Validators
// =============================================================================

/**
 * Single column definition (with required ID)
 */
export const databaseColumnSchema = z.object({
  id: z.string().min(1, 'Column ID is required'),
  name: z.string().min(1, 'Column name is required').max(100, 'Column name too long'),
  type: z.enum(columnTypeValues, { errorMap: () => ({ message: 'Invalid column type' }) }),
  options: z.array(z.string()).optional(), // For SELECT/MULTI_SELECT
  width: z.number().min(50).max(500).optional(), // Column width in pixels
})

export type DatabaseColumnInput = z.infer<typeof databaseColumnSchema>

/**
 * Column input for create/add operations (ID optional, generated server-side)
 */
export const databaseColumnInputSchema = databaseColumnSchema.extend({
  id: z.string().min(1).optional(),
})

export type DatabaseColumnCreateInput = z.infer<typeof databaseColumnInputSchema>

/**
 * Database schema (collection of columns - IDs required)
 */
export const databaseSchemaSchema = z.object({
  columns: z
    .array(databaseColumnSchema)
    .min(1, 'At least one column is required')
    .max(50, 'Maximum 50 columns allowed'),
})

export type DatabaseSchemaInput = z.infer<typeof databaseSchemaSchema>

/**
 * Database schema input for create operations (IDs optional)
 */
export const databaseSchemaInputSchema = z.object({
  columns: z
    .array(databaseColumnInputSchema)
    .min(1, 'At least one column is required')
    .max(50, 'Maximum 50 columns allowed'),
})

export type DatabaseSchemaCreateInput = z.infer<typeof databaseSchemaInputSchema>

// =============================================================================
// Database CRUD Validators
// =============================================================================

/**
 * Create Database - Full schema with organizationId
 */
export const createDatabaseSchema = z.object({
  organizationId: z.string().cuid({ message: 'Invalid organization ID' }),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').nullable().optional(),
  schema: databaseSchemaInputSchema, // IDs optional, generated server-side
})

export type CreateDatabaseInput = z.infer<typeof createDatabaseSchema>

/**
 * Router-specific create schema (organizationId from context)
 */
export const routerCreateDatabaseSchema = createDatabaseSchema.omit({ organizationId: true })

export type RouterCreateDatabaseInput = z.infer<typeof routerCreateDatabaseSchema>

/**
 * Update Database - Partial update with ID
 */
export const updateDatabaseSchema = z.object({
  id: z.string().cuid({ message: 'Invalid database ID' }),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
})

export type UpdateDatabaseInput = z.infer<typeof updateDatabaseSchema>

/**
 * Update Database Schema - Modify columns
 */
export const updateDatabaseSchemaSchema = z.object({
  id: z.string().cuid({ message: 'Invalid database ID' }),
  schema: databaseSchemaSchema,
})

export type UpdateDatabaseSchemaInput = z.infer<typeof updateDatabaseSchemaSchema>

/**
 * Add Column to Database
 */
export const addColumnSchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  column: databaseColumnInputSchema, // ID optional, generated server-side
  position: z.number().int().min(0).optional(), // Insert position (default: end)
})

export type AddColumnInput = z.infer<typeof addColumnSchema>

/**
 * Update Column in Database
 */
export const updateColumnSchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  columnId: z.string().min(1, 'Column ID is required'),
  updates: databaseColumnSchema.partial().omit({ id: true }),
})

export type UpdateColumnInput = z.infer<typeof updateColumnSchema>

/**
 * Delete Column from Database
 */
export const deleteColumnSchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  columnId: z.string().min(1, 'Column ID is required'),
})

export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>

// =============================================================================
// Database Entry Validators
// =============================================================================

/**
 * Create Database Entry (row)
 */
export const createDatabaseEntrySchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  properties: z.record(z.unknown()), // Column values keyed by column ID
  suggestedBy: z.string().optional(), // AI agent identifier
  factIds: z.array(z.string().cuid()).optional(), // Source fact IDs
})

export type CreateDatabaseEntryInput = z.infer<typeof createDatabaseEntrySchema>

/**
 * Update Database Entry
 */
export const updateDatabaseEntrySchema = z.object({
  id: z.string().cuid({ message: 'Invalid entry ID' }),
  properties: z.record(z.unknown()).optional(),
})

export type UpdateDatabaseEntryInput = z.infer<typeof updateDatabaseEntrySchema>

/**
 * Update Single Cell - Optimized for inline editing
 */
export const updateCellSchema = z.object({
  entryId: z.string().cuid({ message: 'Invalid entry ID' }),
  columnId: z.string().min(1, 'Column ID is required'),
  value: z.unknown(),
})

export type UpdateCellInput = z.infer<typeof updateCellSchema>

/**
 * Delete Database Entry
 */
export const deleteDatabaseEntrySchema = z.object({
  id: z.string().cuid({ message: 'Invalid entry ID' }),
})

export type DeleteDatabaseEntryInput = z.infer<typeof deleteDatabaseEntrySchema>

/**
 * Reorder Entries - For drag-and-drop
 */
export const reorderEntriesSchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  entryIds: z.array(z.string().cuid()).min(1, 'At least one entry required'),
})

export type ReorderEntriesInput = z.infer<typeof reorderEntriesSchema>

// =============================================================================
// Query Validators
// =============================================================================

/**
 * Get Database by ID
 */
export const getDatabaseSchema = z.object({
  id: z.string().cuid({ message: 'Invalid database ID' }),
  includeEntries: z.boolean().default(true),
})

export type GetDatabaseInput = z.infer<typeof getDatabaseSchema>

/**
 * List Databases - Pagination
 */
export const listDatabasesSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().optional(),
})

export type ListDatabasesInput = z.infer<typeof listDatabasesSchema>

/**
 * Database Entries List - Pagination and filtering
 */
export const listEntriesSchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
  filters: z
    .array(
      z.object({
        columnId: z.string(),
        operator: z.enum(['equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'isEmpty', 'isNotEmpty']),
        value: z.unknown().optional(),
      })
    )
    .optional(),
  sort: z
    .object({
      columnId: z.string(),
      order: z.enum(['asc', 'desc']).default('asc'),
    })
    .optional(),
})

export type ListEntriesInput = z.infer<typeof listEntriesSchema>

// =============================================================================
// AI Suggestion Validators
// =============================================================================

/**
 * Suggest Entries from Facts - AI-powered row suggestions
 */
export const suggestEntriesFromFactsSchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  dealId: z.string().cuid({ message: 'Invalid deal ID' }),
  minConfidence: z.number().min(0).max(1).default(0.7),
  maxSuggestions: z.number().int().min(1).max(20).default(10),
})

export type SuggestEntriesFromFactsInput = z.infer<typeof suggestEntriesFromFactsSchema>

/**
 * Apply Suggested Entry - Accept AI suggestion
 */
export const applySuggestedEntrySchema = z.object({
  databaseId: z.string().cuid({ message: 'Invalid database ID' }),
  suggestion: createDatabaseEntrySchema.omit({ databaseId: true }),
})

export type ApplySuggestedEntryInput = z.infer<typeof applySuggestedEntrySchema>
