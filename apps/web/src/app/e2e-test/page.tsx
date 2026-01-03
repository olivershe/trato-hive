"use client";

import { SimpleEditor } from "@/components/editor/SimpleEditor";

/**
 * E2E Test Page - Standalone editor for Playwright testing
 * This page uses SimpleEditor which does NOT require Liveblocks connection,
 * making it suitable for automated E2E testing.
 */
export default function E2ETestPage() {
    return (
        <div className="min-h-screen bg-bone dark:bg-deep-grey p-8 md:p-24" data-testid="e2e-test-page">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="space-y-2">
                    <h1 className="text-4xl font-serif font-bold text-charcoal dark:text-cultured-white">
                        E2E Test Editor
                    </h1>
                    <p className="text-sm font-sans uppercase tracking-[0.2em] text-orange font-semibold">
                        Standalone Testing Canvas
                    </p>
                </header>

                <section className="bg-alabaster dark:bg-surface-dark p-1 rounded-2xl shadow-xl border border-gold/10 overflow-hidden">
                    <SimpleEditor
                        className="w-full"
                        initialContent={{
                            type: "doc",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        { type: "text", text: "Start typing here..." }
                                    ]
                                }
                            ]
                        }}
                    />
                </section>

                <footer className="text-xs text-charcoal/50 dark:text-cultured-white/50 font-mono">
                    Task ID: [TASK-023] | E2E Testing Route | No Liveblocks Required
                </footer>
            </div>
        </div>
    );
}
