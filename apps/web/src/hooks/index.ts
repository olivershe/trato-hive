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
