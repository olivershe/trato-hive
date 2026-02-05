/**
 * CopilotBlockRenderer
 *
 * Suspense wrapper that resolves a block component from the registry
 * and renders it with a skeleton fallback. Unknown components render
 * a subtle fallback instead of crashing.
 */
'use client';

import React, { Suspense, useMemo } from 'react';
import { getBlockComponent } from './registry';

export interface CopilotBlockProps {
  props: Record<string, unknown>;
  initialState?: Record<string, unknown>;
  onAction?: (message: string, context?: Record<string, unknown>) => void;
  isHistorical?: boolean;
}

interface CopilotBlockRendererProps {
  component: string;
  props: Record<string, unknown>;
  initialState?: Record<string, unknown>;
  layout?: 'inline' | 'full-width';
  onAction?: (message: string, context?: Record<string, unknown>) => void;
  isHistorical?: boolean;
}

function BlockSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gold/10 bg-white p-4">
      <div className="h-4 w-1/3 rounded bg-charcoal/10 mb-3" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-charcoal/5" />
        <div className="h-3 w-5/6 rounded bg-charcoal/5" />
        <div className="h-3 w-2/3 rounded bg-charcoal/5" />
      </div>
    </div>
  );
}

function UnknownBlock({ component }: { component: string }) {
  return (
    <div className="rounded-xl border border-gold/10 bg-alabaster px-4 py-3 text-xs text-charcoal/40">
      Unknown block: {component}
    </div>
  );
}

export function CopilotBlockRenderer({
  component,
  props,
  initialState,
  layout,
  onAction,
  isHistorical,
}: CopilotBlockRendererProps) {
  const BlockComponent = useMemo(() => getBlockComponent(component), [component]);

  if (!BlockComponent) {
    return <UnknownBlock component={component} />;
  }

  return (
    <div className={layout === 'full-width' ? 'w-full' : 'max-w-md'}>
      <Suspense fallback={<BlockSkeleton />}>
        <BlockComponent
          props={props}
          initialState={initialState}
          onAction={onAction}
          isHistorical={isHistorical}
        />
      </Suspense>
    </div>
  );
}
