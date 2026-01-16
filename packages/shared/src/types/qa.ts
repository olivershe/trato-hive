/**
 * Q&A Answer Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 *
 * [TASK-114] QAAnswerStatus Enum
 * [TASK-115] QAAnswer Model Types
 */

/**
 * QAAnswerStatus - Status of an AI-generated Q&A answer in the review workflow
 */
export const QAAnswerStatus = {
  PENDING: 'PENDING',   // AI generated, awaiting review
  APPROVED: 'APPROVED', // Reviewer accepted as-is
  EDITED: 'EDITED',     // Reviewer modified before accepting
  REJECTED: 'REJECTED', // Reviewer rejected
} as const

export type QAAnswerStatusValue = (typeof QAAnswerStatus)[keyof typeof QAAnswerStatus]

/**
 * Citation - Reference to source document for an answer
 */
export interface QACitation {
  id: string
  documentId: string
  documentName: string
  chunkId: string
  content: string
  pageNumber?: number
  relevanceScore: number
}

/**
 * QAAnswer - AI-generated answer with review workflow
 */
export interface QAAnswer {
  id: string
  organizationId: string
  question: string
  dealId: string | null
  documentId: string | null
  companyId: string | null
  answer: string
  citations: QACitation[]
  confidence: number | null
  status: QAAnswerStatusValue
  editedAnswer: string | null
  rejectionReason: string | null
  reviewerId: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * QAAnswerWithReviewer - QAAnswer with reviewer user details
 * Used for: Q&A history, audit trail
 */
export interface QAAnswerWithReviewer extends QAAnswer {
  reviewer: {
    id: string
    name: string | null
    email: string
  } | null
}

/**
 * QAAnswerWithDeal - QAAnswer with deal context
 * Used for: Deal Q&A pages
 */
export interface QAAnswerWithDeal extends QAAnswer {
  deal: {
    id: string
    name: string
  } | null
}

/**
 * Activity metadata structures for Q&A events
 */
export interface QAApprovedMetadata {
  qaAnswerId: string
  question: string
}

export interface QAEditedMetadata {
  qaAnswerId: string
  question: string
  originalAnswer: string
  editedAnswer: string
}

export interface QARejectedMetadata {
  qaAnswerId: string
  question: string
  reason?: string
}
