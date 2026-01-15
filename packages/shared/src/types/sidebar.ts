/**
 * Sidebar Types - Navigation sidebar item types and interfaces
 * Used by: apps/web/src/stores/sidebar.ts, Sidebar.tsx
 */

/**
 * Type constants for sidebar items
 */
export const SidebarItemType = {
  DEAL: 'deal',
  COMPANY: 'company',
  DOCUMENT: 'document',
  PAGE: 'page',
  MODULE: 'module',
} as const

export type SidebarItemTypeValue =
  (typeof SidebarItemType)[keyof typeof SidebarItemType]

/**
 * Metadata for sidebar items based on entity type
 */
export interface SidebarItemMetadata {
  /** Deal stage (for deal items) */
  stage?: string
  /** Company industry (for company items) */
  industry?: string
  /** Last updated timestamp (for documents/pages) */
  updatedAt?: string
  /** Deal value (for deal items) */
  value?: number
  /** Entity color/status indicator */
  color?: string
}

/**
 * Core sidebar item interface
 * Represents any navigable item in the sidebar (pinned, recent, or module)
 */
export interface SidebarItem {
  /** Unique identifier (entity ID or route path) */
  id: string
  /** Type of sidebar item for icon/behavior mapping */
  type: SidebarItemTypeValue
  /** Display title */
  title: string
  /** Icon name (Lucide icon key) */
  icon: string
  /** Navigation href */
  href: string
  /** Nested items (sub-pages, children) */
  children?: SidebarItem[]
  /** Optional metadata for rich display */
  metadata?: SidebarItemMetadata
}

/**
 * Sidebar section configuration
 */
export interface SidebarSection {
  /** Section identifier */
  id: string
  /** Section title */
  title: string
  /** Items in this section */
  items: SidebarItem[]
  /** Whether section is collapsible */
  collapsible?: boolean
  /** Maximum items allowed */
  maxItems?: number
}
