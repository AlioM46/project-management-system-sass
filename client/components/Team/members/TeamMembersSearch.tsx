import { Search } from "lucide-react";

type TeamMembersSearchProps = {
    value: string;
    onChange: (value: string) => void;
};

export function TeamMembersSearch({ value, onChange }: TeamMembersSearchProps) {
    return (
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
                type="text"
                placeholder="Search members..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
        </div>
    );
}
