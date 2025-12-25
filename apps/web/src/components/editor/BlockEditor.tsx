"use client";

import { useState } from "react";
import { EditorRoot, EditorContent, JSONContent } from "novel";
import { defaultExtensions } from "./extensions";
import { slashCommand } from "./SlashCommand";

const extensions = [...defaultExtensions, slashCommand];

interface BlockEditorProps {
    initialContent?: JSONContent;
    onChange?: (content: JSONContent) => void;
    className?: string;
    editable?: boolean;
}

export function BlockEditor({
    initialContent,
    onChange,
    className,
    editable = true,
}: BlockEditorProps) {
    const [content, setContent] = useState<JSONContent | undefined>(initialContent);

    return (
        <div className={`relative w-full max-w-screen-lg ${className}`}>
            <EditorRoot>
                <EditorContent
                    initialContent={content}
                    extensions={extensions}
                    editorProps={{
                        attributes: {
                            class: `prose prose-lg dark:prose-invert prose-headings:font-serif prose-headings:text-charcoal dark:prose-headings:text-cultured-white focus:outline-none max-w-full min-h-[500px] p-12 bg-white dark:bg-surface-dark border border-gold/10 rounded-xl shadow-sm`,
                        },
                        handleDOMEvents: {
                            keydown: (_view, _event) => {
                                return false;
                            },
                        },
                    }}
                    onUpdate={({ editor }) => {
                        const json = editor.getJSON();
                        setContent(json);
                        if (onChange) {
                            onChange(json);
                        }
                    }}
                    editable={editable}
                >
                </EditorContent>
            </EditorRoot>
        </div>
    );
}
