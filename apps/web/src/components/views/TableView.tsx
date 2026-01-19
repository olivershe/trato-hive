"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type CellContext,
} from "@tanstack/react-table";
import { useView } from "./ViewContext";
import type { Deal } from "./mock-data";
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    MoreHorizontal,
    ExternalLink,
    ArrowRightCircle,
    ChevronRight,
} from "lucide-react";
import { CompaniesCell } from "./CompaniesCell";
import { cn } from "@/lib/utils";

const STAGES = [
    { id: "SOURCING", label: "Sourcing" },
    { id: "DILIGENCE", label: "Due Diligence" },
    { id: "CLOSING", label: "Closing" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

const columnHelper = createColumnHelper<Deal>();

function getSortIcon(sortDirection: false | "asc" | "desc") {
    if (sortDirection === "asc") {
        return <ArrowUp className="w-3 h-3" />;
    }
    if (sortDirection === "desc") {
        return <ArrowDown className="w-3 h-3" />;
    }
    return <ArrowUpDown className="w-3 h-3 opacity-20" />;
}

interface ActionsCellProps {
    deal: Deal;
    onStageChange: (stage: StageId) => void;
}

function ActionsCell({ deal, onStageChange }: ActionsCellProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [showStages, setShowStages] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent): void {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowStages(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    function handleToggleMenu(e: React.MouseEvent): void {
        e.stopPropagation();
        setIsOpen(!isOpen);
        setShowStages(false);
    }

    function handleOpenDeal(): void {
        router.push(`/deals/${deal.id}`);
        setIsOpen(false);
    }

    function handleStageSelect(stageId: StageId): void {
        if (stageId !== deal.stage) {
            onStageChange(stageId);
        }
        setIsOpen(false);
        setShowStages(false);
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={handleToggleMenu}
                className="p-1.5 rounded hover:bg-gold/10 transition-colors"
            >
                <MoreHorizontal className="w-4 h-4 text-charcoal/50 dark:text-cultured-white/50" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]">
                    <button
                        onClick={handleOpenDeal}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open</span>
                        <kbd className="ml-auto px-1.5 py-0.5 text-[9px] bg-bone dark:bg-panel-dark rounded text-charcoal/50 dark:text-cultured-white/50">
                            O
                        </kbd>
                    </button>

                    <div
                        className="relative"
                        onMouseEnter={() => setShowStages(true)}
                        onMouseLeave={() => setShowStages(false)}
                    >
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50">
                            <ArrowRightCircle className="w-4 h-4" />
                            <span>Update Stage</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                        </button>

                        {showStages && (
                            <div className="absolute left-full top-0 ml-1 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]">
                                {STAGES.map((stage) => {
                                    const isCurrent = stage.id === deal.stage;
                                    return (
                                        <button
                                            key={stage.id}
                                            onClick={() => handleStageSelect(stage.id)}
                                            disabled={isCurrent}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 text-sm",
                                                isCurrent
                                                    ? "text-charcoal/40 dark:text-cultured-white/40 cursor-not-allowed"
                                                    : "text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                                            )}
                                        >
                                            <span>{stage.label}</span>
                                            {isCurrent && (
                                                <span className="text-[10px] text-charcoal/40 dark:text-cultured-white/40">
                                                    Current
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function TableView() {
    const { deals, updateDeal } = useView();
    const [sorting, setSorting] = useState<SortingState>([]);

    function handleStageChange(dealId: string, stage: StageId): void {
        updateDeal(dealId, { stage });
    }

    const columns = [
        columnHelper.accessor("title", {
            header: "Deal Name",
            cell: (info) => (
                <span className="font-bold text-charcoal dark:text-cultured-white">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor("companies", {
            header: "Companies",
            cell: (info) => <CompaniesCell companies={info.getValue()} variant="table" />,
        }),
        columnHelper.accessor("stage", {
            header: "Stage",
            cell: (info) => (
                <span className="px-2 py-1 rounded bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor("value", {
            header: "Value",
            cell: (info) => (
                <span className="font-mono text-charcoal/80 dark:text-cultured-white/80">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor("probability", {
            header: "Prob.",
            cell: (info) => {
                const value = info.getValue();
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${value}%` }} />
                        </div>
                        <span className="text-xs text-charcoal/60 dark:text-cultured-white/60">
                            {value}%
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.accessor("date", {
            header: "Date",
            cell: (info) => (
                <span className="text-sm text-charcoal/60 dark:text-cultured-white/60">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.display({
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: (info: CellContext<Deal, unknown>) => (
                <ActionsCell
                    deal={info.row.original}
                    onStageChange={(stage) => handleStageChange(info.row.original.id, stage)}
                />
            ),
        }),
    ];

    const table = useReactTable({
        data: deals,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="rounded-lg border border-gold/20 overflow-hidden bg-white dark:bg-deep-grey">
            <table className="w-full text-left border-collapse">
                <thead className="bg-alabaster dark:bg-charcoal border-b border-gold/20">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const isActionsColumn = header.id === "actions";
                                return (
                                    <th
                                        key={header.id}
                                        className={cn(
                                            "p-4 text-xs font-bold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 select-none",
                                            !isActionsColumn && "cursor-pointer hover:text-gold transition-colors"
                                        )}
                                        onClick={isActionsColumn ? undefined : header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center gap-2">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {!isActionsColumn && getSortIcon(header.column.getIsSorted())}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            className="border-b border-gold/10 last:border-0 hover:bg-gold/5 transition-colors"
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="p-4 pb-5">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {deals.length === 0 && (
                <div className="p-10 text-center text-charcoal/40 dark:text-cultured-white/40 italic">
                    No deals found.
                </div>
            )}
        </div>
    );
}
