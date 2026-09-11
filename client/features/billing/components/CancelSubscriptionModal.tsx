// client/features/billing/components/CancelSubscriptionModal.tsx
"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, X, ShieldAlert } from "lucide-react";
import { SubscriptionSummary } from "../types";

interface CancelSubscriptionModalProps {
    summary: SubscriptionSummary;
    isOpen: boolean;
    onClose: () => void;
    onConfirmCancel: () => Promise<void>;
}

export function CancelSubscriptionModal({
    summary,
    isOpen,
    onClose,
    onConfirmCancel,
}: CancelSubscriptionModalProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const renewalDate = summary.subscription?.current_period_end
        ? new Date(summary.subscription.current_period_end).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : "the end of your billing cycle";

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await onConfirmCancel();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/10 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Warning Icon & Title */}
                <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                            Downgrade to Free Plan?
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Your recurring billing will stop immediately.
                        </p>
                    </div>
                </div>

                {/* Grace Period & Limit Impact Notice */}
                <div className="rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/5 p-4 space-y-3 text-xs">
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        You will retain all <strong className="text-zinc-900 dark:text-white">{summary.plan.name}</strong> features until <strong className="text-zinc-900 dark:text-white">{renewalDate}</strong>.
                    </p>

                    <div className="pt-2 border-t border-zinc-200/60 dark:border-white/5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>Project limit will drop to 3 projects</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>Team member limit will drop to 5 members</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>File storage will decrease to 500 MB</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Canceling...</span>
                            </>
                        ) : (
                            <span>Confirm Downgrade</span>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer disabled:opacity-50"
                    >
                        Keep My Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
