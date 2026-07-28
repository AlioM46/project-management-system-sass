"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectAuditLogsSettingsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/dashboard/audit-logs");
    }, [router]);

    return (
        <div className="p-8 text-center text-xs text-zinc-500">
            Redirecting to Audit Logs...
        </div>
    );
}
