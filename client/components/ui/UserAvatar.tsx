"use client";

import React, { useState } from "react";

interface UserAvatarProps {
    name?: string | null;
    avatarUrl?: string | null;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
};

export function UserAvatar({
    name,
    avatarUrl,
    size = "md",
    className = "",
}: UserAvatarProps) {
    const [imageError, setImageError] = useState(false);

    const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : "U";
    const sizeClass = sizeClasses[size] || sizeClasses.md;

    if (avatarUrl && !imageError) {
        return (
            <div className={`relative shrink-0 overflow-hidden rounded-full border border-zinc-200 dark:border-white/10 ${sizeClass} ${className}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={avatarUrl}
                    alt={name || "User avatar"}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={`relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white shadow-sm ${sizeClass} ${className}`}
        >
            {initial}
        </div>
    );
}
