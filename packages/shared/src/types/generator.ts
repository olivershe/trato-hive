/**
 * Generator Types
 * Types for document export operations
 */

/**
 * Result from exporting a page to PPTX or DOCX
 */
export interface ExportResult {
  buffer: Buffer
  filename: string
  mimeType: string
  pageTitle: string
  blockCount: number
  citationCount: number
}

/**
 * Citation reference extracted from CitationBlock
 * Used for footnotes (DOCX) and Sources slide (PPTX)
 */
export interface CitationReference {
  index: number // Sequential: [1], [2], [3]...
  factId: string
  subject: string
  predicate: string
  object: string
  sourceText: string
  documentName: string
  confidence: number
}

/**
 * Options for document export
 */
export interface GeneratorExportOptions {
  includeTitle?: boolean
  includeCitations?: boolean
  // PPTX-specific
  slideBreakOnH1?: boolean
  // DOCX-specific
  citationStyle?: 'footnote' | 'endnote'
}

/**
 * Supported export formats
 */
export type ExportFormat = 'pptx' | 'docx'

/**
 * MIME types for export formats
 */
export const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}
