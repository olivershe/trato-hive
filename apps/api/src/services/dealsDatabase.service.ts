/**
 * Deals Database Service
 *
 * Business logic for managing the org-level Deals Database.
 * This is a special database where each deal is represented as a DatabaseEntry.
 * Enforces multi-tenancy via organizationId on all operations.
 *
 * Phase 12: Deals Database Architecture Migration
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, Prisma } from '@trato-hive/db'
import {
  DEALS_DATABASE_SCHEMA,
  DEALS_DATABASE_NAME,
  DEALS_DATABASE_DESCRIPTION,
  type DatabaseSchema,
} from '@trato-hive/shared'

export interface DealsDatabaseResult {
  id: string
  organizationId: string
  name: string
  description: string | null
  schema: DatabaseSchema
  isOrgLevel: boolean
  createdAt: Date
  updatedAt: Date
  pageId: string
}

export interface DealEntryProperties {
  name: string
  stage: string
  type?: string
  priority?: string
  value?: number | null
  probability?: number | null
  source?: string | null
  expectedCloseDate?: string | null
  leadPartner?: string | null
}

export interface CreateDealEntryInput {
  properties: DealEntryProperties
}

export interface ListDealsResult {
  items: Array<{
    id: string
    databaseId: string
    properties: Record<string, unknown>
    pageId: string | null
    createdAt: Date
    updatedAt: Date
    deal: {
      id: string
      name: string
      organizationId: string
    } | null
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export class DealsDatabaseService {
  constructor(private db: PrismaClient) {}

  /**
   * Get or create the org-level Deals Database
   * Lazy creates on first deal if doesn't exist
   * Multi-tenancy: Scoped to organizationId
   */
  async getOrCreateDealsDatabase(
    organizationId: string,
    userId: string
  ): Promise<DealsDatabaseResult> {
    // Try to find existing Deals Database
    const existing = await this.db.database.findFirst({
      where: {
        organizationId,
        isOrgLevel: true,
        name: DEALS_DATABASE_NAME,
      },
    })

    if (existing) {
      return {
        ...existing,
        schema: existing.schema as unknown as DatabaseSchema,
      }
    }

    // Create new Deals Database with org-level page
    return this.db.$transaction(async (tx) => {
      // Create org-level page for the database
      const databasePage = await tx.page.create({
        data: {
          organizationId,
          title: DEALS_DATABASE_NAME,
          icon: '📊',
          isDatabase: true,
          // No dealId - this is an org-level page
        },
      })

      // Create the Deals Database
      const database = await tx.database.create({
        data: {
          name: DEALS_DATABASE_NAME,
          description: DEALS_DATABASE_DESCRIPTION,
          schema: DEALS_DATABASE_SCHEMA as unknown as Prisma.JsonObject,
          organizationId,
          isOrgLevel: true,
          pageId: databasePage.id,
          createdById: userId,
          // No dealId - this is an org-level database
        },
      })

      return {
        ...database,
        schema: database.schema as unknown as DatabaseSchema,
      }
    })
  }

  /**
   * Get the org-level Deals Database (without creating)
   * Returns null if doesn't exist
   * Multi-tenancy: Scoped to organizationId
   */
  async getDealsDatabase(organizationId: string): Promise<DealsDatabaseResult | null> {
    const database = await this.db.database.findFirst({
      where: {
        organizationId,
        isOrgLevel: true,
        name: DEALS_DATABASE_NAME,
      },
    })

    if (!database) {
      return null
    }

    return {
      ...database,
      schema: database.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * Create a deal entry in the Deals Database
   * This creates the DatabaseEntry and its associated page
   * Multi-tenancy: Validates organizationId
   */
  async createDealEntry(
    input: CreateDealEntryInput,
    organizationId: string,
    userId: string
  ) {
    // Get or create the Deals Database first
    const dealsDatabase = await this.getOrCreateDealsDatabase(organizationId, userId)

    return this.db.$transaction(async (tx) => {
      // Create page for the entry (org-level, no dealId yet)
      const entryPage = await tx.page.create({
        data: {
          organizationId,
          parentPageId: dealsDatabase.pageId,
          title: input.properties.name,
          icon: '📋',
          // No dealId initially - will be linked when Deal is created
        },
      })

      // Create the database entry
      const entry = await tx.databaseEntry.create({
        data: {
          databaseId: dealsDatabase.id,
          properties: input.properties as unknown as Prisma.JsonObject,
          pageId: entryPage.id,
          createdById: userId,
        },
      })

      return {
        ...entry,
        properties: entry.properties as Record<string, unknown>,
        page: entryPage,
      }
    })
  }

  /**
   * Update a deal entry's properties
   * Multi-tenancy: Validates entry belongs to org
   */
  async updateDealEntry(
    entryId: string,
    updates: Partial<DealEntryProperties>,
    organizationId: string
  ) {
    // Validate access
    const entry = await this.db.databaseEntry.findUnique({
      where: { id: entryId },
      include: { database: true },
    })

    if (!entry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal entry not found',
      })
    }

    if (entry.database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal entry not found',
      })
    }

    // Merge updates with existing properties
    const currentProps = entry.properties as Record<string, unknown>
    const updatedProps = {
      ...currentProps,
      ...updates,
    }

    // Update entry
    const updated = await this.db.databaseEntry.update({
      where: { id: entryId },
      data: {
        properties: updatedProps as Prisma.JsonObject,
      },
    })

    // Also update entry page title if name changed
    if (updates.name && entry.pageId) {
      await this.db.page.update({
        where: { id: entry.pageId },
        data: { title: updates.name },
      })
    }

    return {
      ...updated,
      properties: updated.properties as Record<string, unknown>,
    }
  }

  /**
   * Get a deal entry by ID with validation
   * Multi-tenancy: Validates entry belongs to org
   */
  async getEntryById(entryId: string, organizationId: string) {
    const entry = await this.db.databaseEntry.findUnique({
      where: { id: entryId },
      include: {
        database: true,
        page: true,
        deal: {
          select: {
            id: true,
            name: true,
            organizationId: true,
          },
        },
      },
    })

    if (!entry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal entry not found',
      })
    }

    if (entry.database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal entry not found',
      })
    }

    return {
      ...entry,
      properties: entry.properties as Record<string, unknown>,
      schema: entry.database.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * List deal entries (deals in the Deals Database)
   * Multi-tenancy: Scoped to organizationId
   */
  async listDeals(
    organizationId: string,
    options?: { page?: number; pageSize?: number; search?: string }
  ): Promise<ListDealsResult> {
    const { page = 1, pageSize = 50, search } = options || {}
    const skip = (page - 1) * pageSize

    // Get the Deals Database
    const dealsDatabase = await this.getDealsDatabase(organizationId)

    if (!dealsDatabase) {
      return {
        items: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      }
    }

    const where: Prisma.DatabaseEntryWhereInput = {
      databaseId: dealsDatabase.id,
    }

    // Note: Search on JSONB properties is limited
    // For production, consider using full-text search or dedicated search service

    const [items, total] = await Promise.all([
      this.db.databaseEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          deal: {
            select: {
              id: true,
              name: true,
              organizationId: true,
            },
          },
        },
      }),
      this.db.databaseEntry.count({ where }),
    ])

    return {
      items: items.map((item) => ({
        ...item,
        properties: item.properties as Record<string, unknown>,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get the schema for the Deals Database
   * Used by Copilot and UI to understand available columns
   * Multi-tenancy: Scoped to organizationId
   */
  async getSchema(organizationId: string): Promise<DatabaseSchema> {
    const database = await this.getDealsDatabase(organizationId)

    if (!database) {
      // Return default schema if database doesn't exist yet
      return DEALS_DATABASE_SCHEMA
    }

    return database.schema
  }

  /**
   * Map deal fields to entry properties
   * Converts Deal model fields to DatabaseEntry properties format
   */
  static mapDealToProperties(deal: {
    name: string
    stage: string
    type?: string
    priority?: string
    value?: number | string | null
    probability?: number | null
    source?: string | null
    expectedCloseDate?: Date | string | null
    leadPartnerId?: string | null
  }): DealEntryProperties {
    return {
      name: deal.name,
      stage: deal.stage,
      type: deal.type,
      priority: deal.priority || 'NONE',
      value: typeof deal.value === 'string' ? parseFloat(deal.value) : deal.value,
      probability: deal.probability,
      source: deal.source,
      expectedCloseDate: deal.expectedCloseDate
        ? (deal.expectedCloseDate instanceof Date
            ? deal.expectedCloseDate.toISOString()
            : deal.expectedCloseDate)
        : null,
      leadPartner: deal.leadPartnerId,
    }
  }

  /**
   * Map entry properties back to deal update fields
   * Converts DatabaseEntry properties to Deal model update format
   */
  static mapPropertiesToDealUpdate(properties: Record<string, unknown>): Record<string, unknown> {
    const update: Record<string, unknown> = {}

    if (properties.name !== undefined) update.name = properties.name
    if (properties.stage !== undefined) update.stage = properties.stage
    if (properties.type !== undefined) update.type = properties.type
    if (properties.priority !== undefined) update.priority = properties.priority
    if (properties.value !== undefined) update.value = properties.value
    if (properties.probability !== undefined) update.probability = properties.probability
    if (properties.source !== undefined) update.source = properties.source
    if (properties.expectedCloseDate !== undefined) {
      update.expectedCloseDate = properties.expectedCloseDate
        ? new Date(properties.expectedCloseDate as string)
        : null
    }
    if (properties.leadPartner !== undefined) update.leadPartnerId = properties.leadPartner

    return update
  }
}
