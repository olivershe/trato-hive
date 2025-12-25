export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-bone text-charcoal">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-bold text-orange">The Intelligent Hive</h1>
            </div>

            <div className="mt-12 p-8 bg-alabaster rounded-lg shadow-lg border border-gold/20 max-w-2xl">
                <p className="text-lg leading-relaxed">
                    Welcome to the next generation of M&A deal execution.
                    Your environment is now configured with <span className="text-orange font-semibold">Novel</span> and <span className="text-orange font-semibold">Tiptap</span>.
                </p>
                <div className="mt-6 flex gap-4">
                    <div className="px-4 py-2 bg-orange text-white rounded font-medium">Get Started</div>
                    <div className="px-4 py-2 border border-charcoal rounded font-medium">View Portfolio</div>
                </div>
            </div>
        </main>
    );
}
