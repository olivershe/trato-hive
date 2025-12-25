
import React from "react";
// @ts-ignore
import type { BlockWithChildren } from "@trato-hive/db";
import { cn } from "@/lib/utils";

interface ListBlockProps {
    block: BlockWithChildren;
    children?: React.ReactNode;
    className?: string;
}

export function ListBlock({ block, children, className }: ListBlockProps) {
    // If this is a wrapper list
    if (block.type === "bulletList") {
        return (
            <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
                {children}
            </ul>
        );
    }

    if (block.type === "orderedList") {
        return (
            <ol className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}>
                {children}
            </ol>
        );
    }

    // If this is a list item
    if (block.type === "listItem") {
        return (
            <li className={cn("", className)}>
                {children}
            </li>
        );
    }

    // Fallback
    return <div className={className}>{children}</div>;
}
