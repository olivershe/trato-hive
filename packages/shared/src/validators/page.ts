/**
 * Page Validators - Notion-like page hierarchy
 */
import { z } from 'zod'

/**
 * Create Page Input
 */
export const createPageSchema = z.object({
  dealId: z.string().min(1, { message: 'Deal ID is required' }),
  parentPageId: z.string().min(1, { message: 'Parent page ID is required' }).optional(),
  title: z.string().min(1, 'Title is required').max(255),
  icon: z.string().optional(),
  isDatabase: z.boolean().default(false),
})

export type CreatePageInput = z.infer<typeof createPageSchema>

/**
 * Router-specific create schema (dealId can come from params or body)
 */
export const routerCreatePageSchema = createPageSchema

export type RouterCreatePageInput = z.infer<typeof routerCreatePageSchema>

/**
 * Update Page Input
 */
export const updatePageSchema = z.object({
  id: z.string().cuid({ message: 'Invalid page ID' }),
  title: z.string().min(1).max(255).optional(),
  icon: z.string().optional().nullable(),
  coverImage: z.string().url({ message: 'Invalid cover image URL' }).optional().nullable(),
})

export type UpdatePageInput = z.infer<typeof updatePageSchema>

/**
 * Move Page Input - Reorder or change parent
 */
export const movePageSchema = z.object({
  id: z.string().cuid({ message: 'Invalid page ID' }),
  parentPageId: z.string().cuid({ message: 'Invalid parent page ID' }).nullable(),
  order: z.number().int().min(0),
})

export type MovePageInput = z.infer<typeof movePageSchema>

/**
 * Get Page Tree Input
 */
export const getPageTreeSchema = z.object({
  dealId: z.string().min(1, { message: 'Deal ID is required' }),
})

export type GetPageTreeInput = z.infer<typeof getPageTreeSchema>

/**
 * Get Page Input
 */
export const getPageSchema = z.object({
  id: z.string().cuid({ message: 'Invalid page ID' }),
})

export type GetPageInput = z.infer<typeof getPageSchema>

/**
 * Get Backlinks Input
 */
export const getBacklinksSchema = z.object({
  pageId: z.string().cuid({ message: 'Invalid page ID' }),
})

export type GetBacklinksInput = z.infer<typeof getBacklinksSchema>

/**
 * Get Breadcrumbs Input
 */
export const getBreadcrumbsSchema = z.object({
  pageId: z.string().cuid({ message: 'Invalid page ID' }),
})

export type GetBreadcrumbsInput = z.infer<typeof getBreadcrumbsSchema>

/**
 * Delete Page Input
 */
export const deletePageSchema = z.object({
  id: z.string().cuid({ message: 'Invalid page ID' }),
})

export type DeletePageInput = z.infer<typeof deletePageSchema>

/**
 * PageLink Validators
 */
export const createPageLinkSchema = z.object({
  sourcePageId: z.string().cuid({ message: 'Invalid source page ID' }),
  targetPageId: z.string().cuid({ message: 'Invalid target page ID' }),
  blockId: z.string().cuid({ message: 'Invalid block ID' }),
})

export type CreatePageLinkInput = z.infer<typeof createPageLinkSchema>

/**
 * Sync links for a page - replaces all existing outgoing links
 */
export const syncPageLinksSchema = z.object({
  pageId: z.string().cuid({ message: 'Invalid page ID' }),
  links: z.array(
    z.object({
      targetPageId: z.string().cuid({ message: 'Invalid target page ID' }),
      blockId: z.string().cuid({ message: 'Invalid block ID' }),
    })
  ),
})

export type SyncPageLinksInput = z.infer<typeof syncPageLinksSchema>
