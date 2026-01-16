/**
 * Q&A Answer Service
 *
 * Business logic for Q&A review workflow operations.
 * Handles creating, reviewing, approving, editing, and rejecting AI answers.
 *
 * [TASK-116] Q&A Review API
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, QAAnswerStatus } from '@trato-hive/db'
import { ActivityType } from '@trato-hive/db'
import { ActivityService } from './activity.service'
import type {
  CreateQAAnswerInput,
  ApproveQAAnswerInput,
  EditQAAnswerInput,
  RejectQAAnswerInput,
  ListQAAnswersInput,
} from '@trato-hive/shared'

// =============================================================================
// Types
// =============================================================================

export interface QAAnswerListResult {
  items: QAAnswerWithReviewer[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface QAAnswerWithReviewer {
  id: string
  organizationId: string
  question: string
  dealId: string | null
  documentId: string | null
  companyId: string | null
  answer: string
  citations: unknown
  confidence: number | null
  status: QAAnswerStatus
  editedAnswer: string | null
  rejectionReason: string | null
  reviewerId: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
  reviewer: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface QAAnswerResult {
  id: string
  status: QAAnswerStatus
  activityId?: string
}

// =============================================================================
// Service Class
// =============================================================================

export class QAService {
  private activityService: ActivityService

  constructor(private db: PrismaClient) {
    this.activityService = new ActivityService(db)
  }

  // ===========================================================================
  // Create QA Answer
  // ===========================================================================

  /**
   * Create a new QAAnswer record after AI generates a response
   * Multi-tenancy: Sets organizationId from context
   */
  async create(
    input: CreateQAAnswerInput,
    organizationId: string
  ): Promise<QAAnswerWithReviewer> {
    const qaAnswer = await this.db.qAAnswer.create({
      data: {
        organizationId,
        question: input.question,
        dealId: input.dealId || null,
        documentId: input.documentId || null,
        companyId: input.companyId || null,
        answer: input.answer,
        citations: input.citations,
        confidence: input.confidence || null,
        status: 'PENDING',
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return qaAnswer as QAAnswerWithReviewer
  }

  // ===========================================================================
  // Get QA Answer
  // ===========================================================================

  /**
   * Get a single QAAnswer by ID
   * Multi-tenancy: Validates answer belongs to organization
   */
  async getById(
    id: string,
    organizationId: string
  ): Promise<QAAnswerWithReviewer> {
    const qaAnswer = await this.db.qAAnswer.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!qaAnswer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Q&A answer not found',
      })
    }

    if (qaAnswer.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Q&A answer not found',
      })
    }

    return qaAnswer as QAAnswerWithReviewer
  }

  // ===========================================================================
  // Approve QA Answer
  // ===========================================================================

  /**
   * Approve an AI-generated answer
   * Sets status to APPROVED and logs activity
   */
  async approve(
    input: ApproveQAAnswerInput,
    reviewerId: string,
    organizationId: string
  ): Promise<QAAnswerResult> {
    const qaAnswer = await this.getById(input.qaAnswerId, organizationId)

    if (qaAnswer.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Q&A answer has already been reviewed',
      })
    }

    await this.db.qAAnswer.update({
      where: { id: input.qaAnswerId },
      data: {
        status: 'APPROVED',
        reviewerId,
        reviewedAt: new Date(),
      },
    })

    const activity = await this.activityService.log({
      userId: reviewerId,
      dealId: qaAnswer.dealId || undefined,
      type: ActivityType.QA_APPROVED,
      description: `Approved Q&A answer for: "${this.truncateQuestion(qaAnswer.question)}"`,
      metadata: {
        qaAnswerId: qaAnswer.id,
        question: qaAnswer.question,
      },
    })

    return {
      id: qaAnswer.id,
      status: 'APPROVED' as QAAnswerStatus,
      activityId: activity.id,
    }
  }

  // ===========================================================================
  // Edit QA Answer
  // ===========================================================================

  /**
   * Edit and approve an AI-generated answer
   * Sets status to EDITED and logs activity with diff
   */
  async edit(
    input: EditQAAnswerInput,
    reviewerId: string,
    organizationId: string
  ): Promise<QAAnswerResult> {
    const qaAnswer = await this.getById(input.qaAnswerId, organizationId)

    if (qaAnswer.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Q&A answer has already been reviewed',
      })
    }

    await this.db.qAAnswer.update({
      where: { id: input.qaAnswerId },
      data: {
        status: 'EDITED',
        editedAnswer: input.editedAnswer,
        reviewerId,
        reviewedAt: new Date(),
      },
    })

    const activity = await this.activityService.log({
      userId: reviewerId,
      dealId: qaAnswer.dealId || undefined,
      type: ActivityType.QA_EDITED,
      description: `Edited Q&A answer for: "${this.truncateQuestion(qaAnswer.question)}"`,
      metadata: {
        qaAnswerId: qaAnswer.id,
        question: qaAnswer.question,
        originalAnswer: qaAnswer.answer,
        editedAnswer: input.editedAnswer,
      },
    })

    return {
      id: qaAnswer.id,
      status: 'EDITED' as QAAnswerStatus,
      activityId: activity.id,
    }
  }

  // ===========================================================================
  // Reject QA Answer
  // ===========================================================================

  /**
   * Reject an AI-generated answer
   * Sets status to REJECTED and logs activity
   */
  async reject(
    input: RejectQAAnswerInput,
    reviewerId: string,
    organizationId: string
  ): Promise<QAAnswerResult> {
    const qaAnswer = await this.getById(input.qaAnswerId, organizationId)

    if (qaAnswer.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Q&A answer has already been reviewed',
      })
    }

    await this.db.qAAnswer.update({
      where: { id: input.qaAnswerId },
      data: {
        status: 'REJECTED',
        rejectionReason: input.reason || null,
        reviewerId,
        reviewedAt: new Date(),
      },
    })

    const activity = await this.activityService.log({
      userId: reviewerId,
      dealId: qaAnswer.dealId || undefined,
      type: ActivityType.QA_REJECTED,
      description: `Rejected Q&A answer for: "${this.truncateQuestion(qaAnswer.question)}"`,
      metadata: {
        qaAnswerId: qaAnswer.id,
        question: qaAnswer.question,
        reason: input.reason,
      },
    })

    return {
      id: qaAnswer.id,
      status: 'REJECTED' as QAAnswerStatus,
      activityId: activity.id,
    }
  }

  // ===========================================================================
  // List QA Answers
  // ===========================================================================

  /**
   * List Q&A answers with filtering and pagination
   * Multi-tenancy: Filters by organizationId
   */
  async list(
    input: ListQAAnswersInput,
    organizationId: string
  ): Promise<QAAnswerListResult> {
    const { page = 1, pageSize = 20, dealId, documentId, companyId, status } = input
    const skip = (page - 1) * pageSize

    const where = {
      organizationId,
      ...(dealId && { dealId }),
      ...(documentId && { documentId }),
      ...(companyId && { companyId }),
      ...(status && { status }),
    }

    const [items, total] = await Promise.all([
      this.db.qAAnswer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.db.qAAnswer.count({ where }),
    ])

    return {
      items: items as QAAnswerWithReviewer[],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Truncate question for activity description
   */
  private truncateQuestion(question: string, maxLength = 50): string {
    if (question.length <= maxLength) return question
    return question.slice(0, maxLength) + '...'
  }
}
