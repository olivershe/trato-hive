
import React from "react";
// @ts-ignore
import type { BlockWithChildren } from "@trato-hive/db";
import { DollarSign, Briefcase, TrendingUp, Calendar } from "lucide-react";

interface DealHeaderAttributes {
    dealName: string;
    stage: string;
    value: string;
    currency: string;
    probability: number;
    expectedCloseDate: string;
}

interface DealHeaderBlockProps {
    block: BlockWithChildren;
    depth?: number;
    className?: string;
}

export function DealHeaderBlock({ block, className }: DealHeaderBlockProps) {
    // Extract attributes from block properties
    const attrs = block.properties as unknown as DealHeaderAttributes;

    // Defaults
    const dealName = attrs.dealName || "New Deal";
    const stage = attrs.stage || "SOURCING";
    const value = attrs.value || "0";
    const currency = attrs.currency || "USD";
    const probability = attrs.probability || 0;
    const expectedCloseDate = attrs.expectedCloseDate || "TBD";

    return (
        <div className={`my-8 font-sans ${className}`}>
            <div className="bg-white dark:bg-deep-grey border-t-4 border-gold shadow-lg rounded-b-lg p-6 relative overflow-hidden group">
                {/* Background Accent */}
                <div className="absolute top-0 right-0 p-8 opacity-5 text-gold pointer-events-none">
                    <Briefcase className="w-32 h-32" />
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-charcoal text-white dark:bg-white dark:text-charcoal">
                                DEAL ROOM
                            </span>
                            <span className="text-xs text-charcoal/50 dark:text-cultured-white/50 uppercase tracking-widest">
                                {stage.replace(/_/g, " ")}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal dark:text-cultured-white">
                            {dealName}
                        </h1>
                    </div>

                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-gold mb-1">
                            <DollarSign className="w-5 h-5" />
                            <span className="text-2xl font-bold font-mono tracking-tight">{value}</span>
                            <span className="text-sm font-bold text-charcoal/40 dark:text-cultured-white/40 ml-1">{currency}</span>
                        </div>
                        <div className="text-xs font-mono text-charcoal/60 dark:text-cultured-white/60 uppercase tracking-wider">
                            Est. Value
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-charcoal/10 dark:border-white/10 relative z-10">
                    {/* Probability */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-charcoal dark:text-cultured-white">
                                {probability}%
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 font-semibold">
                                Probability
                            </div>
                        </div>
                    </div>

                    {/* Target Close */}
                    <div className="flex items-center gap-3 col-span-2 md:col-span-1">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-charcoal dark:text-cultured-white">
                                {expectedCloseDate}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 font-semibold">
                                Target Close
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
