/**
 * VDR (Virtual Data Room) Validators
 * Input schemas for document listing, upload, and folder management
 */
import { z } from 'zod'
import { DocumentType } from '../types/document'

const documentTypeValues = Object.values(DocumentType) as [string, ...string[]]

/**
 * List Documents Input - Filter and pagination for document listing
 */
export const listDocumentsInputSchema = z.object({
  dealId: z.string().cuid('Invalid deal ID').optional(),
  companyId: z.string().cuid('Invalid company ID').optional(),
  folderPath: z.string().optional(), // e.g., "/Legal/Contracts"
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
  status: z
    .enum(['UPLOADING', 'PROCESSING', 'PARSED', 'INDEXED', 'FAILED'])
    .optional(),
  search: z.string().optional(), // Search by document name
})

export type ListDocumentsInput = z.infer<typeof listDocumentsInputSchema>

/**
 * Get Folder Tree Input - For hierarchical folder structure
 */
export const getFolderTreeInputSchema = z.object({
  dealId: z.string().cuid('Invalid deal ID').optional(),
  companyId: z.string().cuid('Invalid company ID').optional(),
})

export type GetFolderTreeInput = z.infer<typeof getFolderTreeInputSchema>

/**
 * Get Upload URL Input - Generate presigned S3 upload URL
 */
export const getUploadUrlInputSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  folderPath: z.string().optional(),
  dealId: z.string().cuid('Invalid deal ID').optional(),
  companyId: z.string().cuid('Invalid company ID').optional(),
  mimeType: z.string().min(1, 'MIME type is required'),
  fileSize: z.number().int().min(1, 'File size must be positive'),
})

export type GetUploadUrlInput = z.infer<typeof getUploadUrlInputSchema>

/**
 * Get Download URL Input - Generate presigned S3 download URL
 */
export const getDownloadUrlInputSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
})

export type GetDownloadUrlInput = z.infer<typeof getDownloadUrlInputSchema>

/**
 * Create Document Input - Create document record after S3 upload
 */
export const createDocumentInputSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  folderPath: z.string().optional(),
  dealId: z.string().cuid('Invalid deal ID').optional(),
  companyId: z.string().cuid('Invalid company ID').optional(),
  fileUrl: z.string().min(1, 'File URL is required'), // S3 key
  fileSize: z.number().int().min(1, 'File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  type: z.enum(documentTypeValues).default(DocumentType.OTHER),
})

export type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>

/**
 * Create Folder Input - Create virtual folder
 */
export const createFolderInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name too long')
    .regex(/^[^/\\]+$/, 'Folder name cannot contain slashes'),
  parentPath: z.string().optional(), // e.g., "/Legal" -> creates "/Legal/NewFolder"
  dealId: z.string().cuid('Invalid deal ID').optional(),
  companyId: z.string().cuid('Invalid company ID').optional(),
})

export type CreateFolderInput = z.infer<typeof createFolderInputSchema>

/**
 * Move Document Input - Move document to different folder
 */
export const moveDocumentInputSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  targetFolderPath: z.string(), // e.g., "/Legal/Contracts"
})

export type MoveDocumentInput = z.infer<typeof moveDocumentInputSchema>

/**
 * Delete Document Input - Remove document
 */
export const deleteDocumentInputSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  deleteFromStorage: z.boolean().default(false), // Also delete from S3
})

export type DeleteDocumentInput = z.infer<typeof deleteDocumentInputSchema>

/**
 * Get Document Input - Get single document by ID
 */
export const getDocumentInputSchema = z.object({
  id: z.string().cuid('Invalid document ID'),
})

export type GetDocumentInput = z.infer<typeof getDocumentInputSchema>

/**
 * Rename Folder Input - Rename a virtual folder
 */
export const renameFolderInputSchema = z.object({
  folderPath: z.string().min(1, 'Folder path is required'),
  newName: z
    .string()
    .min(1, 'New folder name is required')
    .max(100, 'Folder name too long')
    .regex(/^[^/\\]+$/, 'Folder name cannot contain slashes'),
  dealId: z.string().cuid('Invalid deal ID').optional(),
  companyId: z.string().cuid('Invalid company ID').optional(),
})

export type RenameFolderInput = z.infer<typeof renameFolderInputSchema>
