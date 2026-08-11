import { markAsDeliveredApi } from "../api/chat.api";
import { getEchoClient } from "@/features/notifications/lib/echo";
import { useEffect, useRef, useState, useCallback } from "react";
import { Message, MessageReaction } from "../types";
import { toast } from "sonner";

export interface ChatUserActivity {
    id: number;
    name: string;
}

export default function useChatChannel(
    accessToken: string,
    workspaceId: string,
    conversationId: number | null,
    onMessageReceived: (message: any) => void,
    currentUserId?: number | null,
    currentUserName?: string | null,
    onReactionUpdated?: (data: { conversation_id: number; message_id: number; reactions: MessageReaction[] }) => void,
    onMessageDeleted?: (data: Message) => void,
    onMessageUpdated?: (data: Message) => void,
    onMessageDelivered?: (event: { conversationId: number; deliveredAt: string }) => void,
    onMessageRead?: (event: { conversationId: number; userId: number; readAt: string }) => void,
    onMessagePinned?: (data: { pinned_message: any; unpinned_message_id?: number | null }) => void
) {
    const [typingUsers, setTypingUsers] = useState<ChatUserActivity[]>([]);
    const [recordingUsers, setRecordingUsers] = useState<ChatUserActivity[]>([]);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (!conversationId || !accessToken || !workspaceId) return;

        const echo = getEchoClient(accessToken, workspaceId);
        const channelName = `workspaces.${workspaceId}.conversations.${conversationId}`;
        const channel = echo.private(channelName);
        channelRef.current = channel;

        channel.listen(".messages.sent", (event: Message) => {
            console.log("Incoming Message from Realtime : # ", event);
            onMessageReceived(event);

            // Auto ACK delivery if message is from someone else
            const senderId = event?.user_id || event?.sender?.id;
            if (currentUserId && senderId && Number(senderId) !== Number(currentUserId) && event.id) {
                markAsDeliveredApi(conversationId, event.id);
            }
        });

        channel.listen(".messages.delivered", (event: { conversationId: number; deliveredAt: string }) => {
            if (onMessageDelivered) {
                onMessageDelivered(event);
            }
        });

        channel.listen(".messages.read", (event: { conversationId: number; userId: number; readAt: string }) => {
            if (onMessageRead) {
                onMessageRead(event);
            }
        });

        channel.listen(".messages.updated", (event: Message) => {
            console.log("Updated Message from Realtime : # ", event);
            if (onMessageUpdated) {
                onMessageUpdated(event);
            }
        });

        channel.listen(".messages.deleted", (event: Message) => {
            console.log("Message deleted: # ", event);
            if (onMessageDeleted) {
                onMessageDeleted(event);
            }
        });

        channel.listen(".messages.reaction.updated", (event: { conversation_id: number; message_id: number; reactions: MessageReaction[] }) => {
            if (onReactionUpdated) {
                onReactionUpdated(event);
            }
        });

        channel.listen(".message.pinned_updated", (event: { pinned_message: any; unpinned_message_id?: number | null }) => {
            if (onMessagePinned) {
                onMessagePinned(event);
            }
        });

        // 1. Whisper for "typing" status
        channel.listenForWhisper("typing", (event: { userId: number; userName: string; isTyping: boolean }) => {
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

        // 2. Whisper for "recording voice note" status
        channel.listenForWhisper("recording", (event: { userId: number; userName: string; isRecording: boolean }) => {
            if (currentUserId && Number(event.userId) === Number(currentUserId)) return;

            setRecordingUsers((prev) => {
                if (event.isRecording) {
                    const exists = prev.some((u) => Number(u.id) === Number(event.userId));
                    return exists ? prev : [...prev, { id: Number(event.userId), name: event.userName }];
                } else {
                    return prev.filter((u) => Number(u.id) !== Number(event.userId));
                }
            });
        });

        return () => {
            channel.stopListening(".messages.sent");
            channel.stopListening(".messages.delivered");
            channel.stopListening(".messages.read");
            channel.stopListening(".messages.updated");
            channel.stopListening(".messages.deleted");
            channel.stopListening(".messages.reaction.updated");
            channel.stopListening(".message.pinned_updated");
            channel.stopListeningForWhisper("typing");
            channel.stopListeningForWhisper("recording");
            echo.leave(channelName);
            channelRef.current = null;
            setTypingUsers([]);
            setRecordingUsers([]);
        };
    }, [conversationId, accessToken, workspaceId, onMessageReceived, currentUserId, onReactionUpdated]);

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

    const sendRecording = useCallback(
        (isRecording: boolean) => {
            if (channelRef.current && currentUserId) {
                channelRef.current.whisper("recording", {
                    userId: Number(currentUserId),
                    userName: currentUserName || "Someone",
                    isRecording,
                });
            }
        },
        [currentUserId, currentUserName]
    );

    return { typingUsers, sendTyping, recordingUsers, sendRecording };
}