'use client';

import { Check, X, RefreshCw, Loader2 } from 'lucide-react';

interface AIGenerationToolbarProps {
  isGenerating: boolean;
  isComplete: boolean;
  error: string | null;
  progress: {
    currentSection: number;
    totalSections: number;
    blocksInserted: number;
    databasesCreated: number;
  } | null;
  onAccept: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
}

export function AIGenerationToolbar({
  isGenerating,
  isComplete,
  error,
  progress,
  onAccept,
  onDiscard,
  onRegenerate,
}: AIGenerationToolbarProps) {
  if (!isGenerating && !isComplete) return null;

  return (
    <div className="sticky bottom-4 z-40 mx-auto w-fit">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl shadow-lg border border-charcoal/10">
        {/* Progress indicator */}
        {isGenerating && progress && (
          <div className="flex items-center gap-2 text-sm text-charcoal/60">
            <Loader2 className="w-4 h-4 animate-spin text-orange" />
            <span>
              Section {progress.currentSection + 1} of{' '}
              {progress.totalSections}
            </span>
            <span className="text-charcoal/30">·</span>
            <span>{progress.blocksInserted} blocks</span>
            {progress.databasesCreated > 0 && (
              <>
                <span className="text-charcoal/30">·</span>
                <span>{progress.databasesCreated} databases</span>
              </>
            )}
          </div>
        )}

        {/* Initial loading — before outline arrives */}
        {isGenerating && !progress && (
          <div className="flex items-center gap-2 text-sm text-charcoal/60">
            <Loader2 className="w-4 h-4 animate-spin text-orange" />
            <span>Generating...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}

        {/* Completion message */}
        {isComplete && !error && !isGenerating && (
          <span className="text-sm text-charcoal/60">
            Generation complete
          </span>
        )}

        {/* Divider */}
        {(isComplete || error) && (
          <div className="w-px h-5 bg-charcoal/10" />
        )}

        {/* Actions */}
        {(isComplete || error) && (
          <div className="flex items-center gap-1">
            <button
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Accept
            </button>
            <button
              onClick={onDiscard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-charcoal/60 bg-charcoal/5 rounded-lg hover:bg-charcoal/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>
        )}

        {/* Cancel while generating */}
        {isGenerating && (
          <>
            <div className="w-px h-5 bg-charcoal/10" />
            <button
              onClick={onDiscard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-charcoal/50 hover:text-charcoal/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
