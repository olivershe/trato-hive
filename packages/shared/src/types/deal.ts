/**
 * Deal Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

import type { Company } from './company'
import type { Document } from './document'

/**
 * DealCompanyRole - Role of company in a deal
 * Maps to Prisma enum DealCompanyRole
 */
export const DealCompanyRole = {
  PLATFORM: 'PLATFORM',
  ADD_ON: 'ADD_ON',
  SELLER: 'SELLER',
  BUYER: 'BUYER',
  ADVISOR: 'ADVISOR',
} as const

export type DealCompanyRoleValue = (typeof DealCompanyRole)[keyof typeof DealCompanyRole]

/**
 * DealCompanyRelation - Company associated with a deal via junction table
 */
export interface DealCompanyRelation {
  id: string
  dealId: string
  companyId: string
  role: DealCompanyRoleValue
  createdAt: Date
  company: Pick<Company, 'id' | 'name' | 'industry'>
}

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
 * DealPriority - Priority level for deals
 */
export const DealPriority = {
  NONE: 'NONE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const

export type DealPriorityValue = (typeof DealPriority)[keyof typeof DealPriority]

/**
 * DealSource - How the deal was sourced
 */
export const DealSource = {
  REFERRAL: 'REFERRAL',
  OUTBOUND: 'OUTBOUND',
  INBOUND: 'INBOUND',
  AUCTION: 'AUCTION',
  NETWORK: 'NETWORK',
  OTHER: 'OTHER',
} as const

export type DealSourceValue = (typeof DealSource)[keyof typeof DealSource]

/**
 * FieldType - Types for custom fields
 */
export const FieldType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  SELECT: 'SELECT',
  MULTI_SELECT: 'MULTI_SELECT',
  DATE: 'DATE',
  PERSON: 'PERSON',
  CHECKBOX: 'CHECKBOX',
  URL: 'URL',
  STATUS: 'STATUS',
  RELATION: 'RELATION',
  ROLLUP: 'ROLLUP',
  FORMULA: 'FORMULA',
} as const

export type FieldTypeValue = (typeof FieldType)[keyof typeof FieldType]

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
  // Notion-style database fields
  leadPartnerId: string | null
  priority: DealPriorityValue
  source: DealSourceValue | null
  customFields: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

/**
 * DealWithLeadPartner - Deal with lead partner user details
 */
export interface DealWithLeadPartner extends Deal {
  leadPartner: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
}

/**
 * StatusOption - Status badge configuration for STATUS fields
 */
export interface StatusOption {
  id: string
  name: string
  color: string
}

/**
 * DealFieldSchema - Custom field definition for organization
 * options can be:
 * - string[] for SELECT/MULTI_SELECT
 * - StatusOption[] for STATUS
 * - null for other types
 */
export interface DealFieldSchema {
  id: string
  organizationId: string
  name: string
  type: FieldTypeValue
  options: string[] | StatusOption[] | null
  required: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

/**
 * DealViewConfig - User's view preferences for deals database
 */
export interface DealViewConfig {
  id: string
  userId: string
  organizationId: string
  columnOrder: string[]
  hiddenColumns: string[]
  columnWidths: Record<string, number>
  defaultView: string
  sortBy: string | null
  sortDirection: 'asc' | 'desc' | null
  filters: Record<string, unknown> | null
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
 * DealWithCompanies - Deal with all associated companies via junction table
 * Used for: Pipeline view with multi-company display [TASK-119]
 */
export interface DealWithCompanies extends DealWithCompany {
  dealCompanies: DealCompanyRelation[]
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
