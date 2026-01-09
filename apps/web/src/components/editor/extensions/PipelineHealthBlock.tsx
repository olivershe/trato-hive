/**
 * PipelineHealthBlock - Tiptap extension for pipeline health metrics
 *
 * Displays a chart of pipeline stage metrics using Recharts.
 * Fetches data from the dashboard.pipelineHealth tRPC endpoint.
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from "@tiptap/react";
import { useState, useCallback } from "react";
import { BarChart3, Settings, Loader2, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api } from "@/trpc/react";

// =============================================================================
// Types
// =============================================================================

export interface PipelineHealthAttributes {
  includeClosedDeals: boolean;
  dealType: string | null;
  chartType: "bar" | "funnel";
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pipelineHealthBlock: {
      setPipelineHealthBlock: (attrs?: Partial<PipelineHealthAttributes>) => ReturnType;
    };
  }
}

// Stage colors for the chart
const STAGE_COLORS: Record<string, string> = {
  SOURCING: "#60a5fa",           // blue-400
  INITIAL_REVIEW: "#a78bfa",     // violet-400
  PRELIMINARY_DUE_DILIGENCE: "#f472b6", // pink-400
  DEEP_DUE_DILIGENCE: "#fb923c", // orange-400
  NEGOTIATION: "#fbbf24",        // amber-400
  CLOSING: "#34d399",            // emerald-400
  CLOSED_WON: "#22c55e",         // green-500
  CLOSED_LOST: "#ef4444",        // red-500
};

// Format stage names for display
function formatStageName(stage: string): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// Format currency values
function formatValue(value: number | null): string {
  if (value === null || value === 0) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// =============================================================================
// Node Extension
// =============================================================================

export const PipelineHealthBlock = Node.create({
  name: "pipelineHealthBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      includeClosedDeals: { default: false },
      dealType: { default: null },
      chartType: { default: "bar" },
    };
  },

  parseHTML() {
    return [{ tag: "pipeline-health-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["pipeline-health-block", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PipelineHealthCard);
  },

  addCommands() {
    return {
      setPipelineHealthBlock:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: "pipelineHealthBlock",
            attrs: {
              includeClosedDeals: false,
              dealType: null,
              chartType: "bar",
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

function PipelineHealthCard({ node, updateAttributes }: NodeViewProps) {
  const attrs = node.attrs as PipelineHealthAttributes;
  const { includeClosedDeals, chartType } = attrs;
  const [showSettings, setShowSettings] = useState(false);

  // Fetch pipeline health data
  const { data, isLoading, error } = api.dashboard.pipelineHealth.useQuery(
    { includeClosedDeals },
    { refetchInterval: 60000 } // Refresh every minute
  );

  const handleToggleClosedDeals = useCallback(() => {
    updateAttributes({ includeClosedDeals: !includeClosedDeals });
  }, [includeClosedDeals, updateAttributes]);

  const handleChartTypeChange = useCallback(
    (type: "bar" | "funnel") => {
      updateAttributes({ chartType: type });
    },
    [updateAttributes]
  );

  // Prepare chart data
  const chartData = data?.stages
    .filter((s) => includeClosedDeals || !["CLOSED_WON", "CLOSED_LOST"].includes(s.stage))
    .map((stage) => ({
      name: formatStageName(stage.stage),
      stage: stage.stage,
      deals: stage.dealCount,
      value: stage.totalValue ? Number(stage.totalValue) : 0,
      weighted: stage.weightedValue ? Number(stage.weightedValue) : 0,
    }));

  return (
    <NodeViewWrapper className="my-6 font-sans">
      <div className="bg-white dark:bg-deep-grey border border-bone dark:border-charcoal/30 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-alabaster dark:bg-surface-dark">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gold/10 rounded">
              <BarChart3 className="w-4 h-4 text-gold" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal dark:text-cultured-white">
              Pipeline Health
            </h3>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-bone dark:hover:bg-charcoal/30 rounded transition-colors"
          >
            <Settings className="w-4 h-4 text-charcoal/60 dark:text-cultured-white/60" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-4 py-3 border-b border-bone dark:border-charcoal/30 bg-bone/50 dark:bg-charcoal/20 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeClosedDeals}
                onChange={handleToggleClosedDeals}
                className="rounded border-charcoal/30 text-gold focus:ring-gold"
              />
              <span className="text-charcoal dark:text-cultured-white">Include closed deals</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-charcoal/60 dark:text-cultured-white/60">View:</span>
              <button
                onClick={() => handleChartTypeChange("bar")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  chartType === "bar"
                    ? "bg-gold text-white"
                    : "bg-white dark:bg-charcoal text-charcoal dark:text-cultured-white hover:bg-bone dark:hover:bg-charcoal/70"
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => handleChartTypeChange("funnel")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  chartType === "funnel"
                    ? "bg-gold text-white"
                    : "bg-white dark:bg-charcoal text-charcoal dark:text-cultured-white hover:bg-bone dark:hover:bg-charcoal/70"
                }`}
              >
                Funnel
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
              <span className="ml-2 text-sm text-charcoal/60 dark:text-cultured-white/60">
                Loading pipeline data...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Failed to load pipeline data</span>
            </div>
          )}

          {data && chartData && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-alabaster dark:bg-surface-dark rounded-lg">
                  <div className="text-2xl font-bold text-charcoal dark:text-cultured-white">
                    {data.summary.totalDeals}
                  </div>
                  <div className="text-xs text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wide">
                    Total Deals
                  </div>
                </div>
                <div className="text-center p-3 bg-alabaster dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="w-5 h-5 text-gold" />
                    <span className="text-2xl font-bold text-charcoal dark:text-cultured-white">
                      {formatValue(data.summary.totalValue)}
                    </span>
                  </div>
                  <div className="text-xs text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wide">
                    Pipeline Value
                  </div>
                </div>
                <div className="text-center p-3 bg-alabaster dark:bg-surface-dark rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <span className="text-2xl font-bold text-charcoal dark:text-cultured-white">
                      {formatValue(data.summary.totalWeightedValue)}
                    </span>
                  </div>
                  <div className="text-xs text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wide">
                    Weighted Value
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={75}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "deals") return [value, "Deals"];
                        if (name === "value") return [formatValue(value), "Value"];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="deals" name="deals" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STAGE_COLORS[entry.stage] || "#94a3b8"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export default PipelineHealthBlock;
