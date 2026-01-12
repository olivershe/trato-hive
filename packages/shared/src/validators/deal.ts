/**
 * Deal Validators
 */
import { z } from 'zod'
import { DealType, DealStage } from '../types/deal'

const dealTypeValues = Object.values(DealType) as [string, ...string[]]
const dealStageValues = Object.values(DealStage) as [string, ...string[]]

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
      search: z.string().optional(),
      companyId: z.string().cuid().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(['name', 'value', 'stage', 'createdAt', 'expectedCloseDate'])
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
