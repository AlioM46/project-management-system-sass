import { getEchoClient } from "@/features/notifications/lib/echo";
import { useEffect, useRef, useState, useCallback } from "react";
import { Message } from "../types";

export interface TypingUser {
    id: number;
    name: string;
}

export default function useChatChannel(
    accessToken: string,
    workspaceId: string,
    conversationId: number | null,
    onMessageReceived: (message: any) => void,
    currentUserId?: number | null,
    currentUserName?: string | null
) {
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!conversationId || !accessToken || !workspaceId) return;

        const echo = getEchoClient(accessToken, workspaceId);
        const channelName = `workspaces.${workspaceId}.conversations.${conversationId}`;
        const channel = echo.private(channelName);
        channelRef.current = channel;

        channel.listen(".messages.sent", (event: Message) => {
            onMessageReceived(event);
        });

        channel.listenForWhisper("typing", (event: { userId: number; userName: string; isTyping: boolean }) => {
            console.log("RECEIVED WHISPER EVENT:", event);
            if (currentUserId && Number(event.userId) === Number(currentUserId)) return;

            setTypingUsers((prev) => {
                if (event.isTyping) {
                    const exists = prev.some((u) => Number(u.id) === Number(event.userId));
                    return exists ? prev : [...prev, { id: Number(event.userId), name: event.userName }];
                } else {
                    return prev.filter((u) => Number(u.id) !== Number(event.userId));
                }
            });
        });

        return () => {
            channel.stopListening(".messages.sent");
            channel.stopListeningForWhisper("typing");
            echo.leave(channelName);
            channelRef.current = null;
            setTypingUsers([]);
        };
    }, [conversationId, accessToken, workspaceId, onMessageReceived, currentUserId]);

    const sendTyping = useCallback(
        (isTyping: boolean) => {
            if (channelRef.current && currentUserId) {
                channelRef.current.whisper("typing", {
                    userId: Number(currentUserId),
                    userName: currentUserName || "Someone",
                    isTyping,
                });
            }
        },
        [currentUserId, currentUserName]
    );

    return { typingUsers, sendTyping };
}