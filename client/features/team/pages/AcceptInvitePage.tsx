"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Mail, ShieldAlert, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { acceptInvite, previewInvite } from "@/features/team/api/team.api";
import { AcceptInviteResult, Invite } from "@/features/team/types";
import { ApiError } from "@/shared/api/ApiError";
import { getCookie, setCookie } from "@/shared/utils/cookies";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/context/LanguageContext";

type AcceptInvitePageProps = {
    invitationId?: number;
    token?: string;
};

type PreviewState =
    | { kind: "loading" }
    | { kind: "invalid"; message: string }
    | { kind: "ready"; invitation: Invite };

export default function AcceptInvitePage({
    invitationId,
    token,
}: AcceptInvitePageProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [previewState, setPreviewState] = useState<PreviewState>(() =>
        !invitationId || !token
            ? {
                  kind: "invalid",
                  message: "This invitation link is missing required information.",
              }
            : { kind: "loading" }
    );
    const [acceptError, setAcceptError] = useState<string | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const attemptedAcceptRef = useRef(false);

    const nextUrl = useMemo(() => {
        if (!invitationId || !token) return "/dashboard";

        return `/accept-invite?invitation_id=${invitationId}&token=${encodeURIComponent(token)}`;
    }, [invitationId, token]);

    const hasAccessToken = !!getCookie("access_token");

    useEffect(() => {
        if (!invitationId || !token) return;

        let isActive = true;

        const loadPreview = async () => {
            try {
                const response = await previewInvite(invitationId, token);

                if (!isActive) return;

                setPreviewState({
                    kind: "ready",
                    invitation: response.invitation,
                });
            } catch (error) {
                if (!isActive) return;

                const message =
                    error instanceof ApiError
                        ? error.getFriendlyMessage() ?? t("invite_toast_failed")
                        : t("invite_toast_failed");

                setPreviewState({
                    kind: "invalid",
                    message,
                });
            }
        };

        loadPreview();

        return () => {
            isActive = false;
        };
    }, [invitationId, token, t]);

    useEffect(() => {
        if (previewState.kind !== "ready") return;
        if (!hasAccessToken) return;
        if (previewState.invitation.status !== "pending") return;
        if (attemptedAcceptRef.current) return;

        attemptedAcceptRef.current = true;

        const runAccept = async () => {
            setIsAccepting(true);
            setAcceptError(null);

            try {
                const response: AcceptInviteResult = await acceptInvite(
                    previewState.invitation.id,
                    token as string
                );

                setCookie("workspace_id", String(response.workspace_id));
                toast.success(t("invite_toast_success"));
                router.push("/dashboard");
            } catch (error) {
                const message =
                    error instanceof ApiError
                        ? error.getFriendlyMessage() ?? t("invite_toast_failed")
                        : t("invite_toast_failed");

                setAcceptError(message);
                attemptedAcceptRef.current = false;
            } finally {
                setIsAccepting(false);
            }
        };

        runAccept();
    }, [hasAccessToken, previewState, router, token, t]);

    const renderStatus = () => {
        if (previewState.kind === "loading") {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">{t("invite_loading_title")}</h2>
                    <p className="mt-2 text-muted-foreground">
                        {t("invite_loading_desc")}
                    </p>
                </div>
            );
        }

        if (previewState.kind === "invalid") {
            return (
                <div className="space-y-6 text-start">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                            <ShieldAlert className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">{t("invite_invalid_title")}</h2>
                        <p className="mt-2 text-muted-foreground">{previewState.message}</p>
                    </div>
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>{t("invite_invalid_desc")}</AlertTitle>
                        <AlertDescription>
                            {t("invite_invalid_ask_owner")}
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        const { invitation } = previewState;
        const isPending = invitation.status === "pending";
        const isAccepted = invitation.status === "accepted";
        const isExpired = invitation.status === "expired";
        const isHandled = !isPending;

        return (
            <div className="space-y-6 text-start">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                        {isAccepted ? (
                            <CheckCircle2 className="h-8 w-8" />
                        ) : (
                            <UserPlus className="h-8 w-8" />
                        )}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isPending ? t("invite_invited_title") : t("invite_status_title")}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        {invitation.workspace?.name
                            ? t("invite_workspace_label", { name: invitation.workspace.name })
                            : t("invite_workspace_generic")}
                    </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-background/80 p-5 shadow-sm">
                    <div className="space-y-4 text-sm">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{t("invite_email_label")}</p>
                                <p className="text-muted-foreground">{invitation.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-medium">{t("invite_role_label")}</p>
                                <p className="text-muted-foreground">
                                    {invitation.role?.name ?? "Member"}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="font-medium">{t("invite_invited_by")}</p>
                            <p className="text-muted-foreground">
                                {invitation.inviter?.name ?? t("invite_invited_by_generic")}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium">{t("invite_expires_label")}</p>
                            <p className="text-muted-foreground">
                                {invitation.expires_at
                                    ? new Date(invitation.expires_at).toLocaleString()
                                    : t("invite_expires_none")}
                            </p>
                        </div>
                    </div>
                </div>

                {acceptError && (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>{t("invite_toast_failed")}</AlertTitle>
                        <AlertDescription>{acceptError}</AlertDescription>
                    </Alert>
                )}

                {isAccepted && (
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>{t("invite_alert_used_title")}</AlertTitle>
                        <AlertDescription>
                            {t("invite_alert_used_desc")}
                        </AlertDescription>
                    </Alert>
                )}

                {isExpired && (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>{t("invite_alert_expired_title")}</AlertTitle>
                        <AlertDescription>
                            {t("invite_alert_expired_desc")}
                        </AlertDescription>
                    </Alert>
                )}

                {isHandled && !isAccepted && !isExpired && (
                    <Alert variant="destructive">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>{t("invite_alert_handled_title")}</AlertTitle>
                        <AlertDescription>
                            {t("invite_alert_handled_desc")}
                        </AlertDescription>
                    </Alert>
                )}

                {isPending && !hasAccessToken && (
                    <div className="space-y-4">
                        <Alert>
                            <Mail className="h-4 w-4" />
                            <AlertTitle>{t("invite_alert_auth_title")}</AlertTitle>
                            <AlertDescription>
                                {t("invite_alert_auth_desc")}
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={`/login?next=${encodeURIComponent(nextUrl)}`}
                                className={cn(buttonVariants(), "h-11 rounded-xl px-5")}
                            >
                                {t("invite_btn_signin")}
                            </Link>
                            <Link
                                href={`/register?next=${encodeURIComponent(nextUrl)}`}
                                className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    "h-11 rounded-xl px-5"
                                )}
                            >
                                {t("invite_btn_register")}
                            </Link>
                        </div>
                    </div>
                )}

                {isPending && hasAccessToken && (
                    <div className="space-y-4">
                        <Alert>
                            <UserPlus className="h-4 w-4" />
                            <AlertTitle>
                                {isAccepting ? t("invite_alert_accepting_title") : t("invite_alert_ready_title")}
                            </AlertTitle>
                            <AlertDescription>
                                {isAccepting
                                    ? t("invite_alert_accepting_desc")
                                    : t("invite_alert_ready_desc")}
                            </AlertDescription>
                        </Alert>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                type="button"
                                disabled={isAccepting}
                                onClick={async () => {
                                    attemptedAcceptRef.current = true;
                                    setIsAccepting(true);
                                    setAcceptError(null);

                                    try {
                                        const response = await acceptInvite(invitation.id, token as string);
                                        setCookie("workspace_id", String(response.workspace_id));
                                        toast.success(t("invite_toast_success"));
                                        router.push("/dashboard");
                                    } catch (error) {
                                        const message =
                                            error instanceof ApiError
                                                ? error.getFriendlyMessage() ?? t("invite_toast_failed")
                                                : t("invite_toast_failed");

                                        setAcceptError(message);
                                        attemptedAcceptRef.current = false;
                                    } finally {
                                        setIsAccepting(false);
                                    }
                                }}
                                className="h-11 rounded-xl px-5"
                            >
                                {isAccepting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("invite_btn_accepting")}
                                    </>
                                ) : (
                                    t("invite_btn_accept")
                                )}
                            </Button>
                            <Link
                                href={`/login?next=${encodeURIComponent(nextUrl)}`}
                                className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    "h-11 rounded-xl px-5"
                                )}
                            >
                                {t("invite_btn_another_account")}
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthLayout>
            {renderStatus()}
        </AuthLayout>
    );
}
