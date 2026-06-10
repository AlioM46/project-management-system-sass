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
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function Onboarding() {
    const { t } = useTranslation();
    const router = useRouter();
    const [workspaceName, setWorkspaceName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

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

        fetchData();
    }, [router])

    const detectWorkspaces = async (showToast: boolean = true) => {
        setIsRefreshing(true);
        try {
            const data = await getWorkspaces();

            if (data && data.workspaces && data.workspaces.length > 0) {
                setCookie("workspace_id", data.workspaces[0].id);
                toast.success(t("onboard_toast_welcome", { name: data.workspaces[0].name }));
                router.push("/dashboard");
            } else {
                if (showToast) {
                    toast.info(t("onboard_toast_none_found"));
                }
                setIsRefreshing(false);
            }
        } catch (err) {
            if (showToast) toast.error(t("onboard_toast_check_failed"));
            setIsRefreshing(false);
        }
    }

    const handleCreateWorkspace = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (workspaceName.trim().length < 3) {
            const err = t("onboard_validation_len");
            setError(err);
            toast.error(err);
            return;
        }

        setIsCreating(true);

        try {
            const newWorkspace = await createWorkspace({ name: workspaceName.trim() });

            setCookie("workspace_id", newWorkspace.id);

            toast.success(t("onboard_toast_success"));

            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);

        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? t("modal_course_created_error"));
                toast.error(err.getFriendlyMessage() ?? t("modal_course_created_error"));
            } else {
                setError(t("auth_unexpected_error"));
                toast.error(t("auth_unexpected_error"));
            }
            setIsCreating(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center lg:text-start mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">{t("onboard_welcome")}</h2>
                <p className="text-muted-foreground">
                    {t("onboard_no_workspaces")}
                </p>
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-8 text-start">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{t("onboard_create_title")}</h3>
                </div>

                <form onSubmit={handleCreateWorkspace} className="space-y-4">
                    {error && (
                        <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>{t("auth_problem")}</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="workspaceName">{t("onboard_ws_name")}</Label>
                        <Input
                            id="workspaceName"
                            type="text"
                            placeholder={t("onboard_ws_placeholder")}
                            required
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all text-start"
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
                                {t("onboard_creating")}
                            </>
                        ) : (
                            t("onboard_create_btn")
                        )}
                    </Button>
                </form>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-medium tracking-wider">{t("onboard_or")}</span>
                </div>
            </div>

            <div className="mt-8 text-center p-6 border border-dashed border-border rounded-2xl bg-muted/20">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">{t("onboard_waiting_invite")}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {t("onboard_waiting_invite_desc")}
                </p>
                <Button
                    variant="outline"
                    className="mt-4 rounded-xl cursor-pointer"
                    disabled={isRefreshing || isCreating}
                    onClick={async () => await detectWorkspaces()}
                >
                    {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("onboard_refresh_btn")}
                </Button>
            </div>
        </AuthLayout >
    );
}
