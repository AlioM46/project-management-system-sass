"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sun, Moon, Star, Hexagon } from "lucide-react";
import { useTheme } from "next-themes";

interface AuthLayoutProps {
    children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background transition-colors duration-500 overflow-hidden">
            {/* Left Side: Illustration & Social Proof */}
            <div className="hidden lg:flex flex-col justify-between p-12 bg-muted/40 relative border-r border-border/50">
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity w-fit">
                        <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                            <Hexagon className="h-6 w-6 absolute" strokeWidth={2.5} />
                            <div className="h-2.5 w-2.5 bg-white rounded-full absolute" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Nexus</span>
                    </Link>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                            Manage projects with <span className="text-primary">unmatched speed.</span>
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Join thousands of teams who have transformed their productivity with Nexus.
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

            {/* Right Side: Registration Form Container */}
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

                {/* Mobile Home Link (Visible only on small screens or as a persistent back button) */}
                <div className="absolute top-6 left-6 lg:hidden">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                            <Hexagon className="h-4 w-4 absolute" strokeWidth={2.5} />
                            <div className="h-1.5 w-1.5 bg-white rounded-full absolute" />
                        </div>
                        <span className="font-bold tracking-tight">Nexus</span>
                    </Link>
                </div>

                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {children}
                </div>
            </div>
        </div>
    );
}
