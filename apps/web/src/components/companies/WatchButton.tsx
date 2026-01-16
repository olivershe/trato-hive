'use client';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useWatch } from '@/hooks/useWatch';
import { cn } from '@/lib/utils';

export interface WatchButtonProps {
  companyId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
} as const;

const ICON_SIZES = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const;

/**
 * Reusable watch button component for company pages
 * [TASK-107]
 */
export function WatchButton({
  companyId,
  size = 'md',
  showLabel = true,
  className,
}: WatchButtonProps) {
  const { isWatched, isLoading, toggleWatch } = useWatch(companyId);
  const iconClass = ICON_SIZES[size];

  function renderIcon() {
    if (isLoading) {
      return <Loader2 className={cn(iconClass, 'animate-spin')} />;
    }
    if (isWatched) {
      return <Eye className={iconClass} />;
    }
    return <EyeOff className={iconClass} />;
  }

  const buttonStyles = isWatched
    ? 'bg-orange/10 text-orange border border-orange/30 hover:bg-orange/20'
    : 'bg-alabaster dark:bg-panel-dark text-charcoal/70 dark:text-cultured-white/70 border border-gold/20 hover:bg-bone dark:hover:bg-panel-darker';

  return (
    <button
      onClick={toggleWatch}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50',
        SIZE_CLASSES[size],
        buttonStyles,
        className
      )}
      title={isWatched ? 'Remove from watch list' : 'Add to watch list'}
    >
      {renderIcon()}
      {showLabel && (isWatched ? 'Watching' : 'Watch')}
    </button>
  );
}
