"use client";

import { useMemo, useState } from "react";
import {
    DndContext,
    DragOverlay,
    useDroppable,
    DragStartEvent,
    DragEndEvent,
    closestCorners,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { DollarSign, Calendar } from "lucide-react";
import { useView } from "./ViewContext";
import { Deal } from "./mock-data";

const COLUMNS = [
    { id: "SOURCING", title: "Sourcing" },
    { id: "DILIGENCE", title: "Due Diligence" },
    { id: "CLOSING", title: "Closing" },
];

export function KanbanView() {
    const { deals, updateDeal } = useView();
    const [activeId, setActiveId] = useState<string | null>(null);

    const columns = useMemo(() => {
        return COLUMNS.map(col => ({
            ...col,
            deals: deals.filter((deal: Deal) => deal.stage === col.id),
        }));
    }, [deals]);

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeDeal = deals.find((d: Deal) => d.id === active.id);
            if (activeDeal) {
                // Dropping over a column
                if (COLUMNS.some(c => c.id === over.id)) {
                    updateDeal(active.id as string, { stage: over.id as any });
                }
                // Dropping over another card in different column
                else {
                    const overDeal = deals.find((d: Deal) => d.id === over.id);
                    if (overDeal && overDeal.stage !== activeDeal.stage) {
                        updateDeal(active.id as string, { stage: overDeal.stage });
                    }
                }
            }
        }
        setActiveId(null);
    }

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px] overflow-x-auto pb-4">
                {columns.map(col => (
                    <KanbanColumn key={col.id} id={col.id} title={col.title} deals={col.deals} />
                ))}
            </div>

            {createPortal(
                <DragOverlay>
                    {activeId ? (
                        <DealCard deal={deals.find((d: Deal) => d.id === activeId)!} isOverlay />
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}

function KanbanColumn({ id, title, deals }: { id: string; title: string; deals: Deal[] }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className="flex flex-col bg-alabaster dark:bg-charcoal/50 rounded-lg border border-gold/10 h-full"
        >
            <div className="p-4 border-b border-gold/10 flex justify-between items-center">
                <h3 className="font-bold text-charcoal dark:text-cultured-white">{title}</h3>
                <span className="text-xs font-mono bg-white dark:bg-deep-grey text-gold px-2 py-0.5 rounded-full">
                    {deals.length}
                </span>
            </div>
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                    {deals.map(deal => (
                        <SortableDealCard key={deal.id} deal={deal} />
                    ))}
                </SortableContext>
                {deals.length === 0 && (
                    <div className="text-center py-10 text-charcoal/30 dark:text-cultured-white/30 text-sm italic">
                        No deals
                    </div>
                )}
            </div>
        </div>
    );
}

function SortableDealCard({ deal }: { deal: Deal }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: deal.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <DealCard deal={deal} />
        </div>
    );
}

function DealCard({ deal, isOverlay }: { deal: Deal, isOverlay?: boolean }) {
    return (
        <div className={cn(
            "bg-white dark:bg-deep-grey p-4 rounded-md border border-gold/20 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group",
            isOverlay && "shadow-xl border-gold rotate-2 cursor-grabbing"
        )}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-gold uppercase tracking-wider">{deal.company}</span>
                {isOverlay && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            <h4 className="font-bold text-charcoal dark:text-cultured-white mb-3 text-lg font-serif">
                {deal.title}
            </h4>

            <div className="flex items-center justify-between text-charcoal/60 dark:text-cultured-white/60 text-sm">
                <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="font-mono font-semibold">{deal.value}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{deal.date}</span>
                </div>
            </div>
        </div>
    )
}
