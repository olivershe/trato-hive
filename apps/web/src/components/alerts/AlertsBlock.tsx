"use client";

/**
 * AlertsBlock - AI Pipeline Alerts component
 *
 * [TASK-120] AI Alerts InboxBlock
 *
 * Collapsible alerts block showing urgent AI-generated alerts.
 * Displays at top of Pipeline page with dismiss/snooze actions.
 */

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileWarning,
  Bell,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

interface AlertConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  icon: AlertTriangle,
  color: "text-gray-600",
  bgColor: "bg-gray-100 dark:bg-gray-900/30",
};

const ALERT_CONFIG: Record<string, AlertConfig> = {
  STAGE_OVERDUE: {
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  DOCUMENT_PENDING: {
    icon: FileWarning,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  ACTION_REQUIRED: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  FOLLOW_UP_DUE: {
    icon: Bell,
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500 text-white",
  HIGH: "bg-orange text-white",
  MEDIUM: "bg-amber-500 text-white",
  LOW: "bg-gray-400 text-white",
};

const SNOOZE_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "4 hours", hours: 4 },
  { label: "1 day", hours: 24 },
  { label: "1 week", hours: 168 },
] as const;

function getAlertConfig(type: string): AlertConfig {
  return ALERT_CONFIG[type] || DEFAULT_ALERT_CONFIG;
}

export function AlertsBlock() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [snoozeOpenFor, setSnoozeOpenFor] = useState<string | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } = api.alerts.list.useQuery(
    { pageSize: 5 },
    { refetchInterval: 60000 }
  );

  const dismissMutation = api.alerts.dismiss.useMutation({
    onSuccess: () => utils.alerts.list.invalidate(),
  });

  const snoozeMutation = api.alerts.snooze.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      setSnoozeOpenFor(null);
    },
  });

  if (!isLoading && (!data || data.items.length === 0)) {
    return null;
  }

  const alertCount = data?.pagination.total || 0;
  const ExpandIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="mb-6 bg-white dark:bg-deep-grey border border-amber-200 dark:border-amber-900/30 rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-200 dark:bg-amber-800 rounded">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </div>
          <span className="text-sm font-semibold text-charcoal dark:text-cultured-white">
            Pipeline Alerts
          </span>
          {alertCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
              {alertCount}
            </span>
          )}
        </div>
        <ExpandIcon className="w-4 h-4 text-charcoal/50 dark:text-cultured-white/50" />
      </button>

      {isExpanded && (
        <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              <span className="ml-2 text-sm text-charcoal/60 dark:text-cultured-white/60">
                Loading alerts...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8 text-red-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Failed to load alerts</span>
            </div>
          )}

          {data?.items.map((alert) => {
            const config = getAlertConfig(alert.type);
            const Icon = config.icon;
            const isSnoozeOpen = snoozeOpenFor === alert.id;

            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-4 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors group"
              >
                <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 text-[10px] font-bold uppercase rounded",
                        PRIORITY_COLORS[alert.priority]
                      )}
                    >
                      {alert.priority}
                    </span>
                    <Link
                      href={`/deals/${alert.dealId}`}
                      className="text-sm font-medium text-charcoal dark:text-cultured-white hover:text-orange flex items-center gap-1"
                    >
                      {alert.dealName}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-sm text-charcoal/70 dark:text-cultured-white/70">
                    {alert.message}
                  </p>
                  <p className="text-xs text-charcoal/40 dark:text-cultured-white/40 mt-1">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={() => setSnoozeOpenFor(isSnoozeOpen ? null : alert.id)}
                      disabled={snoozeMutation.isPending}
                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-600 transition-colors"
                      title="Snooze"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                    {isSnoozeOpen && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-lg py-1 min-w-[120px]">
                        {SNOOZE_OPTIONS.map((option) => (
                          <button
                            key={option.hours}
                            onClick={() => snoozeMutation.mutate({ alertId: alert.id, hours: option.hours })}
                            className="w-full px-3 py-1.5 text-left text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => dismissMutation.mutate({ alertId: alert.id })}
                    disabled={dismissMutation.isPending}
                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {data?.pagination.hasMore && (
            <div className="px-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 text-center">
              <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                +{data.pagination.total - data.items.length} more alerts
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AlertsBlock;
