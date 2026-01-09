/**
 * InboxBlock - Tiptap extension for activity inbox
 *
 * Displays recent activities with actionable dismiss/mark-read functionality.
 * Fetches data from the dashboard.recentActivities tRPC endpoint.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback } from "react";
import {
  Inbox,
  FileText,
  ArrowRightCircle,
  MessageSquare,
  CheckCircle2,
  Users,
  Sparkles,
  X,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  Clock,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface InboxAttributes {
  hoursBack: number;
  pageSize: number;
  showDismissed: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inboxBlock: {
      setInboxBlock: (attrs?: Partial<InboxAttributes>) => ReturnType;
    };
  }
}

// Activity type icons and colors
const ACTIVITY_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  DOCUMENT_UPLOADED: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    label: "Document",
  },
  DOCUMENT_PROCESSED: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Processed",
  },
  DEAL_CREATED: {
    icon: Sparkles,
    color: "text-gold",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    label: "New Deal",
  },
  DEAL_STAGE_CHANGED: {
    icon: ArrowRightCircle,
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
    label: "Stage Change",
  },
  COMPANY_ADDED: {
    icon: Users,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    label: "Company",
  },
  AI_QUERY: {
    icon: MessageSquare,
    color: "text-pink-600",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    label: "AI Query",
  },
  USER_ACTION: {
    icon: CheckCircle2,
    color: "text-gray-600",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    label: "Action",
  },
  AI_SUGGESTION_ACCEPTED: {
    icon: Check,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "Accepted",
  },
  AI_SUGGESTION_DISMISSED: {
    icon: X,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    label: "Dismissed",
  },
};

// =============================================================================
// Node Extension
// =============================================================================

export const InboxBlock = Node.create({
  name: "inboxBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      hoursBack: { default: 48 },
      pageSize: { default: 10 },
      showDismissed: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: "inbox-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["inbox-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InboxCard);
  },

  addCommands() {
    return {
      setInboxBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "inboxBlock",
            attrs: {
              hoursBack: 48,
              pageSize: 10,
              showDismissed: false,
              ...attrs,
            },
          });
        },
    };
  },
});

// =============================================================================
// React Component
// =============================================================================

function InboxCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as InboxAttributes;
  const { hoursBack, pageSize, showDismissed } = attrs;
  const [page, setPage] = useState(1);

  const utils = api.useUtils();

  // Fetch activities
  const { data, isLoading, error } = api.dashboard.recentActivities.useQuery(
    {
      page,
      pageSize,
      hoursBack,
      excludeDismissed: !showDismissed,
    },
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Mutation for updating activity status
  const updateStatusMutation = api.dashboard.updateActivityStatus.useMutation({
    onSuccess: () => {
      // Invalidate the query to refetch
      utils.dashboard.recentActivities.invalidate();
    },
  });

  const handleDismiss = useCallback(
    (activityId: string) => {
      updateStatusMutation.mutate({ activityId, status: "DISMISSED" });
    },
    [updateStatusMutation]
  );

  const handleMarkRead = useCallback(
    (activityId: string) => {
      updateStatusMutation.mutate({ activityId, status: "READ" });
    },
    [updateStatusMutation]
  );

  const handleToggleShowDismissed = useCallback(() => {
    updateAttributes({ showDismissed: !showDismissed });
    setPage(1); // Reset to first page
  }, [showDismissed, updateAttributes]);

  const handleLoadMore = useCallback(() => {
    if (data?.pagination.hasMore) {
      setPage((p) => p + 1);
    }
  }, [data?.pagination.hasMore]);

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange/10 rounded">
              <Inbox className="w-4 h-4 text-orange" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
              Recent Activity
            </h3>
            {data && (
              <span className="text-xs text-charcoal/50 dark:text-cultured-white/50">
                ({data.pagination.total} items)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showDismissed}
                onChange={handleToggleShowDismissed}
                className="rounded border-charcoal/30 text-orange focus:ring-orange w-3 h-3"
              />
              <span className="text-charcoal/60 dark:text-cultured-white/60">
                Show dismissed
              </span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-bone dark:divide-charcoal/30">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange" />
              <span className="ml-2 text-sm text-charcoal/60 dark:text-cultured-white/60">
                Loading activities...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Failed to load activities</span>
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-charcoal/50 dark:text-cultured-white/50">
              <Inbox className="w-10 h-10 mb-2 opacity-30" />
              <span className="text-sm">No recent activity</span>
              <span className="text-xs mt-1">
                Activities from the last {hoursBack} hours will appear here
              </span>
            </div>
          )}

          {data &&
            data.items.map((activity) => {
              const config = ACTIVITY_CONFIG[activity.type] || {
                icon: CheckCircle2,
                color: "text-gray-600",
                bgColor: "bg-gray-100 dark:bg-gray-900/30",
                label: activity.type,
              };
              const Icon = config.icon;
              const isRead = activity.status === "READ";
              const isDismissed = activity.status === "DISMISSED";

              return (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-4 transition-colors group ${
                    isDismissed
                      ? "bg-gray-50 dark:bg-charcoal/10 opacity-60"
                      : isRead
                        ? "bg-white dark:bg-deep-grey"
                        : "bg-amber-50/30 dark:bg-amber-900/10"
                  }`}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-charcoal dark:text-cultured-white">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.bgColor} ${config.color}`}
                          >
                            {config.label}
                          </span>
                          {activity.deal && (
                            <a
                              href={`/deals/${activity.deal.id}`}
                              className="text-xs text-charcoal/50 dark:text-cultured-white/50 hover:text-orange flex items-center gap-1"
                            >
                              {activity.deal.name}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {activity.user && (
                            <span className="text-xs text-charcoal/40 dark:text-cultured-white/40">
                              by {activity.user.name || activity.user.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-xs text-charcoal/40 dark:text-cultured-white/40 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isDismissed && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isRead && (
                        <button
                          onClick={() => handleMarkRead(activity.id)}
                          disabled={updateStatusMutation.isPending}
                          className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded text-emerald-600 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(activity.id)}
                        disabled={updateStatusMutation.isPending}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Load More */}
        {data?.pagination.hasMore && (
          <div className="px-4 py-3 border-t border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
            <button
              onClick={handleLoadMore}
              className="w-full py-2 text-sm text-charcoal/60 dark:text-cultured-white/60 hover:text-charcoal dark:hover:text-cultured-white flex items-center justify-center gap-1 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
              Load more ({data.pagination.total - data.items.length} remaining)
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export default InboxBlock;
