# Trato Hive: 7-Layer Architecture UI Implementation Plan

## Document Purpose

This plan provides complete implementation guidance for transforming Trato Hive from a "glorified Notion" into an **AI-native M&A CRM** by making the 7-layer architecture visible through intelligent UI surfaces.

---

## 1. Strategic Context

### 1.1 The Problem

Trato Hive has a well-designed 7-layer architecture:
- **L1 Data Plane** - Document ingestion, OCR, S3 storage
- **L2 Semantic Layer** - Fact extraction, knowledge graph, vector search
- **L3 TIC Core** - LLM orchestration, embeddings, citation extraction
- **L4 Agentic Layer** - DiligenceAgent, SourcerAgent, GeneratorAgent
- **L5 Experience Layer** - Next.js UI, block editor, pages
- **L6 Governance** - Auth, RBAC, audit logging
- **L7 API Layer** - tRPC procedures

**The Gap:** Layers 1-4 are built but invisible. Users see a Notion-like editor (L5) without experiencing the AI intelligence underneath. The product feels like "Notion for M&A" rather than "AI-native M&A reasoning engine."

### 1.2 The Solution

Make the intelligence visible through:
1. **Inline Citations** - Every AI claim has a clickable `[1]` marker
2. **Real-time Fact Streaming** - Watch AI process documents live
3. **Agent Status Cards** - See background AI work happening
4. **Auto-populated Pages** - Facts flow from docs to pages
5. **Industry Templates** - Domain-specific page structures

### 1.3 Competitive Positioning

| Feature | Notion | DealCloud | Trato Hive |
|---------|--------|-----------|------------|
| Block editor | Yes | No | Yes |
| M&A pipeline | No | Yes | Yes |
| Inline citations | No | No | **Yes** |
| VDR integration | No | Limited | **Native** |
| Fact extraction | No | No | **Automatic** |
| Real-time AI status | No | No | **Yes** |

**The USP:** Verifiable AI outputs with audit trails - critical for M&A fiduciary compliance.

---

## 2. User Requirements (From Product Discovery)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary Focus | Diligence Q&A | Highest pain point (40+ analyst hours), showcases citation architecture |
| Citation UX | Inline teal markers `[1]` → sidebar reveal | Non-intrusive, fast access to source |
| AI Visual Cue | Left border accent on AI blocks | Subtle but clear differentiation |
| Q&A Mode | Standalone default + thread mode | Flexibility for simple queries and deep research |
| Knowledge Graph | Hidden infrastructure | Users don't need to see the graph, just its benefits |
| Agent Visibility | Invisible + status cards | Show progress without exposing technical details |
| VDR Processing | Real-time fact streaming | Users see value being created as docs process |
| Data Sync | Explicit field mapping | User controls what syncs to pipeline |
| Page Templates | Industry-specific | SaaS vs Manufacturing have different metrics |
| VDR Location | Separate sidebar | Clear mental model: docs here, pages there |
| Fact Surfacing | Auto-populate pages | Reduce manual entry, increase trust |

---

## 3. Architecture Model

### 3.1 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      PIPELINE VIEW                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Deal A  │  │ Deal B  │  │ Deal C  │  │ Deal D  │            │
│  │ $50M    │  │ $25M    │  │ $100M   │  │ $75M    │            │
│  └────┬────┘  └─────────┘  └─────────┘  └─────────┘            │
│       │                                                          │
│       │ Field Mapping (explicit sync)                           │
│       ▼                                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    DEAL PAGES                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │ Overview    │  │ Diligence   │  │ Team Notes  │        │ │
│  │  │ [Template]  │  │ [Q&A]       │  │ [Freeform]  │        │ │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────┘        │ │
│  │         │                │                                  │ │
│  │         │ Auto-populate  │ Q&A with citations              │ │
│  │         ▼                ▼                                  │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │              SEMANTIC LAYER (Hidden)                 │   │ │
│  │  │  Facts ←→ Knowledge Graph ←→ Vector Embeddings      │   │ │
│  │  └──────────────────────┬──────────────────────────────┘   │ │
│  │                         │                                   │ │
│  └─────────────────────────┼───────────────────────────────────┘ │
│                            │                                      │
│                            │ Fact Extraction                      │
│                            ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    VDR (Separate Section)                   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │  │
│  │  │ SPA.pdf │  │ Fin.xlsx│  │ Org.docx│ ◄── Real-time      │  │
│  │  │ ✓ Done  │  │ ⟳ Proc  │  │ ○ Queue │     streaming       │  │
│  │  └─────────┘  └─────────┘  └─────────┘                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 How Layers Manifest in UI

| Layer | Backend Component | UI Manifestation |
|-------|-------------------|------------------|
| **L1 Data Plane** | Reducto OCR, S3 | Upload progress bar, "Parsing..." status |
| **L2 Semantic Layer** | FactExtractor, Pinecone, Neo4j | Fact stream panel, citation sidebar content |
| **L3 TIC Core** | LLM calls, embeddings | QueryBlock loading state, answer text |
| **L4 Agentic** | DiligenceAgent, DocumentAgent | AgentStatusCard ("Analyzing..."), AISuggestionBlock |
| **L5 Experience** | BlockEditor, PageTree | All visible UI components |
| **L6 Governance** | Auth, audit logs | Activity timeline, user presence |

---

## 4. Implementation Phases

### Phase 1: Citation Core (Critical - Week 1-2)

**Goal:** Make citations the killer feature. Every AI answer has inline `[1]` markers that reveal source documents.

#### Task 1.1: InlineCitationMark Tiptap Extension

**File:** `apps/web/src/components/editor/extensions/InlineCitationMark.tsx`

**Purpose:** A Tiptap **Mark** (not Node) that wraps text with citation metadata. When clicked, opens the CitationSidebar.

**Implementation Details:**

