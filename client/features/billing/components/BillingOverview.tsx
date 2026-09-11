// client/features/billing/components/BillingOverview.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Plan, SubscriptionSummary, BillingInterval } from "../types";
import { getPlans, getSubscription, createCheckoutSession, confirmCheckoutSession, cancelSubscription, resumeSubscription } from "../api/billing.api";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { UsageMeters } from "./UsageMeters";
import { PricingCards } from "./PricingCards";
import { PaymentSuccessModal } from "./PaymentSuccessModal";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";

export function BillingOverview() {
    const searchParams = useSearchParams();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingPlanSlug, setLoadingPlanSlug] = useState<string | null>(null);
    const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
    const [successModalPlan, setSuccessModalPlan] = useState<Plan | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [plansData, summaryData] = await Promise.all([
                getPlans(),
                getSubscription(),
            ]);
            setPlans(plansData);
            setSummary(summaryData);

            if (summaryData.subscription?.billing_interval) {
                setBillingInterval(summaryData.subscription.billing_interval);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to load billing details";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isCancelled = false;

        const init = async () => {
            try {
                const sessionId = searchParams.get("session_id");
                const isSuccess = searchParams.get("success") === "true";

                // If returning from Stripe with a session_id, confirm payment immediately!
                if (sessionId && isSuccess) {
                    try {
                        const confirmedSummary = await confirmCheckoutSession(sessionId);
                        if (!isCancelled) {
                            setSummary(confirmedSummary);
                            setSuccessModalPlan(confirmedSummary.plan);
                            toast.success(`Successfully upgraded to ${confirmedSummary.plan.name}!`);
                        }
                    } catch {
                        // If confirm fails (or was already processed), fallback to standard load
                    }
                }

                const [plansData, summaryData] = await Promise.all([
                    getPlans(),
                    getSubscription(),
                ]);

                if (!isCancelled) {
                    setPlans(plansData);
                    setSummary(summaryData);
                    if (summaryData.subscription?.billing_interval) {
                        setBillingInterval(summaryData.subscription.billing_interval);
                    }
                    if (isSuccess && summaryData.is_paid_plan) {
                        setSuccessModalPlan(summaryData.plan);
                    }
                }

                if (isSuccess) {
                    window.history.replaceState({}, "", window.location.pathname);
                }
            } catch (err: unknown) {
                if (!isCancelled) {
                    const msg = err instanceof Error ? err.message : "Failed to load billing details";
                    toast.error(msg);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            isCancelled = true;
        };
    }, [searchParams]);

    // Check for canceled query param
    useEffect(() => {
        if (searchParams.get("canceled") === "true") {
            toast.info("Checkout process was canceled.");
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [searchParams]);

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.slug === summary?.plan.slug) return;

        try {
            setLoadingPlanSlug(plan.slug);
            const { checkout_url } = await createCheckoutSession(plan.slug, billingInterval);
            if (checkout_url) {
                window.location.href = checkout_url;
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to initiate checkout session";
            toast.error(msg);
            setLoadingPlanSlug(null);
        }
    };

    const handleConfirmCancel = async () => {
        try {
            const updated = await cancelSubscription(false);
            setSummary(updated);
            toast.success("Subscription scheduled to cancel at the end of the billing period.");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to cancel subscription";
            toast.error(msg);
            throw err;
        }
    };

    const handleResumeSubscription = async () => {
        try {
            const updated = await resumeSubscription();
            setSummary(updated);
            toast.success("Subscription resumed successfully!");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to resume subscription";
            toast.error(msg);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[360px] p-12 text-zinc-500 dark:text-zinc-400 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <p className="text-sm">Loading billing details...</p>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="text-center p-12 space-y-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Failed to load workspace subscription.
                </p>
                <button
                    onClick={loadData}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry</span>
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Active Subscription Banner */}
            <SubscriptionBanner
                summary={summary}
                onResumeSubscription={handleResumeSubscription}
            />

            {/* Live Resource Usage Meters */}
            <UsageMeters usage={summary.usage} />

            {/* Pricing Cards Comparison & Upgrade Flow */}
            <PricingCards
                plans={plans}
                currentPlanSlug={summary.plan.slug}
                billingInterval={billingInterval}
                onIntervalChange={setBillingInterval}
                onSelectPlan={handleSelectPlan}
                loadingPlanSlug={loadingPlanSlug}
                isPaidPlan={summary.is_paid_plan}
                isCanceled={summary.subscription?.is_canceled}
                onDowngradeToFree={() => setShowCancelModal(true)}
            />

            {/* Downgrade / Cancel Confirmation Modal */}
            <CancelSubscriptionModal
                summary={summary}
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirmCancel={handleConfirmCancel}
            />

            {/* Payment Celebration Modal */}
            {successModalPlan && (
                <PaymentSuccessModal
                    plan={successModalPlan}
                    isOpen={!!successModalPlan}
                    onClose={() => setSuccessModalPlan(null)}
                />
            )}
        </div>
    );
}
