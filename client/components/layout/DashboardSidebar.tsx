"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban, 
  Users, 
  ScrollText,
  Settings, 
  Hexagon,
  ChevronsUpDown,
  Building,
  MessageCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { getCookie } from "@/shared/utils/cookies";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    // Read workspace ID from cookie to display something
    const id = getCookie("workspace_id");
    if (id) setWorkspaceId(id);
  }, []);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Chat", href: "/dashboard/chat", icon: MessageCircle },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Audit Logs", href: "/dashboard/audit-logs", icon: ScrollText },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#050505] border-r border-zinc-200 dark:border-white/10 hidden md:flex flex-col">
      {/* Workspace Switcher Header */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer transition-colors group">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
             <Building className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
              {workspaceId ? `Workspace #${workspaceId}` : "My Workspace"}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Free Plan</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 px-3">
          Overview
        </div>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <div className="p-3 border-t border-zinc-200 dark:border-white/10 shrink-0">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            pathname.startsWith("/dashboard/settings")
              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
