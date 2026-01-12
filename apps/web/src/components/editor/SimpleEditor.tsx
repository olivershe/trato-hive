// @ts-nocheck - Tiptap v2/v3 type mismatch with Novel
"use client";

import { useState } from "react";
import { EditorRoot, EditorContent, JSONContent } from "novel";
import { type Editor } from "@tiptap/core";
import { defaultExtensions } from "./extensions";
import { slashCommand } from "./SlashCommand";
import { CheckCircle2, Cloud, AlertCircle } from "lucide-react";
import "./drag-handle.css";
import "./active-block.css";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { motion, AnimatePresence } from "framer-motion";
import { HexagonSpinner } from "../ui/HexagonSpinner";

/**
 * SimpleEditor - A non-collaborative editor for testing and simple use cases.
 * Unlike BlockEditor, this component does NOT require Liveblocks/Yjs connection.
 * It's ideal for E2E testing and standalone editing scenarios.
 */

type SaveStatus = "Saved" | "Saving..." | "Error" | "Unsaved";

const extensions = [...defaultExtensions, slashCommand];

interface SimpleEditorProps {
    initialContent?: JSONContent;
    className?: string;
    editable?: boolean;
    onUpdate?: (content: JSONContent) => void;
}

export function SimpleEditor({
    initialContent,
    className,
    editable = true,
    onUpdate,
}: SimpleEditorProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const [status, setStatus] = useState<SaveStatus>("Saved");

    return (
        <div className={`relative w-full max-w-screen-lg group ${className}`} data-testid="simple-editor">
            {/* Status Header */}
            <div className="absolute -top-10 right-0 flex items-center gap-4">
                <div className="flex items-center space-x-2 text-xs font-medium text-charcoal/50 transition-opacity opacity-0 group-hover:opacity-100 duration-300">
                    <StatusIcon status={status} />
                    <span data-testid="save-status">{status}</span>
                </div>
            </div>

            <EditorRoot>
                <EditorContent
                    initialContent={initialContent}
                    extensions={extensions}
                    immediatelyRender={false}
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
                        setStatus("Unsaved");

                        // Simulate save with debounce-like behavior for testing
                        setTimeout(() => {
                            setStatus("Saving...");
                            setTimeout(() => {
                                setStatus("Saved");
                                onUpdate?.(json);
                            }, 500);
                        }, 500);
                    }}
                    onCreate={({ editor }) => {
                        setEditor(editor as any);
                    }}
                    editable={editable}
                >
                    {editor && <EditorBubbleMenu editor={editor} />}
                </EditorContent>
            </EditorRoot>
        </div>
    );
}

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
