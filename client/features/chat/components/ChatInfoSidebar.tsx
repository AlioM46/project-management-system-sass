"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Hash, Users, Bell, BellOff, Search, Trash2, Ban, AlertTriangle, Star } from "lucide-react";
import {
    getConversationInfo,
    clearConversation,
    deleteConversation,
    muteConversation,
    getStarredMessages,
    toggleStarMessage,
} from "../api/chat.api";
import { getInitials, formatTime } from "../utils/chatHelpers";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";
import { ChatInfoTab } from "./info-sidebar/ChatInfoTab";
import { ChatMediaTab } from "./info-sidebar/ChatMediaTab";
import { ConfirmDialog, MuteModal } from "./info-sidebar/ChatModals";
import { AttachmentPreview } from "@/components/modals/task-details/attachment-preview";

type MainTab = "info" | "media" | "starred";

interface ChatInfoSidebarProps {
    conversationId: number;
    currentUserId: number;
    isUserOnline: (userId: number) => boolean;
    onClose: () => void;
    onClearChatSuccess?: () => void;
    onDeleteConversationSuccess?: (deletedId: number) => void;
    onMuteToggleSuccess?: (conversationId: number, isMuted: boolean) => void;
    onSelectMessage?: (messageId: number) => void;
    onBlockUser?: (userId: number) => Promise<void>;
    onUnblockUser?: (userId: number) => Promise<void>;
}

