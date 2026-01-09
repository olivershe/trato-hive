/**
 * Generator Validators
 * Zod schemas for document export operations
 */

import { z } from 'zod'

/**
 * Export options for PPTX/DOCX generation
 */
export const exportOptionsSchema = z
  .object({
    includeTitle: z.boolean().default(true),
    includeCitations: z.boolean().default(true),
    // PPTX-specific
    slideBreakOnH1: z.boolean().default(true),
    // DOCX-specific
    citationStyle: z.enum(['footnote', 'endnote']).default('footnote'),
  })
  .optional()

export type ExportOptions = z.infer<typeof exportOptionsSchema>

/**
 * Input for exporting a page to PPTX or DOCX
 */
export const exportPageInputSchema = z.object({
  pageId: z.string().cuid('Invalid page ID'),
  format: z.enum(['pptx', 'docx']),
  options: exportOptionsSchema,
})

export type ExportPageInput = z.infer<typeof exportPageInputSchema>

/**
 * Output from page export
 */
export const exportPageOutputSchema = z.object({
  data: z.string(), // Base64 encoded file
  filename: z.string(),
  mimeType: z.string(),
  pageTitle: z.string(),
  blockCount: z.number().int(),
  citationCount: z.number().int(),
})

export type ExportPageOutput = z.infer<typeof exportPageOutputSchema>
