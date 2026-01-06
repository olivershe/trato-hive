/**
 * Types Index - Central export for all type definitions
 * Usage: import { User, Deal, Company } from '@trato-hive/shared/types'
 */

// User & Organization Types
export type {
  User,
  Organization,
  OrganizationMember,
  UserWithOrganizations,
  OrganizationWithMembers,
} from './user'
export { OrganizationRole } from './user'

// Company Types
export type {
  Company,
  CompanyWithDeals,
  CompanyWithFacts,
  CompanyWithDocuments,
  Company360,
} from './company'
export { CompanyStatus } from './company'

// Deal Types
export type { Deal, DealWithCompany, DealWithDocuments, DealWithFacts, Deal360 } from './deal'
export { DealStage, DealType } from './deal'

// Document Types
export type {
  Document,
  DocumentChunk,
  DocumentWithChunks,
  DocumentWithFacts,
  DocumentWithUploader,
} from './document'
export { DocumentType, DocumentStatus } from './document'

// Fact Types
export type { Fact, FactWithSources, FactWithCompany } from './fact'
export { FactType } from './fact'

// Activity Types
export type { Activity, ActivityWithUser, ActivityWithDeal } from './activity'
export { ActivityType } from './activity'

// API Types
export type { ApiResponse, PaginatedResponse } from './api'
export { ErrorCode, AppError } from './api'

// Database Types (Inline Database System)
export type {
  DatabaseColumn,
  DatabaseSchema,
  Database,
  DatabaseEntry,
  DatabaseWithEntries,
  DatabaseWithCreator,
  DatabaseEntryWithCreator,
  DatabaseEntryWithFacts,
  DatabaseTemplate,
} from './database'
export { DatabaseColumnType, DATABASE_TEMPLATES } from './database'