export function ChatInfoSidebar({
    conversationId,
    currentUserId,
    isUserOnline,
    onClose,
    onClearChatSuccess,
    onDeleteConversationSuccess,
    onMuteToggleSuccess,
    onSelectMessage,
    onBlockUser,
    onUnblockUser,
}: ChatInfoSidebarProps) {
    const [infoData, setInfoData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mainTab, setMainTab] = useState<MainTab>("info");

    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
    const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);

    const [isSubmittingClear, setIsSubmittingClear] = useState(false);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const [isSubmittingMute, setIsSubmittingMute] = useState(false);
    const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

    const [starredMessages, setStarredMessages] = useState<any[]>([]);
    const [isLoadingStarred, setIsLoadingStarred] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);

    const fetchInfo = async () => {
        setIsLoading(true);
        try {
            const data = await getConversationInfo(conversationId);
            setInfoData(data);
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to load info"));
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStarred = async () => {
        setIsLoadingStarred(true);
        try {
            const list = await getStarredMessages(conversationId);
            setStarredMessages(list);
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to load starred messages"));
        } finally {
            setIsLoadingStarred(false);
        }
    };

    useEffect(() => {
        fetchInfo();
    }, [conversationId]);

    useEffect(() => {
        if (mainTab === "starred") {
            fetchStarred();
        }
    }, [mainTab, conversationId]);

    const conversation = infoData?.conversation;
    const participants = infoData?.participants || [];
    const mediaAttachments = infoData?.media_attachments || [];
    const docAttachments = infoData?.document_attachments || [];
    const groupsInCommon = infoData?.groups_in_common || [];

    const myParticipant = participants.find((p: any) => p.user_id === currentUserId);
    const currentUserRole: "owner" | "admin" | "member" = myParticipant?.role || "member";

    const partner = participants.find((p: any) => p.user_id !== currentUserId)?.user;
    const isPartnerOnline = partner ? isUserOnline(partner.id) : false;

    const isDirect = conversation?.type === "direct";
    const isGroup = conversation?.type === "group";
    const isProject = conversation?.type === "project";

    const displayName = isDirect ? partner?.name : conversation?.name;
    const subtitle = isDirect
        ? isPartnerOnline ? "Online" : partner?.email || "Offline"
        : isProject ? "Project Channel"
            : `Group · ${participants.length} members`;

    const handleMute = async (minutes: number) => {
        setIsSubmittingMute(true);
        try {
            const res = await muteConversation(conversationId, minutes === 0 ? null : minutes);
            setInfoData((prev: any) => ({
                ...prev,
                conversation: {
                    ...prev.conversation,
                    is_muted: res.is_muted,
                    muted_until: res.muted_until,
                },
            }));
            if (onMuteToggleSuccess) onMuteToggleSuccess(conversationId, res.is_muted);
            toast.success(res.is_muted ? "Notifications muted" : "Notifications unmuted");
            setIsMuteModalOpen(false);
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to update mute settings"));
        } finally {
            setIsSubmittingMute(false);
        }
    };

    const handleConfirmClearChat = async () => {
        setIsSubmittingClear(true);
        try {
            await clearConversation(conversationId);
            toast.success("Chat history cleared!");
            setIsClearConfirmOpen(false);
            if (onClearChatSuccess) onClearChatSuccess();
            fetchInfo();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to clear chat history"));
        } finally {
            setIsSubmittingClear(false);
        }
    };

    const handleConfirmDeleteConversation = async () => {
        setIsSubmittingDelete(true);
        try {
            await deleteConversation(conversationId);
            toast.success(isDirect ? "Conversation deleted!" : "Left group successfully!");
            setIsDeleteConfirmOpen(false);
            if (onDeleteConversationSuccess) onDeleteConversationSuccess(conversationId);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete conversation"));
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    return (
        <aside className="w-80 border-l border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 flex flex-col h-full shrink-0 z-20">
            {/* Header */}
            <div className="h-16 px-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Contact Info</h4>
                <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center text-zinc-500 transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    {/* Profile Banner */}
                    <div className="p-6 flex flex-col items-center border-b border-zinc-100 dark:border-white/5 text-center shrink-0">
                        <div className="relative mb-3">
                            {partner?.avatar_url ? (
                                <img src={partner.avatar_url} alt={displayName} className="h-16 w-16 rounded-full object-cover border-2 border-zinc-200 dark:border-white/10 shadow-sm" />
                            ) : (
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                                    {getInitials(displayName || "Chat")}
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white">{displayName}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>

                        <button
                            onClick={() => setIsMuteModalOpen(true)}
                            className={`mt-4 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${conversation?.is_muted
                                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-500/30"
                                    : "bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                                }`}
                        >
                            {conversation?.is_muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                            <span>{conversation?.is_muted ? "Muted" : "Mute Notifications"}</span>
                        </button>
                    </div>

                    {/* Main Tabs */}
                    <div className="flex border-b border-zinc-100 dark:border-white/5 px-4 shrink-0">
                        {[
                            { key: "info", label: "Overview" },
                            { key: "media", label: "Media" },
                            { key: "starred", label: "Starred" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setMainTab(tab.key as MainTab)}
                                className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${mainTab === tab.key
                                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-zinc-500 hover:text-zinc-800"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Active Tab Component */}
                    {mainTab === "info" && (
                        <ChatInfoTab
                            conversation={conversation}
                            isDirect={isDirect}
                            isProject={isProject}
                            partner={partner}
                            groupsInCommon={groupsInCommon}
                            currentUserRole={currentUserRole}
                            onOpenClearModal={() => setIsClearConfirmOpen(true)}
                            onOpenDeleteModal={() => setIsDeleteConfirmOpen(true)}
                            onOpenBlockModal={() => setIsBlockConfirmOpen(true)}
                            onUnblockUser={onUnblockUser}
                            onOptimisticUnblock={() =>
                                setInfoData((prev: any) => ({ ...prev, conversation: { ...prev.conversation, is_blocked_by_me: false } }))
                            }
                        />
                    )}

                    {mainTab === "media" && (
                        <ChatMediaTab
                            mediaAttachments={mediaAttachments}
                            docAttachments={docAttachments}
                            onPreviewAttachment={(att) => setPreviewAttachment(att)}
                        />
                    )}

                    {mainTab === "starred" && (
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                            {isLoadingStarred ? (
                                <div className="py-12 text-center text-xs text-zinc-400">Loading starred messages...</div>
                            ) : starredMessages.length === 0 ? (
                                <div className="py-12 text-center text-xs text-zinc-400">No starred messages saved yet.</div>
                            ) : (
                                starredMessages.map((msg) => (
                                    <div key={msg.id} className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 space-y-1">
                                        <p className="text-xs font-semibold text-blue-500">{msg.user?.name}</p>
                                        <p className="text-xs text-zinc-800 dark:text-zinc-200">{msg.body}</p>
                                        <p className="text-[10px] text-zinc-400 text-right">{formatTime(msg.created_at)}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Confirmation Modals */}
            <ConfirmDialog
                isOpen={isClearConfirmOpen}
                title="Clear Chat History?"
                description="All messages in this chat will be deleted for you."
                confirmText="Clear History"
                isSubmitting={isSubmittingClear}
                icon={<Trash2 className="h-6 w-6" />}
                onClose={() => setIsClearConfirmOpen(false)}
                onConfirm={handleConfirmClearChat}
            />

            <ConfirmDialog
                isOpen={isDeleteConfirmOpen}
                title={isDirect ? "Delete Conversation?" : "Leave Group?"}
                description={isDirect ? "This chat will be removed from your sidebar." : "You will leave this group."}
                confirmText="Confirm"
                isSubmitting={isSubmittingDelete}
                icon={<Trash2 className="h-6 w-6" />}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDeleteConversation}
            />

            <ConfirmDialog
                isOpen={isBlockConfirmOpen}
                title="Block User?"
                description="Blocked contacts will no longer be able to send you messages."
                confirmText="Block User"
                isSubmitting={isSubmittingBlock}
                icon={<Ban className="h-6 w-6" />}
                onClose={() => setIsBlockConfirmOpen(false)}
                onConfirm={async () => {
                    if (onBlockUser && partner) {
                        const partnerUserId = partner.id || partner.user_id;
                        setInfoData((prev: any) => ({ ...prev, conversation: { ...prev.conversation, is_blocked_by_me: true } }));
                        setIsBlockConfirmOpen(false);
                        try {
                            await onBlockUser(partnerUserId);
                        } catch (err) {
                            setInfoData((prev: any) => ({ ...prev, conversation: { ...prev.conversation, is_blocked_by_me: false } }));
                        }
                    }
                }}
            />

            <MuteModal
                isOpen={isMuteModalOpen}
                displayName={displayName || "Chat"}
                isSubmitting={isSubmittingMute}
                onClose={() => setIsMuteModalOpen(false)}
                onMute={handleMute}
            />

            {/* Preview Modal */}
            {previewAttachment && (
                <AttachmentPreview
                    url={previewAttachment.download_url}
                    fileName={previewAttachment.original_name}
                    fileType={previewAttachment.file_type}
                />
            )}
        </aside>
    );
}
