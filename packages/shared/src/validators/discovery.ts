/**
 * Discovery Validators
 *
 * Zod schemas for company search and sourcing operations.
 * Used by sourcingRouter in apps/api.
 */
import { z } from 'zod'

/**
 * Company status values for filtering
 */
const companyStatusEnum = z.enum([
  'PROSPECT',
  'RESEARCHING',
  'ENGAGED',
  'PIPELINE',
  'ARCHIVED',
])

/**
 * Company Search Input - Text-based search across Company fields
 *
 * Searches: name, industry, description, sector, location
 */
export const companySearchInputSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200),
  filters: z
    .object({
      status: companyStatusEnum.optional(),
      industry: z.string().optional(),
      minRevenue: z.number().min(0).optional(),
      maxRevenue: z.number().min(0).optional(),
      location: z.string().optional(),
    })
    .optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(12),
})

export type CompanySearchInput = z.infer<typeof companySearchInputSchema>

/**
 * Company List Input - Paginated list with optional filters
 */
export const companyListInputSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(50).default(20),
  filter: z
    .object({
      status: companyStatusEnum.optional(),
      industry: z.string().optional(),
      hasDeals: z.boolean().optional(),
    })
    .optional(),
  sort: z
    .object({
      field: z
        .enum(['name', 'industry', 'revenue', 'createdAt', 'aiScore'])
        .default('createdAt'),
      order: z.enum(['asc', 'desc']).default('desc'),
    })
    .optional(),
})

export type CompanyListInput = z.infer<typeof companyListInputSchema>

/**
 * Get Single Company Input
 */
export const companyGetInputSchema = z.object({
  id: z.string().cuid({ message: 'Invalid company ID' }),
})

export type CompanyGetInput = z.infer<typeof companyGetInputSchema>
