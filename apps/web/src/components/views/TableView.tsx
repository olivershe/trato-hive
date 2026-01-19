"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
    CellContext,
} from "@tanstack/react-table";
import { useView } from "./ViewContext";
import { Deal } from "./mock-data";
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

// Stage options for quick update
const STAGES = [
    { id: "SOURCING", label: "Sourcing" },
    { id: "DILIGENCE", label: "Due Diligence" },
    { id: "CLOSING", label: "Closing" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

const columnHelper = createColumnHelper<Deal>();

// [TASK-121] Actions dropdown cell component
function ActionsCell({
    deal,
    onStageChange,
}: {
    deal: Deal;
    onStageChange: (stage: StageId) => void;
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [showStages, setShowStages] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowStages(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                    setShowStages(false);
                }}
                className="p-1.5 rounded hover:bg-gold/10 transition-colors"
            >
                <MoreHorizontal className="w-4 h-4 text-charcoal/50 dark:text-cultured-white/50" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]">
                    {/* Open Deal */}
                    <button
                        onClick={() => {
                            router.push(`/deals/${deal.id}`);
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open</span>
                        <kbd className="ml-auto px-1.5 py-0.5 text-[9px] bg-bone dark:bg-panel-dark rounded text-charcoal/50 dark:text-cultured-white/50">
                            O
                        </kbd>
                    </button>

                    {/* Update Stage - with submenu */}
                    <div
                        className="relative"
                        onMouseEnter={() => setShowStages(true)}
                        onMouseLeave={() => setShowStages(false)}
                    >
                        <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                        >
                            <ArrowRightCircle className="w-4 h-4" />
                            <span>Update Stage</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                        </button>

                        {/* Stage submenu */}
                        {showStages && (
                            <div className="absolute left-full top-0 ml-1 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]">
                                {STAGES.map((stage) => (
                                    <button
                                        key={stage.id}
                                        onClick={() => {
                                            if (stage.id !== deal.stage) {
                                                onStageChange(stage.id);
                                            }
                                            setIsOpen(false);
                                            setShowStages(false);
                                        }}
                                        disabled={stage.id === deal.stage}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm",
                                            stage.id === deal.stage
                                                ? "text-charcoal/40 dark:text-cultured-white/40 cursor-not-allowed"
                                                : "text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                                        )}
                                    >
                                        <span>{stage.label}</span>
                                        {stage.id === deal.stage && (
                                            <span className="text-[10px] text-charcoal/40 dark:text-cultured-white/40">
                                                Current
                                            </span>
                                        )}
                                    </button>
                                ))}
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

    // [TASK-121] Handle stage change from quick actions
    const handleStageChange = (dealId: string, stage: StageId) => {
        updateDeal(dealId, { stage });
    };

    // Define columns inside component to access handleStageChange
    const columns = [
        columnHelper.accessor("title", {
            header: "Deal Name",
            cell: info => <span className="font-bold text-charcoal dark:text-cultured-white">{info.getValue()}</span>,
        }),
        columnHelper.accessor("companies", {
            header: "Companies",
            cell: info => <CompaniesCell companies={info.getValue()} variant="table" />,
        }),
        columnHelper.accessor("stage", {
            header: "Stage",
            cell: info => (
                <span className="px-2 py-1 rounded bg-gold/10 text-gold text-xs font-bold uppercase tracking-widest">
                    {info.getValue()}
                </span>
            ),
        }),
        columnHelper.accessor("value", {
            header: "Value",
            cell: info => <span className="font-mono text-charcoal/80 dark:text-cultured-white/80">{info.getValue()}</span>,
        }),
        columnHelper.accessor("probability", {
            header: "Prob.",
            cell: info => (
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${info.getValue()}%` }}
                        />
                    </div>
                    <span className="text-xs text-charcoal/60 dark:text-cultured-white/60">{info.getValue()}%</span>
                </div>
            ),
        }),
        columnHelper.accessor("date", {
            header: "Date",
            cell: info => <span className="text-sm text-charcoal/60 dark:text-cultured-white/60">{info.getValue()}</span>,
        }),
        // [TASK-121] Actions column
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
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="rounded-lg border border-gold/20 overflow-hidden bg-white dark:bg-deep-grey">
            <table className="w-full text-left border-collapse">
                <thead className="bg-alabaster dark:bg-charcoal border-b border-gold/20">
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    className={cn(
                                        "p-4 text-xs font-bold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 select-none",
                                        header.id !== "actions" && "cursor-pointer hover:text-gold transition-colors"
                                    )}
                                    onClick={header.id !== "actions" ? header.column.getToggleSortingHandler() : undefined}
                                >
                                    <div className="flex items-center gap-2">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.id !== "actions" && (
                                            <>
                                                {{
                                                    asc: <ArrowUp className="w-3 h-3" />,
                                                    desc: <ArrowDown className="w-3 h-3" />,
                                                }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="w-3 h-3 opacity-20" />}
                                            </>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr
                            key={row.id}
                            className="border-b border-gold/10 last:border-0 hover:bg-gold/5 transition-colors"
                        >
                            {row.getVisibleCells().map(cell => (
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
