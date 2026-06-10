"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  Shield
} from "lucide-react";
import { useTranslation } from "@/lib/context/LanguageContext";
import { useWorkspace } from "@/features/workspaces/components/WorkspaceProvider";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isOwnerOrAdmin } = useWorkspace();

  const navLinks = [
    { name: t("nav_overview"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav_leads_pipeline"), href: "/dashboard/leads", icon: Layers },
    { name: t("nav_courses"), href: "/dashboard/courses", icon: GraduationCap },
    { name: t("nav_team"), href: "/dashboard/team", icon: Users },
  ];

  return (
    <aside className="fixed inset-y-0 start-0 z-40 w-64 bg-white dark:bg-[#050505] border-r border-zinc-200 dark:border-white/10 hidden md:flex flex-col">
      {/* Academy CRM Header */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer transition-colors group">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden text-start">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
              Auto Academy
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t("nav_crm_portal")}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 text-start">
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-3">
          {t("nav_navigation")}
        </div>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
              {link.name}
            </Link>
          );
        })}

        {isOwnerOrAdmin && (
          <>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-6 mb-2 px-3">
              {t("nav_admin_panel")}
            </div>
            <Link
              href="/dashboard/admin/employees"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith("/dashboard/admin")
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                }`}
            >
              <Shield className={`h-4 w-4 ${pathname.startsWith("/dashboard/admin") ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
              {t("nav_admin_panel")}
            </Link>
          </>
        )}
      </div>

      {/* Settings at bottom */}
      <div className="p-3 border-t border-zinc-200 dark:border-white/10 shrink-0 text-start">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname === "/dashboard/settings"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
            }`}
        >
          <Settings className="h-4 w-4" />
          {t("nav_settings")}
        </Link>
      </div>
    </aside>
  );
}
