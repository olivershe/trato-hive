
import React from "react";
// @ts-ignore
import type { BlockWithChildren } from "@trato-hive/db";
import { KanbanSquare } from "lucide-react";

interface KanbanBlockProps {
    block: BlockWithChildren;
    className?: string;
}

export function KanbanBlock({ block, className }: KanbanBlockProps) {
    return (
        <div className={`my-8 p-8 border-2 border-dashed border-charcoal/20 rounded-lg flex flex-col items-center justify-center bg-charcoal/5 dark:bg-white/5 ${className}`}>
            <KanbanSquare className="w-12 h-12 text-charcoal/40 dark:text-white/40 mb-4" />
            <span className="font-serif text-charcoal/60 dark:text-white/60 text-lg">
                Kanban Board
            </span>
            <span className="text-xs text-charcoal/40 dark:text-white/40 uppercase tracking-widest mt-2">
                Interactive View Only
            </span>
        </div>
    );
}
