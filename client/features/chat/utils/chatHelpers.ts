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
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

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
