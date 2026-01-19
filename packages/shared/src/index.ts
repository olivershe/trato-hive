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
