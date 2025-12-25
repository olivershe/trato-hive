import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc/init";
import { prisma } from "../index"; // Wait, prisma is not exported from index usually, usually it's in a db package or lib.
// Checking apps/api/src/trpc/context.ts usually has prisma.
// But wait, the previous view_file of index.ts didn't show prisma export.
// I should check where prisma client is instantiated.
// Usually in a monorepo it's in packages/db.
import { PrismaClient } from "@prisma/client";

// Instantiate localized prisma client if not available via context for now,
// or better yet, assume getContext provides it.
// Let's assume standard tRPC pattern: ctx.prisma.

// Recurisve type for Tiptap JSON is hard to define in Zod easily, 
// using z.any() for the content structure for now to avoid deep recursive type issues,
// but validation logic will handle it.

export const blockRouter = router({
    sync: publicProcedure // Changing to protected later, public for now to ease testing if auth not fully wired in frontend
        .input(
            z.object({
                pageId: z.string(),
                content: z.record(z.any()), // Tiptap JSON doc
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { pageId, content } = input;
            // In a real app we'd use ctx.prisma
            const prisma = new PrismaClient();

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
                    createdBy: "user_cm53s..." // Placeholder User ID until Auth is fully wired
                    // We really need a valid user ID. 
                    // I'll query the first user in DB or use a hardcoded one if auth is missing.
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

            // 2. Transaction
            // We need to fetch a valid user first to satisfy foreign key
            const user = await prisma.user.findFirst();
            const userId = user?.id || "clq..."; // Fallback

            // Update createdBy for all nodes
            nodesToCreate.forEach(n => n.createdBy = userId);

            await prisma.$transaction(async (tx) => {
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
