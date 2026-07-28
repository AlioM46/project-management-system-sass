"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { InviteMemberForm } from "@/components/Team/invite-member/InviteMemberForm";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getRoles, sendInvite } from "@/features/team/api/team.api";
import { Role } from "@/features/team/types";
import { ApiError } from "@/shared/api/ApiError";
import { useTranslation } from "@/lib/context/LanguageContext";

type InviteMemberDialogProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export function InviteMemberDialog({ onOpenChange, open }: InviteMemberDialogProps) {
    const { t } = useTranslation();
    const [inviteEmail, setInviteEmail] = useState("");
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number>(-1);
    const [inviteMessage, setInviteMessage] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [rolesError, setRolesError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        const fetchWorkspaceRoles = async () => {
            setIsLoading(true);
            setError(null);
            setRolesError(null);

            try {
                const response = await getRoles();
                const availableRoles = response.roles.filter(
                    (role) => role.name.toLowerCase() !== "owner"
                );

                setRoles(availableRoles);
                setSelectedRoleId(availableRoles[0]?.id ?? -1);
            } catch (err) {
                const message =
                    err instanceof ApiError
                        ? err.getFriendlyMessage() ?? t("team_invite_toast_load_roles_error")
                        : t("team_invite_toast_load_roles_error");

                setRolesError(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkspaceRoles();
    }, [open, t]);

    const handleInvite = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await sendInvite({
                email: inviteEmail,
                role_id: selectedRoleId,
                message: inviteMessage,
            });

            toast.success(t("team_invite_toast_sent_success"));
            setInviteEmail("");
            setInviteMessage("");
            onOpenChange(false);
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.getFriendlyMessage() ?? t("team_invite_toast_sent_error")
                    : t("team_invite_toast_sent_error");

            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl overflow-hidden rounded-[28px] border border-white/60 bg-white p-0 shadow-2xl shadow-blue-950/10 dark:border-white/10 dark:bg-[#101218] text-start">
                <div className="relative">
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />
                    <div className="absolute inset-x-6 top-6 h-24 rounded-full bg-white/20 blur-3xl" />

                    <div className="relative p-6 sm:p-8">
                        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-lg shadow-blue-950/10">
                            <UserPlus className="h-7 w-7" />
                        </div>

                        <DialogHeader className="space-y-3">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
                                <Sparkles className="h-3.5 w-3.5" />
                                {t("team_invite_dialog_title")}
                            </div>
                            <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                                {t("team_invite_dialog_subtitle")}
                            </DialogTitle>
                            <DialogDescription className="max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {t("team_invite_dialog_desc")}
                            </DialogDescription>
                        </DialogHeader>

                        <InviteMemberForm
                            error={error}
                            inviteEmail={inviteEmail}
                            inviteMessage={inviteMessage}
                            isLoading={isLoading}
                            onClose={() => onOpenChange(false)}
                            onSubmit={handleInvite}
                            roles={roles}
                            rolesError={rolesError}
                            selectedRoleId={selectedRoleId}
                            setInviteEmail={(value) => {
                                setInviteEmail(value);
                                if (error) setError(null);
                            }}
                            setInviteMessage={setInviteMessage}
                            setSelectedRoleId={(roleId) => {
                                setSelectedRoleId(roleId);
                                if (error) setError(null);
                            }}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
