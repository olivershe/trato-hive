/**
 * Document Service
 *
 * Business logic for Document operations including page creation.
 * Enforces multi-tenancy via organizationId on all operations.
 *
 * [TASK-112] Document Page Template
 */
import { TRPCError } from '@trpc/server';
import type { PrismaClient, Document, Fact, Page } from '@trato-hive/db';

// =============================================================================
// Types
// =============================================================================

export interface DocumentWithPage extends Document {
  page: Page | null;
  uploadedBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface DocumentFact {
  id: string;
  type: string;
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  sourceChunkId: string | null;
  sourceText: string | null;
}

// =============================================================================
// Service Class
// =============================================================================

export class DocumentService {
  constructor(private db: PrismaClient) {}

  /**
   * Get document by ID with its associated page
   * Multi-tenancy: Validates document belongs to organization
   */
  async getWithPage(
    documentId: string,
    organizationId: string
  ): Promise<DocumentWithPage> {
    const document = await this.db.document.findFirst({
      where: {
        id: documentId,
        organizationId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pages: {
          where: {
            type: 'DOCUMENT_PAGE',
          },
          take: 1,
        },
      },
    });

    if (!document) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Document not found',
      });
    }

    return {
      ...document,
      page: document.pages[0] || null,
    };
  }

  /**
   * Get facts extracted from a document
   * Multi-tenancy: Validates document belongs to organization
   */
  async getFacts(
    documentId: string,
    organizationId: string,
    limit: number = 50
  ): Promise<DocumentFact[]> {
    // First verify document access
    const document = await this.db.document.findFirst({
      where: {
        id: documentId,
        organizationId,
      },
    });

    if (!document) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Document not found',
      });
    }

    const facts = await this.db.fact.findMany({
      where: {
        documentId,
      },
      select: {
        id: true,
        type: true,
        subject: true,
        predicate: true,
        object: true,
        confidence: true,
        sourceChunkId: true,
        sourceText: true,
      },
      orderBy: [
        { type: 'asc' },
        { confidence: 'desc' },
      ],
      take: limit,
    });

    return facts;
  }

  /**
   * Create a Document Page after document processing
   *
   * Creates the page structure:
   * - DocumentViewerBlock (order: 0)
   * - Heading "Extracted Facts" (order: 1)
   * - ExtractedFactsBlock (order: 2)
   * - Heading "Q&A" (order: 3)
   * - QueryBlock scoped to documentId (order: 4)
   *
   * If document doesn't have a dealId, creates a shadow deal.
   *
   * @returns The created Page
   */
  async createDocumentPage(
    documentId: string,
    organizationId: string,
    userId?: string
  ): Promise<Page> {
    return this.db.$transaction(async (tx) => {
      // 1. Get the document
      const document = await tx.document.findFirst({
        where: {
          id: documentId,
          organizationId,
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      // 2. Check if page already exists
      const existingPage = await tx.page.findFirst({
        where: {
          documentId,
          type: 'DOCUMENT_PAGE',
        },
      });

      if (existingPage) {
        return existingPage;
      }

      // 3. Get or create deal for page association
      let dealId = document.dealId;

      if (!dealId) {
        // Create a shadow deal to hold the document page
        // (Required because Page model requires dealId)
        const shadowDeal = await tx.deal.create({
          data: {
            name: `${document.name} - Document`,
            type: 'OTHER',
            stage: 'SOURCING',
            organizationId,
            companyId: document.companyId,
          },
        });
        dealId = shadowDeal.id;

        // Update document with the shadow deal
        await tx.document.update({
          where: { id: documentId },
          data: { dealId },
        });
      }

      // 4. Create the document page
      const page = await tx.page.create({
        data: {
          dealId,
          documentId,
          type: 'DOCUMENT_PAGE',
          title: document.name,
          icon: '📄',
          order: 0,
        },
      });

      // 5. Create template blocks
      const createdBy = userId || document.uploadedById;

      await tx.block.createMany({
        data: [
          {
            pageId: page.id,
            type: 'document_viewer',
            order: 0,
            properties: {
              documentId,
              currentPage: 1,
              totalPages: 1,
              zoomLevel: 1,
              viewMode: 'fit-width',
              highlightedChunkId: null,
            },
            createdBy,
          },
          {
            pageId: page.id,
            type: 'heading',
            order: 1,
            properties: {
              text: 'Extracted Facts',
              level: 2,
            },
            createdBy,
          },
          {
            pageId: page.id,
            type: 'extracted_facts',
            order: 2,
            properties: {
              documentId,
              title: 'Extracted Facts',
              maxItems: 50,
              groupByType: true,
            },
            createdBy,
          },
          {
            pageId: page.id,
            type: 'heading',
            order: 3,
            properties: {
              text: 'Q&A',
              level: 2,
            },
            createdBy,
          },
          {
            pageId: page.id,
            type: 'query',
            order: 4,
            properties: {
              query: '',
              dealId,
              companyId: document.companyId,
              documentId, // Scope Q&A to this document
              status: 'idle',
              answer: null,
              errorMessage: null,
            },
            createdBy,
          },
        ],
      });

      return page;
    });
  }

  /**
   * Ensure a document has a page, creating one if it doesn't exist
   */
  async ensureDocumentPage(
    documentId: string,
    organizationId: string,
    userId?: string
  ): Promise<Page> {
    // Check for existing page first
    const existingPage = await this.db.page.findFirst({
      where: {
        documentId,
        type: 'DOCUMENT_PAGE',
      },
    });

    if (existingPage) {
      return existingPage;
    }

    // Create new page
    return this.createDocumentPage(documentId, organizationId, userId);
  }
}

/**
 * Factory function to create DocumentService
 */
export function createDocumentService(db: PrismaClient): DocumentService {
  return new DocumentService(db);
}
