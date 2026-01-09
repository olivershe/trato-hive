# Phase 10.4: Generator Service (TASK-066)

## Summary

Export existing Page/Block content to downloadable PPTX and DOCX documents with citation preservation as footnotes.

**Scope:** Page content export (not AI-generated decks)
**Formats:** Both PPTX (pptxgenjs) + DOCX (docx library)
**Citations:** Preserve as footnotes with source references

---

## Block-to-Document Mapping

| Block Type | PPTX | DOCX |
|------------|------|------|
| `heading` (level 1) | New slide with title | H1 |
| `heading` (level 2-3) | Slide subtitle | H2/H3 |
| `paragraph` | Text content | Paragraph |
| `bulletList` | Bulleted list | Bulleted list |
| `orderedList` | Numbered list | Numbered list |
| `blockquote` | Italic + indent | Styled quote |
| `codeBlock` | Monospace text | Monospace paragraph |
| `dealHeaderBlock` | Deal summary table | Deal summary table |
| `citationBlock` | Superscript [N] + Sources slide | Footnote reference |
| `databaseViewBlock` | Table | Table |

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd apps/api && pnpm add pptxgenjs docx
```

### Step 2: Create Validators (`packages/shared/src/validators/generator.ts`)

```typescript
import { z } from 'zod'

export const exportPageInputSchema = z.object({
  pageId: z.string().cuid('Invalid page ID'),
  format: z.enum(['pptx', 'docx']),
  options: z.object({
    includeTitle: z.boolean().default(true),
    includeCitations: z.boolean().default(true),
    slideBreakOnH1: z.boolean().default(true),        // PPTX only
    citationStyle: z.enum(['footnote', 'endnote']).default('footnote'), // DOCX only
  }).optional(),
})

export type ExportPageInput = z.infer<typeof exportPageInputSchema>
```

### Step 3: Create Types (`packages/shared/src/types/generator.ts`)

```typescript
export interface ExportResult {
  buffer: Buffer
  filename: string
  mimeType: string
  pageTitle: string
  blockCount: number
  citationCount: number
}

export interface CitationReference {
  index: number           // [1], [2], etc.
  factId: string
  subject: string
  predicate: string
  object: string
  sourceText: string
  documentName: string
  confidence: number
}

export interface ExportOptions {
  includeTitle?: boolean
  includeCitations?: boolean
  slideBreakOnH1?: boolean
  citationStyle?: 'footnote' | 'endnote'
}
```

### Step 4: Export from Shared Package

**File:** `packages/shared/src/validators/index.ts`
```typescript
export * from './generator'
```

**File:** `packages/shared/src/types/index.ts`
```typescript
export * from './generator'
```

### Step 5: Create GeneratorService (`apps/api/src/services/generator.service.ts`)

```typescript
import PptxGenJS from 'pptxgenjs'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, FootnoteReferenceRun, Table, TableRow, TableCell } from 'docx'
import { PrismaClient } from '@trato-hive/db'
import { getRecursivePageBlocks, BlockWithChildren } from '@trato-hive/db/queries'
import { ExportResult, CitationReference, ExportOptions } from '@trato-hive/shared'

export class GeneratorService {
  constructor(private db: PrismaClient) {}

  async exportPage(
    pageId: string,
    format: 'pptx' | 'docx',
    organizationId: string,
    options?: ExportOptions
  ): Promise<ExportResult> {
    // 1. Fetch page and verify organization access
    const page = await this.getPageWithBlocks(pageId, organizationId)

    // 2. Collect citations
    const citations = this.collectCitations(page.blocks)

    // 3. Convert to requested format
    const buffer = format === 'pptx'
      ? await this.convertToPptx(page, citations, options)
      : await this.convertToDocx(page, citations, options)

    // 4. Return result
    const filename = `${page.title || 'export'}.${format}`
    return {
      buffer,
      filename,
      mimeType: format === 'pptx'
        ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pageTitle: page.title || 'Untitled',
      blockCount: this.countBlocks(page.blocks),
      citationCount: citations.length,
    }
  }

