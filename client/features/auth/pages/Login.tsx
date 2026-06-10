"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Login as LoginAPI } from "../api/auth.api";
import { ApiError } from "../../../shared/api/ApiError";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function Login() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const next = searchParams.get("next") || "/dashboard";

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const isEmail = login.includes("@");

        if (isEmail) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(login)) {
                setError(t("auth_invalid_email"));
                toast.error(t("auth_invalid_email"));
                return;
            }
        } else {
            const usernameRegex = /^[a-zA-Z0-9_-]+$/;
            if (!usernameRegex.test(login)) {
                setError(t("auth_invalid_username_chars"));
                toast.error(t("auth_invalid_username_chars"));
                return;
            }

            if (login.length < 3 || login.length > 12) {
                setError(t("auth_invalid_username_len"));
                toast.error(t("auth_invalid_username_len"));
                return;
            }
        }

        if (password.length < 8) {
            setError(t("auth_invalid_password_len"));
            toast.error(t("auth_invalid_password_len"));
            return;
        }

        setIsLoading(true);

        try {
            await LoginAPI({
                login: login,
                password: password
            });

            toast.success(t("auth_login_success"));
            setTimeout(() => {
                router.push(next);
            }, 2000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? t("auth_login_failed"));
                toast.error(err.getFriendlyMessage() ?? t("auth_login_failed"));
            } else {
                setError(t("auth_unexpected_error"));
                toast.error(t("auth_unexpected_error"));
            }
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center lg:text-start mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">{t("auth_login_title")}</h2>
                <p className="text-muted-foreground">{t("auth_enter_details")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t("auth_problem")}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="login">{t("auth_login_or_username")}</Label>
                    <Input
                        id="login"
                        type="text"
                        placeholder={t("auth_login_or_username_placeholder")}
                        required
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all text-start"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password">{t("auth_password")}</Label>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all text-start"
                    />
                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                        {t("auth_forgot_password")}
                    </Link>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/20 rounded-xl"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("auth_signing_in")}
                        </>
                    ) : (
                        t("auth_sign_in")
                    )}
                </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">
                    {t("auth_no_account")}
                </p>
                <Link
                    href={next !== "/dashboard" ? `/register?next=${encodeURIComponent(next)}` : "/register"}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-xl h-9 px-5 cursor-pointer hover:bg-muted/50 transition-all"
                    )}
                >
                    {t("auth_register_link")}
                </Link>
            </div>
        </AuthLayout>
    );
}

