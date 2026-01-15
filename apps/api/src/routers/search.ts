/**
 * Search Router
 *
 * tRPC router for unified search across entities (Deals, Companies, Documents).
 * Part of Phase 11.3 Navigation System (TASK-096).
 *
 * Features:
 * - Search across Deals by name
 * - Search across Companies by name, industry, sector, location
 * - Search across Documents by name, folderPath
 * - Grouped results by entity type
 */
import { z } from 'zod'
import { router, organizationProtectedProcedure } from '../trpc/init'

/**
 * Input schema for global search
 */
const globalSearchInputSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(20).default(5),
  includeDeals: z.boolean().default(true),
  includeCompanies: z.boolean().default(true),
  includeDocuments: z.boolean().default(true),
})

/**
 * Result types for search
 */
export type SearchResultType = 'deal' | 'company' | 'document'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  href: string
  metadata?: Record<string, unknown>
}

export interface SearchResponse {
  deals: SearchResult[]
  companies: SearchResult[]
  documents: SearchResult[]
  total: number
}

export const searchRouter = router({
  /**
   * search.global - Unified search across all entity types
   * Auth: organizationProtectedProcedure
   * Returns grouped results: deals, companies, documents
   */
  global: organizationProtectedProcedure
    .input(globalSearchInputSchema)
    .query(async ({ ctx, input }): Promise<SearchResponse> => {
      const { query, limit, includeDeals, includeCompanies, includeDocuments } =
        input
      const normalizedQuery = query.toLowerCase().trim()

      const results: SearchResponse = {
        deals: [],
        companies: [],
        documents: [],
        total: 0,
      }

      // Search deals (name only - stage and type are enums)
      if (includeDeals) {
        const deals = await ctx.db.deal.findMany({
          where: {
            organizationId: ctx.organizationId,
            name: { contains: normalizedQuery, mode: 'insensitive' },
          },
          select: {
            id: true,
            name: true,
            stage: true,
            type: true,
            value: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        results.deals = deals.map((deal) => ({
          id: deal.id,
          type: 'deal' as const,
          title: deal.name,
          subtitle: `${deal.stage}${deal.value ? ` · $${formatValue(deal.value)}` : ''}`,
          href: `/deals/${deal.id}`,
          metadata: {
            stage: deal.stage,
            type: deal.type,
            value: deal.value ? Number(deal.value) : null,
          },
        }))
      }

      // Search companies
      if (includeCompanies) {
        const companies = await ctx.db.company.findMany({
          where: {
            organizationId: ctx.organizationId,
            OR: [
              { name: { contains: normalizedQuery, mode: 'insensitive' } },
              { industry: { contains: normalizedQuery, mode: 'insensitive' } },
              { sector: { contains: normalizedQuery, mode: 'insensitive' } },
              { location: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            industry: true,
            location: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        results.companies = companies.map((company) => ({
          id: company.id,
          type: 'company' as const,
          title: company.name,
          subtitle: [company.industry, company.location]
            .filter(Boolean)
            .join(' · '),
          href: `/companies/${company.id}`,
          metadata: {
            industry: company.industry,
            location: company.location,
          },
        }))
      }

      // Search documents (using correct schema fields: name, folderPath)
      if (includeDocuments) {
        const documents = await ctx.db.document.findMany({
          where: {
            organizationId: ctx.organizationId,
            OR: [
              { name: { contains: normalizedQuery, mode: 'insensitive' } },
              { folderPath: { contains: normalizedQuery, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            folderPath: true,
            dealId: true,
          },
          take: limit,
          orderBy: { updatedAt: 'desc' },
        })

        results.documents = documents.map((doc) => ({
          id: doc.id,
          type: 'document' as const,
          title: doc.name,
          subtitle: doc.folderPath || undefined,
          href: doc.dealId
            ? `/deals/${doc.dealId}/vdr?doc=${doc.id}`
            : `/documents/${doc.id}`,
          metadata: {
            folderPath: doc.folderPath,
            dealId: doc.dealId,
          },
        }))
      }

      results.total =
        results.deals.length +
        results.companies.length +
        results.documents.length

      return results
    }),
})

/**
 * Format large numbers with K/M suffix
 * @param value - Prisma Decimal or null
 */
function formatValue(value: unknown): string {
  if (!value) return '0'
  const num = Number(value)
  if (Number.isNaN(num)) return '0'
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`
  }
  return num.toString()
}