  // Multi-tenancy check
  private async getPageWithBlocks(pageId: string, organizationId: string) {
    const page = await this.db.page.findUnique({
      where: { id: pageId },
      include: {
        deal: { select: { organizationId: true } },
        company: { select: { organizationId: true } },
      },
    })

    if (!page) throw new TRPCError({ code: 'NOT_FOUND', message: 'Page not found' })

    const pageOrgId = page.deal?.organizationId || page.company?.organizationId
    if (pageOrgId !== organizationId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' })
    }

    const blocks = await getRecursivePageBlocks(pageId)
    return { ...page, blocks }
  }

  private collectCitations(blocks: BlockWithChildren[]): CitationReference[] {
    const citations: CitationReference[] = []

    const traverse = (blocks: BlockWithChildren[]) => {
      for (const block of blocks) {
        if (block.type === 'citationBlock') {
          const props = block.properties as any
          citations.push({
            index: citations.length + 1,
            factId: props.factId,
            subject: props.subject,
            predicate: props.predicate,
            object: props.object,
            sourceText: props.sourceText,
            documentName: props.documentName,
            confidence: props.confidence,
          })
        }
        if (block.children?.length) traverse(block.children)
      }
    }

    traverse(blocks)
    return citations
  }

  private async convertToPptx(...): Promise<Buffer> { /* see full implementation */ }
  private async convertToDocx(...): Promise<Buffer> { /* see full implementation */ }
}
```

### Step 6: Create Router (`apps/api/src/routers/generator.ts`)

```typescript
import { router, organizationProtectedProcedure } from '../trpc/init'
import { exportPageInputSchema } from '@trato-hive/shared/validators'
import { GeneratorService } from '../services/generator.service'

export const generatorRouter = router({
  exportPage: organizationProtectedProcedure
    .input(exportPageInputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new GeneratorService(ctx.db)
      const result = await service.exportPage(
        input.pageId,
        input.format,
        ctx.organizationId,
        input.options
      )

      // Return base64 for direct download
      return {
        data: result.buffer.toString('base64'),
        filename: result.filename,
        mimeType: result.mimeType,
        pageTitle: result.pageTitle,
        blockCount: result.blockCount,
        citationCount: result.citationCount,
      }
    }),
})
```

### Step 7: Register Router

**File:** `apps/api/src/trpc/router.ts`
```typescript
import { generatorRouter } from '../routers/generator'

