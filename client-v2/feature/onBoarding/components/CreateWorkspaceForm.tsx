"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createWorkspace } from "@/feature/workspace/api/workspace.api";
import { Button } from "@/components/ui/button";
import { setCookie } from "@/shared/utils/cookies";
import ApiError from "@/shared/api/ApiError";
const CreateWorkspaceForm = () => {
  const [workspaceName, setWorkspaceName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspaceName || workspaceName.trim().length < 3) {
      toast.error("Workspace name must be at least 3 characters long.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await createWorkspace(workspaceName);
      if (response) {
        toast.success("Workspace created successfully!");
        if (response.id) {
          setCookie("workspace_id", response.id, 30);
        }

        // redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
          setIsLoading(false);
        }, 2500);
      } else {
        toast.error("Failed to create workspace. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(
          err.message ||
            "An error occurred while creating the workspace. Please try again.",
        );
      }
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)}>
      <label
        htmlFor="workspaceName"
        className="block text-sm font-medium text-gray-700"
      >
        Workspace Name
      </label>
      <Input
        value={workspaceName}
        onChange={(e) => setWorkspaceName(e.target.value)}
        id="workspaceName"
        placeholder="Enter workspace name"
        disabled={isLoading}
      />
      <Button type="submit">Create</Button>
    </form>
  );
};

export default CreateWorkspaceForm;
