import { z } from "zod";
import { router, organizationProtectedProcedure } from "../trpc/init";

/**
 * Block Router - Handles Tiptap editor content synchronization
 *
 * Uses organizationProtectedProcedure for multi-tenancy and authentication.
 * Content is stored as hierarchical Block records linked to a Page.
 */

export const blockRouter = router({
    /**
     * Sync Tiptap editor content to database
     *
     * Flattens the Tiptap JSON tree into Block records with parent-child relationships.
     * Uses a transaction to ensure consistency.
     */
    sync: organizationProtectedProcedure
        .input(
            z.object({
                pageId: z.string().cuid(),
                content: z.record(z.any()), // Tiptap JSON doc
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { pageId, content } = input;
            const { db, session } = ctx;
            const userId = session.user.id;

            // 1. Recursive function to flatten the tree into a list of BlockCreateInputs
            const nodesToCreate: any[] = [];

            const processNode = (node: any, parentId: string | null, order: number) => {
                const id = node.attrs?.id || crypto.randomUUID();
                const type = node.type;
                const { id: _id, ...attrs } = node.attrs || {};

                // Prepare properties
                const properties = {
                    ...attrs,
                    text: node.text,
                    content: undefined // We don't store children in JSONB, we use relations
                };

                nodesToCreate.push({
                    id,
                    type,
                    properties,
                    parentId,
                    pageId,
                    order,
                    createdById: userId, // Use authenticated user from session
                });

                if (node.content && Array.isArray(node.content)) {
                    node.content.forEach((child: any, index: number) => {
                        processNode(child, id, index);
                    });
                }
            };

            // Tiptap doc wrapper
            if (content.type === "doc" && content.content) {
                content.content.forEach((child: any, index: number) => {
                    processNode(child, null, index);
                });
            }

            // 2. Transaction - clear existing blocks and insert new ones
            await db.$transaction(async (tx) => {
                // Clear existing blocks for this page
                await tx.block.deleteMany({
                    where: { pageId }
                });

                // Bulk create is not easily possible with self-relations in one go 
                // if we want to enforce parent existence, but Prisma createMany doesn't support nested relations easy.
                // Actually, since we generated IDs, we can insert them in order.
                // But to be safe with FK constraints (parentId must exist), we should insert roots first, then children.
                // We can sort by depth? Or just simple topological sort.
                // Or simpler: createMany accepts generated IDs? Yes.
                // Does createMany checks FK constraints immediately? Yes.
                // So we must insert Level 0, then Level 1, etc.

                // Group by depth/parent?
                // Actually, let's just use a loop for now. It's slower but safer for v1.
                // Or cleaner: createMany doesn't support 'createdBy' relation if it's strict? 
                // No, createMany takes raw scalars.

                // Let's try createMany. But we need to order them carefully.
                // Actually, if we use just `create` recursively it handles it?
                // No, we flattened it.

                // Let's just do:
                // 1. Find root nodes
                // 2. Insert them.
                // 3. Find children of roots.
                // 4. Insert them. 
                // ...

                // But honestly, for MVP, `for ... of` loop with `tx.block.create` is fine unless document is huge.
                for (const node of nodesToCreate) {
                    // Ensure parent exists? 
                    // If parent is in the same transaction it should be visible?
                    // But we must insert parent BEFORE child.
                    // Our recursive traversal `processNode` pushes Pre-Order (Parent then Children).
                    // So iterating `nodesToCreate` array should interact parents first.

                    await tx.block.create({
                        data: node
                    });
                }
            });

            return { success: true, count: nodesToCreate.length };
        }),
});
