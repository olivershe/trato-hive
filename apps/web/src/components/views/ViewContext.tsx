"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { api } from '@/trpc/react';
import { Deal, DealCompany } from './mock-data';

export type ViewType = 'kanban' | 'table' | 'timeline' | 'calendar' | 'analytics';

// Filter state for deals pipeline
export interface DealFilters {
    stages: string[];
    priorities: string[];
    sources: string[];
}

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
    dealFilters: DealFilters;
    setDealFilters: (filters: DealFilters) => void;
    viewTitle: string;
    setViewTitle: (title: string) => void;
    deals: Deal[];
    allDeals: Deal[];
    updateDeal: (id: string, updates: Partial<Deal>) => void;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
    // Side panel state (Notion-style database)
    selectedDealId: string | null;
    setSelectedDealId: (id: string | null) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

const DEFAULT_FILTERS: DealFilters = {
    stages: [],
    priorities: [],
    sources: [],
};

export function ViewProvider({
    children,
    defaultView = 'kanban',
}: {
    children: ReactNode;
    defaultView?: ViewType;
}) {
    const [currentView, setView] = useState<ViewType>(defaultView);
    const [dealFilters, setDealFilters] = useState<DealFilters>(DEFAULT_FILTERS);
    const [viewTitle, setViewTitle] = useState("Deal Pipeline");
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

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
    // Note: API returns Deal with company and dealCompanies relations included
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allDeals: (Deal & { dbStage: string; priority?: string; source?: string })[] = useMemo(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dealsData?.items.map((deal: any) => {
            // Transform dealCompanies: sort PLATFORM first, then by createdAt
            const companies: DealCompany[] = (deal.dealCompanies || [])
                .sort((a: { role: string }, b: { role: string }) => {
                    if (a.role === 'PLATFORM') return -1;
                    if (b.role === 'PLATFORM') return 1;
                    return 0;
                })
                .map((dc: { id: string; company: { id: string; name: string; industry: string | null }; role: string }) => ({
                    id: dc.id,
                    companyId: dc.company.id,
                    name: dc.company.name,
                    industry: dc.company.industry,
                    role: dc.role as DealCompany['role'],
                }));

            return {
                id: deal.id,
                title: deal.name,
                value: formatValue(deal.value ? Number(deal.value) : null),
                intValue: deal.value ? Number(deal.value) : 0,
                company: deal.company?.name || companies[0]?.name || "No Company",
                companies,
                stage: mapStageToView(deal.stage),
                dbStage: deal.stage, // Keep original stage for filtering
                priority: deal.priority,
                source: deal.source,
                date: formatDate(deal.expectedCloseDate),
                closingDate: deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate)
                    : new Date(),
                probability: deal.probability ?? 50,
                customFields: deal.customFields,
            };
        }) ?? [],
    [dealsData]);

    // Apply filters to deals
    const deals = useMemo(() => {
        return allDeals.filter((deal) => {
            // Stage filter
            if (dealFilters.stages.length > 0 && !dealFilters.stages.includes(deal.dbStage)) {
                return false;
            }
            // Priority filter
            if (dealFilters.priorities.length > 0 && deal.priority && !dealFilters.priorities.includes(deal.priority)) {
                return false;
            }
            // Source filter
            if (dealFilters.sources.length > 0 && deal.source && !dealFilters.sources.includes(deal.source)) {
                return false;
            }
            return true;
        });
    }, [allDeals, dealFilters]);

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
            dealFilters,
            setDealFilters,
            viewTitle,
            setViewTitle,
            deals,
            allDeals,
            updateDeal,
            isLoading,
            error: error as Error | null,
            refetch,
            selectedDealId,
            setSelectedDealId,
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
