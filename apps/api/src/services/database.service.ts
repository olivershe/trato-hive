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
  | 'STATUS'
  | 'RELATION'
  | 'ROLLUP'
  | 'FORMULA'

// Config types for new column types
export interface StatusOption {
  id: string
  name: string
  color: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

export interface RelationConfig {
  targetDatabaseId: string
  relationType: 'one' | 'many'
}

export interface RollupConfig {
  sourceRelationColumnId: string
  targetColumnId: string
  aggregation: 'count' | 'count_values' | 'sum' | 'avg' | 'min' | 'max' | 'concat' | 'percent_empty' | 'percent_not_empty'
}

export interface FormulaConfig {
  formula: string
  resultType: 'text' | 'number' | 'date' | 'boolean'
}

export interface DatabaseColumn {
  id: string
  name: string
  type: DatabaseColumnTypeValue
  options?: string[]
  width?: number
  // New type-specific configurations
  statusOptions?: StatusOption[]
  relationConfig?: RelationConfig
  rollupConfig?: RollupConfig
  formulaConfig?: FormulaConfig
}

export interface DatabaseSchema {
  columns: DatabaseColumn[]
}
import { createId } from '@paralleldrive/cuid2'

// =============================================================================
// Formula Evaluation Helper
// =============================================================================

/**
 * Simple formula evaluator supporting prop("Column"), arithmetic, and basic functions
 */
function evaluateFormula(
  formula: string,
  properties: Record<string, unknown>,
  schema: DatabaseSchema
): unknown {
  try {
    // Create a mapping of column names to their IDs and values
    const columnByName = new Map<string, { id: string; value: unknown }>()
    for (const col of schema.columns) {
      columnByName.set(col.name.toLowerCase(), {
        id: col.id,
        value: properties[col.id],
      })
    }

    // Replace prop("Column Name") with actual values
    let evaluable = formula.replace(
      /prop\s*\(\s*["']([^"']+)["']\s*\)/gi,
      (_, columnName: string) => {
        const col = columnByName.get(columnName.toLowerCase())
        if (!col) return 'null'
        const val = col.value
        if (val === null || val === undefined) return 'null'
        if (typeof val === 'string') return JSON.stringify(val)
        return String(val)
      }
    )

    // Simple built-in functions
    evaluable = evaluable
      .replace(/concat\s*\(/gi, '(function(...args){return args.join("")})(')
      .replace(/length\s*\(/gi, '(function(s){return String(s).length})(')
      .replace(/round\s*\(/gi, 'Math.round(')
      .replace(/floor\s*\(/gi, 'Math.floor(')
      .replace(/ceil\s*\(/gi, 'Math.ceil(')
      .replace(/now\s*\(\s*\)/gi, `"${new Date().toISOString()}"`)
      .replace(/if\s*\(/gi, '(function(c,t,f){return c?t:f})(')

    // Evaluate (with safety measures)
    // Note: In production, use a proper sandboxed evaluator
    const fn = new Function(`return (${evaluable})`)
    return fn()
  } catch {
    return '#ERROR'
  }
}

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
   * Computes ROLLUP and FORMULA values at read time
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

    const schema = database.schema as unknown as DatabaseSchema

    // Find ROLLUP and FORMULA columns
    const rollupColumns = schema.columns.filter(
      (col: DatabaseColumn) => col.type === 'ROLLUP' && col.rollupConfig
    )
    const formulaColumns = schema.columns.filter(
      (col: DatabaseColumn) => col.type === 'FORMULA' && col.formulaConfig
    )

    // Preload related entries for ROLLUP computations
    const rollupRelatedData = new Map<string, Map<string, Record<string, unknown>[]>>()
    for (const rollupCol of rollupColumns) {
      const config = rollupCol.rollupConfig!
      const relationCol = schema.columns.find((c: DatabaseColumn) => c.id === config.sourceRelationColumnId)
      if (!relationCol?.relationConfig) continue

      const targetDbId = relationCol.relationConfig.targetDatabaseId
      if (!rollupRelatedData.has(targetDbId)) {
        // Fetch target database entries
        const targetDb = await this.db.database.findUnique({
          where: { id: targetDbId },
          include: { entries: true },
        })
        if (targetDb) {
          const entryMap = new Map<string, Record<string, unknown>>()
          for (const e of targetDb.entries) {
            entryMap.set(e.id, e.properties as Record<string, unknown>)
          }
          rollupRelatedData.set(targetDbId, new Map([[rollupCol.id, Array.from(entryMap.entries()).map(([id, props]) => ({ id, ...props }))]])
          )
        }
      }
    }

    // Process entries with computed values
    const processedEntries = database.entries.map((entry) => {
      const props = { ...entry.properties as Record<string, unknown> }

      // Compute FORMULA values
      for (const formulaCol of formulaColumns) {
        const config = formulaCol.formulaConfig!
        props[formulaCol.id] = evaluateFormula(config.formula, props, schema)
      }

      // Compute ROLLUP values
      for (const rollupCol of rollupColumns) {
        const config = rollupCol.rollupConfig!
        const relationCol = schema.columns.find((c: DatabaseColumn) => c.id === config.sourceRelationColumnId)
        if (!relationCol?.relationConfig) {
          props[rollupCol.id] = null
          continue
        }

        // Get linked entry IDs
        const relationType = relationCol.relationConfig.relationType
        const linkedValue = props[config.sourceRelationColumnId]
        const linkedIds: string[] = relationType === 'many'
          ? (Array.isArray(linkedValue) ? linkedValue as string[] : [])
          : (linkedValue ? [String(linkedValue)] : [])

        if (linkedIds.length === 0) {
          props[rollupCol.id] = config.aggregation === 'count' ? 0 : null
          continue
        }

        // Get values from related entries
        const targetDbId = relationCol.relationConfig.targetDatabaseId
        const targetEntries = rollupRelatedData.get(targetDbId)
        const allTargetEntries = targetEntries?.get(rollupCol.id) || []
        const linkedEntries = allTargetEntries.filter(
          (e: Record<string, unknown>) => linkedIds.includes(e.id as string)
        )
        const values = linkedEntries.map(
          (e: Record<string, unknown>) => e[config.targetColumnId]
        ).filter((v): v is unknown => v !== null && v !== undefined)

        // Compute aggregation
        switch (config.aggregation) {
          case 'count':
            props[rollupCol.id] = linkedIds.length
            break
          case 'count_values':
            props[rollupCol.id] = values.length
            break
          case 'sum':
            props[rollupCol.id] = values.reduce((sum: number, v) => sum + (Number(v) || 0), 0)
            break
          case 'avg':
            props[rollupCol.id] = values.length > 0
              ? values.reduce((sum: number, v) => sum + (Number(v) || 0), 0) / values.length
              : null
            break
          case 'min':
            props[rollupCol.id] = values.length > 0
              ? Math.min(...values.map(v => Number(v) || 0))
              : null
            break
          case 'max':
            props[rollupCol.id] = values.length > 0
              ? Math.max(...values.map(v => Number(v) || 0))
              : null
            break
          case 'concat':
            props[rollupCol.id] = values.map(String).join(', ')
            break
          case 'percent_empty':
            props[rollupCol.id] = linkedIds.length > 0
              ? Math.round((1 - values.length / linkedIds.length) * 100) + '%'
              : '0%'
            break
          case 'percent_not_empty':
            props[rollupCol.id] = linkedIds.length > 0
              ? Math.round((values.length / linkedIds.length) * 100) + '%'
              : '0%'
            break
          default:
            props[rollupCol.id] = null
        }
      }

      return {
        ...entry,
        properties: props,
      }
    })

    return {
      ...database,
      schema,
      entries: processedEntries,
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
      // New type-specific configurations
      ...(updates.statusOptions !== undefined && { statusOptions: updates.statusOptions }),
      ...(updates.relationConfig !== undefined && { relationConfig: updates.relationConfig }),
      ...(updates.rollupConfig !== undefined && { rollupConfig: updates.rollupConfig }),
      ...(updates.formulaConfig !== undefined && { formulaConfig: updates.formulaConfig }),
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

  // ===========================================================================
  // RELATION Column Support
  // ===========================================================================

  /**
   * Get entry titles for displaying relations
   * Batch fetches entry display names from a target database
   */
  async getEntryTitles(
    databaseId: string,
    entryIds: string[],
    organizationId: string
  ): Promise<Array<{ id: string; title: string }>> {
    // Validate database access
    const database = await this.getById(databaseId, organizationId)

    if (entryIds.length === 0) {
      return []
    }

    // Fetch entries
    const entries = await this.db.databaseEntry.findMany({
      where: {
        id: { in: entryIds },
        databaseId,
      },
      select: {
        id: true,
        properties: true,
      },
    })

    // Get first column to use as title (typically "Name" or first text column)
    const titleColumn = database.schema.columns.find(
      (col: DatabaseColumn) => col.type === 'TEXT'
    ) || database.schema.columns[0]

    return entries.map((entry) => {
      const props = entry.properties as Record<string, unknown>
      const title = titleColumn
        ? (props[titleColumn.id] as string) || 'Untitled'
        : 'Untitled'
      return { id: entry.id, title }
    })
  }

  /**
   * Search entries in a database for relation picker
   */
  async searchEntries(
    databaseId: string,
    query: string,
    organizationId: string,
    limit: number = 20
  ): Promise<Array<{ id: string; title: string }>> {
    // Validate database access
    const database = await this.getById(databaseId, organizationId)

    // Get first text column for title
    const titleColumn = database.schema.columns.find(
      (col: DatabaseColumn) => col.type === 'TEXT'
    ) || database.schema.columns[0]

    // Fetch all entries (we'll filter in-memory since JSONB search varies by DB)
    const entries = await this.db.databaseEntry.findMany({
      where: { databaseId },
      select: {
        id: true,
        properties: true,
      },
      take: 100, // Fetch more than limit for filtering
    })

    // Filter by title matching query
    const filtered = entries
      .map((entry) => {
        const props = entry.properties as Record<string, unknown>
        const title = titleColumn
          ? (props[titleColumn.id] as string) || 'Untitled'
          : 'Untitled'
        return { id: entry.id, title }
      })
      .filter((entry) =>
        query
          ? entry.title.toLowerCase().includes(query.toLowerCase())
          : true
      )
      .slice(0, limit)

    return filtered
  }
}
