/**
 * DealSummaryCardBlock
 *
 * Rich card showing deal summary: stage, value, probability, company,
 * recent documents, and recent activity. Rendered inline in Copilot chat.
 */
'use client';

import React from 'react';
import {
  Building2,
  FileText,
  ExternalLink,
  Clock,
  MessageSquare,
} from 'lucide-react';
import type { CopilotBlockProps } from './CopilotBlockRenderer';

interface DocumentItem {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface DealSummary {
  id: string;
  name: string;
  stage: string;
  probability?: number | null;
  value?: string | null;
  company?: { id: string; name: string } | null;
  recentDocuments?: DocumentItem[];
  recentActivity?: ActivityItem[];
  createdAt?: string;
  updatedAt?: string;
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

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StageBadge({ stage }: { stage: string }) {
  const badge = STAGE_BADGE[stage] ?? { label: stage, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.label}
    </span>
  );
}

export default function DealSummaryCardBlock({
  props,
  onAction,
  isHistorical,
}: CopilotBlockProps) {
  const summary = (props.summary ?? props) as DealSummary;

  const handleOpenDeal = () => {
    if (typeof window !== 'undefined' && summary.id) {
      window.open(`/deals/${summary.id}`, '_blank');
    }
  };

  const handleAskAbout = () => {
    if (!onAction) return;
    onAction(`Tell me more about deal "${summary.name}"`, { dealId: summary.id });
  };

  return (
    <div className="rounded-xl border border-gold/10 bg-white overflow-hidden">
      {/* Header with accent top border */}
      <div className="border-t-4 border-orange px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-charcoal truncate">
              {summary.name}
            </h3>
            {summary.company && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-charcoal/60">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{summary.company.name}</span>
              </div>
            )}
          </div>
          <StageBadge stage={summary.stage} />
        </div>

        {isHistorical && (
          <span className="inline-block mt-2 text-[10px] font-medium text-charcoal/30 uppercase tracking-wider">
            Snapshot
          </span>
        )}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-px bg-gold/10">
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-0.5">
            Value
          </p>
          <p className="text-lg font-semibold text-charcoal tabular-nums">
            {formatCurrency(summary.value)}
          </p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-0.5">
            Probability
          </p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-charcoal tabular-nums">
              {summary.probability != null ? `${summary.probability}%` : '-'}
            </p>
            {summary.probability != null && (
              <div className="flex-1 h-2 rounded-full bg-charcoal/10 overflow-hidden max-w-[80px]">
                <div
                  className="h-full rounded-full bg-orange transition-all"
                  style={{ width: `${summary.probability}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      {summary.recentDocuments && summary.recentDocuments.length > 0 && (
        <div className="px-4 py-3 border-t border-gold/10">
          <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">
            Recent Documents
          </p>
          <div className="space-y-1.5">
            {summary.recentDocuments.slice(0, 3).map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-xs">
                <FileText className="w-3 h-3 text-charcoal/30 flex-shrink-0" />
                <span className="truncate text-charcoal/70">{doc.name}</span>
                <span className="text-charcoal/30 flex-shrink-0">
                  {formatRelativeTime(doc.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {summary.recentActivity && summary.recentActivity.length > 0 && (
        <div className="px-4 py-3 border-t border-gold/10">
          <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">
            Recent Activity
          </p>
          <div className="space-y-2">
            {summary.recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 text-xs">
                <div className="w-1 h-1 rounded-full bg-orange mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-charcoal/70 truncate">{activity.description}</p>
                  <p className="text-charcoal/30 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gold/10 bg-alabaster">
        <button
          onClick={handleOpenDeal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-charcoal text-white hover:bg-charcoal/90 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open Deal
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
