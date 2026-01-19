"use client";

/**
 * DealQuickActions - Hover card with quick actions and keyboard shortcuts
 *
 * [TASK-121] Deal Quick Actions
 *
 * Shows on hover over deal cards with:
 * - Open (O) - Navigate to deal page
 * - Update Stage (S) - Sub-menu with stage selection
 * - Add Company (C) - Placeholder for future implementation
 *
 * Supports keyboard navigation and optimistic updates.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ArrowRightCircle,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Stage options for quick update
const STAGES = [
  { id: "SOURCING", label: "Sourcing" },
  { id: "DILIGENCE", label: "Due Diligence" },
  { id: "CLOSING", label: "Closing" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

interface DealQuickActionsProps {
  dealId: string;
  currentStage: StageId;
  onStageChange: (stage: StageId) => void;
  onClose?: () => void;
}

export function DealQuickActions({
  dealId,
  currentStage,
  onStageChange,
  onClose,
}: DealQuickActionsProps) {
  const router = useRouter();
  const [showStageMenu, setShowStageMenu] = useState(false);
  const [selectedStageIndex, setSelectedStageIndex] = useState(
    STAGES.findIndex((s) => s.id === currentStage)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "o":
          e.preventDefault();
          router.push(`/deals/${dealId}`);
          break;
        case "s":
          e.preventDefault();
          setShowStageMenu(true);
          break;
        case "c":
          e.preventDefault();
          // TODO: Implement Add Company modal
          break;
        case "escape":
          e.preventDefault();
          if (showStageMenu) {
            setShowStageMenu(false);
          } else {
            onClose?.();
          }
          break;
        case "arrowup":
          if (showStageMenu) {
            e.preventDefault();
            setSelectedStageIndex((prev) =>
              prev > 0 ? prev - 1 : STAGES.length - 1
            );
          }
          break;
        case "arrowdown":
          if (showStageMenu) {
            e.preventDefault();
            setSelectedStageIndex((prev) =>
              prev < STAGES.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case "enter":
          if (showStageMenu) {
            e.preventDefault();
            const stage = STAGES[selectedStageIndex];
            if (stage && stage.id !== currentStage) {
              onStageChange(stage.id);
            }
            setShowStageMenu(false);
          }
          break;
      }
    },
    [dealId, router, showStageMenu, selectedStageIndex, currentStage, onStageChange, onClose]
  );

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close stage menu on outside click
  useEffect(() => {
    if (!showStageMenu) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowStageMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStageMenu]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-charcoal/80 dark:bg-black/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2">
        {/* Open Deal */}
        <button
          onClick={() => router.push(`/deals/${dealId}`)}
          className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Open deal (O)"
        >
          <ExternalLink className="w-5 h-5 text-white" />
          <span className="text-[10px] text-white/70">Open</span>
          <kbd className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded text-white/80">
            O
          </kbd>
        </button>

        {/* Update Stage */}
        <div className="relative">
          <button
            onClick={() => setShowStageMenu(!showStageMenu)}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
              showStageMenu
                ? "bg-orange/80 hover:bg-orange"
                : "bg-white/10 hover:bg-white/20"
            )}
            title="Update stage (S)"
          >
            <ArrowRightCircle className="w-5 h-5 text-white" />
            <span className="text-[10px] text-white/70">Stage</span>
            <kbd className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded text-white/80">
              S
            </kbd>
          </button>

          {/* Stage Sub-menu */}
          {showStageMenu && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[140px] z-20">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 border-b border-gold/10">
                Move to
              </div>
              {STAGES.map((stage, index) => (
                <button
                  key={stage.id}
                  onClick={() => {
                    if (stage.id !== currentStage) {
                      onStageChange(stage.id);
                    }
                    setShowStageMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                    stage.id === currentStage
                      ? "text-charcoal/40 dark:text-cultured-white/40 cursor-not-allowed"
                      : index === selectedStageIndex
                        ? "bg-orange/10 text-orange"
                        : "text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50"
                  )}
                  disabled={stage.id === currentStage}
                >
                  <span>{stage.label}</span>
                  {stage.id === currentStage && (
                    <span className="text-[10px] text-charcoal/40 dark:text-cultured-white/40">
                      Current
                    </span>
                  )}
                  {index === selectedStageIndex && stage.id !== currentStage && (
                    <ChevronRight className="w-3.5 h-3.5 text-orange" />
                  )}
                </button>
              ))}
              <div className="px-2 py-1 mt-1 border-t border-gold/10 text-[10px] text-charcoal/40 dark:text-cultured-white/40">
                Use ↑↓ arrows, Enter to select
              </div>
            </div>
          )}
        </div>

        {/* Add Company (placeholder) */}
        <button
          onClick={() => {
            // TODO: Implement Add Company modal
          }}
          className="flex flex-col items-center gap-1 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors opacity-50 cursor-not-allowed"
          title="Add company (C) - Coming soon"
          disabled
        >
          <Building2 className="w-5 h-5 text-white" />
          <span className="text-[10px] text-white/70">Company</span>
          <kbd className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded text-white/80">
            C
          </kbd>
        </button>
      </div>
    </div>
  );
}

export default DealQuickActions;
