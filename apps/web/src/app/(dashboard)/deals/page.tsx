"use client";

import { useCallback } from "react";
import { PageHeader } from "@/components/layouts/PageHeader";
import { ViewProvider, useView, type DealFilters } from "@/components/views/ViewContext";
import { ViewSwitcher } from "@/components/views/ViewSwitcher";
import { KanbanView } from "@/components/views/KanbanView";
import { TableView } from "@/components/views/TableView";
import { TimelineView } from "@/components/views/TimelineView";
import { CalendarView } from "@/components/views/CalendarView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { AlertsBlock } from "@/components/alerts/AlertsBlock";
import { DealSidePanel } from "@/components/deals/DealSidePanel";
import { DealsFilterBar, type FilterState } from "@/components/deals/DealsFilterBar";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { api } from "@/trpc/react";
import { useState } from "react";

// Filter bar wrapper that connects to ViewContext
function DealsFilterBarWrapper() {
  const { setDealFilters } = useView();

  const handleFilterChange = useCallback((filters: FilterState) => {
    // Convert FilterState to DealFilters
    const dealFilters: DealFilters = {
      stages: filters.stages,
      priorities: filters.priorities,
      sources: filters.sources,
    };
    setDealFilters(dealFilters);
  }, [setDealFilters]);

  return <DealsFilterBar onFilterChange={handleFilterChange} />;
}

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
          hover:bg-orange/90 transition-[background-color]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isCreating ? (
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Plus className="w-4 h-4" aria-hidden="true" />
        )}
        {isCreating ? "Creating…" : "New Deal"}
      </button>
    </div>
  );
}

function DealsPipelineContent() {
  const { currentView, isLoading, error } = useView();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin motion-reduce:animate-none text-orange" aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-alabaster rounded-xl border border-gold/10 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
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

// Wrapper for DealSidePanel that has access to ViewContext
function DealSidePanelWrapper() {
  const { selectedDealId, setSelectedDealId, refetch } = useView();

  return (
    <DealSidePanel
      dealId={selectedDealId}
      open={selectedDealId !== null}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedDealId(null);
          // Refetch deals when side panel closes to update the list
          refetch();
        }
      }}
    />
  );
}

export default function DealsPage() {
  return (
    <ViewProvider defaultView="table">
      <div className="px-12 py-8">
        <PageHeader
          title="Deals Pipeline"
          subtitle="Track and manage your M&A opportunities"
        />
        {/* [TASK-120] AI Alerts at top of pipeline */}
        <AlertsBlock />
        <ViewSwitcher />
        {/* [TASK-131] Filter bar with URL persistence */}
        <DealsFilterBarWrapper />
        <DealsToolbar />
        <DealsPipelineContent />
        {/* [TASK-128] Notion-style side panel for deal details */}
        <DealSidePanelWrapper />
      </div>
    </ViewProvider>
  );
}
