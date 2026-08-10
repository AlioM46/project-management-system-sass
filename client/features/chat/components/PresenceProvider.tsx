"use client";

import { markAllDeliveredOnPresenceJoinApi } from "@/features/chat/api/chat.api";
import { getEchoClient } from "@/features/notifications/lib/echo";
import { getCookie } from "@/shared/utils/cookies";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export interface PresenceUser {
    id: number;
    name: string;
    username?: string;
    avatar_url?: string | null;
}

interface PresenceContextValue {
    onlineUserIds: number[];
    isUserOnline: (userId: number | undefined | null) => boolean;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ children }: { children: ReactNode }) {
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

    useEffect(() => {
        let isMounted = true;

        const syncPresence = () => {
            const accessToken = getCookie("access_token") || "";
            const workspaceId = getCookie("workspace_id") || "";

            if (!accessToken || !workspaceId) return;

            // 🚀 Immediately sync delivery status when coming online / switching workspace
            markAllDeliveredOnPresenceJoinApi();

            const echoClient = getEchoClient(accessToken, workspaceId);
            if (!echoClient) return;

            const channelName = `workspaces.${workspaceId}`;

            echoClient.join(channelName)
                .here((users: PresenceUser[]) => {
                    if (isMounted) {
                        console.log("[Presence] Joined workspace presence channel. Online users:", users);
                        setOnlineUserIds(users.map((u) => u.id));
                    }
                })
                .joining((user: PresenceUser) => {
                    if (isMounted) {
                        setOnlineUserIds((prev) => Array.from(new Set([...prev, user.id])));
                    }
                })
                .leaving((user: PresenceUser) => {
                    if (isMounted) {
                        setOnlineUserIds((prev) => prev.filter((id) => id !== user.id));
                    }
                });
        };

        syncPresence();

        const handleCookieChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ name?: string }>;
            if (customEvent.detail?.name === "workspace_id" || customEvent.detail?.name === "access_token") {
                syncPresence();
            }
        };

        window.addEventListener("app-cookie-change", handleCookieChange as EventListener);

        return () => {
            isMounted = false;
            window.removeEventListener("app-cookie-change", handleCookieChange as EventListener);
        };
    }, []);

    const isUserOnline = useCallback(
        (userId: number | undefined | null): boolean => {
            if (!userId) return false;
            return onlineUserIds.includes(Number(userId));
        },
        [onlineUserIds]
    );

    return (
        <PresenceContext.Provider value={{ onlineUserIds, isUserOnline }}>
            {children}
        </PresenceContext.Provider>
    );
}

export function usePresence() {
    const context = useContext(PresenceContext);
    if (!context) {
        throw new Error("usePresence must be used inside PresenceProvider.");
    }
    return context;
}
