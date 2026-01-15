/**
 * Company Router
 *
 * tRPC router for Company CRUD operations.
 * All procedures use organizationProtectedProcedure for multi-tenancy.
 *
 * [TASK-106] Company tRPC Router
 */
import { z } from 'zod';
import { router, organizationProtectedProcedure } from '../trpc/init';
import { CompanyService } from '../services/company.service';
import { ActivityService } from '../services';
import {
  // List, Get, Search schemas from discovery.ts
  companyListInputSchema,
  companyGetInputSchema,
  companySearchInputSchema,
  // Router-specific schemas from company.ts
  routerCreateCompanySchema,
  routerUpdateCompanySchema,
} from '@trato-hive/shared';
import { ActivityType } from '@trato-hive/db';

export const companyRouter = router({
  /**
   * company.list - List companies with pagination and filtering
   * Auth: organizationProtectedProcedure
   */
  list: organizationProtectedProcedure
    .input(companyListInputSchema)
    .query(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      return companyService.list(input, ctx.organizationId);
    }),

  /**
   * company.get - Get single company by ID
   * Auth: organizationProtectedProcedure
   * Throws: NOT_FOUND if company doesn't exist or belongs to different org
   */
  get: organizationProtectedProcedure
    .input(companyGetInputSchema)
    .query(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      return companyService.getById(input.id, ctx.organizationId);
    }),

  /**
   * company.getWithPage - Get company with its associated Page and blocks
   * Auth: organizationProtectedProcedure
   * Used by: Editor view to load company document
   */
  getWithPage: organizationProtectedProcedure
    .input(companyGetInputSchema)
    .query(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      return companyService.getWithPage(input.id, ctx.organizationId);
    }),

  /**
   * company.getWithDeals - Get company with deal history
   * Auth: organizationProtectedProcedure
   * Used by: Company Page Deal History section
   */
  getWithDeals: organizationProtectedProcedure
    .input(companyGetInputSchema)
    .query(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      return companyService.getWithDeals(input.id, ctx.organizationId);
    }),

  /**
   * company.create - Create new company with auto-created Page
   * Auth: organizationProtectedProcedure
   * Side effect: Creates Page + CompanyHeaderBlock, logs COMPANY_ADDED activity
   */
  create: organizationProtectedProcedure
    .input(routerCreateCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      const activityService = new ActivityService(ctx.db);

      const company = await companyService.create(
        input,
        ctx.organizationId,
        ctx.session.user.id
      );

      // Audit log
      await activityService.log({
        userId: ctx.session.user.id,
        type: ActivityType.COMPANY_ADDED,
        description: `Created company: ${company.name}`,
        metadata: {
          companyId: company.id,
          industry: company.industry,
          status: company.status,
        },
      });

      return company;
    }),

  /**
   * company.update - Update existing company
   * Auth: organizationProtectedProcedure
   */
  update: organizationProtectedProcedure
    .input(routerUpdateCompanySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const companyService = new CompanyService(ctx.db);

      return companyService.update(id, data, ctx.organizationId);
    }),

  /**
   * company.delete - Delete company
   * Auth: organizationProtectedProcedure
   * Warning: This is a hard delete - consider soft delete for production
   */
  delete: organizationProtectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      return companyService.delete(input.id, ctx.organizationId);
    }),

  /**
   * company.search - Search companies by name, industry, location
   * Auth: organizationProtectedProcedure
   * Used by: Command Palette entity search
   */
  search: organizationProtectedProcedure
    .input(companySearchInputSchema)
    .query(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      return companyService.search(input, ctx.organizationId);
    }),

  /**
   * company.getRelated - Get related companies by similarity
   * Auth: organizationProtectedProcedure
   * Used by: RelatedCompaniesBlock on Company Page
   * [TASK-105] Related Companies Section
   */
  getRelated: organizationProtectedProcedure
    .input(z.object({
      id: z.string().min(1),
      limit: z.number().min(1).max(20).optional().default(6),
    }))
    .query(async ({ ctx, input }) => {
      const companyService = new CompanyService(ctx.db);
      return companyService.getRelatedCompanies(
        input.id,
        ctx.organizationId,
        input.limit
      );
    }),
});
