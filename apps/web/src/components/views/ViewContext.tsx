"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

import { MOCK_DEALS, Deal } from './mock-data';

export type ViewType = 'kanban' | 'table' | 'timeline' | 'calendar' | 'analytics';

interface ViewContextType {
    currentView: ViewType;
    setView: (view: ViewType) => void;
    filters: Record<string, any>;
    setFilter: (key: string, value: any) => void;
    viewTitle: string;
    setViewTitle: (title: string) => void;
    deals: Deal[];
    updateDeal: (id: string, updates: Partial<Deal>) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({
    children,
    defaultView = 'kanban',
    defaultFilters = {}
}: {
    children: ReactNode;
    defaultView?: ViewType;
    defaultFilters?: Record<string, any>;
}) {
    const [currentView, setView] = useState<ViewType>(defaultView);
    const [filters, setFilters] = useState(defaultFilters);
    const [viewTitle, setViewTitle] = useState("Deal Pipeline");
    const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);

    const setFilter = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const updateDeal = (id: string, updates: Partial<Deal>) => {
        setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
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
            updateDeal
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
