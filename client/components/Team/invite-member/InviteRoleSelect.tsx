import { Role } from "@/features/team/types";

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
    return (
        <div className="space-y-3">
            <label
                htmlFor="invite-role"
                className="block text-sm font-medium text-slate-800 dark:text-slate-100"
            >
                Role
            </label>
            <select
                id="invite-role"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="h-14 w-full rounded-2xl border border-white bg-white px-4 text-sm shadow-sm focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-white/10 dark:bg-[#0f1117]"
                disabled={disabled || roles.length === 0}
            >
                {roles.map((role) => (
                    <option key={role.id} value={role.id} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white">
                        {role.name}
                    </option>
                ))}
            </select>
            {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
        </div>
    );
}
