"use client";

import { ChatSidebar } from "@/features/chat/components/ChatSidebar";
import { ChatMessageArea } from "@/features/chat/components/ChatMessageArea";
import { NewConversationModal } from "@/features/chat/components/NewConversationModal";
import { ChatSearchSidebar } from "@/features/chat/components/ChatSearchSidebar";
import { ChatInfoSidebar } from "@/features/chat/components/ChatInfoSidebar";
import { useState } from "react";
import { usePresence } from "@/features/chat/components/PresenceProvider";
import { useChatState } from "@/features/chat/hooks/useChatState";
import { useChatActions } from "@/features/chat/hooks/useChatActions";

export default function ChatPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
    const { isUserOnline } = usePresence();

    const state = useChatState();
    const actions = useChatActions({
        activeConversationId: state.activeConversationId,
        currentUserId: state.currentUserId,
        messages: state.messages,
        setMessages: state.setMessages,
        setConversations: state.setConversations,
        setIsSending: state.setIsSending,
        setInputText: state.setInputText,
        setIsLoading: state.setIsLoading,
        setHasBeforeMessages: state.setHasBeforeMessages,
        setHasAfterMessages: state.setHasAfterMessages,
    });

    const activeConversation = state.conversations.find((c) => c.id === state.activeConversationId) || null;

    const handleConversationCreated = (conversation: any) => {
        state.setConversations((prev) => [conversation, ...prev]);
        state.setActiveConversationId(conversation.id);
        setIsModalOpen(false);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
            {/* Left: Chat List Sidebar */}
            <ChatSidebar
                conversations={state.conversations}
                activeConversationId={state.activeConversationId}
                onSelectConversation={state.selectConversation}
                onOpenNewConversationModal={() => setIsModalOpen(true)}
                isUserOnline={isUserOnline}
                typingUsers={state.typingUsers}
            />

            {/* Center: Main Chat Area */}
            <ChatMessageArea
                conversation={activeConversation}
                messages={state.messages}
                currentUserId={state.currentUserId ?? 0}
                inputText={state.inputText}
                onInputTextChange={state.setInputText}
                handleSendMessage={actions.handleSendMessage}
                isSending={state.isSending}
                isUserOnline={isUserOnline}
                typingUsers={state.typingUsers}
                onTyping={state.sendTyping}
                recordingUsers={state.recordingUsers}
                onRecording={state.sendRecording}
                onToggleReaction={actions.handleToggleReaction}
                onToggleStarMessage={actions.handleToggleStarMessage}
                onDeleteForMe={actions.handleDeleteForMeMessage}
                onDeleteForAll={actions.handleDeleteForAllMessage}
                onEditMessage={actions.handleUpdateMessage}
                onUnblockUser={actions.handleUnblockUser}
                hasBefore={state.hasBeforeMessages}
                hasAfter={state.hasAfterMessages}
                onLoadMore={actions.handleLoadMoreMessages}
                onLoadNewer={actions.handleLoadNewerMessages}
                onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
                isSearchOpen={isSearchOpen}
                onToggleInfoSidebar={() => setIsInfoSidebarOpen((prev) => !prev)}
                isInfoSidebarOpen={isInfoSidebarOpen}
            />

            {/* Right: Message Search Sidebar */}
            {isSearchOpen && (
                <ChatSearchSidebar
                    conversationId={state.activeConversationId}
                    onClose={() => setIsSearchOpen(false)}
                    onSelectMessage={actions.handleSelectSearchMessage}
                />
            )}

            {/* Right: Conversation Info Sidebar */}
            {isInfoSidebarOpen && state.activeConversationId && (
                <ChatInfoSidebar
                    conversationId={state.activeConversationId}
                    currentUserId={state.currentUserId ?? 0}
                    isUserOnline={isUserOnline}
                    onClose={() => setIsInfoSidebarOpen(false)}
                    onClearChatSuccess={() => state.setMessages([])}
                    onDeleteConversationSuccess={(deletedId) => {
                        state.setConversations((prev) => prev.filter((c) => c.id !== deletedId));
                        state.setActiveConversationId(null);
                        setIsInfoSidebarOpen(false);
                    }}
                    onMuteToggleSuccess={(mutedId, isMuted) => {
                        state.setConversations((prev) =>
                            prev.map((c) => (c.id === mutedId ? { ...c, is_muted: isMuted } : c))
                        );
                    }}
                    onSelectMessage={actions.handleSelectSearchMessage}
                    onBlockUser={actions.handleBlockUser}
                    onUnblockUser={actions.handleUnblockUser}
                />
            )}

            {/* New Conversation Modal */}
            <NewConversationModal
                isOpen={isModalOpen}
                currentUserId={state.currentUserId}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleConversationCreated}
            />
        </div>
    );
}
