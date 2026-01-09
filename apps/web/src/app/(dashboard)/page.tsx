"use client";

import { PageHeader } from "@/components/layouts/PageHeader";
import { api } from "@/trpc/react";
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
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  FileText,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Stage colors
const STAGE_COLORS: Record<string, string> = {
  SOURCING: "#60a5fa",
  INITIAL_REVIEW: "#a78bfa",
  PRELIMINARY_DUE_DILIGENCE: "#f472b6",
  DEEP_DUE_DILIGENCE: "#fb923c",
  NEGOTIATION: "#fbbf24",
  CLOSING: "#34d399",
  CLOSED_WON: "#22c55e",
  CLOSED_LOST: "#ef4444",
};

function formatStageName(stage: string): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatValue(value: number | null): string {
  if (value === null || value === 0) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <div className="bg-alabaster rounded-xl p-5 border border-gold/10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-charcoal/60">{title}</p>
          <p className="text-2xl font-bold text-charcoal mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-orange" />
        </div>
      </div>
    </div>
  );
}

// Activity type labels
function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    DEAL_CREATED: "Deal created",
    STAGE_CHANGE: "Stage changed",
    DOCUMENT_UPLOADED: "Document uploaded",
    FACT_EXTRACTED: "Fact extracted",
    USER_ACTION: "User action",
  };
  return labels[type] || type.toLowerCase().replace(/_/g, " ");
}

// Activity item component
function ActivityItem({
  type,
  description,
  time,
  dealName,
}: {
  type: string;
  description?: string | null;
  time: Date;
  dealName?: string;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gold/10 last:border-0">
      <div className="w-2 h-2 rounded-full bg-orange mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal">{getActivityLabel(type)}</p>
        {description && (
          <p className="text-xs text-charcoal/60 mt-0.5 truncate">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {dealName && (
            <span className="text-xs text-orange font-medium">{dealName}</span>
          )}
          <span className="text-xs text-charcoal/40">
            {formatDistanceToNow(new Date(time), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  // Fetch pipeline health data
  const { data: pipelineData, isLoading: pipelineLoading } =
    api.dashboard.pipelineHealth.useQuery({
      includeClosedDeals: false,
    });

  // Fetch recent activities
  const { data: activitiesData, isLoading: activitiesLoading } =
    api.dashboard.recentActivities.useQuery({
      page: 1,
      pageSize: 10,
    });

  // Prepare chart data from stages
  const chartData =
    pipelineData?.stages.map((item) => ({
      name: formatStageName(item.stage),
      deals: item.dealCount,
      value: Number(item.totalValue ?? 0) / 1000000,
      fill: STAGE_COLORS[item.stage] || "#94a3b8",
    })) ?? [];

  // Calculate avg deal value from summary
  const avgDealValue =
    pipelineData?.summary.totalDeals && pipelineData.summary.totalDeals > 0
      ? pipelineData.summary.totalValue / pipelineData.summary.totalDeals
      : 0;

  // Count deals in diligence
  const diligenceCount =
    pipelineData?.stages
      .filter(
        (s) =>
          s.stage === "PRELIMINARY_DUE_DILIGENCE" ||
          s.stage === "DEEP_DUE_DILIGENCE"
      )
      .reduce((sum, s) => sum + s.dealCount, 0) ?? 0;

  return (
    <>
      <PageHeader
        title="Command Center"
        subtitle="Overview of your M&A pipeline and recent activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Deals"
          value={pipelineData?.summary.totalDeals ?? 0}
          icon={Briefcase}
        />
        <StatCard
          title="Pipeline Value"
          value={formatValue(pipelineData?.summary.totalValue ?? 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Avg Deal Size"
          value={formatValue(avgDealValue)}
          icon={TrendingUp}
        />
        <StatCard
          title="In Diligence"
          value={diligenceCount}
          icon={FileText}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Chart */}
        <div className="lg:col-span-2 bg-alabaster rounded-xl p-5 border border-gold/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal">Pipeline by Stage</h2>
            <Link
              href="/deals"
              className="text-sm text-orange hover:text-orange/80 flex items-center gap-1"
            >
              View all deals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {pipelineLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-charcoal/50">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>No deals in pipeline</p>
              <Link
                href="/deals"
                className="mt-2 text-orange hover:underline text-sm"
              >
                Create your first deal
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "deals" ? `${value} deals` : `$${Number(value).toFixed(1)}M`,
                    name === "deals" ? "Count" : "Value",
                  ]}
                />
                <Bar dataKey="deals" name="deals" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-alabaster rounded-xl p-5 border border-gold/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal">Recent Activity</h2>
            <Clock className="w-5 h-5 text-charcoal/40" />
          </div>

          {activitiesLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-orange" />
            </div>
          ) : !activitiesData?.items.length ? (
            <div className="h-64 flex flex-col items-center justify-center text-charcoal/50">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-0">
              {activitiesData.items.slice(0, 6).map((activity) => (
                <ActivityItem
                  key={activity.id}
                  type={activity.type}
                  description={activity.description}
                  time={activity.createdAt}
                  dealName={activity.deal?.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/deals"
          className="flex items-center gap-3 p-4 bg-alabaster rounded-xl border border-gold/10 hover:border-orange/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-orange" />
          </div>
          <div>
            <p className="font-medium text-charcoal">View Pipeline</p>
            <p className="text-sm text-charcoal/60">Manage your deals</p>
          </div>
        </Link>

        <Link
          href="/discovery"
          className="flex items-center gap-3 p-4 bg-alabaster rounded-xl border border-gold/10 hover:border-orange/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-orange" />
          </div>
          <div>
            <p className="font-medium text-charcoal">Discovery</p>
            <p className="text-sm text-charcoal/60">Find new opportunities</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 p-4 bg-alabaster rounded-xl border border-gold/10">
          <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange" />
          </div>
          <div>
            <p className="font-medium text-charcoal">Data Room</p>
            <p className="text-sm text-charcoal/60">Select a deal first</p>
          </div>
        </div>
      </div>
    </>
  );
}
