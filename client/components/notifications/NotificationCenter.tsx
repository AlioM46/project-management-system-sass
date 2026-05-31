"use client";

import { Button } from "@/components/ui/button";
import { useNotifications } from "@/features/notifications/components/NotificationsProvider";
import { getNotificationDescription, getNotificationTitle } from "@/features/notifications/lib/notification-copy";
import { NotificationItem } from "@/features/notifications/types";
import { Bell, CheckCheck, Loader2, Wifi, WifiOff, X } from "lucide-react";
import { useEffect } from "react";

function formatNotificationTime(value: string | null) {
    if (!value) {
        return "Just now";
    }

    const date = new Date(value);

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function NotificationRow({
    notification,
    onRead,
}: {
    notification: NotificationItem;
    onRead: (notificationId: number) => Promise<void>;
}) {
    const isUnread = !notification.read_at;

    return (
        <button
            type="button"
            onClick={() => {
                if (isUnread) {
                    void onRead(notification.id);
                }
            }}
            className={`group w-full rounded-3xl border px-5 py-4 text-left transition-all ${
                isUnread
                    ? "border-amber-200 bg-linear-to-br from-amber-50 via-white to-orange-50 shadow-[0_16px_40px_-28px_rgba(217,119,6,0.55)]"
                    : "border-zinc-200/80 bg-white/85 hover:border-zinc-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/15"
            }`}
        >
            <div className="flex items-start gap-4">
                <div className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                    isUnread
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300"
                }`}>
                    <Bell className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="font-semibold text-zinc-950 dark:text-white">
                                {getNotificationTitle(notification)}
                            </div>
                            <div className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                {getNotificationDescription(notification)}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {isUnread && <span className="size-2 rounded-full bg-amber-500" />}
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                {formatNotificationTime(notification.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                        <span>{notification.type ?? "general"}</span>
                        <span className="h-1 w-1 rounded-full bg-current" />
                        <span>{isUnread ? "Unread" : "Read"}</span>
                    </div>
                </div>
            </div>
        </button>
    );
}

export function NotificationCenter() {
    const {
        items,
        unreadCount,
        isPanelOpen,
        isLoading,
        connectionStatus,
        markAsRead,
        markAllAsRead,
        closePanel,
        togglePanel,
    } = useNotifications();

    useEffect(() => {
        if (!isPanelOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closePanel();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => window.removeEventListener("keydown", handleEscape);
    }, [closePanel, isPanelOpen]);

    const connectionLabel = connectionStatus === "connected"
        ? "Live"
        : connectionStatus === "connecting"
            ? "Connecting"
            : connectionStatus === "error"
                ? "Disconnected"
                : "Idle";

    return (
        <>
            <button
                type="button"
                onClick={togglePanel}
                className="relative rounded-2xl border border-transparent bg-white/70 p-2.5 text-zinc-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-amber-500/20 dark:hover:bg-amber-500/10 dark:hover:text-amber-200"
            >
                <span className="sr-only">View notifications</span>
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isPanelOpen && (
                <div className="fixed inset-0 z-50">
                    <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={closePanel}
                        className="absolute inset-0 bg-zinc-950/35 backdrop-blur-sm"
                    />

                    <div className="absolute left-1/2 top-1/2 flex h-[min(78vh,720px)] w-[min(92vw,840px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,244,245,0.94))] shadow-[0_40px_120px_-32px_rgba(24,24,27,0.45)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_30%),linear-gradient(180deg,rgba(9,9,11,0.98),rgba(24,24,27,0.96))]">
                        <div className="flex w-full flex-col">
                            <div className="border-b border-zinc-200/70 px-6 py-5 dark:border-white/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-xs font-medium uppercase tracking-[0.26em] text-amber-600 dark:text-amber-300">
                                            Notification Center
                                        </div>
                                        <h2 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">
                                            Workspace activity
                                        </h2>
                                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                            Live personal updates scoped to your active workspace.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void markAllAsRead()}
                                            disabled={unreadCount === 0}
                                        >
                                            <CheckCheck className="size-4" />
                                            Mark all read
                                        </Button>
                                        <Button variant="ghost" size="icon-sm" onClick={closePanel}>
                                            <X className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                            Unread
                                        </div>
                                        <div className="mt-1 text-3xl font-semibold text-zinc-950 dark:text-white">
                                            {unreadCount}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                                        {connectionStatus === "connected" ? (
                                            <Wifi className="size-4 text-emerald-500" />
                                        ) : (
                                            <WifiOff className="size-4 text-zinc-400" />
                                        )}
                                        <span>{connectionLabel}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-5">
                                {isLoading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="size-6 animate-spin text-zinc-400" />
                                    </div>
                                ) : items.length === 0 ? (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="max-w-md text-center">
                                            <div className="mx-auto flex size-16 items-center justify-center rounded-[1.75rem] bg-zinc-100 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-300">
                                                <Bell className="size-6" />
                                            </div>
                                            <h3 className="mt-5 text-xl font-semibold text-zinc-950 dark:text-white">
                                                No notifications yet
                                            </h3>
                                            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                                                When someone mentions you, replies to you, or updates work that targets you, it will appear here in real time.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map((notification) => (
                                            <NotificationRow
                                                key={notification.id}
                                                notification={notification}
                                                onRead={markAsRead}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
