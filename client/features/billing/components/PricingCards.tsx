// client/features/billing/components/PricingCards.tsx
"use client";

import React from "react";
import { Plan, BillingInterval } from "../types";
import { PricingCardItem } from "./PricingCardItem";

interface PricingCardsProps {
    plans: Plan[];
    currentPlanSlug: string;
    billingInterval: BillingInterval;
    onIntervalChange: (interval: BillingInterval) => void;
    onSelectPlan: (plan: Plan) => void;
    loadingPlanSlug: string | null;
    isPaidPlan?: boolean;
    isCanceled?: boolean;
    onDowngradeToFree?: () => void;
}

export function PricingCards({
    plans,
    currentPlanSlug,
    billingInterval,
    onIntervalChange,
    onSelectPlan,
    loadingPlanSlug,
    isPaidPlan = false,
    isCanceled = false,
    onDowngradeToFree,
}: PricingCardsProps) {
    const isYearly = billingInterval === "yearly";

    return (
        <div className="space-y-6">
            {/* Monthly / Yearly Toggle & Section Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                        Available Plans
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Upgrade or switch your workspace plan at any time.
                    </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 shadow-inner">
                    <button
                        onClick={() => onIntervalChange("monthly")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            !isYearly
                                ? "bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => onIntervalChange("yearly")}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isYearly
                                ? "bg-white dark:bg-[#18181b] text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                        }`}
                    >
                        <span>Yearly</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Save 17%
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {plans.map((plan) => (
                    <PricingCardItem
                        key={plan.id}
                        plan={plan}
                        isCurrent={plan.slug === currentPlanSlug}
                        billingInterval={billingInterval}
                        onSelectPlan={onSelectPlan}
                        isLoading={loadingPlanSlug === plan.slug}
                        isPaidPlan={isPaidPlan}
                        isCanceled={isCanceled}
                        onDowngradeToFree={onDowngradeToFree}
                    />
                ))}
            </div>
        </div>
    );
}
