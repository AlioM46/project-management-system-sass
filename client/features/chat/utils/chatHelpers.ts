import React from "react";

/**
 * Extracts up to 2 uppercase initials from a name string.
 * Example: "John Doe" -> "JD"
 */
export function getInitials(name: string): string {
    if (!name) return "U";
    return name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

/**
 * Formats a date string into 12-hour time format (e.g. "02:30 PM").
 */
export function formatTime(dateStr: string): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Formats a date string into readable chat date format.
 * Returns time if today (e.g. "02:30 PM"), or short date if older (e.g. "Aug 4").
 */
export function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

/**
 * Highlights matches of query within text string using Regex capture groups.
 */
export function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query?.trim() || !text) return text;

    // Escapes special regex characters in query to prevent invalid regex errors
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Using parenthesis around regex pattern turns it into a CAPTURE GROUP.
    // String.prototype.split with a capture group includes the matched query delimiters in the returned array!

    const RegExpMagic = new RegExp(`(${escapedQuery})`, "gi");



    const parts = text.split(RegExpMagic);

    return (
        React.createElement("span", null,
            parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? React.createElement("mark", {
                        key: i,
                        className: "bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 rounded-xs px-0.5 font-medium"
                    }, part)
                    : part
            )
        )
    );
}

/**
 * Resolves the display name for a conversation (Project, Group, or Direct Message).
 */
export function getConversationName(conv: any, currentUserId?: number): string {
    if (!conv) return "Chat";
    if (conv.type === "project" && conv.project) {
        return conv.project.name;
    }
    if (conv.name) return conv.name;

    if (conv.participants) {
        const partner = conv.participants.find((p: any) => (p.user_id || p.user?.id || p.id) !== currentUserId);
        if (partner?.user?.name) return partner.user.name;
    }
    return "Direct Message";
}

/**
 * Returns an emoji icon string based on file mime type or extension.
 */
export function getFileIcon(type: string = "", name: string = ""): string {
    const mime = type.toLowerCase();
    const ext = name.toLowerCase();

    if (mime.startsWith("image/") || ext.match(/\.(png|jpe?g|gif|webp|svg)$/)) return "🖼️";
    if (mime.startsWith("video/") || ext.match(/\.(mp4|webm|mov|avi)$/)) return "🎥";
    if (mime.startsWith("audio/") || ext.match(/\.(mp3|wav|ogg|webm)$/)) return "🎵";
    if (mime.includes("pdf") || ext.endsWith(".pdf")) return "📄";
    if (mime.includes("word") || ext.match(/\.(doc|docx)$/)) return "📝";
    if (mime.includes("excel") || ext.match(/\.(xls|xlsx|csv)$/)) return "📊";
    if (mime.includes("zip") || ext.match(/\.(zip|rar|7z)$/)) return "📦";
    return "📎";
}

/**
 * Formats byte size into readable unit (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
