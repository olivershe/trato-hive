/**
 * SyncedBlockWrapper
 *
 * Visual wrapper for synced blocks showing sync status indicator.
 * Used to highlight blocks that are synced across multiple pages.
 */
"use client";

import { useState } from "react";
import { Link2, Link2Off, Copy, ExternalLink } from "lucide-react";
import { api } from "@/trpc/react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

interface SyncedBlockWrapperProps {
  children: React.ReactNode;
  blockId: string;
  syncGroupId: string | null | undefined;
  onSyncGroupChange?: (newSyncGroupId: string | null) => void;
}

export function SyncedBlockWrapper({
  children,
  blockId,
  syncGroupId,
  onSyncGroupChange,
}: SyncedBlockWrapperProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get synced blocks count
  const { data: syncedBlocks } = api.syncGroup.getBlocks.useQuery(
    { syncGroupId: syncGroupId! },
    { enabled: !!syncGroupId }
  );

  // Mutations
  const utils = api.useUtils();

  const createSyncGroup = api.syncGroup.create.useMutation({
    onSuccess: (data) => {
      onSyncGroupChange?.(data.syncGroupId);
      utils.syncGroup.getBlocks.invalidate();
    },
  });

  const unlinkFromSync = api.syncGroup.unlink.useMutation({
    onSuccess: () => {
      onSyncGroupChange?.(null);
      utils.syncGroup.getBlocks.invalidate();
    },
  });

  const syncCount = syncedBlocks?.length ?? 0;
  const isSynced = !!syncGroupId && syncCount > 1;

  if (!syncGroupId && !isHovered) {
    // Not synced and not hovered - just render children
    return <>{children}</>;
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sync indicator */}
      {isSynced && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 z-10">
          <Tippy
            content={
              <div className="text-xs p-1">
                <div className="font-medium">Synced Block</div>
                <div className="text-white/70">
                  Synced to {syncCount} location{syncCount !== 1 ? "s" : ""}
                </div>
              </div>
            }
            theme="dark"
          >
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-full text-[10px] font-medium cursor-default">
              <Link2 className="w-3 h-3" />
              <span>{syncCount}</span>
            </div>
          </Tippy>
        </div>
      )}

      {/* Sync border indicator */}
      <div
        className={`${
          isSynced
            ? "border-l-2 border-violet-400 pl-3"
            : ""
        }`}
      >
        {children}
      </div>

      {/* Hover actions */}
      {isHovered && (
        <div className="absolute -right-2 top-0 translate-x-full z-10 flex flex-col gap-1">
          {!syncGroupId ? (
            <Tippy content="Enable sync for this block" theme="dark">
              <button
                onClick={() => createSyncGroup.mutate({ blockId })}
                className="p-1.5 bg-white rounded-lg shadow-md border border-gold/20 text-charcoal/60 hover:text-violet-600 hover:border-violet-300 transition-colors"
                disabled={createSyncGroup.isPending}
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
            </Tippy>
          ) : (
            <>
              <Tippy content="Unlink from sync group" theme="dark">
                <button
                  onClick={() => unlinkFromSync.mutate({ blockId })}
                  className="p-1.5 bg-white rounded-lg shadow-md border border-gold/20 text-charcoal/60 hover:text-red-500 hover:border-red-300 transition-colors"
                  disabled={unlinkFromSync.isPending}
                >
                  <Link2Off className="w-3.5 h-3.5" />
                </button>
              </Tippy>
              {syncCount > 1 && (
                <Tippy content="View synced locations" theme="dark">
                  <button
                    className="p-1.5 bg-white rounded-lg shadow-md border border-gold/20 text-charcoal/60 hover:text-violet-600 hover:border-violet-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </Tippy>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Copy synced block button - for inserting synced copy to another page
 */
interface CopySyncedBlockButtonProps {
  syncGroupId: string | null | undefined;
}

export function CopySyncedBlockButton({
  syncGroupId,
}: CopySyncedBlockButtonProps) {
  if (!syncGroupId) return null;

  return (
    <Tippy content="Copy synced block to another page" theme="dark">
      <button
        className="p-1.5 bg-violet-50 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </Tippy>
  );
}
