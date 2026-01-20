/**
 * Deal Validators
 */
import { z } from 'zod'
import { DealType, DealStage, DealPriority, DealSource, FieldType } from '../types/deal'

const dealTypeValues = Object.values(DealType) as [string, ...string[]]
const dealStageValues = Object.values(DealStage) as [string, ...string[]]
const dealPriorityValues = Object.values(DealPriority) as [string, ...string[]]
const dealSourceValues = Object.values(DealSource) as [string, ...string[]]
const fieldTypeValues = Object.values(FieldType) as [string, ...string[]]

export const createDealSchema = z.object({
  organizationId: z.string().cuid({ message: 'Invalid organization ID' }),
  companyId: z.string().cuid({ message: 'Invalid company ID' }).nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(dealTypeValues, { errorMap: () => ({ message: 'Invalid deal type' }) }),
  stage: z.enum(dealStageValues, { errorMap: () => ({ message: 'Invalid deal stage' }) }),
  value: z.number().min(0).nullable().optional(),
  currency: z.string().default('USD'),
  probability: z.number().min(0).max(100).nullable().optional(),
  expectedCloseDate: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // Notion-style database fields
  leadPartnerId: z.string().cuid().nullable().optional(),
  priority: z.enum(dealPriorityValues).default('NONE'),
  source: z.enum(dealSourceValues).nullable().optional(),
  customFields: z.record(z.unknown()).nullable().optional(),
})

export type CreateDealInput = z.infer<typeof createDealSchema>

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().cuid({ message: 'Invalid deal ID' }),
})

export type UpdateDealInput = z.infer<typeof updateDealSchema>

/**
 * Deal List Input - Pagination, filtering, and sorting
 */
export const dealListInputSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  filter: z
    .object({
      stage: z.enum(dealStageValues).optional(),
      type: z.enum(dealTypeValues).optional(),
      priority: z.enum(dealPriorityValues).optional(),
      source: z.enum(dealSourceValues).optional(),
      leadPartnerId: z.string().cuid().optional(),
      search: z.string().optional(),
      companyId: z.string().cuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(['name', 'value', 'stage', 'priority', 'createdAt', 'expectedCloseDate'])
        .default('createdAt'),
      order: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional(),
})

export type DealListInput = z.infer<typeof dealListInputSchema>

/**
 * Deal Get Input - Single deal by ID
 */
export const dealGetInputSchema = z.object({
  id: z.string().min(1, { message: 'Deal ID is required' }),
})

export type DealGetInput = z.infer<typeof dealGetInputSchema>

/**
 * Router-specific create schema (organizationId comes from context)
 */
export const routerCreateDealSchema = createDealSchema.omit({ organizationId: true })

export type RouterCreateDealInput = z.infer<typeof routerCreateDealSchema>

/**
 * Router-specific update schema (organizationId comes from context)
 */
export const routerUpdateDealSchema = updateDealSchema.omit({ organizationId: true })

export type RouterUpdateDealInput = z.infer<typeof routerUpdateDealSchema>

// =============================================================================
// View Config Schemas
// =============================================================================

/**
 * Deal View Config Schema - User preferences for deals database view
 */
export const dealViewConfigSchema = z.object({
  columnOrder: z.array(z.string()).default([]),
  hiddenColumns: z.array(z.string()).default([]),
  columnWidths: z.record(z.number()).default({}),
  defaultView: z.string().default('table'),
  sortBy: z.string().nullable().optional(),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional(),
  filters: z.record(z.unknown()).nullable().optional(),
})

export type DealViewConfigInput = z.infer<typeof dealViewConfigSchema>

/**
 * Update View Config Schema - Partial update for view preferences
 */
export const updateViewConfigSchema = dealViewConfigSchema.partial()

export type UpdateViewConfigInput = z.infer<typeof updateViewConfigSchema>

// =============================================================================
// Field Schema Schemas
// =============================================================================

/**
 * Status option schema for STATUS field type
 */
const statusOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
})

/**
 * Create Field Schema - For adding custom fields
 * options can be:
 * - string[] for SELECT/MULTI_SELECT
 * - StatusOption[] for STATUS
 * - null for other types
 */
export const createFieldSchemaSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(50),
  type: z.enum(fieldTypeValues, { errorMap: () => ({ message: 'Invalid field type' }) }),
  options: z.union([
    z.array(z.string()),
    z.array(statusOptionSchema),
  ]).nullable().optional(),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
})

export type CreateFieldSchemaInput = z.infer<typeof createFieldSchemaSchema>

/**
 * Update Field Schema - For modifying custom fields
 */
export const updateFieldSchemaSchema = createFieldSchemaSchema.partial().extend({
  id: z.string().cuid({ message: 'Invalid field ID' }),
})

export type UpdateFieldSchemaInput = z.infer<typeof updateFieldSchemaSchema>

/**
 * Delete Field Schema - For removing custom fields
 */
export const deleteFieldSchemaSchema = z.object({
  id: z.string().cuid({ message: 'Invalid field ID' }),
})

export type DeleteFieldSchemaInput = z.infer<typeof deleteFieldSchemaSchema>
