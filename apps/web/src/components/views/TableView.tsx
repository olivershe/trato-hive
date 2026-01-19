"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type CellContext,
    type ColumnDef,
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
    Plus,
    Settings,
} from "lucide-react";
import { CompaniesCell } from "./CompaniesCell";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { AddFieldDialog } from "@/components/deals/AddFieldDialog";
import { CustomFieldsManager } from "@/components/deals/CustomFieldsManager";

const STAGES = [
    { id: "SOURCING", label: "Sourcing" },
    { id: "DILIGENCE", label: "Due Diligence" },
    { id: "CLOSING", label: "Closing" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

const columnHelper = createColumnHelper<Deal>();

function getSortIcon(sortDirection: false | "asc" | "desc") {
    if (sortDirection === "asc") {
        return <ArrowUp className="w-3 h-3" aria-hidden="true" />;
    }
    if (sortDirection === "desc") {
        return <ArrowDown className="w-3 h-3" aria-hidden="true" />;
    }
    return <ArrowUpDown className="w-3 h-3 opacity-20" aria-hidden="true" />;
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
                className="p-1.5 rounded hover:bg-gold/10 transition-[background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
                aria-label="Deal actions"
                aria-expanded={isOpen}
                aria-haspopup="menu"
            >
                <MoreHorizontal className="w-4 h-4 text-charcoal/50 dark:text-cultured-white/50" aria-hidden="true" />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] py-1 min-w-[160px]"
                    role="menu"
                >
                    <button
                        onClick={handleOpenDeal}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                        role="menuitem"
                    >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        <span>Open</span>
                        <kbd className="ml-auto px-1.5 py-0.5 text-[9px] bg-bone dark:bg-panel-dark rounded text-charcoal/50 dark:text-cultured-white/50">
                            O
                        </kbd>
                    </button>

                    <div
                        className="relative"
                        onMouseEnter={() => setShowStages(true)}
                        onMouseLeave={() => setShowStages(false)}
                        onFocus={() => setShowStages(true)}
                        onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                setShowStages(false);
                            }
                        }}
                    >
                        <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                            role="menuitem"
                            aria-haspopup="menu"
                            aria-expanded={showStages}
                        >
                            <ArrowRightCircle className="w-4 h-4" aria-hidden="true" />
                            <span>Update Stage</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-auto" aria-hidden="true" />
                        </button>

                        {showStages && (
                            <div
                                className="absolute left-full top-0 ml-1 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] py-1 min-w-[140px]"
                                role="menu"
                            >
                                {STAGES.map((stage) => {
                                    const isCurrent = stage.id === deal.stage;
                                    return (
                                        <button
                                            key={stage.id}
                                            onClick={() => handleStageSelect(stage.id)}
                                            disabled={isCurrent}
                                            role="menuitem"
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
    const { deals, updateDeal, setSelectedDealId } = useView();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [addFieldOpen, setAddFieldOpen] = useState(false);
    const [manageFieldsOpen, setManageFieldsOpen] = useState(false);

    // Fetch custom fields
    const { data: customFields } = api.dealField.list.useQuery();

    function handleStageChange(dealId: string, stage: StageId): void {
        updateDeal(dealId, { stage });
    }

    // Handle row click to open side panel
    function handleRowClick(dealId: string): void {
        setSelectedDealId(dealId);
    }

    // Build columns including custom fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const columns = useMemo(() => {
        const baseColumns: ColumnDef<Deal, any>[] = [
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
                <span className="font-mono tabular-nums text-charcoal/80 dark:text-cultured-white/80">
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
                        <span className="text-xs tabular-nums text-charcoal/60 dark:text-cultured-white/60">
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
        ];

        // Add custom field columns
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customFieldColumns: ColumnDef<Deal, any>[] = (customFields ?? []).map((field) => ({
            id: `custom_${field.id}`,
            header: field.name,
            accessorFn: (row: Deal) => {
                const customFieldsData = row.customFields as Record<string, unknown> | null;
                return customFieldsData?.[field.id] ?? null;
            },
            cell: ({ getValue }: CellContext<Deal, unknown>) => {
                const value = getValue();
                if (value == null) {
                    return <span className="text-charcoal/30 dark:text-cultured-white/30 italic">—</span>;
                }
                if (field.type === "CHECKBOX") {
                    return value ? "✓" : "—";
                }
                if (field.type === "DATE" && value) {
                    return new Date(String(value)).toLocaleDateString();
                }
                if (Array.isArray(value)) {
                    return (
                        <div className="flex flex-wrap gap-1">
                            {value.map((v, i) => (
                                <span key={i} className="px-1.5 py-0.5 text-xs bg-gold/10 text-gold rounded">
                                    {String(v)}
                                </span>
                            ))}
                        </div>
                    );
                }
                return <span className="text-charcoal/80 dark:text-cultured-white/80">{String(value)}</span>;
            },
        }));

        // Actions column (always last)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actionsColumn: ColumnDef<Deal, any> = {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: (info: CellContext<Deal, unknown>) => (
                <ActionsCell
                    deal={info.row.original}
                    onStageChange={(stage) => handleStageChange(info.row.original.id, stage)}
                />
            ),
        };

        return [...baseColumns, ...customFieldColumns, actionsColumn];
    }, [customFields]);

    const table = useReactTable({
        data: deals,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="rounded-lg border border-gold/20 overflow-hidden bg-white dark:bg-deep-grey shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
            <table className="w-full text-left border-collapse">
                <thead className="bg-alabaster dark:bg-charcoal border-b border-gold/20">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const isActionsColumn = header.id === "actions";
                                const sortHandler = header.column.getToggleSortingHandler();
                                return (
                                    <th
                                        key={header.id}
                                        className={cn(
                                            "p-4 text-xs font-bold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 select-none",
                                            !isActionsColumn && "cursor-pointer hover:text-gold transition-[color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange"
                                        )}
                                        onClick={isActionsColumn ? undefined : sortHandler}
                                        onKeyDown={isActionsColumn ? undefined : (e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                sortHandler?.(e);
                                            }
                                        }}
                                        tabIndex={isActionsColumn ? undefined : 0}
                                        role={isActionsColumn ? undefined : "button"}
                                        aria-sort={
                                            isActionsColumn
                                                ? undefined
                                                : header.column.getIsSorted() === "asc"
                                                    ? "ascending"
                                                    : header.column.getIsSorted() === "desc"
                                                        ? "descending"
                                                        : "none"
                                        }
                                    >
                                        <div className="flex items-center gap-2">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {!isActionsColumn && getSortIcon(header.column.getIsSorted())}
                                        </div>
                                    </th>
                                );
                            })}
                            {/* Add column button */}
                            <th className="p-2 w-10">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setAddFieldOpen(true)}
                                        className="p-1.5 rounded hover:bg-gold/10 text-charcoal/40 hover:text-gold transition-colors"
                                        aria-label="Add custom field"
                                        title="Add column"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setManageFieldsOpen(true)}
                                        className="p-1.5 rounded hover:bg-gold/10 text-charcoal/40 hover:text-gold transition-colors"
                                        aria-label="Manage custom fields"
                                        title="Manage columns"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </th>
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            onClick={() => handleRowClick(row.original.id)}
                            className="border-b border-gold/10 last:border-0 hover:bg-gold/5 transition-[background-color] cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleRowClick(row.original.id);
                                }
                            }}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="p-4 pb-5">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                            {/* Empty cell to match add column header */}
                            <td className="p-2 w-10" />
                        </tr>
                    ))}
                </tbody>
            </table>
            {deals.length === 0 && (
                <div className="p-10 text-center text-charcoal/40 dark:text-cultured-white/40 italic">
                    No deals found.
                </div>
            )}

            {/* Custom Fields Dialogs */}
            <AddFieldDialog
                open={addFieldOpen}
                onOpenChange={setAddFieldOpen}
            />
            <CustomFieldsManager
                open={manageFieldsOpen}
                onOpenChange={setManageFieldsOpen}
            />
        </div>
    );
}
