
"use client";

import React from "react";
// @ts-ignore
import type { BlockWithChildren } from "@trato-hive/db";
import { ShieldCheck, FileText, Info } from "lucide-react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

interface CitationAttributes {
    factId: string;
    sourceText: string;
    confidence: number;
    documentName: string;
    subject: string;
    predicate: string;
    object: string;
}

interface CitationBlockProps {
    block: BlockWithChildren;
    depth?: number;
    className?: string;
}

export function CitationBlock({ block, className }: CitationBlockProps) {
    const attrs = block.properties as unknown as CitationAttributes;

    // Defaults
    const sourceText = attrs.sourceText || "Source unavailable";
    const confidence = attrs.confidence || 0;
    const documentName = attrs.documentName || "Unknown Document";
    const subject = attrs.subject || "";
    const predicate = attrs.predicate || "";
    const object = attrs.object || "";

    const confidenceColor =
        confidence > 0.9
            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
            : confidence > 0.7
                ? "text-amber-600 bg-amber-50 border-amber-200"
                : "text-red-600 bg-red-50 border-red-200";

    return (
        <div className={`my-6 ${className}`}>
            <Tippy
                content={
                    <div className="max-w-xs p-2 text-xs">
                        <p className="font-semibold text-white/90 mb-1">Source Excerpt:</p>
                        <p className="italic text-white/80">"{sourceText}"</p>
                        <div className="mt-2 flex items-center text-white/60 border-t border-white/20 pt-1">
                            <FileText className="w-3 h-3 mr-1" />
                            {documentName}
                        </div>
                    </div>
                }
                theme="dark"
                arrow={true}
                interactive={true}
            >
                <div className="group relative flex items-start gap-3 p-4 bg-alabaster dark:bg-surface-dark border border-gold/40 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-default select-none">
                    {/* Icon */}
                    <div className={`p-2 rounded-md border ${confidenceColor} shrink-0`}>
                        <ShieldCheck className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal/60 dark:text-cultured-white/60">
                                VERIFIED FACT
                            </span>
                            <span className="h-px bg-gold/20 flex-1"></span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${confidenceColor}`}>
                                {(confidence * 100).toFixed(0)}% CONFIDENCE
                            </span>
                        </div>

                        <div className="font-serif text-charcoal dark:text-cultured-white text-lg leading-tight">
                            <span className="font-semibold">{subject}</span>{" "}
                            <span className="text-charcoal/70 dark:text-cultured-white/70 italic">
                                {predicate}
                            </span>{" "}
                            <span className="font-semibold text-orange">{object}</span>
                        </div>
                    </div>

                    {/* Info Hint */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gold">
                        <Info className="w-4 h-4" />
                    </div>
                </div>
            </Tippy>
        </div>
    );
}
