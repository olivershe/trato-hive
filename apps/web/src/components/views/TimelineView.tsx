"use client";

import { useView } from "./ViewContext";
import { format } from "date-fns";

export function TimelineView() {
    const { deals } = useView();

    // Group by Month for timeline
    const sortedDeals = [...deals].sort((a, b) => a.closingDate.getTime() - b.closingDate.getTime());

    return (
        <div className="bg-white dark:bg-deep-grey rounded-lg border border-gold/20 overflow-hidden p-6">
            <div className="relative border-l-2 border-gold/20 ml-4 space-y-8">
                {sortedDeals.map((deal, index) => (
                    <div key={deal.id} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gold border-4 border-white dark:border-deep-grey" />

                        {/* Content Card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-alabaster dark:bg-charcoal/50 border border-gold/10 hover:shadow-md transition-shadow">
                            <div>
                                <span className="text-xs font-bold text-gold uppercase tracking-widest mb-1 block">
                                    Target Close: {format(deal.closingDate, "MMMM d, yyyy")}
                                </span>
                                <h4 className="text-lg font-bold text-charcoal dark:text-cultured-white font-serif">
                                    {deal.title}
                                </h4>
                                <p className="text-sm text-charcoal/60 dark:text-cultured-white/60">
                                    {deal.company} • {deal.stage}
                                </p>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-mono font-bold text-charcoal dark:text-cultured-white">
                                    {deal.value}
                                </div>
                                <div className="text-xs text-charcoal/40 dark:text-cultured-white/40 uppercase">
                                    Usually closes in {30 + index * 10} days
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
