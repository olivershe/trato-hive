/**
 * Company Validators
 *
 * Zod schemas for Company CRUD operations.
 * Used by: apps/api/src/routers/company.ts
 */
import { z } from 'zod'
import { CompanyStatus } from '../types/company'

const companyStatusValues = Object.values(CompanyStatus) as [string, ...string[]]

export const createCompanySchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID'),
  name: z.string().min(1, 'Name is required'),
  domain: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  founded: z.number().int().min(1000).max(new Date().getFullYear()).nullable().optional(),
  employees: z.number().int().min(0).nullable().optional(),
  revenue: z.number().min(0).nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  linkedin: z.string().url().nullable().optional(),
  status: z.enum(companyStatusValues).default(CompanyStatus.PROSPECT),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().cuid('Invalid company ID'),
})

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>

// =============================================================================
// Router-specific schemas (organizationId comes from session context)
// =============================================================================

/**
 * Router create schema - organizationId injected from context
 */
export const routerCreateCompanySchema = createCompanySchema.omit({ organizationId: true })

export type RouterCreateCompanyInput = z.infer<typeof routerCreateCompanySchema>

/**
 * Router update schema - organizationId injected from context
 */
export const routerUpdateCompanySchema = updateCompanySchema.omit({ organizationId: true })

export type RouterUpdateCompanyInput = z.infer<typeof routerUpdateCompanySchema>

// Note: CompanyListInput, CompanyGetInput, CompanySearchInput are defined in
// ./discovery.ts and re-exported from there to avoid duplication.
