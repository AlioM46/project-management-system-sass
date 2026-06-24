"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { resetPassword } from "@/feature/auth/api/auth";
import ApiError from "@/shared/api/ApiError";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { validPasswordWithConfirmationPassword } from "@/shared/utils/validator";

interface ResetPasswordPageProps {
    token: string;
    email: string;
}

export default function ResetPasswordPage({ token, email }: ResetPasswordPageProps) {
    const router = useRouter();

    const [password, setPassword] = useState<string>("");
    const [confirmationPassword, setConfirmationPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!token || !email) {
            setError("Invalid or missing reset link parameters.");
            toast.error("Invalid or missing reset link parameters.");
            return;
        }

        const isPasswordValid = validPasswordWithConfirmationPassword(password, confirmationPassword);
        if (isPasswordValid !== "") {
            setError(isPasswordValid);
            toast.error(isPasswordValid);
            return;
        }

        setIsLoading(true);

        try {
            const message = await resetPassword({
                email,
                plain_token: token,
                password,
                password_confirmation: confirmationPassword
            });

            toast.success(message || "Password reset successful! Redirecting to login...");

            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.message ?? "Password reset failed. The link may have expired.");
                toast.error(e.message ?? "Password reset failed.");
            } else {
                setError("An unexpected error occurred.");
                toast.error("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!error) return;

        const timer = setTimeout(() => {
            setError("");
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [error]);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Reset Password</h3>
                <p className="text-sm text-muted-foreground">
                    Enter your new password below to complete the reset process.
                </p>
            </div>

            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />}

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}

                <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium leading-none">
                        New Password
                    </label>
                    <Input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="password-confirmation" className="text-sm font-medium leading-none">
                        Confirm New Password
                    </label>
                    <Input
                        value={confirmationPassword}
                        onChange={(e) => setConfirmationPassword(e.target.value)}
                        type="password"
                        id="password-confirmation"
                        name="password-confirmation"
                        placeholder="••••••••"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? "Resetting password..." : "Reset Password"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/login")}
                        disabled={isLoading}
                        className="w-full"
                    >
                        Back to Login
                    </Button>
                </div>
            </form>
        </div>
    );
}
