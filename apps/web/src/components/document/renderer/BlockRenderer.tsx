import React from "react";
// @ts-ignore - DB package is available in monorepo
import type { BlockWithChildren } from "@trato-hive/db";
import { TextMessage } from "./TextMessage";
import { HeadingBlock } from "./HeadingBlock";
import { ListBlock } from "./ListBlock";
import { DealHeaderBlock } from "./DealHeaderBlock";
import { KanbanBlock } from "./KanbanBlock";

// Map Tiptap types to Components
// We perform the mapping here to keep the switch case clean
const BlockMap: Record<string, React.FC<any>> = {
    paragraph: TextMessage,
    heading: HeadingBlock,
    bulletList: ListBlock,
    orderedList: ListBlock,
    listItem: ListBlock, // List items are handled within ListBlock usually, or we render them as wrapper
    dealHeader: DealHeaderBlock,
    kanban: KanbanBlock,
    // Add others as implemented
};

interface BlockRendererProps {
    block: BlockWithChildren;
    depth?: number;
    className?: string;
}

export function BlockRenderer({ block, depth = 0, className }: BlockRendererProps) {
    // 1. Text Nodes (Leafs)
    if (block.type === "text") {
        // If we fix storage to include marks, we would handle them here.
        // distinct component for text to handle potential <b>, <i> etc.
        const props = block.properties as Record<string, unknown> | null;
        return <span className="whitespace-pre-wrap">{(props?.text as string) || ''}</span>;
    }

    // 2. Container Blocks
    const Component = BlockMap[block.type];

    // Specific handling for Lists (they need to know usage)
    // Or we just pass generic props

    if (!Component) {
        // Fallback for unknown blocks - render children at least
        console.warn(`Unknown block type: ${block.type}`);
        return (
            <div className="my-2 border-l-2 border-red-500 pl-2">
                <span className="text-xs text-red-500 font-mono">{block.type}</span>
                {block.children?.map((child) => (
                    <BlockRenderer key={child.id} block={child} depth={depth + 1} />
                ))}
            </div>
        );
    }

    return (
        <Component block={block} depth={depth} className={className}>
            {block.children?.map((child) => (
                <BlockRenderer key={child.id} block={child} depth={depth + 1} />
            ))}
        </Component>
    );
}
