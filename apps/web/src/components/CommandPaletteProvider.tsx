/**
 * CommandPaletteProvider
 *
 * Global provider that integrates the CommandPalette with search, AI, and quick actions.
 * Part of Phase 11.3 Navigation System (TASK-095, TASK-096, TASK-097, TASK-098, TASK-100).
 *
 * Features:
 * - Global ⌘K keyboard shortcut
 * - Entity search across deals, companies, documents
 * - AI Query Mode: natural language questions routed to DiligenceAgent
 * - Slash commands: /new-deal, /new-company, /upload, /generate
 * - Keyboard shortcuts for quick actions
 * - Debounced search with 300ms delay
 * - Context-aware scoping (TASK-100)
 */
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import {
  Briefcase,
  Building2,
  FileText,
  Plus,
  Upload,
  Settings,
  Sparkles,
  FileOutput,
  Search,
  HelpCircle,
} from 'lucide-react'
import { api } from '@/trpc/react'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import { usePageContext } from '@/hooks/usePageContext'
import { useCommandPaletteStore } from '@/stores/commandPalette'
import {
  CommandPalette,
  type CommandGroup,
  type CommandResult,
} from './CommandPalette'
import { CommandPaletteAIAnswer } from './CommandPaletteAIAnswer'

interface CommandPaletteProviderProps {
  children: React.ReactNode
}

/**
 * Question words that indicate natural language queries
 */
const QUESTION_STARTERS = [
  'what',
  'how',
  'why',
  'when',
  'where',
  'who',
  'which',
  'can',
  'could',
  'would',
  'should',
  'is',
  'are',
  'do',
  'does',
  'did',
  'will',
  'has',
  'have',
  'tell me',
  'explain',
  'describe',
  'show me',
  'find',
  'summarize',
  'compare',
]

/**
 * Detect if a query is a natural language question
 */
function isNaturalLanguageQuestion(query: string): boolean {
  const normalized = query.toLowerCase().trim()

  // Must be at least 10 characters to be a meaningful question
  if (normalized.length < 10) return false

  // Check if it starts with a question word
  return QUESTION_STARTERS.some(
    (starter) =>
      normalized.startsWith(starter + ' ') || normalized.startsWith(starter + '?')
  )
}

/**
 * Detect if a query is a slash command
 */
function isSlashCommand(query: string): boolean {
  return query.trim().startsWith('/')
}

/**
 * All available slash commands with metadata
 */
interface SlashCommand {
  id: string
  command: string
  title: string
  subtitle: string
  icon: React.ReactNode
  href?: string
  shortcut?: string
  keywords: string[]
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'cmd-new-deal',
    command: '/new-deal',
    title: 'New Deal',
    subtitle: 'Create a new deal workspace',
    icon: <Plus className="w-4 h-4" />,
    href: '/deals/new',
    shortcut: '⌘⇧D',
    keywords: ['create', 'deal', 'new', 'workspace'],
  },
  {
    id: 'cmd-new-company',
    command: '/new-company',
    title: 'New Company',
    subtitle: 'Add a company to track',
    icon: <Building2 className="w-4 h-4" />,
    href: '/companies/new',
    shortcut: '⌘⇧C',
    keywords: ['create', 'company', 'new', 'track'],
  },
  {
    id: 'cmd-upload',
    command: '/upload',
    title: 'Upload Document',
    subtitle: 'Upload files for AI processing',
    icon: <Upload className="w-4 h-4" />,
    shortcut: '⌘U',
    keywords: ['upload', 'file', 'document', 'import'],
  },
  {
    id: 'cmd-generate',
    command: '/generate',
    title: 'Generate Export',
    subtitle: 'Export to PPTX or DOCX',
    icon: <FileOutput className="w-4 h-4" />,
    shortcut: '⌘⇧E',
    keywords: ['generate', 'export', 'pptx', 'docx', 'powerpoint', 'word'],
  },
  {
    id: 'cmd-search',
    command: '/search',
    title: 'Search Everything',
    subtitle: 'Find deals, companies, documents',
    icon: <Search className="w-4 h-4" />,
    shortcut: '⌘K',
    keywords: ['search', 'find', 'lookup'],
  },
  {
    id: 'cmd-ask',
    command: '/ask',
    title: 'Ask AI',
    subtitle: 'Ask a question about your data',
    icon: <Sparkles className="w-4 h-4" />,
    keywords: ['ask', 'ai', 'question', 'diligence'],
  },
  {
    id: 'cmd-settings',
    command: '/settings',
    title: 'Settings',
    subtitle: 'Open application settings',
    icon: <Settings className="w-4 h-4" />,
    href: '/settings',
    shortcut: '⌘,',
    keywords: ['settings', 'preferences', 'config'],
  },
  {
    id: 'cmd-help',
    command: '/help',
    title: 'Help',
    subtitle: 'View keyboard shortcuts and help',
    icon: <HelpCircle className="w-4 h-4" />,
    shortcut: '⌘/',
    keywords: ['help', 'shortcuts', 'keyboard'],
  },
]

