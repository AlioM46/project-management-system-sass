"use client";

import React, { useState } from "react";
import Link from "next/link";
import { register } from "../api/auth.api";
import { ApiError } from "../../../shared/api/ApiError";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function Register() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const next = searchParams.get("next") || "/dashboard";

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            const err = t("auth_register_username_chars_err");
            setError(err);
            toast.error(err);
            return;
        }

        if (username.length < 3 || username.length > 12) {
            const err = t("auth_register_username_len_err");
            setError(err);
            toast.error(err);
            return;
        }

        if (password.length < 8) {
            const err = t("auth_register_password_len_err");
            setError(err);
            toast.error(err);
            return;
        }

        setIsLoading(true);

        try {
            await register({
                name: name,
                username: username,
                email: email,
                password: password
            });

            toast.success(t("auth_register_welcome_toast"));
            setShowSuccessDialog(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? t("auth_register_failed_err"));
                toast.error(err.getFriendlyMessage() ?? t("auth_register_failed_err"));
            } else {
                setError(t("auth_unexpected_error"));
                toast.error(t("auth_unexpected_error"));
            }
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Dialog 
                open={showSuccessDialog} 
                onOpenChange={(open) => {
                    if (!open) {
                        router.push(next);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-start">{t("auth_register_dialog_title")}</DialogTitle>
                        <DialogDescription className="text-base pt-2 text-start">
                            {t("auth_register_dialog_desc")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button onClick={() => router.push(next)} className="w-full sm:w-auto">
                            {next === "/dashboard" ? t("auth_register_dialog_btn_dashboard") : t("auth_register_dialog_btn_continue")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="text-center lg:text-start mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">{t("auth_register_free_title")}</h2>
                <p className="text-muted-foreground">{t("auth_register_free_subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-start">
                {error && (
                    <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t("auth_problem")}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("auth_register_name")}</Label>
                        <Input
                            id="name"
                            placeholder={t("auth_register_name")}
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">{t("auth_register_username")}</Label>
                        <Input
                            id="username"
                            placeholder={t("auth_register_username")}
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t("auth_register_email")}</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all text-start"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t("auth_register_password")}</Label>
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

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/20 rounded-xl"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("auth_register_creating")}
                        </>
                    ) : (
                        t("auth_register_create_btn")
                    )}
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                {t("auth_register_terms")}{" "}
                <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                    {t("auth_register_tos")}
                </Link>
            </p>

            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">
                    {t("auth_register_have_account")}
                </p>
                <Link 
                    href={next !== "/dashboard" ? `/login?next=${encodeURIComponent(next)}` : "/login"} 
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-xl h-9 px-5 cursor-pointer hover:bg-muted/50 transition-all"
                    )}
                >
                    {t("auth_register_login_btn")}
                </Link>
            </div>
        </AuthLayout>
    );
}
