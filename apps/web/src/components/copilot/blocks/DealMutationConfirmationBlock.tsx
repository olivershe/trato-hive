/**
 * DealMutationConfirmationBlock
 *
 * Confirmation card rendered after a deal is created or updated.
 * Shows what changed (before → after) for updates, or the new deal
 * details for creates. Provides quick actions to view the deal or
 * ask follow-up questions.
 */
'use client';

import React from 'react';
import { CheckCircle2, Plus, ExternalLink, MessageSquare, ArrowRight } from 'lucide-react';
import type { CopilotBlockProps } from './CopilotBlockRenderer';

interface FieldChange {
  field: string;
  from: string | number | null;
  to: string | number | null;
}

interface MutationProps {
  type: 'created' | 'updated';
  deal: {
    id: string;
    name: string;
    stage: string;
    probability?: number | null;
    value?: string | null;
    companyId?: string | null;
    companyName?: string | null;
  };
  changes?: FieldChange[];
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

const FIELD_LABELS: Record<string, string> = {
  stage: 'Stage',
  probability: 'Probability',
  value: 'Value',
  notes: 'Notes',
};

function formatFieldValue(field: string, value: string | number | null): string {
  if (value == null) return '-';

  if (field === 'stage') {
    return STAGE_BADGE[String(value)]?.label ?? String(value);
  }
  if (field === 'probability') {
    return `${value}%`;
  }
  if (field === 'value') {
    const num = Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(num);
    }
  }
  if (field === 'notes' && typeof value === 'string' && value.length > 60) {
    return value.slice(0, 60) + '...';
  }
  return String(value);
}

function StageBadge({ stage }: { stage: string }) {
  const badge = STAGE_BADGE[stage] ?? { label: stage, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function ChangeRow({ change }: { change: FieldChange }) {
  const label = FIELD_LABELS[change.field] ?? change.field;
  const isStageChange = change.field === 'stage';

  return (
    <div className="flex items-center gap-2 py-1.5 text-xs">
      <span className="font-medium text-charcoal/60 w-20 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {isStageChange && change.from ? (
          <StageBadge stage={String(change.from)} />
        ) : (
          <span className="text-charcoal/40">{formatFieldValue(change.field, change.from)}</span>
        )}
        <ArrowRight className="w-3 h-3 text-charcoal/30 flex-shrink-0" />
        {isStageChange && change.to ? (
          <StageBadge stage={String(change.to)} />
        ) : (
          <span className="font-medium text-charcoal">{formatFieldValue(change.field, change.to)}</span>
        )}
      </div>
    </div>
  );
}

export default function DealMutationConfirmationBlock({
  props,
  onAction,
  isHistorical,
}: CopilotBlockProps) {
  const { type, deal, changes } = props as unknown as MutationProps;
  const isCreate = type === 'created';

  const handleViewDeal = () => {
    if (typeof window !== 'undefined' && deal.id) {
      window.open(`/deals/${deal.id}`, '_blank');
    }
  };

  const handleAskAbout = () => {
    if (!onAction) return;
    onAction(`Tell me more about deal "${deal.name}"`, { dealId: deal.id });
  };

  return (
    <div className="rounded-xl border border-gold/10 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold/10 bg-alabaster">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCreate ? 'bg-emerald-100' : 'bg-blue-100'
        }`}>
          {isCreate ? (
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-charcoal">
            {isCreate ? 'Deal Created' : 'Deal Updated'}
          </p>
          <p className="text-xs text-charcoal/50 truncate">{deal.name}</p>
        </div>
        {isHistorical && (
          <span className="text-[10px] font-medium text-charcoal/30 uppercase tracking-wider flex-shrink-0">
            Snapshot
          </span>
        )}
      </div>

      {/* Changes (for updates) */}
      {!isCreate && changes && changes.length > 0 && (
        <div className="px-4 py-3 border-b border-gold/10">
          {changes.map((change, i) => (
            <ChangeRow key={i} change={change} />
          ))}
        </div>
      )}

      {/* Deal summary (for creates) */}
      {isCreate && (
        <div className="px-4 py-3 border-b border-gold/10">
          <div className="flex items-center gap-2 py-1 text-xs">
            <span className="font-medium text-charcoal/60 w-20 flex-shrink-0">Stage</span>
            <StageBadge stage={deal.stage} />
          </div>
          {deal.value && (
            <div className="flex items-center gap-2 py-1 text-xs">
              <span className="font-medium text-charcoal/60 w-20 flex-shrink-0">Value</span>
              <span className="text-charcoal">{formatFieldValue('value', deal.value)}</span>
            </div>
          )}
          {deal.companyName && (
            <div className="flex items-center gap-2 py-1 text-xs">
              <span className="font-medium text-charcoal/60 w-20 flex-shrink-0">Company</span>
              <span className="text-charcoal">{deal.companyName}</span>
            </div>
          )}
        </div>
      )}

      {/* Current state row (for updates — show resulting state) */}
      {!isCreate && (
        <div className="px-4 py-2.5 border-b border-gold/10 flex items-center gap-3 text-xs">
          <StageBadge stage={deal.stage} />
          {deal.value && (
            <span className="text-charcoal/70 tabular-nums">
              {formatFieldValue('value', deal.value)}
            </span>
          )}
          {deal.probability != null && (
            <div className="flex items-center gap-1.5">
              <div className="w-10 h-1.5 rounded-full bg-charcoal/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange transition-all"
                  style={{ width: `${deal.probability}%` }}
                />
              </div>
              <span className="text-charcoal/50 tabular-nums">{deal.probability}%</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 bg-alabaster">
        <button
          onClick={handleViewDeal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-charcoal text-white hover:bg-charcoal/90 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          View Deal
        </button>
        <button
          onClick={handleAskAbout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gold/20 text-charcoal/70 hover:text-charcoal hover:border-gold/40 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Ask about this deal
        </button>
      </div>
    </div>
  );
}
