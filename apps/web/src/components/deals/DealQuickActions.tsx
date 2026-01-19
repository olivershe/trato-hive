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
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ArrowRightCircle,
  Building2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: "SOURCING", label: "Sourcing" },
  { id: "DILIGENCE", label: "Due Diligence" },
  { id: "CLOSING", label: "Closing" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut: string;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}

function ActionButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  title,
  active = false,
  disabled = false,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        active ? "bg-orange/80 hover:bg-orange" : "bg-white/10 hover:bg-white/20"
      )}
      title={title}
    >
      <Icon className="w-5 h-5 text-white" />
      <span className="text-[10px] text-white/70">{label}</span>
      <kbd className="px-1.5 py-0.5 text-[9px] bg-white/20 rounded text-white/80">
        {shortcut}
      </kbd>
    </button>
  );
}

function getStageButtonClassName(
  isCurrent: boolean,
  isSelected: boolean
): string {
  if (isCurrent) {
    return "text-charcoal/40 dark:text-cultured-white/40 cursor-not-allowed";
  }
  if (isSelected) {
    return "bg-orange/10 text-orange";
  }
  return "text-charcoal dark:text-cultured-white hover:bg-alabaster dark:hover:bg-charcoal/50";
}

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

  const navigateToDeal = useCallback(() => {
    router.push(`/deals/${dealId}`);
  }, [router, dealId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === "o") {
        e.preventDefault();
        navigateToDeal();
        return;
      }

      if (key === "s") {
        e.preventDefault();
        setShowStageMenu(true);
        return;
      }

      if (key === "escape") {
        e.preventDefault();
        if (showStageMenu) {
          setShowStageMenu(false);
        } else {
          onClose?.();
        }
        return;
      }

      if (!showStageMenu) return;

      if (key === "arrowup") {
        e.preventDefault();
        setSelectedStageIndex((prev) => (prev > 0 ? prev - 1 : STAGES.length - 1));
      } else if (key === "arrowdown") {
        e.preventDefault();
        setSelectedStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : 0));
      } else if (key === "enter") {
        e.preventDefault();
        const stage = STAGES[selectedStageIndex];
        if (stage && stage.id !== currentStage) {
          onStageChange(stage.id);
        }
        setShowStageMenu(false);
      }
    },
    [navigateToDeal, showStageMenu, selectedStageIndex, currentStage, onStageChange, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!showStageMenu) return;

    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowStageMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStageMenu]);

  function handleStageSelect(stageId: StageId): void {
    if (stageId !== currentStage) {
      onStageChange(stageId);
    }
    setShowStageMenu(false);
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-charcoal/80 dark:bg-black/80 backdrop-blur-sm rounded-md flex items-center justify-center z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2">
        <ActionButton
          icon={ExternalLink}
          label="Open"
          shortcut="O"
          onClick={navigateToDeal}
          title="Open deal (O)"
        />

        <div className="relative">
          <ActionButton
            icon={ArrowRightCircle}
            label="Stage"
            shortcut="S"
            onClick={() => setShowStageMenu(!showStageMenu)}
            title="Update stage (S)"
            active={showStageMenu}
          />

          {showStageMenu && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-deep-grey border border-gold/20 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[140px] z-20">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-charcoal/50 dark:text-cultured-white/50 border-b border-gold/10">
                Move to
              </div>
              {STAGES.map((stage, index) => {
                const isCurrent = stage.id === currentStage;
                const isSelected = index === selectedStageIndex;

                return (
                  <button
                    key={stage.id}
                    onClick={() => handleStageSelect(stage.id)}
                    disabled={isCurrent}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                      getStageButtonClassName(isCurrent, isSelected)
                    )}
                  >
                    <span>{stage.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] text-charcoal/40 dark:text-cultured-white/40">
                        Current
                      </span>
                    )}
                    {isSelected && !isCurrent && (
                      <ChevronRight className="w-3.5 h-3.5 text-orange" />
                    )}
                  </button>
                );
              })}
              <div className="px-2 py-1 mt-1 border-t border-gold/10 text-[10px] text-charcoal/40 dark:text-cultured-white/40">
                Use arrow keys, Enter to select
              </div>
            </div>
          )}
        </div>

        <ActionButton
          icon={Building2}
          label="Company"
          shortcut="C"
          onClick={() => {}}
          title="Add company (C) - Coming soon"
          disabled
        />
      </div>
    </div>
  );
}

export default DealQuickActions;
