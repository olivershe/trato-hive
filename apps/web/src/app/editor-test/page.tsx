"use client";

import { BlockEditor } from "@/components/editor/BlockEditor";

export default function EditorTestPage() {
    return (
        <div className="min-h-screen bg-bone dark:bg-deep-grey p-8 md:p-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="space-y-2">
                    <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-cultured-white">
                        Editor Core Canvas
                    </h1>
                    <p className="text-sm font-sans uppercase tracking-[0.2em] text-orange font-semibold">
                        The Intelligent Hive v2.0
                    </p>
                </header>

                <section className="bg-alabaster dark:bg-surface-dark p-1 rounded-2xl shadow-xl border border-gold/10 overflow-hidden">
                    <BlockEditor
                        className="w-full"
                        onChange={(content) => console.log("Editor Update:", content)}
                    />
                </section>

                <footer className="text-xs text-charcoal/50 dark:text-cultured-white/50 font-mono">
                    Task ID: [TASK-015] | Headless Novel/Tiptap Wrapper | Mode: Verification
                </footer>
            </div>
        </div>
    );
}
