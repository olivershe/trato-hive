'use client';

import type { GeneratedBlockType } from '@trato-hive/ai-core';

interface AIGenerationSkeletonProps {
  sections: { title: string; blockTypes: GeneratedBlockType[] }[];
  currentSection: number;
}

export function AIGenerationSkeleton({
  sections,
  currentSection,
}: AIGenerationSkeletonProps) {
  return (
    <div className="px-24 py-4 space-y-6">
      {sections.map((section, index) => {
        const isCompleted = index < currentSection;
        const isActive = index === currentSection;
        const isPending = index > currentSection;

        if (isCompleted) return null;

        return (
          <div
            key={index}
            className={`space-y-3 transition-opacity duration-300 ${
              isPending ? 'opacity-30' : 'opacity-100'
            }`}
          >
            {/* Section title skeleton */}
            <div className="flex items-center gap-2">
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
              )}
              <div
                className={`h-6 rounded ${
                  isActive
                    ? 'bg-orange/20 animate-pulse'
                    : 'bg-charcoal/10'
                }`}
                style={{ width: `${Math.min(section.title.length * 10, 300)}px` }}
              />
            </div>

            {/* Block type skeletons */}
            {section.blockTypes.map((blockType, bIndex) => (
              <SkeletonBlock
                key={bIndex}
                type={blockType}
                isActive={isActive}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function SkeletonBlock({
  type,
  isActive,
}: {
  type: GeneratedBlockType;
  isActive: boolean;
}) {
  const pulseClass = isActive ? 'animate-pulse' : '';
  const bgClass = isActive ? 'bg-charcoal/8' : 'bg-charcoal/5';

  switch (type) {
    case 'heading':
      return <div className={`h-5 w-48 rounded ${bgClass} ${pulseClass}`} />;

    case 'paragraph':
      return (
        <div className="space-y-1.5">
          <div className={`h-3.5 w-full rounded ${bgClass} ${pulseClass}`} />
          <div className={`h-3.5 w-4/5 rounded ${bgClass} ${pulseClass}`} />
          <div className={`h-3.5 w-3/5 rounded ${bgClass} ${pulseClass}`} />
        </div>
      );

    case 'bulletList':
    case 'orderedList':
      return (
        <div className="space-y-1.5 pl-4">
          <div className={`h-3.5 w-3/4 rounded ${bgClass} ${pulseClass}`} />
          <div className={`h-3.5 w-2/3 rounded ${bgClass} ${pulseClass}`} />
          <div className={`h-3.5 w-1/2 rounded ${bgClass} ${pulseClass}`} />
        </div>
      );

    case 'table':
    case 'database':
      return (
        <div className={`h-32 w-full rounded-lg border border-charcoal/10 ${bgClass} ${pulseClass}`} />
      );

    case 'divider':
      return <div className={`h-px w-full ${bgClass}`} />;

    case 'blockquote':
    case 'callout':
      return (
        <div className={`h-16 w-full rounded-lg border-l-4 border-charcoal/15 ${bgClass} ${pulseClass}`} />
      );

    default:
      return <div className={`h-3.5 w-full rounded ${bgClass} ${pulseClass}`} />;
  }
}
