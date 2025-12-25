import { useState, useEffect, useCallback } from "react";
import { type JSONContent } from "novel";
import { api } from "../trpc/react";
// Native debounce used

export type SaveStatus = "Saved" | "Saving..." | "Error" | "Unsaved";

export function useBlockSync(pageId: string, initialContent?: JSONContent) {
    const [content, setContent] = useState<JSONContent | undefined>(initialContent);
    const [status, setStatus] = useState<SaveStatus>("Saved");
    const [lastSavedContent, setLastSavedContent] = useState<string>(JSON.stringify(initialContent));

    // const utils = api.useUtils();

    // Mutation
    const { mutate, isPending } = api.block.sync.useMutation({
        onSuccess: () => {
            setStatus("Saved");
            setLastSavedContent(JSON.stringify(content));
        },
        onError: (err: any) => {
            console.error("Failed to save blocks:", err);
            setStatus("Error");
        }
    });

    const updateContent = useCallback((newContent: JSONContent) => {
        setContent(newContent);
        setStatus("Unsaved");
    }, []);

    // Debounce logic
    useEffect(() => {
        const jsonString = JSON.stringify(content);
        if (jsonString === lastSavedContent) return;

        setStatus("Saving...");

        const timer = setTimeout(() => {
            mutate({
                pageId,
                content: content as any // Cast for now due to Tiptap <-> Zod type mismatch
            });
        }, 1000); // 1s debounce

        return () => clearTimeout(timer);
    }, [content, lastSavedContent, mutate, pageId]);

    return {
        content,
        updateContent,
        status,
        isPending
    };
}
