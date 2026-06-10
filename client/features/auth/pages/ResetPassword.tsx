"use client";
import React, { useState } from "react";
import Link from "next/link";
import { resetPassword } from "../api/auth.api";
import { ApiError } from "../../../shared/api/ApiError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/context/LanguageContext";

interface ResetPasswordProps {
    email?: string;
    token?: string;
}

export default function ResetPassword({ email, token }: ResetPasswordProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        if (!email || !token) {
            setError(t("auth_reset_invalid_link_err"));
            toast.error(t("auth_reset_invalid_link_err"));
            return;
        }

        if (password.length < 8) {
            setError(t("auth_reset_password_len_err"));
            toast.error(t("auth_reset_password_len_err"));
            return;
        }

        if (password !== passwordConfirmation) {
            setError(t("auth_reset_confirm_password_err"));
            toast.error(t("auth_reset_confirm_password_err"));
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword({
                email,
                plain_token: token,
                password,
                password_confirmation: passwordConfirmation
            });

            toast.success(t("auth_reset_toast_success"));
            setShowSuccessDialog(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? t("auth_reset_toast_failed"));
                toast.error(err.getFriendlyMessage() ?? t("auth_reset_toast_failed"));
            } else {
                setError(t("auth_unexpected_error"));
                toast.error(t("auth_unexpected_error"));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Dialog
                open={showSuccessDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        router.push("/login");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-start">{t("auth_reset_dialog_title")}</DialogTitle>
                        <DialogDescription className="text-base pt-2 text-start">
                            {t("auth_reset_dialog_desc")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button onClick={() => router.push("/login")} className="w-full sm:w-auto">
                            {t("auth_reset_dialog_btn_login")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="text-center lg:text-start mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">{t("auth_reset_title")}</h2>
                <p className="text-muted-foreground">{t("auth_reset_subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-start">
                {(!email || !token) && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t("auth_reset_invalid_link_title")}</AlertTitle>
                        <AlertDescription>
                            {t("auth_reset_invalid_link_desc")}
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t("auth_problem")}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="password">{t("auth_reset_new_password")}</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all text-start"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="passwordConfirmation">{t("auth_reset_confirm_password")}</Label>
                    <Input
                        id="passwordConfirmation"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all text-start"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/20 rounded-xl"
                    disabled={isLoading || !email || !token}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("auth_resetting")}
                        </>
                    ) : (
                        t("auth_forgot_title")
                    )}
                </Button>
            </form>
        </AuthLayout>
    );
}