export const appRouter = router({
  // ... existing routers
  generator: generatorRouter,
})
```

---

## PPTX Conversion Logic (Key Points)

```typescript
private async convertToPptx(page, citations, options): Promise<Buffer> {
  const pptx = new PptxGenJS()
  pptx.title = page.title || 'Export'

  let currentSlide = pptx.addSlide()
  let yPos = 1.0 // Track vertical position

  const processBlock = (block: BlockWithChildren) => {
    const props = block.properties as any

    switch (block.type) {
      case 'heading':
        if (props.level === 1 && options?.slideBreakOnH1) {
          currentSlide = pptx.addSlide()
          currentSlide.addText(props.text || '', { x: 0.5, y: 0.3, fontSize: 28, bold: true })
          yPos = 1.5
        } else {
          currentSlide.addText(props.text || '', { x: 0.5, y: yPos, fontSize: 20, bold: true })
          yPos += 0.6
        }
        break

      case 'paragraph':
        currentSlide.addText(props.text || '', { x: 0.5, y: yPos, fontSize: 14 })
        yPos += 0.4
        break

      case 'citationBlock':
        const citationIndex = citations.findIndex(c => c.factId === props.factId) + 1
        currentSlide.addText(`[${citationIndex}]`, { x: 0.5, y: yPos, fontSize: 10, superscript: true })
        yPos += 0.3
        break

      case 'databaseViewBlock':
        // Fetch database entries and render as table
        break
    }

    // Process children
    if (block.children?.length) {
      for (const child of block.children) processBlock(child)
    }
  }

  for (const block of page.blocks) processBlock(block)

  // Add Sources slide if citations exist
  if (citations.length > 0 && options?.includeCitations !== false) {
    const sourcesSlide = pptx.addSlide()
    sourcesSlide.addText('Sources', { x: 0.5, y: 0.3, fontSize: 24, bold: true })
    // Add citations table...
  }

  return Buffer.from(await pptx.write({ outputType: 'nodebuffer' }))
}
```

---

## DOCX Conversion Logic (Key Points)

```typescript
private async convertToDocx(page, citations, options): Promise<Buffer> {
  const paragraphs: Paragraph[] = []
  const footnotes: Record<number, { children: Paragraph[] }> = {}

  // Build footnotes from citations
  citations.forEach((c, i) => {
    footnotes[i + 1] = {
      children: [new Paragraph({
        children: [new TextRun(`${c.subject} ${c.predicate} ${c.object}. Source: ${c.documentName}. Confidence: ${(c.confidence * 100).toFixed(0)}%`)]
      })]
    }
  })

  const processBlock = (block: BlockWithChildren) => {
    const props = block.properties as any

    switch (block.type) {
      case 'heading':
        const level = props.level === 1 ? HeadingLevel.HEADING_1
                    : props.level === 2 ? HeadingLevel.HEADING_2
                    : HeadingLevel.HEADING_3
        paragraphs.push(new Paragraph({ text: props.text || '', heading: level }))
        break

      case 'paragraph':
        paragraphs.push(new Paragraph({ children: [new TextRun(props.text || '')] }))
        break

      case 'citationBlock':
        const citationIndex = citations.findIndex(c => c.factId === props.factId) + 1
        if (citationIndex > 0) {
          paragraphs.push(new Paragraph({
            children: [new FootnoteReferenceRun(citationIndex)]
          }))
        }
        break

      case 'bulletList':
        // Process list items with bullet: { level: 0 }
        break
    }

    if (block.children?.length) {
      for (const child of block.children) processBlock(child)
    }
  }

  for (const block of page.blocks) processBlock(block)

  const doc = new Document({
    footnotes,
    sections: [{ children: paragraphs }],
  })

  return await Packer.toBuffer(doc)
}
```

---

## Files Summary

### New Files
| File | Purpose |
|------|---------|
| `packages/shared/src/validators/generator.ts` | Export input schema |
| `packages/shared/src/types/generator.ts` | Export result types |
| `apps/api/src/services/generator.service.ts` | Core conversion logic |
| `apps/api/src/routers/generator.ts` | tRPC router |

### Modified Files
| File | Change |
|------|--------|
| `apps/api/package.json` | Add pptxgenjs, docx |
| `apps/api/src/trpc/router.ts` | Register generatorRouter |
| `packages/shared/src/validators/index.ts` | Export generator validators |
| `packages/shared/src/types/index.ts` | Export generator types |

---

## Verification

1. **Typecheck:** `pnpm typecheck`
2. **Build:** `pnpm build`
3. **Tests:** `pnpm -F @trato-hive/api test`
4. **Manual Test:**
   - Create a page with various block types (headings, paragraphs, citations)
   - Call `generator.exportPage({ pageId, format: 'pptx' })`
   - Download and open in PowerPoint - verify content and Sources slide
   - Call `generator.exportPage({ pageId, format: 'docx' })`
   - Download and open in Word - verify content and footnotes

---

## Notes

- `getRecursivePageBlocks()` already exists in `packages/db/src/queries.ts`
- CitationAttributes: `{ factId, sourceText, confidence, documentName, subject, predicate, object }`
- Multi-tenancy enforced via Page → Deal/Company → organizationId check
- For large documents, consider S3 upload + presigned URL instead of base64 return
