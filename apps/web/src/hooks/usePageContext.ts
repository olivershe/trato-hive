/**
 * usePageContext
 *
 * Hook for detecting the current page context for scoped operations.
 * Part of Phase 11.3 Navigation System (TASK-100).
 *
 * Features:
 * - Detects current deal, company, or document context from URL
 * - Provides context IDs for scoped queries
 * - Returns context type for UI display
 */
'use client'

import { useMemo } from 'react'
import { usePathname, useParams } from 'next/navigation'

/**
 * Types of page contexts
 */
export type PageContextType = 'deal' | 'company' | 'document' | 'global'

/**
 * Page context information
 */
export interface PageContext {
  /** Type of context (deal, company, document, or global) */
  type: PageContextType
  /** ID of the contextual entity (dealId, companyId, documentId) */
  id: string | null
  /** Human-readable label for the context */
  label: string
  /** Whether there is a specific context (not global) */
  hasContext: boolean
}

/**
 * Route patterns for context detection
 */
const ROUTE_PATTERNS = {
  deal: /^\/deals\/([^/]+)/,
  company: /^\/companies\/([^/]+)/,
  document: /^\/documents\/([^/]+)/,
}

/**
 * Hook to detect current page context
 *
 * @example
 * ```tsx
 * const { type, id, label, hasContext } = usePageContext()
 *
 * // On /deals/123/vdr
 * // type: 'deal', id: '123', label: 'Current Deal', hasContext: true
 *
 * // On /pipeline
 * // type: 'global', id: null, label: 'All Data', hasContext: false
 * ```
 */
export function usePageContext(): PageContext {
  const pathname = usePathname()
  const params = useParams()

  return useMemo(() => {
    // Try to match deal routes
    const dealMatch = pathname?.match(ROUTE_PATTERNS.deal)
    if (dealMatch) {
      return {
        type: 'deal' as const,
        id: dealMatch[1] || (params?.id as string) || null,
        label: 'Current Deal',
        hasContext: true,
      }
    }

    // Try to match company routes
    const companyMatch = pathname?.match(ROUTE_PATTERNS.company)
    if (companyMatch) {
      return {
        type: 'company' as const,
        id: companyMatch[1] || (params?.id as string) || null,
        label: 'Current Company',
        hasContext: true,
      }
    }

    // Try to match document routes
    const documentMatch = pathname?.match(ROUTE_PATTERNS.document)
    if (documentMatch) {
      return {
        type: 'document' as const,
        id: documentMatch[1] || (params?.id as string) || null,
        label: 'Current Document',
        hasContext: true,
      }
    }

    // Default to global context
    return {
      type: 'global' as const,
      id: null,
      label: 'All Data',
      hasContext: false,
    }
  }, [pathname, params])
}

export default usePageContext
