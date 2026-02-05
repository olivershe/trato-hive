/**
 * DealSearchResultsBlock
 *
 * Interactive table of deal search results rendered inline in Copilot chat.
 * Sortable columns, stage badges, and click-to-drill-down.
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import type { CopilotBlockProps } from './CopilotBlockRenderer';

interface DealResult {
  id: string;
  name: string;
  stage: string;
  value?: string | null;
  probability?: number | null;
  company?: { id: string; name: string } | null;
}

const STAGE_BADGE: Record<string, { label: string; className: string }> = {
  SOURCING: { label: 'Sourcing', className: 'bg-blue-100 text-blue-800' },
  INITIAL_REVIEW: { label: 'Initial Review', className: 'bg-violet-100 text-violet-800' },
  PRELIMINARY_DUE_DILIGENCE: { label: 'Preliminary DD', className: 'bg-pink-100 text-pink-800' },
  DEEP_DUE_DILIGENCE: { label: 'Deep DD', className: 'bg-orange-100 text-orange-800' },
  NEGOTIATION: { label: 'Negotiation', className: 'bg-amber-100 text-amber-800' },
  CLOSING: { label: 'Closing', className: 'bg-emerald-100 text-emerald-800' },
  CLOSED_WON: { label: 'Closed Won', className: 'bg-green-100 text-green-800' },
  CLOSED_LOST: { label: 'Closed Lost', className: 'bg-red-100 text-red-800' },
};

type SortKey = 'name' | 'stage' | 'value' | 'probability';
type SortDir = 'asc' | 'desc';

function formatCurrency(value: string | null | undefined): string {
  if (!value) return '-';
  const num = Number(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

function StageBadge({ stage }: { stage: string }) {
  const badge = STAGE_BADGE[stage] ?? { label: stage, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 text-charcoal/30" />;
  return direction === 'asc'
    ? <ArrowUp className="w-3 h-3 text-orange" />
    : <ArrowDown className="w-3 h-3 text-orange" />;
}

export default function DealSearchResultsBlock({
  props,
  onAction,
  isHistorical,
}: CopilotBlockProps) {
  const query = props.query as string;
  const deals = (props.deals ?? []) as DealResult[];
  const totalCount = (props.totalCount ?? deals.length) as number;

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((key: SortKey) => {
    setSortDir((prev) => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(key);
  }, [sortKey]);

  const sorted = useMemo(() => {
    const copy = [...deals];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'stage':
          cmp = a.stage.localeCompare(b.stage);
          break;
        case 'value':
          cmp = (Number(a.value) || 0) - (Number(b.value) || 0);
          break;
        case 'probability':
          cmp = (a.probability ?? 0) - (b.probability ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [deals, sortKey, sortDir]);

  const handleRowClick = (deal: DealResult) => {
    if (!onAction) return;
    onAction(`Show me details for deal "${deal.name}"`, { dealId: deal.id });
  };

  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-gold/10 bg-white px-4 py-6 text-center">
        <Search className="w-5 h-5 mx-auto mb-2 text-charcoal/30" />
        <p className="text-sm text-charcoal/50">No deals found for &ldquo;{query}&rdquo;</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gold/10 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-alabaster">
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-charcoal/40" />
          <span className="text-xs font-medium text-charcoal/60">
            {totalCount} deal{totalCount !== 1 ? 's' : ''} found
          </span>
        </div>
        {isHistorical && (
          <span className="text-[10px] font-medium text-charcoal/30 uppercase tracking-wider">
            Snapshot
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/10">
              {([
                ['name', 'Deal Name'],
                ['stage', 'Stage'],
                ['value', 'Value'],
                ['probability', 'Prob.'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  className="px-4 py-2.5 text-left text-xs font-medium text-charcoal/50 cursor-pointer hover:text-charcoal transition-colors select-none"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <SortIcon active={sortKey === key} direction={sortDir} />
                  </div>
                </th>
              ))}
              <th className="px-4 py-2.5 text-left text-xs font-medium text-charcoal/50">
                Company
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((deal) => (
              <tr
                key={deal.id}
                className="border-b border-gold/5 last:border-0 hover:bg-alabaster/60 transition-colors cursor-pointer group"
                onClick={() => handleRowClick(deal)}
              >
                <td className="px-4 py-2.5">
                  <span className="font-medium text-charcoal group-hover:text-orange transition-colors">
                    {deal.name}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <StageBadge stage={deal.stage} />
                </td>
                <td className="px-4 py-2.5 text-charcoal/70 tabular-nums">
                  {formatCurrency(deal.value)}
                </td>
                <td className="px-4 py-2.5">
                  {deal.probability != null ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-charcoal/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-orange transition-all"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-charcoal/50 tabular-nums">
                        {deal.probability}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-charcoal/30">-</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-charcoal/60 text-xs">
                  {deal.company?.name ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
