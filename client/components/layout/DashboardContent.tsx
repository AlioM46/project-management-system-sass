"use client";

import React from "react";
import { useWorkspace } from "@/features/workspaces/hooks/useWorkspace";

export function DashboardContent({ children }: { children: React.ReactNode }) {
    const { currentWorkspaceId } = useWorkspace();

    // Keying the content container by currentWorkspaceId ensures that whenever
    // the user switches workspaces, all client-side pages and components (tasks,
    // projects, chat, team, etc.) cleanly unmount their old tenant state and remount
    // fresh to fetch data for the newly selected workspace.
    return (
        <div key={currentWorkspaceId || "workspace-root"} className="w-full h-full">
            {children}
        </div>
    );
}
