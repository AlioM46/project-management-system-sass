"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getWorkspaces } from "../api/workspace.api";
import { Workspace } from "../types";
import { getCookie, setCookie } from "@/shared/utils/cookies";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface WorkspaceContextType {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    currentWorkspaceId: string | null;
    isLoading: boolean;
    switchWorkspace: (workspaceId: string | number) => Promise<void>;
    refreshWorkspaces: () => Promise<void>;
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (open: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const currentWorkspaceIdRef = useRef<string | null>(null);

    const syncCurrentFromCookie = useCallback((list: Workspace[], cookieId: string | null) => {
        if (!cookieId) {
            return list.length > 0 ? list[0] : null;
        }
        return list.find((w) => String(w.id) === String(cookieId)) || (list.length > 0 ? list[0] : null);
    }, []);

    const fetchWorkspacesData = useCallback(async (isInitial = false) => {
        if (!isInitial) setIsLoading(true);
        try {
            const data = await getWorkspaces();
            const fetched = data?.workspaces || [];
            setWorkspaces(fetched);

            if (fetched.length === 0) {
                router.push("/onboarding");
                return;
            }

            const currentCookieId = getCookie("workspace_id");
            const active = syncCurrentFromCookie(fetched, currentCookieId);

            if (active) {
                if (String(currentCookieId) !== String(active.id)) {
                    setCookie("workspace_id", String(active.id));
                }
                setCurrentWorkspace(active);
                currentWorkspaceIdRef.current = String(active.id);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces:", error);
        } finally {
            if (isInitial) setIsChecking(false);
            if (!isInitial) setIsLoading(false);
        }
    }, [router, syncCurrentFromCookie]);

    useEffect(() => {
        void fetchWorkspacesData(true);

        const handleCookieChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ name?: string; value?: string | null }>;
            if (customEvent.detail?.name === "workspace_id") {
                const newId = customEvent.detail.value;
                if (newId && newId !== currentWorkspaceIdRef.current) {
                    currentWorkspaceIdRef.current = newId;
                    setWorkspaces((prev) => {
                        const matched = prev.find((w) => String(w.id) === String(newId));
                        if (matched) {
                            setCurrentWorkspace(matched);
                        }
                        return prev;
                    });
                }
            }
        };

        window.addEventListener("app-cookie-change", handleCookieChange as EventListener);
        return () => {
            window.removeEventListener("app-cookie-change", handleCookieChange as EventListener);
        };
    }, [fetchWorkspacesData]);

    const switchWorkspace = useCallback(async (workspaceId: string | number) => {
        const idStr = String(workspaceId);
        if (currentWorkspaceIdRef.current === idStr) {
            return;
        }

        const target = workspaces.find((w) => String(w.id) === idStr);
        if (!target) return;

        setCookie("workspace_id", idStr);
        currentWorkspaceIdRef.current = idStr;
        setCurrentWorkspace(target);

        toast.success(`Switched to ${target.name}`);

        const isDeepItemRoute = Boolean(pathname.match(/\/dashboard\/(projects|tasks|chat)\/[^/]+/));
        if (isDeepItemRoute) {
            router.push("/dashboard");
        } else {
            router.refresh();
        }
    }, [workspaces, pathname, router]);

    const refreshWorkspaces = useCallback(async () => {
        await fetchWorkspacesData(false);
    }, [fetchWorkspacesData]);

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                currentWorkspace,
                currentWorkspaceId: currentWorkspace ? String(currentWorkspace.id) : null,
                isLoading,
                switchWorkspace,
                refreshWorkspaces,
                isCreateModalOpen,
                setIsCreateModalOpen,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

