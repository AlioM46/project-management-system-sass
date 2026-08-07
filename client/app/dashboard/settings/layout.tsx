"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Sliders, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
    {
        name: "Profile",
        href: "/dashboard/settings/profile",
        icon: User,
        exact: false,
    },
    {
        name: "General",
        href: "/dashboard/settings",
        icon: Sliders,
        exact: true,
    },
    {
        name: "Roles & Permissions",
        href: "/dashboard/settings/roles-permissions",
        icon: ShieldCheck,
        exact: false,
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex-1 space-y-6 p-6 sm:p-8 max-w-7xl mx-auto w-full pb-12">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    Workspace Settings
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Manage workspace preferences, access control, security, and activity history.
                </p>
            </div>

            {/* Layout with Sub-Navigation Side Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                {/* Sub-Navigation Side Panel (Desktop) / Horizontal Tabs (Mobile) */}
                <aside className="md:col-span-1">
                    <nav className="flex md:flex-col gap-1.5 p-1 bg-zinc-100/80 dark:bg-white/5 md:bg-transparent md:dark:bg-transparent rounded-2xl overflow-x-auto">
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.exact
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
                                        isActive
                                            ? "bg-white dark:bg-[#0a0a0a] text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/80 dark:border-white/10"
                                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Sub-Page Content */}
                <div className="md:col-span-3 min-w-0">
                    {children}
                </div>
            </div>
        </div>
    );
}
