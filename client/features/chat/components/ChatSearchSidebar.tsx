"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Calendar, FileText } from "lucide-react";
import { Message } from "../types";
import { searchMessages } from "../api/chat.api";
import { getErrorMessage } from "@/shared/api/ApiError";
import { toast } from "sonner";
import { getInitials, formatDate, highlightMatch } from "../utils/chatHelpers";

interface ChatSearchSidebarProps {
    conversationId: number | null;
    onClose: () => void;
    onSelectMessage: (messageId: number) => void;
}

export function ChatSearchSidebar({
    conversationId,
    onClose,
    onSelectMessage,
}: ChatSearchSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input on open
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Debounced search logic
    useEffect(() => {
        if (!conversationId || !searchQuery.trim()) {
            setResults([]);
            setHasSearched(false);
            setIsLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await searchMessages(conversationId, searchQuery.trim());
                setResults(res.data || []);
                setHasSearched(true);
            } catch (error) {
                toast.error(getErrorMessage(error, "Failed to search messages"));
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, conversationId]);

    return (
        <div className="w-80 h-full border-l border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 flex flex-col shrink-0 shadow-lg z-20 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="h-[65px] px-4 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-zinc-50/50 dark:bg-zinc-900">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-colors"
                        title="Close search"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Search Messages
                    </h3>
                </div>
            </div>

            {/* Search Input Field */}
            <div className="p-3 border-b border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900">
                <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search within conversation..."
                        className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-blue-500/50 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 h-4 w-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center justify-center rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results List Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-xs">Searching messages...</span>
                    </div>
                ) : !searchQuery.trim() ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-400 text-center px-4">
                        <Search className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3 stroke-[1.5]" />
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Search for messages within this chat
                        </p>
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-zinc-400 text-center px-4">
                        <FileText className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3 stroke-[1.5]" />
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            No messages found matching &quot;{searchQuery}&quot;
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                            Found {results.length} {results.length === 1 ? "result" : "results"}
                        </div>
                        {results.map((msg) => (
                            <button
                                key={msg.id}
                                onClick={() => onSelectMessage(msg.id)}
                                className="w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all flex items-start gap-3 group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700/50"
                            >
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-white">
                                        {getInitials(msg.sender?.name || "U")}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                            {msg.sender?.name || "User"}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 shrink-0">
                                            {formatDate(msg.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                                        {highlightMatch(msg.body, searchQuery)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
