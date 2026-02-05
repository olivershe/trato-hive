/**
 * Copilot UI Block Types
 *
 * Type definitions for interactive UI blocks rendered inline
 * in Hive Copilot conversations. Tools return a `ui` field that
 * the frontend uses to render rich React components.
 */

/** Supported block component names (registry keys) */
export type CopilotBlockComponent =
  | 'deal-search-results'
  | 'deal-summary-card'
  | 'deal-mutation-confirmation'
  | 'knowledge-results';

/** Layout modes for UI blocks */
export type CopilotBlockLayout = 'inline' | 'full-width';

/**
 * UIBlock — serializable descriptor for an interactive component
 * rendered inline in the Copilot chat.
 *
 * Stored in CoworkerConversation.messages JSONB alongside text.
 */
export interface UIBlock {
  /** Registry key mapping to a lazy-loaded React component */
  component: CopilotBlockComponent;
  /** Serializable props passed to the component */
  props: Record<string, unknown>;
  /** Optional initial state for interactive blocks */
  initialState?: Record<string, unknown>;
  /** Layout mode — inline (default) or full-width */
  layout?: CopilotBlockLayout;
}
