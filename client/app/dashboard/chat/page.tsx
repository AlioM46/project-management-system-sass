"use client";

import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatMessageArea } from "@/features/chat/components/ChatMessageArea";
import { NewConversationModal } from "@/features/chat/components/NewConversationModal";
import { ChatSearchSidebar } from "@/features/chat/components/ChatSearchSidebar";
import { ChatInfoSidebar } from "@/features/chat/components/ChatInfoSidebar";
import { useCallback, useEffect, useState } from "react";
import { deleteMessageForAll, deleteMessageForMe, getConversations, getMessages, sendMessage, toggleMessageReaction, updateMessage, toggleStarMessage, blockUser, unblockUser } from "@/features/chat/api/chat.api";
import { getMe } from "@/features/auth/api/auth.api";
import { Conversation, Message, MessageReaction } from "@/features/chat/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";
import useChatChannel from "@/features/chat/hooks/useChatChannel";
import { getCookie } from "@/shared/utils/cookies";
import { useNotifications } from "@/features/notifications/components/NotificationsProvider";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { usePresence } from "@/features/chat/components/PresenceProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentUser: authUser } = useCurrentUser();
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
    const { markConversationAsReadLocally } = useNotifications();
    const { onlineUserIds, isUserOnline } = usePresence();

    const [inputText, setInputText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasBeforeMessages, sethasBeforeMessages] = useState(false);
    const [hasAfterMessages, sethasAfterMessages] = useState(false);

    const activeConversation = conversations?.find((c) => c?.id === activeConversationId) || null;

    const handleSelectConversation = (id: number) => {
        setActiveConversationId(id);
        router.replace(`/dashboard/chat?conversationId=${id}`, { scroll: false });
    };

    useEffect(() => {
        const conversationId = searchParams.get("conversationId") || null;

        setActiveConversationId(conversationId && !isNaN(Number(conversationId)) ? Number(conversationId) : null);
    }, [searchParams])





    // when conversation is opened, mark unread count = 0
    useEffect(() => {
        if (!activeConversationId) return;
        // Reset unread count for the newly opened chat in local state
        setConversations((prev) =>
            prev.map((conv) =>
                conv.id === activeConversationId ? { ...conv, unread_count: 0 } : conv
            )
        );
        // Clear global notifications counter for this conversation
        markConversationAsReadLocally(activeConversationId);
    }, [activeConversationId]);


    const fetchConversations = useCallback(async () => {
        try {
            const convos = await getConversations();
            setConversations(convos);
        } catch (error) {
            console.error("Failed to refresh conversations:", error);
        }
    }, []);

    useEffect(() => {
        async function loadConversations() {
            try {
                setIsLoading(true);
                const [convos, me] = await Promise.all([getConversations(), getMe()]);
                setConversations(convos);
                setCurrentUserId(Number(me.id));

                const paramId = searchParams.get("conversationId");
                const targetId = paramId && !isNaN(Number(paramId)) ? Number(paramId) : null;
                const exists = convos?.some((c) => c.id === targetId);

                if (exists && targetId) {
                    setActiveConversationId(targetId);
                } else if (convos?.length > 0) {
                    setActiveConversationId(convos[0]?.id);
                    router.replace(`/dashboard/chat?conversationId=${convos[0]?.id}`, { scroll: false });
                }
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed To Load Conversations"));
            } finally {
                setIsLoading(false);
            }
        }
        loadConversations();
    }, []);

    useEffect(() => {
        if (!activeConversationId) return;

        const conversationId = activeConversationId;

        async function loadMessages() {
            setIsLoading(true);
            try {
                const res = await getMessages(conversationId);
                setMessages(res.data || []);
                sethasBeforeMessages(res.has_before ?? false);
                sethasAfterMessages(res.has_after ?? false);
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed To Load Messages"));
            } finally {
                setIsLoading(false);
            }
        }

        loadMessages();
    }, [activeConversationId]);

    const handleLoadMoreMessages = async () => {
        if (!activeConversationId || !hasBeforeMessages || isLoading) return;

        const oldestMessage = messages[0];
        if (!oldestMessage) return;

        try {
            const res = await getMessages(activeConversationId, {
                before_message_id: oldestMessage.id,
            });

            setMessages((prev) => [...(res.data || []), ...prev]);
            sethasBeforeMessages(res.has_before ?? false);
            sethasAfterMessages(res.has_after ?? false);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed To Load Older Messages"));
        }
    };

    const handleLoadNewerMessages = async () => {
        if (!activeConversationId || !hasAfterMessages || isLoading) return;

        const newestMessage = messages[messages.length - 1];
        if (!newestMessage) return;

        try {
            const res = await getMessages(activeConversationId, {
                after_message_id: newestMessage.id,
            });

            setMessages((prev) => [...prev, ...(res.data || [])]);
            sethasBeforeMessages(res.has_before ?? false);
            sethasAfterMessages(res.has_after ?? false);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed To Load Newer Messages"));
        }
    };


    const handleDeletingMessage = (deletedMessage: Message) => {
        setMessages((prev) => {
            const exists = prev?.some((m) => m.id === deletedMessage.id);
            return exists
                ? prev.map((m) => (m.id === deletedMessage.id ? { ...m, isDeleted: true, deletedById: deletedMessage?.deletedById, body: deletedMessage?.body } : m))
                : prev;
        });
    }

    const handleUpdatingMessage = (updatedMessage: Message) => {
        setMessages((prev) => {
            const exists = prev?.some((m) => m.id === updatedMessage.id);
            return exists
                ? prev.map((m) => (m.id === updatedMessage.id ? { ...m, body: updatedMessage?.body, isEdited: updatedMessage?.isEdited } : m))
                : prev;
        });
    }


    const handleIncomingMessage = useCallback(
        (newMessage: Message) => {
            setMessages((prev) => {
                const exists = prev?.some((m) => m.id === newMessage.id);
                return exists
                    ? prev.map((m) => (m.id === newMessage.id ? newMessage : m))
                    : [...prev, newMessage];
            });

            setConversations((prev) => {
                const exists = prev.some((c) => c.id === newMessage.conversation_id);
                if (!exists) {
                    fetchConversations();
                    return prev;
                }
                return prev.map((conv) => {
                    if (conv.id === newMessage.conversation_id) {
                        return {
                            ...conv,
                            last_message: newMessage,
                            unread_count: activeConversationId === conv.id ? 0 : (conv.unread_count || 0) + 1,
                        };
                    }
                    return conv;
                });
            });
        },
        [activeConversationId, fetchConversations]
    );

    // Listen for new chat messages dispatched from global window events
    useEffect(() => {
        const handleGlobalMessage = (e: Event) => {
            const newMessage = (e as CustomEvent).detail;
            if (newMessage) {
                handleIncomingMessage(newMessage);
            }
        };

        window.addEventListener("new-chat-message", handleGlobalMessage);
        return () => window.removeEventListener("new-chat-message", handleGlobalMessage);
    }, [handleIncomingMessage]);

    const handleReactionUpdated = useCallback(
        (data: { conversation_id: number; message_id: number; reactions: MessageReaction[] }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === data.message_id ? { ...msg, reactions: data.reactions } : msg
                )
            );
        },
        []
    );

    const handleToggleReaction = async (messageId: number, emoji: string) => {
        if (!activeConversationId) return;

        // Optimistic UI Update locally
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg.id !== messageId) return msg;

                const currentReactions = msg.reactions || [];
                const existingIndex = currentReactions.findIndex((r) => r.user_id === currentUserId);

                let updatedReactions = [...currentReactions];
                if (existingIndex > -1) {
                    if (currentReactions[existingIndex].emoji === emoji) {
                        // Toggle off
                        updatedReactions.splice(existingIndex, 1);
                    } else {
                        // Switch emoji
                        updatedReactions[existingIndex] = {
                            ...updatedReactions[existingIndex],
                            emoji,
                        };
                    }
                } else {
                    // Add new reaction
                    updatedReactions.push({
                        id: Date.now(),
                        message_id: messageId,
                        user_id: currentUserId || 0,
                        emoji,
                        user: { id: currentUserId || 0, name: authUser?.name || "User" },
                    });
                }

                return { ...msg, reactions: updatedReactions };
            })
        );

        try {
            const res = await toggleMessageReaction(activeConversationId, messageId, emoji);
            // Sync with backend confirmed reactions list
            if (res?.data) {
                handleReactionUpdated({
                    conversation_id: activeConversationId,
                    message_id: messageId,
                    reactions: res.data,
                });
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed To Update Reaction"));
        }
    };

    const { typingUsers, sendTyping, recordingUsers, sendRecording } = useChatChannel(
        getCookie("access_token") || "",
        getCookie("workspace_id") || "",
        activeConversationId,
        handleIncomingMessage,
        currentUserId,
        authUser?.name,
        handleReactionUpdated,
        handleDeletingMessage,
        handleUpdatingMessage
    );

    // Listen for incoming notifications when a reactivated conversation receives a new message
    useEffect(() => {
        const handleNotificationReceived = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.message) {
                handleIncomingMessage(detail.message);
            }
        };

        window.addEventListener("chat:notification-received", handleNotificationReceived);
        return () => {
            window.removeEventListener("chat:notification-received", handleNotificationReceived);
        };
    }, [handleIncomingMessage]);

    async function handleSendMessage(body: string, conversationId: number, replyId?: number, attachments?: File[]) {
        try {
            setIsSending(true);
            const res = await sendMessage(conversationId, body, replyId, attachments);
            handleIncomingMessage(res);
            setInputText("");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed To Send Message"));
        } finally {
            setIsSending(false);
        }
    }


    // Called when a new DM or Group conversation is created via the modal
    const handleConversationCreated = (newConv: Conversation) => {
        setConversations((prev) => {
            const exists = prev?.some((c) => c.id === newConv.id);
            return exists ? prev : [newConv, ...(prev || [])];
        });
        handleSelectConversation(newConv.id);
    };


    const handleUpdateMessage = async (messageId: number, body: string) => {
        try {
            setIsSending(true);
            const res = await updateMessage(activeConversationId || -1, messageId, body);
            handleUpdatingMessage(res);
            setInputText("");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed To Update Message"));
        } finally {
            setIsSending(false);
        }
    }


    const handleDeleteForAllMessage = async (messageId: number) => {
        try {
            setIsSending(true);
            const res = await deleteMessageForAll(activeConversationId || -1, messageId);
            handleDeletingMessage(res);
            setInputText("");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed To Delete Message for all"));
        } finally {
            setIsSending(false);
        }
    }

    const handleDeleteForMeMessage = async (messageId: number) => {
        try {
            setIsSending(true);
            const res = await deleteMessageForMe(activeConversationId || -1, messageId);
            setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
            setInputText("");
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed To Delete Message for me"));
        } finally {
            setIsSending(false);
        }
    }

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

    const handleBlockUser = async (targetUserId: number) => {
        // 1. Optimistic UI update (Instant)
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeConversationId
                    ? { ...c, is_blocked_by_me: true }
                    : c
            )
        );

        try {
            // 2. API call in background
            const res = await blockUser(targetUserId);

            // Defensive Check: Ensure backend payload confirms blocked state
            if (res?.is_blocked === false) {
                throw new Error("Backend failed to confirm block state");
            }

            toast.success("User blocked successfully");
        } catch (error) {
            // 3. Rollback on failure
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

    const handleUnblockUser = async (targetUserId: number) => {
        // 1. Optimistic UI update (Instant)
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeConversationId
                    ? { ...c, is_blocked_by_me: false }
                    : c
            )
        );

        try {
            // 2. API call in background
            const res = await unblockUser(targetUserId);

            // Defensive Check: Ensure backend payload confirms unblocked state
            if (res?.is_blocked === true) {
                throw new Error("Backend failed to confirm unblock state");
            }

            toast.success("User unblocked successfully");
        } catch (error) {
            // 3. Rollback on failure
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

                // frame 1 => Check React finish building the DOM after changing the state 
                requestAnimationFrame(() => {
                    // frame 2 => Check Broswer has Finish Paninting\Drawing
                    requestAnimationFrame(() => {
                        const element = document.getElementById(`message-${messageId}`);
                        if (element) {
                            element.scrollIntoView({ behavior: "smooth", block: "center" });
                            element.classList.add("bg-amber-100/50", "dark:bg-amber-900/30", "transition-all");
                            setTimeout(() => {
                                element.classList.remove("bg-amber-100/50", "dark:bg-amber-900/30");
                            }, 2500);
                        }

                    })
                })
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to load message context"));
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Left: Conversation List */}
            <ChatSidebar
                isUserOnline={isUserOnline}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onOpenNewConversationModal={() => setIsModalOpen(true)}
                onOpenStarredTab={() => {
                    if (activeConversationId) {
                        setIsInfoSidebarOpen(true);
                    } else {
                        toast.info("Select a conversation to view its starred messages");
                    }
                }}
                typingUsers={typingUsers}
            />

            {/* Middle: Message Area */}
            <ChatMessageArea
                conversation={activeConversation}
                messages={messages}
                currentUserId={currentUserId ?? 0}
                inputText={inputText}
                onInputTextChange={setInputText}
                handleSendMessage={handleSendMessage}
                isSending={isSending}
                isUserOnline={isUserOnline}
                typingUsers={typingUsers}
                onTyping={sendTyping}
                recordingUsers={recordingUsers}
                onRecording={sendRecording}
                onToggleReaction={handleToggleReaction}
                onToggleStarMessage={handleToggleStarMessage}
                onDeleteForMe={handleDeleteForMeMessage}
                onDeleteForAll={handleDeleteForAllMessage}
                onEditMessage={handleUpdateMessage}
                onUnblockUser={handleUnblockUser}
                hasBefore={hasBeforeMessages}
                hasAfter={hasAfterMessages}
                onLoadMore={handleLoadMoreMessages}
                onLoadNewer={handleLoadNewerMessages}
                onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
                isSearchOpen={isSearchOpen}
                onToggleInfoSidebar={() => setIsInfoSidebarOpen((prev) => !prev)}
                isInfoSidebarOpen={isInfoSidebarOpen}
            />

            {/* Right: Message Search Sidebar */}
            {isSearchOpen && (
                <ChatSearchSidebar
                    conversationId={activeConversationId}
                    onClose={() => setIsSearchOpen(false)}
                    onSelectMessage={handleSelectSearchMessage}
                />
            )}

            {/* Right: Conversation Info Sidebar */}
            {isInfoSidebarOpen && activeConversationId && (
                <ChatInfoSidebar
                    conversationId={activeConversationId}
                    currentUserId={currentUserId ?? 0}
                    isUserOnline={isUserOnline}
                    onClose={() => setIsInfoSidebarOpen(false)}
                    onClearChatSuccess={() => setMessages([])}
                    onDeleteConversationSuccess={(deletedId) => {
                        setConversations((prev) => prev.filter((c) => c.id !== deletedId));
                        setActiveConversationId(null);
                        setIsInfoSidebarOpen(false);
                    }}
                    onMuteToggleSuccess={(mutedId, isMuted) => {
                        setConversations((prev) =>
                            prev.map((c) => (c.id === mutedId ? { ...c, is_muted: isMuted } : c))
                        );
                    }}
                    onSelectMessage={handleSelectSearchMessage}
                    onBlockUser={handleBlockUser}
                    onUnblockUser={handleUnblockUser}
                />
            )}

            {/* New Conversation Modal */}
            <NewConversationModal
                isOpen={isModalOpen}
                currentUserId={currentUserId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleConversationCreated}
            />
        </div>
    );
}
