// client/features/billing/types/index.ts

export interface PlanPricing {
    amount_cents: number;
    amount_formatted: string;
}

export interface PlanLimits {
    max_members: number | null;
    max_projects: number | null;
    max_tasks_per_project: number | null;
    max_storage_mb: number | null;
    max_file_size_mb: number | null;
    max_custom_roles: number | null;
}

export interface PlanFeatures {
    has_audit_logs: boolean;
    has_advanced_analytics: boolean;
    has_data_export: boolean;
    has_priority_support: boolean;
}

export interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    pricing: {
        monthly: PlanPricing;
        yearly: PlanPricing;
    };
    limits: PlanLimits;
    features: PlanFeatures;
    is_free: boolean;
    sort_order: number;
}

export interface SubscriptionLifecycle {
    id: number;
    status: "active" | "past_due" | "canceled" | "trialing";
    billing_interval: "monthly" | "yearly";
    current_period_end: string | null;
    canceled_at: string | null;
    is_active: boolean;
    is_canceled: boolean;
}

export interface UsageMetric {
    current: number;
    max: number | null;
    percentage: number | null;
    current_bytes?: number;
    current_formatted?: string;
}

export interface UsageSummary {
    members: UsageMetric;
    projects: UsageMetric;
    custom_roles: UsageMetric;
    storage_mb: UsageMetric;
    features: PlanFeatures;
}

export interface SubscriptionSummary {
    plan: Plan;
    subscription: SubscriptionLifecycle | null;
    is_paid_plan: boolean;
    usage: UsageSummary;
}

export type BillingInterval = "monthly" | "yearly";
