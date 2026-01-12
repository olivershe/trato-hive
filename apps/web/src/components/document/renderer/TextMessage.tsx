
import React from "react";
// @ts-ignore
import type { BlockWithChildren } from "@trato-hive/db";
import { cn } from "@/lib/utils";

interface TextMessageProps {
    block: BlockWithChildren;
    children?: React.ReactNode;
    className?: string;
}

export function TextMessage({ block: _block, children, className }: TextMessageProps) {
    // Paragraph block
    return (
        <p className={cn("leading-7 [&:not(:first-child)]:mt-6 text-charcoal dark:text-cultured-white", className)}>
            {children}
        </p>
    );
}
