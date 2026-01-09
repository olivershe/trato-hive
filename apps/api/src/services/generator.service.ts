/**
 * Generator Service
 *
 * Exports Page/Block content to PPTX and DOCX documents.
 * Preserves citations as footnotes (DOCX) or Sources slide (PPTX).
 */
import { TRPCError } from '@trpc/server'
import type { PrismaClient, Block, Page } from '@trato-hive/db'
import PptxGenJS from 'pptxgenjs'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  FootnoteReferenceRun,
  AlignmentType,
} from 'docx'

// Local type definitions (avoiding Buffer export issues from shared)
export interface ExportResult {
  buffer: Buffer
  filename: string
  mimeType: string
  pageTitle: string
  blockCount: number
  citationCount: number
}

export interface CitationReference {
  index: number
  factId: string
  subject: string
  predicate: string
  object: string
  sourceText: string
  documentName: string
  confidence: number
}

export interface GeneratorExportOptions {
  includeTitle?: boolean
  includeCitations?: boolean
  slideBreakOnH1?: boolean
  citationStyle?: 'footnote' | 'endnote'
}

export type ExportFormat = 'pptx' | 'docx'

const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

// Block with children type (mirrors packages/db/src/queries.ts)
type BlockWithChildren = Block & {
  children?: BlockWithChildren[]
}

// Page with blocks and organization context
interface PageWithBlocks extends Page {
  blocks: BlockWithChildren[]
  deal?: { organizationId: string } | null
  company?: { organizationId: string } | null
}

// Design tokens from The Intelligent Hive
const COLORS = {
  gold: 'E2A74A',
  tealBlue: '2F7E8A',
  charcoal: '1A1A1A',
  bone: 'EDE8E3',
  softSand: 'F5EFE7',
}

export class GeneratorService {
  constructor(private db: PrismaClient) {}

  /**
   * Export a page to PPTX or DOCX format
   * Multi-tenancy: Verifies page belongs to organization via Deal/Company
   */
  async exportPage(
    pageId: string,
    format: ExportFormat,
    organizationId: string,
    options?: GeneratorExportOptions
  ): Promise<ExportResult> {
    // 1. Fetch page and verify organization access
    const page = await this.getPageWithBlocks(pageId, organizationId)

    // 2. Collect all citations
    const citations = this.collectCitations(page.blocks)

    // 3. Convert to requested format
    const buffer =
      format === 'pptx'
        ? await this.convertToPptx(page, citations, options)
        : await this.convertToDocx(page, citations, options)

    // 4. Build filename
    const safeTitle = (page.title || 'export').replace(/[^a-zA-Z0-9-_]/g, '_')
    const filename = `${safeTitle}.${format}`

    return {
      buffer,
      filename,
      mimeType: EXPORT_MIME_TYPES[format],
      pageTitle: page.title || 'Untitled',
      blockCount: this.countBlocks(page.blocks),
      citationCount: citations.length,
    }
  }

