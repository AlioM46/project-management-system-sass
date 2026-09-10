"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyEmailApi } from "../api/auth.api";
import { getErrorMessage } from "@/shared/api/ApiError";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";

interface VerifyEmailProps {
    id?: string;
    hash?: string;
    expires?: string;
    signature?: string;
}

export default function VerifyEmail({ id, hash, expires, signature }: VerifyEmailProps) {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        let isCancelled = false;

        if (!id || !hash || !expires || !signature) {
            setStatus("error");
            setMessage("Invalid verification link. Some required parameters are missing.");
            return;
        }

        const runVerification = async () => {
            try {
                const queryParams = new URLSearchParams({ expires, signature }).toString();
                const res = await verifyEmailApi(id, hash, queryParams);

                if (!isCancelled) {
                    setStatus("success");
                    setMessage(res?.message || "Your email has been verified successfully!");
                }
            } catch (error) {
                if (!isCancelled) {
                    setStatus("error");
                    setMessage(getErrorMessage(error, "The verification link is invalid or has expired."));
                }
            }
        };

        runVerification();

        return () => {
            isCancelled = true;
        };
    }, [id, hash, expires, signature]);

    return (
        <AuthLayout>
            <div className="w-full max-w-md mx-auto py-8">
                {status === "loading" && (
                    <div className="text-center space-y-4 py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 mb-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">Verifying your email...</h2>
                        <p className="text-muted-foreground text-sm">
                            Please wait while we verify your email address.
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center space-y-6 py-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 mb-2">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Email Verified! 🎉</h2>
                            <p className="text-muted-foreground text-sm">{message}</p>
                        </div>

                        <div className="pt-2">
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full gap-2 py-6 text-base font-medium shadow-md shadow-blue-500/10"
                            >
                                Continue to Login
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-6 py-4 animate-in fade-in duration-300">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Verification Failed</AlertTitle>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>

                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full"
                            >
                                Back to Login
                            </Button>
                            <div className="text-center">
                                <Link
                                    href="/register"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                                >
                                    Create a new account
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
