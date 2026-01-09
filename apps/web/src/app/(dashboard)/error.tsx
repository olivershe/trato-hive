"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-charcoal mb-2">
            Something went wrong
          </h2>
          <p className="text-charcoal/60 text-sm">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="
              flex items-center gap-2 px-4 py-2
              bg-orange text-white rounded-lg
              hover:bg-orange/90 transition-colors
            "
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="
              flex items-center gap-2 px-4 py-2
              bg-alabaster border border-gold/20 text-charcoal rounded-lg
              hover:bg-bone transition-colors
            "
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-charcoal/40 mt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
