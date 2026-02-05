'use client';

import React from 'react';
import { FileText, Database, ExternalLink } from 'lucide-react';
import type { CopilotBlockProps } from './CopilotBlockRenderer';

interface PageGenerationProps {
  pageTitle: string;
  pageId: string;
  dealId: string;
  sectionsGenerated: number;
  databasesCreated: number;
}

export default function PageGenerationBlock({
  props,
  onAction,
}: CopilotBlockProps) {
  const {
    pageTitle,
    pageId,
    dealId,
    sectionsGenerated,
    databasesCreated,
  } = props as unknown as PageGenerationProps;

  return (
    <div className="rounded-xl border border-gold/10 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-orange/5 border-b border-gold/10">
        <FileText className="w-4 h-4 text-orange" />
        <span className="text-sm font-medium text-charcoal">
          Page Generated
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-charcoal mb-2">
          {pageTitle || 'Untitled Page'}
        </p>

        <div className="flex items-center gap-4 text-xs text-charcoal/50">
          <span>{sectionsGenerated} sections</span>
          {databasesCreated > 0 && (
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {databasesCreated} database{databasesCreated !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="px-4 py-2 border-t border-gold/10 bg-charcoal/[0.02]">
        <button
          onClick={() => {
            if (onAction) {
              onAction('navigate', { dealId, pageId });
            }
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-orange hover:text-orange/80 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open Page
        </button>
      </div>
    </div>
  );
}
