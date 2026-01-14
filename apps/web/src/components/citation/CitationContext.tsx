"use client";

/**
 * CitationContext - State Management for Citation Sidebar
 *
 * Manages the state for opening/closing the citation sidebar and
 * tracking which citation is currently being viewed.
 *
 * Part of Phase 1: Citation Core
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { InlineCitationAttrs } from "../editor/extensions/InlineCitationMark";

interface CitationContextType {
  isOpen: boolean;
  citation: InlineCitationAttrs | null;
  openCitation: (citation: InlineCitationAttrs) => void;
  closeCitation: () => void;
}

const CitationContext = createContext<CitationContextType | null>(null);

export function CitationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [citation, setCitation] = useState<InlineCitationAttrs | null>(null);

  const openCitation = useCallback((attrs: InlineCitationAttrs) => {
    setCitation(attrs);
    setIsOpen(true);
  }, []);

  const closeCitation = useCallback(() => {
    setIsOpen(false);
    // Delay clearing citation to allow exit animation
    setTimeout(() => setCitation(null), 300);
  }, []);

  return (
    <CitationContext.Provider
      value={{ isOpen, citation, openCitation, closeCitation }}
    >
      {children}
    </CitationContext.Provider>
  );
}

export function useCitation() {
  const ctx = useContext(CitationContext);
  if (!ctx) {
    throw new Error("useCitation must be used within CitationProvider");
  }
  return ctx;
}
