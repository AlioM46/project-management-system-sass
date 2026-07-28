"use client";

import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatMessageArea } from "@/features/chat/components/ChatMessageArea";
import { NewConversationModal } from "@/features/chat/components/NewConversationModal";
import { useEffect, useState } from "react";
import { getConversations, getMessages, sendMessage } from "@/features/chat/api/chat.api";
import { getMe } from "@/features/auth/api/auth.api";
import { Conversation, Message } from "@/features/chat/types";
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
    const { markConversationAsReadLocally } = useNotifications();
    const { onlineUserIds, isUserOnline } = usePresence();

    const [inputText, setInputText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const activeConversation = conversations?.find((c) => c?.id === activeConversationId) || null;

    const handleSelectConversation = (id: number) => {
        setActiveConversationId(id);
        router.replace(`/dashboard/chat?conversationId=${id}`, { scroll: false });
    };

    useEffect(() => {
        const conversationId = searchParams.get("conversationId") || null;

        setActiveConversationId(conversationId && !isNaN(Number(conversationId)) ? Number(conversationId) : null);
    }, [searchParams])

    useEffect(() => {
        const handleGlobalMessage = (e: Event) => {
            const newMessage = (e as CustomEvent).detail;

            setConversations((prev) =>
                prev.map((conv) => {
                    if (conv.id === newMessage.conversation_id) {
                        return {
                            ...conv,
                            last_message: newMessage,
                            unread_count: activeConversationId === conv.id ? 0 : (conv.unread_count || 0) + 1,
                        };
                    }
                    return conv;
                })
            );
        };


        window.addEventListener("new-chat-message", handleGlobalMessage);
        return () => window.removeEventListener("new-chat-message", handleGlobalMessage);

    }, [activeConversationId]);



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
    }, [activeConversationId, markConversationAsReadLocally]);


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
                const res = await getMessages(conversationId, 1);
                setMessages(res.data);
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed To Load Messages"));
            } finally {
                setIsLoading(false);
            }
        }

        loadMessages();
    }, [activeConversationId]);

    const handleIncomingMessage = (newMessage: Message) => {
        setMessages((prev) => {
            const exists = prev?.some((m) => m.id === newMessage.id);
            return exists ? prev : [...prev, newMessage];
        });



        setConversations((prev) =>
            prev.map((conv) => {
                if (conv.id === newMessage.conversation_id) {
                    return {
                        ...conv,
                        last_message: newMessage,
                        unread_count: activeConversationId === conv.id ? 0 : (conv.unread_count || 0) + 1,
                    };
                }
                return conv;
            })
        );
    };

    const { typingUsers, sendTyping } = useChatChannel(
        getCookie("access_token") || "",
        getCookie("workspace_id") || "",
        activeConversationId,
        handleIncomingMessage,
        currentUserId,
        authUser?.name
    );

    async function handleSendMessage(body: string, conversationId: number, replyId?: number) {
        try {
            setIsSending(true);
            const res = await sendMessage(conversationId, body, replyId);
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

    return (
        <div className="flex h-[calc(100dvh-64px)] overflow-hidden">
            {/* Left: Conversation List */}
            <ChatSidebar
                isUserOnline={isUserOnline}
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onOpenNewConversationModal={() => setIsModalOpen(true)}
                typingUsers={typingUsers}
            />

            {/* Right: Message Area */}
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
            />

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
