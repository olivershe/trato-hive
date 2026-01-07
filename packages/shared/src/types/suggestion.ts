/**
 * AI Suggestion Types
 *
 * Types for AI-suggested field updates and database entries.
 * Used by AISuggestionBlock in the editor.
 */

// =============================================================================
// Entity Types
// =============================================================================

/**
 * Entity types that can receive AI suggestions
 */
export type SuggestionEntityType = 'Deal' | 'Company' | 'Database'

/**
 * Suggestion status for tracking acceptance/dismissal
 */
export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed'

// =============================================================================
// Suggestion Attributes (Block Protocol)
// =============================================================================

/**
 * Attributes stored in AISuggestionBlock
 * Used by Tiptap extension and frontend rendering
 */
export interface AISuggestionAttributes {
  /** Unique identifier for this suggestion */
  suggestionId: string

  /** Type of entity being updated */
  entityType: SuggestionEntityType

  /** ID of the entity (Deal, Company, or Database) */
  entityId: string

  /** Field name for Deal/Company updates (e.g., "value", "probability") */
  field?: string

  /** Column ID for Database entry suggestions */
  columnId?: string

  /** Entry ID for updating existing database entries */
  entryId?: string

  /** Current value before suggestion (for comparison display) */
  currentValue?: unknown

  /** AI-suggested new value */
  suggestedValue: unknown

  /** Confidence score from 0.0 to 1.0 */
  confidence: number

  /** Source fact IDs for traceability */
  factIds: string[]

  /** Source text excerpt */
  sourceText?: string

  /** Source document name */
  documentName?: string

  /** Current status of the suggestion */
  status: SuggestionStatus
}

// =============================================================================
// API Types
// =============================================================================

/**
 * Input for applying a suggestion
 */
export interface ApplySuggestionInput {
  /** Suggestion ID from the block */
  suggestionId: string

  /** Entity type being updated */
  entityType: SuggestionEntityType

  /** Entity ID to update */
  entityId: string

  /** Field name for Deal/Company updates */
  field?: string

  /** Column ID for Database updates */
  columnId?: string

  /** Entry ID for Database entry updates */
  entryId?: string

  /** Value to apply */
  value: unknown

  /** Source fact IDs for audit trail */
  factIds: string[]
}

/**
 * Input for dismissing a suggestion
 */
export interface DismissSuggestionInput {
  /** Suggestion ID from the block */
  suggestionId: string

  /** Entity type (for audit logging) */
  entityType: SuggestionEntityType

  /** Entity ID (for audit logging) */
  entityId: string

  /** Field name (for audit logging) */
  field?: string

  /** Reason for dismissal (optional) */
  reason?: string
}

/**
 * Result of applying a suggestion
 */
export interface ApplySuggestionResult {
  success: boolean
  entityType: SuggestionEntityType
  entityId: string
  field?: string
  previousValue?: unknown
  newValue: unknown
  activityId: string
}

/**
 * Result of dismissing a suggestion
 */
export interface DismissSuggestionResult {
  success: boolean
  activityId: string
}

// =============================================================================
// Suggestion Generation Types
// =============================================================================

/**
 * Generated suggestion for a deal field
 */
export interface DealFieldSuggestion {
  field: string
  currentValue?: unknown
  suggestedValue: unknown
  confidence: number
  factIds: string[]
  sourceText?: string
  documentName?: string
}

/**
 * Generated suggestion for a database entry
 */
export interface DatabaseEntrySuggestion {
  databaseId: string
  columnId: string
  suggestedValue: unknown
  confidence: number
  factIds: string[]
  sourceText?: string
  documentName?: string
}

/**
 * Collection of suggestions for an entity
 */
export interface EntitySuggestions {
  dealId?: string
  companyId?: string
  databaseId?: string
  fieldSuggestions: DealFieldSuggestion[]
  entrySuggestions: DatabaseEntrySuggestion[]
}
