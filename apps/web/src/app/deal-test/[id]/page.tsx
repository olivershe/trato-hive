
import { notFound } from "next/navigation";
import { prisma, getRecursivePageBlocks } from "@trato-hive/db";
import { BlockRenderer } from "@/components/document/renderer/BlockRenderer";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DealTestPage({ params }: PageProps) {
    const { id } = await params;
    // 1. Fetch the Deal with root page (first page without parent)
    const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
            pages: {
                where: { parentPageId: null },
                take: 1,
            }
        },
    });

    const rootPage = deal?.pages[0];
    if (!deal || !rootPage) {
        return notFound();
    }

    // 2. Fetch Recursive Blocks
    // This runs on the server (RSC), zero client bundle overhead for text!
    const blocks = await getRecursivePageBlocks(rootPage.id);

    return (
        <div className="min-h-screen bg-alabaster dark:bg-deep-grey">
            <div className="max-w-screen-lg mx-auto py-12 px-8">
                {/* Debug Info */}
                <div className="mb-8 p-4 bg-yellow-100/50 text-xs font-mono text-charcoal/50 rounded border border-yellow-200">
                    SSR Render Mode | Blocks: {blocks.length} | Page ID: {rootPage.id}
                </div>

                {/* The Document */}
                <div className="prose prose-lg dark:prose-invert prose-headings:font-serif max-w-none">
                    {blocks.map((block) => (
                        <BlockRenderer key={block.id} block={block} />
                    ))}
                </div>
            </div>
        </div>
    );
}
