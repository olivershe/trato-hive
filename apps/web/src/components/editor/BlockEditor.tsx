"use client";

import { useState, useEffect } from "react";
import { EditorRoot, EditorContent, JSONContent } from "novel";
import { type Editor } from "@tiptap/core";
import { defaultExtensions } from "./extensions";
import { slashCommand } from "./SlashCommand";
import { useBlockSync, type SaveStatus } from "../../hooks/useBlockSync";
import { CheckCircle2, Cloud, AlertCircle, Loader2 } from "lucide-react";
import "./drag-handle.css";
import "./active-block.css";
import { EditorBubbleMenu } from "./EditorBubbleMenu";

const extensions = [...defaultExtensions, slashCommand];

interface BlockEditorProps {
    pageId: string; // Required for sync
    initialContent?: JSONContent;
    className?: string;
    editable?: boolean;
}

export function BlockEditor({
    pageId,
    initialContent,
    className,
    editable = true,
}: BlockEditorProps) {
    // Sync Hook
    const { content, updateContent, status } = useBlockSync(pageId, initialContent);
    const [editorContent, setEditorContent] = useState<JSONContent | undefined>(content);
    const [editor, setEditor] = useState<Editor | null>(null);

    // Ensure local state updates if initial content loads later (though hooks usually handle this via effect, 
    // but since specific logic might be needed):
    useEffect(() => {
        if (content && !editorContent) {
            setEditorContent(content);
        }
    }, [content]);

    return (
        <div className={`relative w-full max-w-screen-lg group ${className}`}>
            {/* Status Indicator */}
            <div className="absolute -top-8 right-0 flex items-center space-x-2 text-xs font-medium text-charcoal/50 transition-opacity opacity-0 group-hover:opacity-100 duration-300">
                <StatusIcon status={status} />
                <span>{status}</span>
            </div>

            <EditorRoot>
                <EditorContent
                    initialContent={editorContent}
                    extensions={extensions}
                    editorProps={{
                        attributes: {
                            class: `prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:text-charcoal dark:prose-headings:text-cultured-white focus:outline-none max-w-full min-h-[500px] p-12 bg-white dark:bg-surface-dark border border-gold/10 rounded-xl shadow-sm transition-shadow duration-200 focus-within:shadow-md focus-within:border-gold/30`,
                        },
                        handleDOMEvents: {
                            keydown: (_view, _event) => {
                                return false;
                            },
                        },
                    }}
                    onUpdate={({ editor }) => {
                        const json = editor.getJSON();
                        updateContent(json); // Notify hook
                    }}
                    onCreate={({ editor }) => {
                        setEditor(editor);
                    }}
                    editable={editable}
                >
                    {editor && <EditorBubbleMenu editor={editor} />}
                </EditorContent>
            </EditorRoot>
        </div>
    );
}

import { motion, AnimatePresence } from "framer-motion";
import { HexagonSpinner } from "../ui/HexagonSpinner";

// ... extensions imports ...
// ... (keep existing imports)

// Updated StatusIcon
function StatusIcon({ status }: { status: SaveStatus }) {
    return (
        <AnimatePresence mode="wait">
            {status === "Saved" && (
                <motion.div
                    key="saved"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center text-green-500"
                >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                </motion.div>
            )}
            {status === "Saving..." && (
                <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                >
                    <HexagonSpinner size={14} className="text-orange" />
                </motion.div>
            )}
            {status === "Error" && (
                <motion.div
                    key="error"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center text-red-500"
                >
                    <AlertCircle className="w-3.5 h-3.5" />
                </motion.div>
            )}
            {status === "Unsaved" && (
                <motion.div
                    key="unsaved"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center text-charcoal/50"
                >
                    <Cloud className="w-3.5 h-3.5" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
