"use client";

import { CheckSquare, Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Member } from "@/features/team/types";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface AssignedUserSummary {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
}

interface TaskAssigneesSectionProps {
    members: Member[];
    assignedUserIds: string[];
    assignedUsers: AssignedUserSummary[];
    isOpen: boolean;
    isUpdating: boolean;
    searchQuery: string;
    setIsOpen: (value: boolean) => void;
    setSearchQuery: (value: string) => void;
    onToggleAssignee: (memberUserId: string) => void;
}

function normalizeId(value: string | number | null | undefined): string {
    return value == null ? "" : String(value);
}

export function TaskAssigneesSection({
    members,
    assignedUserIds,
    assignedUsers,
    isOpen,
    isUpdating,
    searchQuery,
    setIsOpen,
    setSearchQuery,
    onToggleAssignee,
}: TaskAssigneesSectionProps) {
    const assignedLookup = new Set(assignedUserIds.map((id) => normalizeId(id)));

    const filteredMembers = members.filter((member) => {
        const haystack = [
            member.user?.name || "",
            member.user?.email || "",
            member.user?.username || "",
        ].join(" ").toLowerCase();

        return haystack.includes(searchQuery.toLowerCase());
    });

    const memberLookup = new Map(members.map(m => [normalizeId(m.user_id), m]));

    const renderedAssignedUsers = assignedUsers.length > 0
        ? assignedUsers.map(a => {
            const m = memberLookup.get(normalizeId(a.id));
            return {
                ...a,
                avatar_url: a.avatar_url || m?.user?.avatar_url || m?.user?.avatar,
            };
        })
        : members
            .filter((member) => assignedLookup.has(normalizeId(member.user_id)))
            .map((member) => ({
                id: normalizeId(member.user_id),
                name: member.user?.name || "Unknown user",
                email: member.user?.email || "",
                avatar_url: member.user?.avatar_url || member.user?.avatar,
            }));

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Assignees</h4>
                <span className="text-xs text-zinc-400">{assignedUserIds.length} selected</span>
            </div>

            <div className="relative flex w-full flex-wrap items-center gap-2">
                {renderedAssignedUsers.map((assignee) => (
                    <div
                        key={assignee.id}
                        className="group relative cursor-pointer transition-transform hover:scale-110"
                        title={assignee.name}
                    >
                        <UserAvatar name={assignee.name} avatarUrl={assignee.avatar_url} size="sm" />
                    </div>
                ))}

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-2 border-dashed hover:bg-zinc-100 dark:hover:bg-white/5"
                    onClick={(event) => {
                        event.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : <Plus className="h-4 w-4 text-zinc-500" />}
                </Button>

                {isOpen && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#0f0f0f]">
                        <div className="border-b border-zinc-200 p-3 dark:border-white/10">
                            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                                <Search className="h-4 w-4 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search members..."
                                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                            {filteredMembers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-zinc-500">No members match your search.</div>
                            ) : (
                                filteredMembers.map((member) => {
                                    const normalizedMemberUserId = normalizeId(member.user_id);
                                    const isAssigned = assignedLookup.has(normalizedMemberUserId);

                                    return (
                                        <button
                                            key={member.id}
                                            className={`flex w-full items-center justify-between px-3 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5 ${
                                                isAssigned ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                            }`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onToggleAssignee(normalizedMemberUserId);
                                            }}
                                            disabled={isUpdating}
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserAvatar
                                                    name={member.user?.name}
                                                    avatarUrl={member.user?.avatar_url || member.user?.avatar}
                                                    size="xs"
                                                />
                                                <div className="min-w-0 text-left">
                                                    <div className="truncate">{member.user?.name || "Unknown user"}</div>
                                                    <div className="truncate text-xs text-zinc-500">
                                                        @{member.user?.username || member.user?.email || normalizedMemberUserId}
                                                    </div>
                                                </div>
                                            </div>
                                            {isAssigned && <CheckSquare className="h-4 w-4 text-blue-500" />}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
