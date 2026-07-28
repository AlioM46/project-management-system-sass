import Echo from "laravel-echo";
import Pusher from "pusher-js";


declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

let echoInstance: Echo<"pusher"> | null = null;
export function getEchoClient(accessToken: string, workspaceId: string): Echo<"pusher"> | null {
    if (typeof window === "undefined") return null;

    // Attach Pusher to window so Laravel Echo can find it
    window.Pusher = Pusher;

    // Return the existing client if connection parameters match
    if (echoInstance) {
        return echoInstance;
    }

    echoInstance = new Echo({
        broadcaster: "pusher",
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
        forceTLS: true,

        // Point to the backend broadcasting auth endpoint
        authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`,
        auth: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "X-Workspace-Id": workspaceId, // Tells backend which workspace we are in
            },
        },
    });

    return echoInstance;
}

export function disconnectEchoClient() {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
}
