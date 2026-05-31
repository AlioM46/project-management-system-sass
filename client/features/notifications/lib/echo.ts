"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

let echoInstance: Echo<"pusher"> | null = null;
let echoSignature: string | null = null;

function getRealtimeBaseUrl() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
    }

    return apiBaseUrl.endsWith("/api")
        ? apiBaseUrl.slice(0, -4)
        : apiBaseUrl;
}

export function getEchoClient(accessToken: string, workspaceId: string) {
    const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;

    if (!key || !cluster) {
        throw new Error("Pusher public configuration is missing.");
    }

    if (typeof window !== "undefined") {
        window.Pusher = Pusher;
    }

    const nextSignature = `${accessToken}:${workspaceId}`;

    if (echoInstance && echoSignature === nextSignature) {
        return echoInstance;
    }

    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }

    echoInstance = new Echo({
        broadcaster: "pusher",
        key,
        cluster,
        authEndpoint: `${getRealtimeBaseUrl()}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Workspace-Id": workspaceId,
            },
        },
    });

    echoSignature = nextSignature;

    return echoInstance;
}

export function leaveEchoChannel(channelName: string) {
    if (!echoInstance) {
        return;
    }

    echoInstance.leave(channelName);
}

export function disconnectEchoClient() {
    if (!echoInstance) {
        return;
    }

    echoInstance.disconnect();
    echoInstance = null;
    echoSignature = null;
}
