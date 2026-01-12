import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";

// Using env variable for secret key
const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(_request: NextRequest) {
    // For demo: use a default user identity
    // In production, this would use auth() to get the real user session
    const identity = {
        userId: "demo-user",
        userInfo: {
            name: "Demo User",
            avatar: undefined,
            color: "#EE8D1D", // Orange
        },
    };

    // Prepare the session and authorize for all rooms
    const liveblocksSession = liveblocks.prepareSession(
        identity.userId,
        { userInfo: identity.userInfo }
    );

    // Allow access to all rooms
    liveblocksSession.allow("*", liveblocksSession.FULL_ACCESS);

    const { status, body } = await liveblocksSession.authorize();

    return new NextResponse(body, { status });
}
