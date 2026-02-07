/**
 * Page Generation Service
 *
 * [TASK-136] Orchestrates between GeneratorAgent and database creation.
 * Uses in-memory state for generation progress (polling-based streaming).
 */
import type { PrismaClient } from '@trato-hive/db';
import { TRPCError } from '@trpc/server';
import type {
  PageGenerationRequest,
  GeneratedBlock,
  GenerationTemplate,
} from '@trato-hive/ai-core';
import type { PageGenerationEvent } from '@trato-hive/ai-core';
import {
  type PageGenerationAgentDependencies,
  PageGenerationAgent,
} from '@trato-hive/agents';
import { createDatabaseFromGeneration } from '@trato-hive/agents';
import { createId } from '@paralleldrive/cuid2';

// =============================================================================
// Generation State
// =============================================================================

interface GenerationState {
  events: PageGenerationEvent[];
  blocks: GeneratedBlock[];
  databaseIdMap: Record<number, string>;
  isComplete: boolean;
  lastPolledIndex: number;
  createdAt: number;
  abortController: AbortController;
}

// TTL for completed generations (10 minutes)
const GENERATION_TTL_MS = 10 * 60 * 1000;

// =============================================================================
// Service
// =============================================================================

export class PageGenerationService {
  private generations = new Map<string, GenerationState>();
  private readonly db: PrismaClient;
  private readonly agentDeps: PageGenerationAgentDependencies;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(db: PrismaClient, agentDeps: PageGenerationAgentDependencies) {
    this.db = db;
    this.agentDeps = agentDeps;
    // Periodic cleanup every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanupStale(), 5 * 60 * 1000);
  }

  /**
   * Start an async page generation.
   * Returns a generationId that can be polled for progress.
   */
  async startGeneration(
    input: PageGenerationRequest,
    template?: GenerationTemplate
  ): Promise<{ generationId: string }> {
    // Validate page belongs to organization
    const page = await this.db.page.findUnique({
      where: { id: input.pageId },
      include: { deal: { select: { organizationId: true } } },
    });
    if (!page) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Page not found' });
    }
    const pageOrgId = page.deal?.organizationId ?? page.organizationId;
    if (pageOrgId !== input.organizationId) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Page not found' });
    }

    // Validate deal if provided
    if (input.dealId) {
      const deal = await this.db.deal.findUnique({ where: { id: input.dealId } });
      if (!deal || deal.organizationId !== input.organizationId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
      }
    }

    const generationId = createId();

    // Initialize state
    this.generations.set(generationId, {
      events: [],
      blocks: [],
      databaseIdMap: {},
      isComplete: false,
      lastPolledIndex: 0,
      createdAt: Date.now(),
      abortController: new AbortController(),
    });

    // Run generation in background (don't await)
    this.runGeneration(generationId, input, template).catch((error) => {
      const state = this.generations.get(generationId);
      if (state) {
        state.events.push({
          type: 'error',
          message: error instanceof Error ? error.message : 'Generation failed',
        });
        state.isComplete = true;
      }
    });

    // Cleanup old generations
    this.cleanupStale();

    return { generationId };
  }

  /**
   * Poll for generation progress.
   * Returns events accumulated since the last poll.
   */
  getGenerationProgress(generationId: string): {
    events: PageGenerationEvent[];
    isComplete: boolean;
    databaseIdMap: Record<number, string>;
  } {
    const state = this.generations.get(generationId);
    if (!state) {
      return {
        events: [{ type: 'error', message: 'Generation not found' }],
        isComplete: true,
        databaseIdMap: {},
      };
    }

    // Return new events since last poll
    const newEvents = state.events.slice(state.lastPolledIndex);
    state.lastPolledIndex = state.events.length;

    return {
      events: newEvents,
      isComplete: state.isComplete,
      databaseIdMap: state.databaseIdMap,
    };
  }

  /**
   * Cancel an in-progress generation.
   */
  cancelGeneration(generationId: string): { success: boolean } {
    const state = this.generations.get(generationId);
    if (!state) {
      return { success: false };
    }
    state.abortController.abort();
    state.isComplete = true;
    state.events.push({
      type: 'error',
      message: 'Generation cancelled by user',
    });
    return { success: true };
  }

  /**
   * Clean up orphaned databases from a discarded generation.
   * Deletes pages (which cascade to Database and DatabaseEntry via relations).
   */
  async cleanupDatabases(databaseIds: string[], organizationId: string): Promise<{ deleted: number }> {
    if (databaseIds.length === 0) return { deleted: 0 };

    // Find databases owned by this organization
    const databases = await this.db.database.findMany({
      where: { id: { in: databaseIds }, organizationId },
      select: { id: true, pageId: true },
    });

    const pageIds = databases.map((d) => d.pageId);

    // Delete pages (cascades to Database and DatabaseEntry via relations)
    if (pageIds.length > 0) {
      await this.db.page.deleteMany({
        where: { id: { in: pageIds } },
      });
    }

    return { deleted: databases.length };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private async runGeneration(
    generationId: string,
    input: PageGenerationRequest,
    template?: GenerationTemplate
  ): Promise<void> {
    const state = this.generations.get(generationId);
    if (!state) return;

    const agent = new PageGenerationAgent({
      ...this.agentDeps,
      db: this.db,
      abortSignal: state.abortController.signal,
    });

    let globalBlockIndex = 0;

    for await (const event of agent.generatePage(input, template)) {
      // Check if cancelled
      if (state.isComplete) break;

      // Track complete blocks for database creation
      if (event.type === 'block') {
        state.blocks.push(event.block);

        // If this is a database block, create the real database
        if (event.block.type === 'database' && event.block.database && input.dealId) {
          try {
            const result = await createDatabaseFromGeneration({
              db: this.db,
              parentPageId: input.pageId,
              dealId: input.dealId,
              organizationId: input.organizationId,
              userId: input.userId,
              spec: event.block.database,
              order: globalBlockIndex,
            });

            state.databaseIdMap[globalBlockIndex] = result.databaseId;

            state.events.push({
              type: 'database_created',
              databaseId: result.databaseId,
              name: event.block.database.name,
              blockIndex: globalBlockIndex,
            });
          } catch (error) {
            state.events.push({
              type: 'error',
              message: `Failed to create database "${event.block.database.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        }

        globalBlockIndex++;
      }

      // Track block_end events for block index counting
      if (event.type === 'block_end') {
        globalBlockIndex++;
      }

      // Skip placeholder database_created events from the agent
      if (event.type === 'database_created') continue;

      // Pass through all events (including block_start, content_delta, block_end)
      state.events.push(event);

      if (event.type === 'complete' || event.type === 'error') {
        state.isComplete = true;
      }
    }

    if (!state.isComplete) {
      state.isComplete = true;
    }
  }

  private cleanupStale(): void {
    const now = Date.now();
    for (const [id, state] of this.generations) {
      if (state.isComplete && now - state.createdAt > GENERATION_TTL_MS) {
        this.generations.delete(id);
      }
    }
  }
}
