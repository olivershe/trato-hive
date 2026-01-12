/**
 * Database Service
 *
 * Business logic for Inline Database CRUD operations.
 * Enforces multi-tenancy via organizationId on all operations.
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, Prisma } from '@trato-hive/db'
import type {
  RouterCreateDatabaseInput,
  UpdateDatabaseInput,
  UpdateDatabaseSchemaInput,
  AddColumnInput,
  UpdateColumnInput,
  DeleteColumnInput,
  CreateDatabaseEntryInput,
  UpdateDatabaseEntryInput,
  UpdateCellInput,
  ListDatabasesInput,
  ListEntriesInput,
} from '@trato-hive/shared'

// Local type definitions (re-declared to avoid tsup DTS build issues)
export type DatabaseColumnTypeValue =
  | 'TEXT'
  | 'NUMBER'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'DATE'
  | 'PERSON'
  | 'CHECKBOX'
  | 'URL'

export interface DatabaseColumn {
  id: string
  name: string
  type: DatabaseColumnTypeValue
  options?: string[]
  width?: number
}

export interface DatabaseSchema {
  columns: DatabaseColumn[]
}
import { createId } from '@paralleldrive/cuid2'

// =============================================================================
// Result Types
// =============================================================================

export interface DatabaseListResult {
  items: Array<{
    id: string
    name: string
    description: string | null
    schema: DatabaseSchema
    createdAt: Date
    updatedAt: Date
    _count: { entries: number }
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface DatabaseWithEntries {
  id: string
  organizationId: string
  name: string
  description: string | null
  schema: DatabaseSchema
  createdById: string
  createdAt: Date
  updatedAt: Date
  entries: Array<{
    id: string
    databaseId: string
    properties: Record<string, unknown>
    suggestedBy: string | null
    factIds: string[]
    createdById: string
    createdAt: Date
    updatedAt: Date
  }>
}

// =============================================================================
// Service Class
// =============================================================================

export class DatabaseService {
  constructor(private db: PrismaClient) {}

  // ===========================================================================
  // Database CRUD
  // ===========================================================================

  /**
   * List databases with pagination
   * Multi-tenancy: Filters by organizationId
   */
  async list(input: ListDatabasesInput, organizationId: string): Promise<DatabaseListResult> {
    const { page = 1, pageSize = 20, search } = input
    const skip = (page - 1) * pageSize

    const where: Prisma.DatabaseWhereInput = {
      organizationId,
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    const [items, total] = await Promise.all([
      this.db.database.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          schema: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { entries: true },
          },
        },
      }),
      this.db.database.count({ where }),
    ])

    return {
      items: items.map((item) => ({
        ...item,
        schema: item.schema as unknown as DatabaseSchema,
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
   * Get database by ID with entries
   * Multi-tenancy: Validates database belongs to organization
   */
  async getById(id: string, organizationId: string): Promise<DatabaseWithEntries> {
    const database = await this.db.database.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!database) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Database not found',
      })
    }

    // Multi-tenancy check
    if (database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND', // Don't reveal existence
        message: 'Database not found',
      })
    }

    return {
      ...database,
      schema: database.schema as unknown as DatabaseSchema,
      entries: database.entries.map((entry) => ({
        ...entry,
        properties: entry.properties as Record<string, unknown>,
      })),
    }
  }

  /**
   * Create new database with associated page
   * Multi-tenancy: Validates deal belongs to organization
   */
  async create(
    input: RouterCreateDatabaseInput,
    organizationId: string,
    userId: string
  ) {
    // Validate deal exists and belongs to org
    const deal = await this.db.deal.findUnique({
      where: { id: input.dealId },
    })

    if (!deal || deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal not found',
      })
    }

    // Generate column IDs if not provided
    const schemaWithIds: DatabaseSchema = {
      columns: input.schema.columns.map((col) => ({
        id: col.id || createId(),
        name: col.name,
        type: col.type as DatabaseColumnTypeValue,
        options: col.options,
        width: col.width,
      })),
    }

    // Use transaction to create page and database together
    const database = await this.db.$transaction(async (tx) => {
      // Create page for the database
      const databasePage = await tx.page.create({
        data: {
          dealId: input.dealId,
          parentPageId: input.parentPageId,
          title: input.name,
          icon: '📊',
          isDatabase: true,
        },
      })

      // Create database linked to page
      const newDatabase = await tx.database.create({
        data: {
          name: input.name,
          description: input.description,
          schema: schemaWithIds as unknown as Prisma.JsonObject,
          organizationId,
          dealId: input.dealId,
          pageId: databasePage.id,
          createdById: userId,
        },
      })

      return newDatabase
    })

    return {
      ...database,
      schema: database.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * Update database metadata (name, description)
   * Multi-tenancy: Validates ownership before update
   */
  async update(input: UpdateDatabaseInput, organizationId: string) {
    // Validate access
    await this.getById(input.id, organizationId)

    const database = await this.db.database.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
      },
    })

    return {
      ...database,
      schema: database.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * Update database schema (all columns)
   */
  async updateSchema(input: UpdateDatabaseSchemaInput, organizationId: string) {
    await this.getById(input.id, organizationId)

    const database = await this.db.database.update({
      where: { id: input.id },
      data: {
        schema: input.schema as unknown as Prisma.JsonObject,
      },
    })

    return {
      ...database,
      schema: database.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * Add column to database
   */
  async addColumn(input: AddColumnInput, organizationId: string) {
    const database = await this.getById(input.databaseId, organizationId)

    const newColumn: DatabaseColumn = {
      id: input.column.id || createId(),
      name: input.column.name,
      type: input.column.type as DatabaseColumnTypeValue,
      options: input.column.options,
      width: input.column.width,
    }

    const updatedColumns = [...database.schema.columns]
    const position = input.position ?? updatedColumns.length
    updatedColumns.splice(position, 0, newColumn)

    const updated = await this.db.database.update({
      where: { id: input.databaseId },
      data: {
        schema: { columns: updatedColumns } as unknown as Prisma.JsonObject,
      },
    })

    return {
      ...updated,
      schema: updated.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * Update column in database
   */
  async updateColumn(input: UpdateColumnInput, organizationId: string) {
    const database = await this.getById(input.databaseId, organizationId)

    const columnIndex = database.schema.columns.findIndex(
      (col: DatabaseColumn) => col.id === input.columnId
    )

    if (columnIndex === -1) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Column not found',
      })
    }

    const updatedColumns = [...database.schema.columns]
    const updates = input.updates
    updatedColumns[columnIndex] = {
      ...updatedColumns[columnIndex],
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.type !== undefined && { type: updates.type as DatabaseColumnTypeValue }),
      ...(updates.options !== undefined && { options: updates.options }),
      ...(updates.width !== undefined && { width: updates.width }),
    }

    const updated = await this.db.database.update({
      where: { id: input.databaseId },
      data: {
        schema: { columns: updatedColumns } as unknown as Prisma.JsonObject,
      },
    })

    return {
      ...updated,
      schema: updated.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * Delete column from database
   */
  async deleteColumn(input: DeleteColumnInput, organizationId: string) {
    const database = await this.getById(input.databaseId, organizationId)

    const updatedColumns = database.schema.columns.filter(
      (col: DatabaseColumn) => col.id !== input.columnId
    )

    if (updatedColumns.length === database.schema.columns.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Column not found',
      })
    }

    if (updatedColumns.length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot delete last column',
      })
    }

    const updated = await this.db.database.update({
      where: { id: input.databaseId },
      data: {
        schema: { columns: updatedColumns } as unknown as Prisma.JsonObject,
      },
    })

    return {
      ...updated,
      schema: updated.schema as unknown as DatabaseSchema,
    }
  }

  /**
   * Delete database
   */
  async delete(id: string, organizationId: string) {
    await this.getById(id, organizationId)

    await this.db.database.delete({
      where: { id },
    })

    return { success: true }
  }

  // ===========================================================================
  // Entry CRUD
  // ===========================================================================

  /**
   * List entries with pagination and filtering
   */
  async listEntries(input: ListEntriesInput, organizationId: string) {
    // Validate database access
    await this.getById(input.databaseId, organizationId)

    const { page = 1, pageSize = 50 } = input
    const skip = (page - 1) * pageSize

    const [items, total] = await Promise.all([
      this.db.databaseEntry.findMany({
        where: { databaseId: input.databaseId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
      this.db.databaseEntry.count({
        where: { databaseId: input.databaseId },
      }),
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
   * Create entry (row)
   */
  async createEntry(
    input: CreateDatabaseEntryInput,
    organizationId: string,
    userId: string
  ) {
    // Get database with page info
    const database = await this.db.database.findUnique({
      where: { id: input.databaseId },
      include: { page: true },
    })

    if (!database) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Database not found',
      })
    }

    if (database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Database not found',
      })
    }

    // Use transaction to create both page and entry
    const entry = await this.db.$transaction(async (tx) => {
      // Create page for the entry (if database has dealId)
      let entryPage = null
      if (database.dealId && database.pageId) {
        const entryTitle = (input.properties as Record<string, unknown>)?.name as string
          || (input.properties as Record<string, unknown>)?.title as string
          || 'Untitled'

        entryPage = await tx.page.create({
          data: {
            dealId: database.dealId,
            parentPageId: database.pageId, // Entry pages are children of database page
            title: entryTitle,
            icon: '📄',
          },
        })
      }

      // Create the entry with page link
      const newEntry = await tx.databaseEntry.create({
        data: {
          databaseId: input.databaseId,
          properties: input.properties as Prisma.JsonObject,
          suggestedBy: input.suggestedBy,
          factIds: input.factIds || [],
          pageId: entryPage?.id,
          createdById: userId,
        },
      })

      return newEntry
    })

    return {
      ...entry,
      properties: entry.properties as Record<string, unknown>,
    }
  }

  /**
   * Update entry
   */
  async updateEntry(input: UpdateDatabaseEntryInput, organizationId: string) {
    const entry = await this.db.databaseEntry.findUnique({
      where: { id: input.id },
      include: { database: true },
    })

    if (!entry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    // Multi-tenancy check via database
    if (entry.database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    const updated = await this.db.databaseEntry.update({
      where: { id: input.id },
      data: {
        properties: input.properties as Prisma.JsonObject,
      },
    })

    return {
      ...updated,
      properties: updated.properties as Record<string, unknown>,
    }
  }

  /**
   * Update single cell - optimized for inline editing
   */
  async updateCell(input: UpdateCellInput, organizationId: string) {
    const entry = await this.db.databaseEntry.findUnique({
      where: { id: input.entryId },
      include: { database: true },
    })

    if (!entry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    if (entry.database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    const currentProps = entry.properties as Record<string, unknown>
    const updatedProps = {
      ...currentProps,
      [input.columnId]: input.value,
    }

    const updated = await this.db.databaseEntry.update({
      where: { id: input.entryId },
      data: {
        properties: updatedProps as Prisma.JsonObject,
      },
    })

    return {
      ...updated,
      properties: updated.properties as Record<string, unknown>,
    }
  }

  /**
   * Delete entry
   */
  async deleteEntry(id: string, organizationId: string) {
    const entry = await this.db.databaseEntry.findUnique({
      where: { id },
      include: { database: true },
    })

    if (!entry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    if (entry.database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    await this.db.databaseEntry.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Duplicate entry
   */
  async duplicateEntry(id: string, organizationId: string, userId: string) {
    const entry = await this.db.databaseEntry.findUnique({
      where: { id },
      include: { database: true },
    })

    if (!entry) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    if (entry.database.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Entry not found',
      })
    }

    const duplicate = await this.db.databaseEntry.create({
      data: {
        databaseId: entry.databaseId,
        properties: entry.properties as Prisma.JsonObject,
        createdById: userId,
      },
    })

    return {
      ...duplicate,
      properties: duplicate.properties as Record<string, unknown>,
    }
  }

  /**
   * Bulk create entries (for CSV import)
   */
  async bulkCreateEntries(
    databaseId: string,
    entries: Array<{ properties: Record<string, unknown> }>,
    organizationId: string,
    userId: string
  ) {
    // Validate database access
    await this.getById(databaseId, organizationId)

    // Create entries in a transaction
    const created = await this.db.$transaction(
      entries.map((entry) =>
        this.db.databaseEntry.create({
          data: {
            databaseId,
            properties: entry.properties as Prisma.JsonObject,
            createdById: userId,
          },
        })
      )
    )

    return {
      count: created.length,
      entries: created.map((entry) => ({
        ...entry,
        properties: entry.properties as Record<string, unknown>,
      })),
    }
  }
}
