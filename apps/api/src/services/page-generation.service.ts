/**
 * Page Generation Service
 *
 * [TASK-144] Orchestrates between GeneratorAgent and database creation.
 * Uses in-memory state for generation progress (polling-based streaming).
 */
import type { PrismaClient } from '@trato-hive/db';
import type {
  PageGenerationRequest,
  GeneratedBlock,
  GenerationTemplate,
} from '@trato-hive/ai-core';
import type { PageGenerationEvent } from '@trato-hive/ai-core';
import {
  type GeneratorAgentDependencies,
  GeneratorAgent,
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
}

// TTL for completed generations (10 minutes)
const GENERATION_TTL_MS = 10 * 60 * 1000;

// =============================================================================
// Service
// =============================================================================

export class PageGenerationService {
  private generations = new Map<string, GenerationState>();
  private readonly db: PrismaClient;
  private readonly agentDeps: GeneratorAgentDependencies;

  constructor(db: PrismaClient, agentDeps: GeneratorAgentDependencies) {
    this.db = db;
    this.agentDeps = agentDeps;
  }

  /**
   * Start an async page generation.
   * Returns a generationId that can be polled for progress.
   */
  async startGeneration(
    input: PageGenerationRequest,
    template?: GenerationTemplate
  ): Promise<{ generationId: string }> {
    const generationId = createId();

    // Initialize state
    this.generations.set(generationId, {
      events: [],
      blocks: [],
      databaseIdMap: {},
      isComplete: false,
      lastPolledIndex: 0,
      createdAt: Date.now(),
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
    state.isComplete = true;
    state.events.push({
      type: 'error',
      message: 'Generation cancelled by user',
    });
    return { success: true };
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

    const agent = new GeneratorAgent({
      ...this.agentDeps,
      db: this.db,
    });

    let globalBlockIndex = 0;

    for await (const event of agent.generatePage(input, template)) {
      // Check if cancelled
      if (state.isComplete) break;

      // Track blocks for database creation
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

            // Emit a database_created event with real ID
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

      // Skip the placeholder database_created events from the agent
      if (event.type === 'database_created') continue;

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
