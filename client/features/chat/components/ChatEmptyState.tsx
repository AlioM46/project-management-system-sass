"use client";

import React from "react";
import { MessageSquarePlus, Users, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatEmptyStateProps {
    onOpenNewConversationModal?: () => void;
}

export function ChatEmptyState({ onOpenNewConversationModal }: ChatEmptyStateProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/50 dark:bg-[#050505] overflow-y-auto">
            <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Visual Icon Badge */}
                <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-3xl blur-xl opacity-25 dark:opacity-35 animate-pulse" />
                    <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/10 shadow-xl flex items-center justify-center">
                        <MessageSquarePlus className="h-9 w-9 text-blue-600 dark:text-blue-400" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        No conversations yet
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                        Connect with your team members in real time. Start a private 1-on-1 chat or create a group channel to collaborate.
                    </p>
                </div>

                {/* Primary Action Button */}
                {onOpenNewConversationModal && (
                    <div className="pt-1">
                        <Button
                            onClick={onOpenNewConversationModal}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Start a Conversation</span>
                        </Button>
                    </div>
                )}

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0a0a0a] border border-zinc-200/70 dark:border-white/10 shadow-xs space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
                            <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <span>Direct Messages</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                            1-on-1 private messaging with live typing, online status, and voice notes.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0a0a0a] border border-zinc-200/70 dark:border-white/10 shadow-xs space-y-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
                            <div className="p-1 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                            <span>Group Channels</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                            Team groups and project spaces with file attachments and search.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
