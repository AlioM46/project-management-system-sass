// client/features/billing/api/billing.api.ts

import { apiClient } from "@/shared/api/apiClient";
import { Plan, SubscriptionSummary, BillingInterval } from "../types";

/**
 * Fetches all available public subscription plans.
 */
export async function getPlans(): Promise<Plan[]> {
    const response = await apiClient.get<{ plans: Plan[] }>("/billing/plans", {
        workspace: false,
    });
    return response.plans;
}

/**
 * Fetches active plan, subscription state, and live usage metrics for the active workspace.
 */
export async function getSubscription(): Promise<SubscriptionSummary> {
    return await apiClient.get<SubscriptionSummary>("/billing/subscription");
}

/**
 * Creates a Stripe Checkout session and returns the hosted Stripe payment URL.
 */
export async function createCheckoutSession(
    planSlug: string,
    billingInterval: BillingInterval = "monthly"
): Promise<{ checkout_url: string; plan_slug: string; billing_interval: string }> {
    return await apiClient.post<{ checkout_url: string; plan_slug: string; billing_interval: string }>(
        "/billing/checkout",
        {
            plan_slug: planSlug,
            billing_interval: billingInterval,
        }
    );
}

/**
 * Generates a Stripe Customer Portal session URL for managing cards, invoices, and canceling.
 */
export async function getCustomerPortalUrl(): Promise<{ portal_url: string }> {
    return await apiClient.get<{ portal_url: string }>("/billing/portal");
}

/**
 * Manually assigns a plan (Owner/Admin direct upgrade/downgrade).
 */
export async function assignPlan(
    planSlug: string,
    billingInterval: BillingInterval = "monthly"
): Promise<SubscriptionSummary> {
    return await apiClient.post<SubscriptionSummary>("/billing/subscription/assign", {
        plan_slug: planSlug,
        billing_interval: billingInterval,
    });
}

/**
 * Confirms a completed Stripe checkout session upon redirect return.
 */
export async function confirmCheckoutSession(sessionId: string): Promise<SubscriptionSummary> {
    return await apiClient.post<SubscriptionSummary>("/billing/checkout/confirm", {
        session_id: sessionId,
    });
}

/**
 * Cancels the active subscription at period end (or immediately).
 */
export async function cancelSubscription(immediately: boolean = false): Promise<SubscriptionSummary> {
    return await apiClient.post<SubscriptionSummary>("/billing/subscription/cancel", {
        immediately,
    });
}

/**
 * Resumes a canceled subscription before the period ends.
 */
export async function resumeSubscription(): Promise<SubscriptionSummary> {
    return await apiClient.post<SubscriptionSummary>("/billing/subscription/resume");
}

