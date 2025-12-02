/**
 * Company Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

import type { Deal } from './deal'
import type { Document } from './document'

/**
 * CompanyStatus - Lifecycle status in the sourcing/pipeline
 */
export const CompanyStatus = {
  PROSPECT: 'PROSPECT',
  RESEARCHING: 'RESEARCHING',
  ENGAGED: 'ENGAGED',
  PIPELINE: 'PIPELINE',
  ARCHIVED: 'ARCHIVED',
} as const

export type CompanyStatusValue = (typeof CompanyStatus)[keyof typeof CompanyStatus]

/**
 * Company - Target company entity (Module 2: Discovery)
 */
export interface Company {
  id: string
  organizationId: string
  name: string
  domain: string | null
  description: string | null
  industry: string | null
  sector: string | null
  founded: number | null
  employees: number | null
  revenue: number | null // Decimal stored as number
  location: string | null
  website: string | null
  linkedin: string | null
  status: CompanyStatusValue
  aiSummary: string | null
  aiScore: number | null
  createdAt: Date
  updatedAt: Date
}

/**
 * CompanyWithDeals - Company with all associated deals
 * Used for: Company profile page, sourcing list
 */
export interface CompanyWithDeals extends Company {
  deals: Deal[]
}

/**
 * CompanyWithFacts - Company with verifiable facts from semantic layer
 * Used for: Company 360° view, AI insights
 */
export interface CompanyWithFacts extends Company {
  facts: Array<{
    id: string
    type: string
    subject: string
    predicate: string
    object: string
    confidence: number
    sourceText: string | null
    createdAt: Date
    document: {
      id: string
      name: string
      fileUrl: string
    } | null
  }>
}

/**
 * CompanyWithDocuments - Company with uploaded documents
 * Used for: Company data room, document management
 */
export interface CompanyWithDocuments extends Company {
  documents: Document[]
}

/**
 * Company 360° - Complete company view with all relations
 * Used for: Company profile page with all tabs
 */
export interface Company360 extends CompanyWithFacts {
  deals: Deal[]
  documents: Document[]
}
