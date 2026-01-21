/**
 * PropertyRow Component
 *
 * Notion-style property row with icon, label, and inline editable value.
 * Used in DealPropertiesPanel and other property displays.
 *
 * Phase 12: Deals Database Architecture Migration
 */
"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PropertyRowProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}

export function PropertyRow({ icon: Icon, label, children, className = "" }: PropertyRowProps) {
  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-bone/50 transition-colors ${className}`}>
      <div className="flex items-center gap-2 min-w-[140px] text-charcoal/60">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
