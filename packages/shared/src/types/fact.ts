/**
 * Fact Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

/**
 * FactType - Classification of extracted fact
 */
export const FactType = {
  FINANCIAL_METRIC: 'FINANCIAL_METRIC',
  KEY_PERSON: 'KEY_PERSON',
  PRODUCT: 'PRODUCT',
  CUSTOMER: 'CUSTOMER',
  RISK: 'RISK',
  OPPORTUNITY: 'OPPORTUNITY',
  OTHER: 'OTHER',
} as const

export type FactTypeValue = (typeof FactType)[keyof typeof FactType]

/**
 * Fact - Verifiable fact from semantic layer (Layer 2: Knowledge Graph)
 */
export interface Fact {
  id: string
  documentId: string | null
  companyId: string | null
  type: FactTypeValue
  subject: string
  predicate: string
  object: string
  confidence: number // 0.0 - 1.0
  sourceChunkId: string | null
  sourceText: string | null
  extractedBy: string // e.g., "claude-sonnet-4.5"
  createdAt: Date
  updatedAt: Date
}

/**
 * FactWithSources - Fact with complete source citation
 * Used for: Fact Sheet, Citation modal, Verifiable displays
 */
export interface FactWithSources extends Fact {
  document: {
    id: string
    name: string
    fileUrl: string
    type: string
  } | null
  sourceChunk: {
    id: string
    content: string
    pageNumber: number | null
    boundingBox: unknown | null
  } | null
}

/**
 * FactWithCompany - Fact with associated company
 * Used for: Company 360° view, company analytics
 */
export interface FactWithCompany extends Fact {
  company: {
    id: string
    name: string
    status: string
  } | null
}
