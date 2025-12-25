"use client";

import { useState, useEffect } from "react";
import { EditorRoot, EditorContent, JSONContent } from "novel";
import { defaultExtensions } from "./extensions";
import { slashCommand } from "./SlashCommand";
import { useBlockSync, type SaveStatus } from "../../hooks/useBlockSync";
import { CheckCircle2, Cloud, AlertCircle, Loader2 } from "lucide-react";

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
                    editable={editable}
                >
                </EditorContent>
            </EditorRoot>
        </div>
    );
}

function StatusIcon({ status }: { status: SaveStatus }) {
    switch (status) {
        case "Saved":
            return <CheckCircle2 className="w-3 h-3 text-green-500" />;
        case "Saving...":
            return <Loader2 className="w-3 h-3 animate-spin text-orange" />;
        case "Error":
            return <AlertCircle className="w-3 h-3 text-red-500" />;
        case "Unsaved":
            return <Cloud className="w-3 h-3 text-charcoal/50" />;
    }
}
