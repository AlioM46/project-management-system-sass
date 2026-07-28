// You will write the custom hook here. Follow the guide to construct it!

import { disconnectEchoClient, getEchoClient } from "@/features/notifications/lib/echo";
import { RealtimeNotificationEvent } from "@/features/notifications/types";
import { getCookie } from "@/shared/utils/cookies";
import { useEffect } from "react";
import { Message } from "../types";





export default function useChatChannel(
    accessToken: string,
    workspaceId: string,
    conversationId: number | null,
    onMessageReceived: (message: any) => void
): void {



    // 1. Setup (Subscription)
    //A chat hook acts as the bridge between React's lifecycle and Laravel Echo (WebSockets).

    useEffect(() => {

        // Connect to The Realtime Channel

        if (!conversationId || !accessToken || !workspaceId) return;
        // 1. Get client and define channel
        const echo = getEchoClient(accessToken, workspaceId);
        const channelName = `workspaces.${workspaceId}.conversations.${conversationId}`; // Plural!
        // 2. Subscribe to private channel
        const channel = echo.private(channelName);
        // 3. Listen for new messages
        channel.listen(".messages.sent", (event: Message) => {
            console.log("event:", event)
            onMessageReceived(event);
        });



        // 4. Return cleanup function (React handles this automatically on room change/unmount)
        return () => {
            channel.stopListening(".messages.sent");
            echo.leave(channelName);
        };







    }, [conversationId, accessToken, workspaceId, onMessageReceived])


    // 2. Incoming Events (Receiving Data)

    // 3. Outgoing Events (Sending Data)

    // 4. Cleanup (Leaving)

}