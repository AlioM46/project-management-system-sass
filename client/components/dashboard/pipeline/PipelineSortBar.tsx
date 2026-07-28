/**
 * # PipelineSortBar Component
 * 
 * This component renders the sorting dropdown selectors.
 * It allows sorting pipeline leads by:
 * - Creation Date (created_at)
 * - Last Updated (updated_at)
 * - Lead Name (title)
 * 
 * And allows changing sorting direction (Ascending / Descending).
 */

import { MoreHorizontal } from "lucide-react";

interface PipelineSortBarProps {
    sortBy: string;
    sortDir: string;
    onChange: (updater: (prev: any) => any) => void;
}

export default function PipelineSortBar({
    sortBy,
    sortDir,
    onChange,
}: PipelineSortBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-zinc-50/50 dark:bg-white/[0.02] p-3 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                <MoreHorizontal className="h-3 w-3" />
                <span>Sorting</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">Sort by:</span>
                <select 
                    value={sortBy}
                    onChange={(e) => onChange(prev => ({ ...prev, sort_by: e.target.value }))}
                    className="bg-transparent border-none text-sm text-zinc-600 dark:text-zinc-300 outline-none focus:ring-0 cursor-pointer hover:text-blue-500 transition-colors"
                >
                    <option value="created_at" className="dark:bg-zinc-900">Creation Date</option>
                    <option value="updated_at" className="dark:bg-zinc-900">Last Updated</option>
                    <option value="title" className="dark:bg-zinc-900">Name</option>
                </select>
            </div>

            <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-white/10 pl-4">
                <span className="text-xs text-zinc-500 font-medium">Order:</span>
                <select 
                    value={sortDir}
                    onChange={(e) => onChange(prev => ({ ...prev, sort_dir: e.target.value }))}
                    className="bg-transparent border-none text-sm text-zinc-600 dark:text-zinc-300 outline-none focus:ring-0 cursor-pointer hover:text-blue-500 transition-colors"
                >
                    <option value="desc" className="dark:bg-zinc-900">Descending</option>
                    <option value="asc" className="dark:bg-zinc-900">Ascending</option>
                </select>
            </div>
        </div>
    );
}
