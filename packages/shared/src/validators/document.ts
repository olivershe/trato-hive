/**
 * Document Validators
 */
import { z } from 'zod'
import { DocumentType } from '../types/document'

const documentTypeValues = Object.values(DocumentType) as [string, ...string[]]

export const uploadDocumentSchema = z.object({
  dealId: z.string().cuid('Invalid deal ID').nullable().optional(), // Can act as a filter of sorts or direct assignment
  organizationId: z.string().cuid('Invalid organization ID'),
  companyId: z.string().cuid('Invalid company ID').nullable().optional(),
  name: z.string().min(1, 'File name is required'),
  type: z.enum(documentTypeValues).default(DocumentType.OTHER),
  fileSize: z.number().int().min(0),
  mimeType: z.string(),
  // fileUrl comes from S3 after upload, might be part of a 'createDocumentRecord' schema
})

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>

export const createDocumentRecordSchema = uploadDocumentSchema.extend({
  fileUrl: z.string().url('Invalid file URL'),
  uploadedById: z.string().cuid('Invalid uploader ID'),
})

export type CreateDocumentRecordInput = z.infer<typeof createDocumentRecordSchema>
