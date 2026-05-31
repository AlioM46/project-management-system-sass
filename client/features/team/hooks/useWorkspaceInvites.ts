"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cancelInvite, getInviteList, resendInvite } from "@/features/team/api/team.api";
import { Invite, InviteStatus } from "@/features/team/types";
import { isInviteExpiringSoon } from "@/features/team/utils/team-invite-formatters";
import { ApiError } from "@/shared/api/ApiError";

export type InviteFilterStatus = "all" | InviteStatus;

export function useWorkspaceInvites() {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<InviteFilterStatus>("all");
    const [cancellingInviteId, setCancellingInviteId] = useState<number | null>(null);
    const [resendingInviteId, setResendingInviteId] = useState<number | null>(null);

    const fetchInvites = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getInviteList();
            setInvites(response || []);
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.getFriendlyMessage() ?? "Failed to load invites."
                    : "Failed to load invites.";

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isActive = true;

        const loadInvites = async () => {
            try {
                const response = await getInviteList();

                if (isActive) {
                    setInvites(response || []);
                }
            } catch (err) {
                if (!isActive) return;

                const message =
                    err instanceof ApiError
                        ? err.getFriendlyMessage() ?? "Failed to load invites."
                        : "Failed to load invites.";

                setError(message);
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        loadInvites();

        return () => {
            isActive = false;
        };
    }, []);

    const handleCancelInvite = async (invitationId: number) => {
        setCancellingInviteId(invitationId);

        try {
            const response = await cancelInvite(invitationId);
            setInvites((currentInvites) =>
                currentInvites.map((invite) =>
                    invite.id === invitationId ? response.invitation : invite
                )
            );
            toast.success("Invitation cancelled successfully.");
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.getFriendlyMessage() ?? "Failed to cancel invitation."
                    : "Failed to cancel invitation.";

            toast.error(message);
        } finally {
            setCancellingInviteId(null);
        }
    };

    const handleResendInvite = async (invitationId: number) => {
        setResendingInviteId(invitationId);

        try {
            const response = await resendInvite(invitationId);
            setInvites((currentInvites) =>
                currentInvites.map((invite) =>
                    invite.id === invitationId ? response.invitation : invite
                )
            );
            toast.success("Invitation resent successfully.");
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.getFriendlyMessage() ?? "Failed to resend invitation."
                    : "Failed to resend invitation.";

            toast.error(message);
        } finally {
            setResendingInviteId(null);
        }
    };

    const normalizedQuery = searchQuery.toLowerCase().trim();

    const filteredInvites = invites.filter((invite) => {
        const matchesSearch =
            normalizedQuery === "" ||
            invite.email.toLowerCase().includes(normalizedQuery) ||
            invite.role?.name.toLowerCase().includes(normalizedQuery) ||
            invite.inviter?.name.toLowerCase().includes(normalizedQuery);

        const matchesStatus = statusFilter === "all" || invite.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: invites.length,
        pending: invites.filter((invite) => invite.status === "pending").length,
        expiringSoon: invites.filter((invite) => isInviteExpiringSoon(invite)).length,
        expired: invites.filter((invite) => invite.status === "expired").length,
        accepted: invites.filter((invite) => invite.status === "accepted").length,
    };

    return {
        cancellingInviteId,
        error,
        filteredInvites,
        invites,
        isLoading,
        refreshInvites: fetchInvites,
        resendInvite: handleResendInvite,
        resendingInviteId,
        searchQuery,
        setSearchQuery,
        setStatusFilter,
        stats,
        statusFilter,
        cancelInvite: handleCancelInvite,
    };
}
