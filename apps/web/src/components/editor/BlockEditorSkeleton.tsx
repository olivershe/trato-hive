
export function BlockEditorSkeleton() {
    return (
        <div className="w-full max-w-screen-lg mx-auto p-12 bg-white dark:bg-surface-dark border border-gold/10 rounded-xl shadow-sm h-[500px]">
            <div className="animate-pulse space-y-8">
                {/* Title */}
                <div className="h-10 bg-gray-200 dark:bg-white/5 rounded w-3/4 mb-8"></div>

                {/* Paragraphs */}
                <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-full"></div>
                </div>

                {/* Card Placeholder */}
                <div className="h-32 bg-gray-100 dark:bg-white/5 rounded-lg border border-gold/10"></div>

                {/* List */}
                <div className="space-y-3 pl-4">
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    );
}
