"use client";

import { Mic } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// VoicePlayerCard — Clean Audio Player built with native HTML5 Controls
//
// Uses the browser's built-in <audio controls> element.
// 100% cross-browser compatible, zero-lag, instant play & seeking.
// ──────────────────────────────────────────────────────────────

interface VoicePlayerCardProps {
    url: string;
    isMe?: boolean;
}

export function VoicePlayerCard({ url, isMe = false }: VoicePlayerCardProps) {
    return (
        <div
            className={`flex flex-col gap-1.5 p-2.5 rounded-2xl w-72 max-w-[320px] shadow-sm transition-all ${isMe
                ? "bg-blue-600 text-white border border-blue-500/40"
                : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100"
                }`}
        >
            {/* Header Badge */}
            <div className="flex items-center justify-between px-1 text-[11px] font-medium opacity-80">
                <div className="flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5 text-blue-400" />
                    <span>Voice Message</span>
                </div>
            </div>

            {/* Built-in HTML5 Native Audio Component */}
            <div className="w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900/60 p-1">
                <audio
                    src={url}
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                    className="w-full h-9 focus:outline-none accent-blue-600"
                />
            </div>
        </div>
    );
}