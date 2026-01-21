/**
 * Page Service
 *
 * Business logic for Notion-like page hierarchy within Deals.
 * Supports recursive nesting, wiki links, and breadcrumb navigation.
 */
import { TRPCError } from '@trpc/server';
import type { PrismaClient, Page, PageLink, Prisma } from '@trato-hive/db';
import type {
  CreatePageInput,
  UpdatePageInput,
  MovePageInput,
  SyncPageLinksInput,
} from '@trato-hive/shared';

/**
 * Recursive page tree node for sidebar navigation
 */
export interface PageTreeNode {
  id: string;
  title: string | null;
  icon: string | null;
  isDatabase: boolean;
  order: number;
  children: PageTreeNode[];
}

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  id: string;
  title: string | null;
}

export class PageService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new page
   * Multi-tenancy: Validates deal belongs to organization
   */
  async create(
    input: CreatePageInput,
    userId: string,
    organizationId: string
  ): Promise<Page> {
    // Validate deal exists and belongs to org
    const deal = await this.db.deal.findUnique({
      where: { id: input.dealId },
    });

    if (!deal || deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal not found',
      });
    }

    // If parentPageId provided, validate it exists and belongs to same deal
    if (input.parentPageId) {
      const parentPage = await this.db.page.findUnique({
        where: { id: input.parentPageId },
      });

      if (!parentPage || parentPage.dealId !== input.dealId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid parent page',
        });
      }
    }

    // Get max order for siblings
    const maxOrderResult = await this.db.page.aggregate({
      where: {
        dealId: input.dealId,
        parentPageId: input.parentPageId ?? null,
      },
      _max: { order: true },
    });
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    // Create the page
    return this.db.page.create({
      data: {
        dealId: input.dealId,
        parentPageId: input.parentPageId,
        title: input.title,
        icon: input.icon,
        isDatabase: input.isDatabase,
        order: nextOrder,
      },
    });
  }

  /**
   * Update page metadata
   */
  async update(
    input: UpdatePageInput,
    organizationId: string
  ): Promise<Page> {
    const page = await this.getById(input.id, organizationId);

    return this.db.page.update({
      where: { id: input.id },
      data: {
        title: input.title,
        icon: input.icon,
        coverImage: input.coverImage,
      },
    });
  }

  /**
   * Delete page and all children (cascade)
   */
  async delete(pageId: string, organizationId: string): Promise<void> {
    await this.getById(pageId, organizationId);

    // Prisma cascade will handle children
    await this.db.page.delete({
      where: { id: pageId },
    });
  }

  /**
   * Move page to new parent or reorder
   */
  async move(
    input: MovePageInput,
    organizationId: string
  ): Promise<Page> {
    const page = await this.getById(input.id, organizationId);

    // If moving to new parent, validate it
    if (input.parentPageId) {
      const newParent = await this.db.page.findUnique({
        where: { id: input.parentPageId },
      });

      if (!newParent || newParent.dealId !== page.dealId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid parent page',
        });
      }

      // Prevent moving page into its own descendants
      const isDescendant = await this.isDescendant(input.parentPageId, input.id);
      if (isDescendant) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot move page into its own children',
        });
      }
    }

    return this.db.page.update({
      where: { id: input.id },
      data: {
        parentPageId: input.parentPageId,
        order: input.order,
      },
    });
  }

  /**
   * Get page by ID with access check
   */
  async getById(pageId: string, organizationId: string): Promise<Page> {
    const page = await this.db.page.findUnique({
      where: { id: pageId },
      include: {
        deal: true,
      },
    });

    if (!page) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Page not found',
      });
    }

    // Verify organization access via Deal or Organization (for org-level pages)
    const pageOrgId = page.deal?.organizationId ?? page.organizationId
    if (pageOrgId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Page not found',
      });
    }

    return page;
  }

  /**
   * Get page with blocks for editor
   */
  async getWithBlocks(pageId: string, organizationId: string) {
    await this.getById(pageId, organizationId);

    return this.db.page.findUnique({
      where: { id: pageId },
      include: {
        blocks: {
          orderBy: { order: 'asc' },
        },
        databaseEntry: {
          include: {
            database: true,
          },
        },
        database: true,
      },
    });
  }

  /**
   * Get full page tree for deal (for sidebar)
   */
  async getTree(dealId: string, organizationId: string): Promise<PageTreeNode[]> {
    // Validate deal access
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal || deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Deal not found',
      });
    }

    // Get all pages for this deal
    const pages = await this.db.page.findMany({
      where: { dealId },
      orderBy: { order: 'asc' },
    });

    // Build tree recursively
    return this.buildTree(pages, null);
  }

  /**
   * Get breadcrumbs from root to page
   */
  async getBreadcrumbs(pageId: string, organizationId: string): Promise<BreadcrumbItem[]> {
    await this.getById(pageId, organizationId);

    const breadcrumbs: BreadcrumbItem[] = [];
    let currentId: string | null = pageId;

    while (currentId) {
      const result: { id: string; title: string | null; parentPageId: string | null } | null =
        await this.db.page.findUnique({
          where: { id: currentId },
          select: { id: true, title: true, parentPageId: true },
        });

      if (!result) break;

      breadcrumbs.unshift({ id: result.id, title: result.title });
      currentId = result.parentPageId;
    }

    return breadcrumbs;
  }

  /**
   * Get backlinks (pages that link to this page)
   */
  async getBacklinks(pageId: string, organizationId: string): Promise<Array<{
    sourcePageId: string;
    sourcePageTitle: string | null;
    blockId: string;
  }>> {
    await this.getById(pageId, organizationId);

    const links = await this.db.pageLink.findMany({
      where: { targetPageId: pageId },
      include: {
        sourcePage: {
          select: { id: true, title: true },
        },
      },
    });

    return links.map((link) => ({
      sourcePageId: link.sourcePageId,
      sourcePageTitle: link.sourcePage.title,
      blockId: link.blockId,
    }));
  }

  /**
   * Sync page links - replaces all outgoing links for a page
   * Called when page content is saved
   */
  async syncLinks(
    input: SyncPageLinksInput,
    organizationId: string
  ): Promise<void> {
    await this.getById(input.pageId, organizationId);

    // Delete existing outgoing links
    await this.db.pageLink.deleteMany({
      where: { sourcePageId: input.pageId },
    });

    // Create new links
    if (input.links.length > 0) {
      await this.db.pageLink.createMany({
        data: input.links.map((link) => ({
          sourcePageId: input.pageId,
          targetPageId: link.targetPageId,
          blockId: link.blockId,
        })),
        skipDuplicates: true,
      });
    }
  }

  /**
   * Build recursive tree from flat page list
   */
  private buildTree(pages: Page[], parentId: string | null): PageTreeNode[] {
    return pages
      .filter((p) => p.parentPageId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((page) => ({
        id: page.id,
        title: page.title,
        icon: page.icon,
        isDatabase: page.isDatabase,
        order: page.order,
        children: this.buildTree(pages, page.id),
      }));
  }

  /**
   * Check if targetId is a descendant of ancestorId
   */
  private async isDescendant(targetId: string, ancestorId: string): Promise<boolean> {
    let currentId: string | null = targetId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === ancestorId) return true;
      if (visited.has(currentId)) break; // Prevent infinite loops
      visited.add(currentId);

      const pageData: { parentPageId: string | null } | null = await this.db.page.findUnique({
        where: { id: currentId },
        select: { parentPageId: true },
      });

      currentId = pageData?.parentPageId ?? null;
    }

    return false;
  }
}
