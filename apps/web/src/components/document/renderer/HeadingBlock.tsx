
import React from "react";
// @ts-ignore
import type { BlockWithChildren } from "@trato-hive/db";
import { cn } from "@/lib/utils";

interface HeadingBlockProps {
    block: BlockWithChildren;
    children?: React.ReactNode;
    className?: string;
}

export function HeadingBlock({ block, children, className }: HeadingBlockProps) {
    const level = (block.properties?.level as number) || 1;

    // Modern Typography styles matching 'packages/ui' tokens implicitly via Tailwind
    // and ensuring consistency with Novel editor styles.

    switch (level) {
        case 1:
            return (
                <h1 className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mt-8 mb-4 font-serif text-charcoal dark:text-gold", className)}>
                    {children}
                </h1>
            );
        case 2:
            return (
                <h2 className={cn("scroll-m-20 border-b border-gold/20 pb-2 text-3xl font-semibold tracking-tight first:mt-0 mt-8 mb-4 font-serif text-charcoal dark:text-gold", className)}>
                    {children}
                </h2>
            );
        case 3:
            return (
                <h3 className={cn("scroll-m-20 text-2xl font-semibold tracking-tight mt-6 mb-3 font-serif text-charcoal dark:text-gold", className)}>
                    {children}
                </h3>
            );
        case 4:
            return (
                <h4 className={cn("scroll-m-20 text-xl font-semibold tracking-tight mt-4 mb-2 font-serif", className)}>
                    {children}
                </h4>
            );
        default:
            return (
                <h6 className={cn("scroll-m-20 text-base font-semibold tracking-tight", className)}>
                    {children}
                </h6>
            );
    }
}
