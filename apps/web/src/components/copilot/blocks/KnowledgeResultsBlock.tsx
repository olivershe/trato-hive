/**
 * KnowledgeResultsBlock
 *
 * Expandable knowledge search results with relevance scores,
 * content snippets, and citation-colored source markers.
 * Rendered inline in Copilot chat.
 */
'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, FileText, MessageSquare } from 'lucide-react';
import type { CopilotBlockProps } from './CopilotBlockRenderer';

interface KnowledgeResult {
  content: string;
  source: string;
  score: number;
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-orange/20 text-charcoal rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function RelevanceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 rounded-full bg-charcoal/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 80 ? '#22c55e' : pct >= 50 ? '#fbbf24' : '#ef4444',
          }}
        />
      </div>
      <span className="text-[10px] text-charcoal/40 tabular-nums">{pct}%</span>
    </div>
  );
}

function ResultCard({
  result,
  index,
  query,
  onFollowUp,
}: {
  result: KnowledgeResult;
  index: number;
  query: string;
  onFollowUp?: (content: string) => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  const truncated =
    result.content.length > 200 && !expanded
      ? result.content.slice(0, 200) + '...'
      : result.content;

  return (
    <div className="border border-gold/10 rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-alabaster/60 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-charcoal/40 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-charcoal/40 flex-shrink-0" />
        )}

        {/* Citation marker — Teal Blue per design rules */}
        <span className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: '#2F7E8A' }}>
          {index + 1}
        </span>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <FileText className="w-3 h-3 text-charcoal/30 flex-shrink-0" />
          <span className="text-xs font-medium text-charcoal/70 truncate">
            {result.source}
          </span>
        </div>

        <RelevanceBar score={result.score} />
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="pl-[3.25rem]">
            <p className="text-xs leading-relaxed text-charcoal/70">
              {highlightQuery(truncated, query)}
            </p>

            {result.content.length > 200 && (
              <button
                onClick={toggle}
                className="mt-1 text-[10px] font-medium text-orange hover:text-orange/80 transition-colors"
              >
                {expanded && result.content.length > 200 ? 'Show less' : 'Show more'}
              </button>
            )}

            {onFollowUp && (
              <button
                onClick={() => onFollowUp(result.content)}
                className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-charcoal/50 hover:text-charcoal hover:bg-alabaster transition-colors"
              >
                <MessageSquare className="w-2.5 h-2.5" />
                Ask follow-up
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeResultsBlock({
  props,
  onAction,
  isHistorical,
}: CopilotBlockProps) {
  const query = props.query as string;
  const results = (props.results ?? []) as KnowledgeResult[];

  const handleFollowUp = useCallback(
    (content: string) => {
      if (!onAction) return;
      const snippet = content.slice(0, 80);
      onAction(`Tell me more about: "${snippet}..."`);
    },
    [onAction]
  );

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-gold/10 bg-white px-4 py-6 text-center">
        <FileText className="w-5 h-5 mx-auto mb-2 text-charcoal/30" />
        <p className="text-sm text-charcoal/50">
          No knowledge results for &ldquo;{query}&rdquo;
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/10 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-alabaster">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-charcoal/40" />
          <span className="text-xs font-medium text-charcoal/60">
            {results.length} source{results.length !== 1 ? 's' : ''} found
          </span>
        </div>
        {isHistorical && (
          <span className="text-[10px] font-medium text-charcoal/30 uppercase tracking-wider">
            Snapshot
          </span>
        )}
      </div>

      {/* Results */}
      <div className="p-3 space-y-2">
        {results.map((result, i) => (
          <ResultCard
            key={i}
            result={result}
            index={i}
            query={query}
            onFollowUp={onAction ? handleFollowUp : undefined}
          />
        ))}
      </div>
    </div>
  );
}
