"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    useDroppable,
    closestCorners,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { DollarSign, Calendar, GripVertical } from "lucide-react";
import { useView } from "./ViewContext";
import type { Deal } from "./mock-data";
import { CompaniesCell } from "./CompaniesCell";
import { DealQuickActions } from "@/components/deals/DealQuickActions";

type DealStage = Deal["stage"];

const COLUMNS: { id: DealStage; title: string }[] = [
    { id: "SOURCING", title: "Sourcing" },
    { id: "DILIGENCE", title: "Due Diligence" },
    { id: "CLOSING", title: "Closing" },
];

export function KanbanView() {
    const { deals, updateDeal } = useView();
    const [activeId, setActiveId] = useState<string | null>(null);

    const columns = useMemo(() => {
        return COLUMNS.map((col) => ({
            ...col,
            deals: deals.filter((deal) => deal.stage === col.id),
        }));
    }, [deals]);

    function handleDragStart(event: DragStartEvent): void {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent): void {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const activeDeal = deals.find((d) => d.id === active.id);
        if (!activeDeal) return;

        const targetColumn = COLUMNS.find((c) => c.id === over.id);
        if (targetColumn) {
            updateDeal(active.id as string, { stage: targetColumn.id });
            return;
        }

        const overDeal = deals.find((d) => d.id === over.id);
        if (overDeal && overDeal.stage !== activeDeal.stage) {
            updateDeal(active.id as string, { stage: overDeal.stage });
        }
    }

    function handleStageChange(dealId: string, stage: DealStage): void {
        updateDeal(dealId, { stage });
    }

    const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCorners}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px] overflow-x-auto pb-4">
                {columns.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        deals={col.deals}
                        onStageChange={handleStageChange}
                    />
                ))}
            </div>

            {createPortal(
                <DragOverlay>
                    {activeDeal && <DealCard deal={activeDeal} isOverlay />}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}

interface KanbanColumnProps {
    id: string;
    title: string;
    deals: Deal[];
    onStageChange: (dealId: string, stage: DealStage) => void;
}

function KanbanColumn({ id, title, deals, onStageChange }: KanbanColumnProps) {
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
                <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                    {deals.map((deal) => (
                        <SortableDealCard
                            key={deal.id}
                            deal={deal}
                            onStageChange={(stage) => onStageChange(deal.id, stage)}
                        />
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

interface SortableDealCardProps {
    deal: Deal;
    onStageChange: (stage: DealStage) => void;
}

function SortableDealCard({ deal, onStageChange }: SortableDealCardProps) {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: deal.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    function handleClick(): void {
        if (!isHovered) {
            router.push(`/deals/${deal.id}`);
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <DealCard
                deal={deal}
                onClick={handleClick}
                dragHandleProps={listeners}
                showQuickActions={isHovered && !isDragging}
                onStageChange={onStageChange}
                onCloseQuickActions={() => setIsHovered(false)}
            />
        </div>
    );
}

interface DealCardProps {
    deal: Deal;
    isOverlay?: boolean;
    onClick?: () => void;
    dragHandleProps?: Record<string, unknown>;
    showQuickActions?: boolean;
    onStageChange?: (stage: DealStage) => void;
    onCloseQuickActions?: () => void;
}

function DealCard({
    deal,
    isOverlay = false,
    onClick,
    dragHandleProps,
    showQuickActions = false,
    onStageChange,
    onCloseQuickActions,
}: DealCardProps) {
    return (
        <div
            className={cn(
                "bg-white dark:bg-deep-grey p-4 rounded-md border border-gold/20 shadow-sm hover:shadow-md transition-shadow group relative",
                isOverlay
                    ? "shadow-xl border-gold rotate-2 cursor-grabbing"
                    : "cursor-pointer hover:border-orange/50"
            )}
            onClick={onClick}
        >
            {showQuickActions && onStageChange && (
                <DealQuickActions
                    dealId={deal.id}
                    currentStage={deal.stage}
                    onStageChange={onStageChange}
                    onClose={onCloseQuickActions}
                />
            )}

            {dragHandleProps && (
                <div
                    className="absolute top-2 right-2 p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    {...dragHandleProps}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-4 h-4 text-charcoal/40" />
                </div>
            )}

            <div className="flex justify-between items-start mb-2">
                <CompaniesCell companies={deal.companies} variant="card" />
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
    );
}
