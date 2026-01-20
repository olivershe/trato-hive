"use client";

/**
 * TableView - Deals Pipeline Table with Notion-style inline editing
 *
 * Uses shared CellRenderer components for consistent editing experience
 * across DatabaseViewBlock and this view.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    type SortingState,
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
    Smile,
} from "lucide-react";
import { CompaniesCell } from "./CompaniesCell";
import { DealCellRenderer } from "./DealCellRenderer";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { CustomFieldsManager } from "@/components/deals/CustomFieldsManager";
import { PropertyTypeSelector, PROPERTY_TYPES, type PropertyType } from "@/components/shared/PropertyTypeSelector";
import {
    buildDealColumns,
    type DealFieldSchema,
    type DealData,
    DEAL_STAGE_OPTIONS,
} from "./utils/dealColumnMapping";
import type { CellColumn } from "@/components/shared/cells";

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
    onStageChange: (stage: string) => void;
}

function ActionsCell({ deal, onStageChange }: ActionsCellProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [showStages, setShowStages] = useState(false);

    function handleToggleMenu(e: React.MouseEvent): void {
        e.stopPropagation();
        setIsOpen(!isOpen);
        setShowStages(false);
    }

    function handleOpenDeal(): void {
        router.push(`/deals/${deal.id}`);
        setIsOpen(false);
    }

    function handleStageSelect(stageId: string): void {
        onStageChange(stageId);
        setIsOpen(false);
        setShowStages(false);
    }

    return (
        <div className="relative">
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
                                className="absolute left-full top-0 ml-1 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] py-1 min-w-[160px]"
                                role="menu"
                            >
                                {DEAL_STAGE_OPTIONS.map((stage) => {
                                    // Map view stage to db stage for comparison
                                    const isCurrent = stage.id === deal.stage ||
                                        (deal.stage === "SOURCING" && (stage.id === "SOURCING" || stage.id === "INITIAL_REVIEW")) ||
                                        (deal.stage === "DILIGENCE" && (stage.id === "PRELIMINARY_DUE_DILIGENCE" || stage.id === "DEEP_DUE_DILIGENCE")) ||
                                        (deal.stage === "CLOSING" && (stage.id === "NEGOTIATION" || stage.id === "CLOSING" || stage.id === "CLOSED_WON" || stage.id === "CLOSED_LOST"));
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
                                            <span>{stage.name}</span>
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
    const { deals, setSelectedDealId, refetch } = useView();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [manageFieldsOpen, setManageFieldsOpen] = useState(false);

    // Inline add column state (matches DatabaseViewBlock pattern)
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [newColName, setNewColName] = useState("");
    const [addColumnDropdownPos, setAddColumnDropdownPos] = useState<{ top: number; left: number } | null>(null);
    const addColumnContainerRef = useRef<HTMLDivElement>(null);

    // Calculate dropdown position when showAddColumn changes
    useEffect(() => {
        if (showAddColumn && addColumnContainerRef.current) {
            const rect = addColumnContainerRef.current.getBoundingClientRect();
            const dropdownWidth = 288; // w-72 = 18rem = 288px
            const padding = 16;
            // Position dropdown to the left of the button, but keep it on screen
            let left = rect.left - dropdownWidth + rect.width;
            // Ensure it doesn't go off the right edge
            if (left + dropdownWidth > window.innerWidth - padding) {
                left = window.innerWidth - dropdownWidth - padding;
            }
            // Ensure it doesn't go off the left edge
            left = Math.max(padding, left);
            setAddColumnDropdownPos({
                top: rect.bottom + 4,
                left,
            });
        } else {
            setAddColumnDropdownPos(null);
        }
    }, [showAddColumn]);

    // Fetch custom fields
    const { data: customFields } = api.dealField.list.useQuery();

    // Deal update mutation for inline cell editing
    const utils = api.useUtils();
    const updateMutation = api.deal.update.useMutation({
        onSuccess: () => {
            utils.deal.list.invalidate();
            refetch();
        },
    });

    // Create field mutation for adding new columns
    const createFieldMutation = api.dealField.create.useMutation({
        onSuccess: () => {
            utils.dealField.list.invalidate();
            setShowAddColumn(false);
            setNewColName("");
        },
    });

    // Handle type selection from inline dropdown
    const handleTypeSelect = useCallback((type: PropertyType) => {
        const typeOption = PROPERTY_TYPES.find((t) => t.type === type);
        const columnName = newColName.trim() || typeOption?.label || type;
        createFieldMutation.mutate({
            name: columnName,
            type,
        });
    }, [newColName, createFieldMutation]);

    // Handle inline cell save
    const handleCellSave = useCallback(
        (dealId: string, updates: Record<string, unknown>) => {
            // Check if it's a custom field update
            if (updates.customFields) {
                const customFieldUpdates = updates.customFields as Record<string, unknown>;
                // Merge with existing custom fields
                const deal = deals.find((d) => d.id === dealId);
                const existingCustomFields = (deal as unknown as DealData)?.customFields || {};
                updateMutation.mutate({
                    id: dealId,
                    customFields: {
                        ...existingCustomFields,
                        ...customFieldUpdates,
                    },
                });
            } else {
                updateMutation.mutate({
                    id: dealId,
                    ...updates,
                });
            }
        },
        [deals, updateMutation]
    );

    // Handle stage change from actions menu
    function handleStageChange(dealId: string, stage: string): void {
        updateMutation.mutate({
            id: dealId,
            stage,
        });
    }

    // Handle row click to open side panel
    function handleRowClick(dealId: string): void {
        setSelectedDealId(dealId);
    }

    // Build columns from core + custom fields
    const cellColumns = useMemo(() => {
        const fieldSchemas: DealFieldSchema[] = (customFields ?? []).map((field) => ({
            id: field.id,
            name: field.name,
            type: field.type as DealFieldSchema['type'],
            options: Array.isArray(field.options) ? (field.options as string[]) : undefined,
            required: field.required ?? false,
            order: field.order ?? 0,
        }));
        return buildDealColumns(fieldSchemas);
    }, [customFields]);

    // Build TanStack table columns
    const columns = useMemo(() => {
        const tableColumns: ColumnDef<Deal>[] = [];

        // Companies column (special handling)
        tableColumns.push({
            id: "companies",
            header: "Companies",
            cell: ({ row }) => <CompaniesCell companies={row.original.companies} variant="table" />,
        });

        // Add cell columns (excluding companies which is handled above)
        cellColumns
            .filter((col) => col.id !== "companies")
            .forEach((col: CellColumn) => {
                tableColumns.push({
                    id: col.id,
                    header: col.name,
                    accessorFn: (row: Deal) => {
                        // Special handling for custom fields
                        if (!['title', 'stage', 'priority', 'value', 'probability', 'source', 'expectedCloseDate', 'leadPartner'].includes(col.id)) {
                            const customFieldsData = row.customFields as Record<string, unknown> | undefined;
                            return customFieldsData?.[col.id] ?? null;
                        }

                        // Core fields
                        switch (col.id) {
                            case 'title':
                                return row.title;
                            case 'stage':
                                // Use actual database stage (dbStage) instead of mapped view stage
                                return (row as unknown as DealData).dbStage || row.stage;
                            case 'priority':
                                return (row as unknown as DealData).priority || 'NONE';
                            case 'value':
                                return row.intValue;
                            case 'probability':
                                return row.probability;
                            case 'source':
                                return (row as unknown as DealData).source || null;
                            case 'expectedCloseDate':
                                return row.closingDate;
                            default:
                                return null;
                        }
                    },
                    cell: ({ row }) => (
                        <DealCellRenderer
                            column={col}
                            deal={row.original}
                            onSave={handleCellSave}
                        />
                    ),
                });
            });

        // Actions column (always last)
        tableColumns.push({
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
                <ActionsCell
                    deal={row.original}
                    onStageChange={(stage) => handleStageChange(row.original.id, stage)}
                />
            ),
        });

        return tableColumns;
    }, [cellColumns, handleCellSave]);

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
                            {/* Add column - Notion-style inline input + type picker */}
                            <th className={cn(
                                "relative px-1 transition-[width,min-width]",
                                showAddColumn ? "min-w-[200px]" : "w-16"
                            )}>
                                {!showAddColumn ? (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setShowAddColumn(true)}
                                            className="w-6 h-6 flex items-center justify-center text-charcoal/40 dark:text-cultured-white/40 hover:text-gold hover:bg-gold/10 rounded transition-colors"
                                            title="Add column"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setManageFieldsOpen(true)}
                                            className="w-6 h-6 flex items-center justify-center text-charcoal/40 dark:text-cultured-white/40 hover:text-gold hover:bg-gold/10 rounded transition-colors"
                                            title="Manage columns"
                                        >
                                            <Settings className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div ref={addColumnContainerRef}>
                                        {/* Inline name input styled like column header */}
                                        <div className="flex items-center gap-1.5 px-2 py-1.5">
                                            <Smile className="w-3.5 h-3.5 text-charcoal/40 dark:text-cultured-white/40" />
                                            <input
                                                type="text"
                                                value={newColName}
                                                onChange={(e) => setNewColName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Escape") {
                                                        setShowAddColumn(false);
                                                        setNewColName("");
                                                    }
                                                }}
                                                placeholder="Type property name…"
                                                autoFocus
                                                className="flex-1 bg-transparent text-[11px] font-medium text-charcoal dark:text-cultured-white placeholder:text-charcoal/40 dark:placeholder:text-cultured-white/40 focus:outline-none"
                                            />
                                        </div>
                                        {/* Type picker dropdown - rendered via portal */}
                                        {addColumnDropdownPos && (
                                            <PropertyTypeSelector
                                                position={addColumnDropdownPos}
                                                onSelect={handleTypeSelect}
                                                onCancel={() => {
                                                    setShowAddColumn(false);
                                                    setNewColName("");
                                                }}
                                            />
                                        )}
                                    </div>
                                )}
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
                                <td
                                    key={cell.id}
                                    className="p-4 pb-5"
                                    onClick={(e) => {
                                        // Prevent row click when interacting with editable cells
                                        const target = e.target as HTMLElement;
                                        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.closest('input') || target.closest('select')) {
                                            e.stopPropagation();
                                        }
                                    }}
                                >
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

            {/* Custom Fields Manager */}
            <CustomFieldsManager
                open={manageFieldsOpen}
                onOpenChange={setManageFieldsOpen}
            />
        </div>
    );
}
