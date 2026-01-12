// @ts-nocheck - Tiptap v2/v3 collaboration extension type mismatch (known issue)
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { EditorRoot, EditorContent, JSONContent } from "novel";
import { type Editor } from "@tiptap/core";
import { defaultExtensions, PageMention, createWikiLinkSuggestion } from "./extensions";
import { slashCommand } from "./SlashCommand";
import { useBlockSync, type SaveStatus } from "../../hooks/useBlockSync";
import { CheckCircle2, Cloud, AlertCircle } from "lucide-react";
import "./drag-handle.css";
import "./active-block.css";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { motion, AnimatePresence } from "framer-motion";
import { HexagonSpinner } from "../ui/HexagonSpinner";

// Collaboration Imports
import { CollaborationProvider } from "../collaboration/CollaborationProvider";
import { ActiveUsers } from "../collaboration/ActiveUsers";
import { useRoom, useSelf } from "@liveblocks/react";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import * as Y from "yjs";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16);

// Base extensions without PageMention (configured per-instance with dealId)
const baseExtensions = [...defaultExtensions, slashCommand];

interface BlockEditorProps {
    pageId: string; // Required for sync/room
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
    return (
        <CollaborationProvider roomId={pageId}>
            <BlockEditorInner
                pageId={pageId}
                initialContent={initialContent}
                className={className}
                editable={editable}
            />
        </CollaborationProvider>
    );
}

function BlockEditorInner({
    pageId,
    initialContent,
    className,
    editable = true,
}: BlockEditorProps) {
    // Get dealId from route params for wiki link suggestions
    const params = useParams();
    const dealId = params?.id as string | undefined;

    // 1. Sync Hook (Persistence to DB)
    const { updateContent, status } = useBlockSync(pageId, initialContent);

    // 2. Collaboration Setup (Real-time via Liveblocks)
    const room = useRoom();
    const userInfo = useSelf((me) => me.info);

    const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null);
    const [doc, setDoc] = useState<Y.Doc | null>(null);
    const [editor, setEditor] = useState<Editor | null>(null); // State for Tiptap editor instance

    useEffect(() => {
        const yDoc = new Y.Doc();
        const yProvider = new LiveblocksYjsProvider(room, yDoc);
        setDoc(yDoc);
        setProvider(yProvider);

        return () => {
            yDoc.destroy();
            yProvider.destroy();
        };
    }, [room]);

    // 3. Configure Tiptap Extensions with Yjs + Wiki Links
    // Note: Using 'as any' to handle Tiptap v2/v3 type mismatch for collaboration extensions
    // Must be called before any conditional returns to satisfy React hooks rules
    const collabExtensions = useMemo(() => {
        if (!doc || !provider || !userInfo) return [];
        const wikiLinkSuggestion = createWikiLinkSuggestion(dealId);
        return [
            ...baseExtensions,
            // Wiki links with [[ trigger
            PageMention.configure({
                suggestion: wikiLinkSuggestion,
            }),
            Collaboration.configure({
                document: doc,
            }) as any,
            CollaborationCursor.configure({
                provider: provider as any,
                user: {
                    name: userInfo.name,
                    color: userInfo.color || getRandomColor(),
                },
            }) as any,
        ];
    }, [doc, provider, userInfo, dealId]);

    // Show loading state if not ready
    if (!doc || !provider || !userInfo) {
        return (
            <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <HexagonSpinner size={32} className="text-orange" />
                    <p className="text-xs text-charcoal/50">Connecting to Hive...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full ${className}`}>
            {/* Collaboration Header / Status */}
            <div className="fixed top-3 right-6 flex items-center gap-3 z-10">
                {/* 1. Save Status (DB) */}
                <div className="flex items-center space-x-2 text-xs font-medium text-charcoal/50">
                    <StatusIcon status={status} />
                    <span>{status}</span>
                </div>
                {/* 2. Active Users (Real-time) */}
                <ActiveUsers />
            </div>

            <EditorRoot>
                <EditorContent
                    initialContent={undefined} // Tiptap syncs from Yjs, so initialContent is handled by Yjs provider predominantly. But for first load? Liveblocks syncs it.
                    // Important: When using Collaboration, initialContent on EditorContent is usually ignored if Yjs has content.
                    extensions={collabExtensions as any}
                    editorProps={{
                        attributes: {
                            class: `prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:text-charcoal dark:prose-headings:text-cultured-white focus:outline-none max-w-none min-h-[calc(100vh-200px)] px-24 py-2`,
                        },
                        handleDOMEvents: {
                            keydown: (_view, _event) => {
                                return false;
                            },
                        },
                    }}
                    onUpdate={({ editor }) => {
                        const json = editor.getJSON();
                        // Hybrid Sync: We still save to DB via tRPC for persistence/backups
                        // This might be redundant if we use Liveblocks storage, but per plan, we keep it.
                        updateContent(json);
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
