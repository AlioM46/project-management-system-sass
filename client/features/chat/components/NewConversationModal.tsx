"use client";

import { useEffect, useState } from "react";
import { X, MessageSquare, Users, User, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMembers } from "@/features/team/api/team.api";
import { createConversation } from "@/features/chat/api/chat.api";
import { Conversation } from "@/features/chat/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";
import { Member } from "@/features/team/types";

interface NewConversationModalProps {
    isOpen: boolean;
    currentUserId: number | null;
    onClose: () => void;
    onSuccess: (conversation: Conversation) => void;
}

interface TeamMemberItem {
    id: number;
    user_id: number;
    user: {
        id: number;
        name: string;
        email: string;
        avatar_url: string | null;
    };
}

export function NewConversationModal({
    isOpen,
    currentUserId,
    onClose,
    onSuccess,
}: NewConversationModalProps) {
    const [mode, setMode] = useState<"direct" | "group">("direct");
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [groupName, setGroupName] = useState("");
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch team members when modal opens
    useEffect(() => {
        if (!isOpen) return;

        async function fetchMembers() {
            setIsLoadingMembers(true);
            try {
                const res = await getMembers();
                setMembers(res.members || []);
            } catch (err) {
                toast.error(getErrorMessage(err, "Failed to load team members"));
            } finally {
                setIsLoadingMembers(false);
            }
        }

        fetchMembers();
    }, [isOpen]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setSelectedUserIds([]);
            setGroupName("");
            setMode("direct");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter out current user and match search query
    const filteredMembers = members.filter((m) => {
        const memberUserId = m.user?.id || m.user_id;
        if (currentUserId && Number(memberUserId) === Number(currentUserId)) {
            return false;
        }
        const name = m.user?.name || "";
        const email = m.user?.email || "";
        return (
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    // Start a Direct Message (1-on-1)
    const handleStartDirectMessage = async (targetUserId: number) => {
        setIsSubmitting(true);
        try {
            const conv = await createConversation("direct", [targetUserId]);
            toast.success("Conversation opened!");
            onSuccess(conv);
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to start direct message"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle user selection for Group Chat
    const toggleUserSelection = (userId: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    // Create Group Chat
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        if (selectedUserIds.length === 0) {
            toast.error("Please select at least one member for the group");
            return;
        }

        setIsSubmitting(true);
        try {
            const conv = await createConversation("group", selectedUserIds, groupName.trim());
            toast.success("Group created!");
            onSuccess(conv);
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to create group"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Body */}
            <div className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                                New Conversation
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Send a message to team members
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-zinc-100 dark:hover:bg-white/5"
                    >
                        <X className="h-5 w-5 text-zinc-500" />
                    </Button>
                </div>

                {/* Mode Selector Tabs (Direct vs Group) */}
                <div className="p-3 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02] flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode("direct")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${mode === "direct"
                            ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-white/10"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                            }`}
                    >
                        <User className="h-3.5 w-3.5" />
                        Direct Message
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("group")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${mode === "group"
                            ? "bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-white/10"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                            }`}
                    >
                        <Users className="h-3.5 w-3.5" />
                        Group Chat
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {/* Group Name input (Only for Group Mode) */}
                    {mode === "group" && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Group Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="e.g. Design Sync, Marketing Team"
                                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                required
                            />
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search members..."
                            className="w-full h-9 pl-9 pr-3 rounded-xl bg-zinc-50 dark:bg-white/5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    {/* Members List */}
                    <div className="space-y-1">
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                            Team Members ({filteredMembers.length})
                        </p>

                        {isLoadingMembers ? (
                            <div className="py-8 text-center text-xs text-zinc-400">
                                Loading team members...
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="py-8 text-center text-xs text-zinc-400">
                                No team members found.
                            </div>
                        ) : (
                            filteredMembers.map((member) => {
                                const memberUserId = Number(member.user?.id || member.user_id);
                                const isSelected = selectedUserIds.includes(memberUserId);
                                const name = member.user?.name || "Team Member";
                                const email = member.user?.email || "";

                                if (mode === "direct") {
                                    return (
                                        <button
                                            key={member.id || memberUserId}
                                            onClick={() => handleStartDirectMessage(memberUserId)}
                                            disabled={isSubmitting}
                                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
                                                    {name[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                                        {name}
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400 truncate">
                                                        {email}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                                Message →
                                            </span>
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        key={member.id || memberUserId}
                                        onClick={() => toggleUserSelection(memberUserId)}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${isSelected
                                            ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30"
                                            : "hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
                                                {name[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                                    {name}
                                                </p>
                                                <p className="text-[11px] text-zinc-400 truncate">
                                                    {email}
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${isSelected
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-zinc-300 dark:border-white/20"
                                                }`}
                                        >
                                            {isSelected && <Check className="h-3.5 w-3.5" />}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer (For Group Mode Submit) */}
                {mode === "group" && (
                    <div className="p-4 border-t border-zinc-200 dark:border-white/10 flex justify-end gap-2 bg-zinc-50/50 dark:bg-white/[0.02]">
                        <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleCreateGroup}
                            disabled={isSubmitting || selectedUserIds.length === 0 || !groupName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                        >
                            {isSubmitting
                                ? "Creating..."
                                : `Create Group (${selectedUserIds.length}) Member`}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
