/**
 * Q&A Answer Validators
 *
 * Zod schemas for validating Q&A review flow inputs.
 * [TASK-115] Q&A Validators
 */
import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const qaAnswerStatusSchema = z.enum(['PENDING', 'APPROVED', 'EDITED', 'REJECTED'])

// =============================================================================
// Citation Schema
// =============================================================================

export const qaCitationSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentName: z.string(),
  chunkId: z.string(),
  content: z.string(),
  pageNumber: z.number().optional(),
  relevanceScore: z.number(),
})

export type QACitationInput = z.infer<typeof qaCitationSchema>

// =============================================================================
// Create QA Answer
// =============================================================================

export const createQAAnswerSchema = z.object({
  question: z.string().min(1).max(2000),
  dealId: z.string().cuid().optional().nullable(),
  documentId: z.string().cuid().optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  answer: z.string().min(1),
  citations: z.array(qaCitationSchema),
  confidence: z.number().min(0).max(1).optional().nullable(),
})

export type CreateQAAnswerInput = z.infer<typeof createQAAnswerSchema>

// =============================================================================
// Get QA Answer
// =============================================================================

export const getQAAnswerSchema = z.object({
  id: z.string().cuid(),
})

export type GetQAAnswerInput = z.infer<typeof getQAAnswerSchema>

// =============================================================================
// Approve QA Answer
// =============================================================================

export const approveQAAnswerSchema = z.object({
  qaAnswerId: z.string().cuid(),
})

export type ApproveQAAnswerInput = z.infer<typeof approveQAAnswerSchema>

// =============================================================================
// Edit QA Answer
// =============================================================================

export const editQAAnswerSchema = z.object({
  qaAnswerId: z.string().cuid(),
  editedAnswer: z.string().min(1).max(10000),
})

export type EditQAAnswerInput = z.infer<typeof editQAAnswerSchema>

// =============================================================================
// Reject QA Answer
// =============================================================================

export const rejectQAAnswerSchema = z.object({
  qaAnswerId: z.string().cuid(),
  reason: z.string().max(1000).optional(),
})

export type RejectQAAnswerInput = z.infer<typeof rejectQAAnswerSchema>

// =============================================================================
// List QA Answers
// =============================================================================

export const listQAAnswersSchema = z.object({
  dealId: z.string().cuid().optional(),
  documentId: z.string().cuid().optional(),
  companyId: z.string().cuid().optional(),
  status: qaAnswerStatusSchema.optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
})

export type ListQAAnswersInput = z.infer<typeof listQAAnswersSchema>
