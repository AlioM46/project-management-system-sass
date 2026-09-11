// client/features/workspaces/components/WorkspaceSwitcher.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "./WorkspaceProvider";
import { Workspace } from "../types";
import { Building, ChevronsUpDown, Check, Plus, ShieldCheck, User, Crown, Sparkles } from "lucide-react";

function getRoleBadge(workspace: Workspace) {
    const roleSlug = workspace.role?.slug?.toLowerCase() || workspace.role?.name?.toLowerCase();
    if (roleSlug === "owner") {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Crown className="h-2.5 w-2.5" />
                <span>Owner</span>
            </span>
        );
    }
    if (roleSlug === "admin") {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-2.5 w-2.5" />
                <span>Admin</span>
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <User className="h-2.5 w-2.5" />
            <span>Member</span>
        </span>
    );
}

export function WorkspaceSwitcher() {
    const { workspaces, currentWorkspace, switchWorkspace, setIsCreateModalOpen } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);

    const toggleOpen = () => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 6,
                left: rect.left,
                width: Math.max(rect.width, 240),
            });
        }
        setIsOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e: MouseEvent) => {
            if (triggerRef.current?.contains(e.target as Node)) return;
            const menuElement = document.getElementById("workspace-switcher-menu");
            if (menuElement?.contains(e.target as Node)) return;
            setIsOpen(false);
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const roleSlug = currentWorkspace?.role?.slug?.toLowerCase() || currentWorkspace?.role?.name?.toLowerCase();
    const activeRoleText = currentWorkspace?.role?.name || "Workspace";
    const isSubscribed = Boolean(currentWorkspace?.is_subscribed);

    return (
        <>
            <button
                ref={triggerRef}
                onClick={toggleOpen}
                type="button"
                className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left border-0 bg-transparent"
                aria-haspopup="menu"
                aria-expanded={isOpen}
            >
                <div className="relative">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm text-white font-bold text-xs uppercase">
                        {currentWorkspace?.name ? currentWorkspace.name.charAt(0) : <Building className="h-4 w-4 text-white" />}
                    </div>
                    {isSubscribed && (
                        <div
                            title="Active Paid Subscription"
                            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-xs ring-2 ring-white dark:ring-[#050505]"
                        >
                            <Sparkles className="h-2.5 w-2.5 fill-white" />
                        </div>
                    )}
                </div>

                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                            {currentWorkspace?.name || "My Workspace"}
                        </span>
                        {isSubscribed && (
                            <span
                                title="Paid Plan Active"
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-extrabold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0"
                            >
                                <Sparkles className="h-2 w-2" />
                                <span>{currentWorkspace?.plan_name || "Pro"}</span>
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1">
                        {roleSlug === "owner" ? (
                            <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                        ) : roleSlug === "admin" ? (
                            <ShieldCheck className="h-3 w-3 text-blue-500 shrink-0" />
                        ) : (
                            <User className="h-3 w-3 text-zinc-400 shrink-0" />
                        )}
                        <span>{activeRoleText}</span>
                    </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </button>

            {isOpen && menuPosition && (
                <div
                    id="workspace-switcher-menu"
                    style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px`, width: `${menuPosition.width}px` }}
                    className="fixed z-[9999] bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                >
                    <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        <span>Workspaces</span>
                        <span>{workspaces.length}</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                        {workspaces.map((w) => {
                            const isActive = currentWorkspace && String(currentWorkspace.id) === String(w.id);
                            return (
                                <button
                                    key={String(w.id)}
                                    type="button"
                                    onClick={() => {
                                        void switchWorkspace(w.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left group ${
                                        isActive
                                            ? "bg-blue-50/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                        <div className="relative shrink-0">
                                            <div className="h-6 w-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                                                {w.name.charAt(0)}
                                            </div>
                                            {w.is_subscribed && (
                                                <div
                                                    title="Active Subscription"
                                                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 text-white flex items-center justify-center ring-1 ring-white dark:ring-[#0c0c0e]"
                                                >
                                                    <Sparkles className="h-2 w-2 fill-white" />
                                                </div>
                                            )}
                                        </div>

                                        <span className="truncate flex-1">{w.name}</span>
                                        {w.is_subscribed && (
                                            <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 flex items-center gap-0.5 shrink-0">
                                                <Sparkles className="h-2.5 w-2.5" />
                                            </span>
                                        )}
                                        {getRoleBadge(w)}
                                    </div>
                                    {isActive && <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />}
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-1.5 mt-1 border-t border-zinc-200 dark:border-zinc-800/80 px-1">
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                setIsCreateModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors text-left cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create New Workspace</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
