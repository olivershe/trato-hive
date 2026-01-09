/**
 * Sourcing Router
 *
 * tRPC router for company discovery and search operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 */
import { router, organizationProtectedProcedure } from '../trpc/init'
import { SourcingService } from '../services/sourcing.service'
import {
  companySearchInputSchema,
  companyListInputSchema,
  companyGetInputSchema,
} from '@trato-hive/shared'

export const sourcingRouter = router({
  /**
   * sourcing.search - Text search across companies
   * Auth: organizationProtectedProcedure
   * Searches: name, industry, description, sector, location
   */
  search: organizationProtectedProcedure
    .input(companySearchInputSchema)
    .query(async ({ ctx, input }) => {
      const sourcingService = new SourcingService(ctx.db)
      return sourcingService.search(input, ctx.organizationId)
    }),

  /**
   * sourcing.list - List companies with filters
   * Auth: organizationProtectedProcedure
   */
  list: organizationProtectedProcedure
    .input(companyListInputSchema)
    .query(async ({ ctx, input }) => {
      const sourcingService = new SourcingService(ctx.db)
      return sourcingService.list(input, ctx.organizationId)
    }),

  /**
   * sourcing.get - Get single company with facts
   * Auth: organizationProtectedProcedure
   * Throws: NOT_FOUND if company doesn't exist or belongs to different org
   */
  get: organizationProtectedProcedure
    .input(companyGetInputSchema)
    .query(async ({ ctx, input }) => {
      const sourcingService = new SourcingService(ctx.db)
      return sourcingService.getById(input.id, ctx.organizationId)
    }),

  /**
   * sourcing.industries - Get distinct industries for filter dropdown
   * Auth: organizationProtectedProcedure
   */
  industries: organizationProtectedProcedure.query(async ({ ctx }) => {
    const sourcingService = new SourcingService(ctx.db)
    return sourcingService.getIndustries(ctx.organizationId)
  }),
})
