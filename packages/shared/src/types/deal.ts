/**
 * Deal Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

import type { Company } from './company'
import type { Document } from './document'

/**
 * DealStage - Pipeline stages for deal progression
 */
export const DealStage = {
  SOURCING: 'SOURCING',
  INITIAL_REVIEW: 'INITIAL_REVIEW',
  PRELIMINARY_DUE_DILIGENCE: 'PRELIMINARY_DUE_DILIGENCE',
  DEEP_DUE_DILIGENCE: 'DEEP_DUE_DILIGENCE',
  NEGOTIATION: 'NEGOTIATION',
  CLOSING: 'CLOSING',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST',
} as const

export type DealStageValue = (typeof DealStage)[keyof typeof DealStage]

/**
 * DealType - Type of deal/transaction
 */
export const DealType = {
  ACQUISITION: 'ACQUISITION',
  INVESTMENT: 'INVESTMENT',
  PARTNERSHIP: 'PARTNERSHIP',
  OTHER: 'OTHER',
} as const

export type DealTypeValue = (typeof DealType)[keyof typeof DealType]

/**
 * Deal - Core CRM entity for M&A transactions
 */
export interface Deal {
  id: string
  organizationId: string
  companyId: string | null
  name: string
  type: DealTypeValue
  stage: DealStageValue
  value: number | null // Decimal stored as number
  currency: string
  probability: number | null // 0-100
  expectedCloseDate: Date | null
  actualCloseDate: Date | null
  description: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * DealWithCompany - Deal with associated company details
 * Used for: Pipeline view, Deal cards, Deal list
 */
export interface DealWithCompany extends Deal {
  company: Company | null
}

/**
 * DealWithDocuments - Deal with all uploaded documents
 * Used for: Deal 360° view, Diligence tab
 */
export interface DealWithDocuments extends Deal {
  documents: Document[]
}

/**
 * DealWithFacts - Deal with verifiable facts from semantic layer
 * Used for: Fact Sheet generation, AI-powered deal insights
 */
export interface DealWithFacts extends DealWithCompany {
  facts: Array<{
    id: string
    type: string
    subject: string
    predicate: string
    object: string
    confidence: number
    sourceText: string | null
    createdAt: Date
  }>
}

/**
 * Deal 360° - Complete deal view with all relations
 * Used for: Deal 360° page with all tabs
 */
export interface Deal360 extends DealWithCompany {
  documents: Document[]
  activities: Array<{
    id: string
    type: string
    description: string
    metadata: unknown
    createdAt: Date
    user: {
      id: string
      name: string | null
      email: string
    } | null
  }>
}
