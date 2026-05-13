"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkspaces } from "../api/workspace.api";
import { Workspace } from "../types";
import { getCookie, setCookie } from "@/shared/utils/cookies";
import { Loader2 } from "lucide-react";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkWorkspaceContext = async () => {
            try {
                // 1. Fetch all workspaces for the logged-in user
                const { workspaces, count }: { workspaces: Workspace[], count: number } = await getWorkspaces();

                // 2. Scenario A: User has 0 workspaces
                if (!workspaces || workspaces.length === 0) {
                    // Redirect them immediately to the onboarding screen
                    router.push("/onboarding");
                    return;
                }

                // 3. Scenario B: User has 1 or more workspaces
                // Check if they already have an active workspace cookie
                const currentWorkspaceId = getCookie("workspace_id");

                // Does the cookie exist AND is it actually one of their workspaces?
                const isValidContext = currentWorkspaceId && workspaces.some((w: Workspace) => w.id === currentWorkspaceId);

                if (!isValidContext) {
                    // If they don't have a cookie (or it's invalid), automatically select the first workspace
                    // This is crucial: the apiClient needs this cookie to send the X-Workspace-Id header!
                    const fallbackWorkspace = workspaces[0];
                    setCookie("workspace_id", fallbackWorkspace.id);
                }

                // Context is secure and validated. Allow the dashboard to render.
                setIsChecking(false);

            } catch (error) {
                console.error("Failed to fetch workspaces:", error);
                // If this fails, they might be logged out or the server is down.
                // We'll let the standard apiErrorHandler handle 401s, but we stop the loading state.
                setIsChecking(false);
            }
        };

        checkWorkspaceContext();
    }, [router]);

    // Show a full screen loading spinner while we verify the context.
    // This prevents the dashboard from briefly flashing before they are redirected.
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // Context is valid! Render the dashboard layout and its pages.
    return <>{children}</>;
}
