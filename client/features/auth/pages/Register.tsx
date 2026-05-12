"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { register } from "../api/auth.api";
import { ApiError } from "../../../shared/api/ApiError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UserPlus, AlertCircle, Sun, Moon, CheckCircle2, Star } from "lucide-react";
import { useTheme } from "next-themes";

export default function Register() {
    const { theme, setTheme } = useTheme();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            setError("Username can only contain letters, numbers, dashes, and underscores.");
            return;
        }

        if (username.length < 3 || username.length > 12) {
            setError("Username must be between 3 and 12 characters.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
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

            window.location.href = "/dashboard";
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.getFriendlyMessage() ?? "Registration failed. Try a different email.");
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background transition-colors duration-500 overflow-hidden">
            {/* Left Side: Illustration & Social Proof */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-muted/40 relative border-r border-border/50">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <CheckCircle2 className="text-primary-foreground w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">FocusFlow</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                            Manage projects with <span className="text-primary">unmatched speed.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Join thousands of teams who have transformed their productivity with FocusFlow.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="flex -space-x-3">
                        {[
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80",
                            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&q=80",
                            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80"
                        ].map((url, i) => (
                            <div key={i} className="w-12 h-12 rounded-full border-4 border-background bg-muted overflow-hidden relative">
                                <Image 
                                    src={url} 
                                    alt={`User ${i + 1}`} 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ))}
                        <div className="w-12 h-12 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20">
                            +10k
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md p-4 rounded-2xl border border-border/50 max-w-sm shadow-xl">
                        <div className="flex text-yellow-500">
                            {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                        <p className="text-sm font-medium">"The most intuitive tool we've ever used."</p>
                    </div>
                </div>

                {/* Background Illustration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-auto opacity-40 dark:opacity-20 pointer-events-none grayscale dark:invert">
                    <Image 
                        src="/saas_registration_illustration_1778620854263.png" 
                        alt="Background Illustration" 
                        width={800} 
                        height={600} 
                        className="w-full h-auto"
                        priority
                    />
                </div>
            </div>

            {/* Right Side: Registration Form */}
            <div className="flex flex-col items-center justify-center p-6 lg:p-12 relative">
                {/* Theme Toggle */}
                <div className="absolute top-6 right-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-xl border-border/50 shadow-sm hover:scale-110 transition-all cursor-pointer"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </div>

                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                        <Button variant="outline" asChild className="rounded-xl h-9 px-5 cursor-pointer hover:bg-muted/50 transition-all">
                            <Link href="/login">Log In</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
