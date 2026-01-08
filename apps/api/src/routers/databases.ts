/**
 * Databases Router
 *
 * tRPC router for Inline Database CRUD operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { z } from 'zod'
import { router, organizationProtectedProcedure } from '../trpc/init'
import { DatabaseService } from '../services/database.service'
import { FactMapperService } from '../services/fact-mapper.service'
import { ActivityService } from '../services'
import {
  routerCreateDatabaseSchema,
  updateDatabaseSchema,
  updateDatabaseSchemaSchema,
  addColumnSchema,
  updateColumnSchema,
  deleteColumnSchema,
  createDatabaseEntrySchema,
  updateDatabaseEntrySchema,
  updateCellSchema,
  getDatabaseSchema,
  listDatabasesSchema,
  listEntriesSchema,
  suggestEntriesFromFactsSchema,
} from '@trato-hive/shared'
import { ActivityType } from '@trato-hive/db'

export const databasesRouter = router({
  // ===========================================================================
  // Database CRUD
  // ===========================================================================

  /**
   * database.list - List databases with pagination
   * Auth: organizationProtectedProcedure
   */
  list: organizationProtectedProcedure
    .input(listDatabasesSchema)
    .query(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.list(input, ctx.organizationId)
    }),

  /**
   * database.getById - Get database with entries
   * Auth: organizationProtectedProcedure
   */
  getById: organizationProtectedProcedure
    .input(getDatabaseSchema)
    .query(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.getById(input.id, ctx.organizationId)
    }),

  /**
   * database.create - Create new database
   * Auth: organizationProtectedProcedure
   * Side effect: Logs activity
   */
  create: organizationProtectedProcedure
    .input(routerCreateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      const activityService = new ActivityService(ctx.db)

      const database = await service.create(
        input,
        ctx.organizationId,
        ctx.session.user.id
      )

      // Audit log
      await activityService.log({
        userId: ctx.session.user.id,
        type: ActivityType.USER_ACTION,
        description: `Created database: ${database.name}`,
        metadata: {
          databaseId: database.id,
          columnCount: database.schema.columns.length,
        },
      })

      return database
    }),

  /**
   * database.update - Update database metadata
   * Auth: organizationProtectedProcedure
   */
  update: organizationProtectedProcedure
    .input(updateDatabaseSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.update(input, ctx.organizationId)
    }),

  /**
   * database.updateSchema - Update database columns
   * Auth: organizationProtectedProcedure
   */
  updateSchema: organizationProtectedProcedure
    .input(updateDatabaseSchemaSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.updateSchema(input, ctx.organizationId)
    }),

  /**
   * database.addColumn - Add column to database
   * Auth: organizationProtectedProcedure
   */
  addColumn: organizationProtectedProcedure
    .input(addColumnSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.addColumn(input, ctx.organizationId)
    }),

  /**
   * database.updateColumn - Update column in database
   * Auth: organizationProtectedProcedure
   */
  updateColumn: organizationProtectedProcedure
    .input(updateColumnSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.updateColumn(input, ctx.organizationId)
    }),

  /**
   * database.deleteColumn - Delete column from database
   * Auth: organizationProtectedProcedure
   */
  deleteColumn: organizationProtectedProcedure
    .input(deleteColumnSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.deleteColumn(input, ctx.organizationId)
    }),

  /**
   * database.delete - Delete database
   * Auth: organizationProtectedProcedure
   */
  delete: organizationProtectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      const activityService = new ActivityService(ctx.db)

      // Get database name before deleting
      const database = await service.getById(input.id, ctx.organizationId)

      await service.delete(input.id, ctx.organizationId)

      // Audit log
      await activityService.log({
        userId: ctx.session.user.id,
        type: ActivityType.USER_ACTION,
        description: `Deleted database: ${database.name}`,
        metadata: { databaseId: input.id },
      })

      return { success: true }
    }),

  // ===========================================================================
  // Entry CRUD
  // ===========================================================================

  /**
   * database.listEntries - List entries with pagination
   * Auth: organizationProtectedProcedure
   */
  listEntries: organizationProtectedProcedure
    .input(listEntriesSchema)
    .query(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.listEntries(input, ctx.organizationId)
    }),

  /**
   * database.createEntry - Create entry (row)
   * Auth: organizationProtectedProcedure
   */
  createEntry: organizationProtectedProcedure
    .input(createDatabaseEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.createEntry(input, ctx.organizationId, ctx.session.user.id)
    }),

  /**
   * database.updateEntry - Update entry
   * Auth: organizationProtectedProcedure
   */
  updateEntry: organizationProtectedProcedure
    .input(updateDatabaseEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.updateEntry(input, ctx.organizationId)
    }),

  /**
   * database.updateCell - Update single cell (optimized for inline editing)
   * Auth: organizationProtectedProcedure
   */
  updateCell: organizationProtectedProcedure
    .input(updateCellSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.updateCell(input, ctx.organizationId)
    }),

  /**
   * database.deleteEntry - Delete entry
   * Auth: organizationProtectedProcedure
   */
  deleteEntry: organizationProtectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.deleteEntry(input.id, ctx.organizationId)
    }),

  /**
   * database.duplicateEntry - Duplicate entry
   * Auth: organizationProtectedProcedure
   */
  duplicateEntry: organizationProtectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.duplicateEntry(
        input.id,
        ctx.organizationId,
        ctx.session.user.id
      )
    }),

  /**
   * database.bulkCreateEntries - Bulk create entries (for CSV import)
   * Auth: organizationProtectedProcedure
   */
  bulkCreateEntries: organizationProtectedProcedure
    .input(
      z.object({
        databaseId: z.string().cuid(),
        entries: z.array(
          z.object({
            properties: z.record(z.unknown()),
          })
        ).min(1).max(1000), // Limit to 1000 entries per import
      })
    )
    .mutation(async ({ ctx, input }) => {
      const service = new DatabaseService(ctx.db)
      return service.bulkCreateEntries(
        input.databaseId,
        input.entries,
        ctx.organizationId,
        ctx.session.user.id
      )
    }),

  // ===========================================================================
  // AI Suggestions (Entity Fact Mapper)
  // ===========================================================================

  /**
   * database.suggestEntriesFromFacts - AI-powered entry suggestions from extracted facts
   * Auth: organizationProtectedProcedure
   * Maps facts from deal documents to suggested database entries
   */
  suggestEntriesFromFacts: organizationProtectedProcedure
    .input(suggestEntriesFromFactsSchema)
    .query(async ({ ctx, input }) => {
      const service = new FactMapperService(ctx.db)
      return service.suggestEntriesFromFacts(
        input.databaseId,
        input.dealId,
        ctx.organizationId,
        {
          minConfidence: input.minConfidence,
          maxSuggestions: input.maxSuggestions,
        }
      )
    }),
})
