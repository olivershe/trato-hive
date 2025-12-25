"use client";

import { useEffect, useState } from "react";
import {
    useOthers,
    useSelf,
    useMyPresence,
} from "@liveblocks/react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Displays the avatars of other users currently in the room.
 * "Notion-like" top-right stack.
 */
export function ActiveUsers() {
    const others = useOthers();
    const self = useSelf();
    const hasMore = others.length > 3;

    return (
        <div className="flex items-center -space-x-2">
            <AnimatePresence>
                {others.slice(0, 3).map(({ connectionId, info }) => (
                    <Avatar
                        key={connectionId}
                        name={info?.name}
                        src={info?.avatar}
                        color={info?.color || undefined}
                    />
                ))}

                {hasMore && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-alabaster text-xs font-medium text-charcoal dark:border-deep-grey dark:bg-panel-dark dark:text-cultured-white">
                        +{others.length - 3}
                    </div>
                )}

                {self && (
                    <div className="relative">
                        <Avatar
                            name={self.info?.name + " (You)"}
                            src={self.info?.avatar}
                            color={self.info?.color || undefined}
                        />
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-deep-grey" />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Avatar({
    name,
    src,
    color,
}: {
    name?: string;
    src?: string;
    color?: string;
}) {
    return (
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-alabaster dark:border-deep-grey dark:bg-panel-dark"
            title={name}
            style={{ backgroundColor: src ? undefined : color }}
        >
            {src ? (
                <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span className="text-xs font-semibold text-white">
                    {name?.charAt(0).toUpperCase()}
                </span>
            )}
        </motion.div>
    );
}
