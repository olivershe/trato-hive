/**
 * QuickActionCard Component
 *
 * A clickable card that represents a quick action for the Hive Copilot.
 * Clicking injects a pre-defined prompt into the chat.
 */
import { type LucideIcon } from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  prompt: string;
}

interface QuickActionCardProps {
  action: QuickAction;
  onClick: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickActionCard({ action, onClick, disabled }: QuickActionCardProps) {
  const { label, icon: Icon, prompt } = action;

  return (
    <button
      onClick={() => onClick(prompt)}
      disabled={disabled}
      className="flex items-center gap-4 p-4 bg-alabaster rounded-xl border border-charcoal/10 hover:border-charcoal/20 hover:bg-bone transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-alabaster disabled:hover:border-charcoal/10"
    >
      <div className="w-12 h-12 rounded-lg border border-charcoal/10 flex items-center justify-center flex-shrink-0 bg-alabaster">
        <Icon className="w-6 h-6 text-charcoal/60" aria-hidden="true" />
      </div>
      <span className="font-medium text-charcoal">{label}</span>
    </button>
  );
}
