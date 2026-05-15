"use client";

import { useState, useEffect } from "react";
import { UserPlus, Search, Shield, MoreHorizontal, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMembers, sendInvite } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";
import { toast } from "sonner";

export default function TeamPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await getMembers();
                setMembers(response.members || (Array.isArray(response) ? response : []));
            } catch (error) {
                console.error("Failed to fetch members:", error);
                toast.error("Failed to load team members.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        
        try {
            await sendInvite({ email: inviteEmail, role: 'member' });
            toast.success("Invitation sent successfully!");
            setInviteEmail("");
        } catch (error) {
            console.error("Failed to send invite:", error);
            toast.error("Failed to send invitation.");
        }
    };

    const filteredMembers = members.filter(m => 
        m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Team Members</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                        Manage who has access to this workspace.
                    </p>
                </div>
                
                <form onSubmit={handleInvite} className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                            type="email"
                            placeholder="Email address..."
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full pl-9 pr-4 h-11 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white shadow-sm"
                            required
                        />
                    </div>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md gap-2 rounded-xl h-11 px-6 shrink-0">
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Invite Member</span>
                        <span className="sm:hidden">Invite</span>
                    </Button>
                </form>
            </div>

            {/* Filters and Search */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-[#0a0a0a] p-4 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                </div>
            </div>

            {/* Data Table / List */}
            <div className="bg-white dark:bg-[#0a0a0a] rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="h-8 w-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">No members found</h3>
                        <p className="text-zinc-500 max-w-sm mt-2">
                            Invite your teammates to collaborate in this workspace.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-white/10">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-white/10">
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                                                    {member.user?.name?.charAt(0).toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-zinc-900 dark:text-white">
                                                        {member.user?.name || "Unknown User"}
                                                    </p>
                                                    <p className="text-zinc-500 text-xs mt-0.5">
                                                        {member.user?.email || "No email"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                member.role === 'owner' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400' :
                                                member.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400' :
                                                'bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-400'
                                            }`}>
                                                {member.role === 'owner' && <Shield className="h-3 w-3" />}
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative inline-block text-left opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenDropdownId(openDropdownId === member.id ? null : member.id);
                                                    }}
                                                    className="h-8 w-8 p-0 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>

                                                {openDropdownId === member.id && (
                                                    <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-10 text-left">
                                                        <button 
                                                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                                                            onClick={() => toast.info("Change role feature coming soon!")}
                                                        >
                                                            Change Role
                                                        </button>
                                                        <button 
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toast.info("Remove member feature coming soon!");
                                                                setOpenDropdownId(null);
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
