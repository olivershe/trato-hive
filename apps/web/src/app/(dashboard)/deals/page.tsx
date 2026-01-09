"use client";

import { PageHeader } from "@/components/layouts/PageHeader";
import { ViewProvider, useView } from "@/components/views/ViewContext";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { KanbanView } from "@/components/views/KanbanView";
import { TableView } from "@/components/views/TableView";
import { TimelineView } from "@/components/views/TimelineView";
import { CalendarView } from "@/components/views/CalendarView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { api } from "@/trpc/react";
import { useState } from "react";

function DealsToolbar() {
  const { refetch } = useView();
  const [isCreating, setIsCreating] = useState(false);

  const createDealMutation = api.deal.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreating(false);
    },
  });

  const handleCreateDeal = () => {
    setIsCreating(true);
    createDealMutation.mutate({
      name: `New Deal ${Date.now().toString(36)}`,
      type: "ACQUISITION",
      stage: "SOURCING",
    });
  };

  return (
    <div className="flex items-center justify-end mb-4">
      <button
        onClick={handleCreateDeal}
        disabled={isCreating}
        className="
          flex items-center gap-2 px-4 py-2
          bg-orange text-white rounded-lg
          hover:bg-orange/90 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Plus className="w-4 h-4" />
        {isCreating ? "Creating..." : "New Deal"}
      </button>
    </div>
  );
}

function DealsPipelineContent() {
  const { currentView, isLoading, error } = useView();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-alabaster rounded-xl border border-gold/10">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-charcoal/60">Failed to load deals</p>
        <p className="text-sm text-charcoal/40 mt-1">{error.message}</p>
      </div>
    );
  }

  switch (currentView) {
    case "kanban":
      return <KanbanView />;
    case "table":
      return <TableView />;
    case "timeline":
      return <TimelineView />;
    case "calendar":
      return <CalendarView />;
    case "analytics":
      return <AnalyticsView />;
    default:
      return <KanbanView />;
  }
}

export default function DealsPage() {
  return (
    <ViewProvider>
      <PageHeader
        title="Deals Pipeline"
        subtitle="Track and manage your M&A opportunities"
      />
      <ViewSwitcher />
      <DealsToolbar />
      <DealsPipelineContent />
    </ViewProvider>
  );
}
