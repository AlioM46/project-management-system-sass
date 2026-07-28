"use client";

import { getMe } from "@/features/auth/api/auth.api";
import { getCookie } from "@/shared/utils/cookies";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../api/notifications.api";
import { getNotificationDescription, getNotificationTitle } from "../lib/notification-copy";
import { disconnectEchoClient, getEchoClient, leaveEchoChannel } from "../lib/echo";
import { NotificationItem, NotificationState, RealtimeNotificationEvent } from "../types";
import { usePathname, useRouter } from "next/navigation";

type NotificationsContextValue = NotificationState & {
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    markConversationAsReadLocally: (conversationId: number) => void;
    openPanel: () => void;
    closePanel: () => void;
    togglePanel: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function upsertNotification(items: NotificationItem[], incoming: NotificationItem) {
    const existingIndex = items.findIndex((item) => item.id === incoming.id);

    if (existingIndex === -1) {
        return [incoming, ...items];
    }

    const nextItems = [...items];
    nextItems[existingIndex] = { ...nextItems[existingIndex], ...incoming };

    return nextItems.sort((left, right) => {
        const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
        const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;

        return rightTime - leftTime;
    });
}

function markAllAsReadLocally(items: NotificationItem[], workspaceId: number, readAt: string | null) {
    return items.map((item) =>
        item.workspace_id === workspaceId && !item.read_at
            ? { ...item, read_at: readAt }
            : item
    );
}


export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<NotificationState["connectionStatus"]>("idle");
    const workspaceIdRef = useRef<string | null>(null);
    const channelNameRef = useRef<string | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const pathnameRef = useRef(pathname);

    // Keep pathnameRef updated on every path change
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);



    async function handleChatMessageNotification(event: RealtimeNotificationEvent) {
        if (pathnameRef.current === "/dashboard/chat") {
            await markNotificationAsRead(event.id);

            return; // or play soft sound
        }

        let redirectionText = ""
        if (event?.data?.conversation?.type === "project") {
            redirectionText = `in ${event?.data?.conversation?.project?.name} Project.`
        } else if (event?.data?.conversation?.type === "group") {
            redirectionText = `in ${event?.data?.conversation?.name} Group.`
        } else {
            redirectionText = `.`
        }
        const senderName = event?.data?.message?.sender?.username || event?.data?.message?.sender?.name || "Someone";
        const messageBody = event?.data?.message?.body || event?.data?.message?.content || "";

        toast.info(`New message from ${senderName} ${redirectionText}`, {
            description: `Message: ${messageBody}`,
            action: {
                label: "Go to chat",
                onClick: () => {
                    router.push(`/dashboard/chat?conversationId=${event?.data?.conversationId}`);
                },
            },
        });
        setItems((currentItems) => upsertNotification(currentItems, event));

    }


    useEffect(() => {
        let isMounted = true;

        const syncNotifications = async () => {
            const accessToken = getCookie("access_token");
            const workspaceId = getCookie("workspace_id");

            workspaceIdRef.current = workspaceId;

            if (!accessToken || !workspaceId) {
                if (channelNameRef.current) {
                    leaveEchoChannel(channelNameRef.current);
                    channelNameRef.current = null;
                }

                disconnectEchoClient();

                if (isMounted) {
                    setItems([]);
                    setIsLoading(false);
                    setConnectionStatus("idle");
                }

                return;
            }

            if (isMounted) {
                setIsLoading(true);
                setConnectionStatus("connecting");
            }

            try {
                const [user, notifications] = await Promise.all([
                    getMe(),
                    getNotifications(),
                ]);

                if (!isMounted) {
                    return;
                }

                setItems(notifications);

                if (!user?.id) {
                    throw new Error("Authenticated user payload is missing an id.");
                }

                const echo = getEchoClient(accessToken, workspaceId);
                const channelName = `workspaces.${workspaceId}.users.${user.id}`;

                if (channelNameRef.current && channelNameRef.current !== channelName) {
                    leaveEchoChannel(channelNameRef.current);
                }

                channelNameRef.current = channelName;

                echo.private(channelName)
                    .stopListening(".notification.created")
                    .stopListening(".notification.read")
                    .stopListening(".notification.read.all")
                    .listen(".notification.created", (event: RealtimeNotificationEvent) => {



                        if (String(event.workspace_id) !== workspaceIdRef.current) {
                            return;
                        }


                        if (event.type?.toLowerCase() === "chat_message") {

                            window.dispatchEvent(new CustomEvent("new-chat-message", {
                                detail: event.data.message
                            }));

                            handleChatMessageNotification(event);

                            return
                        }

                        setItems((currentItems) => upsertNotification(currentItems, event));
                        toast.info(getNotificationTitle(event), {
                            description: getNotificationDescription(event),
                        });
                    })
                    .listen(".notification.read", (event: RealtimeNotificationEvent) => {
                        setItems((currentItems) =>
                            currentItems.map((item) =>
                                item.id === event.id
                                    ? { ...item, read_at: event.read_at }
                                    : item
                            )
                        );
                    })
                    .listen(".notification.read.all", (event: RealtimeNotificationEvent) => {
                        setItems((currentItems) =>
                            markAllAsReadLocally(currentItems, event.workspace_id, event.read_at)
                        );
                    });

                setConnectionStatus("connected");
            } catch (error) {
                console.error("Failed to initialize notifications:", error);

                if (!isMounted) {
                    return;
                }

                setConnectionStatus("error");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void syncNotifications();

        const handleCookieChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ name?: string }>;

            if (customEvent.detail?.name === "workspace_id" || customEvent.detail?.name === "access_token") {
                void syncNotifications();
            }
        };

        window.addEventListener("app-cookie-change", handleCookieChange as EventListener);

        return () => {
            isMounted = false;
            window.removeEventListener("app-cookie-change", handleCookieChange as EventListener);

            if (channelNameRef.current) {
                leaveEchoChannel(channelNameRef.current);
                channelNameRef.current = null;
            }

            disconnectEchoClient();
        };
    }, []);

    const unreadCount = items.filter((item) => !item.read_at).length;

    async function handleMarkAsRead(notificationId: number) {
        await markNotificationAsRead(notificationId);
    }

    async function handleMarkAllAsRead() {
        await markAllNotificationsAsRead();
    }

    function handleMarkConversationAsReadLocally(conversationId: number) {
        setItems((currentItems) =>
            currentItems.map((item) => {
                if (
                    item.type?.toLowerCase() === "chat_message" &&
                    Number(item.data?.conversationId) === Number(conversationId)
                ) {
                    return { ...item, read_at: new Date().toISOString() };
                }
                return item;
            })
        );
    }

    return (
        <NotificationsContext.Provider
            value={{
                items,
                unreadCount,
                isPanelOpen,
                isLoading,
                connectionStatus,
                markConversationAsReadLocally: handleMarkConversationAsReadLocally,
                markAsRead: handleMarkAsRead,
                markAllAsRead: handleMarkAllAsRead,
                openPanel: () => setIsPanelOpen(true),
                closePanel: () => setIsPanelOpen(false),
                togglePanel: () => setIsPanelOpen((current) => !current),
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationsContext);

    if (!context) {
        throw new Error("useNotifications must be used inside NotificationsProvider.");
    }

    return context;
}

