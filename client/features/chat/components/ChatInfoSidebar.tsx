"use client";

import { useEffect, useState } from "react";
import {
    X,
    Loader2,
    Hash,
    Users,
    FileText,
    ExternalLink,
    Bell,
    BellOff,
    Search,
    Trash2,
    LogOut,
    Ban,
    Image as ImageIcon,
    Video,
    Mic,
    UserPlus,
    AlertTriangle,
    Star,
} from "lucide-react";
import {
    getConversationInfo,
    removeGroupParticipant,
    updateParticipantRole,
    clearConversation,
    deleteConversation,
    muteConversation,
    getStarredMessages,
    toggleStarMessage,
} from "../api/chat.api";
import { getInitials, formatTime } from "../utils/chatHelpers";
import { VoicePlayerCard } from "./VoicePlayerCard";
import { AddMembersModal } from "./AddMembersModal";
import { MemberActionMenu } from "./MemberActionMenu";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MainTab = "info" | "media" | "starred";
type MediaTab = "images" | "videos" | "audio" | "docs";

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

// ─────────────────────────────────────────────
// Helpers — classify a single attachment
// ─────────────────────────────────────────────
function isImage(att: any) { return att.file_type?.startsWith("image/"); }
function isVideo(att: any) { return att.file_type?.startsWith("video/"); }
function isAudio(att: any) { return att.file_type?.startsWith("audio/") || att.original_name?.includes("voice_note"); }

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
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
    const [mediaTab, setMediaTab] = useState<MediaTab>("images");

    // Modal & Menu states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMemberForMenu, setSelectedMemberForMenu] = useState<any>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    // Confirmation dialog states for Clear & Delete & Mute
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
    const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);

    const [isSubmittingClear, setIsSubmittingClear] = useState(false);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const [isSubmittingMute, setIsSubmittingMute] = useState(false);
    const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

    // Starred Messages State
    const [starredMessages, setStarredMessages] = useState<any[]>([]);
    const [isLoadingStarred, setIsLoadingStarred] = useState(false);

    // Fetch from API
    const fetchInfo = async () => {
        setIsLoading(true);
        try {
            const data = await getConversationInfo(conversationId);
            setInfoData(data);
        } catch (err) {
            console.error("Failed to fetch sidebar info:", err);
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
            console.error("Failed to fetch starred messages:", err);
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

    const handleUnstar = async (msgId: number) => {
        try {
            await toggleStarMessage(conversationId, msgId);
            toast.success("Message unstarred");
            setStarredMessages((prev) => prev.filter((m) => m.id !== msgId));
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to unstar message"));
        }
    };

    // Destructure API response
    const conversation = infoData?.conversation;
    const participants = infoData?.participants || [];
    const mediaAttachments = infoData?.media_attachments || [];
    const docAttachments = infoData?.document_attachments || [];
    const groupsInCommon = infoData?.groups_in_common || [];

    // Current user's role in this group
    const myParticipant = participants.find((p: any) => p.user_id === currentUserId);
    const currentUserRole: "owner" | "admin" | "member" = myParticipant?.role || "member";

    // Existing user IDs array for AddMembersModal filter
    const existingParticipantUserIds = participants.map((p: any) => p.user_id);

    // For Direct Messages — find the other person
    const partner = participants.find((p: any) => p.user_id !== currentUserId)?.user;
    const isPartnerOnline = partner ? isUserOnline(partner.id) : false;

    // Conversation type helpers
    const isDirect = conversation?.type === "direct";
    const isGroup = conversation?.type === "group";
    const isProject = conversation?.type === "project";

    const displayName = isDirect ? partner?.name : conversation?.name;
    const subtitle = isDirect
        ? (isPartnerOnline ? "Online" : partner?.email || "Offline")
        : isProject ? "Project Channel"
            : `Group · ${participants.length} members`;

    // Classify media attachments by type
    const images = mediaAttachments.filter(isImage);
    const videos = mediaAttachments.filter(isVideo);
    const audios = mediaAttachments.filter(isAudio);
    const totalMedia = mediaAttachments.length + docAttachments.length;

    // Remove member handler
    const handleRemoveMember = async (userId: number) => {
        setIsRemoving(true);
        try {
            await removeGroupParticipant(conversationId, userId);
            toast.success("Member removed successfully!");
            setSelectedMemberForMenu(null);
            fetchInfo();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to remove member"));
        } finally {
            setIsRemoving(false);
        }
    };

    // Update role handler
    const handleUpdateRole = async (participantId: number, newRole: "owner" | "admin" | "member") => {
        setIsUpdatingRole(true);
        try {
            await updateParticipantRole(conversationId, participantId, newRole);
            toast.success("Role updated successfully!");
            setSelectedMemberForMenu(null);
            fetchInfo();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update role"));
        } finally {
            setIsUpdatingRole(false);
        }
    };

    // Clear Chat History handler
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

    // Delete / Leave Conversation handler
    const handleConfirmDeleteConversation = async () => {
        setIsSubmittingDelete(true);
        try {
            await deleteConversation(conversationId);
            toast.success(isDirect ? "Conversation deleted!" : "Left group successfully!");
            setIsDeleteConfirmOpen(false);
            if (onDeleteConversationSuccess) {
                onDeleteConversationSuccess(conversationId);
            }
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete conversation"));
        } finally {
            setIsSubmittingDelete(false);
        }
    };

    // Mute notifications handler
    const handleMute = async (durationMinutes: number | null) => {
        setIsSubmittingMute(true);
        try {
            const res = await muteConversation(conversationId, durationMinutes);
            toast.success(
                durationMinutes === 0
                    ? "Notifications unmuted!"
                    : durationMinutes === null
                        ? "Muted notifications indefinitely (Forever)"
                        : `Muted notifications for ${durationMinutes >= 1440 ? `${durationMinutes / 1440} day(s)` : `${durationMinutes} minute(s)`}`
            );
            setIsMuteModalOpen(false);
            fetchInfo();
            if (onMuteToggleSuccess) onMuteToggleSuccess(conversationId, res.is_muted);
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update mute settings"));
        } finally {
            setIsSubmittingMute(false);
        }
    };

    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────
    return (
        <aside className="w-full max-w-[420px] md:w-[420px] border-l border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0c] flex flex-col h-full shrink-0 z-20 select-none">

            {/* ── Header ─────────────────────────────── */}
            <div className="h-16 px-5 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-white">
                    {isDirect ? "Contact Info" : isProject ? "Project Info" : "Group Info"}
                </h3>
                <button onClick={onClose} title="Close" className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* ── Loading ─────────────────────────────── */}
            {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-400">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <p className="text-xs">Loading info...</p>
                </div>
            ) : (
                <>
                    {/* ── Main Tab Bar: Info | Media ──────────── */}
                    <div className="flex border-b border-zinc-200 dark:border-white/10 shrink-0">
                        {(["info", "media"] as MainTab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setMainTab(tab)}
                                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors relative ${mainTab === tab
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                    }`}
                            >
                                {tab === "media" ? `Media (${totalMedia})` : "Info"}
                                {mainTab === tab && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ═══════════════════════════════════════════
                        INFO TAB
                    ═══════════════════════════════════════════ */}
                    {mainTab === "info" && (
                        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5">

                            {/* 1. Profile Banner */}
                            <div className="p-6 flex flex-col items-center text-center gap-3">

                                {/* Avatar */}
                                <div className="relative">
                                    {isProject ? (
                                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                                            <Hash className="h-11 w-11" />
                                        </div>
                                    ) : isGroup ? (
                                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                                            <Users className="h-11 w-11" />
                                        </div>
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden">
                                            {partner?.avatar_url
                                                // eslint-disable-next-line @next/next/no-img-element
                                                ? <img src={partner.avatar_url} alt={partner.name} className="h-full w-full object-cover" />
                                                : getInitials(partner?.name || "Chat")
                                            }
                                        </div>
                                    )}
                                    {isDirect && isPartnerOnline && (
                                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0c]" />
                                    )}
                                </div>

                                {/* Name + subtitle */}
                                <div>
                                    <h4 className="font-bold text-lg text-zinc-900 dark:text-white">{displayName}</h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
                                </div>

                                {/* Quick Action Buttons (WhatsApp Style: Mute | Starred | Clear) */}
                                <div className="flex items-center justify-center gap-6 pt-2">
                                    {/* Mute Button */}
                                    <button
                                        onClick={() => setIsMuteModalOpen(true)}
                                        title={conversation?.is_muted ? "Unmute notifications" : "Mute notifications"}
                                        className={`flex flex-col items-center gap-1.5 transition-all group ${conversation?.is_muted
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                                            }`}
                                    >
                                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-xs ${conversation?.is_muted
                                            ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30"
                                            : "bg-zinc-100 dark:bg-white/10 group-hover:bg-zinc-200 dark:group-hover:bg-white/15"
                                            }`}>
                                            {conversation?.is_muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                                        </div>
                                        <span className="text-[11px] font-semibold">{conversation?.is_muted ? "Muted" : "Mute"}</span>
                                    </button>

                                    {/* Starred Messages Button (WhatsApp Style under profile) */}
                                    <button
                                        onClick={() => setMainTab("starred")}
                                        title="View Starred Messages"
                                        className="flex flex-col items-center gap-1.5 transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white group"
                                    >
                                        <div className="h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-xs bg-zinc-100 dark:bg-white/10 group-hover:bg-amber-500/10 group-hover:text-amber-500">
                                            <Star className="h-5 w-5 fill-amber-400/40 text-amber-500 stroke-[1.8]" />
                                        </div>
                                        <span className="text-[11px] font-semibold">Starred</span>
                                    </button>

                                    {/* Clear Chat Button */}
                                    <button
                                        onClick={() => setIsClearConfirmOpen(true)}
                                        title="Clear chat history"
                                        className="flex flex-col items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
                                    >
                                        <div className="h-11 w-11 rounded-2xl bg-zinc-100 dark:bg-white/10 group-hover:bg-red-500/10 flex items-center justify-center">
                                            <Trash2 className="h-5 w-5" />
                                        </div>
                                        <span className="text-[11px] font-semibold">Clear</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Members (Groups & Projects only) */}
                            {!isDirect && (
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                            {participants.length} Members
                                        </h5>

                                        <button
                                            onClick={() => setIsAddModalOpen(true)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs"
                                        >
                                            <UserPlus className="h-3.5 w-3.5" />
                                            <span>Add Member</span>
                                        </button>
                                    </div>

                                    <div className="divide-y divide-zinc-100 dark:divide-white/5 max-h-72 overflow-y-auto">
                                        {participants.map((member: any) => {
                                            const online = isUserOnline(member.user_id);
                                            const isMe = member.user_id === currentUserId;
                                            const isAdmin = member.role === "owner" || member.role === "admin";

                                            return (
                                                <div
                                                    key={member.id}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setSelectedMemberForMenu(member);
                                                    }}
                                                    title="Right-click for member options"
                                                    className="flex items-center justify-between py-2.5 px-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="relative shrink-0">
                                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                                                {getInitials(member.user?.name || "User")}
                                                            </div>
                                                            {online && (
                                                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0c]" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                                                {isMe ? "You" : member.user?.name}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-400 truncate">{member.user?.email}</p>
                                                        </div>
                                                    </div>
                                                    {isAdmin && (
                                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                                                            {member.role}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 3. Groups in Common (Direct Messages only) */}
                            {isDirect && (
                                <div className="p-5 space-y-3">
                                    <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                        {groupsInCommon.length} Groups in Common
                                    </h5>
                                    {groupsInCommon.length === 0 ? (
                                        <p className="text-xs text-zinc-400">No shared groups.</p>
                                    ) : (
                                        <div className="space-y-2 max-h-56 overflow-y-auto">
                                            {groupsInCommon.map((grp: any) => (
                                                <div key={grp.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5">
                                                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                                                        <Users className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{grp.name}</p>
                                                        <p className="text-[10px] text-zinc-400 capitalize">{grp.type === 'group' ? 'Group' : `${grp.type} group`}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4. Danger Zone */}
                            <div className="p-5 space-y-1">
                                <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Actions</h5>

                                {/* Clear Chat History */}
                                <button
                                    onClick={() => setIsClearConfirmOpen(true)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-sm font-medium"
                                >
                                    <Trash2 className="h-4 w-4 text-zinc-500 shrink-0" />
                                    <span>Clear chat history</span>
                                </button>

                                {/* Block / Unblock Contact (Direct Messages only) */}
                                {isDirect && partner && (
                                    <button
                                        onClick={async () => {
                                            const partnerUserId = partner.id || partner.user_id;
                                            if (conversation?.is_blocked_by_me) {
                                                if (onUnblockUser) {
                                                    // 1. Optimistic UI Update (Instant response)
                                                    setInfoData((prev: any) => ({
                                                        ...prev,
                                                        conversation: {
                                                            ...prev?.conversation,
                                                            is_blocked_by_me: false,
                                                        },
                                                    }));

                                                    try {
                                                        // 2. Execute API request in background
                                                        await onUnblockUser(partnerUserId);
                                                    } catch (error) {
                                                        // 3. Rollback state if request fails
                                                        setInfoData((prev: any) => ({
                                                            ...prev,
                                                            conversation: {
                                                                ...prev?.conversation,
                                                                is_blocked_by_me: true,
                                                            },
                                                        }));
                                                    }
                                                }
                                            } else {
                                                setIsBlockConfirmOpen(true);
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
                                    >
                                        <Ban className="h-4 w-4 text-red-500 shrink-0" />
                                        <span>{conversation?.is_blocked_by_me ? "Unblock User" : "Block User"}</span>
                                    </button>
                                )}

                                {/* Delete / Leave Conversation */}
                                {!isProject && (
                                    <button
                                        onClick={() => setIsDeleteConfirmOpen(true)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-medium"
                                    >
                                        <LogOut className="h-4 w-4 shrink-0" />
                                        <span>{isDirect ? "Delete chat" : currentUserRole === "owner" ? "Delete group" : "Leave group"}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════
                        MEDIA TAB
                    ═══════════════════════════════════════════ */}
                    {mainTab === "media" && (
                        <div className="flex-1 flex flex-col overflow-hidden">

                            {/* Media Sub-Tab Bar: Images | Videos | Audio | Docs */}
                            <div className="flex gap-1 px-4 py-2 border-b border-zinc-100 dark:border-white/5 shrink-0 overflow-x-auto scrollbar-none">
                                {[
                                    { key: "images", icon: <ImageIcon className="h-3.5 w-3.5" />, label: "Photos", count: images.length },
                                    { key: "videos", icon: <Video className="h-3.5 w-3.5" />, label: "Videos", count: videos.length },
                                    { key: "audio", icon: <Mic className="h-3.5 w-3.5" />, label: "Audio", count: audios.length },
                                    { key: "docs", icon: <FileText className="h-3.5 w-3.5" />, label: "Docs", count: docAttachments.length },
                                ].map(({ key, icon, label, count }) => (
                                    <button
                                        key={key}
                                        onClick={() => setMediaTab(key as MediaTab)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${mediaTab === key
                                            ? "bg-blue-600 text-white"
                                            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                                            }`}
                                    >
                                        {icon}
                                        {label}
                                        <span className={`text-[10px] px-1 rounded-full ${mediaTab === key ? "bg-white/20 text-white" : "bg-zinc-200 dark:bg-white/10 text-zinc-500"}`}>
                                            {count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Media Content Area */}
                            <div className="flex-1 overflow-y-auto p-4">

                                {/* Photos grid */}
                                {mediaTab === "images" && (
                                    images.length === 0 ? (
                                        <EmptyState icon={<ImageIcon className="h-8 w-8" />} label="No photos shared yet." />
                                    ) : (
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {images.map((att: any) => (
                                                <a key={att.id} href={att.download_url} target="_blank" rel="noreferrer"
                                                    className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 group"
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={att.download_url} alt={att.original_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                                                </a>
                                            ))}
                                        </div>
                                    )
                                )}

                                {/* Videos grid */}
                                {mediaTab === "videos" && (
                                    videos.length === 0 ? (
                                        <EmptyState icon={<Video className="h-8 w-8" />} label="No videos shared yet." />
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {videos.map((att: any) => (
                                                <div key={att.id} className="rounded-lg overflow-hidden border border-zinc-200 dark:border-white/10 bg-black">
                                                    <video src={att.download_url} controls className="w-full max-h-40 object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {/* Audio / Voice Notes list */}
                                {mediaTab === "audio" && (
                                    audios.length === 0 ? (
                                        <EmptyState icon={<Mic className="h-8 w-8" />} label="No voice notes shared yet." />
                                    ) : (
                                        <div className="space-y-2">
                                            {audios.map((att: any) => (
                                                <div key={att.id} className="rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-2">
                                                    <VoicePlayerCard url={att.download_url} isMe={false} />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {/* Documents list */}
                                {mediaTab === "docs" && (
                                    docAttachments.length === 0 ? (
                                        <EmptyState icon={<FileText className="h-8 w-8" />} label="No documents shared yet." />
                                    ) : (
                                        <div className="space-y-2">
                                            {docAttachments.map((doc: any) => (
                                                <a key={doc.id} href={doc.download_url} target="_blank" rel="noreferrer"
                                                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{doc.original_name}</p>
                                                            <p className="text-[10px] text-zinc-400 mt-0.5">{(doc.file_size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-2" />
                                                </a>
                                            ))}
                                        </div>
                                    )
                                )}

                            </div>
                        </div>
                    )}

                    {/* ── Main Tab 3: Starred Messages ──────────── */}
                    {mainTab === "starred" && (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoadingStarred ? (
                                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                                    <p className="text-xs">Loading starred messages...</p>
                                </div>
                            ) : starredMessages.length === 0 ? (
                                <EmptyState icon={<Star className="h-8 w-8 text-amber-400" />} label="No starred messages in this chat." />
                            ) : (
                                starredMessages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => onSelectMessage && onSelectMessage(msg.id)}
                                        title="Click to jump to message in chat"
                                        className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50 dark:bg-white/5 space-y-2.5 relative group hover:border-amber-500/40 hover:bg-amber-500/5 cursor-pointer transition-all shadow-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                                    {getInitials(msg.sender?.name || "U")}
                                                </div>
                                                <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                                                    {msg.sender?.name || "User"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-zinc-400">
                                                    {formatTime(msg.created_at)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUnstar(msg.id);
                                                    }}
                                                    title="Unstar message"
                                                    className="p-1 rounded-md text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                                                >
                                                    <Star className="h-3.5 w-3.5 fill-amber-400/40 text-amber-500 stroke-[1.8]" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">
                                            {msg.body}
                                        </p>

                                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/40 dark:border-white/5 text-[10px] text-amber-600 dark:text-amber-400 font-semibold group-hover:underline">
                                            <span>Go To Message</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Add Members Modal ─────────────────── */}
            <AddMembersModal
                isOpen={isAddModalOpen}
                conversationId={conversationId}
                existingParticipantUserIds={existingParticipantUserIds}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchInfo}
            />

            {/* ── Member Action Menu ────────────────── */}
            <MemberActionMenu
                isOpen={!!selectedMemberForMenu}
                targetMember={selectedMemberForMenu}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                isRemoving={isRemoving}
                isUpdatingRole={isUpdatingRole}
                onRemoveMember={handleRemoveMember}
                onUpdateRole={handleUpdateRole}
                onClose={() => setSelectedMemberForMenu(null)}
            />

            {/* ── Clear Chat Confirmation Dialog ────── */}
            {isClearConfirmOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#111b21] w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4">
                        <div className="flex items-center gap-3 text-amber-500">
                            <div className="p-2.5 rounded-full bg-amber-500/10">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-zinc-900 dark:text-white">Clear Chat History?</h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">This will hide message history for you.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                            <button
                                onClick={() => setIsClearConfirmOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmClearChat}
                                disabled={isSubmittingClear}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmittingClear && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>Clear Chat</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Conversation Confirmation Dialog ── */}
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#111b21] w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <div className="p-2.5 rounded-full bg-red-500/10">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-zinc-900 dark:text-white">
                                    {isDirect ? "Delete Conversation?" : currentUserRole === "owner" ? "Delete Group?" : "Leave Group?"}
                                </h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {isDirect ? "This chat will be removed from your sidebar." : "You will no longer participate in this group."}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                            <button
                                onClick={() => setIsDeleteConfirmOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDeleteConversation}
                                disabled={isSubmittingDelete}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmittingDelete && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>Confirm</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mute Notifications Modal Dialog ── */}
            {isMuteModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#111b21] w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-3">
                            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-base">
                                <BellOff className="h-5 w-5 text-amber-500" />
                                <span>Mute Notifications</span>
                            </div>
                            <button
                                onClick={() => setIsMuteModalOpen(false)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Choose how long you want to mute notifications for <strong className="text-zinc-900 dark:text-white">{displayName}</strong>:
                        </p>

                        <div className="space-y-1.5 pt-1">
                            {[
                                { label: "15 Minutes", minutes: 15, icon: "⏱️" },
                                { label: "1 Hour", minutes: 60, icon: "⏱️" },
                                { label: "8 Hours", minutes: 480, icon: "⏱️" },
                                { label: "24 Hours (1 Day)", minutes: 1440, icon: "📅" },
                                { label: "1 Week (7 Days)", minutes: 10080, icon: "📅" },
                                { label: "Forever (Indefinitely)", minutes: null, icon: "♾️" },
                            ].map((opt, idx) => (
                                <button
                                    key={idx}
                                    disabled={isSubmittingMute}
                                    onClick={() => handleMute(opt.minutes)}
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors group disabled:opacity-50"
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{opt.icon}</span>
                                        <span>{opt.label}</span>
                                    </span>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 font-bold">Select ➔</span>
                                </button>
                            ))}

                            {conversation?.is_muted && (
                                <button
                                    disabled={isSubmittingMute}
                                    onClick={() => handleMute(0)}
                                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors mt-2 disabled:opacity-50"
                                >
                                    <span className="flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        <span>Unmute Notifications</span>
                                    </span>
                                    <span className="text-[10px] font-bold">Activate 🔊</span>
                                </button>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-white/5">
                            <button
                                onClick={() => setIsMuteModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Block User Confirmation Modal Dialog ── */}
            {isBlockConfirmOpen && partner && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#111b21] w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 p-5 space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <div className="p-2.5 rounded-full bg-red-500/10">
                                <Ban className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-base text-zinc-900 dark:text-white">Block User?</h4>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Blocked contacts will no longer be able to send you messages.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                            <button
                                onClick={() => setIsBlockConfirmOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (onBlockUser) {
                                        const partnerUserId = partner.id || partner.user_id;

                                        // 1. Optimistic UI Update & close modal instantly
                                        setInfoData((prev: any) => ({
                                            ...prev,
                                            conversation: {
                                                ...prev?.conversation,
                                                is_blocked_by_me: true,
                                            },
                                        }));
                                        setIsBlockConfirmOpen(false);

                                        try {
                                            // 2. Execute API call in background
                                            await onBlockUser(partnerUserId);
                                        } catch (error) {
                                            // 3. Rollback state if request fails
                                            setInfoData((prev: any) => ({
                                                ...prev,
                                                conversation: {
                                                    ...prev?.conversation,
                                                    is_blocked_by_me: false,
                                                },
                                            }));
                                        }
                                    }
                                }}
                                disabled={isSubmittingBlock}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmittingBlock && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <span>Block User</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}

// ─────────────────────────────────────────────
// Small helper component — empty state message
// ─────────────────────────────────────────────
function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400 dark:text-zinc-600">
            {icon}
            <p className="text-xs">{label}</p>
        </div>
    );
}
