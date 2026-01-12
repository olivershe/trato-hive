/**
 * useKeyboardShortcuts
 *
 * Hook for handling global keyboard shortcuts in the deals workspace.
 */
import { useEffect, useCallback } from "react";

interface KeyboardShortcutHandlers {
  onNewPage?: () => void;
  onQuickSearch?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + N: New page
      if (isMod && e.key === "n") {
        e.preventDefault();
        handlers.onNewPage?.();
      }

      // Cmd/Ctrl + K: Quick search
      if (isMod && e.key === "k") {
        e.preventDefault();
        handlers.onQuickSearch?.();
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
