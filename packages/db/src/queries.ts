
import { prisma, Block } from "./index";

export type BlockWithChildren = Block & {
    children?: BlockWithChildren[];
};

/**
 * Fetches all blocks for a page and reconstructs the tree structure.
 * This is optimized for the Read-Only Renderer.
 * 
 * @param pageId The ID of the page to fetch blocks for
 * @returns Array of root blocks with nested children
 */
export async function getRecursivePageBlocks(pageId: string): Promise<BlockWithChildren[]> {
    // 1. Fetch all blocks for the page in a single query
    const blocks = await prisma.block.findMany({
        where: { pageId },
        orderBy: { order: "asc" },
    });

    // 2. Build a map for O(1) lookup
    const blockMap = new Map<string, BlockWithChildren>();

    // Initialize map and add empty children array
    blocks.forEach((block) => {
        blockMap.set(block.id, { ...block, children: [] });
    });

    // 3. Construct the tree
    const rootBlocks: BlockWithChildren[] = [];

    blocks.forEach((block) => {
        const node = blockMap.get(block.id)!;

        if (block.parentId) {
            const parent = blockMap.get(block.parentId);
            if (parent) {
                parent.children?.push(node);
            } else {
                // Orphaned block (parent not found in return set) - treat as root or handle error
                // For robustness, we'll treat as root, though this suggests data integrity issue
                rootBlocks.push(node);
            }
        } else {
            rootBlocks.push(node);
        }
    });

    // 4. Return root blocks
    // Note: Children are already sorted by `order` because the initial fetch was sorted
    // and we pushed them in order.
    return rootBlocks;
}
