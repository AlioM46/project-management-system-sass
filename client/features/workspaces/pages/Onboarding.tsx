"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createWorkspace, getWorkspaces } from "../api/workspace.api";
import { ApiError } from "@/shared/api/ApiError";
import { setCookie } from "@/shared/utils/cookies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Building2, Mail } from "lucide-react";
import { toast } from "sonner";
// We'll reuse the AuthLayout to keep the aesthetic consistent for onboarding
import { AuthLayout } from "@/features/auth/components/AuthLayout";

export default function Onboarding() {
    const router = useRouter();
    const [workspaceName, setWorkspaceName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    /**
     * Handles the form submission to create a new workspace.
     */

    const hasFetched = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            if (hasFetched.current) return;
            hasFetched.current = true;
            try {
                await detectWorkspaces(true);
            } catch (error) {
                console.error(error);
            }
        };

        // 2. Call it
        fetchData();
    }, [router])

    const detectWorkspaces = async (showToast: boolean = true) => {
        setIsRefreshing(true);
        try {
            const data = await getWorkspaces();

            if (data && data.workspaces && data.workspaces.length > 0) {
                // They accepted an invite! Set the cookie and go to dashboard
                setCookie("workspace_id", data.workspaces[0].id);
                toast.success("Welcome to " + data.workspaces[0].name);
                router.push("/dashboard");
            } else {
                // Still zero workspaces
                if (showToast) {
                    toast.info("No workspaces found yet. Please create a workspace to continue");
                }
                setIsRefreshing(false);
            }
        } catch (err) {
            if (showToast) toast.error("Failed to check status.");
            setIsRefreshing(false);
        }
    }

    const handleCreateWorkspace = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        // Basic validation: Ensure they typed something
        if (workspaceName.trim().length < 3) {
            setError("Workspace name must be at least 3 characters.");
            toast.error("Workspace name must be at least 3 characters.");
            return;
        }

        setIsCreating(true);

        try {
            // 1. Call our API to create the workspace in the backend
            const newWorkspace = await createWorkspace({ name: workspaceName.trim() });

            // 2. We just created our first workspace! We need to set it as our "Active" context.
            // By saving the workspace ID into the "workspace_id" cookie, our apiClient 
            // will automatically attach it to all future requests.
            setCookie("workspace_id", newWorkspace.id);

            toast.success("Workspace created successfully! 🎉");

            // 3. Now that we have a valid context, we can safely enter the dashboard.
            // We use setTimeout to let the user see the success toast briefly.
            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);

        } catch (err) {
            // Error handling: same pattern we used in Auth
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? "Failed to create workspace.");
                toast.error(err.getFriendlyMessage() ?? "Failed to create workspace.");
            } else {
                setError("An unexpected error occurred.");
                toast.error("An unexpected error occurred.");
            }
            setIsCreating(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome to the App!</h2>
                <p className="text-muted-foreground">
                    It looks like you don't belong to any workspaces yet. Let's get you set up.
                </p>
            </div>

            {/* Path A: Create a New Workspace */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Create a Workspace</h3>
                </div>

                <form onSubmit={handleCreateWorkspace} className="space-y-4">
                    {error && (
                        <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Problem</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="workspaceName">Workspace Name</Label>
                        <Input
                            id="workspaceName"
                            type="text"
                            placeholder="e.g. Acme Corp, My Startup, Project Phoenix..."
                            required
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 rounded-xl mt-2"
                        disabled={isCreating || isRefreshing}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Workspace"
                        )}
                    </Button>
                </form>
            </div>

            {/* Path B: Wait for an Invite */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-medium tracking-wider">Or</span>
                </div>
            </div>

            <div className="mt-8 text-center p-6 border border-dashed border-border rounded-2xl bg-muted/20">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">Waiting for an invite?</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    If your team is already using the app, ask them to send you an invite link.
                    Once you click the link in your email, you'll be added automatically!
                </p>
                <Button
                    variant="outline"
                    className="mt-4 rounded-xl cursor-pointer"
                    disabled={isRefreshing || isCreating}
                    onClick={async () => await detectWorkspaces()}
                >
                    {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Refresh Status
                </Button>
            </div>
        </AuthLayout >
    );
}
