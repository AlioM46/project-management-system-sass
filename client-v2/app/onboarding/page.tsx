"use client";
import { getWorkspaces } from "@/feature/workspace/api/workspace.api";
import { GetWorkspace } from "@/feature/workspace/types";
import ApiError from "@/shared/api/ApiError";
import { getCookie, setCookie } from "@/shared/utils/cookies";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CreateWorkspaceForm from "@/feature/onBoarding/components/CreateWorkspaceForm";

const OnboardingPage = () => {
  const [workspaces, setWorkspaces] = useState([] as GetWorkspace[]);

  console.log(workspaces);
  const router = useRouter();
  const hasWorkspace = workspaces.length > 0;
  const workspace_id_cookie = getCookie("workspace_id");

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await getWorkspaces();
        console.log("Fetched workspaces:", response);
        setWorkspaces(response.workspaces);
      } catch (error) {
        if (error instanceof ApiError) {
          console.error("Error fetching workspaces:", error);
          toast.error(
            error.message ?? "Failed to fetch workspaces. Please try again.",
          );
        }
      }
    };

    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (hasWorkspace) {
      if (workspace_id_cookie) {
        const workspaceExists = workspaces.some(
          (workspace) => workspace.id === workspace_id_cookie,
        );
        if (!workspaceExists) {
          setCookie("workspace_id", workspaces[0].id, 30);
        }
      } else {
        setCookie("workspace_id", workspaces[0].id, 30);
      }
      router.push("/dashboard");
    }
  }, [workspaces]);

  //

  if (!hasWorkspace) {
    return (
      <div>
        <h2>Onboarding</h2>
        <p>You don't have any workspaces yet.</p>
        <CreateWorkspaceForm />
      </div>
    );
  }

  return (
    <div>
      <h2>Onboarding</h2>
      {workspaces.map((workspace) => (
        <div key={workspace.id}>
          <p>{workspace.name}</p>
        </div>
      ))}
    </div>
  );
};

export default OnboardingPage;
