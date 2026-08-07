"use client";

import { useEffect, useState } from "react";
import { X, Search, Check, Users, Loader2 } from "lucide-react";
import { getMembers } from "@/features/team/api/team.api";
import { addGroupParticipants } from "../api/chat.api";
import { Member } from "@/features/team/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/shared/api/ApiError";
import { getInitials } from "../utils/chatHelpers";

interface AddMembersModalProps {
    isOpen: boolean;
    conversationId: number;
    existingParticipantUserIds: number[];
    onClose: () => void;
    onSuccess: () => void;
}

export function AddMembersModal({
    isOpen,
    conversationId,
    existingParticipantUserIds,
    onClose,
    onSuccess,
}: AddMembersModalProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch team members on open
    useEffect(() => {
        if (!isOpen) return;

        async function fetchMembers() {
            setIsLoading(true);
            try {
                const res = await getMembers();
                setMembers(res.members || []);
            } catch (err) {
                toast.error(getErrorMessage(err, "Failed to load workspace members"));
            } finally {
                setIsLoading(false);
            }
        }

        fetchMembers();
    }, [isOpen]);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery("");
            setSelectedUserIds([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Candidates: Workspace members NOT currently in the group
    const candidateMembers = members.filter((m) => {
        const userId = Number(m.user?.id || m.user_id);
        // Exclude existing group participants
        if (existingParticipantUserIds.includes(userId)) {
            return false;
        }

        const name = m.user?.name || "";
        const email = m.user?.email || "";
        return (
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    const toggleSelectUser = (userId: number) => {
        setSelectedUserIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMembers = async () => {
        if (selectedUserIds.length === 0) return;

        setIsSubmitting(true);
        try {
            await addGroupParticipants(conversationId, selectedUserIds);
            toast.success(`Added ${selectedUserIds.length} member(s) to group!`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to add members"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#111b21] w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="p-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                            <Users className="h-4 w-4" />
                        </div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                            Add Group Members
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-3 border-b border-zinc-100 dark:border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search workspace members by name or email..."
                            className="w-full pl-9 pr-3 py-1.5 bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Member Candidates List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-zinc-100 dark:divide-white/5">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className="text-xs">Loading team members...</span>
                        </div>
                    ) : candidateMembers.length === 0 ? (
                        <div className="py-12 text-center text-zinc-400 text-xs">
                            {searchQuery
                                ? "No members match your search."
                                : "All workspace members are already in this group!"}
                        </div>
                    ) : (
                        candidateMembers.map((m) => {
                            const userId = Number(m.user?.id || m.user_id);
                            const isSelected = selectedUserIds.includes(userId);

                            return (
                                <div
                                    key={m.id}
                                    onClick={() => toggleSelectUser(userId)}
                                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                                        isSelected
                                            ? "bg-blue-500/10 border border-blue-500/30"
                                            : "hover:bg-zinc-50 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {getInitials(m.user?.name || "User")}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                                {m.user?.name}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 truncate">
                                                {m.user?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Checkbox indicator */}
                                    <div
                                        className={`h-5 w-5 rounded-md flex items-center justify-center border transition-colors ${
                                            isSelected
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "border-zinc-300 dark:border-white/20"
                                        }`}
                                    >
                                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-white/[0.02]">
                    <span className="text-xs font-medium text-zinc-500">
                        {selectedUserIds.length} selected
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddMembers}
                            disabled={selectedUserIds.length === 0 || isSubmitting}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <span>Add Selected</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
