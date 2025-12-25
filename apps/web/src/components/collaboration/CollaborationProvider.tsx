"use client";

import {
    LiveblocksProvider,
    RoomProvider,
    ClientSideSuspense,
} from "@liveblocks/react";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function CollaborationProvider({
    roomId,
    children,
}: {
    roomId: string;
    children: ReactNode;
}) {
    return (
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
            <RoomProvider
                id={roomId}
                initialPresence={{
                    cursor: null,
                }}
            >
                <ClientSideSuspense fallback={<LoadingState />}>
                    {() => children}
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    );
}

function LoadingState() {
    return (
        <div className="flex h-full w-full items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange" />
        </div>
    );
}