```typescript
import { Mark, mergeAttributes } from '@tiptap/core'

export interface InlineCitationAttrs {
  citationIndex: number      // Display number [1], [2], etc.
  factId: string             // Reference to Fact in semantic layer
  documentId: string         // Source document ID
  chunkId: string            // Specific chunk for highlighting
  sourceText: string         // Excerpt text for quick preview
  pageNumber?: number        // Page in document
  boundingBox?: {            // For PDF highlighting
    x: number
    y: number
    width: number
    height: number
  }
}

export const InlineCitationMark = Mark.create({
  name: 'inlineCitation',

  addAttributes() {
    return {
      citationIndex: { default: 1 },
      factId: { default: null },
      documentId: { default: null },
      chunkId: { default: null },
      sourceText: { default: '' },
      pageNumber: { default: null },
      boundingBox: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'cite[data-citation]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'cite',
      mergeAttributes(HTMLAttributes, {
        'data-citation': true,
        class: 'inline-citation',
      }),
      0, // content hole
    ]
  },

  addCommands() {
    return {
      setCitation: (attrs: InlineCitationAttrs) => ({ commands }) => {
        return commands.setMark(this.name, attrs)
      },
      unsetCitation: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
})
```

**Styling (add to globals.css or Tailwind):**
```css
.inline-citation {
  @apply text-[#2F7E8A] font-semibold text-xs align-super cursor-pointer;
  @apply hover:bg-[#2F7E8A]/10 rounded px-0.5;
  @apply transition-colors duration-150;
}

.inline-citation::before {
  content: '[';
}

.inline-citation::after {
  content: ']';
}
```

**Click Handler (in editor setup):**
```typescript
// In BlockEditor.tsx or extension config
editor.on('click', (event) => {
  const citationMark = editor.isActive('inlineCitation')
  if (citationMark) {
    const attrs = editor.getAttributes('inlineCitation')
    openCitationSidebar(attrs)
  }
})
```

#### Task 1.2: CitationSidebar Component

**Files:**
- `apps/web/src/components/citation/CitationSidebar.tsx`
- `apps/web/src/components/citation/DocumentPreview.tsx`
- `apps/web/src/components/citation/CitationContext.tsx`

**Purpose:** Right-slide panel that shows the source document with the cited excerpt highlighted.

**CitationContext.tsx (state management):**
```typescript
'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { InlineCitationAttrs } from '../editor/extensions/InlineCitationMark'

interface CitationContextType {
  isOpen: boolean
  citation: InlineCitationAttrs | null
  openCitation: (citation: InlineCitationAttrs) => void
  closeCitation: () => void
}

const CitationContext = createContext<CitationContextType | null>(null)

export function CitationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [citation, setCitation] = useState<InlineCitationAttrs | null>(null)

  const openCitation = (attrs: InlineCitationAttrs) => {
    setCitation(attrs)
    setIsOpen(true)
  }

  const closeCitation = () => {
    setIsOpen(false)
    setCitation(null)
  }

  return (
    <CitationContext.Provider value={{ isOpen, citation, openCitation, closeCitation }}>
      {children}
    </CitationContext.Provider>
  )
}

export const useCitation = () => {
  const ctx = useContext(CitationContext)
  if (!ctx) throw new Error('useCitation must be used within CitationProvider')
  return ctx
}
```

**CitationSidebar.tsx:**
```typescript
'use client'
import { X, FileText, ExternalLink, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCitation } from './CitationContext'
import { DocumentPreview } from './DocumentPreview'
import { api } from '@/trpc/react'

export function CitationSidebar() {
  const { isOpen, citation, closeCitation } = useCitation()

  const { data: document } = api.vdr.getDocument.useQuery(
    { documentId: citation?.documentId ?? '' },
    { enabled: !!citation?.documentId }
  )

  return (
    <AnimatePresence>
      {isOpen && citation && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={closeCitation}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[500px] bg-alabaster dark:bg-panel-dark
                       shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-bone dark:border-deep-grey">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2F7E8A]/10 flex items-center justify-center">
                  <span className="text-[#2F7E8A] font-bold text-sm">
                    {citation.citationIndex}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-deep-grey dark:text-white">
                    Source Document
                  </h3>
                  <p className="text-sm text-deep-grey/60 dark:text-white/60">
                    {document?.name ?? 'Loading...'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeCitation}
                className="p-2 hover:bg-bone dark:hover:bg-deep-grey rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Excerpt */}
            <div className="p-4 bg-[#2F7E8A]/5 border-b border-[#2F7E8A]/20">
              <p className="text-sm text-deep-grey/80 dark:text-white/80 mb-2">
                Referenced excerpt:
              </p>
              <blockquote className="text-deep-grey dark:text-white italic border-l-2 border-[#2F7E8A] pl-3">
                "{citation.sourceText}"
              </blockquote>
              {citation.pageNumber && (
                <p className="text-xs text-deep-grey/60 dark:text-white/60 mt-2">
                  Page {citation.pageNumber}
                </p>
              )}
            </div>

            {/* Document Preview */}
            <div className="flex-1 overflow-hidden">
              {document && (
                <DocumentPreview
                  documentUrl={document.url}
                  pageNumber={citation.pageNumber}
                  boundingBox={citation.boundingBox}
                />
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-bone dark:border-deep-grey">
              <button
                className="w-full flex items-center justify-center gap-2 py-2 px-4
                           bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in VDR
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

**DocumentPreview.tsx:**
```typescript
'use client'
import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface DocumentPreviewProps {
  documentUrl: string
  pageNumber?: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export function DocumentPreview({ documentUrl, pageNumber = 1, boundingBox }: DocumentPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0)

  return (
    <div className="relative h-full overflow-auto">
      <Document
        file={documentUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<div className="flex items-center justify-center h-full">Loading...</div>}
      >
        <Page
          pageNumber={pageNumber}
          width={468}
          renderAnnotationLayer={false}
          renderTextLayer={false}
        />

        {/* Highlight overlay */}
        {boundingBox && (
          <div
            className="absolute border-2 border-[#2F7E8A] bg-[#2F7E8A]/20 rounded"
            style={{
              left: `${boundingBox.x}%`,
              top: `${boundingBox.y}%`,
              width: `${boundingBox.width}%`,
              height: `${boundingBox.height}%`,
            }}
          />
        )}
      </Document>
    </div>
  )
}
```

#### Task 1.3: QueryBlock Citation Integration

**File to modify:** `apps/web/src/components/editor/extensions/QueryBlock.tsx`

**Current State:** The QueryBlock shows citations in a separate section below the answer.

**Target State:** Insert inline `[1][2]` markers within the answer text itself.

**Implementation Approach:**

1. Modify the DiligenceAgent response format to include citation positions
2. Parse the response and insert InlineCitationMark nodes
3. Store citation metadata for sidebar access

**Backend Enhancement (apps/api/src/services/diligence.service.ts):**

The LLM response should include citation markers in a parseable format:
```
"The company reported revenue of $50M [[cite:1]] with a growth rate of 25% [[cite:2]]."
```

**Frontend Parsing:**
```typescript
// In QueryBlock.tsx

