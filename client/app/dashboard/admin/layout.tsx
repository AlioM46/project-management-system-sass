"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useWorkspace } from "@/features/workspaces/components/WorkspaceProvider";
import { useTranslation } from "@/lib/context/LanguageContext";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isOwnerOrAdmin, currentWorkspace } = useWorkspace();
    const { t } = useTranslation();
    const router = useRouter();

    // Optionally redirect after a brief delay, or let them click the button
    useEffect(() => {
        if (currentWorkspace && !isOwnerOrAdmin) {
            const timer = setTimeout(() => {
                router.push("/dashboard");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentWorkspace, isOwnerOrAdmin, router]);

    if (!isOwnerOrAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-6 shadow-sm animate-bounce">
                    <ShieldAlert className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-950 dark:text-white mb-2">
                    {t("admin_unauthorized_title")}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
                    {t("admin_unauthorized_desc")}
                </p>
                <Button 
                    onClick={() => router.push("/dashboard")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 font-medium px-6 py-2 rounded-xl transition-all"
                >
                    {t("admin_unauthorized_back")}
                </Button>
            </div>
        );
    }

    return <>{children}</>;
}
