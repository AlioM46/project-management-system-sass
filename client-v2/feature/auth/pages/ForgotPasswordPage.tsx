"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { forgotPassword } from "@/feature/auth/api/auth";
import ApiError from "@/shared/api/ApiError";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { isValidEmail } from "@/shared/utils/validator";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!email) {
            setError("Email is required");
            toast.error("Email is required");
            return;
        }

        if (!isValidEmail(email)) {
            setError("Invalid email address");
            toast.error("Invalid email address");
            return;
        }

        setIsLoading(true);

        try {
            const message = await forgotPassword({ email });
            setSuccessMessage(message);
            toast.success(message);
            setEmail("");
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message ?? "Failed to send reset link.");
                toast.error(err.message ?? "Failed to send reset link.");
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
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />}

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                {successMessage && <p className="text-sm font-medium text-green-600 dark:text-green-400">{successMessage}</p>}

                <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium leading-none">
                        Email Address
                    </label>
                    <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        id="email"
                        name="email"
                        placeholder="name@example.com"
                        disabled={isLoading}
                        required
                    />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? "Sending link..." : "Send Reset Link"}
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
