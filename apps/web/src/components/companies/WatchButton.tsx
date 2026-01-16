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

/**
 * Reusable watch button component for company pages
 *
 * [TASK-107] Watch Button Component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <WatchButton companyId={company.id} />
 *
 * // Small size without label
 * <WatchButton companyId={company.id} size="sm" showLabel={false} />
 *
 * // Large size with custom class
 * <WatchButton companyId={company.id} size="lg" className="my-4" />
 * ```
 */
export function WatchButton({
  companyId,
  size = 'md',
  showLabel = true,
  className,
}: WatchButtonProps) {
  const { isWatched, isLoading, toggleWatch } = useWatch(companyId);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={toggleWatch}
      disabled={isLoading}
      className={cn(
        'flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50',
        sizeClasses[size],
        isWatched
          ? 'bg-orange/10 text-orange border border-orange/30 hover:bg-orange/20'
          : 'bg-alabaster dark:bg-panel-dark text-charcoal/70 dark:text-cultured-white/70 border border-gold/20 hover:bg-bone dark:hover:bg-panel-darker',
        className
      )}
      title={isWatched ? 'Remove from watch list' : 'Add to watch list'}
    >
      {isLoading ? (
        <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
      ) : isWatched ? (
        <Eye className={iconSizes[size]} />
      ) : (
        <EyeOff className={iconSizes[size]} />
      )}
      {showLabel && (isWatched ? 'Watching' : 'Watch')}
    </button>
  );
}
