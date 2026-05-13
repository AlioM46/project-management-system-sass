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
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Login() {
    const router = useRouter();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const isEmail = login.includes("@");

        if (isEmail) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(login)) {
                setError("Invalid email address.");
                toast.error("Invalid email address.");
                return;
            }
        } else {
            const usernameRegex = /^[a-zA-Z0-9_-]+$/;
            if (!usernameRegex.test(login)) {
                setError("Username can only contain letters, numbers, dashes, and underscores.");
                toast.error("Username can only contain letters, numbers, dashes, and underscores.");
                return;
            }

            if (login.length < 3 || login.length > 12) {
                setError("Username must be between 3 and 12 characters.");
                toast.error("Username must be between 3 and 12 characters.");
                return;
            }
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            await LoginAPI({
                login: login,
                password: password
            });

            toast.success("Login successful!");
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? "Login failed. Try a different email or username.");
                toast.error(err.getFriendlyMessage() ?? "Login failed. Try a different email or username.");
            } else {
                setError("An unexpected error occurred.");
                toast.error("An unexpected error occurred.");
            }
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h2>
                <p className="text-muted-foreground">Enter your details to access your account.</p>
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
                    <Label htmlFor="login">Email or Username</Label>
                    <Input
                        id="login"
                        type="text"
                        placeholder="name@company.com or johndoe"
                        required
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="password">Password</Label>

                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                    />
                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                        Forgot password?
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
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">
                    Don't have an account?
                </p>
                <Link 
                    href="/register" 
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-xl h-9 px-5 cursor-pointer hover:bg-muted/50 transition-all"
                    )}
                >
                    Create Account
                </Link>
            </div>
        </AuthLayout>
    );
}

