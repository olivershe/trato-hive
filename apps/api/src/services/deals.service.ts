/**
 * Deal Service
 *
 * Business logic for Deal CRUD operations.
 * Enforces multi-tenancy via organizationId on all operations.
 *
 * Phase 12: Integrates with org-level Deals Database
 * - Creates DatabaseEntry when deal is created
 * - Syncs updates between Deal table and DatabaseEntry
 */
import { TRPCError } from '@trpc/server';
import type { PrismaClient, Deal, Prisma, DealStage, DealType } from '@trato-hive/db';
import {
  DATABASE_TEMPLATES,
  DEALS_DATABASE_SCHEMA,
  DEALS_DATABASE_NAME,
  DEALS_DATABASE_DESCRIPTION,
  type DealListInput,
  type RouterCreateDealInput,
} from '@trato-hive/shared';

export interface DealListResult {
  items: Deal[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface FactSheetResult {
  dealId: string;
  dealName: string;
  facts: Array<{
    id: string;
    type: string;
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    sourceText: string | null;
    document: { id: string; name: string } | null;
  }>;
  company: { id: string; name: string; aiSummary: string | null } | null;
}

export class DealService {
  constructor(private db: PrismaClient) {}

  /**
   * List deals with pagination and filtering
   * Multi-tenancy: Filters by organizationId
   */
  async list(input: DealListInput, organizationId: string): Promise<DealListResult> {
    const { page = 1, pageSize = 20, filter, sort } = input;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.DealWhereInput = {
      organizationId, // Multi-tenancy enforcement
    };

    if (filter?.stage) {
      where.stage = filter.stage as DealStage;
    }
    if (filter?.type) {
      where.type = filter.type as DealType;
    }
    if (filter?.companyId) {
      where.companyId = filter.companyId;
    }
    if (filter?.search) {
      where.name = {
        contains: filter.search,
        mode: 'insensitive',
      };
    }

    // Build orderBy
    const orderBy: Prisma.DealOrderByWithRelationInput = {};
    if (sort?.field) {
      orderBy[sort.field as keyof Prisma.DealOrderByWithRelationInput] = sort.order || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.db.deal.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
            },
          },
          dealCompanies: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  industry: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.db.deal.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get single deal by ID
   * Multi-tenancy: Validates deal belongs to organization
   * Phase 12: Includes databaseEntry relation for properties panel
   */
  async getById(id: string, organizationId: string) {
    const deal = await this.db.deal.findUnique({
      where: { id },
      include: {
        company: true,
        // Phase 12: Include database entry with schema
        databaseEntry: {
          include: {
            database: {
              select: {
                id: true,
                schema: true,
              },
            },
          },
        },
      },
    });

    if (!deal) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal not found',
      });
    }

