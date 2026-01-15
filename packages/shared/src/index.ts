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
