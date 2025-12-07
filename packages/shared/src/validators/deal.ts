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
