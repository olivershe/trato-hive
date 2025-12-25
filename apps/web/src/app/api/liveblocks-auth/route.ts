import { Liveblocks } from "@liveblocks/node";
import { auth } from "@trato-hive/auth";
import { NextRequest, NextResponse } from "next/server";

// Using env variable for secret key
const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
    // Get the current session
    const session = await auth();

    // If no session, unauthorized
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user info from session
    const user = session.user;

    // Identify the user for Liveblocks (User Presence)
    // We use the email as unique ID, and pass name/avatar/color as info
    const identity = {
        userId: user.email!, // Unique ID
        groupIds: [], // Optional: for group access
        userInfo: {
            name: user.name || "Anonymous",
            avatar: user.image || undefined,
            // Generate a consistent color based on user ID or let frontend handle it
            color: "#EE8D1D", // Default to Orange, frontend will override
        },
    };

    // Prepare the session
    const { status, body } = await liveblocks.prepareSession(
        identity.userId,
        { userInfo: identity.userInfo }
    );

    return new NextResponse(body, { status });
}
