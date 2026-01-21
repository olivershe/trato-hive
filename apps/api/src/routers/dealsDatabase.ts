/**
 * Deals Database Router
 *
 * tRPC router for org-level Deals Database operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 *
 * Phase 12: Deals Database Architecture Migration
 */
import { z } from 'zod'
import { router, organizationProtectedProcedure } from '../trpc/init'
import { DealsDatabaseService } from '../services/dealsDatabase.service'

// Input schemas
const listDealsInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(50),
  search: z.string().optional(),
})

const getEntryInputSchema = z.object({
  entryId: z.string(),
})

const updateEntryInputSchema = z.object({
  entryId: z.string(),
  properties: z.record(z.unknown()),
})

export const dealsDatabaseRouter = router({
  /**
   * dealsDatabase.get - Get the org-level Deals Database
   * Auth: organizationProtectedProcedure
   * Returns null if doesn't exist yet (lazy creation on first deal)
   */
  get: organizationProtectedProcedure
    .query(async ({ ctx }) => {
      const service = new DealsDatabaseService(ctx.db)
      return service.getDealsDatabase(ctx.organizationId)
    }),

  /**
   * dealsDatabase.getOrCreate - Get or create the org-level Deals Database
   * Auth: organizationProtectedProcedure
   * Creates the database if it doesn't exist
   */
  getOrCreate: organizationProtectedProcedure
    .mutation(async ({ ctx }) => {
      const service = new DealsDatabaseService(ctx.db)
      return service.getOrCreateDealsDatabase(ctx.organizationId, ctx.session.user.id)
    }),

  /**
   * dealsDatabase.getSchema - Get the schema for the Deals Database
   * Auth: organizationProtectedProcedure
   * Used by Copilot and UI to understand available columns
   */
  getSchema: organizationProtectedProcedure
    .query(async ({ ctx }) => {
      const service = new DealsDatabaseService(ctx.db)
      return service.getSchema(ctx.organizationId)
    }),

  /**
   * dealsDatabase.listDeals - List deal entries (deals in the database)
   * Auth: organizationProtectedProcedure
   * Paginated list of database entries representing deals
   */
  listDeals: organizationProtectedProcedure
    .input(listDealsInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new DealsDatabaseService(ctx.db)
      return service.listDeals(ctx.organizationId, input)
    }),

  /**
   * dealsDatabase.getEntry - Get a single deal entry by ID
   * Auth: organizationProtectedProcedure
   * Returns entry with schema for properties panel
   */
  getEntry: organizationProtectedProcedure
    .input(getEntryInputSchema)
    .query(async ({ ctx, input }) => {
      const service = new DealsDatabaseService(ctx.db)
      return service.getEntryById(input.entryId, ctx.organizationId)
    }),

  /**
   * dealsDatabase.updateEntry - Update a deal entry's properties
   * Auth: organizationProtectedProcedure
   * Updates the database entry properties (not the Deal table directly)
   */
  updateEntry: organizationProtectedProcedure
    .input(updateEntryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new DealsDatabaseService(ctx.db)
      return service.updateDealEntry(
        input.entryId,
        input.properties,
        ctx.organizationId
      )
    }),
})
