import { Send, Users2 } from "lucide-react";

type TeamTab = "members" | "invites";

type TeamTabsProps = {
    activeTab: TeamTab;
    onChange: (tab: TeamTab) => void;
};

export function TeamTabs({ activeTab, onChange }: TeamTabsProps) {
    return (
        <div className="inline-flex rounded-2xl bg-zinc-100 p-1 dark:bg-white/5">
            <button
                type="button"
                onClick={() => onChange("members")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "members"
                        ? "bg-white text-zinc-950 shadow-sm dark:bg-white dark:text-zinc-950"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
            >
                <Users2 className="h-4 w-4" />
                Members
            </button>
            <button
                type="button"
                onClick={() => onChange("invites")}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "invites"
                        ? "bg-white text-zinc-950 shadow-sm dark:bg-white dark:text-zinc-950"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
            >
                <Send className="h-4 w-4" />
                Invites
            </button>
        </div>
    );
}
