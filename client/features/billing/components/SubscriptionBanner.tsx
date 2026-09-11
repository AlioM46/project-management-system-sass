// client/features/billing/components/SubscriptionBanner.tsx
"use client";

import React, { useState } from "react";
import { CreditCard, ExternalLink, AlertTriangle, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionSummary } from "../types";
import { getCustomerPortalUrl } from "../api/billing.api";

interface SubscriptionBannerProps {
    summary: SubscriptionSummary;
    onResumeSubscription?: () => Promise<void>;
}

export function SubscriptionBanner({ summary, onResumeSubscription }: SubscriptionBannerProps) {
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [resuming, setResuming] = useState(false);
    const { plan, subscription } = summary;

    const handleOpenPortal = async () => {
        try {
            setLoadingPortal(true);
            const { portal_url } = await getCustomerPortalUrl();
            if (portal_url) {
                window.location.href = portal_url;
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to open billing portal";
            toast.error(msg);
        } finally {
            setLoadingPortal(false);
        }
    };

    const handleResume = async () => {
        if (!onResumeSubscription) return;
        try {
            setResuming(true);
            await onResumeSubscription();
        } finally {
            setResuming(false);
        }
    };

    const isPastDue = subscription?.status === "past_due";
    const isCanceled = subscription?.is_canceled;
    const renewalDate = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : null;

    return (
        <div className="bg-white dark:bg-[#0e0e0e] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        {plan.name} Plan
                    </h3>
                    {isPastDue ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Payment Past Due
                        </span>
                    ) : isCanceled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Canceling on {renewalDate}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                        </span>
                    )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                    {isCanceled
                        ? `Your subscription is scheduled to end on ${renewalDate}. You will keep paid features until then, and then downgrade to Free.`
                        : renewalDate
                        ? `Your subscription renews automatically on ${renewalDate} (${subscription?.billing_interval} billing).`
                        : "You are on the Free tier. Upgrade anytime to unlock higher team limits and advanced analytics."}
                </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                {isCanceled && onResumeSubscription && (
                    <button
                        onClick={handleResume}
                        disabled={resuming}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {resuming ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RotateCcw className="h-4 w-4" />
                        )}
                        <span>{resuming ? "Resuming..." : "Resume Subscription"}</span>
                    </button>
                )}

                {summary.is_paid_plan && (
                    <button
                        onClick={handleOpenPortal}
                        disabled={loadingPortal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-white/10 shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                    >
                        <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        <span>{loadingPortal ? "Opening Portal..." : "Manage Billing & Invoices"}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                    </button>
                )}
            </div>
        </div>
    );
}
