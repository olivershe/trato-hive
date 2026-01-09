/**
 * Document Types
 * Based on Prisma schema: packages/db/prisma/schema.prisma
 */

/**
 * DocumentType - Classification of document content
 */
export const DocumentType = {
  FINANCIAL_STATEMENT: 'FINANCIAL_STATEMENT',
  CONTRACT: 'CONTRACT',
  PRESENTATION: 'PRESENTATION',
  MEMORANDUM: 'MEMORANDUM',
  LEGAL_DOCUMENT: 'LEGAL_DOCUMENT',
  TECHNICAL_DOCUMENT: 'TECHNICAL_DOCUMENT',
  OTHER: 'OTHER',
} as const

export type DocumentTypeValue = (typeof DocumentType)[keyof typeof DocumentType]

/**
 * DocumentStatus - Processing lifecycle status
 */
export const DocumentStatus = {
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  PARSED: 'PARSED',
  INDEXED: 'INDEXED',
  FAILED: 'FAILED',
} as const

export type DocumentStatusValue = (typeof DocumentStatus)[keyof typeof DocumentStatus]

/**
 * Document - VDR document entity (Module 4: Diligence Room)
 */
export interface Document {
  id: string
  organizationId: string
  companyId: string | null
  dealId: string | null
  uploadedById: string
  name: string
  type: DocumentTypeValue
  status: DocumentStatusValue
  folderPath: string | null // VDR folder path e.g., "/Legal/Contracts"
  fileSize: number // bytes
  mimeType: string
  fileUrl: string // S3 URL
  parsedAt: Date | null
  indexedAt: Date | null
  errorMessage: string | null
  reductoJobId: string | null
  reductoData: unknown | null // JSON from Reducto AI
  createdAt: Date
  updatedAt: Date
}

/**
 * DocumentChunk - Parsed chunk with vector embedding (Layer 2: Semantic Layer)
 */
export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  pageNumber: number | null
  chunkIndex: number
  boundingBox: unknown | null // JSON bounding box for citations
  vectorId: string | null // Pinecone vector ID
  createdAt: Date
  updatedAt: Date
}

/**
 * DocumentWithChunks - Document with parsed chunks
 * Used for: Citation modal, document viewer
 */
export interface DocumentWithChunks extends Document {
  chunks: DocumentChunk[]
}

/**
 * DocumentWithFacts - Document with extracted facts
 * Used for: Document analysis, fact extraction review
 */
export interface DocumentWithFacts extends Document {
  facts: Array<{
    id: string
    type: string
    subject: string
    predicate: string
    object: string
    confidence: number
    sourceText: string | null
    createdAt: Date
  }>
}

/**
 * DocumentWithUploader - Document with uploader user info
 * Used for: Document list, audit trail
 */
export interface DocumentWithUploader extends Document {
  uploadedBy: {
    id: string
    name: string | null
    email: string
  }
}
