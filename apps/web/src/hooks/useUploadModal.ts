"use client";

import { useState, useEffect, useCallback } from "react";

// Custom event type for vault:upload
interface VaultUploadEventDetail {
  dealId?: string;
}

// Extend WindowEventMap for type-safe custom event listeners
declare global {
  interface WindowEventMap {
    "vault:upload": CustomEvent<VaultUploadEventDetail>;
  }
}

interface UseUploadModalOptions {
  dealId?: string | null;
}

/**
 * Hook to manage the vault upload modal state.
 * Listens for the `vault:upload` custom event triggered by the /upload slash command.
 */
export function useUploadModal(options: UseUploadModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetDealId, setTargetDealId] = useState<string | null>(
    options.dealId || null
  );

  // Update dealId when options change
  useEffect(() => {
    if (options.dealId) {
      setTargetDealId(options.dealId);
    }
  }, [options.dealId]);

  // Listen for the vault:upload event from slash command
  useEffect(() => {
    const handleUploadEvent = (event: CustomEvent<VaultUploadEventDetail>) => {
      const eventDealId = event.detail?.dealId;
      if (eventDealId) {
        setTargetDealId(eventDealId);
      }
      setIsOpen(true);
    };

    window.addEventListener("vault:upload", handleUploadEvent);

    return () => {
      window.removeEventListener("vault:upload", handleUploadEvent);
    };
  }, []);

  const open = useCallback((dealId?: string) => {
    if (dealId) {
      setTargetDealId(dealId);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    dealId: targetDealId,
    open,
    close,
    setDealId: setTargetDealId,
  };
}
