/**
 * Fact Mapper Service
 *
 * Maps extracted Facts to database entries for AI-suggested row population.
 * Bridges the semantic-layer (facts) with inline databases.
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, Fact, FactType } from '@trato-hive/db'

// =============================================================================
// Types
// =============================================================================

interface DatabaseColumn {
  id: string
  name: string
  type: string
  options?: string[]
}

interface DatabaseSchema {
  columns: DatabaseColumn[]
}

export interface SuggestedEntry {
  properties: Record<string, unknown>
  suggestedBy: string
  factIds: string[]
  confidence: number
  sourceText?: string
}

export interface FactSuggestionOptions {
  minConfidence?: number // Default: 0.7
  maxSuggestions?: number // Default: 10
  factTypes?: FactType[] // Filter by specific fact types
}

/**
 * CitationBlock JSON structure for Tiptap editor
 */
export interface CitationBlockJSON {
  type: 'citationBlock'
  attrs: {
    id: string
    factId: string
    sourceText: string
    confidence: number
    documentName: string
    subject: string
    predicate: string
    object: string
  }
}

export interface FactWithSource extends Fact {
  document?: { id: string; name: string } | null
}

// =============================================================================
// Fact Type to Column Type Mapping
// =============================================================================

const FACT_TYPE_COLUMN_MAPPINGS: Record<FactType, string[]> = {
  FINANCIAL_METRIC: ['NUMBER', 'TEXT'],
  KEY_PERSON: ['PERSON', 'TEXT'],
  PRODUCT: ['TEXT', 'SELECT'],
  CUSTOMER: ['TEXT', 'SELECT'],
  RISK: ['TEXT', 'SELECT'],
  OPPORTUNITY: ['TEXT', 'SELECT'],
  OTHER: ['TEXT'],
}

// =============================================================================
// Service Class
// =============================================================================

export class FactMapperService {
  constructor(private db: PrismaClient) {}

