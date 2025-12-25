"use client";

import { useView, ViewType } from "./ViewContext";
import {
    LayoutDashboard,
    Table as TableIcon,
    Calendar as CalendarIcon,
    GitCommitHorizontal,
    BarChart3
} from "lucide-react";
import { cn } from "@trato-hive/ui";

export function ViewSwitcher() {
    const { currentView, setView, viewTitle } = useView();

    const views: { id: ViewType; label: string; icon: React.ElementType }[] = [
        { id: 'kanban', label: 'Board', icon: LayoutDashboard },
        { id: 'table', label: 'Table', icon: TableIcon },
        { id: 'timeline', label: 'Timeline', icon: GitCommitHorizontal },
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gold/20">
            <h2 className="text-xl font-serif font-bold text-charcoal dark:text-cultured-white">
                {viewTitle}
            </h2>

            <div className="flex items-center gap-1 bg-alabaster dark:bg-charcoal p-1 rounded-lg border border-gold/20">
                {views.map((view) => {
                    const Icon = view.icon;
                    const isActive = currentView === view.id;

                    return (
                        <button
                            key={view.id}
                            onClick={() => setView(view.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                isActive
                                    ? "bg-white dark:bg-deep-grey text-gold shadow-sm"
                                    : "text-charcoal/60 dark:text-cultured-white/60 hover:text-charcoal hover:bg-gold/10"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden md:inline">{view.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
