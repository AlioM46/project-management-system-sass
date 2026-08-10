"use client";

import { useCallback, useEffect, useState } from "react";
import { Conversation, Message } from "../types";
import { getConversations, getMessages } from "../api/chat.api";
import { getMe } from "@/features/auth/api/auth.api";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";
import useChatChannel from "./useChatChannel";
import { useNotifications } from "@/features/notifications/components/NotificationsProvider";
import { useRouter, useSearchParams } from "next/navigation";

import { getCookie } from "@/shared/utils/cookies";

export function useChatState() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { markConversationAsReadLocally } = useNotifications();

    const accessToken = getCookie("token") || "";
    const workspaceId = getCookie("workspace_id") || "";

    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [inputText, setInputText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasBeforeMessages, setHasBeforeMessages] = useState(false);
    const [hasAfterMessages, setHasAfterMessages] = useState(false);

    // Fetch active current user ID
    useEffect(() => {
        getMe()
            .then((res: any) => {
                if (res?.id) setCurrentUserId(Number(res.id));
                else if (res?.user?.id) setCurrentUserId(Number(res.user.id));
            })
            .catch((err) => {
                console.error("Failed to fetch user:", err);
            });
    }, []);

    // Fetch workspace conversation list
    const fetchConversationsList = useCallback(async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to load conversations"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversationsList();
    }, [fetchConversationsList]);

    // Handle initial URL conversation query parameter (?conversation=12)
    useEffect(() => {
        const convParam = searchParams.get("conversation");
        if (convParam) {
            const parsedId = parseInt(convParam, 10);
            if (!isNaN(parsedId)) {
                setActiveConversationId(parsedId);
            }
        }
    }, [searchParams]);

    // Select active conversation handler
    const selectConversation = useCallback(
        (id: number) => {
            setActiveConversationId(id);
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.set("conversation", id.toString());
            router.push(`?${currentParams.toString()}`, { scroll: false });
        },
        [router]
    );

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (!activeConversationId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const response = await getMessages(activeConversationId);
                setMessages(response.data || []);
                setCurrentPage(response.current_page || 1);
                setHasBeforeMessages(response.has_before ?? false);
                setHasAfterMessages(response.has_after ?? false);

                markConversationAsReadLocally(activeConversationId);
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to load messages"));
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();
    }, [activeConversationId, markConversationAsReadLocally]);

    // Realtime Broadcast WebSocket Subscription
    const handleNewMessage = useCallback((newMessage: Message) => {
        if (newMessage.conversation_id === activeConversationId) {
            setMessages((prev) => [...prev, newMessage]);
        }

        setConversations((prev) =>
            prev.map((c) => {
                if (c.id === newMessage.conversation_id) {
                    const isCurrent = c.id === activeConversationId;
                    return {
                        ...c,
                        last_message: newMessage,
                        unread_count: isCurrent ? 0 : (c.unread_count || 0) + 1,
                    };
                }
                return c;
            })
        );
    }, [activeConversationId]);

    const handleMessageDeleted = useCallback((deletedData: any) => {
        const deletedMsgId = deletedData?.message_id || deletedData?.id;
        const deletedConvId = deletedData?.conversation_id;

        if (deletedConvId === activeConversationId || !deletedConvId) {
            setMessages((prev) => prev.filter((m) => m.id !== deletedMsgId));
        }
    }, [activeConversationId]);

    const handleMessageUpdated = useCallback((updatedMessage: Message) => {
        if (updatedMessage.conversation_id === activeConversationId) {
            setMessages((prev) =>
                prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
        }
    }, [activeConversationId]);

    const { typingUsers, sendTyping, recordingUsers, sendRecording } = useChatChannel(
        accessToken,
        workspaceId,
        activeConversationId,
        handleNewMessage,
        currentUserId,
        undefined,
        undefined,
        handleMessageDeleted,
        handleMessageUpdated
    );

    return {
        activeConversationId,
        setActiveConversationId,
        conversations,
        setConversations,
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        currentUserId,
        inputText,
        setInputText,
        isSending,
        setIsSending,
        currentPage,
        setCurrentPage,
        hasBeforeMessages,
        setHasBeforeMessages,
        hasAfterMessages,
        setHasAfterMessages,
        selectConversation,
        fetchConversationsList,
        typingUsers,
        sendTyping,
        recordingUsers,
        sendRecording,
    };
}