  /**
   * Fetch page with blocks and verify organization access
   */
  private async getPageWithBlocks(
    pageId: string,
    organizationId: string
  ): Promise<PageWithBlocks> {
    const page = await this.db.page.findUnique({
      where: { id: pageId },
      include: {
        deal: { select: { organizationId: true } },
        company: { select: { organizationId: true } },
      },
    })

    if (!page) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Page not found',
      })
    }

    // Verify organization access via Deal or Company
    const pageOrgId = page.deal?.organizationId || page.company?.organizationId
    if (pageOrgId && pageOrgId !== organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Access denied to this page',
      })
    }

    // Fetch blocks and reconstruct tree
    const blocks = await this.getRecursivePageBlocks(pageId)

    return { ...page, blocks }
  }

  /**
   * Reconstruct block tree from flat records
   * Mirrors getRecursivePageBlocks from packages/db/src/queries.ts
   */
  private async getRecursivePageBlocks(
    pageId: string
  ): Promise<BlockWithChildren[]> {
    const blocks = await this.db.block.findMany({
      where: { pageId },
      orderBy: { order: 'asc' },
    })

    // Build map for O(1) lookup
    const blockMap = new Map<string, BlockWithChildren>()
    blocks.forEach((block) => {
      blockMap.set(block.id, { ...block, children: [] })
    })

    // Construct tree
    const rootBlocks: BlockWithChildren[] = []
    blocks.forEach((block) => {
      const node = blockMap.get(block.id)!
      if (block.parentId) {
        const parent = blockMap.get(block.parentId)
        if (parent) {
          parent.children?.push(node)
        } else {
          rootBlocks.push(node)
        }
      } else {
        rootBlocks.push(node)
      }
    })

    return rootBlocks
  }

  /**
   * Collect all citation references from blocks
   */
  private collectCitations(blocks: BlockWithChildren[]): CitationReference[] {
    const citations: CitationReference[] = []

    const traverse = (blockList: BlockWithChildren[]) => {
      for (const block of blockList) {
        if (block.type === 'citationBlock') {
          const props = block.properties as Record<string, unknown>
          citations.push({
            index: citations.length + 1,
            factId: (props.factId as string) || '',
            subject: (props.subject as string) || '',
            predicate: (props.predicate as string) || '',
            object: (props.object as string) || '',
            sourceText: (props.sourceText as string) || '',
            documentName: (props.documentName as string) || 'Unknown',
            confidence: (props.confidence as number) || 0,
          })
        }
        if (block.children?.length) {
          traverse(block.children)
        }
      }
    }

    traverse(blocks)
    return citations
  }

  /**
   * Count total blocks including nested children
   */
  private countBlocks(blocks: BlockWithChildren[]): number {
    let count = 0
    const traverse = (blockList: BlockWithChildren[]) => {
      for (const block of blockList) {
        count++
        if (block.children?.length) {
          traverse(block.children)
        }
      }
    }
    traverse(blocks)
    return count
  }

  // ─────────────────────────────────────────────────────────────
  // PPTX CONVERSION
  // ─────────────────────────────────────────────────────────────

  private async convertToPptx(
    page: PageWithBlocks,
    citations: CitationReference[],
    options?: GeneratorExportOptions
  ): Promise<Buffer> {
    const pptx = new PptxGenJS()

    // Set presentation metadata
    pptx.title = page.title || 'Export'
    pptx.author = 'Trato Hive'
    pptx.company = 'Trato Hive'

    // Default layout
    pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 })
    pptx.layout = 'LAYOUT_16x9'

    // Track current slide and Y position
    let currentSlide: PptxGenJS.Slide | null = null
    let yPos = 0.5

    // Create citation map for quick lookup
    const citationMap = new Map<string, number>()
    citations.forEach((c) => citationMap.set(c.factId, c.index))

    // Process blocks recursively
    const processBlock = (block: BlockWithChildren, depth = 0) => {
      const props = block.properties as Record<string, unknown>

      switch (block.type) {
        case 'heading': {
          const level = (props.level as number) || 1
          const text = this.extractTextContent(props)

          if (level === 1 && options?.slideBreakOnH1 !== false) {
            // Create new slide for H1
            currentSlide = pptx.addSlide()
            yPos = 0.5
            currentSlide.addText(text, {
              x: 0.5,
              y: yPos,
              w: 9,
              fontSize: 28,
              bold: true,
              color: COLORS.charcoal,
            })
            yPos += 0.8
          } else {
            // Add heading to current slide
            if (!currentSlide) {
              currentSlide = pptx.addSlide()
              yPos = 0.5
            }
            currentSlide.addText(text, {
              x: 0.5,
              y: yPos,
              w: 9,
              fontSize: level === 2 ? 22 : 18,
              bold: true,
              color: COLORS.charcoal,
            })
            yPos += level === 2 ? 0.6 : 0.5
          }
          break
        }

        case 'paragraph': {
          if (!currentSlide) {
            currentSlide = pptx.addSlide()
            yPos = 0.5
          }
          const text = this.extractTextContent(props)
          if (text) {
            currentSlide.addText(text, {
              x: 0.5,
              y: yPos,
              w: 9,
              fontSize: 14,
              color: COLORS.charcoal,
            })
            yPos += 0.4
          }
          break
        }

        case 'bulletList':
        case 'orderedList': {
          if (!currentSlide) {
            currentSlide = pptx.addSlide()
            yPos = 0.5
          }
          const items = this.extractListItems(block)
          if (items.length > 0) {
            currentSlide.addText(
              items.map((item, idx) => ({
                text: item,
                options: {
                  bullet:
                    block.type === 'bulletList'
                      ? true
                      : { type: 'number' as const, numberStartAt: idx + 1 },
                  indentLevel: 0,
                },
              })),
              {
                x: 0.5,
                y: yPos,
                w: 9,
                fontSize: 14,
                color: COLORS.charcoal,
              }
            )
            yPos += items.length * 0.35
          }
          break
        }

        case 'blockquote': {
          if (!currentSlide) {
            currentSlide = pptx.addSlide()
            yPos = 0.5
          }
          const text = this.extractTextContent(props)
          if (text) {
            currentSlide.addText(text, {
              x: 0.8,
              y: yPos,
              w: 8.4,
              fontSize: 14,
              italic: true,
              color: '666666',
            })
            yPos += 0.5
          }
          break
        }

        case 'codeBlock': {
          if (!currentSlide) {
            currentSlide = pptx.addSlide()
            yPos = 0.5
          }
          const text = this.extractTextContent(props)
          if (text) {
            currentSlide.addText(text, {
              x: 0.5,
              y: yPos,
              w: 9,
              fontSize: 11,
              fontFace: 'Courier New',
              fill: { color: 'F5F5F5' },
            })
            yPos += 0.6
          }
          break
        }

        case 'citationBlock': {
          if (!currentSlide) {
            currentSlide = pptx.addSlide()
            yPos = 0.5
          }
          const factId = props.factId as string
          const index = citationMap.get(factId)
          if (index) {
            currentSlide.addText(`[${index}]`, {
              x: 0.5,
              y: yPos,
              fontSize: 10,
              superscript: true,
              color: COLORS.tealBlue,
            })
            yPos += 0.25
          }
          break
        }

        case 'dealHeaderBlock': {
          if (!currentSlide) {
            currentSlide = pptx.addSlide()
            yPos = 0.5
          }
          this.addDealHeaderToPptx(currentSlide, props, yPos)
          yPos += 1.5
          break
        }

        default:
          // Process children for unknown block types
          break
      }

      // Process children
      if (block.children?.length) {
        for (const child of block.children) {
          processBlock(child, depth + 1)
        }
      }
    }

    // Process all root blocks
    for (const block of page.blocks) {
      processBlock(block)
    }

    // Add Sources slide if citations exist
    if (citations.length > 0 && options?.includeCitations !== false) {
      this.addSourcesSlideToPptx(pptx, citations)
    }

    // Export to buffer
    const data = await pptx.write({ outputType: 'nodebuffer' })
    return Buffer.from(data as ArrayBuffer)
  }

  private addDealHeaderToPptx(
    slide: PptxGenJS.Slide,
    props: Record<string, unknown>,
    yPos: number
  ) {
    const dealName = (props.dealName as string) || 'Deal'
    const stage = (props.stage as string) || 'Unknown'
    const value = (props.value as string) || '0'
    const currency = (props.currency as string) || 'USD'
    const probability = (props.probability as number) || 0

    // Add deal summary table
    slide.addTable(
      [
        [
          { text: 'Deal', options: { bold: true, fill: { color: COLORS.bone } } },
          { text: dealName },
        ],
        [
          { text: 'Stage', options: { bold: true, fill: { color: COLORS.bone } } },
          { text: stage.replace(/_/g, ' ') },
        ],
        [
          { text: 'Value', options: { bold: true, fill: { color: COLORS.bone } } },
          { text: `${currency} ${Number(value).toLocaleString()}` },
        ],
        [
          {
            text: 'Probability',
            options: { bold: true, fill: { color: COLORS.bone } },
          },
          { text: `${probability}%` },
        ],
      ],
      {
        x: 0.5,
        y: yPos,
        w: 5,
        colW: [1.5, 3.5],
        border: { type: 'solid', color: COLORS.gold, pt: 1 },
        fontSize: 12,
      }
    )
  }

  private addSourcesSlideToPptx(
    pptx: PptxGenJS,
    citations: CitationReference[]
  ) {
    const slide = pptx.addSlide()

    slide.addText('Sources', {
      x: 0.5,
      y: 0.3,
      fontSize: 24,
      bold: true,
      color: COLORS.charcoal,
    })

    // Build table rows
    const tableData: PptxGenJS.TableRow[] = [
      [
        { text: '#', options: { bold: true, fill: { color: COLORS.bone } } },
        { text: 'Fact', options: { bold: true, fill: { color: COLORS.bone } } },
        {
          text: 'Document',
          options: { bold: true, fill: { color: COLORS.bone } },
        },
        {
          text: 'Confidence',
          options: { bold: true, fill: { color: COLORS.bone } },
        },
      ],
    ]

    for (const c of citations) {
      tableData.push([
        { text: `[${c.index}]`, options: { color: COLORS.tealBlue } },
        { text: `${c.subject} ${c.predicate} ${c.object}`.trim() || c.sourceText },
        { text: c.documentName },
        { text: `${(c.confidence * 100).toFixed(0)}%` },
      ])
    }

    slide.addTable(tableData, {
      x: 0.5,
      y: 1,
      w: 9,
      colW: [0.5, 4.5, 2.5, 1.5],
      border: { type: 'solid', color: COLORS.gold, pt: 0.5 },
      fontSize: 10,
    })
  }

  // ─────────────────────────────────────────────────────────────
  // DOCX CONVERSION
  // ─────────────────────────────────────────────────────────────

  private async convertToDocx(
    page: PageWithBlocks,
    citations: CitationReference[],
    options?: GeneratorExportOptions
  ): Promise<Buffer> {
    const paragraphs: Paragraph[] = []

    // Build footnotes from citations
    const footnotes: Record<
      number,
      { children: Paragraph[] }
    > = {}

    citations.forEach((c) => {
      footnotes[c.index] = {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `${c.subject} ${c.predicate} ${c.object}`.trim() ||
                  c.sourceText,
              }),
              new TextRun({
                text: ` Source: ${c.documentName}. Confidence: ${(c.confidence * 100).toFixed(0)}%`,
                italics: true,
              }),
            ],
          }),
        ],
      }
    })

    // Create citation map for quick lookup
    const citationMap = new Map<string, number>()
    citations.forEach((c) => citationMap.set(c.factId, c.index))

    // Process blocks recursively
    const processBlock = (block: BlockWithChildren, depth = 0) => {
      const props = block.properties as Record<string, unknown>

      switch (block.type) {
        case 'heading': {
          const level = (props.level as number) || 1
          const text = this.extractTextContent(props)
          const headingLevel =
            level === 1
              ? HeadingLevel.HEADING_1
              : level === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3

          paragraphs.push(
            new Paragraph({
              text,
              heading: headingLevel,
            })
          )
          break
        }

        case 'paragraph': {
          const text = this.extractTextContent(props)
          if (text) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun(text)],
              })
            )
          }
          break
        }

        case 'bulletList': {
          const items = this.extractListItems(block)
          for (const item of items) {
            paragraphs.push(
              new Paragraph({
                text: item,
                bullet: { level: 0 },
              })
            )
          }
          break
        }

        case 'orderedList': {
          const items = this.extractListItems(block)
          for (let i = 0; i < items.length; i++) {
            paragraphs.push(
              new Paragraph({
                text: items[i],
                numbering: { reference: 'default-numbering', level: 0 },
              })
            )
          }
          break
        }

        case 'blockquote': {
          const text = this.extractTextContent(props)
          if (text) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    italics: true,
                  }),
                ],
                indent: { left: 720 }, // 0.5 inch
              })
            )
          }
          break
        }

        case 'codeBlock': {
          const text = this.extractTextContent(props)
          if (text) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    font: 'Courier New',
                    size: 20, // 10pt
                  }),
                ],
                shading: { fill: 'F5F5F5' },
              })
            )
          }
          break
        }

        case 'citationBlock': {
          const factId = props.factId as string
          const index = citationMap.get(factId)
          if (index && options?.includeCitations !== false) {
            paragraphs.push(
              new Paragraph({
                children: [new FootnoteReferenceRun(index)],
              })
            )
          }
          break
        }

        case 'dealHeaderBlock': {
          this.addDealHeaderToDocx(paragraphs, props)
          break
        }

        default:
          // Process children for unknown block types
          break
      }

      // Process children (except for lists which handle their own)
      if (
        block.children?.length &&
        block.type !== 'bulletList' &&
        block.type !== 'orderedList'
      ) {
        for (const child of block.children) {
          processBlock(child, depth + 1)
        }
      }
    }

    // Process all root blocks
    for (const block of page.blocks) {
      processBlock(block)
    }

    // Create document
    const doc = new Document({
      title: page.title || 'Export',
      creator: 'Trato Hive',
      footnotes:
        citations.length > 0 && options?.includeCitations !== false
          ? footnotes
          : undefined,
      numbering: {
        config: [
          {
            reference: 'default-numbering',
            levels: [
              {
                level: 0,
                format: 'decimal',
                text: '%1.',
                alignment: AlignmentType.START,
              },
            ],
          },
        ],
      },
      sections: [
        {
          children: paragraphs,
        },
      ],
    })

    return await Packer.toBuffer(doc)
  }

  private addDealHeaderToDocx(
    paragraphs: Paragraph[],
    props: Record<string, unknown>
  ) {
    const dealName = (props.dealName as string) || 'Deal'
    const stage = (props.stage as string) || 'Unknown'
    const value = (props.value as string) || '0'
    const currency = (props.currency as string) || 'USD'
    const probability = (props.probability as number) || 0

    // Add deal info as formatted paragraphs
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `Deal: ${dealName}`, bold: true })],
      })
    )
    paragraphs.push(
      new Paragraph({
        children: [new TextRun(`Stage: ${stage.replace(/_/g, ' ')}`)],
      })
    )
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun(`Value: ${currency} ${Number(value).toLocaleString()}`),
        ],
      })
    )
    paragraphs.push(
      new Paragraph({
        children: [new TextRun(`Probability: ${probability}%`)],
      })
    )
    paragraphs.push(new Paragraph({ children: [] })) // Spacing
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Extract text content from block properties
   * Handles both direct text and Tiptap content array
   */
  private extractTextContent(props: Record<string, unknown>): string {
    // Direct text property
    if (typeof props.text === 'string') {
      return props.text
    }

    // Tiptap content array
    if (Array.isArray(props.content)) {
      return this.extractTextFromContent(props.content)
    }

    return ''
  }

  /**
   * Recursively extract text from Tiptap content nodes
   */
  private extractTextFromContent(content: unknown[]): string {
    let text = ''
    for (const node of content) {
      if (typeof node === 'object' && node !== null) {
        const n = node as Record<string, unknown>
        if (n.type === 'text' && typeof n.text === 'string') {
          text += n.text
        }
        if (Array.isArray(n.content)) {
          text += this.extractTextFromContent(n.content)
        }
      }
    }
    return text
  }

  /**
   * Extract list items from bulletList or orderedList block
   */
  private extractListItems(block: BlockWithChildren): string[] {
    const items: string[] = []

    if (block.children) {
      for (const child of block.children) {
        if (child.type === 'listItem') {
          // List items have paragraph children
          if (child.children) {
            for (const paragraph of child.children) {
              const props = paragraph.properties as Record<string, unknown>
              const text = this.extractTextContent(props)
              if (text) {
                items.push(text)
              }
            }
          }
        }
      }
    }

    return items
  }
}
