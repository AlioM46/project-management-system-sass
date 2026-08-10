"use client";

import { Dispatch, SetStateAction } from "react";
import { Conversation, Message } from "../types";
import {
    blockUser,
    deleteMessageForAll,
    deleteMessageForMe,
    getMessages,
    sendMessage,
    toggleMessageReaction,
    toggleStarMessage,
    unblockUser,
    updateMessage,
} from "../api/chat.api";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";

interface UseChatActionsProps {
    activeConversationId: number | null;
    currentUserId: number | null;
    messages: Message[];
    setMessages: Dispatch<SetStateAction<Message[]>>;
    setConversations: Dispatch<SetStateAction<Conversation[]>>;
    setIsSending: Dispatch<SetStateAction<boolean>>;
    setInputText: Dispatch<SetStateAction<string>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    setHasBeforeMessages: Dispatch<SetStateAction<boolean>>;
    setHasAfterMessages: Dispatch<SetStateAction<boolean>>;
}

export function useChatActions({
    activeConversationId,
    currentUserId,
    messages,
    setMessages,
    setConversations,
    setIsSending,
    setInputText,
    setIsLoading,
    setHasBeforeMessages,
    setHasAfterMessages,
}: UseChatActionsProps) {
    // Send message action
    const handleSendMessage = async (
        body: string,
        conversationId: number,
        messageId?: number,
        attachments?: File[]
    ) => {
        if (!body.trim() && (!attachments || attachments.length === 0)) return;
        setIsSending(true);

        try {
            const newMessage = await sendMessage(conversationId, body, messageId, attachments);
            setMessages((prev) => [...prev, newMessage]);
            setInputText("");

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === conversationId ? { ...c, last_message: newMessage } : c
                )
            );
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to send message"));
        } finally {
            setIsSending(false);
        }
    };

    // Toggle reaction action
    const handleToggleReaction = async (messageId: number, emoji: string) => {
        if (!activeConversationId) return;
        try {
            const updatedReactions = await toggleMessageReaction(activeConversationId, messageId, emoji);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
                )
            );
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to react to message"));
        }
    };

    // Toggle star message action
    const handleToggleStarMessage = async (messageId: number) => {
        if (!activeConversationId) return;
        try {
            const res = await toggleStarMessage(activeConversationId, messageId);
            setMessages((prev) =>
                prev.map((msg) => (msg.id === messageId ? { ...msg, is_starred: res.is_starred } : msg))
            );
            toast.success(res.is_starred ? "Message starred ⭐" : "Message unstarred");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to star message"));
        }
    };

    // Update message body action
    const handleUpdateMessage = async (messageId: number, newBody: string) => {
        if (!activeConversationId) return;
        setIsSending(true);
        try {
            const updated = await updateMessage(activeConversationId, messageId, newBody);
            setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, body: updated.body } : m))
            );
            toast.success("Message updated!");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update message"));
        } finally {
            setIsSending(false);
        }
    };

    // Delete message for me action
    const handleDeleteForMeMessage = async (messageId: number) => {
        if (!activeConversationId) return;
        setIsSending(true);
        try {
            await deleteMessageForMe(activeConversationId, messageId);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
            toast.success("Message removed for you");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete message for me"));
        } finally {
            setIsSending(false);
        }
    };

    // Delete message for all action
    const handleDeleteForAllMessage = async (messageId: number) => {
        if (!activeConversationId) return;
        setIsSending(true);
        try {
            await deleteMessageForAll(activeConversationId, messageId);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
            toast.success("Message deleted for everyone");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete message for everyone"));
        } finally {
            setIsSending(false);
        }
    };

    // Block user action (Optimistic UI Update)
    const handleBlockUser = async (targetUserId: number) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeConversationId
                    ? { ...c, is_blocked_by_me: true }
                    : c
            )
        );

        try {
            const res = await blockUser(targetUserId);
            if (res?.is_blocked === false) {
                throw new Error("Backend failed to confirm block state");
            }
            toast.success("User blocked successfully");
        } catch (error) {
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeConversationId
                        ? { ...c, is_blocked_by_me: false }
                        : c
                )
            );
            toast.error(getErrorMessage(error, "Failed to block user"));
            throw error;
        }
    };

    // Unblock user action (Optimistic UI Update)
    const handleUnblockUser = async (targetUserId: number) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeConversationId
                    ? { ...c, is_blocked_by_me: false }
                    : c
            )
        );

        try {
            const res = await unblockUser(targetUserId);
            if (res?.is_blocked === true) {
                throw new Error("Backend failed to confirm unblock state");
            }
            toast.success("User unblocked successfully");
        } catch (error) {
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeConversationId
                        ? { ...c, is_blocked_by_me: true }
                        : c
                )
            );
            toast.error(getErrorMessage(error, "Failed to unblock user"));
            throw error;
        }
    };

    // Search jump to message action
    const handleSelectSearchMessage = async (messageId: number) => {
        if (!activeConversationId) return;

        const existsInLocal = messages.some((m) => m.id === messageId);

        if (existsInLocal) {
            const element = document.getElementById(`message-${messageId}`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.classList.add("bg-amber-100/50", "dark:bg-amber-900/30", "transition-all");
                setTimeout(() => {
                    element.classList.remove("bg-amber-100/50", "dark:bg-amber-900/30");
                }, 2500);
            }
        } else {
            try {
                setIsLoading(true);
                const res = await getMessages(activeConversationId, { around_message_id: messageId });
                setMessages(res.data || []);
                setHasBeforeMessages(res.has_before ?? false);
                setHasAfterMessages(res.has_after ?? false);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        const element = document.getElementById(`message-${messageId}`);
                        if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                            element.classList.add("bg-amber-100/50", "dark:bg-amber-900/30", "transition-all");
                            setTimeout(() => {
                                element.classList.remove("bg-amber-100/50", "dark:bg-amber-900/30");
                            }, 2500);
                        }
                    });
                });
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to load message position"));
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Load pagination messages
    const handleLoadMoreMessages = async () => {
        if (!activeConversationId || messages.length === 0) return;
        const oldestMessageId = messages[0].id;

        try {
            const res = await getMessages(activeConversationId, { before_message_id: oldestMessageId });
            const olderMessages = res.data || [];
            if (olderMessages.length > 0) {
                setMessages((prev) => [...olderMessages, ...prev]);
            }
            setHasBeforeMessages(res.has_before ?? false);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to load older messages"));
        }
    };

    const handleLoadNewerMessages = async () => {
        if (!activeConversationId || messages.length === 0) return;
        const newestMessageId = messages[messages.length - 1].id;

        try {
            const res = await getMessages(activeConversationId, { after_message_id: newestMessageId });
            const newerMessages = res.data || [];
            if (newerMessages.length > 0) {
                setMessages((prev) => [...prev, ...newerMessages]);
            }
            setHasAfterMessages(res.has_after ?? false);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to load newer messages"));
        }
    };

    return {
        handleSendMessage,
        handleToggleReaction,
        handleToggleStarMessage,
        handleUpdateMessage,
        handleDeleteForMeMessage,
        handleDeleteForAllMessage,
        handleBlockUser,
        handleUnblockUser,
        handleSelectSearchMessage,
        handleLoadMoreMessages,
        handleLoadNewerMessages,
    };
}
