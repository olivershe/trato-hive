/**
 * Copilot Block Registry
 *
 * Maps component names to lazy-loaded React components.
 * Each block is a separate chunk loaded on demand.
 */
import { lazy, type ComponentType } from 'react';
import type { CopilotBlockProps } from './CopilotBlockRenderer';

const BLOCK_REGISTRY: Record<string, () => Promise<{ default: ComponentType<CopilotBlockProps> }>> = {
  'deal-search-results': () => import('./DealSearchResultsBlock'),
  'deal-summary-card': () => import('./DealSummaryCardBlock'),
  'deal-mutation-confirmation': () => import('./DealMutationConfirmationBlock'),
  'knowledge-results': () => import('./KnowledgeResultsBlock'),
};

/**
 * Get a lazy-loaded block component by registry key.
 * Returns null for unknown components (graceful fallback).
 */
export function getBlockComponent(name: string): ComponentType<CopilotBlockProps> | null {
  const loader = BLOCK_REGISTRY[name];
  if (!loader) return null;
  return lazy(loader);
}
