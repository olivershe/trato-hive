/**
 * @trato-hive/shared
 *
 * Shared utilities, types, and Zod validators used across all packages
 * Layer: Cross-cutting
 */

export * from './validators'
export * from './types'
export * from './utils'
export * from './constants'

// Explicit re-exports to ensure bundler includes these (fixes tree-shaking issue)
export { SidebarItemType } from './types/sidebar'
export type {
  SidebarItemTypeValue,
  SidebarItem,
  SidebarItemMetadata,
  SidebarSection,
} from './types/sidebar'

// Alert type re-exports [TASK-120]
export { AlertType, AlertPriority, AlertStatus } from './types/alert'
export type {
  AlertTypeValue,
  AlertPriorityValue,
  AlertStatusValue,
  DealAlert,
  AlertListResult,
} from './types/alert'

// Phase 12: Deals Database schema exports
export {
  DEAL_STAGE_OPTIONS,
  DEAL_PRIORITY_OPTIONS,
  DEAL_SOURCE_OPTIONS,
  DEAL_TYPE_OPTIONS,
  DEALS_DATABASE_SCHEMA,
  DEALS_DATABASE_NAME,
  DEALS_DATABASE_DESCRIPTION,
} from './types/database'
export type { DatabaseSchema } from './types/database'