    // Multi-tenancy check
    if (deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND', // Don't reveal existence
        message: 'Deal not found',
      });
    }

    return deal;
  }

  /**
   * Get deal with its Notion-style page and blocks
   * Used by the editor to load the deal document
   */
  async getWithPage(id: string, organizationId: string) {
    const deal = await this.getById(id, organizationId);

    // Get page with blocks
    const page = await this.db.page.findFirst({
      where: { dealId: id },
      include: {
        blocks: {
          orderBy: [{ order: 'asc' }],
        },
      },
    });

    return {
      ...deal,
      page,
    };
  }

  /**
   * Create new deal with Notion-style page tree
   * Multi-tenancy: Sets organizationId from context
   *
   * Phase 12: Also creates DatabaseEntry in org-level Deals Database
   *
   * Creates the following page structure:
   * - Root Page (deal name)
   *   - Due Diligence (folder)
   *     - Financial Analysis
   *     - Legal Review
   *     - Technical DD
   *   - DD Tracker (database)
   *   - Data Room
   *   - Meeting Notes
   *   - Key Questions
   */
  async create(
    input: RouterCreateDealInput,
    organizationId: string,
    userId: string
  ): Promise<Deal> {
    return this.db.$transaction(async (tx) => {
      // Phase 12: Get or create the org-level Deals Database
      let dealsDatabase = await tx.database.findFirst({
        where: {
          organizationId,
          isOrgLevel: true,
          name: DEALS_DATABASE_NAME,
        },
      });

      if (!dealsDatabase) {
        // Create org-level page for the database
        const databasePage = await tx.page.create({
          data: {
            organizationId,
            title: DEALS_DATABASE_NAME,
            icon: '📊',
            isDatabase: true,
          },
        });

        // Create the Deals Database
        dealsDatabase = await tx.database.create({
          data: {
            name: DEALS_DATABASE_NAME,
            description: DEALS_DATABASE_DESCRIPTION,
            schema: DEALS_DATABASE_SCHEMA as unknown as Prisma.InputJsonValue,
            organizationId,
            isOrgLevel: true,
            pageId: databasePage.id,
            createdById: userId,
          },
        });
      }

      // Phase 12: Create entry in Deals Database
      const entryProperties = {
        name: input.name,
        stage: input.stage,
        type: input.type,
        priority: 'NONE', // Default priority
        value: input.value ? Number(input.value) : null,
        probability: input.probability,
        source: null,
        expectedCloseDate: input.expectedCloseDate
          ? input.expectedCloseDate.toISOString()
          : null,
        leadPartner: null,
      };

      // Create entry page (will be linked to deal root page later)
      const entryPage = await tx.page.create({
        data: {
          organizationId,
          parentPageId: dealsDatabase.pageId,
          title: input.name,
          icon: '📋',
        },
      });

      const databaseEntry = await tx.databaseEntry.create({
        data: {
          databaseId: dealsDatabase.id,
          properties: entryProperties as Prisma.InputJsonValue,
          pageId: entryPage.id,
          createdById: userId,
        },
      });

      // 1. Create the deal with link to database entry
      const deal = await tx.deal.create({
        data: {
          name: input.name,
          type: input.type as DealType,
          stage: input.stage as DealStage,
          value: input.value,
          currency: input.currency,
          probability: input.probability,
          expectedCloseDate: input.expectedCloseDate,
          description: input.description,
          notes: input.notes,
          companyId: input.companyId,
          organizationId,
          databaseEntryId: databaseEntry.id, // Phase 12: Link to entry
        },
      });

      // 2. Create root page
      const rootPage = await tx.page.create({
        data: {
          dealId: deal.id,
          title: deal.name,
          icon: '📊',
          order: 0,
        },
      });

      // 3. Create Due Diligence section
      const dueDiligencePage = await tx.page.create({
        data: {
          dealId: deal.id,
          parentPageId: rootPage.id,
          title: 'Due Diligence',
          icon: '🔍',
          order: 0,
        },
      });

      // 4. Create DD sub-pages
      await tx.page.createMany({
        data: [
          { dealId: deal.id, parentPageId: dueDiligencePage.id, title: 'Financial Analysis', icon: '💰', order: 0 },
          { dealId: deal.id, parentPageId: dueDiligencePage.id, title: 'Legal Review', icon: '⚖️', order: 1 },
          { dealId: deal.id, parentPageId: dueDiligencePage.id, title: 'Technical DD', icon: '🔧', order: 2 },
        ],
      });

      // 5. Create DD Tracker database page
      const ddTrackerPage = await tx.page.create({
        data: {
          dealId: deal.id,
          parentPageId: rootPage.id,
          title: 'DD Tracker',
          icon: '📋',
          isDatabase: true,
          order: 1,
        },
      });

      // 6. Create the Database linked to DD Tracker page
      const ddTemplate = DATABASE_TEMPLATES.find(t => t.id === 'dd-tracker')!;
      await tx.database.create({
        data: {
          name: 'DD Tracker',
          description: 'Track due diligence tasks for this deal',
          schema: ddTemplate.schema as unknown as Prisma.InputJsonValue,
          organizationId,
          dealId: deal.id,
          pageId: ddTrackerPage.id,
          createdById: userId,
        },
      });

      // 7. Create other top-level pages
      await tx.page.createMany({
        data: [
          { dealId: deal.id, parentPageId: rootPage.id, title: 'Data Room', icon: '📁', order: 2 },
          { dealId: deal.id, parentPageId: rootPage.id, title: 'Meeting Notes', icon: '📝', order: 3 },
          { dealId: deal.id, parentPageId: rootPage.id, title: 'Key Questions', icon: '❓', order: 4 },
        ],
      });

      // 8. Create Q&A sub-page with template blocks [TASK-118]
      const qaPage = await tx.page.create({
        data: {
          dealId: deal.id,
          parentPageId: rootPage.id,
          title: 'Q&A',
          icon: '💬',
          order: 5,
        },
      });

      // 9. Create Q&A template blocks
      await tx.block.createMany({
        data: [
          {
            pageId: qaPage.id,
            type: 'heading',
            order: 0,
            properties: { text: 'AI-Powered Q&A', level: 1 },
            createdBy: userId,
          },
          {
            pageId: qaPage.id,
            type: 'paragraph',
            order: 1,
            properties: { text: 'Ask questions about this deal and get AI-generated answers with citations from your documents.' },
            createdBy: userId,
          },
          {
            pageId: qaPage.id,
            type: 'queryBlock',
            order: 2,
            properties: {
              query: '',
              dealId: deal.id,
              status: 'idle',
              showReview: true,
              answer: null,
              errorMessage: null,
              qaAnswerId: null,
              reviewStatus: null,
            },
            createdBy: userId,
          },
          {
            pageId: qaPage.id,
            type: 'heading',
            order: 3,
            properties: { text: 'Q&A History', level: 2 },
            createdBy: userId,
          },
        ],
      });

      // 10. Create deal header block on root page
      await tx.block.create({
        data: {
          pageId: rootPage.id,
          type: 'deal_header',
          order: 0,
          properties: {
            dealId: deal.id,
            name: deal.name,
            stage: deal.stage,
            type: deal.type,
            value: deal.value,
          },
          createdBy: userId,
        },
      });

      return deal;
    });
  }

  /**
   * Update existing deal
   * Multi-tenancy: Validates ownership before update
   * Phase 12: Syncs updates with DatabaseEntry if exists
   */
  async update(
    id: string,
    data: Partial<RouterCreateDealInput>,
    organizationId: string
  ): Promise<Deal> {
    // First validate access and get current state
    const existingDeal = await this.getById(id, organizationId);

    // Build update data with proper enum casts
    const updateData: Prisma.DealUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type as DealType;
    if (data.stage !== undefined) updateData.stage = data.stage as DealStage;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.probability !== undefined) updateData.probability = data.probability;
    if (data.expectedCloseDate !== undefined) updateData.expectedCloseDate = data.expectedCloseDate;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.companyId !== undefined) {
      updateData.company = data.companyId ? { connect: { id: data.companyId } } : { disconnect: true };
    }

    // Phase 12: Also update the DatabaseEntry if it exists
    if (existingDeal.databaseEntryId) {
      const entryUpdates: Record<string, unknown> = {};
      if (data.name !== undefined) entryUpdates.name = data.name;
      if (data.stage !== undefined) entryUpdates.stage = data.stage;
      if (data.type !== undefined) entryUpdates.type = data.type;
      if (data.value !== undefined) entryUpdates.value = data.value ? Number(data.value) : null;
      if (data.probability !== undefined) entryUpdates.probability = data.probability;
      if (data.expectedCloseDate !== undefined) {
        entryUpdates.expectedCloseDate = data.expectedCloseDate
          ? data.expectedCloseDate.toISOString()
          : null;
      }

      // Get current entry properties and merge
      const currentEntry = await this.db.databaseEntry.findUnique({
        where: { id: existingDeal.databaseEntryId },
      });

      if (currentEntry) {
        const mergedProperties = {
          ...(currentEntry.properties as Record<string, unknown>),
          ...entryUpdates,
        };

        await this.db.databaseEntry.update({
          where: { id: existingDeal.databaseEntryId },
          data: {
            properties: mergedProperties as Prisma.InputJsonValue,
          },
        });

        // Update entry page title if name changed
        if (data.name && currentEntry.pageId) {
          await this.db.page.update({
            where: { id: currentEntry.pageId },
            data: { title: data.name },
          });
        }
      }
    }

    // Perform deal update
    return this.db.deal.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Get fact sheet for deal
   * Joins with Fact, Company, Document tables
   */
  async getFactSheet(dealId: string, organizationId: string): Promise<FactSheetResult> {
    const deal = await this.getById(dealId, organizationId);

    // Get facts for the deal's company (if exists)
    const facts = deal.companyId
      ? await this.db.fact.findMany({
          where: { companyId: deal.companyId },
          include: {
            document: {
              select: { id: true, name: true },
            },
          },
          orderBy: { confidence: 'desc' },
        })
      : [];

    const company = deal.companyId
      ? await this.db.company.findUnique({
          where: { id: deal.companyId },
          select: { id: true, name: true, aiSummary: true },
        })
      : null;

    return {
      dealId: deal.id,
      dealName: deal.name,
      facts: facts.map((f) => ({
        id: f.id,
        type: f.type,
        subject: f.subject,
        predicate: f.predicate,
        object: f.object,
        confidence: f.confidence,
        sourceText: f.sourceText,
        document: f.document,
      })),
      company,
    };
  }
}
