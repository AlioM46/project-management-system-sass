// client/app/dashboard/settings/billing/page.tsx
import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { BillingOverview } from "@/features/billing/components/BillingOverview";

export const metadata = {
    title: "Billing & Plans | Workspace Settings",
    description: "Manage your subscription, upgrade your plan, and track resource usage limits.",
};

export default function BillingSettingsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[360px] p-12 text-zinc-500 space-y-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <p className="text-sm">Loading billing details...</p>
                </div>
            }
        >
            <BillingOverview />
        </Suspense>
    );
}
