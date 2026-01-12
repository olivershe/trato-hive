"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '@/trpc/react';
import { Deal } from './mock-data';

export type ViewType = 'kanban' | 'table' | 'timeline' | 'calendar' | 'analytics';

// Map database stage to simplified view stage
type ViewStage = "SOURCING" | "DILIGENCE" | "CLOSING";

function mapStageToView(stage: string): ViewStage {
    switch (stage) {
        case "SOURCING":
        case "INITIAL_REVIEW":
            return "SOURCING";
        case "PRELIMINARY_DUE_DILIGENCE":
        case "DEEP_DUE_DILIGENCE":
            return "DILIGENCE";
        case "NEGOTIATION":
        case "CLOSING":
        case "CLOSED_WON":
        case "CLOSED_LOST":
            return "CLOSING";
        default:
            return "SOURCING";
    }
}

// Map view stage back to database stage for updates
function mapViewToStage(stage: ViewStage): string {
    switch (stage) {
        case "SOURCING":
            return "SOURCING";
        case "DILIGENCE":
            return "PRELIMINARY_DUE_DILIGENCE";
        case "CLOSING":
            return "NEGOTIATION";
        default:
            return "SOURCING";
    }
}

// Format value for display
function formatValue(value: number | null): string {
    if (!value) return "$0";
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
}

// Format date for display
function formatDate(date: Date | null): string {
    if (!date) return "TBD";
    const d = new Date(date);
    const month = d.toLocaleString("default", { month: "short" });
    const day = d.getDate();
    return `${month} ${day}`;
}

interface ViewContextType {
    currentView: ViewType;
    setView: (view: ViewType) => void;
    filters: Record<string, unknown>;
    setFilter: (key: string, value: unknown) => void;
    viewTitle: string;
    setViewTitle: (title: string) => void;
    deals: Deal[];
    updateDeal: (id: string, updates: Partial<Deal>) => void;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({
    children,
    defaultView = 'kanban',
    defaultFilters = {}
}: {
    children: ReactNode;
    defaultView?: ViewType;
    defaultFilters?: Record<string, unknown>;
}) {
    const [currentView, setView] = useState<ViewType>(defaultView);
    const [filters, setFilters] = useState(defaultFilters);
    const [viewTitle, setViewTitle] = useState("Deal Pipeline");

    // Fetch deals from API
    const {
        data: dealsData,
        isLoading,
        error,
        refetch,
    } = api.deal.list.useQuery({
        pageSize: 100,
    });

    // Update deal mutation
    const updateMutation = api.deal.update.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    // Transform API data to view model
    // Note: API returns Deal with company relation included
    const deals: Deal[] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dealsData?.items.map((deal: any) => ({
            id: deal.id,
            title: deal.name,
            value: formatValue(deal.value ? Number(deal.value) : null),
            intValue: deal.value ? Number(deal.value) : 0,
            company: deal.company?.name || "No Company",
            stage: mapStageToView(deal.stage),
            date: formatDate(deal.expectedCloseDate),
            closingDate: deal.expectedCloseDate
                ? new Date(deal.expectedCloseDate)
                : new Date(),
            probability: deal.probability ?? 50,
        })) ?? [];

    const setFilter = (key: string, value: unknown) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const updateDeal = (id: string, updates: Partial<Deal>) => {
        // Map view stage to database stage if provided
        const dbUpdates: Record<string, unknown> = {};

        if (updates.stage) {
            dbUpdates.stage = mapViewToStage(updates.stage);
        }
        if (updates.probability !== undefined) {
            dbUpdates.probability = updates.probability;
        }
        if (updates.title) {
            dbUpdates.name = updates.title;
        }

        if (Object.keys(dbUpdates).length > 0) {
            updateMutation.mutate({
                id,
                ...dbUpdates,
            });
        }
    };

    return (
        <ViewContext.Provider value={{
            currentView,
            setView,
            filters,
            setFilter,
            viewTitle,
            setViewTitle,
            deals,
            updateDeal,
            isLoading,
            error: error as Error | null,
            refetch,
        }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) {
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}
