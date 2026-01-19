// @ts-nocheck - Tiptap v2/v3 type mismatch (known issue with Novel)
"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import { type Editor } from "@tiptap/core";
import { Bold, Italic, Strikethrough, Code, Sparkles, Link2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HexagonSpinner } from "../ui/HexagonSpinner";
import { useLinkPopover } from "@/components/tiptap-ui/link-popover";

interface EditorBubbleMenuProps {
    editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
    const [isAIActive, setIsAIActive] = useState(false);
    const [isLinkActive, setIsLinkActive] = useState(false);
    const linkInputRef = useRef<HTMLInputElement>(null);

    const {
        url,
        setUrl,
        setLink,
        removeLink,
        isActive: hasLink,
    } = useLinkPopover({ editor });

    // Focus input when link mode activates
    useEffect(() => {
        if (isLinkActive && linkInputRef.current) {
            linkInputRef.current.focus();
        }
    }, [isLinkActive]);

    if (!editor) return null;

    // Design Tokens mapping (approximate based on Soft Sand/Gold theme)
    // bg-alabaster/90 (backdrop blur)
    // border-gold/20
    // shadow-lg

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={() => {
                // In Tiptap v3, check selection via editor state
                const { selection } = editor.state;
                const { empty } = selection;

                // Don't show on empty selection
                if (empty) return false;

                // Don't show on image selection (if managed by NodeView)
                if (editor.isActive("image")) return false;

                // Don't show if drag handle is active (implicit) or other modes
                return true;
            }}
            className="flex w-fit max-w-[90vw] overflow-hidden rounded-full border border-gold/20 bg-alabaster/80 p-1 shadow-xl backdrop-blur-md dark:bg-charcoal/80 dark:border-white/10"
        >
            <AnimatePresence mode="wait">
                {!isAIActive && !isLinkActive ? (
                    <motion.div
                        key="formatting"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="flex items-center gap-1"
                    >
                        {/* Ask AI Button */}
                        <button
                            onClick={() => setIsAIActive(true)}
                            aria-label="Ask AI"
                            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold/10 hover:text-charcoal active:bg-gold/20 dark:text-cultured-white dark:hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                        >
                            <Sparkles className="h-3 w-3 text-gold" aria-hidden="true" />
                            Ask AI
                        </button>

                        <div className="mx-1 h-4 w-px bg-charcoal/10 dark:bg-white/10" />

                        <BubbleButton
                            onClick={() => (editor.chain().focus() as any).toggleBold().run()}
                            isActive={editor.isActive("bold")}
                            aria-label="Bold"
                        >
                            <Bold className="w-4 h-4" aria-hidden="true" />
                        </BubbleButton>
                        <BubbleButton
                            onClick={() => (editor.chain().focus() as any).toggleItalic().run()}
                            isActive={editor.isActive("italic")}
                            aria-label="Italic"
                        >
                            <Italic className="w-4 h-4" aria-hidden="true" />
                        </BubbleButton>
                        <BubbleButton
                            onClick={() => (editor.chain().focus() as any).toggleStrike().run()}
                            isActive={editor.isActive("strike")}
                            aria-label="Strikethrough"
                        >
                            <Strikethrough className="w-4 h-4" aria-hidden="true" />
                        </BubbleButton>
                        <BubbleButton
                            onClick={() => (editor.chain().focus() as any).toggleCode().run()}
                            isActive={editor.isActive("code")}
                            aria-label="Code"
                        >
                            <Code className="w-4 h-4" aria-hidden="true" />
                        </BubbleButton>
                        <BubbleButton
                            onClick={() => setIsLinkActive(true)}
                            isActive={hasLink}
                            aria-label="Link"
                        >
                            <Link2 className="w-4 h-4" aria-hidden="true" />
                        </BubbleButton>
                    </motion.div>
                ) : isLinkActive ? (
                    <motion.div
                        key="link-input"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center gap-2 px-2"
                    >
                        <Link2 className="h-4 w-4 text-charcoal/60 dark:text-white/60" aria-hidden="true" />
                        <input
                            ref={linkInputRef}
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste a link…"
                            aria-label="URL"
                            className="h-6 min-w-[200px] bg-transparent text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold dark:text-cultured-white dark:placeholder:text-white/40"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    setLink();
                                    setIsLinkActive(false);
                                }
                                if (e.key === "Escape") {
                                    setIsLinkActive(false);
                                    editor.chain().focus().run();
                                }
                            }}
                        />
                        {hasLink && (
                            <button
                                onClick={() => {
                                    removeLink();
                                    setIsLinkActive(false);
                                }}
                                aria-label="Remove link"
                                className="rounded-full p-1 text-red-500 hover:bg-red-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="ai-input"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center gap-2 px-2"
                    >
                        <div className="flex items-center justify-center w-5 h-5" aria-hidden="true">
                            <HexagonSpinner size={20} />
                        </div>
                        <input
                            autoFocus
                            placeholder="Ask AI to edit…"
                            aria-label="AI prompt"
                            className="h-6 min-w-[200px] bg-transparent text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold dark:text-cultured-white dark:placeholder:text-white/40"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    // Stub for AI action
                                    setIsAIActive(false);
                                    editor.chain().focus().run();
                                }
                                if (e.key === "Escape") {
                                    setIsAIActive(false);
                                    editor.chain().focus().run();
                                }
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </BubbleMenu>
    );
}

function BubbleButton({
    isActive,
    onClick,
    children,
    "aria-label": ariaLabel,
}: {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    "aria-label": string;
}) {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            aria-pressed={isActive}
            className={`rounded-full p-2 transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ${isActive
                ? "bg-charcoal text-white dark:bg-white dark:text-charcoal"
                : "text-charcoal hover:bg-gold/10 dark:text-cultured-white dark:hover:bg-white/10"
                }`}
        >
            {children}
        </button>
    );
}
