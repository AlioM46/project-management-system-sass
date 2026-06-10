import { Role } from "@/features/team/types";
import { useTranslation } from "@/lib/context/LanguageContext";

type InviteRoleSelectProps = {
    disabled?: boolean;
    error?: string | null;
    roles: Role[];
    selectedRoleId: number;
    setSelectedRoleId: (roleId: number) => void;
};

export function InviteRoleSelect({
    disabled = false,
    error,
    roles,
    selectedRoleId,
    setSelectedRoleId,
}: InviteRoleSelectProps) {
    const { t } = useTranslation();

    const getTranslatedRoleName = (roleName: string) => {
        const normalized = roleName.toLowerCase();
        if (normalized === "owner") return t("team_role_owner");
        if (normalized === "admin") return t("team_role_admin");
        if (normalized === "member") return t("team_role_member");
        return roleName;
    };

    return (
        <div className="space-y-3">
            <label
                htmlFor="invite-role"
                className="block text-sm font-medium text-slate-800 dark:text-slate-100"
            >
                {t("team_invite_role_label")}
            </label>
            <select
                id="invite-role"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="h-14 w-full rounded-2xl border border-white bg-white px-4 text-sm shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-white/10 dark:bg-[#0f1117] dark:text-white"
                disabled={disabled || roles.length === 0}
            >
                {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                        {getTranslatedRoleName(role.name)}
                    </option>
                ))}
            </select>
            {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        </div>
    );
}
