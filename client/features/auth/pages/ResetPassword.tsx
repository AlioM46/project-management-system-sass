"use client";

import React, { useState } from "react";
import Link from "next/link";
import { resetPassword } from "../api/auth.api";
import { ApiError, getErrorMessage } from "@/shared/api/ApiError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ResetPasswordProps {
    email?: string;
    token?: string;
}

export default function ResetPassword({ email, token }: ResetPasswordProps) {
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
            setError("Invalid reset link. Please request a new one.");
            toast.error("Invalid reset link.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            toast.error("Passwords do not match.");
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

            toast.success("Password reset successfully!");
            setShowSuccessDialog(true);
        } catch (err) {
            const errorMsg = getErrorMessage(err, "Failed to reset password. The link might be expired.");
            setError(errorMsg);
            toast.error(errorMsg);
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
                        <DialogTitle className="text-2xl">Password Reset Complete! 🎉</DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Your password has been successfully reset.
                            You can now use your new password to log in to your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button onClick={() => router.push("/login")} className="w-full sm:w-auto">
                            Go to Login
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Create New Password</h2>
                <p className="text-muted-foreground">Please enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {(!email || !token) && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Invalid Link</AlertTitle>
                        <AlertDescription>
                            The reset link is incomplete or invalid. Please <Link href="/forgot-password" className="underline">request a new one</Link>.
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Problem</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="passwordConfirmation">Confirm New Password</Label>
                    <Input
                        id="passwordConfirmation"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
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
                            Resetting...
                        </>
                    ) : (
                        "Reset Password"
                    )}
                </Button>
            </form>
        </AuthLayout>
    );
}
