import type { FormEvent } from "react";

import { Mail, UserPlus } from "lucide-react";

import { TeamSectionError } from "@/components/Team/TeamSectionError";
import { InviteMessageField } from "@/components/Team/invite-member/InviteMessageField";
import { InviteRoleSelect } from "@/components/Team/invite-member/InviteRoleSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Role } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

type InviteMemberFormProps = {
    error: string | null;
    inviteEmail: string;
    inviteMessage: string;
    isLoading: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent) => void;
    roles: Role[];
    rolesError: string | null;
    selectedRoleId: number;
    setInviteEmail: (value: string) => void;
    setInviteMessage: (value: string) => void;
    setSelectedRoleId: (roleId: number) => void;
};

export function InviteMemberForm({
    error,
    inviteEmail,
    inviteMessage,
    isLoading,
    onClose,
    onSubmit,
    roles,
    rolesError,
    selectedRoleId,
    setInviteEmail,
    setInviteMessage,
    setSelectedRoleId,
}: InviteMemberFormProps) {
    const { t } = useTranslation();

    return (
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
            {error && <TeamSectionError title={t("team_invite_toast_failed")} message={error} />}

            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none sm:p-5">
                <label
                    htmlFor="invite-email"
                    className="mb-3 block text-sm font-medium text-slate-800 dark:text-slate-100"
                >
                    {t("team_invite_work_email")}
                </label>
                <div className="relative">
                    <Mail className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        id="invite-email"
                        type="email"
                        placeholder={t("team_invite_email_placeholder")}
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="h-14 rounded-2xl border-white bg-white ps-11 pe-4 text-sm shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-white/10 dark:bg-[#0f1117]"
                        required
                    />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t("team_invite_email_tip")}
                </p>

                <div className="mt-6">
                    <InviteRoleSelect
                        disabled={isLoading}
                        error={rolesError}
                        roles={roles}
                        selectedRoleId={selectedRoleId}
                        setSelectedRoleId={setSelectedRoleId}
                    />
                </div>
            </div>

            <InviteMessageField value={inviteMessage} onChange={setInviteMessage} />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="h-12 rounded-2xl px-5"
                >
                    {t("modal_cancel")}
                </Button>
                <Button
                    type="submit"
                    className="h-12 rounded-2xl bg-slate-950 px-6 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    disabled={isLoading || selectedRoleId === -1}
                >
                    <UserPlus className="h-4 w-4" />
                    {isLoading ? t("team_invite_sending") : t("team_invite_btn_send")}
                </Button>
            </div>
        </form>
    );
}
