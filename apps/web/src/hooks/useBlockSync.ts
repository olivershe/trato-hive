import { useState, useEffect, useCallback, useRef } from "react";
import { type JSONContent } from "novel";
import { api } from "../trpc/react";
// Native debounce used

export type SaveStatus = "Saved" | "Saving..." | "Error" | "Unsaved";

/**
 * Extract page mention links from JSONContent for backlink tracking
 */
function extractPageLinks(content: JSONContent): Array<{ targetPageId: string; blockId: string }> {
    const links: Array<{ targetPageId: string; blockId: string }> = [];

    function traverse(node: JSONContent, blockId?: string) {
        // Track block ID from block-level nodes
        const currentBlockId = node.attrs?.id || blockId;

        // Check if this is a pageMention node
        if (node.type === "pageMention" && node.attrs?.pageId && currentBlockId) {
            links.push({
                targetPageId: node.attrs.pageId as string,
                blockId: currentBlockId,
            });
        }

        // Traverse children
        if (node.content) {
            for (const child of node.content) {
                traverse(child, currentBlockId);
            }
        }
    }

    traverse(content);
    return links;
}

export function useBlockSync(pageId: string, initialContent?: JSONContent) {
    const [content, setContent] = useState<JSONContent | undefined>(initialContent);
    const [status, setStatus] = useState<SaveStatus>("Saved");
    const [lastSavedContent, setLastSavedContent] = useState<string>(JSON.stringify(initialContent));
    const lastSyncedLinks = useRef<string>("");

    // Mutation for block sync
    const { mutate, isPending } = api.block.sync.useMutation({
        onSuccess: () => {
            setStatus("Saved");
            setLastSavedContent(JSON.stringify(content));
        },
        onError: (err: unknown) => {
            console.error("Failed to save blocks:", err);
            setStatus("Error");
        }
    });

    // Mutation for syncing wiki links
    const { mutate: syncLinks } = api.page.syncLinks.useMutation({
        onError: (err: unknown) => {
            console.error("Failed to sync page links:", err);
        }
    });

    const updateContent = useCallback((newContent: JSONContent) => {
        setContent(newContent);
        setStatus("Unsaved");
    }, []);

    // Debounce logic - save blocks and sync wiki links
    useEffect(() => {
        const jsonString = JSON.stringify(content);
        if (jsonString === lastSavedContent) return;

        setStatus("Saving...");

        const timer = setTimeout(() => {
            // Save blocks
            mutate({
                pageId,
                content: content as any // Cast for now due to Tiptap <-> Zod type mismatch
            });

            // Sync wiki links if content changed
            if (content) {
                const links = extractPageLinks(content);
                const linksString = JSON.stringify(links);

                // Only sync if links changed
                if (linksString !== lastSyncedLinks.current) {
                    syncLinks({
                        pageId,
                        links,
                    });
                    lastSyncedLinks.current = linksString;
                }
            }
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [content, lastSavedContent, mutate, pageId, syncLinks]);

    return {
        content,
        updateContent,
        status,
        isPending
    };
}