/**
 * Default quick actions (shown when no query)
 */
const QUICK_ACTIONS: CommandResult[] = SLASH_COMMANDS.slice(0, 4).map((cmd) => ({
  id: cmd.id,
  type: 'action' as const,
  title: cmd.title,
  subtitle: cmd.subtitle,
  icon: cmd.icon,
  href: cmd.href,
  shortcut: cmd.shortcut,
  keywords: [...cmd.keywords, cmd.command],
}))

export function CommandPaletteProvider({
  children,
}: CommandPaletteProviderProps) {
  const router = useRouter()
  const { isOpen, close } = useCommandPalette()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Context-aware scoping (TASK-100)
  const pageContext = usePageContext()
  const { scopeMode, toggleScope } = useCommandPaletteStore()

  // Determine effective scope based on mode and context
  const effectiveScope = useMemo(() => {
    if (scopeMode === 'global' || !pageContext.hasContext) {
      return { type: 'global' as const, dealId: undefined, companyId: undefined }
    }
    return {
      type: pageContext.type,
      dealId: pageContext.type === 'deal' ? pageContext.id : undefined,
      companyId: pageContext.type === 'company' ? pageContext.id : undefined,
    }
  }, [scopeMode, pageContext])

  // Track if we should ask the AI
  const [aiQuery, setAiQuery] = useState<string | null>(null)

  // Debounce search query (300ms as per spec)
  const handleQueryChange = useDebouncedCallback((value: string) => {
    setDebouncedQuery(value)

    // Detect if this is a natural language question (not a slash command)
    if (isNaturalLanguageQuestion(value) && !isSlashCommand(value)) {
      setAiQuery(value)
    } else {
      setAiQuery(null)
    }
  }, 300)

  // Handle immediate query state
  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value)
      handleQueryChange(value)
    },
    [handleQueryChange]
  )

  // Reset state when palette closes
  const handleClose = useCallback(() => {
    close()
    // Reset query state after animation
    setTimeout(() => {
      setQuery('')
      setDebouncedQuery('')
      setAiQuery(null)
    }, 200)
  }, [close])

  // Search API call - only when query is non-empty and not a special mode
  const isQuestion = isNaturalLanguageQuestion(debouncedQuery) && !isSlashCommand(debouncedQuery)
  const isCommand = isSlashCommand(debouncedQuery)

  const { data: searchResults, isLoading: isSearchLoading } =
    api.search.global.useQuery(
      { query: debouncedQuery, limit: 5 },
      {
        enabled: debouncedQuery.length >= 2 && !isQuestion && !isCommand,
        staleTime: 30_000, // Cache for 30s
      }
    )

  // AI Query - only when it's detected as a question
  const askQuestionMutation = api.diligence.askQuestion.useMutation()

  // Trigger AI query when detected (with context-aware scoping)
  const handleAskQuestion = useCallback(() => {
    if (aiQuery && !askQuestionMutation.isPending) {
      askQuestionMutation.mutate({
        question: aiQuery,
        dealId: effectiveScope.dealId ?? undefined,
        companyId: effectiveScope.companyId ?? undefined,
      })
    }
  }, [aiQuery, askQuestionMutation, effectiveScope])

  // Auto-trigger AI when question is detected
  useEffect(() => {
    if (aiQuery && !askQuestionMutation.isPending && !askQuestionMutation.data) {
      handleAskQuestion()
    }
  }, [aiQuery, askQuestionMutation.isPending, askQuestionMutation.data, handleAskQuestion])

  // Define search result item type
  interface SearchResultItem {
    id: string
    title: string
    subtitle?: string
    href: string
  }

  // Filter slash commands based on query
  const filteredCommands = useMemo(() => {
    if (!isCommand) return []

    const commandQuery = debouncedQuery.toLowerCase().trim()

    return SLASH_COMMANDS.filter((cmd) => {
      // Match by command prefix
      if (cmd.command.startsWith(commandQuery)) return true
      // Match by title
      if (cmd.title.toLowerCase().includes(commandQuery.slice(1))) return true
      // Match by keywords
      return cmd.keywords.some((k) => k.includes(commandQuery.slice(1)))
    })
  }, [isCommand, debouncedQuery])

  // Build result groups
  const groups = useMemo((): CommandGroup[] => {
    const result: CommandGroup[] = []

    // Slash command mode
    if (isCommand && filteredCommands.length > 0) {
      result.push({
        id: 'commands',
        title: 'Commands',
        type: 'action',
        results: filteredCommands.map((cmd) => ({
          id: cmd.id,
          type: 'action' as const,
          title: cmd.title,
          subtitle: `${cmd.command} — ${cmd.subtitle}`,
          icon: cmd.icon,
          href: cmd.href,
          shortcut: cmd.shortcut,
          keywords: cmd.keywords,
        })),
      })
      return result
    }

    // If it's a question, show AI prompt option
    if (isQuestion) {
      result.push({
        id: 'ai',
        title: 'AI',
        type: 'ai',
        results: [
          {
            id: 'ai-answer',
            type: 'ai',
            title: 'Ask AI',
            subtitle: debouncedQuery,
            icon: <Sparkles className="w-4 h-4" />,
            action: handleAskQuestion,
          },
        ],
      })
    }

    // If searching (not a question or command), show search results
    if (debouncedQuery.length >= 2 && !isQuestion && !isCommand && searchResults) {
      // Deals
      if (searchResults.deals.length > 0) {
        result.push({
          id: 'deals',
          title: 'Deals',
          type: 'page',
          results: searchResults.deals.map((deal: SearchResultItem) => ({
            id: deal.id,
            type: 'page' as const,
            title: deal.title,
            subtitle: deal.subtitle,
            icon: <Briefcase className="w-4 h-4" />,
            href: deal.href,
          })),
        })
      }

      // Companies
      if (searchResults.companies.length > 0) {
        result.push({
          id: 'companies',
          title: 'Companies',
          type: 'page',
          results: searchResults.companies.map((company: SearchResultItem) => ({
            id: company.id,
            type: 'page' as const,
            title: company.title,
            subtitle: company.subtitle,
            icon: <Building2 className="w-4 h-4" />,
            href: company.href,
          })),
        })
      }

      // Documents
      if (searchResults.documents.length > 0) {
        result.push({
          id: 'documents',
          title: 'Documents',
          type: 'page',
          results: searchResults.documents.map((doc: SearchResultItem) => ({
            id: doc.id,
            type: 'page' as const,
            title: doc.title,
            subtitle: doc.subtitle,
            icon: <FileText className="w-4 h-4" />,
            href: doc.href,
          })),
        })
      }
    }

    // Show quick actions when:
    // - No query entered, OR
    // - Query matches action (filtered)
    if (!isQuestion && !isCommand) {
      const filteredActions = query
        ? QUICK_ACTIONS.filter(
            (action) =>
              action.title.toLowerCase().includes(query.toLowerCase()) ||
              action.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
              action.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase()))
          )
        : QUICK_ACTIONS

      if (filteredActions.length > 0) {
        result.push({
          id: 'actions',
          title: 'Quick Actions',
          type: 'action',
          results: filteredActions,
        })
      }
    }

    return result
  }, [debouncedQuery, searchResults, query, isQuestion, isCommand, filteredCommands, handleAskQuestion])

  // Handle result selection
  const handleSelect = useCallback(
    (result: CommandResult) => {
      if (result.action) {
        result.action()
        return // Don't close for AI action, user wants to see the answer
      }
      if (result.href) {
        router.push(result.href)
      }
      handleClose()
    },
    [router, handleClose]
  )

  // Handle block insertion from AI answer
  const handleInsertBlock = useCallback(() => {
    // Close the palette after inserting
    handleClose()
  }, [handleClose])

  // Build AI answer content
  const aiAnswerContent = useMemo(() => {
    if (!isQuestion) return null

    // Map citations from API response (handle undefined gracefully)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawCitations = (askQuestionMutation.data as any)?.citations
    const citations = Array.isArray(rawCitations)
      ? rawCitations.map((c) => ({
          id: c.id || '',
          documentId: c.documentId || '',
          documentTitle: c.documentTitle || 'Unknown',
          text: c.text || '',
          pageNumber: c.pageNumber,
        }))
      : undefined

    return (
      <CommandPaletteAIAnswer
        question={debouncedQuery}
        answer={(askQuestionMutation.data as { answer?: string })?.answer}
        citations={citations}
        isLoading={askQuestionMutation.isPending}
        error={askQuestionMutation.error?.message}
        onInsertBlock={handleInsertBlock}
      />
    )
  }, [isQuestion, debouncedQuery, askQuestionMutation.data, askQuestionMutation.isPending, askQuestionMutation.error, handleInsertBlock])

  // Determine placeholder based on context
  const placeholder = useMemo(() => {
    if (isCommand) return 'Type a command...'
    return 'Search, ask a question, or type / for commands...'
  }, [isCommand])

  // Build scope info for the command palette (TASK-100)
  const scopeInfo = useMemo(() => ({
    label: pageContext.label,
    hasContext: pageContext.hasContext,
    mode: scopeMode,
  }), [pageContext.label, pageContext.hasContext, scopeMode])

  return (
    <>
      {children}
      <CommandPalette
        isOpen={isOpen}
        onClose={handleClose}
        groups={groups}
        onSelect={handleSelect}
        onQueryChange={onQueryChange}
        isLoading={isSearchLoading && debouncedQuery.length >= 2 && !isQuestion && !isCommand}
        placeholder={placeholder}
        afterResults={aiAnswerContent}
        scope={scopeInfo}
        onToggleScope={toggleScope}
      />
    </>
  )
}

export default CommandPaletteProvider
