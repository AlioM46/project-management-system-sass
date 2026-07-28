/**
 * # PipelineHeader Component
 * 
 * This component renders the main header for the Leads Pipeline screen.
 * It displays the localized title and subtitle of the dashboard pipeline
 * and provides the CTA button to add/create a new lead.
 */

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PipelineHeaderProps {
    title: string;
    subtitle: string;
    newLeadLabel: string;
    onNewLeadClick: () => void;
}

export default function PipelineHeader({
    title,
    subtitle,
    newLeadLabel,
    onNewLeadClick,
}: PipelineHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8 shrink-0">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{title}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                    {subtitle}
                </p>
            </div>
            <Button 
                onClick={onNewLeadClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 rounded-xl h-11 px-6"
            >
                <Plus className="h-4 w-4" />
                {newLeadLabel}
            </Button>
        </div>
    );
}
