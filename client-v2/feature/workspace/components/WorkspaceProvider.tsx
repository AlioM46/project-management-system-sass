"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWorkspaces } from "../api/workspace.api";
import { GetWorkspace, GetWorkspaceResponse, Workspace } from "../types";
import { getCookie, setCookie } from "@/shared/utils/cookies";
import { Loader2 } from "lucide-react";

const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkWorkspaceContext = async () => {
      try {
        // 1. Fetch all workspaces for the logged-in user
        const { count, workspaces } = await getWorkspaces();

        if (!workspaces || workspaces.length === 0) {
          // Redirect them immediately to the onboarding screen
          router.push("/onboarding");
          return;
        }
        const currentWorkspaceId = getCookie("workspace_id");

        const isValidContext =
          currentWorkspaceId &&
          workspaces.some((w: GetWorkspace) => w.id == currentWorkspaceId);

        if (!isValidContext) {
          const fallbackWorkspace = workspaces[0];
          setCookie("workspace_id", fallbackWorkspace.id);
        }

        setIsChecking(false);
      } catch (e) {
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

  // Context is valid! Render the dashboard layout and its pages.
  return <>{children}</>;
};

export default WorkspaceProvider;
