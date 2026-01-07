/**
 * AI Suggestion Validators
 *
 * Zod schemas for validating AI suggestion inputs.
 */
import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const suggestionEntityTypeSchema = z.enum(['Deal', 'Company', 'Database'])

export const suggestionStatusSchema = z.enum(['pending', 'accepted', 'dismissed'])

// =============================================================================
// AI Suggestion Block Attributes
// =============================================================================

export const aiSuggestionAttributesSchema = z.object({
  suggestionId: z.string().min(1),
  entityType: suggestionEntityTypeSchema,
  entityId: z.string().cuid(),
  field: z.string().optional(),
  columnId: z.string().optional(),
  entryId: z.string().cuid().optional(),
  currentValue: z.unknown().optional(),
  suggestedValue: z.unknown(),
  confidence: z.number().min(0).max(1),
  factIds: z.array(z.string().cuid()),
  sourceText: z.string().optional(),
  documentName: z.string().optional(),
  status: suggestionStatusSchema,
})

export type AISuggestionAttributesInput = z.infer<typeof aiSuggestionAttributesSchema>

// =============================================================================
// Apply Suggestion
// =============================================================================

export const applySuggestionSchema = z.object({
  suggestionId: z.string().min(1),
  entityType: suggestionEntityTypeSchema,
  entityId: z.string().cuid(),
  field: z.string().optional(),
  columnId: z.string().optional(),
  entryId: z.string().cuid().optional(),
  value: z.unknown(),
  factIds: z.array(z.string().cuid()),
})

export type ApplySuggestionInput = z.infer<typeof applySuggestionSchema>

// =============================================================================
// Dismiss Suggestion
// =============================================================================

export const dismissSuggestionSchema = z.object({
  suggestionId: z.string().min(1),
  entityType: suggestionEntityTypeSchema,
  entityId: z.string().cuid(),
  field: z.string().optional(),
  reason: z.string().max(500).optional(),
})

export type DismissSuggestionInput = z.infer<typeof dismissSuggestionSchema>

// =============================================================================
// Generate Suggestions
// =============================================================================

export const generateSuggestionsSchema = z.object({
  dealId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  databaseId: z.string().cuid().optional(),
  minConfidence: z.number().min(0).max(1).default(0.7),
  maxSuggestions: z.number().min(1).max(50).default(10),
}).refine(
  (data) => data.dealId || data.companyId,
  { message: 'Either dealId or companyId must be provided' }
)

export type GenerateSuggestionsInput = z.infer<typeof generateSuggestionsSchema>