interface ParsedAnswer {
  text: string
  citations: Array<{
    index: number
    position: number // character position in text
    attrs: InlineCitationAttrs
  }>
}

function parseAnswerWithCitations(
  rawAnswer: string,
  citationSources: Citation[]
): ParsedAnswer {
  const citations: ParsedAnswer['citations'] = []
  let cleanText = rawAnswer

  // Find all [[cite:N]] markers
  const citationRegex = /\[\[cite:(\d+)\]\]/g
  let match
  let offset = 0

  while ((match = citationRegex.exec(rawAnswer)) !== null) {
    const citationIndex = parseInt(match[1])
    const source = citationSources[citationIndex - 1]

    if (source) {
      citations.push({
        index: citationIndex,
        position: match.index - offset,
        attrs: {
          citationIndex,
          factId: source.id,
          documentId: source.documentId,
          chunkId: source.chunkId,
          sourceText: source.content,
          pageNumber: source.pageNumber,
        },
      })
    }

    // Remove the marker from clean text
    cleanText = cleanText.replace(match[0], `[${citationIndex}]`)
    offset += match[0].length - `[${citationIndex}]`.length
  }

  return { text: cleanText, citations }
}

// In the QueryCard component, render with citations:
function renderAnswerWithCitations(parsed: ParsedAnswer) {
  // Use editor.commands to insert text with citation marks
  // Or render as React with citation spans
}
```

---

### Phase 2: Real-Time Fact Streaming (High Priority - Week 3-4)

**Goal:** When users upload VDR documents, they see facts being extracted in real-time.

#### Task 2.1: Server-Sent Events for Document Processing

**File to create:** `apps/api/src/routes/documents/stream.ts`

**Purpose:** SSE endpoint that streams document processing events.

```typescript
import { FastifyInstance } from 'fastify'
import { EventEmitter } from 'events'

// Global event emitter for processing updates
export const processingEvents = new EventEmitter()