  /**
   * Get all facts for a deal (via documents)
   * Multi-tenancy: Validates deal belongs to organization
   */
  async getFactsForDeal(
    dealId: string,
    organizationId: string,
    options: FactSuggestionOptions = {}
  ): Promise<FactWithSource[]> {
    const { minConfidence = 0.7, factTypes } = options

    // Validate deal belongs to organization
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
      select: { id: true, organizationId: true, companyId: true },
    })

    if (!deal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
    }

    if (deal.organizationId !== organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' })
    }

    // Get facts from documents attached to this deal
    const documentFacts = await this.db.fact.findMany({
      where: {
        document: { dealId },
        confidence: { gte: minConfidence },
        ...(factTypes && factTypes.length > 0 ? { type: { in: factTypes } } : {}),
      },
      include: {
        document: { select: { id: true, name: true } },
      },
      orderBy: { confidence: 'desc' },
    })

    // Also get facts directly linked to the company (if deal has a company)
    let companyFacts: FactWithSource[] = []
    if (deal.companyId) {
      companyFacts = await this.db.fact.findMany({
        where: {
          companyId: deal.companyId,
          documentId: null, // Only direct company facts
          confidence: { gte: minConfidence },
          ...(factTypes && factTypes.length > 0 ? { type: { in: factTypes } } : {}),
        },
        include: {
          document: { select: { id: true, name: true } },
        },
        orderBy: { confidence: 'desc' },
      })
    }

    // Combine and deduplicate by id
    const allFacts = [...documentFacts, ...companyFacts]
    const uniqueFacts = Array.from(new Map(allFacts.map((f) => [f.id, f])).values())

    return uniqueFacts
  }

  /**
   * Get all facts for a company
   * Multi-tenancy: Validates company belongs to organization
   */
  async getFactsForCompany(
    companyId: string,
    organizationId: string,
    options: FactSuggestionOptions = {}
  ): Promise<FactWithSource[]> {
    const { minConfidence = 0.7, factTypes } = options

    // Validate company belongs to organization
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      select: { id: true, organizationId: true },
    })

    if (!company) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
    }

    if (company.organizationId !== organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found' })
    }

    const facts = await this.db.fact.findMany({
      where: {
        OR: [
          { companyId },
          { document: { companyId } },
        ],
        confidence: { gte: minConfidence },
        ...(factTypes && factTypes.length > 0 ? { type: { in: factTypes } } : {}),
      },
      include: {
        document: { select: { id: true, name: true } },
      },
      orderBy: { confidence: 'desc' },
    })

    return facts
  }

  /**
   * Map facts to suggested database entries
   * Matches fact types to compatible column types
   */
  mapFactsToEntries(
    facts: FactWithSource[],
    schema: DatabaseSchema,
    options: FactSuggestionOptions = {}
  ): SuggestedEntry[] {
    const { maxSuggestions = 10 } = options
    const suggestions: SuggestedEntry[] = []

    // Group facts by subject to create cohesive entries
    const factsBySubject = new Map<string, FactWithSource[]>()
    for (const fact of facts) {
      const key = fact.subject.toLowerCase().trim()
      if (!factsBySubject.has(key)) {
        factsBySubject.set(key, [])
      }
      factsBySubject.get(key)!.push(fact)
    }

    // For each subject group, create a suggested entry
    for (const [subject, subjectFacts] of factsBySubject) {
      if (suggestions.length >= maxSuggestions) break

      const properties: Record<string, unknown> = {}
      const factIds: string[] = []
      let totalConfidence = 0
      const sourceTexts: string[] = []

      // Try to map each fact to a column
      for (const fact of subjectFacts) {
        const column = this.findBestColumnMatch(fact, schema.columns)
        if (column) {
          const value = this.convertFactToColumnValue(fact, column)
          if (value !== undefined) {
            properties[column.id] = value
            factIds.push(fact.id)
            totalConfidence += fact.confidence
            if (fact.sourceText) {
              sourceTexts.push(fact.sourceText)
            }
          }
        }
      }

      // Only add if we have at least one mapped property
      if (Object.keys(properties).length > 0) {
        // Try to fill in the first text column with the subject if not already set
        const firstTextColumn = schema.columns.find(
          (c) => c.type === 'TEXT' && !properties[c.id]
        )
        if (firstTextColumn) {
          properties[firstTextColumn.id] = subject
        }

        suggestions.push({
          properties,
          suggestedBy: 'fact-mapper',
          factIds,
          confidence: factIds.length > 0 ? totalConfidence / factIds.length : 0,
          sourceText: sourceTexts.length > 0 ? sourceTexts.join('\n---\n') : undefined,
        })
      }
    }

    // Sort by confidence and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions)
  }

  /**
   * Suggest database entries from facts for a deal
   * Main entry point for AI suggestions
   */
  async suggestEntriesFromFacts(
    databaseId: string,
    dealId: string,
    organizationId: string,
    options: FactSuggestionOptions = {}
  ): Promise<SuggestedEntry[]> {
    // Get database schema
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

    // Get facts for the deal
    const facts = await this.getFactsForDeal(dealId, organizationId, options)

    if (facts.length === 0) {
      return []
    }

    // Map facts to entries
    const schema = database.schema as unknown as DatabaseSchema
    return this.mapFactsToEntries(facts, schema, options)
  }

  /**
   * Get full facts by IDs for populating entry pages
   */
  async getFactsByIds(
    factIds: string[],
    organizationId: string
  ): Promise<FactWithSource[]> {
    if (factIds.length === 0) return []

    const facts = await this.db.fact.findMany({
      where: { id: { in: factIds } },
      include: {
        document: { select: { id: true, name: true } },
      },
    })

    // Validate facts belong to org (via document -> deal or company)
    const validatedFacts: FactWithSource[] = []
    for (const fact of facts) {
      if (fact.documentId) {
        const doc = await this.db.document.findUnique({
          where: { id: fact.documentId },
          include: {
            deal: { select: { organizationId: true } },
            company: { select: { organizationId: true } },
          },
        })
        const docOrgId = doc?.deal?.organizationId || doc?.company?.organizationId
        if (docOrgId === organizationId) {
          validatedFacts.push(fact)
        }
      } else if (fact.companyId) {
        const company = await this.db.company.findUnique({
          where: { id: fact.companyId },
          select: { organizationId: true },
        })
        if (company?.organizationId === organizationId) {
          validatedFacts.push(fact)
        }
      }
    }

    return validatedFacts
  }

  /**
   * Generate CitationBlock JSON content from facts
   * Used to populate entry pages with fact citations
   */
  generateCitationBlocks(facts: FactWithSource[]): CitationBlockJSON[] {
    return facts.map((fact) => ({
      type: 'citationBlock' as const,
      attrs: {
        id: `citation_${fact.id}`,
        factId: fact.id,
        sourceText: fact.sourceText || 'Source text unavailable',
        confidence: fact.confidence,
        documentName: fact.document?.name || 'Unknown Document',
        subject: fact.subject,
        predicate: fact.predicate,
        object: fact.object,
      },
    }))
  }

  /**
   * Generate Tiptap document JSON for populating an entry page with citations
   * Creates a structured document with header and citation blocks
   */
  generateEntryPageContent(
    entryTitle: string,
    facts: FactWithSource[]
  ): Record<string, unknown> {
    const citationBlocks = this.generateCitationBlocks(facts)

    return {
      type: 'doc',
      content: [
        // Header paragraph
        {
          type: 'paragraph',
          attrs: { id: `para_header_${Date.now()}` },
          content: [
            {
              type: 'text',
              text: `Evidence for "${entryTitle}"`,
              marks: [{ type: 'bold' }],
            },
          ],
        },
        // Divider
        {
          type: 'horizontalRule',
        },
        // Citation blocks for each fact
        ...citationBlocks,
      ],
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Find the best column match for a fact based on type compatibility
   */
  private findBestColumnMatch(
    fact: FactWithSource,
    columns: DatabaseColumn[]
  ): DatabaseColumn | null {
    const compatibleTypes = FACT_TYPE_COLUMN_MAPPINGS[fact.type] || ['TEXT']

    // First, try to find a column with matching name (case-insensitive)
    const nameMatch = columns.find((col) => {
      const colName = col.name.toLowerCase()
      const predicate = fact.predicate.toLowerCase()
      const subject = fact.subject.toLowerCase()
      return (
        colName.includes(predicate) ||
        predicate.includes(colName) ||
        colName.includes(subject) ||
        subject.includes(colName)
      )
    })

    if (nameMatch && compatibleTypes.includes(nameMatch.type)) {
      return nameMatch
    }

    // Fall back to first compatible column by type
    return columns.find((col) => compatibleTypes.includes(col.type)) || null
  }

  /**
   * Convert a fact's object value to the appropriate column type
   */
  private convertFactToColumnValue(
    fact: FactWithSource,
    column: DatabaseColumn
  ): unknown {
    const value = fact.object

    switch (column.type) {
      case 'NUMBER': {
        // Extract number from string (handles currency, percentages, etc.)
        const numberMatch = value.match(/[\d,]+\.?\d*/)?.[0]
        if (numberMatch) {
          return parseFloat(numberMatch.replace(/,/g, ''))
        }
        return undefined
      }

      case 'CHECKBOX': {
        const lower = value.toLowerCase()
        if (['yes', 'true', '1', 'confirmed', 'verified'].includes(lower)) {
          return true
        }
        if (['no', 'false', '0', 'unconfirmed', 'pending'].includes(lower)) {
          return false
        }
        return undefined
      }

      case 'SELECT': {
        // If column has options, try to match
        if (column.options && column.options.length > 0) {
          const lower = value.toLowerCase()
          const match = column.options.find(
            (opt) => opt.toLowerCase() === lower || lower.includes(opt.toLowerCase())
          )
          return match || value
        }
        return value
      }

      case 'MULTI_SELECT': {
        // Split by common delimiters
        const values = value.split(/[,;|]/).map((v) => v.trim()).filter(Boolean)
        if (column.options && column.options.length > 0) {
          return values.filter((v) =>
            column.options!.some((opt) => opt.toLowerCase() === v.toLowerCase())
          )
        }
        return values
      }

      case 'DATE': {
        // Try to parse date
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
        return undefined
      }

      case 'URL': {
        // Validate URL format
        if (value.match(/^https?:\/\//i)) {
          return value
        }
        return undefined
      }

      case 'PERSON':
      case 'TEXT':
      default:
        return value
    }
  }
}
