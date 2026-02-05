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
export type {
  Deal,
  DealWithCompany,
  DealWithCompanies,
  DealWithDocuments,
  DealWithFacts,
  Deal360,
  DealStageValue,
  DealTypeValue,
  DealCompanyRoleValue,
  DealCompanyRelation,
} from './deal'
export { DealStage, DealType, DealCompanyRole } from './deal'

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
export type {
  Activity,
  ActivityWithUser,
  ActivityWithDeal,
  ActivityTypeValue,
  ActivityStatusValue,
} from './activity'
export { ActivityType, ActivityStatus } from './activity'

// API Types
export type { ApiResponse, PaginatedResponse } from './api'
export { ErrorCode, AppError } from './api'

// Database Types (Inline Database System)
export type {
  DatabaseColumnTypeValue,
  DatabaseColumn,
  DatabaseSchema,
  Database,
  DatabaseEntry,
  DatabaseWithEntries,
  DatabaseWithCreator,
  DatabaseEntryWithCreator,
  DatabaseEntryWithFacts,
  DatabaseTemplate,
  DatabaseFilter,
  DatabaseFilterOperatorValue,
  DatabaseSort,
  DatabaseViewConfig,
  DatabaseViewTypeValue,
  DatabaseViewBlockAttributes,
} from './database'
export {
  DatabaseColumnType,
  DATABASE_TEMPLATES,
  DatabaseViewType,
  DatabaseFilterOperator,
  // Phase 12: Deals Database
  DEAL_STAGE_OPTIONS,
  DEAL_PRIORITY_OPTIONS,
  DEAL_SOURCE_OPTIONS,
  DEAL_TYPE_OPTIONS,
  DEALS_DATABASE_SCHEMA,
  DEALS_DATABASE_NAME,
  DEALS_DATABASE_DESCRIPTION,
} from './database'

// AI Suggestion Types
export type {
  SuggestionEntityType,
  SuggestionStatus,
  AISuggestionAttributes,
  ApplySuggestionInput,
  DismissSuggestionInput,
  ApplySuggestionResult,
  DismissSuggestionResult,
  DealFieldSuggestion,
  DatabaseEntrySuggestion,
  EntitySuggestions,
} from './suggestion'

// Dashboard Types (Command Center)
export type {
  StageMetric,
  TypeMetric,
  PipelineHealthResult,
  ActivityFeedItem,
  RecentActivitiesResult,
  ActivitySummary,
  ActivitySummaryResult,
} from './dashboard'

// Generator Types (Document Export)
export type {
  ExportResult,
  CitationReference,
  GeneratorExportOptions,
  ExportFormat,
} from './generator'
export { EXPORT_MIME_TYPES } from './generator'

// Sidebar Types (Navigation System)
export type {
  SidebarItemTypeValue,
  SidebarItem,
  SidebarItemMetadata,
  SidebarSection,
} from './sidebar'
export { SidebarItemType } from './sidebar'

// Q&A Answer Types (Q&A Review Flow)
export type {
  QAAnswerStatusValue,
  QACitation,
  QAAnswer,
  QAAnswerWithReviewer,
  QAAnswerWithDeal,
  QAApprovedMetadata,
  QAEditedMetadata,
  QARejectedMetadata,
} from './qa'
export { QAAnswerStatus } from './qa'

// Copilot UI Block Types
export type {
  CopilotBlockComponent,
  CopilotBlockLayout,
  UIBlock,
} from './copilot-ui'

// Alert Types (AI Pipeline Alerts)
export type {
  AlertTypeValue,
  AlertPriorityValue,
  AlertStatusValue,
  DealAlert,
  AlertListResult,
} from './alert'
export { AlertType, AlertPriority, AlertStatus } from './alert'
