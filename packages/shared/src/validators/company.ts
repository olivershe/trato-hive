/**
 * Company Validators
 */
import { z } from 'zod'
import { CompanyStatus } from '../types/company'

const companyStatusValues = Object.values(CompanyStatus) as [string, ...string[]]

export const createCompanySchema = z.object({
  organizationId: z.string().cuid('Invalid organization ID'),
  name: z.string().min(1, 'Name is required'),
  domain: z.string().nullable().optional(), // Could add domain regex
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
