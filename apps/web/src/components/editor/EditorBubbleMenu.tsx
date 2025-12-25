
"use client";

import { BubbleMenu, BubbleMenuProps, isNodeSelection } from "@tiptap/react";
import { type Editor } from "@tiptap/core";
import { Bold, Italic, Strikethrough, Code, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HexagonSpinner } from "../ui/HexagonSpinner";

interface EditorBubbleMenuProps extends Omit<BubbleMenuProps, "editor"> {
    editor: Editor;
}

export function EditorBubbleMenu({ editor, ...props }: EditorBubbleMenuProps) {
    const [isAIActive, setIsAIActive] = useState(false);

    if (!editor) return null;

    // Design Tokens mapping (approximate based on Soft Sand/Gold theme)
    // bg-alabaster/90 (backdrop blur)
    // border-gold/20
    // shadow-lg

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{
                duration: 100,
                animation: 'shift-away',
                zIndex: 99999,
            }}
            shouldShow={({ editor, view, state, from, to }) => {
                const { doc, selection } = state;
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
                {!isAIActive ? (
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
                            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-gold/10 hover:text-charcoal active:bg-gold/20 dark:text-cultured-white dark:hover:bg-white/10 transition-colors"
                        >
                            <Sparkles className="h-3 w-3 text-gold" />
                            Ask AI
                        </button>

                        <div className="mx-1 h-4 w-px bg-charcoal/10 dark:bg-white/10" />

                        <MenuButton
                            isActive={editor.isActive("bold")}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            icon={<Bold className="h-3 w-3" />}
                        />
                        <MenuButton
                            isActive={editor.isActive("italic")}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            icon={<Italic className="h-3 w-3" />}
                        />
                        <MenuButton
                            isActive={editor.isActive("strike")}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            icon={<Strikethrough className="h-3 w-3" />}
                        />
                        <MenuButton
                            isActive={editor.isActive("code")}
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            icon={<Code className="h-3 w-3" />}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="ai-input"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center gap-2 px-2"
                    >
                        <div className="flex items-center justify-center w-5 h-5">
                            <HexagonSpinner size={20} />
                        </div>
                        <input
                            autoFocus
                            placeholder="Ask AI to edit..."
                            className="h-6 min-w-[200px] bg-transparent text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none dark:text-cultured-white dark:placeholder:text-white/40"
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

function MenuButton({
    isActive,
    onClick,
    icon,
}: {
    isActive: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full p-2 transition-colors ${isActive
                ? "bg-charcoal text-white dark:bg-white dark:text-charcoal"
                : "text-charcoal hover:bg-gold/10 dark:text-cultured-white dark:hover:bg-white/10"
                }`}
        >
            {icon}
        </button>
    );
}
