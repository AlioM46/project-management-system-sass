"use client";

import { useEffect, useState } from "react";

import { getMe } from "@/features/auth/api/auth.api";
import { getMembers } from "@/features/team/api/team.api";
import { Member } from "@/features/team/types";
import { ApiError } from "@/shared/api/ApiError";

export function useTeamMembers() {
    const [members, setMembers] = useState<Member[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [response, currentUser] = await Promise.all([getMembers(), getMe()]);

            setMembers(response.members || (Array.isArray(response) ? response : []));
            setCurrentUserId(currentUser.id);
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.getFriendlyMessage() ?? "Failed to load team members."
                    : "Failed to load team members.";

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isActive = true;

        const loadMembers = async () => {
            try {
                const [response, currentUser] = await Promise.all([getMembers(), getMe()]);

                if (!isActive) return;

                setMembers(response.members || (Array.isArray(response) ? response : []));
                setCurrentUserId(currentUser.id);
            } catch (err) {
                if (!isActive) return;

                const message =
                    err instanceof ApiError
                        ? err.getFriendlyMessage() ?? "Failed to load team members."
                        : "Failed to load team members.";

                setError(message);
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        loadMembers();

        return () => {
            isActive = false;
        };
    }, []);

    return {
        currentUserId,
        error,
        isLoading,
        members,
        refreshMembers: fetchMembers,
    };
}
