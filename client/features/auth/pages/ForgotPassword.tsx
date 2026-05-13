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

export default function ForgotPassword() {
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
            setError("Invalid email address.");
            toast.error("Invalid email address.");
            return;
        }

        setIsLoading(true);

        try {
            await forgotPassword({ email });

            toast.success("Reset link sent successfully!");
            setShowSuccessDialog(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? "Failed to send reset link. Try again.");
                toast.error(err.getFriendlyMessage() ?? "Failed to send reset link. Try again.");
            } else {
                setError("An unexpected error occurred.");
                toast.error("An unexpected error occurred.");
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
                        <DialogTitle className="text-2xl">Check your email</DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            We've sent a password reset link to <strong>{email}</strong>. 
                            Please check your inbox and click the link to reset your password.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button onClick={() => router.push("/login")} className="w-full sm:w-auto">
                            Back to Login
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h2>
                <p className="text-muted-foreground">Enter your email and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Problem</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
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
                            Sending link...
                        </>
                    ) : (
                        "Send Reset Link"
                    )}
                </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">
                    Remember your password?
                </p>
                <Link 
                    href="/login" 
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-xl h-9 px-5 cursor-pointer hover:bg-muted/50 transition-all"
                    )}
                >
                    Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
}
