// client/features/billing/components/PaymentSuccessModal.tsx
"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight, X } from "lucide-react";
import { Plan } from "../types";

interface PaymentSuccessModalProps {
    plan: Plan;
    isOpen: boolean;
    onClose: () => void;
}

export function PaymentSuccessModal({ plan, isOpen, onClose }: PaymentSuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/10 p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Celebration Header */}
                <div className="text-center space-y-3">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                        <Sparkles className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Payment Confirmed
                        </span>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                            Welcome to {plan.name}!
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Your workspace has been successfully upgraded. All new limits and features are now active.
                        </p>
                    </div>
                </div>

                {/* Plan Highlights */}
                <div className="rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5 p-4 space-y-2.5 text-xs">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                        Unlocked on your workspace:
                    </p>
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{plan.limits.max_projects === null ? "Unlimited Projects" : `Up to ${plan.limits.max_projects} Projects`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{plan.limits.max_members === null ? "Unlimited Members" : `Up to ${plan.limits.max_members} Team Members`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{plan.limits.max_storage_mb ? `${(plan.limits.max_storage_mb / 1024).toFixed(0)} GB File Storage` : "Unlimited Storage"}</span>
                    </div>
                    {plan.features.has_advanced_analytics && (
                        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>Advanced Analytics & Activity Auditing</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 shadow-sm hover:shadow-blue-500/20 transition-all text-center"
                    >
                        <span>Go to Dashboard</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}
