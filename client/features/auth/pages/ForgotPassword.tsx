"use client";
import React, { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "../api/auth.api";
import { ApiError } from "../../../shared/api/ApiError";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/context/LanguageContext";

export default function ForgotPassword() {
    const { t } = useTranslation();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            const err = t("auth_forgot_invalid_email_err");
            setError(err);
            toast.error(err);
            return;
        }

        setIsLoading(true);

        try {
            await forgotPassword({ email });

            toast.success(t("auth_forgot_success_toast"));
            setShowSuccessDialog(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? t("auth_forgot_failed_err"));
                toast.error(err.getFriendlyMessage() ?? t("auth_forgot_failed_err"));
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
                        <DialogTitle className="text-2xl text-start">{t("auth_forgot_dialog_title")}</DialogTitle>
                        <DialogDescription className="text-base pt-2 text-start">
                            {t("auth_forgot_dialog_desc", { email })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button onClick={() => router.push("/login")} className="w-full sm:w-auto">
                            {t("auth_forgot_dialog_btn_login")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="text-center lg:text-start mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">{t("auth_forgot_title")}</h2>
                <p className="text-muted-foreground">{t("auth_forgot_subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-start">
                {error && (
                    <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t("auth_problem")}</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">{t("auth_forgot_email")}</Label>
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

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/20 rounded-xl"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("auth_forgot_sending")}
                        </>
                    ) : (
                        t("auth_forgot_send_btn")
                    )}
                </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">
                    {t("auth_forgot_remember")}
                </p>
                <Link
                    href="/login"
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-xl h-9 px-5 cursor-pointer hover:bg-muted/50 transition-all"
                    )}
                >
                    {t("auth_forgot_dialog_btn_login")}
                </Link>
            </div>
        </AuthLayout>
    );
}
