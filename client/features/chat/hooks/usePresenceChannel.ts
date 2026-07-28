import { getEchoClient } from "@/features/notifications/lib/echo";
import { useCallback, useEffect, useState } from "react";

export interface PresenceUser {
    id: number;
    name: string;
    username?: string;
    avatar_url?: string | null;
}

export default function usePresenceChannel(accessToken: string, workspaceId: string | number | null) {
    const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

    useEffect(() => {
        if (!accessToken || !workspaceId) return;

        const echoClient = getEchoClient(accessToken, String(workspaceId));
        if (!echoClient) return;

        const channelName = `workspaces.${workspaceId}`;

        echoClient.join(channelName)
            .here((users: PresenceUser[]) => {
                const ids = users.map((u) => u.id);
                setOnlineUserIds(ids);
            })
            .joining((user: PresenceUser) => {
                setOnlineUserIds((prev) => Array.from(new Set([...prev, user.id])));
            })
            .leaving((user: PresenceUser) => {
                setOnlineUserIds((prev) => prev.filter((id) => id !== user.id));
            });

        return () => {
            echoClient.leave(channelName);
        };
    }, [workspaceId, accessToken]);

    const isUserOnline = useCallback(
        (userId: number | undefined | null): boolean => {
            if (!userId) return false;
            return onlineUserIds.includes(Number(userId));
        },
        [onlineUserIds]
    );

    return { onlineUserIds, isUserOnline };
}