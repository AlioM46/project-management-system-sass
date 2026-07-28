"use client";

import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, Search } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getMe } from "@/features/auth/api/auth.api";
import { User } from "@/features/auth/types";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export function DashboardNavbar() {
  const { currentUser, isLoading } = useCurrentUser();
  const avatarUrl = currentUser?.avatar_url || currentUser?.avatar;



  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#050505] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 transition-colors duration-300">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-zinc-700 dark:text-zinc-300 md:hidden hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-zinc-200 dark:bg-white/10 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-zinc-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-0 sm:text-sm bg-transparent outline-none"
            placeholder="Search projects, tasks, or members..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <NotificationCenter />

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-zinc-200 dark:lg:bg-white/10"
            aria-hidden="true"
          />

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* User Profile / Logout Mock */}
            <div className="hidden sm:block">
              <LogoutButton />
            </div>

            <UserAvatar name={currentUser?.name} avatarUrl={avatarUrl} size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
}
