/**
 * SyncGroupService
 *
 * Manages synced blocks - blocks that share content across pages.
 * When a block with a syncGroupId is updated, all other blocks
 * in the same sync group are updated with the same content.
 */
import { TRPCError } from '@trpc/server';
import type { PrismaClient, Block } from '@trato-hive/db';

export interface SyncedBlock {
  id: string;
  pageId: string;
  syncGroupId: string;
  type: string;
  properties: unknown;
}

export class SyncGroupService {
  constructor(private db: PrismaClient) {}

  /**
   * Create a new sync group for a block
   * Returns the syncGroupId to use
   */
  async createSyncGroup(
    blockId: string,
    organizationId: string
  ): Promise<string> {
    // Verify block exists and belongs to org
    const block = await this.db.block.findUnique({
      where: { id: blockId },
      include: {
        page: {
          include: { deal: true },
        },
      },
    });

    if (!block || block.page.deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Block not found',
      });
    }

    // Generate sync group ID
    const syncGroupId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Update block with sync group ID
    await this.db.block.update({
      where: { id: blockId },
      data: { syncGroupId },
    });

    return syncGroupId;
  }

  /**
   * Get all blocks in a sync group
   */
  async getSyncGroupBlocks(
    syncGroupId: string,
    organizationId: string
  ): Promise<SyncedBlock[]> {
    const blocks = await this.db.block.findMany({
      where: { syncGroupId },
      include: {
        page: {
          include: { deal: true },
        },
      },
    });

    // Filter to only blocks in this org
    type BlockWithRelations = typeof blocks[number];
    return blocks
      .filter((b: BlockWithRelations) => b.page.deal.organizationId === organizationId)
      .map((b: BlockWithRelations) => ({
        id: b.id,
        pageId: b.pageId,
        syncGroupId: b.syncGroupId!,
        type: b.type,
        properties: b.properties,
      }));
  }

  /**
   * Create a synced copy of a block on another page
   */
  async createSyncedCopy(
    sourceBlockId: string,
    targetPageId: string,
    userId: string,
    organizationId: string
  ): Promise<Block> {
    // Get source block
    const sourceBlock = await this.db.block.findUnique({
      where: { id: sourceBlockId },
      include: {
        page: {
          include: { deal: true },
        },
      },
    });

    if (!sourceBlock || sourceBlock.page.deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Source block not found',
      });
    }

    // Verify target page belongs to same org
    const targetPage = await this.db.page.findUnique({
      where: { id: targetPageId },
      include: { deal: true },
    });

    if (!targetPage || targetPage.deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Target page not found',
      });
    }

    // Get or create sync group ID
    let syncGroupId = sourceBlock.syncGroupId;
    if (!syncGroupId) {
      syncGroupId = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      // Update source block with sync group ID
      await this.db.block.update({
        where: { id: sourceBlockId },
        data: { syncGroupId },
      });
    }

    // Get max order in target page
    const maxOrder = await this.db.block.aggregate({
      where: { pageId: targetPageId, parentId: null },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    // Create copy in target page
    return this.db.block.create({
      data: {
        type: sourceBlock.type,
        properties: sourceBlock.properties as any,
        syncGroupId,
        pageId: targetPageId,
        order: nextOrder,
        createdBy: userId,
      },
    });
  }

  /**
   * Propagate content changes to all blocks in a sync group
   * Called after block sync to update synced copies
   */
  async propagateSyncGroupChanges(
    syncGroupId: string,
    sourcePageId: string,
    properties: unknown,
    type: string
  ): Promise<number> {
    // Update all blocks in sync group except on source page
    const result = await this.db.block.updateMany({
      where: {
        syncGroupId,
        pageId: { not: sourcePageId },
      },
      data: {
        properties: properties as any,
        type,
      },
    });

    return result.count;
  }

  /**
   * Remove a block from its sync group
   */
  async unlinkFromSyncGroup(
    blockId: string,
    organizationId: string
  ): Promise<void> {
    const block = await this.db.block.findUnique({
      where: { id: blockId },
      include: {
        page: {
          include: { deal: true },
        },
      },
    });

    if (!block || block.page.deal.organizationId !== organizationId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Block not found',
      });
    }

    await this.db.block.update({
      where: { id: blockId },
      data: { syncGroupId: null },
    });
  }
}
