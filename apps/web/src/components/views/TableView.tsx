"use client";

import { useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    SortingState,
} from "@tanstack/react-table";
import { useView } from "./ViewContext";
import { Deal } from "./mock-data";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const columnHelper = createColumnHelper<Deal>();

const columns = [
    columnHelper.accessor("title", {
        header: "Deal Name",
        cell: info => <span className="font-bold text-charcoal dark:text-cultured-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor("company", {
        header: "Company",
        cell: info => <span className="text-gold font-medium uppercase text-xs tracking-wider">{info.getValue()}</span>,
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
];

export function TableView() {
    const { deals } = useView();
    const [sorting, setSorting] = useState<SortingState>([]);

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
                                    className="p-4 text-xs font-bold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 cursor-pointer select-none hover:text-gold transition-colors"
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    <div className="flex items-center gap-2">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{
                                            asc: <ArrowUp className="w-3 h-3" />,
                                            desc: <ArrowDown className="w-3 h-3" />,
                                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="w-3 h-3 opacity-20" />}
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
