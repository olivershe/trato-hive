/**
 * Suggestion Service
 *
 * Business logic for AI suggestion acceptance/dismissal.
 * Handles applying suggestions to Deals, Companies, and Databases.
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, Prisma } from '@trato-hive/db'
import { ActivityType } from '@trato-hive/db'
import { ActivityService } from './activity.service'
import { FactMapperService } from './fact-mapper.service'

// =============================================================================
// Types - Import from shared validators for consistency
// =============================================================================
import type {
  ApplySuggestionInput as ZodApplySuggestionInput,
  DismissSuggestionInput as ZodDismissSuggestionInput,
} from '@trato-hive/shared'

export type SuggestionEntityType = 'Deal' | 'Company' | 'Database'

// Use Zod-inferred types for consistency with router
export type ApplySuggestionInput = ZodApplySuggestionInput
export type DismissSuggestionInput = ZodDismissSuggestionInput

export interface ApplySuggestionResult {
  success: boolean
  entityType: SuggestionEntityType
  entityId: string
  field?: string
  previousValue?: unknown
  newValue: unknown
  activityId: string
}

export interface DismissSuggestionResult {
  success: boolean
  activityId: string
}

// =============================================================================
// Service Class
// =============================================================================

export class SuggestionService {
  private activityService: ActivityService
  private factMapperService: FactMapperService

  constructor(private db: PrismaClient) {
    this.activityService = new ActivityService(db)
    this.factMapperService = new FactMapperService(db)
  }

  // ===========================================================================
  // Apply Suggestion
  // ===========================================================================

  /**
   * Apply an AI suggestion to an entity
   * Multi-tenancy: Validates entity belongs to organization
   */
  async applySuggestion(
    input: ApplySuggestionInput,
    organizationId: string,
    userId: string
  ): Promise<ApplySuggestionResult> {
    const { entityType, entityId, field, columnId, entryId, value, factIds } = input

    let previousValue: unknown
    let newValue: unknown = value

    switch (entityType) {
      case 'Deal':
        if (!field) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Field is required for Deal suggestions',
          })
        }
        previousValue = await this.applyDealSuggestion(
          entityId,
          field,
          value,
          organizationId
        )
        break

      case 'Company':
        if (!field) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Field is required for Company suggestions',
          })
        }
        previousValue = await this.applyCompanySuggestion(
          entityId,
          field,
          value,
          organizationId
        )
        break

      case 'Database':
        if (!columnId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Column ID is required for Database suggestions',
          })
        }
        previousValue = await this.applyDatabaseSuggestion(
          entityId,
          columnId,
          entryId,
          value,
          organizationId,
          userId
        )
        break

      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown entity type: ${entityType}`,
        })
    }

    // Log the acceptance
    const activity = await this.activityService.log({
      userId,
      dealId: entityType === 'Deal' ? entityId : undefined,
      type: ActivityType.AI_SUGGESTION_ACCEPTED,
      description: `Accepted AI suggestion for ${entityType}.${field || columnId}`,
      metadata: {
        suggestionId: input.suggestionId,
        entityType,
        entityId,
        field: field || columnId,
        previousValue,
        newValue,
        factIds,
      },
    })

    return {
      success: true,
      entityType,
      entityId,
      field: field || columnId,
      previousValue,
      newValue,
      activityId: activity.id,
    }
  }

  // ===========================================================================
  // Dismiss Suggestion
  // ===========================================================================

  /**
   * Dismiss an AI suggestion (audit log only)
   */
  async dismissSuggestion(
    input: DismissSuggestionInput,
    organizationId: string,
    userId: string
  ): Promise<DismissSuggestionResult> {
    const { suggestionId, entityType, entityId, field, reason } = input

    // Validate entity exists and belongs to organization
    await this.validateEntityAccess(entityType, entityId, organizationId)

    // Log the dismissal
    const activity = await this.activityService.log({
      userId,
      dealId: entityType === 'Deal' ? entityId : undefined,
      type: ActivityType.AI_SUGGESTION_DISMISSED,
      description: `Dismissed AI suggestion for ${entityType}${field ? `.${field}` : ''}`,
      metadata: {
        suggestionId,
        entityType,
        entityId,
        field,
        reason,
      },
    })

    return {
      success: true,
      activityId: activity.id,
    }
  }

  // ===========================================================================
  // Generate Suggestions
  // ===========================================================================

  /**
   * Generate suggestions for a deal from its facts
   */
  async generateSuggestionsForDeal(
    dealId: string,
    organizationId: string,
    options?: { minConfidence?: number; maxSuggestions?: number }
  ) {
    // Get deal with its company
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        organizationId: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        companyId: true,
      },
    })

    if (!deal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
    }

    if (deal.organizationId !== organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
    }

    // Get facts for the deal
    const facts = await this.factMapperService.getFactsForDeal(
      dealId,
      organizationId,
      options
    )

    // Map facts to field suggestions
    const fieldSuggestions = this.mapFactsToDealFields(facts, deal)

    return {
      dealId,
      fieldSuggestions,
      totalFacts: facts.length,
    }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async applyDealSuggestion(
    dealId: string,
    field: string,
    value: unknown,
    organizationId: string
  ): Promise<unknown> {
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        organizationId: true,
        value: true,
        probability: true,
        expectedCloseDate: true,
        description: true,
        notes: true,
      },
    })

    if (!deal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
    }

    if (deal.organizationId !== organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
    }

    // Get previous value
    const previousValue = (deal as Record<string, unknown>)[field]

    // Validate field is updatable
    const allowedFields = ['value', 'probability', 'expectedCloseDate', 'description', 'notes']
    if (!allowedFields.includes(field)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot update field: ${field}`,
      })
    }

    // Apply update
    await this.db.deal.update({
      where: { id: dealId },
      data: { [field]: value },
    })

    return previousValue
  }

  private async applyCompanySuggestion(
    companyId: string,
    field: string,
    value: unknown,
    organizationId: string
  ): Promise<unknown> {
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        website: true,
        industry: true,
        employees: true,
        revenue: true,
        description: true,
      },
    })

    if (!company) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
    }

    if (company.organizationId !== organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
    }

    // Get previous value
    const previousValue = (company as Record<string, unknown>)[field]

    // Validate field is updatable
    const allowedFields = ['website', 'industry', 'employees', 'revenue', 'description']
    if (!allowedFields.includes(field)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot update field: ${field}`,
      })
    }

    // Apply update
    await this.db.company.update({
      where: { id: companyId },
      data: { [field]: value },
    })

    return previousValue
  }

  private async applyDatabaseSuggestion(
    databaseId: string,
    columnId: string,
    entryId: string | undefined,
    value: unknown,
    organizationId: string,
    userId: string
  ): Promise<unknown> {
    // Validate database access
    const database = await this.db.database.findUnique({
      where: { id: databaseId },
      select: { id: true, organizationId: true, schema: true },
    })

    if (!database) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Database not found' })
    }

    if (database.organizationId !== organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Database not found' })
    }

    if (entryId) {
      // Update existing entry
      const entry = await this.db.databaseEntry.findUnique({
        where: { id: entryId },
        select: { id: true, properties: true, databaseId: true },
      })

      if (!entry || entry.databaseId !== databaseId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Entry not found' })
      }

      const currentProps = entry.properties as Record<string, unknown>
      const previousValue = currentProps[columnId]

      await this.db.databaseEntry.update({
        where: { id: entryId },
        data: {
          properties: { ...currentProps, [columnId]: value } as Prisma.JsonObject,
        },
      })

      return previousValue
    } else {
      // Create new entry
      await this.db.databaseEntry.create({
        data: {
          databaseId,
          properties: { [columnId]: value } as Prisma.JsonObject,
          createdById: userId,
        },
      })

      return undefined
    }
  }

  private async validateEntityAccess(
    entityType: SuggestionEntityType,
    entityId: string,
    organizationId: string
  ): Promise<void> {
    switch (entityType) {
      case 'Deal': {
        const deal = await this.db.deal.findUnique({
          where: { id: entityId },
          select: { organizationId: true },
        })
        if (!deal || deal.organizationId !== organizationId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
        }
        break
      }
      case 'Company': {
        const company = await this.db.company.findUnique({
          where: { id: entityId },
          select: { organizationId: true },
        })
        if (!company || company.organizationId !== organizationId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
        }
        break
      }
      case 'Database': {
        const database = await this.db.database.findUnique({
          where: { id: entityId },
          select: { organizationId: true },
        })
        if (!database || database.organizationId !== organizationId) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Database not found' })
        }
        break
      }
    }
  }

  private mapFactsToDealFields(
    facts: Array<{ type: string; object: string; confidence: number; id: string; sourceText?: string | null; document?: { name: string } | null }>,
    deal: { value: unknown; probability: unknown; expectedCloseDate: unknown }
  ) {
    const suggestions: Array<{
      field: string
      currentValue: unknown
      suggestedValue: unknown
      confidence: number
      factIds: string[]
      sourceText?: string
      documentName?: string
    }> = []

    for (const fact of facts) {
      // Map FINANCIAL_METRIC facts to deal.value
      if (fact.type === 'FINANCIAL_METRIC') {
        const numericMatch = fact.object.match(/[\d,]+\.?\d*/)?.[0]
        if (numericMatch) {
          const numericValue = parseFloat(numericMatch.replace(/,/g, ''))
          if (numericValue > 0 && numericValue !== deal.value) {
            suggestions.push({
              field: 'value',
              currentValue: deal.value,
              suggestedValue: numericValue,
              confidence: fact.confidence,
              factIds: [fact.id],
              sourceText: fact.sourceText || undefined,
              documentName: fact.document?.name,
            })
          }
        }
      }

      // Map date-related facts to expectedCloseDate
      if (fact.object.match(/\d{4}-\d{2}-\d{2}/) || fact.object.match(/Q[1-4]\s*\d{4}/i)) {
        const dateMatch = fact.object.match(/\d{4}-\d{2}-\d{2}/)?.[0]
        if (dateMatch) {
          suggestions.push({
            field: 'expectedCloseDate',
            currentValue: deal.expectedCloseDate,
            suggestedValue: new Date(dateMatch),
            confidence: fact.confidence,
            factIds: [fact.id],
            sourceText: fact.sourceText || undefined,
            documentName: fact.document?.name,
          })
        }
      }
    }

    // Deduplicate by field, keeping highest confidence
    const deduped = new Map<string, typeof suggestions[0]>()
    for (const suggestion of suggestions) {
      const existing = deduped.get(suggestion.field)
      if (!existing || suggestion.confidence > existing.confidence) {
        deduped.set(suggestion.field, suggestion)
      }
    }

    return Array.from(deduped.values())
  }
}
