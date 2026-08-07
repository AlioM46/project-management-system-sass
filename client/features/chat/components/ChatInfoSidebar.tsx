"use client";

import { useEffect, useState } from "react";
import {
    X,
    Loader2,
    Hash,
    Users,
    FileText,
    ExternalLink,
    BellOff,
    Search,
    Trash2,
    LogOut,
    Ban,
    Image as ImageIcon,
    Video,
    Mic,
    UserPlus,
    Pencil,
    Check,
} from "lucide-react";
import { getConversationInfo, removeGroupParticipant, updateParticipantRole, updateGroupDetails } from "../api/chat.api";
import { getInitials } from "../utils/chatHelpers";
import { VoicePlayerCard } from "./VoicePlayerCard";
import { AddMembersModal } from "./AddMembersModal";
import { MemberActionMenu } from "./MemberActionMenu";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MainTab = "info" | "media";
type MediaTab = "images" | "videos" | "audio" | "docs";

interface ChatInfoSidebarProps {
    conversationId: number;
    currentUserId: number;
    isUserOnline: (userId: number) => boolean;
    onClose: () => void;
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
}: ChatInfoSidebarProps) {
    const [infoData, setInfoData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mainTab, setMainTab] = useState<MainTab>("info");
    const [mediaTab, setMediaTab] = useState<MediaTab>("images");

    // Modal & Menu states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMemberForMenu, setSelectedMemberForMenu] = useState<any>(null);
    const [isRemoving, setIsRemoving] = useState(false);

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

    useEffect(() => {
        fetchInfo();
    }, [conversationId]);

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

    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [editedDescription, setEditedDescription] = useState("");
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    const canEditGroupDetails = (!isDirect) && (currentUserRole === "owner" || currentUserRole === "admin");

    useEffect(() => {
        if (conversation) {
            setEditedName(conversation.name || "");
            setEditedDescription(conversation.description || "");
        }
    }, [conversation]);

    const handleSaveGroupDetails = async () => {
        setIsSavingDetails(true);
        try {
            await updateGroupDetails(conversationId, {
                name: editedName,
                description: editedDescription,
            });
            toast.success("Group details updated successfully!");
            setIsEditingDetails(false);
            fetchInfo();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update group details"));
        } finally {
            setIsSavingDetails(false);
        }
    };

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

    // Update member role handler (Admin/Owner promote/demote)
    const handleUpdateRole = async (participantId: number, newRole: "owner" | "admin" | "member") => {
        setIsUpdatingRole(true);
        try {
            await updateParticipantRole(conversationId, participantId, newRole);
            toast.success(`User role updated to ${newRole}!`);
            setSelectedMemberForMenu(null);
            fetchInfo();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update member role"));
        } finally {
            setIsUpdatingRole(false);
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

                                {/* Name + subtitle / Edit details mode */}
                                {isEditingDetails ? (
                                    <div className="w-full max-w-xs space-y-2 text-start">
                                        <div>
                                            <label className="text-[10px] font-semibold uppercase text-zinc-400">Group Name</label>
                                            <input
                                                type="text"
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
                                                placeholder="Group Name"
                                                className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold uppercase text-zinc-400">Description</label>
                                            <textarea
                                                value={editedDescription}
                                                onChange={(e) => setEditedDescription(e.target.value)}
                                                placeholder="Add group description..."
                                                rows={2}
                                                className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 text-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => setIsEditingDetails(false)}
                                                className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveGroupDetails}
                                                disabled={isSavingDetails}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {isSavingDetails ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                                <span>Save</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col items-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <h4 className="font-bold text-lg text-zinc-900 dark:text-white">{displayName}</h4>
                                            {canEditGroupDetails && (
                                                <button
                                                    onClick={() => setIsEditingDetails(true)}
                                                    className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
                                                    title="Edit Group Name & Description"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>

                                        {/* Description preview */}
                                        {(conversation?.description || canEditGroupDetails) && !isDirect && (
                                            <div className="w-full px-4 py-2.5 mt-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 text-start">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Description</p>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                                                    {conversation?.description || (
                                                        <span className="italic text-zinc-400">No description added yet.</span>
                                                    )}
                                                </p>
                                            </div>
                                        )}

                                        {/* Direct message partner custom status display */}
                                        {isDirect && partner?.custom_status && (
                                            <div className="w-full px-4 py-2.5 mt-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 text-start">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Status</p>
                                                <p className="text-xs text-zinc-600 dark:text-zinc-300 italic">
                                                    "{partner.custom_status}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Quick Action Buttons */}
                                <div className="flex items-center justify-center gap-4 pt-1">
                                    {[
                                        { icon: <BellOff className="h-4 w-4" />, label: "Mute", hint: "Mute notifications (coming soon)" },
                                        { icon: <Search className="h-4 w-4" />, label: "Search", hint: "Search in chat (coming soon)" },
                                        { icon: <Trash2 className="h-4 w-4" />, label: "Clear", hint: "Clear chat history (coming soon)" },
                                    ].map(({ icon, label, hint }) => (
                                        <button
                                            key={label}
                                            title={hint}
                                            className="flex flex-col items-center gap-1 text-zinc-500 dark:text-zinc-400 opacity-60 cursor-not-allowed"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                                                {icon}
                                            </div>
                                            <span className="text-[11px]">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Members (Groups & Projects only) */}
                            {!isDirect && (
                                <div className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                            {participants.length} Members
                                        </h5>

                                        {/* + Add Member Button (All participants allowed to click per requirement) */}
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

                                {!isDirect && (
                                    <button title="Leave group (coming soon)" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm opacity-60 cursor-not-allowed">
                                        <LogOut className="h-4 w-4 shrink-0" />
                                        <span>Leave group</span>
                                    </button>
                                )}

                                {isDirect && (
                                    <button title="Block user (coming soon)" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm opacity-60 cursor-not-allowed">
                                        <Ban className="h-4 w-4 shrink-0" />
                                        <span>Block {partner?.name || "user"}</span>
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
