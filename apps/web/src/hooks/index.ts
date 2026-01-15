/**
 * Hooks Index
 *
 * Central export for all custom React hooks.
 */

// Block editing
export { useBlockSync, type SaveStatus } from "./useBlockSync";

// Keyboard shortcuts
export { useKeyboardShortcuts } from "./useKeyboardShortcuts";

// Document processing (Phase 2)
export {
  useDocumentProcessingStream,
  type DocumentStatus,
  type ExtractedFact,
  type UseDocumentProcessingStreamResult,
} from "./useDocumentProcessingStream";

// Recent tracking (Phase 11)
export {
  useRecentTracker,
  useTrackRecentVisit,
  type RecentTrackerOptions,
} from "./useRecentTracker";

// Active page expansion (Phase 11)
export {
  useActivePageExpansion,
  useIsExpanded,
  useToggleExpanded,
} from "./useActivePageExpansion";

// Sidebar database sync (Phase 11)
export { useSidebarSync } from "./useSidebarSync";

// Command palette (Phase 11.3)
export { useCommandPalette } from "./useCommandPalette";

// Page context detection (Phase 11.3)
export {
  usePageContext,
  type PageContext,
  type PageContextType,
} from "./usePageContext";
