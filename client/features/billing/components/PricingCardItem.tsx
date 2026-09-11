// client/features/billing/components/PricingCardItem.tsx
"use client";

import React from "react";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { Plan, BillingInterval } from "../types";

interface PricingCardItemProps {
    plan: Plan;
    isCurrent: boolean;
    billingInterval: BillingInterval;
    onSelectPlan: (plan: Plan) => void;
    isLoading: boolean;
    isPaidPlan?: boolean;
    isCanceled?: boolean;
    onDowngradeToFree?: () => void;
}

function formatStorage(mb: number | null): string {
    if (mb === null) return "Unlimited file storage";
    if (mb >= 1024) {
        const gb = mb / 1024;
        return `${Number(gb.toFixed(1))} GB (${mb.toLocaleString()} MB) storage`;
    }
    return `${mb.toLocaleString()} MB file storage`;
}

export function PricingCardItem({
    plan,
    isCurrent,
    billingInterval,
    onSelectPlan,
    isLoading,
    isPaidPlan = false,
    isCanceled = false,
    onDowngradeToFree,
}: PricingCardItemProps) {
    const isYearly = billingInterval === "yearly";
    const isPro = plan.slug === "pro";
    const isEnterprise = plan.slug === "enterprise";

    const price = isYearly ? plan.pricing.yearly : plan.pricing.monthly;
    const displayPrice = plan.is_free
        ? "$0"
        : isYearly
        ? `$${(price.amount_cents / 1200).toFixed(2)}`
        : price.amount_formatted;

    return (
        <div
            className={`flex flex-col justify-between rounded-2xl p-6 transition-all duration-200 relative ${
                isPro
                    ? "bg-white dark:bg-[#0f0f11] border-2 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20"
                    : isEnterprise
                    ? "bg-white dark:bg-[#0c0c0e] border border-indigo-200 dark:border-indigo-500/30 shadow-md"
                    : "bg-white dark:bg-[#0e0e10] border border-zinc-200 dark:border-white/10 shadow-sm"
            }`}
        >
            {isPro && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Most Popular</span>
                </div>
            )}

            <div className="space-y-5">
                {/* Header */}
                <div>
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
                            {plan.name}
                        </h4>
                        {isCurrent && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                Current Plan
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 min-h-[36px] leading-relaxed">
                        {plan.description}
                    </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                        {displayPrice}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {plan.is_free ? "forever" : isYearly ? "/ mo (billed annually)" : "/ month"}
                    </span>
                </div>

                {/* Plan Limits & Features */}
                <div className="pt-4 border-t border-zinc-100 dark:border-white/5 space-y-2.5 text-xs">
                    <FeatureItem
                        text={
                            plan.limits.max_members === null
                                ? "Unlimited team members"
                                : `Up to ${plan.limits.max_members} team members`
                        }
                    />
                    <FeatureItem
                        text={
                            plan.limits.max_projects === null
                                ? "Unlimited projects"
                                : `Up to ${plan.limits.max_projects} projects`
                        }
                    />
                    <FeatureItem
                        text={
                            plan.limits.max_tasks_per_project === null
                                ? "Unlimited tasks per project"
                                : `Up to ${plan.limits.max_tasks_per_project} tasks per project`
                        }
                    />
                    <FeatureItem text={formatStorage(plan.limits.max_storage_mb)} />
                    <FeatureItem
                        text={
                            plan.limits.max_file_size_mb === null
                                ? "Unlimited file upload size"
                                : `${plan.limits.max_file_size_mb} MB max upload per file`
                        }
                    />
                    <FeatureItem
                        text={
                            plan.limits.max_custom_roles === null
                                ? "Unlimited custom roles"
                                : plan.limits.max_custom_roles === 0
                                ? "Standard built-in roles"
                                : `Up to ${plan.limits.max_custom_roles} custom roles`
                        }
                    />
                    <FeatureItem text="Activity audit logs" enabled={plan.features.has_audit_logs} />
                    <FeatureItem text="Advanced analytics & charts" enabled={plan.features.has_advanced_analytics} />
                    <FeatureItem text="Data export (CSV / Excel)" enabled={plan.features.has_data_export} />
                    <FeatureItem
                        text="Priority dedicated support"
                        enabled={plan.features.has_priority_support}
                    />
                </div>
            </div>

            {/* CTA Button */}
            <div className="pt-6 mt-6 border-t border-zinc-100 dark:border-white/5">
                {isCurrent ? (
                    <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 border border-zinc-200/60 dark:border-white/5 cursor-default"
                    >
                        Active Plan
                    </button>
                ) : plan.is_free && isPaidPlan ? (
                    <button
                        onClick={onDowngradeToFree}
                        disabled={isCanceled || isLoading}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                            isCanceled
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-default"
                                : "bg-zinc-100 hover:bg-rose-50 text-zinc-700 hover:text-rose-600 dark:bg-white/5 dark:hover:bg-rose-500/10 dark:text-zinc-300 dark:hover:text-rose-400 border border-zinc-200/80 dark:border-white/10 hover:border-rose-200 dark:hover:border-rose-500/20 cursor-pointer"
                        }`}
                    >
                        {isCanceled ? "Canceling at period end" : "Downgrade to Free"}
                    </button>
                ) : (
                    <button
                        onClick={() => onSelectPlan(plan)}
                        disabled={isLoading}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default ${
                            isPro
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-blue-500/20"
                                : "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            `Upgrade to ${plan.name}`
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}

function FeatureItem({ text, enabled = true }: { text: string; enabled?: boolean }) {
    return (
        <div
            className={`flex items-center gap-2.5 ${
                enabled ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600 line-through"
            }`}
        >
            <div
                className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                    enabled
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-600"
                }`}
            >
                {enabled ? (
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                ) : (
                    <X className="h-2.5 w-2.5 stroke-[2.5]" />
                )}
            </div>
            <span className="truncate">{text}</span>
        </div>
    );
}