export async function documentStreamRoute(fastify: FastifyInstance) {
  fastify.get('/api/documents/:dealId/processing-stream', {
    schema: {
      params: {
        type: 'object',
        properties: {
          dealId: { type: 'string' },
        },
        required: ['dealId'],
      },
    },
  }, async (request, reply) => {
    const { dealId } = request.params as { dealId: string }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const sendEvent = (event: string, data: any) => {
      reply.raw.write(`event: ${event}\n`)
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Send initial connection success
    sendEvent('connected', { dealId })

    // Listen for processing events
    const onProcessingUpdate = (update: ProcessingUpdate) => {
      if (update.dealId === dealId) {
        sendEvent(update.type, update.data)
      }
    }

    processingEvents.on('update', onProcessingUpdate)

    // Cleanup on disconnect
    request.raw.on('close', () => {
      processingEvents.off('update', onProcessingUpdate)
    })
  })
}

// Types for processing updates
interface ProcessingUpdate {
  dealId: string
  type: 'document_status' | 'fact_extracted' | 'processing_complete'
  data: DocumentStatusUpdate | FactExtractedUpdate | ProcessingCompleteUpdate
}

interface DocumentStatusUpdate {
  documentId: string
  documentName: string
  status: 'uploading' | 'parsing' | 'extracting' | 'indexed' | 'error'
  progress?: number
}

interface FactExtractedUpdate {
  documentId: string
  fact: {
    id: string
    type: 'FINANCIAL_METRIC' | 'KEY_PERSON' | 'RISK' | 'OPPORTUNITY' | 'DATE' | 'OTHER'
    subject: string
    predicate: string
    object: string
    confidence: number
    sourceText: string
  }
}

interface ProcessingCompleteUpdate {
  documentId: string
  factsExtracted: number
  processingTime: number
}
```

**Emit events from DocumentAgent (packages/agents/src/document-agent.ts):**
```typescript
import { processingEvents } from '@/api/routes/documents/stream'

// In processDocument method:
async processDocument(document: Document, dealId: string) {
  // Emit status update
  processingEvents.emit('update', {
    dealId,
    type: 'document_status',
    data: {
      documentId: document.id,
      documentName: document.name,
      status: 'parsing',
    },
  })

  // Parse document...
  const parsed = await this.parser.parse(document)

  // Emit extracting status
  processingEvents.emit('update', {
    dealId,
    type: 'document_status',
    data: {
      documentId: document.id,
      documentName: document.name,
      status: 'extracting',
    },
  })

  // Extract facts...
  for await (const fact of this.factExtractor.extractFacts(parsed)) {
    // Save fact to database...
    await this.factStore.save(fact)

    // Emit fact extracted event
    processingEvents.emit('update', {
      dealId,
      type: 'fact_extracted',
      data: {
        documentId: document.id,
        fact: {
          id: fact.id,
          type: fact.type,
          subject: fact.subject,
          predicate: fact.predicate,
          object: fact.object,
          confidence: fact.confidence,
          sourceText: fact.sourceText,
        },
      },
    })
  }

  // Emit complete
  processingEvents.emit('update', {
    dealId,
    type: 'processing_complete',
    data: {
      documentId: document.id,
      factsExtracted: facts.length,
      processingTime: Date.now() - startTime,
    },
  })
}
```

#### Task 2.2: useDocumentProcessingStream Hook

**File:** `apps/web/src/hooks/useDocumentProcessingStream.ts`

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'

interface DocumentStatus {
  documentId: string
  documentName: string
  status: 'uploading' | 'parsing' | 'extracting' | 'indexed' | 'error'
  progress?: number
}

interface ExtractedFact {
  id: string
  documentId: string
  type: string
  subject: string
  predicate: string
  object: string
  confidence: number
  sourceText: string
}

interface UseDocumentProcessingStreamResult {
  isConnected: boolean
  documentStatuses: Map<string, DocumentStatus>
  extractedFacts: ExtractedFact[]
  error: Error | null
}

export function useDocumentProcessingStream(dealId: string | null): UseDocumentProcessingStreamResult {
  const [isConnected, setIsConnected] = useState(false)
  const [documentStatuses, setDocumentStatuses] = useState<Map<string, DocumentStatus>>(new Map())
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFact[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!dealId) return

    const eventSource = new EventSource(`/api/documents/${dealId}/processing-stream`)

    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    eventSource.onerror = (e) => {
      setError(new Error('Connection lost'))
      setIsConnected(false)
    }

    eventSource.addEventListener('document_status', (e) => {
      const data = JSON.parse(e.data) as DocumentStatus
      setDocumentStatuses((prev) => {
        const next = new Map(prev)
        next.set(data.documentId, data)
        return next
      })
    })

    eventSource.addEventListener('fact_extracted', (e) => {
      const data = JSON.parse(e.data) as { documentId: string; fact: Omit<ExtractedFact, 'documentId'> }
      setExtractedFacts((prev) => [
        ...prev,
        { ...data.fact, documentId: data.documentId },
      ])
    })

    return () => {
      eventSource.close()
    }
  }, [dealId])

  return { isConnected, documentStatuses, extractedFacts, error }
}
```

#### Task 2.3: FactStreamPanel Component

**File:** `apps/web/src/components/facts/FactStreamPanel.tsx`

**Purpose:** Live-updating panel showing facts as they're extracted.

```typescript
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  User,
  AlertTriangle,
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react'
import { useDocumentProcessingStream } from '@/hooks/useDocumentProcessingStream'
import { useCitation } from '../citation/CitationContext'

const FACT_TYPE_CONFIG = {
  FINANCIAL_METRIC: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  KEY_PERSON: { icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
  RISK: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  OPPORTUNITY: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  DATE: { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
  OTHER: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
}

interface FactStreamPanelProps {
  dealId: string
}

export function FactStreamPanel({ dealId }: FactStreamPanelProps) {
  const { isConnected, documentStatuses, extractedFacts } = useDocumentProcessingStream(dealId)
  const { openCitation } = useCitation()

  // Group facts by type
  const factsByType = extractedFacts.reduce((acc, fact) => {
    const type = fact.type as keyof typeof FACT_TYPE_CONFIG
    if (!acc[type]) acc[type] = []
    acc[type].push(fact)
    return acc
  }, {} as Record<string, typeof extractedFacts>)

  return (
    <div className="bg-alabaster dark:bg-panel-dark rounded-xl border border-bone dark:border-deep-grey p-4">
      {/* Header with connection status */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-deep-grey dark:text-white">
          Extracted Facts
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          <span className="text-xs text-deep-grey/60 dark:text-white/60">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Processing documents */}
      {documentStatuses.size > 0 && (
        <div className="mb-4 space-y-2">
          {Array.from(documentStatuses.values())
            .filter((d) => d.status !== 'indexed')
            .map((doc) => (
              <div
                key={doc.documentId}
                className="flex items-center gap-2 text-sm text-deep-grey/80 dark:text-white/80"
              >
                <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin" />
                <span>{doc.documentName}</span>
                <span className="text-xs text-deep-grey/40 dark:text-white/40">
                  {doc.status}...
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Facts grouped by type */}
      <div className="space-y-4">
        {Object.entries(factsByType).map(([type, facts]) => {
          const config = FACT_TYPE_CONFIG[type as keyof typeof FACT_TYPE_CONFIG]
          const Icon = config.icon

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1 rounded ${config.bg}`}>
                  <Icon className={`w-3 h-3 ${config.color}`} />
                </div>
                <span className="text-xs font-medium text-deep-grey/60 dark:text-white/60 uppercase">
                  {type.replace('_', ' ')} ({facts.length})
                </span>
              </div>

              <AnimatePresence mode="popLayout">
                {facts.slice(-5).map((fact) => (
                  <motion.div
                    key={fact.id}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => openCitation({
                      citationIndex: 0,
                      factId: fact.id,
                      documentId: fact.documentId,
                      chunkId: '',
                      sourceText: fact.sourceText,
                    })}
                    className="ml-6 mb-2 p-2 bg-white dark:bg-deep-grey rounded-lg
                               border border-bone dark:border-deep-grey/50
                               cursor-pointer hover:border-[#2F7E8A] transition-colors"
                  >
                    <p className="text-sm text-deep-grey dark:text-white">
                      <span className="font-medium">{fact.subject}</span>
                      {' '}{fact.predicate}{' '}
                      <span className="font-medium">{fact.object}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="h-1 w-16 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${fact.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-deep-grey/40 dark:text-white/40">
                        {Math.round(fact.confidence * 100)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {extractedFacts.length === 0 && !isConnected && (
        <p className="text-sm text-deep-grey/40 dark:text-white/40 text-center py-4">
          Upload documents to see facts extracted in real-time
        </p>
      )}
    </div>
  )
}
```

---

### Phase 3: AI Visual Differentiation (High Priority - Week 4-5)

**Goal:** Users instantly recognize AI-generated content vs human content.

#### Task 3.1: AIGeneratedWrapper Component

**File:** `apps/web/src/components/editor/AIGeneratedWrapper.tsx`

```typescript
'use client'
import { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

interface AIGeneratedWrapperProps {
  children: ReactNode
  showBadge?: boolean
}

export function AIGeneratedWrapper({ children, showBadge = false }: AIGeneratedWrapperProps) {
  return (
    <div className="relative pl-3 border-l-2 border-[#2F7E8A]">
      {showBadge && (
        <div className="absolute -left-1 -top-2 flex items-center gap-1
                        bg-[#2F7E8A]/10 text-[#2F7E8A] text-[10px] font-medium
                        px-1.5 py-0.5 rounded-full">
          <Sparkles className="w-2.5 h-2.5" />
          AI
        </div>
      )}
      {children}
    </div>
  )
}
```

#### Task 3.2: AgentStatusCard System

**Files:**
- `apps/web/src/components/agents/AgentStatusProvider.tsx`
- `apps/web/src/components/agents/AgentStatusCard.tsx`

**AgentStatusProvider.tsx:**
```typescript
'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface AgentStatus {
  id: string
  agentType: 'diligence' | 'document' | 'sourcing' | 'generator'
  message: string
  progress?: number
  startedAt: Date
}

interface AgentStatusContextType {
  statuses: AgentStatus[]
  addStatus: (status: Omit<AgentStatus, 'id' | 'startedAt'>) => string
  updateStatus: (id: string, updates: Partial<AgentStatus>) => void
  removeStatus: (id: string) => void
}

const AgentStatusContext = createContext<AgentStatusContextType | null>(null)

export function AgentStatusProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<AgentStatus[]>([])

  const addStatus = useCallback((status: Omit<AgentStatus, 'id' | 'startedAt'>) => {
    const id = crypto.randomUUID()
    setStatuses((prev) => [...prev, { ...status, id, startedAt: new Date() }])
    return id
  }, [])

  const updateStatus = useCallback((id: string, updates: Partial<AgentStatus>) => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }, [])

  const removeStatus = useCallback((id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return (
    <AgentStatusContext.Provider value={{ statuses, addStatus, updateStatus, removeStatus }}>
      {children}
    </AgentStatusContext.Provider>
  )
}

export const useAgentStatus = () => {
  const ctx = useContext(AgentStatusContext)
  if (!ctx) throw new Error('useAgentStatus must be used within AgentStatusProvider')
  return ctx
}
```

**AgentStatusCard.tsx:**
```typescript
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  FileSearch,
  Search,
  FileText,
  X
} from 'lucide-react'
import { useAgentStatus } from './AgentStatusProvider'

const AGENT_CONFIG = {
  diligence: { icon: MessageSquare, label: 'Diligence Agent', color: 'bg-blue-500' },
  document: { icon: FileSearch, label: 'Document Agent', color: 'bg-emerald-500' },
  sourcing: { icon: Search, label: 'Sourcing Agent', color: 'bg-purple-500' },
  generator: { icon: FileText, label: 'Generator Agent', color: 'bg-orange' },
}

export function AgentStatusCards() {
  const { statuses, removeStatus } = useAgentStatus()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {statuses.map((status) => {
          const config = AGENT_CONFIG[status.agentType]
          const Icon = config.icon

          return (
            <motion.div
              key={status.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className="flex items-center gap-3 bg-white dark:bg-panel-dark
                         rounded-xl shadow-lg border border-bone dark:border-deep-grey
                         p-3 min-w-[280px]"
            >
              {/* Agent icon */}
              <div className={`p-2 rounded-lg ${config.color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>

              {/* Status content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-deep-grey/60 dark:text-white/60">
                  {config.label}
                </p>
                <p className="text-sm text-deep-grey dark:text-white truncate">
                  {status.message}
                </p>
                {status.progress !== undefined && (
                  <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${config.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${status.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Spinner or dismiss */}
              {status.progress === undefined ? (
                <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin" />
              ) : status.progress >= 100 ? (
                <button
                  onClick={() => removeStatus(status.id)}
                  className="p-1 hover:bg-bone dark:hover:bg-deep-grey rounded"
                >
                  <X className="w-4 h-4 text-deep-grey/40" />
                </button>
              ) : null}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
```

---

### Phase 4: Auto-Population from Facts (High Priority - Week 5-6)

**Goal:** Facts extracted from documents automatically populate deal pages.

#### Task 4.1: FactSheetBlock Extension

**File:** `apps/web/src/components/editor/extensions/FactSheetBlock.tsx`

```typescript
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { api } from '@/trpc/react'
import { useCitation } from '../../citation/CitationContext'
import {
  DollarSign,
  User,
  AlertTriangle,
  TrendingUp,
  RefreshCw
} from 'lucide-react'

export const FactSheetBlock = Node.create({
  name: 'factSheetBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      dealId: { default: null },
      showTypes: { default: ['FINANCIAL_METRIC', 'KEY_PERSON', 'RISK', 'OPPORTUNITY'] },
    }
  },

  parseHTML() {
    return [{ tag: 'fact-sheet-block' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['fact-sheet-block', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FactSheetCard)
  },

  addCommands() {
    return {
      setFactSheetBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'factSheetBlock',
            attrs,
          })
        },
    }
  },
})

function FactSheetCard({ node }: { node: any }) {
  const { dealId, showTypes } = node.attrs
  const { openCitation } = useCitation()

  const { data: facts, isLoading, refetch } = api.facts.getByDeal.useQuery(
    { dealId, types: showTypes },
    { enabled: !!dealId }
  )

  const FACT_CONFIG = {
    FINANCIAL_METRIC: { icon: DollarSign, label: 'Financial Metrics', color: 'emerald' },
    KEY_PERSON: { icon: User, label: 'Key People', color: 'blue' },
    RISK: { icon: AlertTriangle, label: 'Identified Risks', color: 'red' },
    OPPORTUNITY: { icon: TrendingUp, label: 'Opportunities', color: 'purple' },
  }

  // Group facts by type
  const factsByType = facts?.reduce((acc, fact) => {
    if (!acc[fact.type]) acc[fact.type] = []
    acc[fact.type].push(fact)
    return acc
  }, {} as Record<string, typeof facts>) ?? {}

  return (
    <NodeViewWrapper className="my-6">
      <div className="bg-alabaster dark:bg-panel-dark rounded-xl border border-bone dark:border-deep-grey overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-deep-grey">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-[#2F7E8A] rounded-full" />
            <h3 className="font-semibold text-deep-grey dark:text-white">
              Verified Fact Sheet
            </h3>
            <span className="text-xs bg-[#2F7E8A]/10 text-[#2F7E8A] px-2 py-0.5 rounded-full">
              AI Extracted
            </span>
          </div>
          <button
            onClick={() => refetch()}
            className="p-1.5 hover:bg-bone dark:hover:bg-deep-grey rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-deep-grey/60 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {showTypes.map((type: string) => {
            const config = FACT_CONFIG[type as keyof typeof FACT_CONFIG]
            if (!config) return null
            const typeFacts = factsByType[type] ?? []
            const Icon = config.icon

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${config.color}-600`} />
                  <span className="text-sm font-medium text-deep-grey/60 dark:text-white/60">
                    {config.label}
                  </span>
                </div>

                {typeFacts.length === 0 ? (
                  <p className="text-xs text-deep-grey/40 dark:text-white/40 italic">
                    No facts extracted yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {typeFacts.slice(0, 5).map((fact) => (
                      <div
                        key={fact.id}
                        onClick={() => openCitation({
                          citationIndex: 0,
                          factId: fact.id,
                          documentId: fact.documentId,
                          chunkId: fact.chunkId,
                          sourceText: fact.sourceText,
                        })}
                        className="flex items-start gap-2 p-2 bg-white dark:bg-deep-grey
                                   rounded-lg cursor-pointer hover:ring-1 hover:ring-[#2F7E8A]
                                   transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-deep-grey dark:text-white">
                            <span className="font-medium">{fact.subject}</span>
                            {' '}{fact.predicate}{' '}
                            <span className="font-medium">{fact.object}</span>
                          </p>
                        </div>
                        <span className="text-[#2F7E8A] text-xs font-semibold flex-shrink-0">
                          [cite]
                        </span>
                      </div>
                    ))}
                    {typeFacts.length > 5 && (
                      <p className="text-xs text-deep-grey/40 dark:text-white/40">
                        +{typeFacts.length - 5} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </NodeViewWrapper>
  )
}
```

---

### Phase 5: Pipeline Data Sync (Medium Priority - Week 6-7)

**Goal:** Explicit field mapping from page content to pipeline view.

#### Task 5.1: Field Mapping Types

**File:** `packages/shared/src/types/field-mapping.types.ts`

```typescript
export interface FieldMapping {
  sourceType: 'fact' | 'database_entry' | 'block_content'
  sourceId: string
  targetField: 'value' | 'stage' | 'probability' | 'expectedCloseDate' | 'companyName'
  transform?: 'direct' | 'parse_currency' | 'parse_date' | 'parse_percentage'
  autoSync: boolean
}

export interface DealFieldMappings {
  dealId: string
  mappings: FieldMapping[]
}
```

#### Task 5.2: DealHeaderBlock Enhancement

**Modify:** `apps/web/src/components/editor/extensions/DealHeaderBlock.tsx`

Add visual indicators for AI-suggested fields and sync actions.

```typescript
// Add to existing DealHeaderBlock component:

interface FieldIndicatorProps {
  isAISuggested: boolean
  isSynced: boolean
  onSync: () => void
}

function FieldIndicator({ isAISuggested, isSynced, onSync }: FieldIndicatorProps) {
  if (!isAISuggested) return null

  return (
    <div className="absolute -right-1 -top-1 flex items-center gap-1">
      {isSynced ? (
        <div className="w-2 h-2 bg-emerald-500 rounded-full" title="Synced to pipeline" />
      ) : (
        <button
          onClick={onSync}
          className="w-2 h-2 bg-orange rounded-full animate-pulse"
          title="Click to sync to pipeline"
        />
      )}
    </div>
  )
}
```

---

### Phase 6: Industry Templates (Medium Priority - Week 7-8)

**Goal:** Pre-configured deal page templates for different industries.

#### Task 6.1: Template Definitions

**File:** `packages/shared/src/templates/index.ts`

```typescript
import { JSONContent } from '@tiptap/core'

export interface DealTemplate {
  id: string
  name: string
  description: string
  industry: string
  icon: string
  pages: TemplatePageDefinition[]
}

export interface TemplatePageDefinition {
  title: string
  isDefault: boolean
  content: JSONContent
}

export const TEMPLATES: DealTemplate[] = [
  {
    id: 'saas',
    name: 'SaaS / Technology',
    description: 'Optimized for recurring revenue, retention metrics, and growth KPIs',
    industry: 'Technology',
    icon: '💻',
    pages: [
      {
        title: 'Overview',
        isDefault: true,
        content: {
          type: 'doc',
          content: [
            { type: 'dealHeaderBlock', attrs: {} },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Key Metrics' }] },
            { type: 'factSheetBlock', attrs: { showTypes: ['FINANCIAL_METRIC'] } },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Leadership' }] },
            { type: 'factSheetBlock', attrs: { showTypes: ['KEY_PERSON'] } },
          ],
        },
      },
      {
        title: 'Diligence',
        isDefault: false,
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Diligence Notes' }] },
            { type: 'vdrBlock', attrs: {} },
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Q&A' }] },
            { type: 'queryBlock', attrs: {} },
          ],
        },
      },
      {
        title: 'Risks',
        isDefault: false,
        content: {
          type: 'doc',
          content: [
            { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Risk Analysis' }] },
            { type: 'factSheetBlock', attrs: { showTypes: ['RISK'] } },
          ],
        },
      },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing / Industrial',
    description: 'Focus on EBITDA, CapEx, inventory, and operational metrics',
    industry: 'Manufacturing',
    icon: '🏭',
    pages: [
      // Similar structure with manufacturing-specific focus
    ],
  },
]
```

#### Task 6.2: Template Selector Component

**File:** `apps/web/src/components/deals/TemplateSelector.tsx`

```typescript
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { TEMPLATES, DealTemplate } from '@trato-hive/shared/templates'

interface TemplateSelectorProps {
  onSelect: (template: DealTemplate | null) => void
  onCancel: () => void
}

export function TemplateSelector({ onSelect, onCancel }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-alabaster dark:bg-panel-dark rounded-2xl shadow-2xl
                   w-full max-w-2xl mx-4 overflow-hidden"
      >
        <div className="p-6 border-b border-bone dark:border-deep-grey">
          <h2 className="text-xl font-semibold text-deep-grey dark:text-white">
            Choose a Template
          </h2>
          <p className="text-sm text-deep-grey/60 dark:text-white/60 mt-1">
            Start with a pre-configured structure or begin with a blank canvas
          </p>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
          {/* Blank option */}
          <button
            onClick={() => setSelected('blank')}
            className={`p-4 rounded-xl border-2 text-left transition-all
                       ${selected === 'blank'
                         ? 'border-orange bg-orange/5'
                         : 'border-bone dark:border-deep-grey hover:border-orange/50'}`}
          >
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-medium text-deep-grey dark:text-white">Blank</h3>
            <p className="text-xs text-deep-grey/60 dark:text-white/60 mt-1">
              Start from scratch with an empty page
            </p>
            {selected === 'blank' && (
              <Check className="absolute top-2 right-2 w-5 h-5 text-orange" />
            )}
          </button>

          {/* Template options */}
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelected(template.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all
                         ${selected === template.id
                           ? 'border-orange bg-orange/5'
                           : 'border-bone dark:border-deep-grey hover:border-orange/50'}`}
            >
              <div className="text-2xl mb-2">{template.icon}</div>
              <h3 className="font-medium text-deep-grey dark:text-white">{template.name}</h3>
              <p className="text-xs text-deep-grey/60 dark:text-white/60 mt-1">
                {template.description}
              </p>
              {selected === template.id && (
                <Check className="absolute top-2 right-2 w-5 h-5 text-orange" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-bone dark:border-deep-grey flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-deep-grey/60 hover:text-deep-grey
                       dark:text-white/60 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const template = selected === 'blank'
                ? null
                : TEMPLATES.find((t) => t.id === selected) ?? null
              onSelect(template)
            }}
            disabled={!selected}
            className="px-4 py-2 bg-orange text-white rounded-lg
                       hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            Create Deal
          </button>
        </div>
      </motion.div>
    </div>
  )
}
```

---

### Phase 7: VDR Separation (Medium Priority - Week 8)

**Goal:** Clear separation between documents and pages.

#### Task 7.1: VDRSidebar Component

**File:** `apps/web/src/components/vdr/VDRSidebar.tsx`

```typescript
'use client'
import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Upload,
  MoreHorizontal,
  Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/trpc/react'
import { useDocumentProcessingStream } from '@/hooks/useDocumentProcessingStream'

interface VDRSidebarProps {
  dealId: string
  isOpen: boolean
  onToggle: () => void
}

export function VDRSidebar({ dealId, isOpen, onToggle }: VDRSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const { data: documents } = api.vdr.listDocuments.useQuery({ dealId })
  const { documentStatuses } = useDocumentProcessingStream(dealId)

  const uploadMutation = api.vdr.uploadDocument.useMutation()

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await uploadMutation.mutateAsync({ dealId, file })
    }
  }

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="h-full bg-alabaster dark:bg-panel-dark border-r border-bone
                     dark:border-deep-grey flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-bone dark:border-deep-grey">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-deep-grey dark:text-white">Data Room</h3>
              <button className="p-1 hover:bg-bone dark:hover:bg-deep-grey rounded">
                <Upload className="w-4 h-4 text-deep-grey/60" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-grey/40" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-deep-grey
                           border border-bone dark:border-deep-grey rounded-lg
                           focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex-1 overflow-y-auto p-2"
          >
            {documents?.map((doc) => {
              const status = documentStatuses.get(doc.id)
              const isProcessing = status && status.status !== 'indexed'

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                             hover:bg-bone dark:hover:bg-deep-grey cursor-pointer group"
                >
                  <File className="w-4 h-4 text-deep-grey/60 flex-shrink-0" />
                  <span className="flex-1 text-sm text-deep-grey dark:text-white truncate">
                    {doc.name}
                  </span>
                  {isProcessing && (
                    <div className="w-3 h-3 border-2 border-orange border-t-transparent
                                    rounded-full animate-spin" />
                  )}
                  {doc.factCount > 0 && !isProcessing && (
                    <span className="text-xs text-[#2F7E8A] bg-[#2F7E8A]/10 px-1.5 py-0.5 rounded">
                      {doc.factCount}
                    </span>
                  )}
                </div>
              )
            })}

            {(!documents || documents.length === 0) && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Upload className="w-8 h-8 text-deep-grey/20 mb-2" />
                <p className="text-sm text-deep-grey/40 dark:text-white/40">
                  Drag files here or click upload
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## 5. Key Files Summary

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/components/editor/extensions/InlineCitationMark.tsx` | Tiptap mark for `[1]` citations |
| `apps/web/src/components/citation/CitationSidebar.tsx` | Source document reveal panel |
| `apps/web/src/components/citation/CitationContext.tsx` | Citation state management |
| `apps/web/src/components/citation/DocumentPreview.tsx` | PDF viewer with highlighting |
| `apps/web/src/components/facts/FactStreamPanel.tsx` | Real-time fact extraction display |
| `apps/web/src/hooks/useDocumentProcessingStream.ts` | SSE hook for processing events |
| `apps/web/src/components/agents/AgentStatusProvider.tsx` | Agent status state |
| `apps/web/src/components/agents/AgentStatusCard.tsx` | Background processing indicators |
| `apps/web/src/components/editor/extensions/FactSheetBlock.tsx` | Auto-populated verified facts |
| `apps/web/src/components/editor/AIGeneratedWrapper.tsx` | Visual cue for AI content |
| `apps/web/src/components/vdr/VDRSidebar.tsx` | Separate document tree |
| `apps/web/src/components/deals/TemplateSelector.tsx` | Industry template picker |
| `packages/shared/src/templates/index.ts` | Template definitions |
| `apps/api/src/routes/documents/stream.ts` | SSE endpoint |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/components/editor/extensions/QueryBlock.tsx` | Add inline citation insertion |
| `apps/web/src/components/editor/extensions/VDRBlock.tsx` | Add processing indicators |
| `apps/web/src/components/editor/extensions/DealHeaderBlock.tsx` | Add sync indicators |
| `apps/web/src/components/editor/extensions.ts` | Register new extensions |
| `packages/agents/src/document-agent.ts` | Emit processing events |

---

## 6. Verification Plan

### Test 1: Citation Flow
1. Upload a PDF to VDR
2. Wait for processing to complete
3. Type `/ask` and ask "What is the company's revenue?"
4. Verify answer contains inline `[1]` citation
5. Click citation → verify sidebar opens with correct document and excerpt

### Test 2: Fact Streaming
1. Create new deal
2. Upload 3 PDF documents
3. Verify FactStreamPanel shows real-time fact extraction
4. Verify documents show processing spinners
5. Verify facts appear with animation as extracted

### Test 3: Auto-Population
1. Upload financial document
2. Wait for fact extraction
3. Add FactSheetBlock to page (`/factsheet`)
4. Verify financial metrics populate automatically
5. Click any fact → verify citation sidebar works

### Test 4: Pipeline Sync
1. Accept AI-suggested deal value
2. Navigate to pipeline view
3. Verify deal card shows updated value

### Test 5: Templates
1. Click "New Deal"
2. Select "SaaS / Technology" template
3. Verify Overview page has DealHeaderBlock and FactSheetBlock
4. Verify Diligence page has VDRBlock and QueryBlock

---

## 7. Dependencies

### NPM Packages to Add

```bash
pnpm add react-pdf @react-pdf/renderer  # PDF viewing
pnpm add framer-motion                   # Animations (likely already installed)
```

### Environment Variables

None additional required - uses existing Supabase, Pinecone, Neo4j configuration.

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Citation click → sidebar reveal | < 200ms |
| Document upload → first fact visible | < 5 seconds |
| Q&A response with citations | < 3 seconds |
| FactSheet population after upload | Automatic, no user action |
| Template selection → deal created | < 1 second |

---

## 9. Backend Integration Requirements

### 9.1 DiligenceAgent Citation Format (Required for Phase 1)

The frontend inline citation system expects the DiligenceAgent to return answers with embedded citation markers in the format `[[cite:N]]`.

**Current State:** The UI components are complete and ready to parse/render citations.

**Required Backend Change:** Modify `apps/api/src/services/diligence.service.ts` (or the DiligenceAgent) to:

1. Include citation markers inline within the answer text
2. Use 1-indexed markers that correspond to the citations array

**Example Response Format:**
```typescript
{
  answer: "The company reported revenue of $50M [[cite:1]] with a growth rate of 25% [[cite:2]]. The CEO mentioned expansion plans [[cite:1]].",
  citations: [
    {
      id: "fact-123",
      documentId: "doc-456",
      documentName: "Q3 Financial Report.pdf",
      chunkId: "chunk-789",
      content: "Total revenue for Q3 was $50 million, representing...",
      pageNumber: 12,
      relevanceScore: 0.95
    },
    {
      id: "fact-124",
      documentId: "doc-457",
      documentName: "Growth Analysis.pdf",
      chunkId: "chunk-790",
      content: "Year-over-year growth reached 25% in the fiscal...",
      pageNumber: 5,
      relevanceScore: 0.89
    }
  ]
}
```

**LLM Prompt Enhancement:** Add instructions to the DiligenceAgent's system prompt:
```
When citing sources in your answer, use the format [[cite:N]] where N is the 1-indexed
position in the citations array. Place citations immediately after the claim they support.
Example: "Revenue was $50M [[cite:1]] with 25% growth [[cite:2]]."
```

**Files to Modify:**
- `apps/api/src/services/diligence.service.ts` - Add citation markers to LLM response
- `packages/agents/src/diligence-agent.ts` - Update system prompt if using agent pattern

---

*This plan transforms Trato Hive from "Notion for M&A" to "AI-native M&A reasoning engine" by making the 7-layer architecture visible through intelligent, citation-first UI surfaces.*
