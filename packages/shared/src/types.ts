/**
 * Shared TypeScript types and interfaces
 * Re-exports from types/ directory for backwards compatibility
 */

export * from './types'

// Explicit exports to ensure constants survive bundling
export {
  DATABASE_TEMPLATES,
  DatabaseViewType,
  DatabaseFilterOperator,
} from './types/database'

// Explicit exports for deal constants
export { DealStage, DealType } from './types/deal'

// Explicit exports for activity constants
export { ActivityType } from './types/activity'
