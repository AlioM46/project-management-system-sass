"use client";

/**
 * # WorkspaceProvider Component
 * 
 * Provides client-side context for workspaces and the active user's role.
 * It resolves:
 * 1. Selected active workspace details
 * 2. Active member profile inside the workspace
 * 3. Role verification helpers (isOwner, isAdmin, isOwnerOrAdmin)
 * 
 * Exposes a custom `useWorkspace` hook for pages to guard access.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkspaces } from "../api/workspace.api";
import { Workspace } from "../types";
import { getCookie, setCookie } from "@/shared/utils/cookies";
import { Loader2 } from "lucide-react";
import { getMembers } from "@/features/team/api/team.api";
import { getMe } from "@/features/auth/api/auth.api";
import { Member } from "@/features/team/types";

interface WorkspaceContextProps {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    currentMember: Member | null;
    isOwner: boolean;
    isAdmin: boolean;
    isOwnerOrAdmin: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [contextValue, setContextValue] = useState<WorkspaceContextProps>({
        workspaces: [],
        currentWorkspace: null,
        currentMember: null,
        isOwner: false,
        isAdmin: false,
        isOwnerOrAdmin: false,
    });

    useEffect(() => {
        const checkWorkspaceContext = async () => {
            try {
                // 1. Fetch all workspaces for the logged-in user
                const { workspaces }: { workspaces: Workspace[] } = await getWorkspaces();

                // 2. Scenario A: User has 0 workspaces
                if (!workspaces || workspaces.length === 0) {
                    router.push("/onboarding");
                    return;
                }

                // 3. Scenario B: User has 1 or more workspaces
                const currentWorkspaceId = getCookie("workspace_id");
                const isValidContext = currentWorkspaceId && workspaces.some((w: Workspace) => String(w.id) === String(currentWorkspaceId));

                let activeId = currentWorkspaceId;
                if (!isValidContext) {
                    const fallbackWorkspace = workspaces[0];
                    setCookie("workspace_id", fallbackWorkspace.id);
                    activeId = fallbackWorkspace.id;
                }

                // 4. Resolve the current user profile and their membership role in the active workspace
                const [user, membersRes] = await Promise.all([
                    getMe(),
                    getMembers()
                ]);

                const activeWorkspace = workspaces.find((w: Workspace) => String(w.id) === String(activeId)) || null;
                const activeMembers = membersRes.members || [];
                const currentMember = activeMembers.find((m: Member) => String(m.user_id) === String(user.id)) || null;

                const roleSlug = currentMember?.role?.slug;

                setContextValue({
                    workspaces,
                    currentWorkspace: activeWorkspace,
                    currentMember,
                    isOwner: roleSlug === 'owner',
                    isAdmin: roleSlug === 'admin',
                    isOwnerOrAdmin: roleSlug === 'owner' || roleSlug === 'admin',
                });

                setIsChecking(false);
            } catch (error) {
                console.error("Failed to fetch workspaces context:", error);
                setIsChecking(false);
            }
        };

        checkWorkspaceContext();
    }, [router]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <WorkspaceContext.Provider value={contextValue}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
