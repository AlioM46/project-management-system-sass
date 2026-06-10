import { useTranslation } from "@/lib/context/LanguageContext";

type InviteMessageFieldProps = {
    value: string;
    onChange: (value: string) => void;
};

export function InviteMessageField({ value, onChange }: InviteMessageFieldProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-3">
            <label
                htmlFor="invite-message"
                className="block text-sm font-medium text-slate-800 dark:text-slate-100"
            >
                {t("team_invite_msg_label")}
            </label>
            <textarea
                id="invite-message"
                placeholder={t("team_invite_msg_placeholder")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white bg-white px-4 py-3 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-500/15 dark:border-white/10 dark:bg-[#0f1117] dark:text-white"
            />
        </div>
    );
}
