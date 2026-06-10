import { Shield } from "lucide-react";
import { useTranslation } from "@/lib/context/LanguageContext";

type TeamMemberRoleBadgeProps = {
    roleName: string;
};

function getRoleTone(roleName: string) {
    const normalizedRole = roleName.toLowerCase();

    if (normalizedRole === "owner") {
        return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400";
    }

    if (normalizedRole === "admin") {
        return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400";
    }

    return "bg-zinc-100 text-zinc-800 dark:bg-white/10 dark:text-zinc-400";
}

export function TeamMemberRoleBadge({ roleName }: TeamMemberRoleBadgeProps) {
    const { t } = useTranslation();
    const normalizedRole = roleName.toLowerCase();
    const displayRole = normalizedRole === "owner"
        ? t("team_role_owner")
        : normalizedRole === "admin"
        ? t("team_role_admin")
        : normalizedRole === "member"
        ? t("team_role_member")
        : roleName;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getRoleTone(
                roleName
            )}`}
        >
            {normalizedRole === "owner" && <Shield className="h-3 w-3" />}
            {displayRole}
        </span>
    );
}
