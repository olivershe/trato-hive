'use client';

import { useState, useEffect, useCallback } from 'react';

declare global {
  interface WindowEventMap {
    'ai:generate-page': CustomEvent;
  }
}

export function useAIGenerateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('ai:generate-page', handler);
    return () => window.removeEventListener('ai:generate-page', handler);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, close };
}
