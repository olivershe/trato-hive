/**
 * Q&A Router - tRPC router for Q&A review flow operations
 * [TASK-116]
 */
import { router, organizationProtectedProcedure } from '../trpc/init'
import { QAService } from '../services/qa.service'
import {
  createQAAnswerSchema,
  getQAAnswerSchema,
  approveQAAnswerSchema,
  editQAAnswerSchema,
  rejectQAAnswerSchema,
  listQAAnswersSchema,
} from '@trato-hive/shared'

function createQAService(ctx: { db: any }) {
  return new QAService(ctx.db)
}

export const qaRouter = router({
  /**
   * Create a new Q&A answer record
   * Called after AI generates a response to persist it for review
   */
  create: organizationProtectedProcedure
    .input(createQAAnswerSchema)
    .mutation(({ ctx, input }) =>
      createQAService(ctx).create(input, ctx.organizationId)
    ),

  /**
   * Get a single Q&A answer by ID
   */
  get: organizationProtectedProcedure
    .input(getQAAnswerSchema)
    .query(({ ctx, input }) =>
      createQAService(ctx).getById(input.id, ctx.organizationId)
    ),

  /**
   * Approve an AI-generated answer as-is
   */
  approve: organizationProtectedProcedure
    .input(approveQAAnswerSchema)
    .mutation(({ ctx, input }) =>
      createQAService(ctx).approve(input, ctx.session.user.id, ctx.organizationId)
    ),

  /**
   * Edit and approve an AI-generated answer
   */
  edit: organizationProtectedProcedure
    .input(editQAAnswerSchema)
    .mutation(({ ctx, input }) =>
      createQAService(ctx).edit(input, ctx.session.user.id, ctx.organizationId)
    ),

  /**
   * Reject an AI-generated answer
   */
  reject: organizationProtectedProcedure
    .input(rejectQAAnswerSchema)
    .mutation(({ ctx, input }) =>
      createQAService(ctx).reject(input, ctx.session.user.id, ctx.organizationId)
    ),

  /**
   * List Q&A answers with filtering and pagination
   */
  list: organizationProtectedProcedure
    .input(listQAAnswersSchema)
    .query(({ ctx, input }) =>
      createQAService(ctx).list(input, ctx.organizationId)
    ),
})
