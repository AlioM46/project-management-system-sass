"use client";

import React, { useState } from "react";
import Link from "next/link";
import { register } from "../api/auth.api";
import { ApiError, getErrorMessage } from "@/shared/api/ApiError";
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

export default function Register() {
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
            setError("Username can only contain letters, numbers, dashes, and underscores.");
            toast.error("Username can only contain letters, numbers, dashes, and underscores.");
            return;
        }

        if (username.length < 3 || username.length > 12) {
            setError("Username must be between 3 and 12 characters.");
            toast.error("Username must be between 3 and 12 characters.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            toast.error("Password must be at least 8 characters long.");
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

            toast.success("Welcome aboard!");
            setShowSuccessDialog(true);
        } catch (err) {
            const errorMsg = getErrorMessage(err, "Registration failed. Try a different email.");
            setError(errorMsg);
            toast.error(errorMsg);
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
                        <DialogTitle className="text-2xl">Welcome aboard!</DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            We&apos;ve sent a verification link to your email address. 
                            Please check your inbox (and spam folder) to activate your account.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button onClick={() => router.push(next)} className="w-full sm:w-auto">
                            {next === "/dashboard" ? "Go to Dashboard" : "Continue"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Get started for free</h2>
                <p className="text-muted-foreground">No credit card required. Cancel anytime.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <Alert variant="destructive" className="animate-in zoom-in-95 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Problem</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="johndoe"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="h-11 px-4 rounded-xl border-border/50 focus-visible:ring-primary/20 transition-all"
                        />
                    </div>
                </div>

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

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
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

                <Button
                    type="submit"
                    className="w-full h-12 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/20 rounded-xl"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        "Create Account"
                    )}
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                    Terms of Service
                </Link>
            </p>

            <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">
                    Already have an account?
                </p>
                <Link 
                    href={next !== "/dashboard" ? `/login?next=${encodeURIComponent(next)}` : "/login"} 
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "rounded-xl h-9 px-5 cursor-pointer hover:bg-muted/50 transition-all"
                    )}
                >
                    Log In
                </Link>
            </div>
        </AuthLayout>
    );
}
